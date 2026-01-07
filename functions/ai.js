/**
 * =========================================================
 * SPIDER AI — STRUCTURE SAFE BACKEND
 * Author: M4 Spider
 * Version: 8.2.0 (FINAL STRUCTURE FIX)
 * =========================================================
 */

/* ---------------------------------------------------------
 * CONFIG
 * --------------------------------------------------------- */
const CONFIG = {
  AI_NAME: "Spider AI",
  VERSION: "8.2.0"
};

const AI_MEMORY_TRIM_TARGET = 30;
const AI_MEMORY_TTL_DAYS = 30;
const AI_MEMORY_USER_KEY_PREFIX = "spider_ai_mem:";
const AI_RETRY_LIMIT = 2;
const AI_RETRY_DELAY_BASE = 1200;

/* ---------------------------------------------------------
 * UTILS
 * --------------------------------------------------------- */
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------------------------------------------------------
 * ✅ STRUCTURE-SAFE CLEANER
 * --------------------------------------------------------- */
function cleanAiResponseSafe(text) {
  if (!text) return "";

  const CODE = [];
  const TABLE = [];
  const MATH = [];

  const CODE_T = "\u200B\u200C\u200D_CODE_";
  const TABLE_T = "\u200B\u200C\u200D_TABLE_";
  const MATH_T = "\u200B\u200C\u200D_MATH_";

  // 1. Protect code blocks
  text = text.replace(/```[\s\S]*?```/g, m => {
    CODE.push(m);
    return CODE_T + (CODE.length - 1) + "_";
  });

  // 2. Protect tables
  text = text.replace(
    /(^|\n)(\|.+\|[\s\S]*?\n(?=\n|$))/g,
    m => {
      TABLE.push(m);
      return TABLE_T + (TABLE.length - 1) + "_";
    }
  );

  // 3. Protect math
  text = text.replace(/\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g, m => {
    MATH.push(m);
    return MATH_T + (MATH.length - 1) + "_";
  });

  // 4. Clean prose ONLY
  text = text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/^[>\-\+•]+\s*/gm, "")
    .replace(/^(User:|Assistant:|AI:|Bot:|Model:)\s*/igm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // 5. Restore everything
  text = text.replace(new RegExp(CODE_T + "(\\d+)_", "g"), (_, i) => CODE[i]);
  text = text.replace(new RegExp(TABLE_T + "(\\d+)_", "g"), (_, i) => TABLE[i]);
  text = text.replace(new RegExp(MATH_T + "(\\d+)_", "g"), (_, i) => MATH[i]);

  return text;
}

/* ---------------------------------------------------------
 * MEMORY (KV)
 * --------------------------------------------------------- */
async function getMemory(env, key) {
  try {
    return env.CHAT_KV ? JSON.parse(await env.CHAT_KV.get(key)) || [] : [];
  } catch {
    return [];
  }
}

async function saveMemory(env, key, mem) {
  try {
    if (env.CHAT_KV) {
      await env.CHAT_KV.put(key, JSON.stringify(mem), {
        expirationTtl: AI_MEMORY_TTL_DAYS * 86400
      });
    }
  } catch {}
}

/* ---------------------------------------------------------
 * AI CALL (NON-STREAM)
 * --------------------------------------------------------- */
async function runAi(env, model, payload) {
  for (let i = 0; i <= AI_RETRY_LIMIT; i++) {
    try {
      return await env.SPY_AI.run(model, payload);
    } catch (e) {
      if (i === AI_RETRY_LIMIT) throw e;
      await sleep(AI_RETRY_DELAY_BASE * (2 ** i));
    }
  }
}

function extractText(resp) {
  return (
    resp?.output?.[1]?.content?.[0]?.text ||
    resp?.output?.[0]?.content?.[0]?.text ||
    resp?.response ||
    resp?.result ||
    ""
  );
}

/* ---------------------------------------------------------
 * MODE DETECTION
 * --------------------------------------------------------- */
function detectMode(prompt, mode) {
  if (mode) return mode;
  const t = (prompt || "").toLowerCase();
  if (t.includes("generate image") || t.includes("create image")) return "image_gen";
  return "chat";
}

/* ---------------------------------------------------------
 * MAIN HANDLER
 * --------------------------------------------------------- */
export async function onRequest({ request, env }) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const prompt = body.prompt || "";
    const mode = detectMode(prompt, body.mode);

    const uid = body.user_preference_id || "anon";
    const memKey = AI_MEMORY_USER_KEY_PREFIX + uid;

    let mem = await getMemory(env, memKey);

    if (prompt) {
      mem.push({ role: "user", content: prompt });
      mem = mem.slice(-AI_MEMORY_TRIM_TARGET);
    }

    /* ---------------- IMAGE GENERATION (SDXL) ---------------- */
    if (mode === "image_gen") {
      const img = await runAi(
        env,
        "@cf/stabilityai/stable-diffusion-xl-base-1.0",
        {
          prompt: prompt + ", photorealistic, ultra-detailed, 8k",
        }
      );

      return new Response(img, {
        headers: { ...cors, "content-type": "image/png" }
      });
    }

    /* ---------------- CHAT / CODE / TABLE ---------------- */
    const systemPrompt = `
You are ${CONFIG.AI_NAME} v${CONFIG.VERSION}.
Rules:
- Preserve code blocks, tables, and math.
- Use markdown ONLY when structurally needed.
- Do NOT use decorative markdown like ** or ###.
    `.trim();

    const messages = [
      { role: "system", content: systemPrompt },
      ...mem.map(m => ({ role: m.role, content: m.content }))
    ];

    const res = await runAi(
      env,
      "@cf/mistralai/mistral-small-3.1-24b-instruct",
      { messages, temperature: 0.7, max_tokens: 2048 }
    );

    const cleaned = cleanAiResponseSafe(extractText(res));

    mem.push({ role: "assistant", content: cleaned });
    await saveMemory(env, memKey, mem);

    return new Response(cleaned, {
      headers: { ...cors, "content-type": "text/plain" }
    });

  } catch (e) {
    return new Response("Error: " + e.message, {
      status: 500,
      headers: cors
    });
  }
}
