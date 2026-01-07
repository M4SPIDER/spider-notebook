/* =========================================================
   SPIDER AI v8.1.4 – FINAL CHATGPT-LEVEL CLEAN VERSION
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
const TELUGU_AI_TRIGGERS = [
  "ra","mama","anna","bro","macha","boss","babu",
  "em","enti","nuvvu","nenu","mana","cheppu","mass","telugu"
];

const HINDI_AI_TRIGGERS = [
  "kya","kaise","kyun","bhai","yaar","dost",
  "acha","haan","nahi","bolo","batao","mast"
];

const SAVAGE_AI_TRIGGERS = [
  "savage","roast","troll","insult","roast me"
];

//////////////////////////////
// 3. UTILITIES
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
// 4. 🔥 CHATGPT-LEVEL CLEANER (FINAL)
//////////////////////////////
function cleanAiResponse(text) {
  if (!text) return "";

  // 1️⃣ Protect REAL fenced code blocks only
  const codeBlocks = [];
  text = text.replace(/```[\s\S]*?```/g, m => {
    codeBlocks.push(m);
    return `__INTERNAL_CODE_BLOCK_${codeBlocks.length}__`;
  });

  let c = text;

  // 2️⃣ Remove LLM junk artifacts
  c = c
    .replace(/#\*[\s\S]*?\*#/g, '')
    .replace(/#\*/g, '')
    .replace(/\*#/g, '');

  // 3️⃣ Remove ALL markdown headers
  c = c.replace(/^\s*#{1,6}\s*(.+)$/gm, (_, t) => t.trim());

  // 4️⃣ Remove ALL markdown emphasis
  c = c
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1');

  // 5️⃣ Remove bullets
  c = c.replace(/^\s*[\-\*\+•]+\s*/gm, '');

  // 6️⃣ 🔥 HARD NUKE: REMOVE *ALL* CODE PLACEHOLDER TEXT
  // Covers CODEBLOCK1, REALCODEBLOCK_2, __CODE_BLOCK_3__, etc.
  c = c.replace(
    /\b(__)?(REAL)?CODE\s*BLOCK[_\s-]*\d+(__)?\b/gi,
    ''
  );

  // 7️⃣ Remove AI/system prefixes
  c = c.replace(
    /^(User:|Assistant:|Spider AI:|Bot:|AI:|Model:)\s*/igm,
    ''
  );

  // 8️⃣ Remove system/search tags
  c = c.replace(/\[SEARCH_[A-Z_]+\]/g, '');

  // 9️⃣ Normalize whitespace
  c = c.replace(/\n{3,}/g, '\n\n').trim();

  // 🔟 Restore REAL code blocks only
  c = c.replace(/__INTERNAL_CODE_BLOCK_(\d+)__/g, (_, i) => codeBlocks[i - 1]);

  return c;
}

//////////////////////////////
// 5. SYSTEM PROMPTS
//////////////////////////////
const AI_CORE_IDENTITY =
"You are Spider AI created by M4 Spider. Respond like ChatGPT. Plain text only. Never expose placeholders.";

const AI_LANGUAGE_RULES =
"Detect language. Telugu/Hindi in English letters. Keep responses clean and natural.";

const AI_CODE_RULES =
"If the user asks for code, provide full working code inside triple backticks.";

//////////////////////////////
// 6. MODE DETECTION
//////////////////////////////
function detectMode(prompt) {
  const t = (prompt || "").toLowerCase().trim();
  if (["#reset","reset memory","clear memory"].includes(t)) return "reset";
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
    let body = {};
    const ct = request.headers.get("content-type") || "";

    if (ct.includes("application/json")) {
      body = await request.json();
    } else {
      body.prompt = await request.text();
    }

    const prompt = body.prompt || "";
    const mode = detectMode(prompt);

    const memKey = AI_MEMORY_USER_KEY_PREFIX + "anon";
    let mem = await getMemory(env, memKey);

    if (mode === "reset") {
      await saveMemory(env, memKey, []);
      return new Response("Memory cleared", { headers: cors });
    }

    if (mode === "status") {
      return new Response(
        `Spider AI online\nMemory messages: ${mem.length}`,
        { headers: cors }
      );
    }

    mem.push({ role: "user", content: prompt, ts: Date.now() });
    mem = mem.slice(-AI_MEMORY_TRIM_TARGET);

    const sys = [
      AI_CORE_IDENTITY,
      AI_LANGUAGE_RULES,
      AI_CODE_RULES
    ];

    if (shouldTrigger(TELUGU_AI_TRIGGERS, prompt))
      sys.push("Use Telugu slang (English letters).");

    if (shouldTrigger(HINDI_AI_TRIGGERS, prompt))
      sys.push("Use Hinglish.");

    if (shouldTrigger(SAVAGE_AI_TRIGGERS, prompt))
      sys.push("Savage mode allowed but respectful.");

    const res = await runAi(
      env,
      "@cf/mistralai/mistral-small-3.1-24b-instruct",
      {
        messages: [
          { role: "system", content: sys.join("\n\n") },
          ...mem.map(m => ({ role: m.role, content: m.content }))
        ],
        temperature: 0.7,
        max_tokens: 2048
      }
    );

    const output = cleanAiResponse(extractText(res));

    mem.push({ role: "assistant", content: output, ts: Date.now() });
    await saveMemory(env, memKey, mem);

    return new Response(output, {
      headers: { ...cors, "content-type": "text/plain" }
    });

  } catch (e) {
    return new Response("Error: " + e.message, { status: 500 });
  }
}
