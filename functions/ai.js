/**
 * =========================================================
 * SPIDER AI — FINAL STABLE BACKEND (v9.3.0)
 * FEATURES: STREAMING (NO KV) + TELUGU TRIGGER + ROMANIZED
 * Author: M4 Spider
 * =========================================================
 */

//////////////////////////////
// CONFIG
//////////////////////////////
const AI_NAME = "Spider AI";
const VERSION = "9.3.0";

const AI_MEMORY_TRIM_TARGET = 25;
const AI_MEMORY_TTL_DAYS = 30;
const AI_MEMORY_USER_KEY_PREFIX = "spider_ai_mem:";
const AI_RETRY_LIMIT = 2;
const AI_RETRY_DELAY_BASE = 1500;

//////////////////////////////
// UTILS
//////////////////////////////
const sleep = ms => new Promise(r => setTimeout(r, ms));

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
// LANGUAGE DETECTION (TELUGU)
//////////////////////////////
const TELUGU_TRIGGER_WORDS = [
  "ra","mama","bro","anna","bhai","macha","bossu","babu","nanna","ayya",
  "guru","machi","bhayya","mamma","pilla","raayya","oye","baaga","asalu","bayya",
  "em","enti","endi","emi","ente","ante","ante ga","le","avunu","kadhu",
  "ikkada","akkada","ekkada","ipudu","ipude","nenu","nuvvu","neeku","neetho","mana",
  "meeru","mee","emanna","emi le","emi ra","emi cheppav","yela","yela unnav","yela unnavra",
  "em chesthunav","yela unnav","inka em","inka cheppu","inka em matter","em scene",
  "scene enti","panulu emi","yem ayindi","chill mama","ayyayyo","ayyayyo mama","ayyo",
  "le mama","anta ga","asalu","chusava","chusava mama","unda","unna","unnav",
  "ekkada unnav","nuvvu ekkada","em ra","enti ra","em le","naa peru","mass ga"
];

function buildTeluguRegex(words) {
  const sorted = [...words].sort((a,b)=>b.length - a.length);
  const escaped = sorted.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"));
  const pattern = "\\b(?:" + escaped.join("|") + ")\\b";
  return new RegExp(pattern, "iu");
}
const TELUGU_TRIGGER_REGEX = buildTeluguRegex(TELUGU_TRIGGER_WORDS);

/* ===== REQUIRE 2+ TELUGU WORDS ===== */
function shouldTriggerTelugu(message) {
  if (!message || typeof message !== "string") return false;
  const words = message.toLowerCase().split(/\s+/);
  let count = 0;
  for (const w of words) {
    if (TELUGU_TRIGGER_WORDS.includes(w)) count++;
  }
  return count >= 2;
}

//////////////////////////////
// SYSTEM PROMPTS
//////////////////////////////
const SPIDER_SYSTEM_PROMPT =
"You are M4 Spider AI, made by M4 Spider 🕷️🤖.\n" +
"- Always say you are M4 Spider AI created by M4 Spider 👑.\n" +
"- Use emojis freely in every reply 😄🔥✨.\n" +
"- Use ONLY English letters in all replies 🔤.\n" +
"- Do NOT use any other scripts or letters unless the user explicitly asks to change letters 🚫🈲.\n" +
"- Talk friendly, casual, and human like a close friend 😎🤝.\n" +
"CODE BLOCK RULE:\n" +
"- Always use markdown code blocks for code 💻.\n" +
"- Format: ```language\\ncode here\\n```.\n" +
"- NEVER use single backticks for multi-line code.\n" +
"\n" +
"EMOJI RULE:\n" +
"- Use emojis freely in every reply 😜🎉.\n";

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

    // -- Language Detection Trigger --
    const isTelugu = shouldTriggerTelugu(cleanPrompt);
    let finalSystemPrompt = SPIDER_SYSTEM_PROMPT;
    
    if (isTelugu) {
      finalSystemPrompt += "\n[SYSTEM: DETECTED TELUGU INPUT (Romanized). REPLY STRICTLY IN TELUGU USING ENGLISH LETTERS.]";
    }

    // Fetch memory (Only used for Normal Chat)
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
            finalMessages.push({ role: "system", content: finalSystemPrompt });

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
            
            // NOTE: We do NOT save to KV in stream mode
            
            const chunks = text.match(/[\s\S]{1,120}/g) || [];

            for (let chunk of chunks) {
              chunk = chunk
                .replace(/\*\*/g, "") 
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
      { role: "system", content: finalSystemPrompt },
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
