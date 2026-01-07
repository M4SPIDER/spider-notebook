/* =========================================================
   SPIDER AI – FULLY FIXED BACKEND (SCHEMA SAFE)
   Author: M4 Spider
   ========================================================= */

//////////////////////////////
// 1. CONFIG
//////////////////////////////
const AI_MEMORY_TRIM_TARGET = 25;
const AI_MEMORY_TTL_DAYS = 30;
const AI_MEMORY_USER_KEY_PREFIX = "spider_ai_mem:";
const AI_RETRY_LIMIT = 2;
const AI_RETRY_DELAY_BASE = 1000;

//////////////////////////////
// 2. UTILS
//////////////////////////////
const sleep = ms => new Promise(r => setTimeout(r, ms));

//////////////////////////////
// 3. CLEAN OUTPUT (PLACEHOLDER + MARKDOWN SAFE)
//////////////////////////////
function cleanAiResponse(text) {
  if (!text) return "";

  // Protect real code blocks using invisible token
  const blocks = [];
  const TOKEN = "\u200B\u200C\u200D";

  text = text.replace(/```[\s\S]*?```/g, m => {
    blocks.push(m);
    return `${TOKEN}${blocks.length}${TOKEN}`;
  });

  let c = text;

  // Remove markdown & junk
  c = c
    .replace(/#\*[\s\S]*?\*#/g, "")
    .replace(/#\*/g, "")
    .replace(/\*#/g, "")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/^\s*[\-\*\+•]+\s*/gm, "");

  // 🔥 Kill ALL placeholder-like words
  c = c.replace(/\b[A-Z_]*CODE[A-Z_]*BLOCK[A-Z_]*\d*\b/gi, "");

  // Remove AI/system prefixes
  c = c.replace(
    /^(User:|Assistant:|Spider AI:|Bot:|AI:|Model:)\s*/igm,
    ""
  );

  // Normalize spacing
  c = c.replace(/\n{3,}/g, "\n\n").trim();

  // Restore real code blocks
  const restore = new RegExp(`${TOKEN}(\\d+)${TOKEN}`, "g");
  c = c.replace(restore, (_, i) => blocks[i - 1]);

  return c;
}

//////////////////////////////
// 4. MEMORY (KV)
//////////////////////////////
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

//////////////////////////////
// 5. AI CALL (SCHEMA SAFE)
//////////////////////////////
async function runAi(env, model, messages) {
  for (let i = 0; i <= AI_RETRY_LIMIT; i++) {
    try {
      return await env.SPY_AI.run(model, {
        messages,
        temperature: 0.7,
        max_tokens: 2048
      });
    } catch (e) {
      if (i === AI_RETRY_LIMIT) throw e;
      await sleep(AI_RETRY_DELAY_BASE * (2 ** i));
    }
  }
}

function extractText(resp) {
  return (
    resp?.output?.[1]?.content?.[0]?.text ||
    resp?.response ||
    resp?.result ||
    ""
  );
}

//////////////////////////////
// 6. MAIN HANDLER
//////////////////////////////
export async function onRequest(context) {
  const { request, env } = context;

  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const prompt = await request.text();

    const userId = "anon";
    const memKey = AI_MEMORY_USER_KEY_PREFIX + userId;

    // Load memory (with ts internally)
    let mem = await getMemory(env, memKey);

    // Save user message WITH timestamp (KV only)
    mem.push({
      role: "user",
      content: prompt,
      ts: Date.now()
    });

    mem = mem.slice(-AI_MEMORY_TRIM_TARGET);

    // 🚨 IMPORTANT FIX:
    // STRIP ts BEFORE sending to model
    const safeMessages = [
      {
        role: "system",
        content:
          "You are Spider AI. If user asks for code, return full working code inside triple backticks."
    : "You are Spider AI. Respond in plain text without markdown."

      },
      ...mem.map(m => ({
        role: m.role,
        content: m.content
      }))
    ];

    const res = await runAi(
      env,
      "@cf/mistralai/mistral-small-3.1-24b-instruct",
      safeMessages
    );

    const output = cleanAiResponse(extractText(res));

    // Save assistant response WITH timestamp (KV only)
    mem.push({
      role: "assistant",
      content: output,
      ts: Date.now()
    });

    await saveMemory(env, memKey, mem);

    return new Response(output, {
      headers: { ...cors, "content-type": "text/plain" }
    });

  } catch (e) {
    return new Response("Error: " + e.message, {
      status: 500,
      headers: cors
    });
  }
}
