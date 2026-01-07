/* =========================================================
   SPIDER AI v8.1.4 – ULTIMATE FINAL CLEAN VERSION
   Author: M4 Spider
   ========================================================= */

//////////////////////////////
// 1. CONFIGURATION
//////////////////////////////
const AI_MEMORY_MESSAGE_LIMIT = 60;
const AI_MEMORY_TRIM_TARGET = 25;
const AI_MEMORY_TTL_DAYS = 30;
const AI_MEMORY_USER_KEY_PREFIX = "spider_ai_v8_mem:";
const AI_RETRY_LIMIT = 2;
const AI_RETRY_DELAY_BASE = 1000;

//////////////////////////////
// 2. LANGUAGE TRIGGERS
//////////////////////////////
const TELUGU_AI_TRIGGERS = ["ra","mama","anna","bro","macha","boss","em","enti"];
const HINDI_AI_TRIGGERS = ["kya","kaise","kyun","bhai","yaar","acha"];
const SAVAGE_AI_TRIGGERS = ["savage","roast","troll","insult"];

//////////////////////////////
// 3. HELPERS
//////////////////////////////
const sleep = ms => new Promise(r => setTimeout(r, ms));

function shouldTrigger(list, msg) {
  if (!msg) return false;
  let c = 0;
  msg.toLowerCase().split(/\s+/).forEach(w => {
    if (list.includes(w)) c++;
  });
  return c >= 2;
}

//////////////////////////////
// 4. 🔥 CHATGPT-LEVEL CLEANER (ULTIMATE)
//////////////////////////////
function cleanAiResponse(text) {
  if (!text) return "";

  // 1️⃣ Protect REAL fenced code blocks
  // Use an IMPOSSIBLE token (zero-width chars)
  const codeBlocks = [];
  const TOKEN = "\u200B\u200C\u200D"; // invisible trio

  text = text.replace(/```[\s\S]*?```/g, m => {
    codeBlocks.push(m);
    return `${TOKEN}${codeBlocks.length}${TOKEN}`;
  });

  let c = text;

  // 2️⃣ Remove LLM junk
  c = c
    .replace(/#\*[\s\S]*?\*#/g, '')
    .replace(/#\*/g, '')
    .replace(/\*#/g, '');

  // 3️⃣ Remove ALL markdown formatting
  c = c
    .replace(/^\s*#{1,6}\s*(.+)$/gm, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/^\s*[\-\*\+•]+\s*/gm, '');

  // 4️⃣ ☢️ ABSOLUTE PLACEHOLDER NUKER
  // Removes ANY variant:
  // CODEBLOCK, REALCODEBLOCK, INTERNALCODEBLOCK, TEMPBLOCK, etc.
  c = c.replace(
    /\b[A-Z_]*CODE[A-Z_]*BLOCK[A-Z_]*\s*\d*\b/gi,
    ''
  );

  // 5️⃣ Remove AI prefixes & system junk
  c = c
    .replace(/^(User:|Assistant:|Spider AI:|Bot:|AI:|Model:)\s*/igm, '')
    .replace(/\[SEARCH_[A-Z_]+\]/g, '');

  // 6️⃣ Normalize whitespace
  c = c.replace(/\n{3,}/g, '\n\n').trim();

  // 7️⃣ Restore REAL code blocks (only via invisible token)
  const restoreRegex = new RegExp(`${TOKEN}(\\d+)${TOKEN}`, "g");
  c = c.replace(restoreRegex, (_, i) => codeBlocks[i - 1]);

  return c;
}

//////////////////////////////
// 5. SYSTEM PROMPTS
//////////////////////////////
const AI_CORE_IDENTITY =
"You are Spider AI created by M4 Spider. Behave like ChatGPT. Never expose placeholders.";

//////////////////////////////
// 6. MODE DETECTION
//////////////////////////////
function detectMode(prompt) {
  const t = (prompt || "").toLowerCase().trim();
  if (["#reset","reset memory"].includes(t)) return "reset";
  if (["#status","#health"].includes(t)) return "status";
  return "chat";
}

//////////////////////////////
// 7. MEMORY (KV)
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
// 8. AI RUNNER
//////////////////////////////
async function runAi(env, model, input) {
  for (let i = 0; i <= AI_RETRY_LIMIT; i++) {
    try {
      return await env.SPY_AI.run(model, input);
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
    (typeof resp === "string" ? resp : "")
  );
}

//////////////////////////////
// 9. MAIN HANDLER
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
    const mode = detectMode(prompt);

    const memKey = AI_MEMORY_USER_KEY_PREFIX + "anon";
    let mem = await getMemory(env, memKey);

    if (mode === "reset") {
      await saveMemory(env, memKey, []);
      return new Response("Memory cleared", { headers: cors });
    }

    if (mode === "status") {
      return new Response(`Spider AI online\nMemory: ${mem.length}`, { headers: cors });
    }

    mem.push({ role: "user", content: prompt });
    mem = mem.slice(-AI_MEMORY_TRIM_TARGET);

    const res = await runAi(
      env,
      "@cf/mistralai/mistral-small-3.1-24b-instruct",
      {
        messages: [
          { role: "system", content: AI_CORE_IDENTITY },
          ...mem
        ],
        temperature: 0.7,
        max_tokens: 2048
      }
    );

    const output = cleanAiResponse(extractText(res));

    mem.push({ role: "assistant", content: output });
    await saveMemory(env, memKey, mem);

    return new Response(output, {
      headers: { ...cors, "content-type": "text/plain" }
    });

  } catch (e) {
    return new Response("Error: " + e.message, { status: 500 });
  }
}
