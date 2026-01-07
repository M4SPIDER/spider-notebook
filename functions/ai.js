/**
 * =========================================================
 * SPIDER AI — FINAL LM-STUDIO MATCHED BACKEND
 * PHONETIC INTENT ENGINE (CLOUDFLARE SAFE)
 * Author: M4 Spider
 * Version: 10.0.0
 * =========================================================
 */

//////////////////////////////
// CONFIG
//////////////////////////////
const AI_NAME = "Spider AI";
const VERSION = "10.0.0";

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
// SAFE CLEANER (NON-STREAM)
//////////////////////////////
function cleanAiResponse(text) {
  if (!text) return "";
  return text
    .replace(/#\*[\s\S]*?\*#/g, "")
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

async function deleteMemory(env, key) {
  if (!env.CHAT_KV) return false;
  await env.CHAT_KV.delete(key);
  return true;
}

//////////////////////////////
// AI CALL (RETRY SAFE)
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
// SYSTEM PROMPTS (SPLIT — VERY IMPORTANT)
//////////////////////////////

// SHORT SYSTEM PROMPT (CF RESPECTS THIS)
const SYSTEM_PROMPT = `
You are Spider AI.
Understand messages by sound and intent, not spelling.
Phonetic typing is expected.
Never comment on spelling or grammar.
Never say "Sorry, I don't understand".
Reply naturally in the user's language.
`.trim();

// EXTENDED RULES (AS USER MESSAGE — LM STUDIO STYLE)
const INTENT_RULES = `
CORE RULE:
Understand by pronunciation and intent only.

PHONETIC OVERRIDE:
If text looks like Telugu, Hindi, or Hinglish typed in English letters,
ASSUME casual conversation. DO NOT reject.

COMMAND RULE:
If it sounds like a command:
- Do not ask questions
- Acknowledge or comply briefly

GENDER & TENSE SAFETY:
If unclear, stay neutral. Do not guess.

ANTI-HALLUCINATION:
Do not invent emotions or situations.

ABSOLUTE BAN:
Never reply with:
- "Sorry"
- "I don't understand"
- "Can you clarify"

STYLE:
Short, human, friendly.
Emojis allowed.
Plain text only.
`.trim();

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
      file_content,
      filename
    } = payload;

    const memKey = AI_MEMORY_USER_KEY_PREFIX + user_preference_id;
    const cleanPrompt = (prompt || "").trim(); // 🔥 NO LOWERCASE

    //////////////////////
    // MEMORY DELETE
    //////////////////////
    if (
      mode === "delete_memory" ||
      mode === "clear_memory" ||
      cleanPrompt === "delete all"
    ) {
      const success = await deleteMemory(env, memKey);
      return new Response(
        success ? "Memory cleared 🧹" : "No memory found.",
        { headers: { ...cors, "Content-Type": "text/plain" } }
      );
    }

    //////////////////////
    // FILE ANALYSIS (STREAM)
    //////////////////////
    if (mode === "analyze_file") {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const finalPrompt =
              `FILE NAME: ${filename || "unknown"}\n\n` +
              `FILE CONTENT:\n${file_content}\n\n` +
              `USER REQUEST:\n${prompt}`;

            const res = await runAi(
              env,
              "@cf/mistralai/mistral-small-3.1-24b-instruct",
              {
                messages: [
                  { role: "system", content: SYSTEM_PROMPT },
                  { role: "user", content: INTENT_RULES },
                  { role: "user", content: finalPrompt }
                ],
                temperature: 0.55,
                max_tokens: 4096
              }
            );

            const text = extractText(res);
            const chunks = text.match(/[\s\S]{1,120}/g) || [];

            for (const c of chunks) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: c })}\n\n`)
              );
              await sleep(15);
            }

            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (e) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: e.message })}\n\n`)
            );
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: { ...cors, "Content-Type": "text/event-stream" }
      });
    }

    //////////////////////
    // IMAGE GENERATION
    //////////////////////
    if (mode === "image_gen") {
      const img = await runAi(
        env,
        "@cf/stabilityai/stable-diffusion-xl-base-1.0",
        {
          prompt: `${prompt}, cinematic lighting, ultra detailed`,
          aspect_ratio
        }
      );
      return new Response(img, {
        headers: { ...cors, "Content-Type": "image/png" }
      });
    }

    //////////////////////
    // NORMAL CHAT (LM STUDIO STYLE)
    //////////////////////
    let memory = await getMemory(env, memKey);
    memory.push({ role: "user", content: prompt });
    memory = memory.slice(-AI_MEMORY_TRIM_TARGET);

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: INTENT_RULES },
      ...memory
    ];

    const aiRes = await runAi(
      env,
      "@cf/mistralai/mistral-small-3.1-24b-instruct",
      {
        messages,
        temperature: 0.55,
        max_tokens: 2048
      }
    );

    const output = cleanAiResponse(extractText(aiRes));
    memory.push({ role: "assistant", content: output });
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
