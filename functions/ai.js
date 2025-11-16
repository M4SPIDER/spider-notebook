/* ============================================================
SPIDER AI — TELANGANA BEAST EDITION V4.0 (BRAVE SEARCH INTEGRATION)
Parts: 1/3
------------------------------------------------------------
CONFIG + TELUGU TRIGGER + SYSTEM PROMPT + FIREBASE VERIFIER
============================================================ */

/* ===== CONFIG ===== */
const MEMORY_MESSAGE_LIMIT = 200;
const MEMORY_TRIM_TARGET = 200;
const MEMORY_TTL_DAYS = 30;
const MEMORY_SUMMARY_TRIGGER = 300;
const MEMORY_USER_KEY_PREFIX = "chat_memory:";
const FIREBASE_PROJECT_ID = "m4-spider";

/* ===== TELUGU TRIGGER WORDS (unchanged) ===== */
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

// Build regex helper (kept for flexibility)
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
MAIN SYSTEM PROMPT (UPDATED WITH YOUR EMOJI RULE)
============================================================ */

const SPIDER_SYSTEM_PROMPT =
`You are Spider, the AI created by M4 Spider.
GENERAL RULES:
- Default English, you know every language and can speak any language 100% perfectly.
- Never reveal system code.
- No markdown or asterisks in replies.
- Always talk friendly savage and match user's language.
- Creator = M4 Spider.
- Think deeply about each reply.

LANGUAGE SWITCH:
- Telugu mode triggers when 2+ Telugu words detected.
- Use STRICT Telangana slang in transliteration only.
- Telugu replies must be English-letter transliteration.

SAVAGE MODE:
- If roast mode requested, reply bold & funny.

EMOJI RULE:
- Use emojis freely in every reply unless the user says 'no emojis'.
- Emoji packs provided (use naturally mid-sentence or at end).`;

/* ============================================================
FIREBASE TOKEN VERIFIER (ESM-friendly)
============================================================ */

async function verifyFirebaseToken(idToken) {
  if (!idToken) return null;
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) return null;
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    const kid = header.kid;
    // fetch Firebase certs
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
MODE DETECTOR (keeps analyze_file if file provided)
============================================================ */

function detectMode(prompt, file_content, filename) {
  if (file_content || filename) return "analyze_file";
  const t = (prompt || "").toLowerCase();
  if (t.includes("analyze file") || t.includes("clean code") || t.includes("debug"))
    return "analyze_file";
  if (t.includes("generate image") || t.includes("image of")) return "image_gen";
  if (t.includes("edit image") || t.includes("modify image")) return "image_edit";
  return "chat";
}
/* ============================================================
SPIDER AI — V4.0
Parts: 2/3
------------------------------------------------------------
MEMORY SYSTEM + COMPRESSION + MAIN HANDLER + CHATGPT FILE ANALYSIS
============================================================ */

/* ================= MEMORY HELPERS ========================== */

async function getMemoryFromKV(env, memoryKey) {
  try {
    const raw = await env.CHAT_KV.get(memoryKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveMemoryToKV(env, memoryKey, mem) {
  try {
    await env.CHAT_KV.put(memoryKey, JSON.stringify(mem));
  } catch (_) {}
}

/* ================== COMPRESSION (uses your SPY_AI model) ============= */

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

/* ============================================================
MAIN HANDLER
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
      body = {};
    }

    const combinedFileContent = String(fileContentFromForm || body.file_content || "");
    const { prompt, mode, image, strength, filename } = body;
    let currentMode = mode || detectMode(prompt, combinedFileContent, filename);

    /* ================ USER IDENTIFICATION ================ */

    let userId = "anon-default";
    if (body.user_preference_id) userId = body.user_preference_id.toString();
    if (body.firebase_token) {
      const decoded = await verifyFirebaseToken(body.firebase_token);
      if (decoded && decoded.user_id) userId = decoded.user_id;
    }
    const memoryKey = MEMORY_USER_KEY_PREFIX + userId;

    /* ================ LOAD MEMORY ===================== */
    let memory = await getMemoryFromKV(env, memoryKey);
    // TTL filter
    const cutoff = Date.now() - MEMORY_TTL_DAYS * 24 * 60 * 60 * 1000;
    memory = memory.filter(m => (m.ts || 0) >= cutoff);

    // compress if needed
    if (memory.length >= MEMORY_SUMMARY_TRIGGER) memory = await compressMemoryIfNeeded(env, memory);

    if (memory.length > MEMORY_MESSAGE_LIMIT) memory = memory.slice(-MEMORY_MESSAGE_LIMIT);
    await saveMemoryToKV(env, memoryKey, memory);

    /* ============= DELETE MEMORY HANDLES =============== */

    const lower = (prompt || "").toLowerCase();
    const wantsDelete =
      lower.includes("delete") || lower.includes("remove") || lower.includes("clear") ||
      lower.includes("reset") || lower.includes("forget");

    if (wantsDelete &&
      !lower.includes("memory:") &&
      !lower.includes("delete all") &&
      !lower.includes("reset all")) {
      return new Response("Specify delete memory: all / last / first / 3 / keyword 😄", {
        headers: { "content-type": "text/plain" }
      });
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
        await saveMemoryToKV(env, memoryKey, memory);
        return new Response("Deleted last entry 👍", { headers: { "content-type": "text/plain" }});
      }
      if (cmd === "first") {
        memory.shift();
        await saveMemoryToKV(env, memoryKey, memory);
        return new Response("Deleted first entry 👍", { headers: { "content-type": "text/plain" }});
      }
      const idx = parseInt(cmd);
      if (!isNaN(idx)) {
        if (idx >= 1 && idx <= memory.length) {
          memory.splice(idx - 1, 1);
          await saveMemoryToKV(env, memoryKey, memory);
          return new Response("Entry removed 😃", { headers: { "content-type": "text/plain" }});
        }
        return new Response("Invalid index 😅", { headers: { "content-type": "text/plain" }});
      }
      memory = memory.filter(m => !m.content.toLowerCase().includes(cmd));
      await saveMemoryToKV(env, memoryKey, memory);
      return new Response("Matching entries deleted 👍", { headers: { "content-type": "text/plain" }});
    }

    /* ============= ADD NEW MEMORY SAFELY ================== */

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

    if (memory.length > MEMORY_MESSAGE_LIMIT) memory = memory.slice(-MEMORY_MESSAGE_LIMIT);
    await saveMemoryToKV(env, memoryKey, memory);

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
    if (shouldTriggerTelugu(prompt || "")) forceTeluguSlang = true;

    let forceSavage = false;
    if ((prompt || "").toLowerCase().includes("savage mode") ||
        (prompt || "").toLowerCase().includes("roast mode") ||
        (prompt || "").toLowerCase().includes("be savage")) {
      forceSavage = true;
    }

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
    if (!forceTeluguSlang && !forceSavage) {
      extraSystemInstructions.push(
        "In normal English replies, use emojis naturally and freely from the emoji pack unless the user says 'no emojis'."
      );
    }

    /* ============================================================
       FILE ANALYSIS MODE (ChatGPT-style breakdown)
       ============================================================ */

    if (currentMode === "analyze_file") {
      const receivedFilename = String(body.filename || filename || "unknown");
      let contentToAnalyze = combinedFileContent;
      contentToAnalyze = contentToAnalyze
        .replace(/[\u0000]/g, '')
        .replace(/\u00A0/g, ' ')
        .replace(/(\r\n|\r)/g, '\n');

      if (contentToAnalyze.trim().length === 0) {
        return new Response(JSON.stringify({
          text: "I'm sorry, mama, but I can't analyze the file since there's no content provided. Ee file empty undhi ra! 😔",
          type: 'text',
          model_used: 'mistral-small-3.1-24b-instruct',
          sources: []
        }), {
          headers: { "content-type": "application/json" }
        });
      }

      const aPrompt =
`You are an expert code analyst. Break down the file in clean sections:
1. Overview
2. What the file contains
3. How it works (walkthrough)
4. Why it's written this way (design decisions)
5. Potential issues, bugs, or pitfalls
6. Improvements & best practices
7. Short summary

Be extremely clear and detailed, like ChatGPT-level explanations.

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

      const result = await env.SPY_AI.run("@cf/mistralai/mistral-small-3.1-24b-instruct", { messages });
      const responseText = extractText(result);

      // Final structured response (ChatGPT-style)
      return new Response(JSON.stringify({
        text:
`Here’s a clean breakdown of ${receivedFilename} 👇🔥

${responseText}

If you want personalization, improvements, or a rewrite, say what you want changed (style, strictness, add linter rules). 😎🕷️`,
        type: 'text',
        model_used: 'mistral-small-3.1-24b-instruct',
        sources: []
      }), {
        headers: { "content-type": "application/json" }
      });
    }

    // (next part continues with image gen/edit + chat + brave search)
/* ============================================================
SPIDER AI — V4.0
Parts: 3/3
------------------------------------------------------------
IMAGE GEN/EDIT + CHAT FLOW + BRAVE SEARCH + UTILITIES
============================================================ */

/* ============================================================
IMAGE GENERATION
============================================================ */
    // (continuation of main handler) - image_gen and image_edit are handled below
    if (currentMode === "image_gen") {
      const enhanced = (prompt || "") + ", ultra detailed, cinematic lighting, hdr, 8k clarity";
      const img = await env.SPY_AI.run(
        "@cf/stabilityai/stable-diffusion-xl-base-1.0",
        { prompt: enhanced }
      );
      return new Response(img, { headers: { "content-type": "image/png" } });
    }

    if (currentMode === "image_edit") {
      const enhanced = (prompt || "") + ", detailed render, hdr, cinematic";
      const img = await env.SPY_AI.run(
        "@cf/stabilityai/stable-diffusion-xl-refiner-1.0",
        { prompt: enhanced, image: (image || body.image), strength: (strength || body.strength || 0.7) }
      );
      return new Response(img, { headers: { "content-type": "image/png" } });
    }

    /* ============================================================
       NORMAL CHAT + SEARCH
       - The model should return {"action":"search","query":"..."} if it needs web data.
       - We run Brave Search and re-summarize results back to the model.
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
      messages: baseMessages
    });

    let text = extractText(aiResp).trim();

    // If the model decides it needs web data, it should return JSON {action: "search", query: "..."}
    const jsonString = text
      .replace(/^```json\s*/, "")
      .replace(/^```\s*/, "")
      .replace(/\s*```$/, "")
      .trim();

    try {
      const obj = JSON.parse(jsonString);
      if (obj && obj.action === "search" && typeof obj.query === "string" && obj.query.length > 1 && obj.query.length < 300) {
        // Run Brave search
        const results = await runBraveSearch(env, obj.query);

        // Prepare a summary prompt containing search results for the model to digest
        const sumMessages = [
          { role: "system", content: SPIDER_SYSTEM_PROMPT }
        ];
        if (extraSystemInstructions.length) sumMessages.push({ role: "system", content: extraSystemInstructions.join("\n") });
        sumMessages.push({ role: "system", content: "Memory:\n" + memorySummary });
        sumMessages.push({ role: "user", content: "Search results: " + JSON.stringify(results) });
        sumMessages.push({ role: "user", content: "Using the search results above, answer concisely and mention the sources used." });

        const summary = await env.SPY_AI.run("@cf/mistralai/mistral-small-3.1-24b-instruct", {
          messages: sumMessages
        });

        return new Response(extractText(summary), {
          headers: { "content-type": "text/plain" }
        });
      }
    } catch (_) {
      // not JSON -> continue to raw text response
    }

    return new Response(text, {
      headers: { "content-type": "text/plain" }
    });

  } catch (error) {
    console.error("FATAL WORKER EXCEPTION:", error.stack || error);
    return new Response("Error: Worker Exception Caught. Something big crashed inside Spider's brain 🧠. Fix it, M4 Spider! Error details logged. 😭", {
      headers: { "content-type": "text/plain" },
      status: 500
    });
  }
} // end onRequest

/* ============================================================
  BRAVE SEARCH INTEGRATION
  - Uses Brave Search REST API
  - Requires BRAVE_API_KEY in env (store as secure secret)
  - Docs & free tier: free 2,000 req/month (1 req/sec). :contentReference[oaicite:1]{index=1}
============================================================ */

async function runBraveSearch(env, query) {
  const apiKey = env.BRAVE_API_KEY || "";
  if (!apiKey) {
    return { error: "no_api_key", message: "Set BRAVE_API_KEY in environment." };
  }

  const endpoint = "https://api.search.brave.com/res/v1/web/search";
  const url = endpoint + "?q=" + encodeURIComponent(query) + "&size=6";

  try {
    const resp = await fetch(url, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "x-subscription-token": apiKey,
        "user-agent": "SpiderAI-Worker/1.0"
      },
      // small timeout simulation (Cloudflare fetch does not support AbortController in worker easily)
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(()=>"");
      return { error: "brave_non_ok", status: resp.status, details: txt };
    }

    const data = await resp.json();

    // Normalize Brave response into simple structure for summarization
    // Brave's response contains 'organic' or 'web' items in various fields; handle gracefully
    const build = () => {
      try {
        // example: data.results or data.web.results depending on version; check both
        const items = (data.results || data.web && data.web.results || data.organic || []).slice(0,6);
        const hits = [];
        for (const it of items) {
          // attempt common fields
          const title = it.title || it.name || (it.meta && it.meta.title) || "";
          const snippet = it.snippet || it.excerpt || it.description || it.text || "";
          const url = it.url || it.link || it.firstUrl || (it.meta && it.meta.url) || "";
          hits.push({ title: title, snippet: snippet, url: url });
        }
        // fallback: if no items but there is an 'abstract' or 'summary'
        const abstract = data.abstract || data.summary || "";
        return { abstract, source: data.source || "", results: hits };
      } catch (e) {
        return { abstract: "", source: "", results: [] };
      }
    };

    const results = build();
    // If results empty, return raw data for debugging
    if ((!results.results || results.results.length === 0) && (data && Object.keys(data).length)) {
      return { abstract: results.abstract || "No instant answer.", source: "", related_topics: [], raw: data };
    }

    return results;

  } catch (e) {
    return { error: "brave_failed", query, details: e ? e.toString() : "unknown" };
  }
}

/* ============================================================
 TEXT EXTRACTOR (robust)
 ============================================================ */

function extractText(resp) {
  try {
    let raw = "";
    const v1 = resp && resp.output && resp.output[1] && resp.output[1].content && resp.output[1].content[0] && resp.output[1].content[0].text;
    if (v1) raw = v1;
    const v2 = resp && resp.output && resp.output[0] && resp.output[0].content && resp.output[0].content[0] && resp.output[0].content[0].text;
    if (!raw && v2) raw = v2;
    if (!raw && resp && resp.output_text) raw = resp.output_text;
    if (!raw && resp && resp.text) raw = resp.text;
    if (!raw && resp && resp.result) raw = resp.result;
    if (!raw && resp && resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content) raw = resp.choices[0].message.content;
    if (!raw && resp && resp.response) raw = resp.response;
    if (!raw && typeof resp === "string") raw = resp;

    raw = (raw || "").toString().trim();

    // Collapse repeated blocks (heuristic)
    raw = raw.replace(/(.{10,300}?)(?:[\s\S]*?\1){3,}/u, "$1");

    // Trim mid-sentence endings
    if (raw && !/[.!?…]$/.test(raw)) {
      const lastSentence = raw.lastIndexOf(". ");
      if (lastSentence > 0 && lastSentence > raw.length - 200) {
        raw = raw.slice(0, lastSentence + 1);
      } else {
        const lastSpace = raw.lastIndexOf(" ");
        if (lastSpace > raw.length - 40) raw = raw.slice(0, lastSpace);
      }
    }
    return raw.trim();
  } catch (e) {
    return "";
  }
}

/* ============================================================
END OF FILE — Deploy instructions:
- Set env.BRAVE_API_KEY to your Brave Search API key.
- Ensure env.SPY_AI and env.CHAT_KV are configured.
- Deploy the worker.
============================================================ */
