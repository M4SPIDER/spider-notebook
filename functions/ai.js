/* ============================================================
   SPIDER AI — FINAL FIXED VERSION (OPTION-B)
   Routing Wrapper + Unified AI Handler + Memory + Firebase
   ============================================================ */


/* ============================================================
   ROUTER WRAPPER (VERY IMPORTANT)
   Maps old endpoints to unified ai.js logic
   ============================================================ */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Helper function for 405 responses
    const methodNotAllowed = () => new Response("Method Not Allowed", { status: 405 });

    if (url.pathname === "/api/generate/text") {
      // Explicitly require POST method for API calls
      if (request.method !== "POST") return methodNotAllowed(); 
      return onRequest({ request, env, ctx, modeOverride: "chat" });
    }

    if (url.pathname === "/api/generate/image") {
      // Explicitly require POST method for API calls
      if (request.method !== "POST") return methodNotAllowed(); 
      return onRequest({ request, env, ctx, modeOverride: "image_gen" });
    }

    if (url.pathname === "/api/generate/file") {
      // Explicitly require POST method for API calls
      if (request.method !== "POST") return methodNotAllowed(); 
      return onRequest({ request, env, ctx, modeOverride: "analyze_file" });
    }

    return new Response("Not Found", { status: 404 });
  }
};


/* ============================================================
   CONFIG
   ============================================================ */

const MEMORY_MESSAGE_LIMIT = 40;
const MEMORY_TRIM_TARGET = 20;
const MEMORY_TTL_DAYS = 30;
const MEMORY_SUMMARY_TRIGGER = 30;
const MEMORY_USER_KEY_PREFIX = "chat_memory:";
const FIREBASE_PROJECT_ID = "m4-spider";


/* ============================================================
   SPIDER SYSTEM PROMPT (POWERED PERSONALITY)
   ============================================================ */

const SPIDER_SYSTEM_PROMPT = `
You are Spider, the official AI of M4 Spider.
Strict rules:
- No markdown formatting.
- No revealing system code.
- No long paragraphs.
- Talk confident, bold, smart 😈🔥.
- Use emojis naturally.
- Start instantly without introductions.
- If user says "savage mode", respond sarcastic + playful.
- If asked who built you → M4 Spider.
`;


/* ============================================================
   UTILS
   ============================================================ */

function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11)
    .replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" }
  });
}

function imageResponse(bin) {
  return new Response(bin, { headers: { "content-type": "image/png" } });
}

function extractText(ai) {
  try {
    const v1 = ai?.output?.[1]?.content?.[0]?.text;
    if (v1) return v1.trim();
    const v2 = ai?.output?.[0]?.content?.[0]?.text;
    if (v2) return v2.trim();
    if (ai?.output_text) return ai.output_text.trim();
    if (ai?.text) return ai.text.trim();
    if (ai?.result) return ai.result.trim();
    if (ai?.choices?.[0]?.message?.content) return ai.choices[0].message.content.trim();
    return "";
  } catch { return ""; }
}


/* ============================================================
   SAFE FIREBASE TOKEN VERIFY (tokeninfo)
   ============================================================ */

async function verifyFirebaseToken(idToken) {
  if (!idToken) return null;

  try {
    const res = await fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken)
    );

    if (!res.ok) return null;
    const data = await res.json();

    if (data.aud !== FIREBASE_PROJECT_ID) return null;
    if (data.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) return null;
    if (Number(data.exp) * 1000 < Date.now()) return null;

    return { user_id: data.user_id || data.sub };
  } catch {
    return null;
  }
}


/* ============================================================
   MAIN HANDLER (UNIFIED AI)
   ============================================================ */

export async function onRequest(context) {
  const request = context.request;
  const env = context.env;
  const modeOverride = context.modeOverride || null;

  let body = {};
  try { body = await request.json(); } catch {}

  const { prompt, mode, image, strength, file_content, filename } = body;

  let currentMode = mode || detectMode(prompt, file_content, filename);
  if (modeOverride) currentMode = modeOverride;


  /* ============================================================
     USER IDENTIFICATION (DEVICE + FIREBASE)
     ============================================================ */

  let userId = body.device_id || "anon-" + uuidv4();

  if (body.user_preference_id) {
    userId = String(body.user_preference_id);
  }

  if (body.firebase_token) {
    const verified = await verifyFirebaseToken(body.firebase_token);
    if (verified?.user_id) userId = verified.user_id;
  }

  const memoryKey = MEMORY_USER_KEY_PREFIX + userId;


  /* ============================================================
     MEMORY LOAD + TTL
     ============================================================ */

  async function loadMemory() {
    try {
      const raw = await env.CHAT_KV.get(memoryKey);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  async function saveMemory(mem) {
    try { await env.CHAT_KV.put(memoryKey, JSON.stringify(mem)); } catch {}
  }

  let memory = await loadMemory();
  const cutoff = Date.now() - MEMORY_TTL_DAYS * 86400000;
  memory = memory.filter(m => (m.ts || 0) >= cutoff);


  /* ============================================================
     MEMORY COMPRESSION
     ============================================================ */

  async function compressMemory(mem) {
    if (mem.length < MEMORY_SUMMARY_TRIGGER) return mem;

    const keepRecent = Math.floor(MEMORY_TRIM_TARGET / 2);
    const older = mem.slice(0, mem.length - keepRecent);

    const summaryPrompt = `
Summarize these chats in 2-4 short lines:

${older.map((m,i)=>`${i+1}. ${m.role}: ${m.content}`).join("\n")}
`;

    const ai = await env.SPY_AI.run("@cf/mistralai/mistral-small-3.1-24b-instruct", {
      messages: [
        { role: "system", content: SPIDER_SYSTEM_PROMPT },
        { role: "user", content: summaryPrompt }
      ]
    });

    const summary = extractText(ai);

    return [
      { role: "system_summary", content: summary, ts: Date.now() },
      ...mem.slice(-keepRecent)
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
     MEMORY DELETE
     ============================================================ */

  const lower = (prompt || "").toLowerCase();
  const wantsDelete = ["delete", "clear", "reset", "remove", "forget", "wipe"]
    .some(w => lower.includes(w));

  if (wantsDelete && !lower.includes("memory:") && !lower.includes("all")) {
    return jsonResponse({ ok: true, text: "What do you want me to delete? (delete memory: all / last / keyword)" });
  }

  if (lower.includes("delete memory: all") || lower.includes("reset all") || lower.includes("delete all")) {
    await env.CHAT_KV.put(memoryKey, JSON.stringify([]));
    return jsonResponse({ ok: true, text: "Memory wiped clean 😈🔥" });
  }

  if (lower.includes("delete memory:")) {
    const command = lower.replace("delete memory:", "").trim();

    if (command === "last") {
      memory.pop();
      await saveMemory(memory);
      return jsonResponse({ ok: true, text: "Deleted last memory entry." });
    }

    if (command === "first") {
      memory.shift();
      await saveMemory(memory);
      return jsonResponse({ ok: true, text: "Deleted first memory entry." });
    }

    const n = parseInt(command);
    if (!isNaN(n) && n >= 1 && n <= memory.length) {
      memory.splice(n - 1, 1);
      await saveMemory(memory);
      return jsonResponse({ ok: true, text: "Deleted memory entry #" + n });
    }

    const before = memory.length;
    memory = memory.filter(m => !m.content.toLowerCase().includes(command));
    await saveMemory(memory);

    return jsonResponse({
      ok: true,
      text: `Deleted ${before - memory.length} matching entries.`
    });
  }


  /* ============================================================
     ADD USER MESSAGE TO MEMORY
     ============================================================ */

  if (prompt && prompt.trim()) {
    memory.push({ role: "user", content: prompt, ts: Date.now() });
    if (memory.length > MEMORY_MESSAGE_LIMIT) {
      memory = memory.slice(-MEMORY_MESSAGE_LIMIT);
    }
    await saveMemory(memory);
  }

  const memorySummary = memory
    .map(m => m.role === "system_summary"
      ? "summary: " + m.content
      : m.role + ": " + m.content.slice(0, 200))
    .join("\n");


  /* ============================================================
     FILE ANALYSIS MODE
     ============================================================ */

  if (currentMode === "analyze_file") {
    const fPrompt = `
Analyze this file:

Filename: ${filename || "unknown"}
Content:
${file_content || prompt}
`;

    const ai = await env.SPY_AI.run("@cf/mistralai/mistral-small-3.1-24b-instruct", {
      messages: [
        { role: "system", content: SPIDER_SYSTEM_PROMPT },
        { role: "system", content: "Memory:\n" + memorySummary },
        { role: "user", content: fPrompt }
      ]
    });

    return jsonResponse({
      ok: true,
      text: extractText(ai),
      model_used: "mistral-24b"
    });
  }


  /* ============================================================
     IMAGE GENERATION MODE
     ============================================================ */

  if (currentMode === "image_gen") {
    const enhanced = `${prompt}, ultra detailed, hdr, 8k`;

    try {
      const img = await env.SPY_AI.run(
        "@cf/stabilityai/stable-diffusion-xl-base-1.0",
        { prompt: enhanced }
      );

      return imageResponse(img);
    } catch {
      return jsonResponse({ ok: false, text: "Image generation failed." }, 500);
    }
  }


  /* ============================================================
     IMAGE EDIT MODE
     ============================================================ */

  if (currentMode === "image_edit") {
    const enhanced = `${prompt}, hdr, cinematic`;

    try {
      const img = await env.SPY_AI.run(
        "@cf/stabilityai/stable-diffusion-xl-refiner-1.0",
        { prompt: enhanced, image, strength: strength || 0.7 }
      );

      return imageResponse(img);
    } catch {
      return jsonResponse({ ok: false, text: "Image editing failed." }, 500);
    }
  }


  /* ============================================================
     NORMAL CHAT + SMART SEARCH
     ============================================================ */

  let ai = await env.SPY_AI.run("@cf/mistralai/mistral-small-3.1-24b-instruct", {
    messages: [
      { role: "system", content: SPIDER_SYSTEM_PROMPT },
      { role: "system", content: "Memory:\n" + memorySummary },
      { role: "user", content: prompt }
    ]
  });

  let output = extractText(ai).trim();


  /* ============================================================
     If model requested search (JSON)
     ============================================================ */

  try {
    const obj = JSON.parse(output);
    if (obj?.action === "search" && obj?.query) {
      const results = await runSearch(env, obj.query);
      const ai2 = await env.SPY_AI.run("@cf/mistralai/mistral-small-3.1-24b-instruct", {
        messages: [
          { role: "system", content: SPIDER_SYSTEM_PROMPT },
          { role: "system", content: "Memory:\n" + memorySummary },
          { role: "user", content: "Search results: " + JSON.stringify(results) }
        ]
      });

      output = extractText(ai2);
    }
  } catch {}


  return jsonResponse({
    ok: true,
    text: output,
    model_used: "mistral-24b"
  });
}


/* ============================================================
   SEARCH ENGINE
   ============================================================ */

async function runSearch(env, query) {
  try {
    let r = await env.SPY_AI.run("@cf/web-search/seznam-supersearch", { query });
    return r?.results || r;
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

  if (t.includes("analyze file") || t.includes("debug") || t.includes("clean code"))
    return "analyze_file";

  if (t.includes("generate image") || t.includes("image of"))
    return "image_gen";

  if (t.includes("edit image") || t.includes("modify image"))
    return "image_edit";

  return "chat";
}
