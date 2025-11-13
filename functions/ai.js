/* ============================================================
   SPIDER AI — FIXED FINAL VERSION
   Optional Firebase Auth + Device ID + Per-User Memory + TTL
   Fixes:
   - crypto.randomUUID() -> uuidv4()
   - safer Firebase token check using tokeninfo endpoint (non-blocking)
   - consistent JSON responses for text endpoints (prevents res.json() errors)
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
   UTILITIES
   ============================================================ */
function uuidv4() {
  // Worker-friendly UUID v4
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function imageResponse(buffer) {
  return new Response(buffer, { headers: { "content-type": "image/png" } });
}

function safeText(s) {
  return (s ?? "").toString();
}

function extractText(resp) {
  try {
    const v1 = resp?.output?.[1]?.content?.[0]?.text;
    if (v1) return v1.trim();
    const v2 = resp?.output?.[0]?.content?.[0]?.text;
    if (v2) return v2.trim();
    if (resp?.output_text) return resp.output_text.trim();
    if (resp?.text) return resp.text.trim();
    if (resp?.result) return resp.result.trim();
    if (resp?.choices?.[0]?.message?.content) return resp.choices[0].message.content.trim();
    if (resp?.response) return resp.response.trim();
    return "";
  } catch {
    return "";
  }
}

/* ============================================================
   VERIFY FIREBASE TOKEN (safe, non-blocking)
   Uses Google's tokeninfo endpoint (simpler than manual cert verify).
   If verification fails or tokeninfo is unreachable, it returns null
   (does not throw).
   ============================================================ */
async function verifyFirebaseToken(idToken) {
  if (!idToken) return null;
  try {
    // Google's tokeninfo supports id_token parameter
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!res.ok) return null;
    const payload = await res.json();
    // payload.aud should match FIREBASE_PROJECT_ID
    // payload.iss should be https://securetoken.google.com/<project>
    if (payload.aud !== FIREBASE_PROJECT_ID) return null;
    if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) return null;
    // tokeninfo returns exp as seconds
    if (payload.exp && Number(payload.exp) * 1000 < Date.now()) return null;
    // Firebase tokeninfo returns 'sub' as user id sometimes; also 'user_id' may exist
    return { user_id: payload.user_id || payload.sub || payload.sub };
  } catch (e) {
    // network or other error — fail safely
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
  try { body = await request.json(); } catch {}

  const { prompt, mode, image, strength, file_content, filename } = body;
  const currentMode = mode || detectMode(prompt, file_content, filename);

  /* ============================================================
     USER IDENTIFICATION (DEVICE ID + OPTIONAL FIREBASE)
     ============================================================ */

  // 1) Unique per-device anonymous ID (worker-safe)
  let userId = (body.device_id && body.device_id.toString()) || "anon-" + uuidv4();

  // 2) User preference override
  if (body.user_preference_id) {
    try { userId = body.user_preference_id.toString(); } catch {}
  }

  // 3) Firebase login override (optional)
  if (body.firebase_token) {
    const decoded = await verifyFirebaseToken(body.firebase_token);
    if (decoded && decoded.user_id) {
      userId = decoded.user_id;
    }
    // if verification fails, we silently keep anon userId
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
    try { await env.CHAT_KV.put(memoryKey, JSON.stringify(mem)); } catch {}
  }

  let memory = await getMemory();
  const cutoff = Date.now() - MEMORY_TTL_DAYS * 86400000;
  memory = memory.filter((m) => (m.ts || 0) >= cutoff);

  /* ============================================================
     MEMORY COMPRESSION
     ============================================================ */
  async function compressMemory(mem) {
    if (mem.length < MEMORY_SUMMARY_TRIGGER) return mem;

    const keepRecent = Math.floor(MEMORY_TRIM_TARGET / 2);
    const older = mem.slice(0, mem.length - keepRecent);

    const summaryPrompt = `
Summarize these chats in 2-4 short lines, keeping only important facts:

${older.map((m, i) => `${i + 1}. ${m.role}: ${m.content}`).join("\n")}
`;

    try {
      const result = await env.SPY_AI.run("@cf/mistralai/mistral-small-3.1-24b-instruct", {
        messages: [
          { role: "system", content: SPIDER_SYSTEM_PROMPT },
          { role: "user", content: summaryPrompt },
        ],
      });
      const summary = extractText(result).trim();
      return [
        { role: "system_summary", content: summary, ts: Date.now() },
        ...mem.slice(-keepRecent),
      ];
    } catch {
      // fallback: trim oldest messages
      return mem.slice(-MEMORY_TRIM_TARGET);
    }
  }

  if (memory.length >= MEMORY_SUMMARY_TRIGGER) {
    memory = await compressMemory(memory);
  }

  if (memory.length > MEMORY_MESSAGE_LIMIT) {
    memory = memory.slice(-MEMORY_MESSAGE_LIMIT);
  }

  await saveMemory(memory);

  /* ============================================================
     DELETE MEMORY SYSTEM (returns JSON)
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
    return jsonResponse({ ok: true, text: "What do you want me to delete? (delete memory: all / last / 3 / keyword)" });
  }

  if (
    lower.includes("delete memory: all") ||
    lower.includes("reset all") ||
    lower.includes("delete all")
  ) {
    await env.CHAT_KV.put(memoryKey, JSON.stringify([]));
    return jsonResponse({ ok: true, text: "Memory wiped clean 😈🔥" });
  }

  if (lower.includes("delete memory:")) {
    const command = lower.replace("delete memory:", "").trim();

    if (command === "last") {
      const removed = memory.pop();
      await saveMemory(memory);
      return jsonResponse({ ok: true, text: `Deleted last memory entry: ${safeText(removed?.content).slice(0, 200)}` });
    }

    if (command === "first") {
      const removed = memory.shift();
      await saveMemory(memory);
      return jsonResponse({ ok: true, text: `Deleted first memory entry: ${safeText(removed?.content).slice(0, 200)}` });
    }

    const idx = parseInt(command);
    if (!isNaN(idx) && idx >= 1 && idx <= memory.length) {
      const removed = memory.splice(idx - 1, 1)[0];
      await saveMemory(memory);
      return jsonResponse({ ok: true, text: `Deleted memory #${idx}: ${safeText(removed?.content).slice(0,200)}` });
    }

    const before = memory.length;
    memory = memory.filter((m) => !m.content.toLowerCase().includes(command));
    await saveMemory(memory);
    const removedCount = before - memory.length;
    return jsonResponse({ ok: true, text: `Deleted ${removedCount} memory item(s) matching "${command}".` });
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

    try {
      const result = await env.SPY_AI.run("@cf/mistralai/mistral-small-3.1-24b-instruct", {
        messages: [
          { role: "system", content: SPIDER_SYSTEM_PROMPT },
          { role: "system", content: "Memory:\n" + memorySummary },
          { role: "user", content: fPrompt },
        ],
      });

      return jsonResponse({ ok: true, text: extractText(result), model_used: "mistral-24b" });
    } catch (e) {
      return jsonResponse({ ok: false, text: "File analysis failed." }, 500);
    }
  }

  /* ============================================================
     IMAGE GENERATION
     ============================================================ */

  if (currentMode === "image_gen") {
    const enhanced = `${prompt}, ultra detailed, hdr, 8k`;
    try {
      const img = await env.SPY_AI.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", { prompt: enhanced });
      return imageResponse(img);
    } catch (e) {
      return jsonResponse({ ok: false, text: "Image generation failed." }, 500);
    }
  }

  /* ============================================================
     IMAGE EDIT
     ============================================================ */

  if (currentMode === "image_edit") {
    const enhanced = `${prompt}, hdr, cinematic`;
    try {
      const img = await env.SPY_AI.run("@cf/stabilityai/stable-diffusion-xl-refiner-1.0", { prompt: enhanced, image, strength: strength || 0.7 });
      return imageResponse(img);
    } catch (e) {
      return jsonResponse({ ok: false, text: "Image edit failed." }, 500);
    }
  }

  /* ============================================================
     NORMAL CHAT + SEARCH
     ============================================================ */

  try {
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
        return jsonResponse({ ok: true, text: extractText(summary) });
      }
    } catch {}

    return jsonResponse({ ok: true, text: text });
  } catch (e) {
    return jsonResponse({ ok: false, text: "AI request failed." }, 500);
  }
}

/* ============================================================
   SEARCH ENGINE
   ============================================================ */
async function runSearch(env, query) {
  try {
    const r = await env.SPY_AI.run("@cf/web-search/seznam-supersearch", { query });
    return r?.results || r || {};
  } catch {
    return { error: "search_failed" };
  }
}

/* ============================================================
   MODE DETECTOR
   ============================================================ */
function detectMode(prompt, file_content, filename) {
  if (file_content || filename) return "analyze_file";

  const t = (prompt || "").toLowerCase();
  if (t.includes("analyze file") || t.includes("debug") || t.includes("clean code")) return "analyze_file";

  if (t.includes("generate image") || t.includes("image of")) return "image_gen";

  if (t.includes("edit image") || t.includes("modify image")) return "image_edit";

  return "chat";
}
