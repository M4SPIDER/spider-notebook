/**
 * =========================================================
 * SPIDER AI — FINAL STABLE BACKEND (FIXED STREAMING)
 * SDXL + KV + STREAMING + PARSED SSE
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

/**
 * CLEANER
 * Removes specific markdown artifacts while preserving 
 * structure for tables, code, and math.
 */
function cleanAiResponse(text) {
  if (!text) return "";

  return text
    // 1. Remove internal AI artifacts
    .replace(/#\*[\s\S]*?\*#/g, "")
    .replace(/#\*/g, "")
    .replace(/\*#/g, "")

    // 2. Remove markdown emphasis (keeping text)
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")

    // 3. Remove markdown headers but keep the text
    .replace(/^\s*#{1,6}\s*/gm, "")
    
    // 4. Clean up excessive newlines
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
      stream = false
    } = payload;

    const memKey = AI_MEMORY_USER_KEY_PREFIX + user_preference_id;

    //////////////////////
    // STREAM MODE (PARSED SSE)
    //////////////////////
    if (mode === "stream" || stream === true) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      let contextPrompt = prompt;
      if (payload.mode === "analyze_file" && payload.file_content) {
        contextPrompt = `FILE: ${payload.filename || 'uploaded_file'}\nCONTENT:\n${payload.file_content}\n\nUSER REQUEST: ${prompt}`;
      }

      const aiStream = await env.SPY_AI.run(
        "@cf/mistralai/mistral-small-3.1-24b-instruct",
        {
          messages: [
            { 
              role: "system", 
              content: "You are Spider AI. Use plain text. No bold (**), no headers (#). Keep tables and code blocks standard." 
            },
            { role: "user", content: contextPrompt }
          ],
          stream: true
        }
      );

      const streamResp = new ReadableStream({
        async start(controller) {
          const reader = aiStream.getReader();
          let buffer = "";

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              // Append new chunk to buffer and split by SSE lines
              buffer += decoder.decode(value, { stream: true });
              let lines = buffer.split("\n");
              buffer = lines.pop(); // Keep partial line in buffer

              for (const line of lines) {
                const sseLine = line.trim();
                if (!sseLine || !sseLine.startsWith("data:")) continue;
                if (sseLine === "data: [DONE]") continue;

                try {
                  // Parse the JSON inside the SSE data: string
                  const jsonStr = sseLine.replace(/^data:\s*/, "");
                  const parsed = JSON.parse(jsonStr);
                  const rawContent = parsed.response || "";

                  // Clean the content before sending
                  // We clean character by character or word by word here
                  // Warning: cleaning "incomplete" markdown might be tricky,
                  // so we mainly remove stray hashes here.
                  const cleanContent = rawContent.replace(/#/g, "");

                  if (cleanContent) {
                    const outputPayload = JSON.stringify({ response: cleanContent });
                    controller.enqueue(encoder.encode(`data: ${outputPayload}\n\n`));
                  }
                } catch (e) {
                  // Ignore parse errors for keep-alive or malformed chunks
                }
              }
            }
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
          } catch (err) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: "Stream Error" })}\n\n`));
            controller.close();
          }
        }
      });

      return new Response(streamResp, {
        headers: {
          ...cors,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        }
      });
    }

    //////////////////////
    // IMAGE GENERATION
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
      return new Response(image, { headers: { ...cors, "Content-Type": "image/png" } });
    }

    //////////////////////
    // NORMAL CHAT (KV)
    //////////////////////
    let memory = await getMemory(env, memKey);
    memory.push({ role: "user", content: prompt, ts: Date.now() });
    memory = memory.slice(-AI_MEMORY_TRIM_TARGET);

    const systemPrompt = `You are ${AI_NAME} v${VERSION}. Rules: No #* artifacts. Preserves tables, code, and LaTeX. Use \\[ \\] for math.`;

    const aiRes = await runAi(
      env,
      "@cf/mistralai/mistral-small-3.1-24b-instruct",
      {
        messages: [{ role: "system", content: systemPrompt }, ...memory.map(m => ({ role: m.role, content: m.content }))],
        max_tokens: 4096,
        temperature: 0.7
      }
    );

    const output = cleanAiResponse(extractText(aiRes));
    memory.push({ role: "assistant", content: output, ts: Date.now() });
    await saveMemory(env, memKey, memory);

    return new Response(output, { headers: { ...cors, "Content-Type": "text/plain" } });

  } catch (e) {
    return new Response("Spider AI Error: " + e.message, { status: 500, headers: cors });
  }
}
