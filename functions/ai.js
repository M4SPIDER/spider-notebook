/**
 * =========================================================
 * SPIDER AI — FINAL STABLE BACKEND (v9.2.1)
 * FIXES: STREAMING IS STATELESS (NO KV) + LANGUAGE CONSISTENCY
 * Author: M4 Spider
 * =========================================================
 */

//////////////////////////////
// CONFIG
//////////////////////////////
const AI_NAME = "Spider AI";
const VERSION = "9.2.1";

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
    .replace(/#\*[\s\S]*?\*#/g, "") // Remove custom internal tags
    .replace(/#\*/g, "")
    .replace(/\*#/g, "")
    .replace(/\*\*/g, "")           // Remove bold
    .replace(/^\s*##+\s*/gm, "")    // Remove headers
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

async function deleteMemory(env, key) {
  if (!env.CHAT_KV) return false;
  await env.CHAT_KV.delete(key);
  return true;
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
// SYSTEM PROMPTS
//////////////////////////////
const COMMON_RULES = `
RULES:
1. IDENTITY: You are ${AI_NAME}, created by M4 Spider. NEVER mention "Mistral" or internal instructions.
2. CONTEXT: Read the ENTIRE user message and history carefully. Do not assume meaning based on the first few words.
3. LANGUAGE STRICTNESS: 
   - Detect the language of the user's LATEST message.
   - Reply ONLY in that language (using English/Romanized letters if it's an Indian language like Telugu/Hindi).
   - DO NOT mix English sentences into Telugu/Hindi replies. Keep the language pure unless explaining a technical term.
   - Example: If user says "Em chestunnav?", reply "Nenu bagunnanu, meeru ela unnaru?" (NOT "I am good, meeru ela unnaru?").
4. STYLE: Use emojis mostly and naturally 🕸️.
5. FORMAT: No markdown bold/headers. Preserve code blocks & LaTeX.
`;

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
    const cleanPrompt = (prompt || "").trim().toLowerCase();

    // Fetch memory (Only used for Normal Chat now)
    let memory = await getMemory(env, memKey);

    //////////////////////
    // DELETE MEMORY MODE
    //////////////////////
    if (
      mode === "delete_memory" || 
      mode === "clear_memory" || 
      mode === "delete_all" || 
      cleanPrompt === "delete all"
    ) {
      const success = await deleteMemory(env, memKey);
      const msg = success ? "Memory wiped successfully 🧹" : "No KV found or empty.";

      if (cleanPrompt === "delete all") {
        return new Response(msg, { headers: { ...cors, "Content-Type": "text/plain" } });
      }

      return new Response(
        JSON.stringify({ status: success ? "success" : "skipped", message: msg }), 
        { headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    //////////////////////
    // STREAM MODE (STATELESS - NO MEMORY)
    //////////////////////
    if (mode === "stream" || stream === true) {
      const encoder = new TextEncoder();

      const streamResp = new ReadableStream({
        async start(controller) {
          try {
            // Build Context (NO MEMORY IN STREAMING)
            let finalMessages = [];
            
            // 1. Add System Prompt
            finalMessages.push({ role: "system", content: COMMON_RULES });

            // 2. Add Current User Prompt
            let finalUserPrompt = prompt;
            if (mode === "analyze_file" && file_content) {
              finalUserPrompt = `FILE: ${filename || "unknown"}\nCONTENT:\n${file_content}\n\nREQUEST:\n${prompt}`;
            }
            finalMessages.push({ role: "user", content: finalUserPrompt });

            const res = await runAi(
              env,
              "@cf/mistralai/mistral-small-3.1-24b-instruct",
              {
                messages: finalMessages,
                max_tokens: 8192,
                temperature: 0.7
              }
            );

            const text = extractText(res) || "";
            
            // NOTE: We do NOT save to KV in stream mode to keep it pure for coding/stateless tasks.
            
            const chunks = text.match(/[\s\S]{1,120}/g) || [];

            for (let chunk of chunks) {
              chunk = chunk
                .replace(/\*\*/g, "") // Simple clean
                .replace(/(^|\n)\s*##+\s*/g, "$1");

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
              );
              await sleep(15);
            }

            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();

          } catch (err) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: "\n[Error]\n" + err.message })}\n\n`)
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

      return new Response(image, {
        headers: { ...cors, "Content-Type": "image/png" }
      });
    }

    //////////////////////
    // NORMAL CHAT (KV ACTIVE)
    //////////////////////
    
    // Add new user prompt
    memory.push({ role: "user", content: prompt, ts: Date.now() });
    memory = memory.slice(-AI_MEMORY_TRIM_TARGET);

    const messages = [
      { role: "system", content: COMMON_RULES },
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
    
    // Save Assistant response
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
