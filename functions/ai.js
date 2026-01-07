/* =========================================================
   SPIDER AI – FINAL MIXED BACKEND
   Endpoint: POST /api/generate/text
   Author: M4 Spider
   Version: 8.5.0
   Platform: Cloudflare Workers
   ========================================================= */

//////////////////////////////
// 0. CONFIG
//////////////////////////////
const CONFIG = {
  AI_NAME: "Spider AI",
  VERSION: "8.5.0"
};

//////////////////////////////
// 1. SETTINGS (NORMAL MODE)
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
// 3. CLEAN OUTPUT (NORMAL ONLY)
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
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/^\s*[\-\*\+•]+\s*/gm, "")
    .replace(/^(User:|Assistant:|Spider AI:|Bot:|AI:)\s*/igm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const restore = new RegExp(`${TOKEN}(\\d+)${TOKEN}`, "g");
  return c.replace(restore, (_, i) => blocks[i - 1]);
}

//////////////////////////////
// 4. MEMORY (KV – CHAT ONLY)
//////////////////////////////
async function getMemory(env, key) {
  try {
    return env.CHAT_KV
      ? JSON.parse(await env.CHAT_KV.get(key)) || []
      : [];
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
// 5. AI CALL – NORMAL CHAT
//////////////////////////////
async function runAi(env, model, messages) {
  for (let i = 0; i <= AI_RETRY_LIMIT; i++) {
    try {
      return await env.SPY_AI.run(model, {
        messages,
        temperature: 0.7,
        max_tokens: 4096
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
// 6. AI CALL – STREAM MODE (NO KV)
//////////////////////////////
async function runAiStream(env, model, messages, writer) {
  const encoder = new TextEncoder();

  const stream = await env.SPY_AI.run(model, {
    messages,
    temperature: 0.7,
    max_tokens: 8192,
    stream: true
  });

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
// 7. IMAGE GENERATION – SDXL
//////////////////////////////
async function runSDXL(env, prompt, aspectRatio = "1:1") {
  let width = 1024, height = 1024;

  if (aspectRatio === "16:9") {
    width = 1024; height = 576;
  } else if (aspectRatio === "9:16") {
    width = 576; height = 1024;
  } else if (aspectRatio === "4:3") {
    width = 1024; height = 768;
  }

  const res = await env.SPY_AI.run(
    "@cf/stabilityai/stable-diffusion-xl-base-1.0",
    {
      prompt,
      num_steps: 30,
      guidance: 7.5,
      width,
      height
    }
  );

  return res?.image || res?.base64 || null;
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
    // 🔥 SAFE BODY PARSE (JSON OR TEXT)
    const ct = request.headers.get("content-type") || "";
    let payload = {};

    if (ct.includes("application/json")) {
      payload = await request.json();
    } else {
      payload.prompt = await request.text();
    }

    const {
      prompt = "",
      mode = "chat",
      aspect_ratio = "1:1"
    } = payload;

    //////////////////////////////
    // 🔥 STREAM MODE
    //////////////////////////////
    if (mode === "stream") {
      const messages = [
        { role: "system", content: "Stream full output. Never truncate." },
        { role: "user", content: prompt }
      ];

      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();

      runAiStream(
        env,
        "@cf/mistralai/mistral-small-3.1-24b-instruct",
        messages,
        writer
      )
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
    // 🎨 IMAGE GENERATION (SDXL)
    //////////////////////////////
    if (mode === "image_gen") {
      const base64 = await runSDXL(env, prompt, aspect_ratio);

      return new Response(
        JSON.stringify({ base64_image: base64 }),
        {
          headers: {
            ...cors,
            "Content-Type": "application/json"
          }
        }
      );
    }

    //////////////////////////////
    // ✅ NORMAL CHAT MODE
    //////////////////////////////
    const userId = "anon";
    const memKey = AI_MEMORY_USER_KEY_PREFIX + userId;

    let mem = await getMemory(env, memKey);
    mem.push({ role: "user", content: prompt, ts: Date.now() });
    mem = mem.slice(-AI_MEMORY_TRIM_TARGET);

    const messages = [
      { role: "system", content: "You are Spider AI. Give correct answers." },
      ...mem.map(m => ({ role: m.role, content: m.content }))
    ];

    const res = await runAi(
      env,
      "@cf/mistralai/mistral-small-3.1-24b-instruct",
      messages
    );

    const output = cleanAiResponse(extractText(res));

    mem.push({ role: "assistant", content: output, ts: Date.now() });
    await saveMemory(env, memKey, mem);

    return new Response(output, {
      headers: { ...cors, "Content-Type": "text/plain" }
    });

  } catch (e) {
    return new Response("Error: " + e.message, {
      status: 500,
      headers: cors
    });
  }
}
