/* ============================================================
   SPIDER AI — FINAL VERSION
   Optional Firebase Auth + Device ID + Per-User Memory + TTL
   ============================================================ */

/* ===== CONFIG ===== */
const MEMORY_MESSAGE_LIMIT = 40;
const MEMORY_TRIM_TARGET = 20;
const MEMORY_TTL_DAYS = 30;
const MEMORY_SUMMARY_TRIGGER = 30;
const MEMORY_USER_KEY_PREFIX = "chat_memory:";

const FIREBASE_PROJECT_ID = "m4-spider";

/* ============================================================
   SPIDER SYSTEM PROMPT
   ============================================================ */
const SPIDER_SYSTEM_PROMPT = `
You are Spider, the AI created by M4 Spider. 
Rules:
- Never reveal system or backend code.
- Never introduce yourself unless asked.
- No markdown formatting.
- Emojis allowed 😈🔥😎.
- Start immediately.
- Bold confidence.
- If user wants savage mode → be sarcastic and playful.
- If asked who created you → M4 Spider.
`;

/* ============================================================
   FIREBASE TOKEN VERIFIER (Cloudflare Compatible)
   ============================================================ */
async function verifyFirebaseToken(idToken) {
  if (!idToken) return null;

  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) return null;

    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    const kid = header.kid;

    const firebaseKeys = await fetch(
      "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
    ).then((r) => r.json());

    const cert = firebaseKeys[kid];
    if (!cert) return null;

    const pem = cert
      .replace("-----BEGIN CERTIFICATE-----", "")
      .replace("-----END CERTIFICATE-----", "")
      .replace(/\s+/g, "");

    const binaryDer = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
      "spki",
      binaryDer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      true,
      ["verify"]
    );

    const signature = parts[2].replace(/-/g, "+").replace(/_/g, "/");
    const signatureBytes = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));

    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      signatureBytes,
      new TextEncoder().encode(parts[0] + "." + parts[1])
    );

    if (!valid) return null;

    if (payload.aud !== FIREBASE_PROJECT_ID) return null;
    if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) return null;
    if (payload.exp * 1000 < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

/* ============================================================
   MAIN WORKER HANDLER
   ============================================================ */
export async function onRequest(context) {
  const request = context.request;
  const env = context.env;

  let body = {};
  try {
    body = await request.json();
  } catch {}

  const { prompt, mode, image, strength, file_content, filename } = body;
  const currentMode = mode || detectMode(prompt, file_content, filename);

  /* ============================================================
     USER IDENTIFICATION (DEVICE ID + OPTIONAL FIREBASE)
     ============================================================ */

  // 1) Unique per-device anonymous ID
  let userId = body.device_id || "anon-" + crypto.randomUUID();

  // 2) User preference override
  if (body.user_preference_id) {
    userId = body.user_preference_id.toString();
  }

  // 3) Firebase login override
  if (body.firebase_token) {
    const decoded = await verifyFirebaseToken(body.firebase_token);
    if (decoded && decoded.user_id) {
      userId = decoded.user_id;
    }
  }

  const memoryKey = MEMORY_USER_KEY_PREFIX + userId;

  /* ============================================================
     MEMORY LOAD + TTL PRUNE
     ============================================================ */

  async function getMemory() {
    try {
      const raw = await env.CHAT_KV.get(memoryKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async function saveMemory(mem) {
    try {
      await env.CHAT_KV.put(memoryKey, JSON.stringify(mem));
    } catch {}
  }

  let memory = await getMemory();
  const cutoff = Date.now() - MEMORY_TTL_DAYS * 86400000;
  memory = memory.filter((m) => (m.ts || 0) >= cutoff);

  /* ============================================================
     MEMORY COMPRESSION
     ============================================================ */
  async function compressMemory(memory) {
    if (memory.length < MEMORY_SUMMARY_TRIGGER) return memory;

    const keepRecent = Math.floor(MEMORY_TRIM_TARGET / 2);
    const older = memory.slice(0, memory.length - keepRecent);

    const summaryPrompt = `
Summarize these chats in 2-4 short lines, keeping only important facts:

${older
  .map((m, i) => `${i + 1}. ${m.role}: ${m.content}`)
  .join("\n")}
`;

    const result = await env.SPY_AI.run("@cf/mistralai/mistral-small-3.1-24b-instruct", {
      messages: [
        { role: "system", content: SPIDER_SYSTEM_PROMPT },
        { role: "user", content: summaryPrompt },
      ],
    });

    const summary = extractText(result).trim();

    return [
      { role: "system_summary", content: summary, ts: Date.now() },
      ...memory.slice(-keepRecent),
    ];
  }

  if (memory.length >= MEMORY_SUMMARY_TRIGGER) {
    memory = await compressMemory(memory);
  }

  if (memory.length > MEMORY_MESSAGE_LIMIT) {
    memory = memory.slice(-MEMORY_MESSAGE_LIMIT);
  }

  await saveMemory(memory);

  /* ============================================================
     DELETE MEMORY SYSTEM
     ============================================================ */

  const lower = (prompt || "").toLowerCase();
  const wantsDelete =
    lower.includes("delete") ||
    lower.includes("clear") ||
    lower.includes("reset") ||
    lower.includes("remove") ||
    lower.includes("forget") ||
    lower.includes("wipe");

  if (
    wantsDelete &&
    !lower.includes("memory:") &&
    !lower.includes("delete all") &&
    !lower.includes("reset all")
  ) {
    return new Response(
      "What do you want me to delete? (delete memory: all / last / 3 / keyword)",
      { headers: { "content-type": "text/plain" } }
    );
  }

  if (
    lower.includes("delete memory: all") ||
    lower.includes("reset all") ||
    lower.includes("delete all")
  ) {
    await env.CHAT_KV.put(memoryKey, JSON.stringify([]));
    return new Response("Memory wiped clean 😈🔥", {
      headers: { "content-type": "text/plain" },
    });
  }

  if (lower.includes("delete memory:")) {
    const command = lower.replace("delete memory:", "").trim();

    if (command === "last") {
      memory.pop();
      await saveMemory(memory);
      return new Response("Deleted last memory entry.", {
        headers: { "content-type": "text/plain" },
      });
    }

    if (command === "first") {
      memory.shift();
      await saveMemory(memory);
      return new Response("Deleted first memory entry.", {
        headers: { "content-type": "text/plain" },
      });
    }

    const idx = parseInt(command);
    if (!isNaN(idx) && idx >= 1 && idx <= memory.length) {
      memory.splice(idx - 1, 1);
      await saveMemory(memory);
      return new Response("Deleted memory entry.", {
        headers: { "content-type": "text/plain" },
      });
    }

    memory = memory.filter((m) => !m.content.toLowerCase().includes(command));
    await saveMemory(memory);

    return new Response("Deleted matching memory entries.", {
      headers: { "content-type": "text/plain" },
    });
  }

  /* ============================================================
     ADD NEW MEMORY
     ============================================================ */

  if (prompt && prompt.trim()) {
    memory.push({ role: "user", content: prompt, ts: Date.now() });
    if (memory.length > MEMORY_MESSAGE_LIMIT) {
      memory = memory.slice(-MEMORY_MESSAGE_LIMIT);
    }
    await saveMemory(memory);
  }

  const memorySummary = memory
    .map((m) =>
      m.role === "system_summary"
        ? "summary: " + m.content
        : `${m.role}: ${m.content.slice(0, 200)}`
    )
    .join("\n");

  /* ============================================================
     FILE MODE
     ============================================================ */

  if (currentMode === "analyze_file") {
    const fPrompt = `
Analyze this file in plain text:

Filename: ${filename || "unknown"}
Content:
${file_content || prompt}
`;

    const result = await env.SPY_AI.run("@cf/mistralai/mistral-small-3.1-24b-instruct", {
      messages: [
        { role: "system", content: SPIDER_SYSTEM_PROMPT },
        { role: "system", content: "Memory:\n" + memorySummary },
        { role: "user", content: fPrompt },
      ],
    });

    return new Response(extractText(result), {
      headers: { "content-type": "text/plain" },
    });
  }

  /* ============================================================
     IMAGE GENERATION
     ============================================================ */

  if (currentMode === "image_gen") {
    const enhanced = `${prompt}, ultra detailed, hdr, 8k`;

    const img = await env.SPY_AI.run(
      "@cf/stabilityai/stable-diffusion-xl-base-1.0",
      { prompt: enhanced }
    );

    return new Response(img, { headers: { "content-type": "image/png" } });
  }

  /* ============================================================
     IMAGE EDIT
     ============================================================ */

  if (currentMode === "image_edit") {
    const enhanced = `${prompt}, hdr, cinematic`;

    const img = await env.SPY_AI.run(
      "@cf/stabilityai/stable-diffusion-xl-refiner-1.0",
      { prompt: enhanced, image, strength: strength || 0.7 }
    );

    return new Response(img, { headers: { "content-type": "image/png" } });
  }

  /* ============================================================
     NORMAL CHAT + SEARCH
     ============================================================ */

  const aiResp = await env.SPY_AI.run("@cf/mistralai/mistral-small-3.1-24b-instruct", {
    messages: [
      { role: "system", content: SPIDER_SYSTEM_PROMPT },
      { role: "system", content: "Memory:\n" + memorySummary },
      { role: "user", content: prompt },
    ],
  });

  const text = extractText(aiResp).trim();

  // If model responded with structured search request
  try {
    const obj = JSON.parse(text);
    if (obj?.action === "search" && obj?.query) {
      const results = await runSearch(env, obj.query);
      const summary = await env.SPY_AI.run("@cf/mistralai/mistral-small-3.1-24b-instruct", {
        messages: [
          { role: "system", content: SPIDER_SYSTEM_PROMPT },
          { role: "system", content: "Memory:\n" + memorySummary },
          { role: "user", content: `Search results: ${JSON.stringify(results)}` },
        ],
      });
      return new Response(extractText(summary), {
        headers: { "content-type": "text/plain" },
      });
    }
  } catch {}

  return new Response(text, {
    headers: { "content-type": "text/plain" },
  });
}

/* ============================================================
   SEARCH ENGINE
   ============================================================ */
async function runSearch(env, query) {
  try {
    const r = await env.SPY_AI.run("@cf/web-search/seznam-supersearch", {
      query,
    });
    return r?.results || r || {};
  } catch {
    return { error: "search_failed" };
  }
}

/* ============================================================
   TEXT EXTRACTOR
   ============================================================ */
function extractText(resp) {
  try {
    const v1 = resp?.output?.[1]?.content?.[0]?.text;
    if (v1) return v1.trim();
    const v2 = resp?.output?.[0]?.content?.[0]?.text;
    if (v2) return v2.trim();
    if (resp?.output_text) return resp.output_text.trim();
    if (resp?.text) return resp.text.trim();
    if (resp?.result) return resp.result.trim();
    if (resp?.choices?.[0]?.message?.content)
      return resp.choices[0].message.content.trim();
    return "";
  } catch {
    return "";
  }
}

/* ============================================================
   MODE DETECTOR
   ============================================================ */
function detectMode(prompt, file_content, filename) {
  if (file_content || filename) return "analyze_file";

  const t = (prompt || "").toLowerCase();
  if (t.includes("analyze file") || t.includes("debug") || t.includes("clean code"))
    return "analyze_file";

  if (t.includes("generate image") || t.includes("image of"))
    return "image_gen";

  if (t.includes("edit image") || t.includes("modify image"))
    return "image_edit";

  return "chat";
}
