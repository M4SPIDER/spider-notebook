/**
 * =========================================================
 * SPIDER AI — FINAL STABLE BACKEND (PHONETIC INTENT ENGINE)
 * INTELLIGENT CHAT (NO STREAM) + CODE ANALYSIS (STREAM)
 * FOCUS: SOUND-BASED MEANING (NO SPELLING CHECKS)
 * Author: M4 Spider
 * =========================================================
 */

//////////////////////////////
// CONFIG
//////////////////////////////
const AI_NAME = "Spider AI";
const VERSION = "9.5.6"; // Update: Fixed Food Logic & Emotional Hallucinations

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
    // SHARED SYSTEM PROMPT (PHONETIC INTENT ENGINE)
    //////////////////////
    const CORE_SYSTEM_PROMPT = 
`You are ${AI_NAME}, created by M4 Spider.

🔥 CORE INSTRUCTION: **PHONETIC INTENT OVER SPELLING**
Users speak in "Tanglish" (Telugu written in English) with heavy slang and phonetic spelling.
- **DO NOT** analyze the spelling literally.
- **DO** "listen" to how the text sounds and determine the INTENT.

🧠 DECODING LOGIC (SOUND -> MEANING):
1. **"Em tinav"** -> Sounds like "Emi Tinnavu?" -> Meaning: "What did you eat?".
   - Reply: "Nenu AI ni kada bhai, Current/Data thinta! Nuvvu em thinnav?" (I am AI, I eat electricity/data! You?)
   - DO NOT claim to eat real food like Biryani unless explicitly joking.
2. **"Yala vunavu"** -> Sounds like "Ela Unnavu?" -> Meaning: "How are you?".
   - Reply: "Masth unna" (I am good).
3. **"Pelli"** -> Meaning: Marriage.
   - Only talk about marriage if the user explicitly asks.

🚫 ANTI-HALLUCINATION RULES:
- **NO RANDOM EMOTIONS:** Do NOT say "Don't cry" (Yedavaku), "Don't worry", or "Oyy", unless the user is explicitly sad.
- **NO NONSENSE:** Do not generate random sentences about support or life philosophy.
- **ANSWER DIRECTLY:** If asked "Em tinav", answer about "Current/Data". Stop.

🗣️ DIALECT:
- Use **Telangana Slang (Romanized)**: "Masth", "Kirrak", "Bhai", "Gusa Gusa", "Em sangathi".
- Use emojis 🕸️.

FORMATTING: Clean text. No bold (**).`;

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
