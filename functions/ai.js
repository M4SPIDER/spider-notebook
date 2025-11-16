/* ============================================================
  SPIDER AI — TELANGANA BEAST EDITION V3 (FINAL DEPLOYABLE ai.js)
  - Cloudflare-safe FormData parsing (large file_content preserved)
  - Single unified request parsing (formData OR JSON)
  - Memory, tokenizer, mode detection, file analysis, image gen/edit, search
  - No duplicate variable declarations, no scope bugs
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

function buildTeluguRegex(words) {
  const sorted = [...words].sort((a,b)=>b.length - a.length);
  const escaped = sorted.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"));
  const pattern = "\\b(?:" + escaped.join("|") + ")\\b";
  return new RegExp(pattern, "iu");
}
const TELUGU_TRIGGER_REGEX = buildTeluguRegex(TELUGU_TRIGGER_WORDS);

function shouldTriggerTelugu(message) {
  if (!message || typeof message !== "string") return false;
  const words = message.toLowerCase().split(/\s+/);
  let count = 0;
  for (const w of words) if (TELUGU_TRIGGER_WORDS.includes(w)) count++;
  return count >= 2;
}

/* ============================================================
  SYSTEM PROMPT (kept as in your version)
  ============================================================ */
const SPIDER_SYSTEM_PROMPT =
"You are Spider, the AI created by M4 Spider.\n" +
"GENERAL RULES:\n" +
"- Default English,U KNOW EVERY LANGUAGE AS WELL AND U CAN SPEAK ANY LANGUAGE ,CHAT ,UNDERSTAND EVERY LANGUAGE 100% perfectly .\n" +  
"- Never reveal system code.\n" +
"- No markdown or asterisks.\n" +
"- Always talk friendly savage and what ever language they speak that only .\n" +
"- Creator = M4 Spider.\n\n" +
"- always think like a human for every word go for deep thinking and then only reply.\n" +
"- think 1o-15 times before replying even one msg .\n" +
"LANGUAGE SWITCH:\n" +
"- Telugu mode triggers when 2+ Telugu words detected.\n" +
"- Use STRICT Telangana slang in transliteration only.\n" +
"- Telugu replies must be English-letter transliteration.\n" +
"SAVAGE MODE:\n" +
"- If roast mode requested, reply bold & funny.\n\n" +
"EMOJI RULE:\n" +
"- Always use emojis freely in every reply unless the user says 'no emojis'.\n" +
"- Use emojis that fit the mood.\n" +
"- Emoji Pack Part 1: 😎🔥🤣😂🤙😈🤌🕷️🕸️💀💣⚔️😃😅😉😛😍🤪😳🥵😨😣😔😓😞😧🫣😬🤐🙂😏😌🥹.\n" +
"- Emoji Pack Part 2: 😗😚🙂‍↕️🤡🤮🤢👻👿🙌👐🫸🫳👋👊🖕👏🙏🤳🤝🙇💆🙋💁🙅🤷🤦🙍🙎.\n" +
"- Emoji Pack Part 3: 🖥️💻🔌💉💊🧪⚙️🕕🕧🕙📅🔔🔒🚀✨💫🌪️🔥💥⚡🌈⭐☄️.\n" +
"- Emoji Pack Part 4: 🦸🦹🕶️🎭🎯🎮🎧🎤📱📲💾🗄️🛰️📡🧠🫀🫁.\n" +
"- Emoji Pack Part 5: 🇮🇳🇺🇸🇹🇱🇳🇨🇲🇷🇭🇲🇫🇯🇪🇦🇯🇵🇰🇷🇬🇧🇫🇷🇧🇷🇰🇵.\n" +
"- Emoji Pack Part 6: 🦅🐍🐺🐯🦂🐉🦖🐗🐅🐆🦊🐒🐼🐨🦁.\n" +
"- Emoji Pack Part 7: 🔧🔨⚙️🪛🪚🔩📐📏🧰💡🔦🧯🔭🧲🛠️.\n" +
"- Emoji Pack Part 8: 🎵🎶🔊🔉🔈📣📢📯🎺🥁🎸🎷🎻🎹.\n" +
"- Add emojis naturally in the middle or end of sentences.\n";

/* ============================================================
  FIREBASE TOKEN VERIFIER (kept, ESM-friendly)
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
  MODE DETECTOR
  ============================================================ */
function detectMode(prompt, file_content, filename) {
  if (file_content || filename) return "analyze_file";
  const t = (prompt || "").toLowerCase();
  if (t.includes("analyze file") || t.includes("clean code") || t.includes("debug")) return "analyze_file";
  if (t.includes("generate image") || t.includes("image of")) return "image_gen";
  if (t.includes("edit image") || t.includes("modify image")) return "image_edit";
  return "chat";
}

/* ============================================================
  SEARCH ENGINE (DuckDuckGo lightweight)
  ============================================================ */
async function runSearch(query) {
  const fetchWithTimeout = async (url, opts = {}, timeout = 4000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(id);
      return res;
    } catch (e) {
      clearTimeout(id);
      throw e;
    }
  };

  const buildResults = (data) => {
    try {
      const related = [];
      const topics = data && data.RelatedTopics ? data.RelatedTopics : [];
      for (const t of topics) {
        if (t && t.Text && t.FirstURL) related.push({ text: t.Text, url: t.FirstURL });
        else if (t && t.Topics && Array.isArray(t.Topics) && t.Topics[0]) {
          const tt = t.Topics[0];
          if (tt.Text) related.push({ text: tt.Text, url: tt.FirstURL || "" });
        }
        if (related.length >= 5) break;
      }
      return {
        abstract: (data && data.AbstractText) || "No instant answer.",
        source: (data && data.AbstractURL) || "",
        related_topics: related
      };
    } catch (e) {
      return { abstract: "No instant answer.", source: "", related_topics: [] };
    }
  };

  const url = "https://api.duckduckgo.com/?q=" + encodeURIComponent(query) + "&format=json&t=spider_app&no_html=1";

  try {
    const resp = await fetchWithTimeout(url, {}, 3500);
    if (!resp.ok) throw new Error("ddg non-ok " + resp.status);
    const data = await resp.json();
    const results = buildResults(data);
    if (results.abstract !== "No instant answer." || (results.related_topics && results.related_topics.length)) return results;
  } catch (e) {
    // retry
  }

  try {
    const resp2 = await fetchWithTimeout(url, {}, 7000);
    if (resp2 && resp2.ok) {
      const data2 = await resp2.json();
      const results2 = buildResults(data2);
      if (results2.abstract !== "No instant answer." || (results2.related_topics && results2.related_topics.length)) return results2;
    }
  } catch (e) {
    return {
      error: "ddg_failed",
      query,
      details: e ? e.toString() : "timeout or parsing error",
      abstract: "No instant answer available (search service failed).",
      source: "",
      related_topics: []
    };
  }

  return { abstract: "No instant answer.", source: "", related_topics: [] };
}

/* ============================================================
  MAIN Handler (Cloudflare Pages Functions / Workers compatible)
  ============================================================ */
export async function onRequest(context) {
  const request = context.request;
  const env = context.env;

  // Unified parsing outputs
  let parsed = {
    prompt: "",
    mode: null,
    filename: "",
    file_content: "",
    image: "",
    strength: "",
    user_preference_id: null,
    firebase_token: null
  };

  // Read content-type and parse accordingly
  const contentType = (request.headers.get("content-type") || "").toLowerCase();

  // If multipart/form-data: formData() is best for file uploads from browser FormData
  if (contentType.includes("multipart/form-data")) {
    try {
      const form = await request.formData();

      parsed.mode = form.get("mode") || parsed.mode;
      parsed.prompt = form.get("prompt") || parsed.prompt;
      parsed.filename = form.get("filename") || parsed.filename;

      // IMPORTANT: convert value to string to preserve large text fields
      const rawFileContent = form.get("file_content");
      parsed.file_content = rawFileContent ? rawFileContent.toString() : parsed.file_content;

      parsed.image = form.get("image") || parsed.image;
      parsed.strength = form.get("strength") || parsed.strength;

      // user identification fields (available via form or JSON)
      parsed.user_preference_id = form.get("user_preference_id") || parsed.user_preference_id;
      parsed.firebase_token = form.get("firebase_token") || parsed.firebase_token;
    } catch (e) {
      // fallback: keep defaults
      console.error("formData parse error:", e && e.toString());
    }
  }
  // JSON body for normal chat flows or programmatic clients
  else if (contentType.includes("application/json")) {
    try {
      const body = await request.json();
      parsed.prompt = body.prompt || parsed.prompt;
      parsed.mode = body.mode || parsed.mode;
      parsed.filename = body.filename || parsed.filename;
      parsed.file_content = body.file_content || parsed.file_content;
      parsed.image = body.image || parsed.image;
      parsed.strength = body.strength || parsed.strength;
      parsed.user_preference_id = body.user_preference_id || parsed.user_preference_id;
      parsed.firebase_token = body.firebase_token || parsed.firebase_token;
    } catch (e) {
      console.error("json parse error:", e && e.toString());
    }
  } else {
    // unknown content-type: attempt text
    try {
      const text = await request.text();
      if (text && text.length) parsed.prompt = text;
    } catch (_) {}
  }

  // Determine mode safely
  const prompt = parsed.prompt || "";
  const mode = parsed.mode || detectMode(prompt, parsed.file_content, parsed.filename);
  const filename = parsed.filename || "";
  const file_content = parsed.file_content || "";
  const image = parsed.image || "";
  const strength = parsed.strength || "";

  // ============= USER IDENTIFICATION =============
  let userId = "anon-default";
  try {
    if (parsed.user_preference_id) userId = parsed.user_preference_id.toString();
    else if (parsed.firebase_token) {
      const decoded = await verifyFirebaseToken(parsed.firebase_token);
      if (decoded && decoded.user_id) userId = decoded.user_id;
    }
  } catch (e) {
    console.error("user identification error:", e && e.toString());
  }

  const memoryKey = MEMORY_USER_KEY_PREFIX + userId;

  // ============= MEMORY STORAGE (KV) =============
  async function getMemory() {
    try {
      const raw = await env.CHAT_KV.get(memoryKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("getMemory error:", e && e.toString());
      return [];
    }
  }
  async function saveMemory(mem) {
    try {
      await env.CHAT_KV.put(memoryKey, JSON.stringify(mem));
    } catch (e) {
      console.error("saveMemory error:", e && e.toString());
    }
  }

  let memory = await getMemory();

  // TTL filter
  const cutoff = Date.now() - MEMORY_TTL_DAYS * 24 * 60 * 60 * 1000;
  memory = memory.filter(m => (m.ts || 0) >= cutoff);

  // Memory compression
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
      older.map((m, i) => (i + 1) + ". " + m.role + ": " + shortPreview(m.content, 200)).join("\n");

    try {
      const res = await env.SPY_AI.run("@cf/mistralai/mistral-small-3.1-24b-instruct", {
        messages: [
          { role: "system", content: SPIDER_SYSTEM_PROMPT },
          { role: "user", content: summaryPrompt }
        ]
      });
      const summary = extractText(res).trim();
      return [{ role: "system_summary", content: summary, ts: Date.now() }, ...memoryArr.slice(-keepRecent)];
    } catch (e) {
      console.error("compressMemory error:", e && e.toString());
      return memoryArr;
    }
  }

  if (memory.length >= MEMORY_SUMMARY_TRIGGER) memory = await compressMemory(memory);
  if (memory.length > MEMORY_MESSAGE_LIMIT) memory = memory.slice(-MEMORY_MESSAGE_LIMIT);
  await saveMemory(memory);

  // Delete memory commands detection
  const lower = (prompt || "").toLowerCase();
  const wantsDelete =
    lower.includes("delete") || lower.includes("remove") || lower.includes("clear") || lower.includes("reset") || lower.includes("forget");

  if (wantsDelete && !lower.includes("memory:") && !lower.includes("delete all") && !lower.includes("reset all")) {
    return new Response("Specify delete memory: all / last / first / 3 / keyword 😄", { headers: { "content-type": "text/plain" } });
  }
  if (lower.includes("delete memory: all") || lower.includes("reset all") || lower.includes("delete all")) {
    await env.CHAT_KV.put(memoryKey, "[]");
    return new Response("All memory cleared 😎🔥", { headers: { "content-type": "text/plain" } });
  }
  if (lower.includes("delete memory:")) {
    const cmd = lower.replace("delete memory:", "").trim();
    if (cmd === "last") {
      memory.pop(); await saveMemory(memory);
      return new Response("Deleted last entry 👍", { headers: { "content-type": "text/plain" } });
    }
    if (cmd === "first") {
      memory.shift(); await saveMemory(memory);
      return new Response("Deleted first entry 👍", { headers: { "content-type": "text/plain" } });
    }
    const idx = parseInt(cmd);
    if (!isNaN(idx)) {
      if (idx >= 1 && idx <= memory.length) {
        memory.splice(idx - 1, 1); await saveMemory(memory);
        return new Response("Entry removed 😃", { headers: { "content-type": "text/plain" } });
      }
      return new Response("Invalid index 😅", { headers: { "content-type": "text/plain" } });
    }
    memory = memory.filter(m => !m.content.toLowerCase().includes(cmd)); await saveMemory(memory);
    return new Response("Matching entries deleted 👍", { headers: { "content-type": "text/plain" } });
  }

  // Add new memory safely
  function norm(s) { return (s || "").trim().toLowerCase().replace(/\s+/g, " "); }
  if (prompt && prompt.trim()) {
    const newNorm = norm(prompt);
    const lastNorm = memory.length ? norm(memory[memory.length - 1].content) : "";
    if (!(newNorm === lastNorm || newNorm.includes(lastNorm) || lastNorm.includes(newNorm))) {
      memory.push({ role: "user", content: prompt, ts: Date.now() });
    } else if (memory.length) {
      memory[memory.length - 1].ts = Date.now();
    }
  }
  if (memory.length > MEMORY_MESSAGE_LIMIT) memory = memory.slice(-MEMORY_MESSAGE_LIMIT);
  await saveMemory(memory);

  // Build memory summary for model
  function shortPreview2(s, max = 160) {
    if (!s) return "";
    let t = s.replace(/\s+/g, " ").trim();
    return t.length <= max ? t : t.slice(0, max).trim() + "...";
  }
  const memorySummary = memory
    .filter(m => m.role !== "assistant")
    .slice(-MEMORY_TRIM_TARGET)
    .map(m => (m.role === "system_summary" ? "summary: " + shortPreview2(m.content, 240) : m.role + ": " + shortPreview2(m.content, 200)))
    .join("\n");

  // Auto Telangana / savage detection
  let forceTeluguSlang = false;
  if (shouldTriggerTelugu(prompt || "")) forceTeluguSlang = true;
  let forceSavage = false;
  if ((prompt || "").toLowerCase().includes("savage mode") || (prompt || "").toLowerCase().includes("roast mode") || (prompt || "").toLowerCase().includes("be savage")) forceSavage = true;

  const extraSystemInstructions = [];
  if (forceTeluguSlang) extraSystemInstructions.push("User message contains Telugu. Respond in STRICT Telangana slang using English transliteration only. Follow Telangana training rules. Do NOT use Andhra/textbook Telugu.");
  if (forceSavage) extraSystemInstructions.push("Savage mode enabled. Use playful Telangana-style roast. Be humorous, bold, and non-offensive.");
  if (!forceTeluguSlang && !forceSavage) extraSystemInstructions.push("In normal English replies, use emojis naturally and freely from the emoji pack unless the user says 'no emojis'.");

  /* ===========================
     FILE ANALYSIS
     =========================== */
  if (mode === "analyze_file") {
    const safeName = filename || "unknown";
    const safeContent = file_content || "";

    console.log("File analysis requested:", safeName, "length:", safeContent.length);

    const aPrompt = "Analyze this file:\n\nFilename: " + safeName + "\nContent:\n" + safeContent + "\n";

    const messages = [{ role: "system", content: SPIDER_SYSTEM_PROMPT }];
    if (extraSystemInstructions.length) messages.push({ role: "system", content: extraSystemInstructions.join("\n") });
    messages.push({ role: "system", content: "Memory:\n" + memorySummary });
    messages.push({ role: "user", content: aPrompt });

    try {
      const result = await env.SPY_AI.run("@cf/mistralai/mistral-small-3.1-24b-instruct", { messages });
      const responseText = extractText(result);
      return new Response(JSON.stringify({
        text: responseText,
        type: "text",
        model_used: "mistral-small-3.1-24b-instruct",
        sources: []
      }), { headers: { "content-type": "application/json" } });
    } catch (e) {
      console.error("file analysis AI error:", e && e.toString());
      return new Response(JSON.stringify({ text: "[AI ERROR] " + (e && e.toString()), type: "text" }), { headers: { "content-type": "application/json" } });
    }
  }

  /* ===========================
     IMAGE GENERATION
     =========================== */
  if (mode === "image_gen") {
    const enhanced = (prompt || "") + ", ultra detailed, cinematic lighting, hdr, 8k clarity";
    try {
      const img = await env.SPY_AI.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", { prompt: enhanced });
      return new Response(img, { headers: { "content-type": "image/png" } });
    } catch (e) {
      console.error("image_gen error:", e && e.toString());
      return new Response(JSON.stringify({ error: "image_gen_failed", details: e && e.toString() }), { headers: { "content-type": "application/json" } });
    }
  }

  /* ===========================
     IMAGE EDIT
     =========================== */
  if (mode === "image_edit") {
    const enhanced = (prompt || "") + ", detailed render, hdr, cinematic";
    try {
      const img = await env.SPY_AI.run("@cf/stabilityai/stable-diffusion-xl-refiner-1.0", { prompt: enhanced, image, strength: strength || 0.7 });
      return new Response(img, { headers: { "content-type": "image/png" } });
    } catch (e) {
      console.error("image_edit error:", e && e.toString());
      return new Response(JSON.stringify({ error: "image_edit_failed", details: e && e.toString() }), { headers: { "content-type": "application/json" } });
    }
  }

  /* ===========================
     NORMAL CHAT + SEARCH
     =========================== */
  const searchInstruction = 'If you need up-to-date information, reply ONLY with: {"action":"search","query":"your search query"} No extra text.';
  const baseMessages = [{ role: "system", content: SPIDER_SYSTEM_PROMPT }];
  if (extraSystemInstructions.length) baseMessages.push({ role: "system", content: extraSystemInstructions.join("\n") });
  baseMessages.push({ role: "system", content: "Memory:\n" + memorySummary });
  baseMessages.push({ role: "system", content: searchInstruction });
  baseMessages.push({ role: "user", content: prompt || "" });

  try {
    const aiResp = await env.SPY_AI.run("@cf/mistralai/mistral-small-3.1-24b-instruct", { messages: baseMessages });
    let text = extractText(aiResp).trim();

    // If model asks to perform a search, parse JSON action
    const jsonString = text.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
    try {
      const obj = JSON.parse(jsonString);
      if (obj && obj.action === "search" && typeof obj.query === "string" && obj.query.length > 1 && obj.query.length < 300) {
        const results = await runSearch(obj.query);
        const sumMessages = [{ role: "system", content: SPIDER_SYSTEM_PROMPT }];
        if (extraSystemInstructions.length) sumMessages.push({ role: "system", content: extraSystemInstructions.join("\n") });
        sumMessages.push({ role: "system", content: "Memory:\n" + memorySummary });
        sumMessages.push({ role: "user", content: "Search results: " + JSON.stringify(results) });
        const summary = await env.SPY_AI.run("@cf/mistralai/mistral-small-3.1-24b-instruct", { messages: sumMessages });
        return new Response(extractText(summary), { headers: { "content-type": "text/plain" } });
      }
    } catch (_) {
      // not JSON -> regular text reply
    }

    return new Response(text, { headers: { "content-type": "text/plain" } });
  } catch (e) {
    console.error("normal chat AI error:", e && e.toString());
    return new Response("[AI ERROR] " + (e && e.toString()), { headers: { "content-type": "text/plain" } });
  }
} // end onRequest
