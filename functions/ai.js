/* ============================================================
  SPIDER AI — V6.4 (RAW CORE)
  - SYSTEM: Minimal System Prompt (No personality/identity).
  - INPUT: Image prompts are passed raw (no auto-enhancement).
  - LOGIC: Removed all language triggers (Hindi/Telugu) and slang modes.
  - OUTPUT: 100% Raw model output (No emojis forced).
  - FEATURE: Retry logic & Search retained for functionality.
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

/* ============================================================
  MINIMAL SYSTEM PROMPT
============================================================ */
const SPIDER_SYSTEM_PROMPT =
"You are a helpful AI assistant.\n" +
"Provide direct, accurate, and concise responses.\n" +
"Use Markdown for formatting where appropriate.\n" +
"Always use Markdown code blocks for code snippets.";

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
      // TEMPORARILY DISABLED (5 MINS)
      // if (lower.includes("delete memory: all") || lower.includes("reset all") || lower.includes("delete all")) {
      //   await env.CHAT_KV.put(memoryKey, "[]");
      //   return new Response("All memory cleared.", {
      //     headers: { ...corsHeaders, "content-type": "text/plain" }
      //   });
      // }

      if (lower.includes("delete memory:")) {
        const cmd = lower.replace("delete memory:", "").trim();
        if (cmd === "last") {
          memory.pop();
          await saveMemoryToKV(env, memoryKey, memory);
          return new Response("Deleted last entry.", { headers: { ...corsHeaders, "content-type": "text/plain" }});
        }
        if (cmd === "first") {
          memory.shift();
          await saveMemoryToKV(env, memoryKey, memory);
          return new Response("Deleted first entry.", { headers: { ...corsHeaders, "content-type": "text/plain" }});
        }
        const idx = parseInt(cmd);
        if (!isNaN(idx)) {
          if (idx >= 1 && idx <= memory.length) {
            memory.splice(idx - 1, 1);
            await saveMemoryToKV(env, memoryKey, memory);
            return new Response("Entry removed.", { headers: { ...corsHeaders, "content-type": "text/plain" }});
          }
          return new Response("Invalid index.", { headers: { ...corsHeaders, "content-type": "text/plain" }});
        }
        memory = memory.filter(m => !m.content.toLowerCase().includes(cmd));
        await saveMemoryToKV(env, memoryKey, memory);
        return new Response("Matching entries deleted.", { headers: { ...corsHeaders, "content-type": "text/plain" }});
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
        memory.push({ role: "assistant", content: replyContent, ts: Date.now() });
        if (memory.length > MEMORY_MESSAGE_LIMIT) memory = memory.slice(-MEMORY_MESSAGE_LIMIT);
        await saveMemoryToKV(env, memoryKey, memory);
      }
    }

    /* ============================================================
       FILE ANALYSIS MODE
       ============================================================ */
    if (currentMode === "analyze_file") {
      const receivedFilename = String(body.filename || filename || "unknown");
      let contentToAnalyze = combinedFileContent;
      contentToAnalyze = contentToAnalyze
        .replace(/[\u0000]/g, '')
        .replace(/\u00A0/g, ' ')
        .replace(/(\r\n|\r)/g, '\n');

      if (contentToAnalyze.trim().length === 0) {
        return new Response("File is empty.", { headers: { ...corsHeaders, "content-type": "text/plain" } });
      }

      const aPrompt =
`Analyze the following file.
Filename: ${receivedFilename}
File Content:
${contentToAnalyze}`;

      const messages = [
        { role: "system", content: SPIDER_SYSTEM_PROMPT },
        { role: "system", content: "Memory:\n" + memorySummary },
        { role: "user", content: aPrompt }
      ];

      // USE RETRY LOGIC HERE
      const result = await runAIWithRetry(env, "@cf/mistralai/mistral-small-3.1-24b-instruct", { 
          messages,
          repetition_penalty: 1.1, 
          temperature: 0.4 
      });
      
      const responseTextRaw = extractText(result);
      const responseText = responseTextRaw;

      await saveAssistantReply(responseText);

      const finalText = `Analysis for ${receivedFilename}:\n\n${responseText}`;
      return new Response(finalText, { headers: { ...corsHeaders, "content-type": "text/plain" } });
    }

    /* ============================================================
       IMAGE GENERATION
    ============================================================ */
    if (currentMode === "image_gen") {
      try {
        // Raw prompt - no enhancements
        const rawPrompt = prompt || "";
        const img = await runAIWithRetry(env, "@cf/stabilityai/stable-diffusion-xl-base-1.0", { prompt: rawPrompt });
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
         // Raw prompt - no enhancements
        const rawPrompt = prompt || "";
        const img = await runAIWithRetry(env, "@cf/stabilityai/stable-diffusion-xl-base-1.0", {
            prompt: rawPrompt,
            image: (image || body.image),
            strength: (strength || body.strength || 0.7)
        });
        return new Response(img, { headers: { ...corsHeaders, "content-type": "image/png" } });
      } catch (e) {
        return new Response("Image Edit Failed: " + e.message, { headers: { ...corsHeaders, "content-type": "text/plain" } });
      }
    }

    /* ============================================================
       NORMAL CHAT + AUTO SEARCH (TAVILY)
    ============================================================ */
    const searchInstruction =
      "If you need external knowledge, internally mark it with {\"action\":\"search\",\"query\":\"...\"}.";

    const baseMessages = [
      { role: "system", content: SPIDER_SYSTEM_PROMPT }
    ];

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
        const noSearchMsg = `Search failed: TAVILY_API_KEY is missing.`;
        await saveAssistantReply(noSearchMsg);
        return new Response(noSearchMsg, { headers: { ...corsHeaders, "content-type": "text/plain" } });
      }
      
      const query = (instruction.query || prompt || "").slice(0, 800);

      const results = await runTavilySearch(env, query);

      const searchSummaryPrompt =
        `Search results:\n\nAnswer: ${results.answer || "No direct answer."}\n\nTop Sources:\n` +
        (results.results || [])
          .map(r => "- " + (r.url || r.title || "").trim())
          .join("\n") +
        `\n\nUsing this information, answer the user's question.`;

      const sumMessages = [
        { role: "system", content: SPIDER_SYSTEM_PROMPT }
      ];

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
      await saveAssistantReply(clean);
      return new Response(clean, { headers: { ...corsHeaders, "content-type": "text/plain" } });
    }

    /* ===========================
       If no search needed
       =========================== */
    
    // RAW OUTPUT: No sanitization
    let clean = rawText;
    await saveAssistantReply(clean);
    return new Response(clean, { headers: { ...corsHeaders, "content-type": "text/plain" } });

  } catch (error) {
    console.error("Fatal Worker Error:", error);
    return new Response(
      `Internal Error: ${error.message}`,
      { headers: { "Access-Control-Allow-Origin": "*", "content-type": "text/plain" }, status: 500 }
    );
  }
} // END onRequest


/* ============================================================
  TAVILY SEARCH
============================================================ */

async function runTavilySearch(env, query) {
  const apiKey = env.TAVILY_API_KEY || "";
  if (!apiKey) {
    return { error: "no_api_key", message: "Set TAVILY_API_KEY in environment." };
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": apiKey 
      },
      body: JSON.stringify({
        api_key: apiKey,
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
