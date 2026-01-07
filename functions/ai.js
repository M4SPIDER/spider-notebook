/**
 * =========================================================
 * SPIDER AI — ENHANCED BACKEND
 * SDXL + KV + SSE STREAMING + FULL CODE MODE
 * Author: M4 Spider
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
const AI_MEMORY_STREAM_PREFIX = "spider_stream:";
const AI_RETRY_LIMIT = 2;
const AI_RETRY_DELAY_BASE = 1500;

// Full code mode configurations
const FULL_CODE_TRIGGERS = [
  'full code', 'complete code', 'entire code', 'full implementation',
  'complete project', 'entire project', 'all files', 'multiple files',
  'project structure', 'file structure', 'with frontend and backend'
];

//////////////////////////////
// UTILS
//////////////////////////////
const sleep = ms => new Promise(r => setTimeout(r, ms));

const generateStreamId = () => `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const isFullCodeRequest = (prompt) => {
  const lower = prompt.toLowerCase();
  return FULL_CODE_TRIGGERS.some(trigger => lower.includes(trigger));
};

//////////////////////////////
// ENHANCED SAFE CLEANER
//////////////////////////////
function cleanAiResponse(text, isFullCode = false) {
  if (!text) return "";

  if (isFullCode) {
    // For full code mode, preserve ALL code structure
    return text
      .replace(/#\*[\s\S]*?\*#/g, "")
      .replace(/#\*/g, "")
      .replace(/\*#/g, "")
      .trim();
  }

  return text
    // remove forbidden internal artifacts
    .replace(/#\*[\s\S]*?\*#/g, "")
    .replace(/#\*/g, "")
    .replace(/\*#/g, "")

    // remove markdown emphasis only
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")

    // remove markdown headers only
    .replace(/^\s*#{1,6}\s*/gm, "")

    // normalize spacing
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

//////////////////////////////
// KV MEMORY & STREAM STORAGE
//////////////////////////////
async function getMemory(env, key) {
  try {
    return env.CHAT_KV ? JSON.parse(await env.CHAT_KV.get(key)) || [] : [];
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

async function saveStreamContext(env, streamId, context) {
  if (!env.CHAT_KV) return;
  await env.CHAT_KV.put(
    `${AI_MEMORY_STREAM_PREFIX}${streamId}`,
    JSON.stringify(context),
    { expirationTtl: 3600 } // Keep for 1 hour for continuation
  );
}

async function getStreamContext(env, streamId) {
  try {
    return env.CHAT_KV 
      ? JSON.parse(await env.CHAT_KV.get(`${AI_MEMORY_STREAM_PREFIX}${streamId}`))
      : null;
  } catch {
    return null;
  }
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
// STREAMING RESPONSE GENERATOR
//////////////////////////////
function createSSEStream(text, streamId, isFullCode = false) {
  const encoder = new TextEncoder();
  let processed = 0;
  
  return new ReadableStream({
    async start(controller) {
      // Send initial metadata
      controller.enqueue(encoder.encode(
        `data: ${JSON.stringify({ stream_id: streamId, is_full_code: isFullCode })}\n\n`
      ));
      
      // Process text in chunks (word by word for smooth streaming)
      const words = text.split(' ');
      const totalWords = words.length;
      let currentText = '';
      
      for (let i = 0; i < totalWords; i++) {
        const word = words[i];
        currentText += (i > 0 ? ' ' : '') + word;
        processed++;
        
        // Send chunk every 3 words or at punctuation
        if (i % 3 === 0 || word.match(/[.!?;]/) || i === totalWords - 1) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ text: currentText, progress: Math.round((i + 1) / totalWords * 100) })}\n\n`
          ));
          currentText = '';
          
          // Keep-alive heartbeat every 10 chunks
          if (i % 30 === 0) {
            controller.enqueue(encoder.encode(`: keep-alive\n\n`));
          }
          
          // Small delay for realistic typing effect
          await sleep(30 + Math.random() * 70);
        }
      }
      
      // Send completion marker
      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();
    }
  });
}

//////////////////////////////
// FULL CODE MODE PROMPT ENHANCER
//////////////////////////////
function enhancePromptForFullCode(prompt, projectType = 'web') {
  const basePrompt = `You are ${AI_NAME}, an expert software architect. The user wants a complete, production-ready project.

REQUIREMENTS:
1. Generate COMPLETE, WORKING code
2. Include ALL necessary files
3. Show proper file structure
4. Include package.json/requirements.txt if needed
5. Add comments and documentation
6. Separate files clearly with headers like:
   ## File: filename.js
   or
   // File: filename.py

PROJECT TYPE: ${projectType}

USER REQUEST: ${prompt}

Now generate the complete project with all files:`;

  return basePrompt;
}

//////////////////////////////
// ROUTE HANDLERS
//////////////////////////////
async function handleStreamRequest(env, payload) {
  const {
    prompt = "",
    user_preference_id = "anon",
    full_code_mode = false,
    project_type = "web",
    stream = true
  } = payload;

  const streamId = generateStreamId();
  
  // Enhance prompt for full code mode
  const enhancedPrompt = full_code_mode 
    ? enhancePromptForFullCode(prompt, project_type)
    : prompt;

  // Get AI response
  const aiRes = await runAi(
    env,
    "@cf/mistralai/mistral-small-3.1-24b-instruct",
    {
      messages: [{ role: "user", content: enhancedPrompt }],
      max_tokens: 8192
    }
  );

  const text = extractText(aiRes);
  const cleanedText = cleanAiResponse(text, full_code_mode);

  // Save context for possible continuation
  await saveStreamContext(env, streamId, {
    prompt: enhancedPrompt,
    response: cleanedText,
    timestamp: Date.now(),
    user_id: user_preference_id,
    full_code_mode,
    project_type
  });

  // Return SSE stream
  return createSSEStream(cleanedText, streamId, full_code_mode);
}

async function handleContinueRequest(env, payload) {
  const { stream_id, user_preference_id = "anon" } = payload;
  
  if (!stream_id) {
    throw new Error("stream_id is required for continuation");
  }

  // Get previous context
  const context = await getStreamContext(env, stream_id);
  if (!context) {
    throw new Error("Stream context not found or expired");
  }

  // Continue from where we left off
  const continuationPrompt = `Continue generating the ${context.full_code_mode ? 'project' : 'response'} from the previous context. Previous response was about: "${context.response.substring(0, 200)}..."\n\nPlease continue with the rest:`;

  const aiRes = await runAi(
    env,
    "@cf/mistralai/mistral-small-3.1-24b-instruct",
    {
      messages: [{ role: "user", content: continuationPrompt }],
      max_tokens: 8192
    }
  );

  const text = extractText(aiRes);
  const cleanedText = cleanAiResponse(text, context.full_code_mode);
  
  // Generate new stream ID for continuation
  const newStreamId = generateStreamId();
  
  // Save updated context
  await saveStreamContext(env, newStreamId, {
    ...context,
    response: context.response + cleanedText,
    timestamp: Date.now(),
    continued_from: stream_id
  });

  return createSSEStream(cleanedText, newStreamId, context.full_code_mode);
}

async function handleImageRequest(env, payload) {
  const { prompt = "", aspect_ratio = "1:1" } = payload;
  
  const image = await runAi(
    env,
    "@cf/stabilityai/stable-diffusion-xl-base-1.0",
    {
      prompt: `${prompt}, ultra detailed, cinematic lighting`,
      aspect_ratio
    }
  );

  return image;
}

async function handleChatRequest(env, payload) {
  const {
    prompt = "",
    user_preference_id = "anon",
    full_code_mode = false,
    project_type = "web"
  } = payload;

  const memKey = AI_MEMORY_USER_KEY_PREFIX + user_preference_id;
  let memory = await getMemory(env, memKey);

  memory.push({ role: "user", content: prompt, ts: Date.now() });
  memory = memory.slice(-AI_MEMORY_TRIM_TARGET);

  // Enhance system prompt for full code mode
  const systemPrompt = full_code_mode ? `
You are ${AI_NAME} v${VERSION} - Expert Software Architect.

FULL CODE MODE RULES:
1. Generate COMPLETE, production-ready code
2. Structure response with clear file separation
3. Use headers like: ## File: filename.js
4. Include ALL necessary files
5. Add installation instructions if needed
6. Include package.json/requirements.txt for dependencies
7. Add comments and documentation

PROJECT TYPE: ${project_type}

FORMATTING:
- Use code blocks with language specification
- Separate files with clear headers
- Include file paths for structure

USER REQUEST: ${prompt}
` : `
You are ${AI_NAME} v${VERSION}.

GENERAL RULES:
- Use clear, human-readable language.
- Never output #* or *# artifacts.

MATHS RULES:
- ALWAYS use LaTeX for mathematical equations.
- Inline maths: \\( ... \\)
- Display maths:
  \\[
  ...
  \\]
- Show step-by-step derivations.
- Box final answers using:
  \\[
  \\boxed{...}
  \\]

COMPARISON RULES:
- If the user asks to compare two or more things:
  → USE A MARKDOWN TABLE.
- Put ALL comparison data ONLY inside the table.
- Do NOT explain before or after unless explicitly asked.

FORMATTING:
- Use tables for comparisons.
- Use code blocks for code.
- Do not convert tables or maths into plain text.
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

  const output = cleanAiResponse(extractText(aiRes), full_code_mode);

  memory.push({ role: "assistant", content: output, ts: Date.now() });
  await saveMemory(env, memKey, memory);

  return output;
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
    const url = new URL(request.url);
    const path = url.pathname;
    const payload = await request.json();

    // Route based on path
    if (path.includes('/generate/continue')) {
      const stream = await handleContinueRequest(env, payload);
      return new Response(stream, {
        headers: {
          ...cors,
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

    const { mode = "chat", stream = false } = payload;

    if (mode === "image_gen") {
      const image = await handleImageRequest(env, payload);
      return new Response(image, {
        headers: { ...cors, "Content-Type": "image/png" }
      });
    }

    if (stream || mode === "stream") {
      const stream = await handleStreamRequest(env, payload);
      return new Response(stream, {
        headers: {
          ...cors,
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

    // Default chat mode
    const output = await handleChatRequest(env, payload);
    return new Response(output, {
      headers: { ...cors, "Content-Type": "text/plain" }
    });

  } catch (e) {
    console.error("Spider AI Error:", e);
    return new Response(JSON.stringify({ 
      error: "Spider AI Error", 
      message: e.message 
    }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }
}
