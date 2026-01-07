/**
 * =========================================================
 * SPIDER AI — FINAL STABLE BACKEND
 * SDXL + KV + STREAMING + SAFE CLEANER
 * Author: M4 Spider
 * =========================================================
 */

//////////////////////////////
// CONFIG
//////////////////////////////
const AI_NAME = "Spider AI";
const VERSION = "9.0.0";

const AI_MEMORY_TRIM_TARGET = 25;
const AI_MEMORY_TTL_DAYS = 30;
const AI_MEMORY_USER_KEY_PREFIX = "spider_ai_mem:";
const AI_RETRY_LIMIT = 2;
const AI_RETRY_DELAY_BASE = 1500;

//////////////////////////////
// UTILS
//////////////////////////////
const sleep = ms => new Promise(r => setTimeout(r, ms));

//////////////////////////////
// SAFE CLEANER (CODE / TABLE / MATH SAFE)
//////////////////////////////
function cleanAiResponse(text) {
  if (!text) return "";

  const CODE = [];
  const TABLE = [];
  const MATH = [];

  const CODE_T = "\u200B\u200C\u200D_CODE_";
  const TABLE_T = "\u200B\u200C\u200D_TABLE_";
  const MATH_T = "\u200B\u200C\u200D_MATH_";

  // protect code blocks
  text = text.replace(/```[\s\S]*?```/g, m => {
    CODE.push(m);
    return CODE_T + (CODE.length - 1) + "_";
  });

  // protect tables
  text = text.replace(/(^|\n)(\|.+\|[\s\S]*?\n(?=\n|$))/g, m => {
    TABLE.push(m);
    return TABLE_T + (TABLE.length - 1) + "_";
  });

  // protect math
  text = text.replace(/\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g, m => {
    MATH.push(m);
    return MATH_T + (MATH.length - 1) + "_";
  });

  // clean prose only
  text = text
    .replace(/#\*[\s\S]*?\*#/g, "")
    .replace(/#\*/g, "")
    .replace(/\*#/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/^(User:|Assistant:|AI:|Bot:|Model:)\s*/igm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // restore protected blocks
  text = text.replace(new RegExp(CODE_T + "(\\d+)_", "g"), (_, i) => CODE[i]);
  text = text.replace(new RegExp(TABLE_T + "(\\d+)_", "g"), (_, i) => TABLE[i]);
  text = text.replace(new RegExp(MATH_T + "(\\d+)_", "g"), (_, i) => MATH[i]);

  return text;
}

//////////////////////////////
// KV MEMORY
//////////////////////////////
async function getMemory(env, key) {
  try {
    return env.CHAT_KV ? JSON.parse(await env.CHAT_KV.get(key)) || [] : [];
  } catch {
    return [];
  }
}

async function saveMemory(env, key, mem) {
  if (!env.CHAT_KV) return;
  await env.CHAT_KV.put(key, JSON.stringify(mem), {
    expirationTtl: AI_MEMORY_TTL_DAYS * 86400
  });
}

//////////////////////////////
// AI CALL
//////////////////////////////
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

//////////////////////////////
// MAIN HANDLER
//////////////////////////////
export async function onRequest(context) {
  const { request, env } = context;

  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const payload = await request.json();
    const {
      prompt = "",
      mode = "chat",
      user_preference_id = "anon",
      aspect_ratio = "1:1",
      stream = false
    } = payload;

    const memKey = AI_MEMORY_USER_KEY_PREFIX + user_preference_id;

    //////////////////////
    // STREAM MODE (NO KV)
    //////////////////////
    if (mode === "stream") {
      const encoder = new TextEncoder();
      const streamResp = new ReadableStream({
        async start(controller) {
          const res = await runAi(
            env,
            "@cf/mistralai/mistral-small-3.1-24b-instruct",
            {
              messages: [{ role: "user", content: prompt }],
              max_tokens: 8192
            }
          );

          const text = extractText(res);
          const chunks = text.match(/.{1,800}/g) || [];

          for (const c of chunks) {
            controller.enqueue(encoder.encode(c));
            await sleep(20);
          }
          controller.close();
        }
      });

      return new Response(streamResp, {
        headers: {
          ...cors,
          "Content-Type": "text/plain; charset=utf-8"
        }
      });
    }

    //////////////////////
    // IMAGE GENERATION (SDXL)
    //////////////////////
    if (mode === "image_gen") {
      const image = await runAi(
        env,
        "@cf/stabilityai/stable-diffusion-xl-base-1.0",
        {
          prompt: `${prompt}, ultra detailed, cinematic lighting`,
          aspect_ratio
        }
      );

      return new Response(image, {
        headers: { ...cors, "Content-Type": "image/png" }
      });
    }

    //////////////////////
    // NORMAL CHAT (KV)
    //////////////////////
    let memory = await getMemory(env, memKey);

    memory.push({ role: "user", content: prompt, ts: Date.now() });
    memory = memory.slice(-AI_MEMORY_TRIM_TARGET);

    const systemPrompt = `
You are ${AI_NAME} v${VERSION}.
Rules:
- Use markdown
- Always use proper code blocks
- Never output #* or *#
`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...memory.map(m => ({ role: m.role, content: m.content }))
    ];

    const aiRes = await runAi(
      env,
      "@cf/mistralai/mistral-small-3.1-24b-instruct",
      {
        messages,
        max_tokens: 4096,
        temperature: 0.7
      }
    );

    let output = cleanAiResponse(extractText(aiRes));

    memory.push({ role: "assistant", content: output, ts: Date.now() });
    await saveMemory(env, memKey, memory);

    return new Response(output, {
      headers: { ...cors, "Content-Type": "text/plain" }
    });

  } catch (e) {
    return new Response("Spider AI Error: " + e.message, {
      status: 500,
      headers: cors
    });
  }
}
