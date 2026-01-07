/**
 * =========================================================
 * SPIDER AI — FINAL STABLE BACKEND (UNIVERSAL ENGINE)
 * INTELLIGENT CHAT (NO STREAM) + CODE ANALYSIS (STREAM)
 * GLOBAL LANGUAGE DETECT + NO FORCED DIALECTS
 * Author: M4 Spider
 * =========================================================
 */

//////////////////////////////
// CONFIG
//////////////////////////////
const AI_NAME = "Spider AI";
const VERSION = "9.7.0"; // Update: Global Language Auto-Detect (Removed Dialect Forcing)

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

// NEW: Delete Memory Function
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

    //////////////////////
    // 1. DELETE MEMORY
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
        JSON.stringify({ 
          status: success ? "success" : "skipped", 
          message: msg 
        }), 
        { headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    //////////////////////
    // SHARED SYSTEM PROMPT (UNIVERSAL INTELLIGENCE)
    //////////////////////
    const CORE_SYSTEM_PROMPT = 
`You are Spider AI, created by M4 Spider.

🌍 GLOBAL LANGUAGE & INTENT ENGINE:
1. **AUTO-DETECT LANGUAGE**: Listen to the user's input. Identify if it is English, Telugu, Hindi, Spanish, etc.
2. **MATCH THE USER**: 
   - If they speak English, reply in English.
   - If they speak Telugu, reply in Telugu.
   - If they mix languages (Tanglish/Hinglish), reply in the same style.
3. **NO FORCED DIALECTS**: Do NOT force Telangana, Andhra, or any specific slang unless the user uses it first. Be natural.

🧠 PHONETIC UNDERSTANDING:
- Users often type phonetically (e.g., "Yala" instead of "Ela").
- Understand the *sound* and *meaning* behind the spelling.
- Never complain about spelling or grammar.

COMMAND HANDLING:
If the input is a COMMAND (e.g., "Stop", "Paduko", "Exit"):
- Acknowledge briefly (e.g., "Okay", "Done", "Sare").
- Do NOT narrate your actions in the past tense.

STYLE:
- Smart, friendly, and concise.
- Use emojis naturally 🕸️.
- Plain text only (no bold/headers).`;

    //////////////////////
    // 2. STREAMING MODE (ONLY FOR FILE ANALYSIS)
    //////////////////////
    if (mode === "analyze_file") {
      const encoder = new TextEncoder();
      const streamResp = new ReadableStream({
        async start(controller) {
          try {
            let finalPrompt = `FILE NAME: ${filename || "unknown"}\nFILE CONTENT: ${file_content}\nUSER REQUEST: ${prompt}`;

            const res = await runAi(
              env,
              "@cf/mistralai/mistral-small-3.1-24b-instruct",
              {
                messages: [
                  { role: "system", content: CORE_SYSTEM_PROMPT },
                  { role: "user", content: finalPrompt }
                ],
                max_tokens: 8192,
                temperature: 0.7
              }
            );

            const text = extractText(res) || "";
            const chunks = text.match(/[\s\S]{1,120}/g) || [];

            for (let chunk of chunks) {
              chunk = chunk.replace(/\*\*/g, "").replace(/(^|\n)\s*##+\s*/g, "$1");
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
              await sleep(15);
            }
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
          } catch (err) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: "\n[Error] " + err.message })}\n\n`));
            controller.close();
          }
        }
      });
      return new Response(streamResp, { headers: { ...cors, "Content-Type": "text/event-stream" } });
    }

    //////////////////////
    // 3. IMAGE GENERATION
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
    // 4. NORMAL CHAT (NO STREAM - FULL RESPONSE)
    //////////////////////
    let memory = await getMemory(env, memKey);
    memory.push({ role: "user", content: prompt, ts: Date.now() });
    memory = memory.slice(-AI_MEMORY_TRIM_TARGET);

    const messages = [
      { role: "system", content: CORE_SYSTEM_PROMPT },
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
