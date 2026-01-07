/* =========================================================
   SPIDER AI — FINAL MIXED BACKEND (SDXL FIXED)
   Author: M4 Spider 🕷️🤖
   Version: 9.0.0
   Endpoint: POST /api/generate/text
   ========================================================= */

//////////////////////////////
// 1. CONFIG
//////////////////////////////
const AI_NAME = "Spider AI";
const AI_VERSION = "9.0.0";

const AI_MEMORY_TRIM_TARGET = 40;
const AI_MEMORY_TTL_DAYS = 30;
const AI_MEMORY_USER_KEY_PREFIX = "spider_ai_mem_v9:";

const AI_RETRY_LIMIT = 3;
const AI_RETRY_DELAY_BASE = 1500;

//////////////////////////////
// 2. UTILS
//////////////////////////////
const sleep = ms => new Promise(r => setTimeout(r, ms));

function log(type, msg) {
  console.log(`[SPIDER_AI][${type}] ${msg}`);
}

//////////////////////////////
// 3. CLEAN OUTPUT (CHAT ONLY)
//////////////////////////////
function cleanAiResponse(text) {
  if (!text) return "";

  const blocks = [];
  const TOKEN = "\u200B\u200C\u200D";

  text = text.replace(/```[\s\S]*?```/g, m => {
    blocks.push(m);
    return `${TOKEN}${blocks.length}${TOKEN}`;
  });

  let c = text
    .replace(/#\*[\s\S]*?\*#/g, "")
    .replace(/#\*/g, "")
    .replace(/\*#/g, "")
    .replace(/^(User:|Assistant:|AI:|Bot:|Model:|Spider AI:)\s*/igm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const restore = new RegExp(`${TOKEN}(\\d+)${TOKEN}`, "g");
  return c.replace(restore, (_, i) => blocks[i - 1]);
}

//////////////////////////////
// 4. KV MEMORY (CHAT ONLY)
//////////////////////////////
async function getMemory(env, key) {
  try {
    if (!env.CHAT_KV) return [];
    return JSON.parse(await env.CHAT_KV.get(key)) || [];
  } catch {
    return [];
  }
}

async function saveMemory(env, key, mem) {
  try {
    if (!env.CHAT_KV) return;
    await env.CHAT_KV.put(key, JSON.stringify(mem), {
      expirationTtl: AI_MEMORY_TTL_DAYS * 86400
    });
  } catch {}
}

//////////////////////////////
// 5. AI EXECUTION WITH RETRY
//////////////////////////////
async function runAiWithRetry(env, model, payload) {
  for (let i = 0; i <= AI_RETRY_LIMIT; i++) {
    try {
      log("AI", `Running ${model}, attempt ${i + 1}`);
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
// 6. STREAM MODE (NO KV)
//////////////////////////////
async function runAiStream(env, messages, writer) {
  const encoder = new TextEncoder();

  const stream = await env.SPY_AI.run(
    "@cf/mistralai/mistral-small-3.1-24b-instruct",
    {
      messages,
      temperature: 0.7,
      max_tokens: 8192,
      stream: true
    }
  );

  for await (const chunk of stream) {
    const text =
      chunk?.delta?.content ||
      chunk?.output_text ||
      chunk?.text ||
      "";

    if (text) {
      await writer.write(encoder.encode(text));
    }
  }
}

//////////////////////////////
// 7. PERFECT SDXL (FROM OLD V8.1.9 — UNCHANGED)
//////////////////////////////
async function runSDXL(env, prompt) {
  const finalPrompt =
    prompt
      .replace(/#image|#gen|generate image/gi, "")
      .trim() +
    ", 8k, photorealistic, cinematic lighting";

  log("SDXL", "Generating image");

  return await runAiWithRetry(
    env,
    "@cf/stabilityai/stable-diffusion-xl-base-1.0",
    { prompt: finalPrompt }
  );
}

//////////////////////////////
// 8. MAIN HANDLER
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
    if (!env.SPY_AI) throw new Error("SPY_AI binding missing");

    // SAFE BODY PARSE
    const ct = request.headers.get("content-type") || "";
    let payload = {};

    if (ct.includes("application/json")) {
      payload = await request.json();
    } else {
      payload.prompt = await request.text();
    }

    const {
      prompt = "",
      mode = "chat"
    } = payload;

    log("ROUTER", `Mode = ${mode}`);

    //////////////////////////////
    // STREAM MODE (NO KV)
    //////////////////////////////
    if (mode === "stream") {
      const messages = [
        { role: "system", content: "Stream full output. Never truncate." },
        { role: "user", content: prompt }
      ];

      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();

      runAiStream(env, messages, writer)
        .then(() => writer.close())
        .catch(err => {
          writer.write(
            new TextEncoder().encode(`\n[STREAM ERROR] ${err.message}\n`)
          );
          writer.close();
        });

      return new Response(readable, {
        headers: {
          ...cors,
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache"
        }
      });
    }

    //////////////////////////////
    // IMAGE GENERATION (SDXL – PERFECT)
    //////////////////////////////
    if (mode === "image_gen") {
      const img = await runSDXL(env, prompt);

      return new Response(img, {
        headers: {
          ...cors,
          "Content-Type": "image/png"
        }
      });
    }

    //////////////////////////////
    // NORMAL CHAT (KV + CLEAN)
    //////////////////////////////
    const userId = "anon";
    const memKey = AI_MEMORY_USER_KEY_PREFIX + userId;

    let mem = await getMemory(env, memKey);
    mem.push({ role: "user", content: prompt, ts: Date.now() });
    mem = mem.slice(-AI_MEMORY_TRIM_TARGET);

    const messages = [
      {
        role: "system",
        content:
          `You are ${AI_NAME} v${AI_VERSION}. ` +
          `Give clean answers. Use Markdown. Use code blocks properly.`
      },
      ...mem.map(m => ({ role: m.role, content: m.content }))
    ];

    const res = await runAiWithRetry(
      env,
      "@cf/mistralai/mistral-small-3.1-24b-instruct",
      {
        messages,
        temperature: 0.7,
        max_tokens: 4096
      }
    );

    const output = cleanAiResponse(extractText(res));

    mem.push({ role: "assistant", content: output, ts: Date.now() });
    await saveMemory(env, memKey, mem);

    return new Response(output, {
      headers: { ...cors, "Content-Type": "text/plain" }
    });

  } catch (e) {
    log("FATAL", e.message);
    return new Response("Spider AI Error: " + e.message, {
      status: 500,
      headers: cors
    });
  }
}
