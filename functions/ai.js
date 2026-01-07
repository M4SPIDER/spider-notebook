/**
 * =========================================================
 * SPIDER AI — FINAL MF-PROOF BACKEND
 * LM STUDIO BEHAVIOR MATCHED (CLOUDFLARE SAFE)
 * PHONETIC INTENT ENGINE
 * Author: M4 Spider
 * Version: 10.1.0
 * =========================================================
 */

//////////////////////////////
// CONFIG
//////////////////////////////
const AI_MEMORY_TRIM_TARGET = 20;
const AI_MEMORY_TTL_DAYS = 30;
const AI_MEMORY_USER_KEY_PREFIX = "spider_ai_mem:";
const AI_RETRY_LIMIT = 2;
const AI_RETRY_DELAY_BASE = 1200;

//////////////////////////////
// UTILS
//////////////////////////////
const sleep = ms => new Promise(r => setTimeout(r, ms));

//////////////////////////////
// CLEAN RESPONSE
//////////////////////////////
function cleanAiResponse(text) {
  if (!text) return "";
  return text
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
    if (!env.CHAT_KV) return [];
    const raw = await env.CHAT_KV.get(key);
    return raw ? JSON.parse(raw) : [];
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
// SYSTEM PROMPTS (CRITICAL)
//////////////////////////////

const SYSTEM_PROMPT = `
You are Spider AI.

ABSOLUTE RULES:
- Reply ONLY to the most recent user message.
- Do NOT continue conversation on your own.
- Do NOT roleplay the user.
- Do NOT invent actions, replies, or history.
- Never say "Sorry" or "I don't understand".
- Understand by sound and intent, not spelling.
- Phonetic Telugu / Hindi / Hinglish is expected.
- Never comment on grammar or spelling.
- If unsure, reply neutral and short.
- No markdown. Plain text only.
`.trim();

const INTENT_RULES = `
INTENT ENGINE:
Understand meaning by pronunciation.

COMMANDS:
If it sounds like a command, acknowledge or comply briefly.
Do not ask questions.

QUESTIONS:
Answer directly. Do not add extra dialogue.

CASUAL CHAT:
Reply casually. Do not advance conversation.

GENDER / TENSE:
If unclear, stay neutral. Never guess.

ANTI-BULLSHIT:
Never generate filler like:
"I already did"
"Illa. Nenu cheskunnanu"
random self-actions

If no clear reply exists, respond neutral.
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
      file_content,
      filename,
      aspect_ratio = "1:1"
    } = payload;

    const memKey = AI_MEMORY_USER_KEY_PREFIX + user_preference_id;
    const cleanPrompt = (prompt || "").trim(); // 🔥 NO lowercase

    //////////////////////
    // DELETE MEMORY
    //////////////////////
    if (
      mode === "delete_memory" ||
      mode === "clear_memory" ||
      cleanPrompt === "delete all"
    ) {
      const ok = await deleteMemory(env, memKey);
      return new Response(ok ? "Memory cleared 🧹" : "No memory.", {
        headers: { ...cors, "Content-Type": "text/plain" }
      });
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
              `FILE: ${filename || "unknown"}\n\n` +
              `CONTENT:\n${file_content}\n\n` +
              `REQUEST:\n${prompt}`;

            const res = await runAi(
              env,
              "@cf/mistralai/mistral-small-3.1-24b-instruct",
              {
                messages: [
                  { role: "system", content: SYSTEM_PROMPT },
                  { role: "user", content: INTENT_RULES },
                  { role: "user", content: finalPrompt }
                ],
                temperature: 0.5,
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
    // IMAGE GEN
    //////////////////////
    if (mode === "image_gen") {
      const img = await runAi(
        env,
        "@cf/stabilityai/stable-diffusion-xl-base-1.0",
        {
          prompt: `${prompt}, ultra detailed, cinematic lighting`,
          aspect_ratio
        }
      );
      return new Response(img, {
        headers: { ...cors, "Content-Type": "image/png" }
      });
    }

    //////////////////////
    // NORMAL CHAT (LOCKED REPLY TARGET)
    //////////////////////
    let memory = await getMemory(env, memKey);

    // store user message
    memory.push({ role: "user", content: prompt });
    memory = memory.slice(-AI_MEMORY_TRIM_TARGET);

    // 🔒 CRITICAL: force reply only to last message
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: INTENT_RULES },

      // past messages EXCEPT last
      ...memory.slice(0, -1),

      // 🔥 HARD TARGET
      {
        role: "user",
        content: `REPLY ONLY TO THIS MESSAGE:\n${prompt}`
      }
    ];

    const aiRes = await runAi(
      env,
      "@cf/mistralai/mistral-small-3.1-24b-instruct",
      {
        messages,
        temperature: 0.5,
        max_tokens: 1024
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
