/**
 * =========================================================
 * SPIDER AI — FINAL STABLE BACKEND (v9.9.77)
 * FEATURES: 120OSS (MAIN) + MISTRAL (PRO) + FLUX 1/2 DEV (GEN/EDIT)
 * FIX: Resolved 'Disturbed Stream' error & Added Image Memory
 * Author: M4 Spider
 * =========================================================
 */

//////////////////////////////
// CONFIG
//////////////////////////////
const AI_NAME = "Spider AI";
const VERSION = "9.9.77";

const AI_MEMORY_TRIM_TARGET = 25;
const AI_MEMORY_TTL_DAYS = 30;
const AI_MEMORY_USER_KEY_PREFIX = "spider_ai_mem:";
const AI_RETRY_LIMIT = 2;
const AI_RETRY_DELAY_BASE = 1500;
const AI_MAX_OUTPUT_LINES = 300; 

// MODELS
const MODEL_STD_CHAT = "@cf/openai/gpt-oss-120b"; 
const MODEL_PRO_CHAT = "@cf/mistralai/mistral-small-3.1-24b-instruct"; 

// UPDATED: Using Flux 1 Dev (Standard on CF Workers AI)
const MODEL_IMAGE_GEN = "@cf/black-forest-labs/flux-2-dev";
const MODEL_ASR = "@cf/openai/whisper-large-v3-turbo";

//////////////////////////////
// UTILS
//////////////////////////////
const sleep = ms => new Promise(r => setTimeout(r, ms));

function cleanAiResponse(text) {
  if (!text) return "";
  return text
    .replace(/#\*[\s\S]*?\*#/g, "") 
    .replace(/#\*/g, "")
    .replace(/\*#/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractText(resp) {
  return (
    resp?.output?.[1]?.content?.[0]?.text ||
    resp?.response ||
    resp?.result ||
    resp?.text ||
    ""
  );
}

const base64ToUint8Array = (base64) => {
    try {
        const cleanBase64 = base64.includes(',') ? base64.split(',').pop() : base64;
        const binaryString = atob(cleanBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    } catch (e) {
        return null;
    }
};

//////////////////////////////
// TAVILY SEARCH INTEGRATION
//////////////////////////////
const SEARCH_TRIGGER_WORDS = [
  "latest", "updated", "news", "today", "current", "live", "recent", "now",
  "price", "stock", "score", "weather", "search for", "google", "find info",
  "movie", "film", "cinema", "release", "cast", "trailer", "review", "ott"
];

function shouldTriggerSearch(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return SEARCH_TRIGGER_WORDS.some(w => lower.includes(w));
}

async function runTavilySearch(env, query) {
  if (!env.TAVILY_API_KEY) return null;
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: env.TAVILY_API_KEY,
        query: query,
        search_depth: "basic",
        include_answer: true,
        max_results: 3
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.results || data.results.length === 0) return null;
    const snippets = data.results.map(r => `• ${r.title}: ${r.content} (${r.url})`).join("\n");
    return `\n[REAL-TIME SEARCH RESULTS FROM WEB]:\n${snippets}\n\n`;
  } catch (e) {
    return null;
  }
}

//////////////////////////////
// SYSTEM PROMPTS
//////////////////////////////
const SPIDER_SYSTEM_PROMPT =
"You are M4 Spider AI, a friendly AI assistant created by M4 Spider 🕷️🤖.\n" +
"RULES:\n" +
"1. IDENTITY: You are M4 Spider AI, running on the custom 'Spider LLM' architecture.\n" +
"2. IMAGE CAPABILITY: You CAN generate and edit images. If a user asks, say YES.\n" +
"3. LANGUAGE: Fluent in all languages. For Indian languages, use ROMANIZED English letters.\n" +
"4. KNOWLEDGE: Updated up to 2026. Today is " + new Date().toDateString() + ".\n" +
"5. FORMATTING: Do NOT use **bold** or # headers in chat text. Only use them inside code blocks.\n";

//////////////////////////////
// KV MEMORY
//////////////////////////////
async function getMemory(env, key) {
  try { return env.CHAT_KV ? JSON.parse(await env.CHAT_KV.get(key)) || [] : []; } catch { return []; }
}
async function saveMemory(env, key, mem) {
  if (!env.CHAT_KV) return;
  await env.CHAT_KV.put(key, JSON.stringify(mem), { expirationTtl: AI_MEMORY_TTL_DAYS * 86400 });
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

//////////////////////////////
// MAIN HANDLER
//////////////////////////////
export async function onRequest(context) {
  const { request, env } = context;
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Ai-Expanded-Prompt"
  };

  if (request.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const payload = await request.json();
    let {
      prompt = "",
      mode = "chat",
      user_preference_id = "anon",
      stream = false,
      file_content,
      filename,
      stream_id,
      image: base64ImageInput
    } = payload;

    const memKey = AI_MEMORY_USER_KEY_PREFIX + user_preference_id;
    let activePrompt = prompt;

    const cleanPrompt = (activePrompt || "").trim().toLowerCase();
    if (file_content?.trim().length > 0) mode = "analyze_file";

    const IMAGE_TRIGGERS = ["generate image", "create image", "make an image", "draw a", "imagine"];
    if (mode === "chat" && IMAGE_TRIGGERS.some(t => cleanPrompt.includes(t))) mode = "image_gen";

    let finalSystemPrompt = SPIDER_SYSTEM_PROMPT;
    let searchContext = "";
    if (shouldTriggerSearch(cleanPrompt)) {
       searchContext = await runTavilySearch(env, activePrompt) || "";
    }

    let memory = await getMemory(env, memKey);

    // DELETE MEMORY
    if (mode === "delete_memory" || cleanPrompt === "delete all") {
      const success = await deleteMemory(env, memKey);
      return new Response(JSON.stringify({ status: success ? "success" : "skipped" }), { headers: cors });
    }

    // IMAGE EDITING (FIXED: MULTIPART FORM DATA PATTERN)
    if (mode === "image_edit") {
        if (!base64ImageInput) return new Response("No image provided", { status: 400, headers: cors });

        const imageBytes = base64ToUint8Array(base64ImageInput);
        const imageBlob = new Blob([imageBytes], { type: 'image/png' });
        
        // Construct FormData exactly like the playground example
        const form = new FormData();
        form.append('prompt', activePrompt || "enhance image");
        form.append('input_image_0', imageBlob);
        form.append('width', '1024');
        form.append('height', '1024');

        // FIXED: Do not consume 'dummyReq.body' manually.
        const dummyReq = new Request('http://dummy', {
          method: 'POST',
          body: form
        });

        try {
            memory.push({ role: "user", content: `[Image Edit Request]: ${activePrompt}` });
            
            const fluxResponse = await runAi(env, MODEL_IMAGE_GEN, {
                multipart: {
                    body: dummyReq.body, // The Worker runtime handles streaming this correctly
                    contentType: dummyReq.headers.get('content-type') || 'multipart/form-data'
                }
            });

            if (fluxResponse instanceof ReadableStream) {
                memory.push({ role: "assistant", content: "I've edited the image for you! 🎨" });
                context.waitUntil(saveMemory(env, memKey, memory.slice(-AI_MEMORY_TRIM_TARGET)));
                return new Response(fluxResponse, { headers: { ...cors, "Content-Type": "image/png" } });
            }

            let resultBase64 = fluxResponse?.image || fluxResponse?.result?.image;
            if (resultBase64) {
                memory.push({ role: "assistant", content: "I've edited the image for you! 🎨" });
                context.waitUntil(saveMemory(env, memKey, memory.slice(-AI_MEMORY_TRIM_TARGET)));
                return new Response(base64ToUint8Array(resultBase64), { headers: { ...cors, "Content-Type": "image/png" } });
            }
            throw new Error("Flux returned no image data");

        } catch (fluxErr) {
            return new Response(JSON.stringify({ 
                error: "Flux Edit Failed", 
                message: fluxErr.message,
                details: "Failed to process multipart stream for Flux 1 Dev"
            }), { status: 500, headers: cors });
        }
    }

    // IMAGE GENERATION (NORMAL TEXT-TO-IMAGE)
    if (mode === "image_gen") {
      try {
        memory.push({ role: "user", content: `[Image Gen Request]: ${activePrompt}` });
        const response = await runAi(env, MODEL_IMAGE_GEN, {
            prompt: activePrompt + ", cinematic, ultra detailed",
            num_steps: 24,
        });

        memory.push({ role: "assistant", content: "Here is the image I imagined! 🌟" });
        context.waitUntil(saveMemory(env, memKey, memory.slice(-AI_MEMORY_TRIM_TARGET)));

        if (response instanceof ReadableStream) {
          return new Response(response, { headers: { ...cors, "Content-Type": "image/png" } });
        }

        let b64 = response?.image || response?.result?.image;
        if (b64) return new Response(base64ToUint8Array(b64), { headers: { ...cors, "Content-Type": "image/png" } });
        
        return new Response("Gen Failed", { status: 500, headers: cors });
      } catch (e) { return new Response(e.message, { status: 500, headers: cors }); }
    }

    // STREAM CHAT (PRO)
    if (stream || mode === "pro") {
      const ACTIVE_MODEL = MODEL_PRO_CHAT;
      const activeStreamId = stream_id || crypto.randomUUID();

      const streamResp = new ReadableStream({
        async start(controller) {
          try {
            const encoder = new TextEncoder();
            let fullText = "";
            let currentPrompt = activePrompt;
            if (mode === "analyze_file" && file_content) currentPrompt = `FILE: ${filename}\nCONTENT:\n${file_content}\n\nREQUEST:\n${activePrompt}`;
            if (searchContext) currentPrompt += `\n\n${searchContext}`;

            memory.push({ role: "user", content: currentPrompt });
            
            const aiPayload = {
               messages: [ { role: "system", content: finalSystemPrompt }, ...memory.map(m=>({role:m.role, content:m.content}))],
               stream: true 
            };

            const aiRes = await env.SPY_AI.run(ACTIVE_MODEL, aiPayload);
            const reader = aiRes.getReader();
            const decoder = new TextDecoder();

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value);
              const lines = chunk.split("\n");
              for (const line of lines) {
                if (line.startsWith("data:")) {
                  try {
                    const json = JSON.parse(line.replace("data:", ""));
                    const text = json.response || json.token || "";
                    if (text) {
                      fullText += text;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text, stream_id: activeStreamId })}\n\n`));
                    }
                  } catch(e){}
                }
              }
            }
            memory.push({ role: "assistant", content: cleanAiResponse(fullText) });
            await saveMemory(env, memKey, memory.slice(-AI_MEMORY_TRIM_TARGET));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (e) { controller.close(); }
        }
      });
      return new Response(streamResp, { headers: { ...cors, "Content-Type": "text/event-stream" } });
    }

    // NORMAL CHAT
    let finalUserPrompt = activePrompt + (searchContext ? `\n\n${searchContext}` : "");
    memory.push({ role: "user", content: finalUserPrompt });
    
    const aiRes = await runAi(env, MODEL_STD_CHAT, {
        instructions: finalSystemPrompt,
        input: memory.slice(-10).map(m => `${m.role==='user'?'User':'Assistant'}: ${m.content}`).join("\n\n") + "\n\nAssistant:",
        max_tokens: 2048
    });

    const output = cleanAiResponse(extractText(aiRes));
    memory.push({ role: "assistant", content: output });
    await saveMemory(env, memKey, memory.slice(-AI_MEMORY_TRIM_TARGET));

    return new Response(output, { headers: { ...cors, "Content-Type": "text/plain" } });

  } catch (e) {
    return new Response("Spider AI Error: " + e.message, { status: 500, headers: cors });
  }
}
