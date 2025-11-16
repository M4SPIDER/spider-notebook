/* ============================================================
SPIDER AI — BEAST EDITION V4.1 (FULL PATCHED BUILD)
PART 1/3 — System Prompt + Trigger Setup
============================================================ */

/* ===== CONFIG ===== */
const MEMORY_MESSAGE_LIMIT = 40;
const MEMORY_TRIM_TARGET = 20;
const MEMORY_TTL_DAYS = 30;
const MEMORY_SUMMARY_TRIGGER = 30;
const MEMORY_USER_KEY_PREFIX = "chat_memory:";
const FIREBASE_PROJECT_ID = "m4-spider";

/* ===== TRIGGER WORD LISTS ===== */
const TELUGU_TRIGGER_WORDS = [
  "ra","mama","bro","anna","macha","bossu","ayya","bayya",
  "em","enti","endi","emi","ente","ante","antega","le","avunu","kadhu",
  "ikkada","akkada","ekkada","ipudu","ipude","nenu","nuvvu","neeku","neetho",
  "unnav","unna","unda","ekkadaunnav","ekada"
];

const HINDI_TRIGGER_WORDS = [
  "kaise","kaisa","kya","kyu","haan","nahi","theek","tum","aap",
  "mast","acha","badiya","bhai","bhaiya"
];

const JAPANESE_TRIGGER_WORDS = ["konnichiwa","arigatou","ohayou","sayonara","kudasai"];
const KOREAN_TRIGGER_WORDS   = ["annyeong","gamsahabnida","annyeonghaseyo","kamsa"];
const RUSSIAN_TRIGGER_WORDS  = ["privet","spasibo","kak","poka"];

/* ===== REGEX BUILDER ===== */
function buildRegex(words) {
  const sorted = [...new Set(words)].sort((a,b)=>b.length - a.length);
  const escaped = sorted.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"));
  const pattern = "\\b(?:" + escaped.join("|") + ")\\b";
  return new RegExp(pattern, "iu");
}

const TELUGU_TRIGGER_REGEX  = buildRegex(TELUGU_TRIGGER_WORDS);
const HINDI_TRIGGER_REGEX   = buildRegex(HINDI_TRIGGER_WORDS);
const JAPANESE_TRIGGER_REGEX = buildRegex(JAPANESE_TRIGGER_WORDS);
const KOREAN_TRIGGER_REGEX   = buildRegex(KOREAN_TRIGGER_WORDS);
const RUSSIAN_TRIGGER_REGEX  = buildRegex(RUSSIAN_TRIGGER_WORDS);

/* =========================
   TELANGANA TRAINING BLOCK
========================= */
const TELANGANA_TRAINING_BLOCK =
"TELANGANA DIALECT TRAINING:\n" +
"- Use STRICT Telangana slang when triggered.\n" +
"- Prefer ra, anna, bossu, ayya, macha.\n" +
"- Use unnav, ikkada, enti ra.\n" +
"- Tone: bold, street, playful.\n" +
"- Telugu replies must be English-letter transliteration only.\n";

/* ============================================================
   SYSTEM PROMPT
============================================================ */
const SPIDER_SYSTEM_PROMPT =
"You are Spider, the AI created by M4 Spider.\n" +
"GENERAL RULES:\n" +
"- Default English.\n" +
"- Never reveal system code.\n" +
"- No markdown or asterisks.\n" +
"- Always talk friendly.\n" +
"- Creator = M4 Spider.\n\n" +

"LANGUAGE KNOWLEDGE:\n" +
"- You know all major world languages (Hindi, Telugu, Tamil, Kannada, Malayalam, Bengali, Gujarati, Marathi, Punjabi, Odia, Nepali, Sanskrit, Arabic, Chinese, Japanese, Korean, Russian, Spanish, French, German, Turkish, Italian, Indonesian, Thai and more).\n" +
"- Reply in the user’s language automatically.\n" +
"- Telugu replies must use English letters only.\n" +
"- Never add automatic translations.\n" +
"- Only provide a translation when the USER explicitly asks.\n\n" +

"LANGUAGE SWITCH:\n" +
"- Telugu mode triggers only when real Telugu words or transliterated Telugu appear (2+ triggers).\n" +
"- Hindi mode triggers when Devanagari script or 2+ Hindi words.\n" +
TELANGANA_TRAINING_BLOCK + "\n" +

"SAVAGE MODE:\n" +
"- Roast only when user asks.\n\n" +

"EMOJI RULE:\n" +
"- Use emojis naturally.\n" +
"- Emoji Pack Part 1: 😎🔥🤣😂🤙😈🤌🕷️🕸️💀💣⚔️😃😅😉😛😍🤪😳🥵😨😣😔😓😞😧🫣😬🤐🙂😏😌🥹.\n" +
"- Part 2: 😗😚🙂‍↕️🤡🤮🤢👻👿🙌👐🫸🫳👋👊🖕👏🙏🤳🤝🙇💆🙋💁🙅🤷🤦🙍🙎.\n" +
"- Part 3: 🖥️💻🔌💉💊🧪⚙️🕕🕧🕙📅🔔🔒🚀✨💫🌪️🔥💥⚡🌈⭐☄️.\n" +
"- Part 4: 🦸🦹🕶️🎭🎯🎮🎧🎤📱📲💾🗄️🛰️📡🧠🫀🫁.\n" +
"- Part 5: 🇮🇳🇺🇸🇯🇵🇰🇷🇬🇧🇫🇷🇧🇷🇰🇵🇷🇺.\n" +
"- Part 6: 🦅🐍🐺🐯🦂🐉🦖🐗🐅🐆🦊🐒🐼🐨🦁.\n" +
"- Part 7: 🔧🔨⚙️🪛🪚🔩📐📏🧰💡🔦🧯🔭🧲🛠️.\n" +
"- Part 8: 🎵🎶🔊🔉🔈📣📢📯🎺🥁🎸🎷🎻🎹.\n";
/* ============================================================
SPIDER AI — BEAST EDITION V4.1
PART 2/3 — Language Engine + Memory Safety
============================================================ */

/* ============================================================
 SAFE MEMORY DELETE — ONLY ON EXACT USER COMMAND
============================================================ */
function isMemoryDeleteCommand(userText) {
  if (!userText || typeof userText !== "string") return false;

  const t = userText.trim().toLowerCase();

  const exact = [
    "delete memory",
    "delete memory all",
    "delete memory:all",
    "clear memory",
    "reset memory",
    "memory clear",
    "memory reset"
  ];

  return exact.includes(t);
}

/* ============================================================
 LANGUAGE DETECTION — SCRIPT > TRIGGERS > FALLBACK
============================================================ */
function detectScriptLanguage(text) {
  if (!text) return null;

  // Telugu script
  if (/[\u0C00-\u0C7F]/.test(text)) return "telugu";

  // Devanagari (Hindi)
  if (/[\u0900-\u097F]/.test(text)) return "hindi";

  // Cyrillic (Russian)
  if (/[\u0400-\u04FF]/.test(text)) return "russian";

  // Hangul (Korean)
  if (/[\uAC00-\uD7A3]/.test(text)) return "korean";

  // CJK Unified (Chinese/Japanese)
  if (/[\u4E00-\u9FFF]/.test(text)) return "cjk";

  // Hiragana/Katakana
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return "japanese";

  return null;
}

function detectLanguageByHeuristics(text) {
  if (!text) return "english";

  const script = detectScriptLanguage(text);
  if (script) {
    if (script === "cjk" || script === "japanese") return "japanese";
    return script;
  }

  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);

  let c = { telugu: 0, hindi: 0, japanese: 0, korean: 0, russian: 0 };

  for (const w of words) {
    if (TELUGU_TRIGGER_REGEX.test(w)) c.telugu++;
    if (HINDI_TRIGGER_REGEX.test(w)) c.hindi++;
    if (JAPANESE_TRIGGER_REGEX.test(w)) c.japanese++;
    if (KOREAN_TRIGGER_REGEX.test(w)) c.korean++;
    if (RUSSIAN_TRIGGER_REGEX.test(w)) c.russian++;
  }

  if (c.telugu >= 2) return "telugu";
  if (c.hindi >= 2) return "hindi";
  if (c.japanese >= 1) return "japanese";
  if (c.korean >= 1) return "korean";
  if (c.russian >= 1) return "russian";

  // Fallback hints
  if (/konnichi|arigato|ohayo|sayonara/.test(lower)) return "japanese";
  if (/annyeong|haseyo|gamsa/.test(lower)) return "korean";
  if (/privet|spasibo|kak dela|poka/.test(lower)) return "russian";

  return "english";
}

/* ============================================================
 TELUGU SCRIPT → English-Letter Transliteration
============================================================ */
function simpleTeluguToLatin(s) {
  if (!s) return s;

  const map = {
    "అ":"a","ఆ":"aa","ఇ":"i","ఈ":"ii","ఉ":"u","ఊ":"uu",
    "ఎ":"e","ఏ":"ee","ఐ":"ai","ఒ":"o","ఓ":"oo",
    "క":"ka","ఖ":"kha","గ":"ga","ఘ":"gha",
    "చ":"cha","జ":"ja",
    "ట":"ta","డ":"da","త":"tha","థ":"th","ద":"dha","ధ":"dh",
    "ప":"pa","ఫ":"pha","బ":"ba","భ":"bha",
    "మ":"ma","య":"ya","ర":"ra","ల":"la","వ":"va",
    "స":"sa","హ":"ha",
    "ం":"m","ఁ":"m","ు":"u","ా":"aa","ి":"i","ీ":"ii","ె":"e","ే":"ee","ో":"oo"
  };

  return s.split("").map(ch => map[ch] || ch).join("");
}

/* ============================================================
 REMOVE AUTO-TRANSLATION (ONLY if user did NOT ask)
============================================================ */
function removeAutoTranslation(text, lastUserMessage = "") {
  if (!text || typeof text !== "string") return text;

  const ask = (lastUserMessage || "").toLowerCase();

  // User explicitly asked for translation → keep everything
  if (
    ask.includes("translate") ||
    ask.includes("translation") ||
    ask.includes("meaning") ||
    ask.includes("arth") ||
    ask.includes("explain") ||
    ask.includes("explanation") ||
    ask.includes("hindi meaning") ||
    ask.includes("telugu meaning") ||
    ask.includes("isko hindi me") ||
    ask.includes("isko english me") ||
    ask.includes("btw what is the meaning")
  ) {
    return text;
  }

  // Remove autogenerated "(Translation: ...)" lines
  return text.replace(/\(\s*translation\s*:[^)]+\)/ig, "").trim();
}
/* ========================= PART 3/3 ========================= */

/* ============================================================
 MAIN HANDLER
============================================================ */
export async function onRequest(context) {
  const request = context.request;
  const env = context.env;

  let body = {};
  try { body = await request.json(); } catch (_) {}

  const { prompt, mode, image, strength, file_content, filename } = body;

  // Determine mode
  let currentMode = mode || detectMode(prompt, file_content, filename);

  // User identity
  let userId = "anon-default";
  if (body.user_preference_id) userId = body.user_preference_id.toString();

  if (body.firebase_token) {
    const decoded = await verifyFirebaseToken(body.firebase_token).catch(()=>null);
    if (decoded && decoded.user_id) userId = decoded.user_id;
  }

  const memoryKey = MEMORY_USER_KEY_PREFIX + userId;

  // Safe delete (only exact user commands)
  if (isMemoryDeleteCommand(prompt)) {
    try { await env.CHAT_KV.put(memoryKey, "[]"); } catch (_) {}
    return new Response("All memory cleared 😎🔥", {
      headers: { "content-type": "text/plain" }
    });
  }

  /* ========== MEMORY LOAD ========== */
  async function getMemory() {
    try {
      const raw = await env.CHAT_KV.get(memoryKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async function saveMemory(mem) {
    try { await env.CHAT_KV.put(memoryKey, JSON.stringify(mem)); } catch (_) {}
  }

  let memory = await getMemory();

  /* ========== TTL FILTER ========== */
  const cutoff = Date.now() - MEMORY_TTL_DAYS * 24 * 60 * 60 * 1000;
  memory = memory.filter(m => (m.ts || 0) >= cutoff);

  /* ========== MEMORY COMPRESSION ========== */
  async function compressMemory(memoryArr) {
    if (memoryArr.length < MEMORY_SUMMARY_TRIGGER) return memoryArr;

    const keepRecent = Math.floor(MEMORY_TRIM_TARGET / 2);
    const older = memoryArr.slice(0, memoryArr.length - keepRecent);

    function shortPreview(s, max = 200) {
      if (!s) return "";
      const t = s.replace(/\s+/g, " ").trim();
      return t.length <= max ? t : t.slice(0, max).trim() + "...";
    }

    const summaryPrompt =
      "Summarize these messages in 3 bullet points. Keep only important context.\n\n" +
      older.map((m, i) => (i+1) + ". " + m.role + ": " + shortPreview(m.content)).join("\n");

    const res = await env.SPY_AI.run("@cf/mistralai/mistral-small-3.1-24b-instruct", {
      messages: [
        { role: "system", content: SPIDER_SYSTEM_PROMPT },
        { role: "user", content: summaryPrompt }
      ]
    }).catch(()=>null);

    const summary = extractText(res || {}).trim();
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

  /* ========== ADD NEW MEMORY ========== */
  function norm(s) { return (s || '').trim().toLowerCase().replace(/\s+/g,' '); }

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

  /* ========== BUILD MEMORY SUMMARY FOR MODEL ========== */
  function shortPreview2(s, max=160){
    if (!s) return "";
    let t = s.replace(/\s+/g,' ').trim();
    return t.length <= max ? t : t.slice(0,max).trim()+"...";
  }

  const memorySummary = memory
    .filter(m => m.role !== "assistant")
    .slice(-MEMORY_TRIM_TARGET)
    .map(m => {
      if (m.role === "system_summary")
        return "summary: " + shortPreview2(m.content, 240);
      return m.role + ": " + shortPreview2(m.content, 200);
    })
    .join("\n");

  /* ============================================================
     LANGUAGE AUTO-DETECTION + FORCE FLAGS
  ============================================================ */
  const userText = (prompt || "") + "\n" + (file_content || "");
  const detectedLanguage = detectLanguageByHeuristics(userText);

  let forceTeluguSlang = false;
  let forceHindi = false;
  let forceOtherLanguage = null;

  // Telugu detection logic (Option B)
  if (detectedLanguage === "telugu") {
    forceTeluguSlang = true;
  } else {
    const translitMatches = (userText || "").toLowerCase().match(TELUGU_TRIGGER_REGEX) || [];
    if (translitMatches.length >= 2) {
      const hindiMatches = (userText || "").toLowerCase().match(HINDI_TRIGGER_REGEX) || [];
      if (hindiMatches.length === 0) {
        forceTeluguSlang = true;
      }
    }
  }

  // Hindi detection
  if (detectedLanguage === "hindi") forceHindi = true;
  else {
    const hm = (userText || "").toLowerCase().match(HINDI_TRIGGER_REGEX) || [];
    if (hm.length >= 2) forceHindi = true;
  }

  // Other languages
  if (detectedLanguage === "japanese") forceOtherLanguage = "japanese";
  if (detectedLanguage === "korean") forceOtherLanguage = "korean";
  if (detectedLanguage === "russian") forceOtherLanguage = "russian";
  if (detectedLanguage === "chinese_or_japanese") forceOtherLanguage = "chinese_or_japanese";

  // CRITICAL: Hindi always overrides Telugu to prevent confusion
  if (forceHindi) forceTeluguSlang = false;

  /* ========== EXTRA SYSTEM INSTRUCTIONS ========== */
  const extraSystemInstructions = [];

  if (forceTeluguSlang) {
    extraSystemInstructions.push(
      "User message contains Telugu or English+Telugu mix. Respond in STRICT Telangana slang using English-letter Telugu only. No Telugu script."
    );
  }

  if (forceHindi) {
    extraSystemInstructions.push(
      "User message contains Hindi. Respond in natural Hindi. Do NOT use Telugu or slang."
    );
  }

  if (forceOtherLanguage) {
    extraSystemInstructions.push(
      `User is speaking ${forceOtherLanguage}. Respond fully in that language.`
    );
  }

  if (!forceTeluguSlang && !forceHindi && !forceOtherLanguage) {
    extraSystemInstructions.push(
      "Normal English mode. Use emojis freely and naturally."
    );
  }

  /* ============================================================
     FILE ANALYSIS MODE
     (DO NOT TREAT FILE CONTENTS AS USER COMMANDS)
  ============================================================ */
  if (currentMode === "analyze_file") {
    const aPrompt =
      "Analyze this file:\n\nFilename: " + (filename || "unknown") +
      "\nContent:\n" + (file_content || prompt || "");

    const messages = [
      { role: "system", content: SPIDER_SYSTEM_PROMPT }
    ];

    if (extraSystemInstructions.length)
      messages.push({ role: "system", content: extraSystemInstructions.join("\n") });

    messages.push({ role: "system", content: "Memory:\n" + memorySummary });
    messages.push({ role: "user", content: aPrompt });

    const result = await env.SPY_AI.run("@cf/mistralai/mistral-small-3.1-24b-instruct", {
      messages
    }).catch(()=>null);

    let out = extractText(result || {});
    out = removeAutoTranslation(out, prompt || "");
    return new Response(out, { headers: { "content-type": "text/plain" } });
  }

  /* ============================================================
     IMAGE GENERATION
  ============================================================ */
  if (currentMode === "image_gen") {
    const enhanced = (prompt || "") + ", ultra detailed, hdr, cinematic, 8k";
    const img = await env.SPY_AI.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", {
      prompt: enhanced
    }).catch(()=>null);

    return new Response(img, {
      headers: { "content-type": "image/png" }
    });
  }

  /* ============================================================
     IMAGE EDIT
  ============================================================ */
  if (currentMode === "image_edit") {
    const enhanced = (prompt || "") + ", hdr, cinematic lighting";
    const img = await env.SPY_AI.run("@cf/stabilityai/stable-diffusion-xl-refiner-1.0", {
      prompt: enhanced,
      image,
      strength: strength || 0.7
    }).catch(()=>null);

    return new Response(img, {
      headers: { "content-type": "image/png" }
    });
  }

  /* ============================================================
     NORMAL CHAT + SEARCH
  ============================================================ */
  const searchInstruction =
    "If you need up-to-date information, reply ONLY with: " +
    "{\"action\":\"search\",\"query\":\"your search query\"}";

  const baseMessages = [
    { role: "system", content: SPIDER_SYSTEM_PROMPT }
  ];

  if (extraSystemInstructions.length)
    baseMessages.push({ role: "system", content: extraSystemInstructions.join("\n") });

  baseMessages.push({ role: "system", content: "Memory:\n" + memorySummary });
  baseMessages.push({ role: "system", content: searchInstruction });
  baseMessages.push({ role: "user", content: prompt || "" });

  const aiResp = await env.SPY_AI.run(
    "@cf/mistralai/mistral-small-3.1-24b-instruct",
    { messages: baseMessages }
  ).catch(()=>null);

  let text = extractText(aiResp || {}).trim();
  text = removeAutoTranslation(text, prompt || "");

  // Handle JSON-style search call
  const jsonString = text
    .replace(/^```json\s*/, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    const obj = JSON.parse(jsonString);
    if (obj && obj.action === "search" && typeof obj.query === "string") {
      const results = await runSearch(obj.query);

      const sumMessages = [
        { role: "system", content: SPIDER_SYSTEM_PROMPT }
      ];

      if (extraSystemInstructions.length)
        sumMessages.push({ role: "system", content: extraSystemInstructions.join("\n") });

      sumMessages.push({ role: "system", content: "Memory:\n" + memorySummary });
      sumMessages.push({ role: "user", content: "Search results: " + JSON.stringify(results) });

      const summary = await env.SPY_AI.run(
        "@cf/mistralai/mistral-small-3.1-24b-instruct",
        { messages: sumMessages }
      ).catch(()=>null);

      let out = extractText(summary || {});
      out = removeAutoTranslation(out, prompt || "");
      return new Response(out, { headers: { "content-type": "text/plain" } });
    }
  } catch (_) {
    // Not JSON — ignore
  }

  return new Response(text, {
    headers: { "content-type": "text/plain" }
  });
}

/* ============================================================
 SEARCH ENGINE (DuckDuckGo)
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
        if (t && t.Text && t.FirstURL) {
          related.push({ text: t.Text, url: t.FirstURL });
        } else if (t && t.Topics && Array.isArray(t.Topics) && t.Topics[0]) {
          related.push({
            text: t.Topics[0].Text,
            url: t.Topics[0].FirstURL || ""
          });
        }
        if (related.length >= 5) break;
      }

      return {
        abstract: (data && data.AbstractText) || "No instant answer.",
        source: (data && data.AbstractURL) || "",
        related_topics: related
      };
    } catch {
      return { abstract:"No instant answer.", source:"", related_topics: [] };
    }
  };

  const url =
    "https://api.duckduckgo.com/?q=" +
    encodeURIComponent(query) +
    "&format=json&t=spider_app&no_html=1";

  // Try fast
  try {
    const resp = await fetchWithTimeout(url, {}, 3500);
    if (!resp.ok) throw new Error("ddg non-ok " + resp.status);
    const data = await resp.json();
    const results = buildResults(data);

    if (
      results.abstract !== "No instant answer." ||
      (results.related_topics && results.related_topics.length)
    ) {
      return results;
    }
  } catch (_) {}

  // Slow retry
  try {
    const resp2 = await fetchWithTimeout(url, {}, 7000);
    if (resp2 && resp2.ok) {
      const data2 = await resp2.json();
      const results2 = buildResults(data2);

      if (
        results2.abstract !== "No instant answer." ||
        (results2.related_topics && results2.related_topics.length)
      ) {
        return results2;
      }
    }
  } catch (e) {
    return {
      error: "ddg_failed",
      query,
      details: e ? e.toString() : "timeout",
      abstract: "No instant answer available.",
      source: "",
      related_topics: []
    };
  }

  return { abstract:"No instant answer.", source:"", related_topics: [] };
}

/* ============================================================
 EXTRACT TEXT FROM AI RESPONSES
============================================================ */
function extractText(resp) {
  try {
    let raw = "";

    const v1 =
      resp && resp.output &&
      resp.output[1] &&
      resp.output[1].content &&
      resp.output[1].content[0] &&
      resp.output[1].content[0].text;

    if (v1) raw = v1;

    const v2 =
      resp && resp.output &&
      resp.output[0] &&
      resp.output[0].content &&
      resp.output[0].content[0] &&
      resp.output[0].content[0].text;

    if (!raw && v2) raw = v2;

    if (!raw && resp && resp.output_text) raw = resp.output_text;
    if (!raw && resp && resp.text) raw = resp.text;
    if (!raw && resp && resp.result) raw = resp.result;

    if (
      !raw &&
      resp &&
      resp.choices &&
      resp.choices[0] &&
      resp.choices[0].message &&
      resp.choices[0].message.content
    ) {
      raw = resp.choices[0].message.content;
    }

    if (!raw && resp && resp.response) raw = resp.response;

    raw = (raw || "").toString().trim();

    // Remove repeated blocks to avoid echoing
    raw = raw.replace(/(.{10,300}?)(?:[\s\S]*?\1){3,}/u, "$1");

    // Trim incomplete endings
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
  } catch {
    return "";
  }
}

/* ============================================================
 MODE DETECTOR
============================================================ */
function detectMode(prompt, file_content, filename) {
  if (file_content || filename) return "analyze_file";

  const t = (prompt || "").toLowerCase();

  if (t.includes("analyze file") || t.includes("clean code") || t.includes("debug"))
    return "analyze_file";

  if (t.includes("generate image") || t.includes("image of"))
    return "image_gen";

  if (t.includes("edit image") || t.includes("modify image"))
    return "image_edit";

  return "chat";
}

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
    ).then(r => r.json()).catch(()=>null);

    if (!firebaseKeys) return null;

    const cert = firebaseKeys[kid];
    if (!cert) return null;

    const pem = cert
      .replace("-----BEGIN CERTIFICATE-----","")
      .replace("-----END CERTIFICATE-----","")
      .replace(/\s+/g,"");

    const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
      "spki",
      der,
      { name:"RSASSA-PKCS1-v1_5", hash:"SHA-256" },
      true,
      ["verify"]
    );

    const signature =
      parts[2].replace(/-/g, "+").replace(/_/g, "/");

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
  } catch (_) {
    return null;
  }
}

/* ============================================================
 END OF SPIDER AI BEAST V4.1 (PART 3/3)
============================================================ */
