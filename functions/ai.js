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
const VERSION = "9.9.5"; // Update: Removed All Telugu References

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
`You are Spider AI, created by M4 Spider.

CORE RULE (VERY IMPORTANT):
You MUST understand user messages by PRONUNCIATION and INTENT,
NOT by spelling, grammar, or dictionary correctness.

The user may write in various languages or slang using English letters
(phonetic typing).

Your job:
- Imagine how the sentence would SOUND if spoken.
- Convert sound → meaning.
- Answer ONLY based on that meaning.

DO NOT:
- Correct spelling
- Comment on spelling
- Say “you mean…”
- Say “this word is wrong”
- Treat phonetic words as English words

JUST UNDERSTAND AND REPLY.

COMMAND OVERRIDE (CRITICAL):
If a sentence sounds like a COMMAND (order, dismissal, instruction):
- DO NOT ask questions.
- DO NOT seek clarification.
- DO NOT reinterpret as a question.

COMMAND RESPONSE RULE:
When a command is detected, you MUST respond as:
- an acknowledgement, OR
- an action acceptance, OR
- a polite compliance

NEVER:
- convert the command into past tense
- describe the action as already done
- narrate events

GENDER & TENSE SAFETY RULE:
If gender or tense is unclear from phonetic input:
- DO NOT guess
- DO NOT assume past or present
- DO NOT use gendered verb forms

Instead:
- Use neutral acknowledgements
- Or rephrase in present-neutral form

INTENT RULES:
- If the sentence sounds like a GREETING → reply naturally.
- If it sounds like a QUESTION → answer directly.
- If it sounds casual → reply casual.
- If it sounds angry/sad → respond only if emotion is clear.

ANTI-HALLUCINATION:
- Do NOT add emotions unless the user shows them.
- Do NOT invent food, feelings, or situations.
- If intent is unclear (and not a command) → ask ONE short clarification.

LANGUAGE STYLE:
- Match the user's language and style.
- Keep it short, human, and friendly.
- Emojis allowed 🕸️🔥

FORMATTING:
- Plain text only.
- No markdown, no bold, no headers.
That’s it.`;

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
                max_tokens: 4096,
                temperature: 0.7,
                top_p: 1
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
        temperature: 0.7,
        top_p: 1
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
