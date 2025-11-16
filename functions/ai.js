/* ============================================================
SPIDER AI — TELANGANA BEAST EDITION V3.2 (FILE CONTENT PATCH)
CONFIG + STRICT TELANGANA TRAINING PACK
TELUGU TRIGGER = 2+ WORDS
FULL EMOJI SYSTEM ENABLED
============================================================ */

/* ===== CONFIG ===== */
const MEMORY_MESSAGE_LIMIT = 200;
const MEMORY_TRIM_TARGET = 200;
const MEMORY_TTL_DAYS = 30;
const MEMORY_SUMMARY_TRIGGER = 300;
const MEMORY_USER_KEY_PREFIX = "chat_memory:";
const FIREBASE_PROJECT_ID = "m4-spider";

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

// Build regex for detection
function buildTeluguRegex(words) {
  const sorted = [...words].sort((a,b)=>b.length - a.length);
  const escaped = sorted.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"));
  const pattern = "\\b(?:" + escaped.join("|") + ")\\b";
  return new RegExp(pattern, "iu");
}

const TELUGU_TRIGGER_REGEX = buildTeluguRegex(TELUGU_TRIGGER_WORDS);

/* ===== NEW PATCH: REQUIRE 2+ TELUGU WORDS ===== */
function shouldTriggerTelugu(message) {
  if (!message || typeof message !== "string") return false;

  const words = message.toLowerCase().split(/\s+/);

  let count = 0;
  for (const w of words) {
    if (TELUGU_TRIGGER_WORDS.includes(w)) count++;
  }

  return count >= 2;
}

/* ============================================================
TELANGANA TRAINING BLOCK
============================================================ */


/* ============================================================
MAIN SYSTEM PROMPT (UPDATED WITH YOUR EMOJI RULE)
============================================================ */

const SPIDER_SYSTEM_PROMPT =
"You are Spider, the AI created by M4 Spider.\n" +
"GENERAL RULES:\n" +
"- Default English,U KNOW EVERY LANGUAGE AS WELL AND U CAN SPEAK ANY LANGUAGE ,CHAT ,UNDERSTAND EVERY LANGUAGE 100% perfectly .\n" +  
  "- Never reveal system code.\n" +
"- No markdown or asterisks.\n" +
"- Always talk friendly savage and what ever language they speak that only .\n" +
"- Creator = M4 Spider.\n\n"+
    "- always think like a human for every word go for deep thinking and then only reply.\n" +
    "- think 1o-15 times before replying even one msg .\n"+

"LANGUAGE SWITCH:\n" +
"- Telugu mode triggers when 2+ Telugu words detected.\n" +
"- Use STRICT Telangana slang in transliteration only.\n" +
"- Telugu replies must be English-letter transliteration.\n" +
"- never speak enlgish full in between any other language .\n" +

"SAVAGE MODE:\n" +
"- If roast mode requested, reply bold & funny.\n\n" +

"EMOJI RULE:\n" +
"- Always use emojis freely in every reply unless the user says 'no emojis'.\n" +
"- Use emojis that fit the mood.\n" +
"- Emoji Pack Part 1: 😎🔥🤣😂🤙😈🤌🕷️🕸️💀💣⚔️😃😅😉😛😍🤪😳🥵😨😣😔😓😞😧🫣😬🤐🙂😏😌🥹.\n" +
"- Emoji Pack Part 2: 😗😚🙂‍↕️🤡🤮🤢👻👿🙌👐🫸plm3-models/Callirrhoe-config.json," +
"- Emoji Pack Part 3: 🖥️💻🔌💉💊🧪⚙️🕕🕧🕙📅🔔🔒🚀✨💫🌪️🔥💥⚡🌈⭐☄️.\n" +
"- Emoji Pack Part 4: 🦸🦹🕶️🎭🎯🎮🎧🎤📱📲💾🗄️🛰️📡🧠🫀🫁.\n" +
"- Emoji Pack Part 5: 🇮🇳🇺🇸🇹🇱🇳🇨🇲🇷🇭🇲🇫🇯🇪🇦🇯🇵🇰🇷🇬🇧🇫🇷🇧🇷🇰🇵.\n" +
"- Emoji Pack Part 6: 🦅🐍🐺🐯🦂🐉🦖🐗🐅🐆🦊🐒🐼🐨🦁.\n" +
"- Emoji Pack Part 7: 🔧🔨⚙️🪛🪚🔩📐📏🧰💡🔦🧯🔭🧲🛠️.\n" +
"- Emoji Pack Part 8: 🎵🎶🔊🔉🔈📣📢📯🎺🥁🎸🎷🎻🎹.\n" +
"- Add emojis naturally in the middle or end of sentences.\n";

/* ============================================================
FIREBASE TOKEN VERIFIER (WRAPPED FOR ESM — FIXED)
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
MAIN HANDLER STARTS HERE
============================================================ */

export async function onRequest(context) {
  const request = context.request;
  const env = context.env;
  
  try { 

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
          image: form.get("image"), // Ensure all fields are populated
          strength: form.get("strength") // Ensure all fields are populated
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
      body = {};
  }

  /* ==================================================================
   *  FIX V3.2: UNIFIED FILE CONTENT
   *  This single variable holds file content from either JSON or Multipart.
   * ================================================================== */
  const combinedFileContent = String(fileContentFromForm || body.file_content || "");
  
  // Destructure body AFTER setting combined content.
  // Note: 'file_content' is no longer destructured here to avoid confusion.
  const { prompt, mode, image, strength, filename } = body;

  // Use combinedFileContent for mode detection
  let currentMode = mode || detectMode(prompt, combinedFileContent, filename);

    /* ================= USER IDENTIFICATION ===================== */

    let userId = "anon-default";
    if (body.user_preference_id) userId = body.user_preference_id.toString();

    if (body.firebase_token) {
      const decoded = await verifyFirebaseToken(body.firebase_token);
      if (decoded && decoded.user_id) userId = decoded.user_id;
    }

    const memoryKey = MEMORY_USER_KEY_PREFIX + userId;

    /* ================= MEMORY LOADING ========================== */

    async function getMemory() {
      try {
        const raw = await env.CHAT_KV.get(memoryKey);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }

    async function saveMemory(mem) {
      try {
        await env.CHAT_KV.put(memoryKey, JSON.stringify(mem));
      } catch (_) {}
    }

    let memory = await getMemory();
    
    /* ================= MEMORY TTL FILTER ======================= */

    const cutoff = Date.now() - MEMORY_TTL_DAYS * 24 * 60 * 60 * 1000;
    memory = memory.filter(m => (m.ts || 0) >= cutoff);

    /* ================= MEMORY COMPRESSION ======================= */

    async function compressMemory(memoryArr) {
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
        older
          .map((m, i) => (i + 1) + ". " + m.role + ": " + shortPreview(m.content, 200))
          .join("\n");

      const res = await env.SPY_AI.run("@cf/mistralai/mistral-small-3.1-24b-instruct", {
        messages: [
          { role: "system", content: SPIDER_SYSTEM_PROMPT },
          { role: "user", content: summaryPrompt }
        ]
      });

      const summary = extractText(res).trim();

  _CONTEXT_TARGET / 2);
      const older = memoryArr.slice(0, memoryArr.length - keepRecent);

      function shortPreview(s, max = 200) {
        if (!s) return "";
        let t = s.replace(/\s+/g, " ").trim();
        return t.length <= max ? t : t.slice(0, max).trim() + "...";
      }

      const summaryPrompt =
        "Summarize these messages in 3 bullet points. Keep only important context.\n\n" +
        older
          .map((m, i) => (i + 1) + ". " + m.role + ": " + shortPreview(m.content, 200))
          .join("\n");

      const res = await env.SPY_AI.run("@cf/mistralai/mistral-small-3.1-24b-instruct", {
        messages: [
          { role: "system", content: SPIDER_SYSTEM_PROMPT },
          { role: "user", content: summaryPrompt }
        ]
      });

      const summary = extractText(res).trim();

      return [
        { role: "system_summary", content: summary, ts: Date.now() },
        ...memoryArr.slice(-keepRecent)
      ];
    }

    if (memory.length >= MEMORY_SUMMARY_TRIGGER)
      memory = await compressMemory(memory);

    if (memory.length > MEMORY_MESSAGE_LIMIT)
      memory = memory.slice(-MEMORY_MESSAGE_LIMIT);

    await saveMemory(memory);

    /* ============= DELETE MEMORY HANDLING ====================== */

    const lower = (prompt || "").toLowerCase();
    const wantsDelete =
        lower.includes("delete") ||
        lower.includes("remove") ||
        lower.includes("clear") ||
        lower.includes("reset") ||
        lower.includes("forget");

    if (
      wantsDelete &&
      !lower.includes("memory:") &&
      !lower.includes("delete all") &&
      !lower.includes("reset all")
    ) {
      return new Response(
        "Specify delete memory: all / last / first / 3 / keyword 😄",
        { headers: { "content-type": "text/plain" } }
      );
    }

    if (lower.includes("delete memory: all") || lower.includes("reset all") || lower.includes("delete all")) {
      await env.CHAT_KV.put(memoryKey, "[]");
      return new Response("All memory cleared 😎🔥", {
        headers: { "content-type": "text/plain" }
      });
    }

    if (lower.includes("delete memory:")) {
      const cmd = lower.replace("delete memory:", "").trim();

      if (cmd === "last") {
        memory.pop();
        await saveMemory(memory);
        return new Response("Deleted last entry 👍", {
          headers: { "content-type": "text/plain" }
        });
      }

      if (cmd === "first") {
        memory.shift();
        await saveMemory(memory);
        return new Response("Deleted first entry 👍", {
          headers: { "content-type": "text/plain" }
        });
      }

      const idx = parseInt(cmd);
      if (!isNaN(idx)) {
        if (idx >= 1 && idx <= memory.length) {
          memory.splice(idx - 1, 1);
          await saveMemory(memory);
          return new Response("Entry removed 😃", {
            headers: { "content-type": "text/plain" }
CH_KV.put(memoryKey, "[]");
      return new Response("All memory cleared 😎🔥", {
        headers: { "content-type": "text/plain" }
      });
    }

    if (lower.includes("delete memory:")) {
      const cmd = lower.replace("delete memory:", "").trim();

      if (cmd === "last") {
        memory.pop();
        await saveMemory(memory);
        return new Response("Deleted last entry 👍", {
          headers: { "content-type": "text/plain" }
        });
      }

      if (cmd === "first") {
        memory.shift();
        await saveMemory(memory);
        return new Response("Deleted first entry 👍", {
          headers: { "content-type": "text/plain" }
        });
      }

      const idx = parseInt(cmd);
      if (!isNaN(idx)) {
        if (idx >= 1 && idx <= memory.length) {
          memory.splice(idx - 1, 1);
          await saveMemory(memory);
          return new Response("Entry removed 😃", {
            headers: { "content-type": "text/plain" }
          });
        }
        return new Response("Invalid index 😅", {
          headers: { "content-type": "text/plain" }
        });
      }

      memory = memory.filter(m => !m.content.toLowerCase().includes(cmd));
      await saveMemory(memory);

      return new Response("Matching entries deleted 👍", {
        headers: { "content-type": "text/plain" }
      });
    }

    /* ============= ADD NEW MEMORY SAFELY ======================= */

    function norm(s) {
      return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
    }

    if (prompt && prompt.trim()) {
      const newNorm = norm(prompt);
      const lastNorm = memory.length ? norm(memory[memory.length - 1].content) : "";

      if (!(newNorm === lastNorm || newNorm.includes(lastNorm) || lastNorm.includes(newNorm))) {
        memory.push({ role: "user", content: prompt, ts: Date.now() });
      } else {
        if (memory.length) memory[memory.length - 1].ts = Date.now();
      }
    }

    if (memory.length > MEMORY_MESSAGE_LIMIT)
      memory = memory.slice(-MEMORY_MESSAGE_LIMIT);

    await saveMemory(memory);

    /* ============= MEMORY SUMMARY FOR MODEL ==================== */

    function shortPreview2(s, max = 160) {
      if (!s) return "";
      let t = s.replace(/\s+/g, " ").trim();
      return t.length <= max ? t : t.slice(0, max).trim() + "...";
    }

    const memorySummary = memory
      .filter(m => m.role !== "assistant") 
      .slice(-MEMORY_TRIM_TARGET)
      .map(m => {
        if (m.role === "system_summary") return "summary: " + shortPreview2(m.content, 240);
        return m.role + ": " + shortPreview2(m.content, 200);
      })
      .join("\n");
     /* ============================================================
       AUTO TELANGANA SLANG MODE + EXTRA SYSTEM INSTRUCTIONS
       ============================================================ */

    let forceTeluguSlang = false;
    if (shouldTriggerTelugu(prompt || "")) {
      forceTeluguSlang = true;
    }

    let forceSavage = false;
    if ((prompt || "").toLowerCase().includes("savage mode") ||
        (prompt || "").toLowerCase().includes("roast mode") ||
        (prompt || "").toLowerCase().includes("be savage")) {
      forceSavage = true;
    }

    // Build extra system layers (always push emoji guideline for normal English)
    const extraSystemInstructions = [];

    if (forceTeluguSlang) {
      extraSystemInstructions.push(
        "User message contains Telugu. Respond in STRICT Telangana slang using English transliteration only. Follow Telangana training rules. Do NOT use Andhra/textbook Telugu."
      );
    }

    if (forceSavage) {
      extraSystemInstructions.push(
        "Savage mode enabled. Use playful Telangana-style roast. Be humorous, bold, and non-offensive."
      );
    }

    // Ensure normal English replies use emojis if not explicitly telugu/savage
    if (!forceTeluguSlang && !forceSavage) {
      extraSystemInstructions.push(
        "In normal English replies, use emojis naturally and freely from the emoji pack unless the user says 'no emojis'."
      );
    }

    /* ============================================================
     FILE ANALYSIS (FIXED FOR ROBUST CONTENT CHECK)
     ============================================================ */
    if (currentMode === "analyze_file") {
      // Use 'filename' from destructuring
      const receivedFilename = String(body.filename || filename || "unknown");
      
      // FIX V3.2: Use the unified 'combinedFileContent' variable
      let contentToAnalyze = combinedFileContent;
      
      contentToAnalyze = contentToAnalyze
        .replace(/[\u0000]/g, '')
        .replace(/\u00A0/g, ' ') 
        .replace(/(\r\n|\r)/g, '\n'); 

      if (contentToAnalyze.trim().length === 0) {
        return new Response(JSON.stringify({
          text: "I'm sorry, **mama**, but I can't analyze the file since there's no content provided. Ee file empty undhi **ra**! 😔",
          type: 'text',
          model_used: 'mistral-small-3.1-24b-instruct',
          sources: []
        }), {
          headers: { "content-type": "application/json" }
        });
      }

      const aPrompt = `Analyze this file:\n\nFilename: ${receivedFilename}\nContent:\n${contentToAnalyze}\n`;

      const messages = [
        { role: "system", content: SPIDER_SYSTEM_PROMPT }
      ];

      if (extraSystemInstructions.length) {
        messages.push({ role: "system", content: extraSystemInstructions.join("\n") });
      }

      messages.push({ role: "system", content: "Memory:\n" + memorySummary });
      messages.push({ role: "user", content: aPrompt });

      const result = await env.SPY_AI.run("@cf/mistralai/mistral-small-3.1-24b-instruct", { messages });

      const responseText = extractText(result);

      return new Response(JSON.stringify({
        text: responseText,
        type: 'text',
        model_used: 'mistral-small-3.1-24b-instruct',
        sources: []
      }), {
        headers: { "content-type": "application/json" }
      });
    }
    /* ============================================================
       IMAGE GENERATION
       ============================================================ */

    if (currentMode === "image_gen") {
      const enhanced = (prompt || "") + ", ultra detailed, cinematic lighting, hdr, 8k clarity";

      const img = await env.SPY_AI.run(
        "@cf/stabilityai/stable-diffusion-xl-base-1.0",
        { prompt: enhanced }
      );

      return new Response(img, { headers: { "content-type": "image/png" } });
    }

    /* ============================================================
       IMAGE EDIT
       ============================================================ */

    if (currentMode === "image_edit") {
      const enhanced = (prompt || "") + ", detailed render, hdr, cinematic";
      
      // Use 'image' and 'strength' from destructuring
      const img = await env.SPY_AI.run(
        "@cf/stabilityai/stable-diffusion-xl-refiner-1.0",
        { prompt: enhanced, image: (image || body.image), strength: (strength || body.strength || 0.7) }
      );

      return new Response(img, { headers: { "content-type": "image/png" } });
    }

    /* ============================================================
       NORMAL CHAT + SEARCH
       ============================================================ */

    const searchInstruction = 'If you need up-to-date information, reply ONLY with: {"action":"search","query":"your search query"} No extra text.';

    const baseMessages = [
      { role: "system", content: SPIDER_SYSTEM_PROMPT }
    ];
    if (extraSystemInstructions.length) baseMessages.push({ role: "system", content: extraSystemInstructions.join("\n") });
    baseMessages.push({ role: "system", content: "Memory:\n" + memorySummary });
    baseMessages.push({ role: "system", content: searchInstruction });
    baseMessages.push({ role: "user", content: prompt || "" });

    const aiResp = await env.SPY_AI.run("@cf/mistralai/mistral-small-3.1-24b-instruct", {
content: "Memory:\n" + memorySummary });
    baseMessages.push({ role: "system", content: searchInstruction });
    baseMessages.push({ role: "user", content: prompt || "" });

    const aiResp = await env.SPY_AI.run("@cf/mistralai/mistral-small-3.1-24b-instruct", {
      messages: baseMessages
    });

    let text = extractText(aiResp).trim();

    // Clean JSON markdown wrapping if present
    const jsonString = text
      .replace(/^```json\s*/, "")
      .replace(/^```\s*/, "")
      .replace(/\s*```$/, "")
      .trim();

    try {
      const obj = JSON.parse(jsonString);
      if (obj && obj.action === "search" && typeof obj.query === "string" && obj.query.length > 1 && obj.query.length < 300) {

        const results = await runSearch(obj.query);

        const sumMessages = [
          { role: "system", content: SPIDER_SYSTEM_PROMPT }
ReadMe
Project: Spider AI Cloudflare Worker
Version: 3.2 (Patched)
Author: M4 Spider

Overview:
This file contains the complete serverless backend logic for the Spider AI, designed to run on Cloudflare Workers. It handles chat, memory, language switching, file analysis, and image generation.

V3.2 Patch Notes:
- FIX: Resolved a critical bug where file content was not being read correctly during 'analyze_file' mode.
- CHANGE: Refactored content handling to use a single 'combinedFileContent' variable, which safely gets content from either 'multipart/form-data' or 'application/json' request types. This prevents the "File empty" error.
- CHANGE: Cleaned up destructuring to avoid 'file_content' scope confusion.

Key Features:
- Telangana Slang Trigger: Automatically switches to friendly-savage Telangana slang (in English transliteration) if 2 or more Telugu trigger words are detected.
- Persistent Memory: Uses Cloudflare KV to store chat history per user (Firebase UID or custom ID).
- Memory Compression: Automatically summarizes long chat histories using Mistral AI to stay within token limits.
- Multi-Modal:
    - Chat: Normal conversation.
    - Search: Can use DuckDuckGo (via 'runSearch') for up-to-date information.
    - File Analysis: Can receive and analyze text-based files ('analyze_file' mode).
    - Image Generation: Uses Stability AI SDXL 1.0 ('image_gen' mode).
    - Image Editing: Uses Stability AI SDXL Refiner 1.0 ('image_edit' mode).
- Savage Mode: A special mode triggered by user request for "roast" or "savage" replies.
- Emoji System: Mandates heavy, natural use of emojis in all responses, with a predefined emoji pack.
- Authentication: Can verify Firebase Auth tokens ('verifyFirebaseToken') to identify users.

Core Functions:
- onRequest(context): The main entry point for all requests. Handles routing to different modes (chat, image, file).
- detectMode(...): Determines the user's intent (chat, image_gen, analyze_file).
- verifyFirebaseToken(idToken): Validates a Firebase JWT without external libraries.
- getMemory() / saveMemory(...): Manages KV storage for chat history.
- compressMemory(...): Summarizes old messages.
- runSearch(query): Fetches results from the DuckDuckGo API.
- shouldTriggerTelugu(message): Checks if the Telangana slang mode should be activated.
- extractText(resp): Safely extracts the text response from the AI model's output.

Deployment:
This file is intended to be deployed directly to a Cloudflare Worker binding. It requires:
1.  A KV Namespace binding named 'CHAT_KV'.
2.  An AI binding named 'SPY_AI'.
