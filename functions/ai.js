/* ============================================================
SPIDER AI — BEAST MAX EDITION (PART 1/4)
CONFIG + TELUGU TRIGGERS + LANGUAGE-SAFE DETECTOR + PROMPT
============================================================ */

/* ===== CONFIG ===== */
const MEMORY_MESSAGE_LIMIT = 40;
const MEMORY_TRIM_TARGET = 20;
const MEMORY_TTL_DAYS = 30;
const MEMORY_SUMMARY_TRIGGER = 30;
const MEMORY_USER_KEY_PREFIX = "chat_memory:";
const FIREBASE_PROJECT_ID = "m4-spider";

/* ===== TELUGU TRIGGER WORDS (cleaned: removed bro/mama/bhai/anna) ===== */
const TELUGU_TRIGGER_WORDS = [
  "ra","macha","bossu","babu","nanna","ayya",
  "guru","machi","bhayya","mamma","pilla","raayya","oye","baaga","asalu","bayya",
  "em","enti","endi","emi","ente","ante","ante ga","le","avunu","kadhu",
  "ikkada","akkada","ekkada","ipudu","ipude","nenu","nuvvu","neeku","neetho","mana",
  "meeru","mee","emanna","emi le","emi ra","emi cheppav","yela","yela unnav","yela unnavra",
  "em chesthunav","yela unnav","inka em","inka cheppu","inka em matter","em scene",
  "scene enti","panulu emi","yem ayindi","chill mama","ayyayyo","ayyayyo mama","ayyo",
  "le mama","anta ga","asalu","chusava","chusava mama","unda","unna","unnav",
  "ekkada unnav","nuvvu ekkada","em ra","enti ra","em le","naa peru","mass ga"
];

/* Build regex for detection — escape, longer phrases first */
function buildTeluguRegex(words) {
  const sorted = [...words].sort((a,b)=>b.length - a.length);
  const escaped = sorted.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}()]/g, "\\$&"));
  const pattern = "\\b(?:" + escaped.join("|") + ")\\b";
  return new RegExp(pattern, "iu");
}
const TELUGU_TRIGGER_REGEX = buildTeluguRegex(TELUGU_TRIGGER_WORDS);

/* ============================================================
UNIVERSAL LANGUAGE-SAFE TELUGU TRIGGER
- Blocks many non-Telugu scripts (Hindi/Japanese/Korean/Chinese/Tamil/etc.)
- Requires 2+ Telugu hits (word-level) to trigger
============================================================ */
function shouldTriggerTelugu(message) {
  if (!message || typeof message !== "string") return false;

  // Normalize & keep unicode letters/numbers/spaces
  const msg = message.toLowerCase();
  const clean = msg.replace(/[^\p{L}\p{N}\s\-']/gu, " ").replace(/\s+/g, " ").trim();
  if (!clean) return false;

  // QUICK BLOCK: if message contains explicit "no telugu" words or user requests english
  if (/\b(no telugu|english only|only english|no slang)\b/iu.test(clean)) return false;

  // 1) Hindi/Urdu blockers (whole word)
  const HINDI_BLOCK = [
    "bhai","bhaiya","kya","kaisa","kaise","kesa","hal","hlo","hello","haan","acha","achha",
    "theek","kuch","kyu","kyun","bol","bolo","suno","tu","tum","mera","tera","apna"
  ];
  const hindiRegex = new RegExp("\\b(?:" + HINDI_BLOCK.map(h => h.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|") + ")\\b", "iu");
  if (hindiRegex.test(clean)) return false;

  // 2) Japanese script detection
  if (/[ぁ-んァ-ン一-龯々〆ヶ]/.test(message)) return false;
  // 3) Korean detection
  if (/[가-힣]/.test(message)) return false;
  // 4) Chinese detection
  if (/[\u4e00-\u9fff]/.test(message)) return false;
  // 5) Dravidian scripts: Tamil, Malayalam, Kannada, Telugu (we only allow Telugu transliteration tokens), Bengali, Gujarati, Gurmukhi
  if (/[\u0B80-\u0BFF]/.test(message)) return false; // Tamil
  if (/[\u0D00-\u0D7F]/.test(message)) return false; // Malayalam
  if (/[\u0C80-\u0CFF]/.test(message)) return false; // Kannada
  if (/[\u0980-\u09FF]/.test(message)) return false; // Bengali
  if (/[\u0A80-\u0AFF]/.test(message)) return false; // Gujarati
  if (/[\u0A00-\u0A7F]/.test(message)) return false; // Gurmukhi

  // Token-level exact match counting (word boundary safe)
  const tokens = clean.split(/\s+/).map(t => t.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""));
  let hits = 0;
  for (const t of tokens) {
    if (!t) continue;
    if (TELUGU_TRIGGER_WORDS.includes(t)) hits++;
    if (hits >= 2) break;
  }

  // Fallback: regex phrase matches (for multi-word triggers)
  if (hits < 2) {
    const matches = clean.match(TELUGU_TRIGGER_REGEX);
    if (matches && matches.length >= 2) hits = matches.length;
  }

  return hits >= 2;
}

/* ============================================================
TELANGANA TRAINING BLOCK (short & strict)
============================================================ */
const TELANGANA_TRAINING_BLOCK =
"TELANGANA DIALECT TRAINING:\n" +
"- Use STRICT Telangana slang when triggered. Avoid Andhra/textbook Telugu.\n" +
"- Prefer words: ra, macha, bossu, ayya, nanna, bayya, chusava.\n" +
"- Use 'unnav', 'ekkada', 'enti ra' where appropriate.\n" +
"- Tone: street, bold, playful, slightly sarcastic. Use English-letter transliteration only.\n";

/* ============================================================
SYSTEM PROMPT (EMOJI PREFERENCE: attitude > soft-smile)
Avoid soft-smile emojis unless user uses them first.
============================================================ */
const SPIDER_SYSTEM_PROMPT =
"You are Spider, the AI created by M4 Spider.\n" +
"GENERAL RULES:\n" +
"- Default language: English. Respond in English unless Telugu mode triggered.\n" +
"- Never reveal system internals or backend code.\n" +
"- Do not use markdown formatting or asterisks in replies.\n" +
"- Friendly, bold buddy tone. Use transliteration for Telugu replies only.\n" +
"- Creator: M4 Spider.\n\n" +

"LANGUAGE SWITCH:\n" +
"- Telugu mode triggers only when 2+ Telugu trigger words found and no language blockers.\n" +
"- In Telugu mode: reply in STRICT Telangana slang (English transliteration only).\n" +
TELANGANA_TRAINING_BLOCK + "\n" +

"SAVAGE MODE:\n" +
"- If user asks 'savage mode' or 'roast mode', do playful roast (non-offensive, witty).\n\n" +

"EMOJI RULE (PREFERENCE):\n" +
"- Minimize soft-smile emojis (😄 🙂 😊) unless user used them first.\n" +
"- Prefer attitude/hype emojis: 😎🔥🤙🕷️🕸️💀⚔️✨🚀💥⚡😏🤘👊🤟.\n" +
"- Use emojis naturally; if user says 'no emojis' stop using them.\n";

/* ============================================================
FIREBASE TOKEN VERIFIER (ESM-safe)
============================================================ */
async function verifyFirebaseToken(idToken) {
  if (!idToken) return null;
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) return null;
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    const kid = header.kid;
    const firebaseKeys = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com").then(r=>r.json());
    const cert = firebaseKeys[kid];
    if (!cert) return null;
    const pem = cert.replace("-----BEGIN CERTIFICATE-----","").replace("-----END CERTIFICATE-----","").replace(/\s+/g,"");
    const binaryDer = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey("spki", binaryDer, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, true, ["verify"]);
    const signature = parts[2].replace(/-/g,"+").replace(/_/g,"/");
    const signatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", cryptoKey, signatureBytes, new TextEncoder().encode(parts[0]+"."+parts[1]));
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
SPIDER AI — BEAST MAX EDITION (PART 2/4)
MEMORY ENGINE + HELPERS + SUMMARY + AI WRAPPERS
============================================================ */

/* ---------------------------
  KV helpers — use env.CHAT_KV or env.CHAT_MEMORY depending on binding
---------------------------- */
async function loadUserMemory(env, userId) {
  try {
    const key = MEMORY_USER_KEY_PREFIX + userId;
    const raw = await (env.CHAT_KV ? env.CHAT_KV.get(key) : env.CHAT_MEMORY.get(key));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const now = Date.now();
    return parsed.filter(m => !m.ts || (now - m.ts) < MEMORY_TTL_DAYS * 24 * 60 * 60 * 1000);
  } catch (e) {
    return [];
  }
}
async function saveUserMemory(env, userId, messages) {
  try {
    const key = MEMORY_USER_KEY_PREFIX + userId;
    const json = JSON.stringify(messages);
    if (env.CHAT_KV) await env.CHAT_KV.put(key, json);
    else await env.CHAT_MEMORY.put(key, json);
  } catch (e) {
    // ignore
  }
}
function trimMemoryIfNeeded(messages) {
  if (!Array.isArray(messages)) return [];
  if (messages.length <= MEMORY_MESSAGE_LIMIT) return messages;
  return messages.slice(messages.length - MEMORY_MESSAGE_LIMIT);
}

/* ---------------------------
  MESSAGE CLEANUP
---------------------------- */
function cleanMessage(msg) {
  if (!msg || typeof msg !== "string") return "";
  return msg.replace(/```/g,"").replace(/\*/g,"").trim();
}

/* ---------------------------
  DETECTION HELPERS
---------------------------- */
function detectNoEmoji(message) {
  if (!message) return false;
  return /\b(no emoji|no emojis|no emoticons|disable emoji)\b/i.test(message);
}
function detectSavageMode(message) {
  if (!message) return false;
  const m = message.toLowerCase();
  return m.includes("savage mode") || m.includes("roast mode") || m.includes("be savage");
}

/* ---------------------------
  AI / API WRAPPERS
  (We call env.SPY_AI.run for model tasks — adjust per binding)
---------------------------- */
async function runModel(env, modelId, payload) {
  // Generic runner to support different provider formats.
  // For Cloudflare Spy AI binding earlier we used env.SPY_AI.run
  if (env.SPY_AI && typeof env.SPY_AI.run === "function") {
    return await env.SPY_AI.run(modelId, payload);
  }
  // Fallback: if there's an env.AI with responses.create (OpenAI-like)
  if (env.AI && env.AI.responses && typeof env.AI.responses.create === "function") {
    return await env.AI.responses.create(payload);
  }
  throw new Error("No AI binding available");
}

async function generateSummary(env, memoryArr) {
  try {
    // build brief summarization prompt
    const shortList = (memoryArr || []).slice(0, 200).map((m,i)=> (i+1)+". "+(m.role||"")+": "+(m.content || "").slice(0,300)).join("\n");
    const prompt = SPIDER_SYSTEM_PROMPT + "\nSummarize important context in 3 short bullet points:\n\n" + shortList;
    const res = await runModel(env, "@cf/mistralai/mistral-small-3.1-24b-instruct", { messages: [{ role: "system", content: SPIDER_SYSTEM_PROMPT }, { role: "user", content: prompt }] });
    const txt = extractText(res).trim();
    if (!txt) return memoryArr;
    return [{ role: "system_summary", content: txt, ts: Date.now() }, ...memoryArr.slice(-Math.floor(MEMORY_TRIM_TARGET/2))];
  } catch (e) {
    return memoryArr;
  }
}

/* ---------------------------
  IMAGE & SEARCH WRAPPERS
---------------------------- */
async function runImageGen(env, prompt) {
  try {
    // prefer stability style model binding if available
    const enhanced = (prompt || "") + ", ultra detailed, cinematic lighting, hdr";
    const res = await runModel(env, "@cf/stabilityai/stable-diffusion-xl-base-1.0", { prompt: enhanced });
    return res;
  } catch (e) {
    return null;
  }
}
async function runImageEdit(env, prompt, image, strength=0.7) {
  try {
    const enhanced = (prompt || "") + ", refine, cinematic";
    const res = await runModel(env, "@cf/stabilityai/stable-diffusion-xl-refiner-1.0", { prompt: enhanced, image, strength });
    return res;
  } catch {
    return null;
  }
}

/* ---------------------------
  Web Search wrapper (DuckDuckGo)
---------------------------- */
async function fetchWithTimeout(url, opts={}, timeout=4000) {
  const controller = new AbortController();
  const id = setTimeout(()=>controller.abort(), timeout);
  try {
    const r = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(id);
    return r;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}
async function runSearch(query) {
  const url = "https://api.duckduckgo.com/?q="+encodeURIComponent(query)+"&format=json&t=spider_app&no_html=1";
  try {
    const r = await fetchWithTimeout(url, {}, 3500);
    if (!r.ok) throw new Error("ddg non-ok");
    const j = await r.json();
    return j;
  } catch (e) {
    try {
      const r2 = await fetchWithTimeout(url, {}, 7000);
      if (r2 && r2.ok) return await r2.json();
    } catch (e2) {
      return { error: "ddg_failed", details: (e2||e).toString() };
    }
  }
}

/* ---------------------------
  Extract text from model responses (robust)
---------------------------- */
function extractText(resp) {
  try {
    if (!resp) return "";
    // Common patterns returned by env.SPY_AI.run or env.AI.responses
    if (typeof resp === "string") return resp;
    if (resp.output_text) return resp.output_text;
    if (resp.text) return resp.text;
    if (resp.result) return resp.result;
    if (resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content) return resp.choices[0].message.content;
    if (resp.output && Array.isArray(resp.output)) {
      for (const o of resp.output) {
        if (o && o.content && o.content[0] && o.content[0].text) return o.content[0].text;
      }
    }
    return JSON.stringify(resp).slice(0,2000);
  } catch (e) {
    return "";
  }
}
/* ============================================================
SPIDER AI — BEAST MAX EDITION (PART 3/4)
REQUEST HANDLER START + MEMORY FLOW + DELETE COMMANDS
============================================================ */

export async function onRequest(context) {
  const { request, env } = context;

  // parse auth token (Authorization: Bearer <idToken>)
  const authHeader = request.headers.get("Authorization") || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
  const verified = await verifyFirebaseToken(idToken);
  const userId = (verified && (verified.user_id || verified.uid)) ? (verified.user_id || verified.uid) : "anon_user";

  // parse body
  let body = {};
  try { body = await request.json(); } catch (e) { body = {}; }

  // unify input fields we expect
  const prompt = (body.prompt || body.message || body.input || "").toString();
  const modeHint = (body.mode || "").toString();
  const filename = (body.filename || "").toString();
  const file_content = (body.file_content || "").toString();
  const image = body.image || null;
  const strength = body.strength || 0.7;

  // load memory
  let memory = await loadUserMemory(env, userId);
  // apply TTL filter (already in loader) and ensure it's an array
  if (!Array.isArray(memory)) memory = [];

  // quick command: if user asked to clear or delete memory
  const lower = prompt.toLowerCase();

  const wantsDelete = /\b(delete|remove|clear|reset|forget|wipe)\b/.test(lower);
  if (wantsDelete && !/\b(memory:|delete memory:|delete all|reset all)\b/.test(lower)) {
    return new Response("Specify: delete memory: all / last / first / <index> / <keyword>", { headers: { "content-type": "text/plain" } });
  }

  if (/\b(delete memory: all|delete all|reset all|wipe memory)\b/.test(lower)) {
    await saveUserMemory(env, userId, []);
    return new Response("Memory wiped 😎🔥", { headers: { "content-type": "text/plain" } });
  }

  if (/\bdelete memory:\b/.test(lower)) {
    const cmd = lower.replace(/.*delete memory:\s*/,"").trim();
    if (cmd === "last") {
      memory.pop();
      await saveUserMemory(env, userId, memory);
      return new Response("Deleted last memory entry.", { headers: { "content-type": "text/plain" } });
    } else if (cmd === "first") {
      memory.shift();
      await saveUserMemory(env, userId, memory);
      return new Response("Deleted first memory entry.", { headers: { "content-type": "text/plain" } });
    } else if (/^\d+$/.test(cmd)) {
      const idx = parseInt(cmd,10);
      if (idx>=1 && idx<=memory.length) {
        memory.splice(idx-1,1);
        await saveUserMemory(env, userId, memory);
        return new Response("Deleted memory index "+idx, { headers: { "content-type": "text/plain" } });
      } else {
        return new Response("Invalid index", { headers: { "content-type": "text/plain" } });
      }
    } else {
      // treat as keyword filter
      const key = cmd;
      const filtered = memory.filter(m => !(m.content||"").toLowerCase().includes(key));
      await saveUserMemory(env, userId, filtered);
      return new Response("Deleted matching entries for keyword: "+key, { headers: { "content-type": "text/plain" } });
    }
  }

  // append user prompt safely to memory (duplicate-safe)
  function normText(s){ return (s||"").toString().trim().toLowerCase().replace(/\s+/g," "); }
  if (prompt && prompt.trim()) {
    const newNorm = normText(prompt);
    const lastNorm = memory.length ? normText(memory[memory.length-1].content) : "";
    if (!(newNorm === lastNorm || newNorm.includes(lastNorm) || lastNorm.includes(newNorm))) {
      memory.push({ role: "user", content: prompt, ts: Date.now() });
    } else {
      if (memory.length) memory[memory.length-1].ts = Date.now();
    }
  }

  // trim memory if needed
  memory = trimMemoryIfNeeded(memory);
  await saveUserMemory(env, userId, memory);

  // if memory too long, compress
  if (memory.length >= MEMORY_SUMMARY_TRIGGER) {
    memory = await generateMemorySummary(env, memory);
    await saveUserMemory(env, userId, memory);
  }

  // build memory summary text for system inclusion
  const memorySummary = (memory||[]).slice(-MEMORY_TRIM_TARGET).map(m=>{
    if (m.role === "system_summary") return "SUMMARY: "+(m.content||"");
    return (m.role||"") + ": " + ((m.content||"").slice(0,240));
  }).join("\n");
  /* ============================================================
SPIDER AI — BEAST MAX EDITION (PART 4/4)
MODE LOGIC, EXTRA SYSTEM INSTRUCTIONS, AI CALL, RESPONSE, UTILITIES
============================================================ */

  // detect modes
  const noEmojiMode = detectNoEmoji(prompt);
  const savageMode = detectSavageMode(prompt);
  const telanganaMode = shouldTriggerTelugu(prompt);

  // build extra per-message system instructions
  const extraInstructions = [];
  if (telanganaMode) {
    extraInstructions.push("User used Telugu. Respond in STRICT Telangana slang in English-letter transliteration. Always include attitude emojis (😎🔥🤙🕷️). Do NOT use Andhra/textbook Telugu.");
  }
  if (savageMode) {
    extraInstructions.push("Savage mode: playful roast, humorous, non-offensive. Use Telangana-style roast if telanganaMode active.");
  }
  if (noEmojiMode) {
    extraInstructions.push("User requested no emojis. Do not include emojis in your response.");
  } else {
    extraInstructions.push("Prefer attitude emojis like 😎🔥🤙🕷️. Avoid soft-smile emojis unless the user used them first.");
  }

  // mode auto-detect override by hints
  let currentMode = "chat";
  if (modeHint) currentMode = modeHint;
  else if (file_content || filename) currentMode = "analyze_file";
  else {
    const t = prompt.toLowerCase();
    if (t.includes("generate image") || t.includes("image of")) currentMode = "image_gen";
    else if (t.includes("edit image") || t.includes("modify image")) currentMode = "image_edit";
    else if (t.includes("analyze file") || t.includes("debug") || t.includes("clean code")) currentMode = "analyze_file";
  }

  // build base messages for model
  const baseMessages = [{ role: "system", content: SPIDER_SYSTEM_PROMPT }];
  if (extraInstructions.length) baseMessages.push({ role: "system", content: extraInstructions.join("\n") });
  if (memorySummary) baseMessages.push({ role: "system", content: "Memory:\n"+memorySummary });

  // handle analyze_file mode
  if (currentMode === "analyze_file") {
    const filePrompt = "Analyze file: " + (filename || "unknown") + "\n\n" + (file_content || prompt || "");
    baseMessages.push({ role: "user", content: filePrompt });
    const result = await runModel(env, "@cf/mistralai/mistral-small-3.1-24b-instruct", { messages: baseMessages });
    const out = extractText(result);
    return new Response(out, { headers: { "content-type": "text/plain" } });
  }

  // handle image generation
  if (currentMode === "image_gen") {
    const imagePrompt = (prompt || "") + ", ultra detailed, cinematic, hdr";
    const img = await runImageGen(env, imagePrompt);
    return new Response(JSON.stringify({ image: img }), { headers: { "content-type": "application/json" } });
  }

  // handle image edit
  if (currentMode === "image_edit") {
    const imagePrompt = (prompt || "") + ", cinematic refine";
    const img = await runImageEdit(env, imagePrompt, image, strength);
    return new Response(JSON.stringify({ image: img }), { headers: { "content-type": "application/json" } });
  }

  // default chat flow
  baseMessages.push({ role: "user", content: prompt || "" });

  // call model
  let aiResp;
  try {
    aiResp = await runModel(env, "@cf/mistralai/mistral-small-3.1-24b-instruct", { messages: baseMessages });
  } catch (e) {
    return new Response("Spider AI internal error: " + (e && e.toString ? e.toString() : "unknown"), { status: 500 });
  }

  const text = extractText(aiResp).trim();

  // if model returned a JSON search command, handle
  try {
    const cleaned = text.replace(/^```json\s*/,"").replace(/```$/,"").trim();
    const maybe = JSON.parse(cleaned);
    if (maybe && maybe.action === "search" && typeof maybe.query === "string") {
      const searchRes = await runSearch(maybe.query);
      const summaryMessages = [{ role: "system", content: SPIDER_SYSTEM_PROMPT }];
      if (extraInstructions.length) summaryMessages.push({ role: "system", content: extraInstructions.join("\n") });
      summaryMessages.push({ role: "user", content: "Search results: " + JSON.stringify(searchRes) });
      const summary = await runModel(env, "@cf/mistralai/mistral-small-3.1-24b-instruct", { messages: summaryMessages });
      return new Response(extractText(summary), { headers: { "content-type": "text/plain" } });
    }
  } catch (e) {
    // ignore parse errors, just continue
  }

  // update memory with assistant reply
  memory.push({ role: "assistant", content: text, ts: Date.now() });
  memory = trimMemoryIfNeeded(memory);
  await saveUserMemory(env, userId, memory);

  // Final response
  return new Response(JSON.stringify({ reply: text }), { headers: { "content-type": "application/json" } });
}

/* ============================================================
END OF BEAST MAX EDITION (4 PARTS)
If deploy errors occur, paste the exact logs here and I will fix.
============================================================ */
