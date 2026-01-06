/* ============================================================
  SPIDER AI — V6.3 (STABLE, RAW OUTPUT, RETRY-LOGIC)
  - CRITICAL CHANGE: Removed sanitizeOutput entirely as requested.
  - LOGIC: Output is now 100% raw from the model to prevent formatting issues.
  - FEATURE: Exponential backoff retry logic retained.
  - FEATURE: Auto-Hindi/Telugu detection retained.
  - STATUS: RAW OUTPUT MODE.
============================================================ */

/* ===== CONFIG ===== */
const MEMORY_MESSAGE_LIMIT = 200;
const MEMORY_TRIM_TARGET = 200;
const MEMORY_TTL_DAYS = 30;
const MEMORY_SUMMARY_TRIGGER = 300;
const MEMORY_USER_KEY_PREFIX = "chat_memory_v2:"; 
const FIREBASE_PROJECT_ID = "m4-spider";

/* ===== AI CONFIGURATION ===== */
// Retry failed AI calls up to 2 times to prevent random 500 errors
const AI_RETRY_LIMIT = 2;
const AI_RETRY_DELAY_BASE = 1000; // 1 second

/* ===== TELUGU TRIGGER WORDS ===== */
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

/* ===== HINDI TRIGGER WORDS ===== */
const HINDI_TRIGGER_WORDS = [
  "kya", "kaise", "kab", "kahan", "kyun", "main", "tum", "aap", "hum",
  "haan", "nahi", "theek", "acha", "bhai", "dost", "yaar", "namaste",
  "shukriya", "dhanyavad", "madad", "sun", "suno", "bolo", "batao",
  "karo", "kar", "raha", "rahe", "thi", "tha", "hai", "hain", "karna",
  "chahiye", "lekin", "magar", "agar", "phir", "baad", "pehle", "samjhe",
  "matlab", "bilkul", "kaam", "naam", "aaj", "kal", "abhi"
];

/* ===== REQUIRE 2+ HINDI WORDS ===== */
function shouldTriggerHindi(message) {
  if (!message || typeof message !== "string") return false;
  const words = message.toLowerCase().split(/\s+/);
  let count = 0;
  for (const w of words) {
    if (HINDI_TRIGGER_WORDS.includes(w)) count++;
  }
  return count >= 2;
}

/* ============================================================
  MAIN SYSTEM PROMPT
============================================================ */
const SPIDER_SYSTEM_PROMPT =
"You are M4 Spider AI, made by M4 Spider 🕷️🤖.\n" +
"- Always say you are M4 Spider AI created by M4 Spider 👑.\n" +
"- Talk friendly, casual, and human like a close friend 😎🤝.\n" +
"- Use emojis freely in every reply 😜🎉.\n" +
"\n" +
"LANGUAGE RULE:\n" +
"- You can understand and speak ANY language (Hindi, Spanish, Telugu, French, etc.).\n" +
"- DEFAULT OUTPUT: Use English letters (Transliteration) for non-English languages unless the user explicitly asks for the native script.\n" +
"- Example: Instead of 'नमस्ते', say 'Namaste'.\n" +
"\n" +
"FORMATTING & KNOWLEDGE:\n" +
"- Use Markdown Tables for comparisons. Make them clean and detailed.\n" +
"- Use Lists for steps.\n" +
"- Be highly intelligent, detailed, and precise, matching the quality of GPT-4 or DeepSeek.\n" +
"\n" +
"CODE BLOCK RULE (STRICT):\n" +
"- **ALWAYS** use markdown code blocks for code: ```language\\ncode here\\n```.\n" +
"- **NEVER** write code as plain text.\n" +
"- **PROVIDE COMPLETE CODE:** Do NOT use placeholders like `// ... rest of code` or `<!-- existing code -->`. Write out the FULL file every time.\n" +
"- Add comments to explain complex logic.\n";

/* ============================================================
  FIREBASE TOKEN VERIFIER
============================================================ */
async function verifyFirebaseToken(idToken) {
  if (!idToken) return null;
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) return null;
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    const kid = header.kid;
    const firebaseKeys = await fetch(
      "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
    ).then(r => r.json());
    const cert = firebaseKeys[kid];
    if (!cert) return null;
    const pem = cert
      .replace("-----BEGIN CERTIFICATE-----", "")
      .replace("-----END CERTIFICATE-----", "")
      .replace(/\s+/g, "");
    const binaryDer = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
      "spki",
      binaryDer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      true,
      ["verify"]
    );
    const signature = parts[2].replace(/-/g, "+").replace(/_/g, "/");
    const signatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      signatureBytes,
      new TextEncoder().encode(parts[0] + "." + parts[1])
    );
    if (!valid) return null;
    if (payload.aud !== FIREBASE_PROJECT_ID) return null;
    if (payload.iss !== ("https://securetoken.google.com/" + FIREBASE_PROJECT_ID)) return null;
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/* ============================================================
  MODE DETECTOR
============================================================ */
function detectMode(prompt, file_content, filename) {
  if (file_content || filename) return "analyze_file";
  const t = (prompt || "").toLowerCase();
  
  // File Analysis Triggers
  if (t.includes("analyze file") || t.includes("clean code") || t.includes("debug"))
    return "analyze_file";
    
  // Image Generation Triggers
  if (t.includes("generate image") || t.includes("image of") || t.includes("create image")) 
    return "image_gen";
    
  // Image Editing Triggers
  if (t.includes("edit image") || t.includes("modify image")) 
    return "image_edit";
    
  // Search Triggers
  if (t.startsWith("#search:") || t.startsWith("search:")) 
    return "search";
    
  // Default to Chat
  return "chat";
}

/* Detect internal search instruction */
function extractSearchInstruction(text) {
  if (!text || typeof text !== "string") return null;
  const t = text.trim();

  try {
    const maybe = JSON.parse(t);
    if (maybe && maybe.action && maybe.query) {
      return { action: String(maybe.action).toLowerCase(), query: String(maybe.query) };
    }
  } catch (_) {}

  const jsonMatch = t.match(/\{[^}]*"action"[^}]*\}/);
  if (jsonMatch) {
    try {
      const maybe = JSON.parse(jsonMatch[0]);
      if (maybe && maybe.action && maybe.query) {
        return { action: String(maybe.action).toLowerCase(), query: String(maybe.query) };
      }
    } catch (_) {}
  }

  const hashMatch = t.match(/#?search[:\s]+(.+)/i);
  if (hashMatch && hashMatch[1]) {
    return { action: "search", query: hashMatch[1].trim() };
  }

  return null;
}

/* ================= MEMORY HELPERS ========================== */

async function getMemoryFromKV(env, memoryKey) {
  try {
    if (!env.CHAT_KV) throw new Error("CHAT_KV is not bound.");
    const raw = await env.CHAT_KV.get(memoryKey);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error reading KV memory for key:", memoryKey, e);
    return [];
  }
}

async function saveMemoryToKV(env, memoryKey, mem) {
  try {
    if (!env.CHAT_KV) throw new Error("CHAT_KV is not bound.");
    await env.CHAT_KV.put(memoryKey, JSON.stringify(mem), { expirationTtl: MEMORY_TTL_DAYS * 24 * 60 * 60 });
  } catch (e) {
    console.error("Error saving KV memory for key:", memoryKey, e);
  }
}

/* ================== COMPRESSION ============= */

async function compressMemoryIfNeeded(env, memoryArr) {
  if (memoryArr.length < MEMORY_SUMMARY_TRIGGER) return memoryArr;
  const keepRecent = Math.floor(MEMORY_TRIM_TARGET / 2);
  const older = memoryArr.slice(0, memoryArr.length - keepRecent);

  function shortPreview(s, max = 200) {
    if (!s) return "";
    let t = s.replace(/\s+/g, " ").trim();
    return t.length <= max ? t : t.slice(0, max).trim() + "...";
  }

  const summaryPrompt =
    "Summarize these messages in 3 bullet points. Keep only important context.\n\n" +
    older.map((m, i) => (i + 1) + ". " + m.role + ": " + shortPreview(m.content, 200)).join("\n");

  try {
    const res = await runAIWithRetry(env, "@cf/mistralai/mistral-small-3.1-24b-instruct", {
      messages: [
        { role: "system", content: SPIDER_SYSTEM_PROMPT },
        { role: "user", content: summaryPrompt }
      ]
    });

    // RAW OUTPUT: No sanitization here
    const summary = extractText(res).trim();

    return [
      { role: "system_summary", content: summary, ts: Date.now() },
      ...memoryArr.slice(-keepRecent)
    ];
  } catch (e) {
    console.error("Memory compression failed:", e);
    return memoryArr;
  }
}

/* ============================================================
  AI RETRY LOGIC WRAPPER
  - Handles transient failures gracefully.
  - Implements exponential backoff.
============================================================ */

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Executes an AI model request with exponential backoff retry logic.
 * This ensures transient failures in the Worker AI platform don't crash the request immediately.
 * * @param {Object} env - The environment bindings.
 * @param {string} model - The model ID string.
 * @param {Object} input - The input payload for the model.
 * @returns {Promise<any>} - The model response.
 */
async function runAIWithRetry(env, model, input) {
  let lastError = null;
  // Attempt 0 is the first try, then retries up to limit
  for (let attempt = 0; attempt <= AI_RETRY_LIMIT; attempt++) {
    try {
      return await env.SPY_AI.run(model, input);
    } catch (e) {
      lastError = e;
      const isLastAttempt = attempt === AI_RETRY_LIMIT;
      console.warn(`AI Attempt ${attempt + 1} failed for ${model}: ${e.message}`);
      
      if (!isLastAttempt) {
        // Exponential backoff: 1s, 2s, 4s...
        const delay = AI_RETRY_DELAY_BASE * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }
  // If we exit the loop, all attempts failed
  throw lastError || new Error("AI Model failed after max retries.");
}

/* ============================================================
  MAIN HANDLER
============================================================ */

export async function onRequest(context) {
  const request = context.request;
  const env = context.env;

  // Handle CORS Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    /* ================ CRITICAL BINDING CHECKS ================= */
    const isKvBound = !!env.CHAT_KV;
    if (!isKvBound) {
      console.error("CRITICAL ERROR: CHAT_KV environment binding is missing. Memory is disabled.");
    }
    
    const isAiBound = !!env.SPY_AI;
    if (!isAiBound) {
      return new Response(
        "CRITICAL ERROR: The AI Model binding (SPY_AI) is missing. Please check your Worker AI configuration in wrangler.toml.",
        { headers: { ...corsHeaders, "content-type": "text/plain" }, status: 500 }
      );
    }

    if (!env.TAVILY_API_KEY) {
      console.warn("WARNING: TAVILY_API_KEY is missing. Search functionality will fail.");
    }
    /* ============================================================= */

    let body = {};
    let fileContentFromForm = null;
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file_content");
      body = {
        mode: form.get("mode"),
        prompt: form.get("prompt"),
        filename: form.get("filename"),
        image: form.get("image"),
        strength: form.get("strength"),
        user_preference_id: form.get("user_preference_id"),
        firebase_token: form.get("firebase_token")
      };
      if (file && typeof file.text === 'function') {
        fileContentFromForm = await file.text();
      } else if (file) {
        fileContentFromForm = String(file);
      }
    } else if (contentType.includes("application/json")) {
      try {
        body = await request.json();
      } catch (e) {
        body = {};
      }
    } else {
      try {
        const t = await request.text();
        if (t) {
          try { body = JSON.parse(t); } catch (_) { body = { prompt: t }; }
        }
      } catch (_) {
        body = {};
      }
    }

    const combinedFileContent = String(fileContentFromForm || body.file_content || "");
    const { prompt, mode, image, strength, filename } = body;
    let currentMode = mode || detectMode(prompt, combinedFileContent, filename);

    /* ================ USER IDENTIFICATION ================ */

    let userId = null;
    
    // Method 1: Explicit Client ID
    if (body.user_preference_id) {
        const pid = body.user_preference_id.toString().trim();
        if (pid && pid !== "undefined" && pid !== "null") {
            userId = "custom:" + pid;
        }
    }

    // Method 2: Firebase Auth
    if (body.firebase_token) {
      const decoded = await verifyFirebaseToken(body.firebase_token);
      if (decoded && decoded.user_id) {
          userId = "firebase:" + decoded.user_id;
      }
    }

    // Method 3: IP Fallback
    if (!userId) {
        const ip = request.headers.get("CF-Connecting-IP") || "unknown-ip";
        userId = "ip:" + ip;
    }

    const memoryKey = MEMORY_USER_KEY_PREFIX + userId;

    /* ================ LOAD MEMORY ===================== */
    let memory = isKvBound ? await getMemoryFromKV(env, memoryKey) : [];
    
    // TTL filter
    const cutoff = Date.now() - MEMORY_TTL_DAYS * 24 * 60 * 60 * 1000;
    memory = memory.filter(m => (m.ts || 0) >= cutoff);

    // Compress if needed
    if (isKvBound && memory.length >= MEMORY_SUMMARY_TRIGGER) memory = await compressMemoryIfNeeded(env, memory);
    if (memory.length > MEMORY_MESSAGE_LIMIT) memory = memory.slice(-MEMORY_MESSAGE_LIMIT);

    /* ============= DELETE MEMORY HANDLES =============== */
    const lower = (prompt || "").toLowerCase();
    const wantsDelete =
      lower.includes("delete") || lower.includes("remove") || lower.includes("clear") ||
      lower.includes("reset") || lower.includes("forget");

    if (wantsDelete && !lower.includes("memory:") && !lower.includes("delete all") && !lower.includes("reset all")) {
      return new Response("Specify delete memory: all / last / first / <index> / keyword", {
        headers: { ...corsHeaders, "content-type": "text/plain" }
      });
    }
    
    if (isKvBound) {
      if (lower.includes("delete memory: all") || lower.includes("reset all") || lower.includes("delete all")) {
        await env.CHAT_KV.put(memoryKey, "[]");
        return new Response("All memory cleared for you 😎🔥", {
          headers: { ...corsHeaders, "content-type": "text/plain" }
        });
      }

      if (lower.includes("delete memory:")) {
        const cmd = lower.replace("delete memory:", "").trim();
        if (cmd === "last") {
          memory.pop();
          await saveMemoryToKV(env, memoryKey, memory);
          return new Response("Deleted last entry 👍", { headers: { ...corsHeaders, "content-type": "text/plain" }});
        }
        if (cmd === "first") {
          memory.shift();
          await saveMemoryToKV(env, memoryKey, memory);
          return new Response("Deleted first entry 👍", { headers: { ...corsHeaders, "content-type": "text/plain" }});
        }
        const idx = parseInt(cmd);
        if (!isNaN(idx)) {
          if (idx >= 1 && idx <= memory.length) {
            memory.splice(idx - 1, 1);
            await saveMemoryToKV(env, memoryKey, memory);
            return new Response("Entry removed 😃", { headers: { ...corsHeaders, "content-type": "text/plain" }});
          }
          return new Response("Invalid index 😅", { headers: { ...corsHeaders, "content-type": "text/plain" }});
        }
        memory = memory.filter(m => !m.content.toLowerCase().includes(cmd));
        await saveMemoryToKV(env, memoryKey, memory);
        return new Response("Matching entries deleted 👍", { headers: { ...corsHeaders, "content-type": "text/plain" }});
      }
    }
    
    /* ============= ADD NEW MEMORY SAFELY ================== */
    function norm(s) {
      return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
    }

    const userMessage = prompt && prompt.trim();
    if (userMessage) {
      const newNorm = norm(userMessage);
      const lastMessage = memory.length ? memory[memory.length - 1] : null;
      const lastNorm = lastMessage ? norm(lastMessage.content) : "";

      if (newNorm !== lastNorm) {
        memory.push({ role: "user", content: userMessage, ts: Date.now() });
      } else if (lastMessage && lastMessage.role === "user") {
        lastMessage.ts = Date.now();
      }
    }

    if (memory.length > MEMORY_MESSAGE_LIMIT) memory = memory.slice(-MEMORY_MESSAGE_LIMIT);

    /* ============= MEMORY SUMMARY FOR MODEL ==================== */
    function shortPreview2(s, max = 160) {
      if (!s) return "";
      let t = s.replace(/\s+/g, " ").trim();
      return t.length <= max ? t : t.slice(0, max).trim() + "...";
    }

    const memorySummary = memory
      .slice(-MEMORY_TRIM_TARGET)
      .map(m => {
        if (m.role === "system_summary") return "summary: " + shortPreview2(m.content, 240);
        return m.role + ": " + shortPreview2(m.content, 200);
      })
      .join("\n");

    /* ============= ASSISTANT REPLY SAVE HELPER ===================== */
    async function saveAssistantReply(replyContent) {
      if (isKvBound && replyContent) {
        // We save the content to KV memory so the conversation context persists.
        memory.push({ role: "assistant", content: replyContent, ts: Date.now() });
        if (memory.length > MEMORY_MESSAGE_LIMIT) memory = memory.slice(-MEMORY_MESSAGE_LIMIT);
        await saveMemoryToKV(env, memoryKey, memory);
      }
    }

    /* ============================================================
       AUTO LANGUAGE/SLANG MODES + EXTRA SYSTEM INSTRUCTIONS
       ============================================================ */
    let forceTeluguSlang = false;
    if (shouldTriggerTelugu(prompt || "")) forceTeluguSlang = true;

    let forceHindiMode = false;
    if (shouldTriggerHindi(prompt || "")) forceHindiMode = true;

    let forceSavage = false;
    if ((prompt || "").toLowerCase().includes("savage mode") ||
        (prompt || "").toLowerCase().includes("roast mode") ||
        (prompt || "").toLowerCase().includes("be savage")) {
      forceSavage = true;
    }

    const extraSystemInstructions = [];
    if (forceTeluguSlang) {
      extraSystemInstructions.push(
        "User message contains Telugu. Respond in STRICT Telangana slang using English transliteration only. Do NOT use Andhra/textbook Telugu."
      );
    }
    if (forceHindiMode) {
      extraSystemInstructions.push(
        "User message contains Hindi. Respond in casual Hindi using English transliteration (Hinglish). Be friendly and natural."
      );
    }
    if (forceSavage) {
      extraSystemInstructions.push(
        "Savage mode enabled. Use playful Telangana-style roast. Be humorous, bold, and non-offensive."
      );
    }

    /* ============================================================
       FILE ANALYSIS MODE (PRO QUALITY)
       ============================================================ */
    if (currentMode === "analyze_file") {
      const receivedFilename = String(body.filename || filename || "unknown");
      let contentToAnalyze = combinedFileContent;
      contentToAnalyze = contentToAnalyze
        .replace(/[\u0000]/g, '')
        .replace(/\u00A0/g, ' ')
        .replace(/(\r\n|\r)/g, '\n');

      if (contentToAnalyze.trim().length === 0) {
        const emptyMsg = "I'm sorry, mama — I can't analyze the file because it's empty. Ee file empty undhi ra! 😔";
        return new Response(emptyMsg, { headers: { ...corsHeaders, "content-type": "text/plain" } });
      }

      const aPrompt =
`You are an expert Senior Software Engineer and Code Auditor. 
Your task is to analyze the following file and provide a high-quality, structured report.

**CRITICAL FORMATTING RULES:**
1. Use Markdown Headers (###) for sections.
2. Use Markdown Tables for any data comparisons.
3. **MANDATORY:** All code must be inside Markdown Code Blocks (\`\`\`language ... \`\`\`).
4. **COMPLETE CODE:** If fixing code, output the ENTIRE file/function. Do not abbreviate.

**Analysis Structure:**
### 1. Overview
Brief summary of what this file does.

### 2. Logic Walkthrough
Explain the core logic flow clearly.

### 3. Key Issues & Bugs
Identify logical errors, security risks, or performance bottlenecks.

### 4. Suggested Fixes (The most important part)
Provide **Complete, Runnable Code Blocks** for the fixes. 
Rewrite the function/component correctly and completely.

Filename: ${receivedFilename}

File Content:
${contentToAnalyze}
`;

      const messages = [
        { role: "system", content: SPIDER_SYSTEM_PROMPT }
      ];
      if (extraSystemInstructions.length) messages.push({ role: "system", content: extraSystemInstructions.join("\n") });
      messages.push({ role: "system", content: "Memory:\n" + memorySummary });
      messages.push({ role: "user", content: aPrompt });

      // USE RETRY LOGIC HERE
      const result = await runAIWithRetry(env, "@cf/mistralai/mistral-small-3.1-24b-instruct", { 
          messages,
          repetition_penalty: 1.1, 
          temperature: 0.4 
      });
      
      const responseTextRaw = extractText(result);
      // RAW OUTPUT: No sanitization
      const responseText = responseTextRaw;

      await saveAssistantReply(responseText);

      const finalText = `Here’s the deep dive analysis for ${receivedFilename}! 👇🔥\n\n${responseText}\n\nNeed more changes? Just ask, mama! 😎🕷️`;
      return new Response(finalText, { headers: { ...corsHeaders, "content-type": "text/plain" } });
    }

    /* ============================================================
       IMAGE GENERATION
    ============================================================ */
    if (currentMode === "image_gen") {
      try {
        const enhanced = (prompt || "") + ", ultra detailed, cinematic lighting, hdr, 8k clarity";
        // USE RETRY LOGIC HERE
        const img = await runAIWithRetry(env, "@cf/stabilityai/stable-diffusion-xl-base-1.0", { prompt: enhanced });
        return new Response(img, { headers: { ...corsHeaders, "content-type": "image/png" } });
      } catch (e) {
        return new Response("Image Generation Failed: " + e.message, { headers: { ...corsHeaders, "content-type": "text/plain" } });
      }
    }

    /* ============================================================
       IMAGE EDIT
    ============================================================ */
    if (currentMode === "image_edit") {
      try {
        const enhanced = (prompt || "") + ", detailed render, hdr, cinematic";
        // USE RETRY LOGIC HERE
        const img = await runAIWithRetry(env, "@cf/stabilityai/stable-diffusion-xl-base-1.0", {
            prompt: enhanced,
            image: (image || body.image),
            strength: (strength || body.strength || 0.7)
        });
        return new Response(img, { headers: { ...corsHeaders, "content-type": "image/png" } });
      } catch (e) {
        return new Response("Image Edit Failed (Fallback error): " + e.message, { headers: { ...corsHeaders, "content-type": "text/plain" } });
      }
    }

    /* ============================================================
       NORMAL CHAT + AUTO SEARCH (TAVILY)
    ============================================================ */
    const searchInstruction =
      "If you need up-to-date information or external knowledge, internally mark it with {\"action\":\"search\",\"query\":\"...\"}. Do NOT return JSON to the user.";

    const baseMessages = [
      { role: "system", content: SPIDER_SYSTEM_PROMPT }
    ];
    if (extraSystemInstructions.length)
      baseMessages.push({ role: "system", content: extraSystemInstructions.join("\n") });

    baseMessages.push({ role: "system", content: "Memory:\n" + memorySummary });
    baseMessages.push({ role: "system", content: searchInstruction });
    baseMessages.push({ role: "user", content: prompt || "" });

    // USE RETRY LOGIC HERE
    const aiResp = await runAIWithRetry(env, "@cf/mistralai/mistral-small-3.1-24b-instruct", { 
          messages: baseMessages,
          repetition_penalty: 1.2,
          temperature: 0.7 
    });

    let rawText = extractText(aiResp).trim();
    let instruction = extractSearchInstruction(rawText);

    /* ===========================
       If model wants search
       =========================== */
    if (instruction && instruction.action === "search") {
      if (!env.TAVILY_API_KEY) {
        const noSearchMsg = `Yo, I tried to search for "${instruction.query}", but the TAVILY_API_KEY is missing, mama! 🔑 No current info for you. Try setting the secret! 😅`;
        await saveAssistantReply(noSearchMsg);
        return new Response(noSearchMsg, { headers: { ...corsHeaders, "content-type": "text/plain" } });
      }
      
      const query = (instruction.query || prompt || "").slice(0, 800);

      const results = await runTavilySearch(env, query);

      const searchSummaryPrompt =
        `Here are Tavily search results:\n\nAnswer: ${results.answer || "No direct answer."}\n\nTop Sources:\n` +
        (results.results || [])
          .map(r => "- " + (r.url || r.title || "").trim())
          .join("\n") +
        `\n\nUsing ONLY the above information, answer the user's original question clearly and include emoji(s) where appropriate. Use Markdown Tables if comparing data.`;

      const sumMessages = [
        { role: "system", content: SPIDER_SYSTEM_PROMPT }
      ];
      if (extraSystemInstructions.length)
        sumMessages.push({ role: "system", content: extraSystemInstructions.join("\n") });

      sumMessages.push({ role: "system", content: "Memory:\n" + memorySummary });
      sumMessages.push({ role: "user", content: searchSummaryPrompt });

      // USE RETRY LOGIC HERE
      const final = await runAIWithRetry(env, "@cf/mistralai/mistral-small-3.1-24b-instruct", { 
            messages: sumMessages,
            repetition_penalty: 1.2,
            temperature: 0.6
      });

      // RAW OUTPUT: No sanitization
      let clean = extractText(final);

      const lowerPrompt = (prompt || "").toLowerCase();
      if (!lowerPrompt.includes("no emojis") && !lowerPrompt.includes("no emoji") && !/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(clean)) {
        clean = clean + " 😎🔥"; 
      }

      await saveAssistantReply(clean);

      return new Response(clean, { headers: { ...corsHeaders, "content-type": "text/plain" } });
    }

    /* ===========================
       If no search needed
       =========================== */
    
    // RAW OUTPUT: No sanitization
    let clean = rawText;

    const lowerPrompt = (prompt || "").toLowerCase();
    if (!lowerPrompt.includes("no emojis") && !lowerPrompt.includes("no emoji")) {
      if (!/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(clean)) {
        clean = clean + " 🙂";
      }
    }

    await saveAssistantReply(clean);

    return new Response(clean, { headers: { ...corsHeaders, "content-type": "text/plain" } });

  } catch (error) {
    console.error("Fatal Worker Error:", error);
    return new Response(
      `Spider AI crashed internally 😭. Details: ${error.message || 'Unknown error. Check logs.'}`,
      { headers: { "Access-Control-Allow-Origin": "*", "content-type": "text/plain" }, status: 500 }
    );
  }
} // END onRequest


/* ============================================================
  TAVILY SEARCH (FIXED URL SYNTAX)
============================================================ */

async function runTavilySearch(env, query) {
  const apiKey = env.TAVILY_API_KEY || "";
  if (!apiKey) {
    return { error: "no_api_key", message: "Set TAVILY_API_KEY in environment." };
  }

  try {
    // CRITICAL FIX: Direct URL string, no Markdown syntax
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": apiKey // Tavily uses the key directly in Auth header or body depending on docs, standard is Auth header for many, but Tavily often accepts it in body. Using header as per common practice.
      },
      body: JSON.stringify({
        api_key: apiKey, // Redundant safety: Tavily often expects it in body too
        query,
        include_answer: true,
        search_depth: "advanced"
      })
    });

    if (!response.ok) {
      const info = await response.text().catch(()=> "");
      return { error: "tavily_non_ok", status: response.status, details: info };
    }

    return await response.json();
  } catch (e) {
    return { error: "tavily_failed", details: e.toString() };
  }
}

/* ============================================================
  EXTRACT TEXT FROM MODEL RESPONSE
  - Handles various response formats from different AI models.
  - Ensures a string is always returned.
============================================================ */

function extractText(resp) {
  try {
    let raw = "";

    // Cloudflare Workers AI Response Formats (vary by model)
    if (resp?.output?.[1]?.content?.[0]?.text)
      raw = resp.output[1].content[0].text;

    if (!raw && resp?.output?.[0]?.content?.[0]?.text)
      raw = resp.output[0].content[0].text;

    if (!raw && resp.output_text) raw = resp.output_text;
    if (!raw && resp.text) raw = resp.text;
    if (!raw && resp.result) raw = resp.result;
    
    // OpenAI Compatible Format
    if (!raw && resp.choices?.[0]?.message?.content)
      raw = resp.choices[0].message.content;
      
    // Generic fallback
    if (!raw && resp.response) raw = resp.response;
    if (!raw && typeof resp === "string") raw = resp;

    raw = (raw || "").toString().trim();

    return raw.trim();
  } catch (e) {
    console.error("Error extracting text from response:", e);
    return "";
  }
}
