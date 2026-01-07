/**
 * =========================================================
 * SPIDER AI — FINAL STABLE BACKEND
 * SDXL + KV + STREAMING + SAFE OUTPUT
 * Author: M4 Spider
 * =========================================================
 */

//////////////////////////////
// CONFIG
//////////////////////////////
const AI_NAME = "Spider AI";
const VERSION = "9.0.5";

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
// SIMPLE SAFE CLEANER (NON-STREAM)
//////////////////////////////
function cleanAiResponse(text) {
  if (!text) return "";

  return text
    .replace(/#\*[\s\S]*?\*#/g, "")
    .replace(/#\*/g, "")
    .replace(/\*#/g, "")
    .replace(/\*\*/g, "")
    .replace(/^\s*##+\s*/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

//////////////////////////////
// KV MEMORY
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
      stream = false,
      file_content,
      filename
    } = payload;

    const memKey = AI_MEMORY_USER_KEY_PREFIX + user_preference_id;

    //////////////////////
    // STREAM MODE (NO KV)
    //////////////////////
    if (mode === "stream" || stream === true) {
      const encoder = new TextEncoder();

      const streamResp = new ReadableStream({
        async start(controller) {
          try {
            // ---- CONTEXT BUILD ----
            let finalPrompt = prompt;

            if (mode === "analyze_file" && file_content) {
              finalPrompt =
`FILE NAME:
${filename || "unknown"}

FILE CONTENT:
${file_content}

USER REQUEST:
${prompt}`;
            }

            const res = await runAi(
              env,
              "@cf/mistralai/mistral-small-3.1-24b-instruct",
              {
                messages: [
                  {
                    role: "system",
                    content:
                      "Output clean text. Do not use markdown bold or headers. Preserve code blocks, tables, and LaTeX."
                  },
                  { role: "user", content: finalPrompt }
                ],
                max_tokens: 8192,
                temperature: 0.7
              }
            );

            const text = extractText(res) || "";
            const chunks = text.match(/[\s\S]{1,120}/g) || [];

            for (let chunk of chunks) {
              // 🔥 STREAM-SAFE CLEANER (ONLY ** and ##)
              chunk = chunk
                .replace(/\*\*/g, "")
                .replace(/(^|\n)\s*##+\s*/g, "$1");

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ text: chunk })}\n\n`
                )
              );
              await sleep(15);
            }

            controller.enqueue(
              encoder.encode(`data: [DONE]\n\n`)
            );
            controller.close();

          } catch (err) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  text: "\n[Spider AI Stream Error]\n" + err.message
                })}\n\n`
              )
            );
            controller.close();
          }
        }
      });

      return new Response(streamResp, {
        headers: {
          ...cors,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
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
- Do not use ** or ##.
- Preserve tables, code blocks, and LaTeX.
- Use LaTeX for maths.
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

    const output = cleanAiResponse(extractText(aiRes));
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
