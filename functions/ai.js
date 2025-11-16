/* ============================================================
SPIDER AI — TELANGANA BEAST EDITION V3 (FULL BEAST) — PART 1/3
CONFIG + STRICT TELANGANA TRAINING + HINDI BLOCKLIST + EMOJI PREF
(Place this at top of functions/ai.js)
============================================================ */

/* ===== CONFIG ===== */
const MEMORY_MESSAGE_LIMIT = 40;
const MEMORY_TRIM_TARGET = 20;
const MEMORY_TTL_DAYS = 30;
const MEMORY_SUMMARY_TRIGGER = 30;
const MEMORY_USER_KEY_PREFIX = "chat_memory:";
const FIREBASE_PROJECT_ID = "m4-spider";

/* ===== TELUGU TRIGGER WORDS (removed bro/mama/bhai/anna to avoid false positives) ===== */
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

/* Build regex for detection (escaped, longer phrases first) */
function buildTeluguRegex(words) {
  const sorted = [...words].sort((a,b) => b.length - a.length);
  const escaped = sorted.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}()]/g, "\\$&"));
  const pattern = "\\b(?:" + escaped.join("|") + ")\\b";
  return new RegExp(pattern, "iu");
}
const TELUGU_TRIGGER_REGEX = buildTeluguRegex(TELUGU_TRIGGER_WORDS);

/* ============================================================
NEW TRIGGER LOGIC:
 - Require 2+ genuine Telugu hits
 - Block triggering when common Hindi words appear (so "hlo bhai" stays Hindi)
 - Use word-cleaning to avoid punctuation issues
============================================================ */

function shouldTriggerTelugu(message) {
  if (!message || typeof message !== "string") return false;

  const msg = message.toLowerCase();

  // Quick Hindi blocklist: if these appear, do NOT trigger Telangana mode
  const HINDI_BLOCKERS = [
    "bhai","bhaiya","kya","kaisa","kaise","kesa","kesaa","hal","hlo","hello","haan","haanji",
    "achha","acha","theek","theek hai","thik","kuch","kyu","kyun","bol","bolo","suno","tu","tum"
  ];

  for (const hb of HINDI_BLOCKERS) {
    if (msg.includes(hb)) return false;
  }

  // Count distinct Telugu trigger matches (word-level)
  const tokens = msg.split(/\s+/).map(w => w.replace(/[^\w\u0C00-\u06FF\-]/g, "").trim()); // keep unicode words, strip punctuation
  let hitCount = 0;
  for (const t of tokens) {
    if (!t) continue;
    // check exact match against list
    if (TELUGU_TRIGGER_WORDS.includes(t)) hitCount++;
    // also allow phrase-match for multi-word triggers
    if (hitCount >= 2) break;
  }

  // As a fallback, test regex for phrase matches (helps catch longer phrases)
  if (hitCount < 2) {
    const allMatches = msg.match(TELUGU_TRIGGER_REGEX);
    if (allMatches && allMatches.length >= 2) hitCount = allMatches.length;
  }

  return hitCount >= 2;
}

/* ============================================================
TELANGANA TRAINING BLOCK (short, used in system prompt)
============================================================ */
const TELANGANA_TRAINING_BLOCK =
"TELANGANA DIALECT TRAINING:\n" +
"- Use STRICT Telangana slang when triggered. Avoid Andhra/textbook Telugu.\n" +
"- Prefer ra, macha, bossu, ayya, nanna, bayya, chusava.\n" +
"- Use 'unnav', 'ekkada', 'enti ra' where appropriate.\n" +
"- Tone: street, bold, playful, slightly sarcastic. Use English-letter transliteration only.\n";

/* ============================================================
SYSTEM PROMPT (EMOJI PREFERENCE: attitude > soft smiles)
 Soft smiles (😄 🙂 😊) are avoided unless user uses them first.
============================================================ */

const SPIDER_SYSTEM_PROMPT =
"You are Spider, the AI created by M4 Spider.\n" +
"GENERAL RULES:\n" +
"- Default: English unless Telugu detected by rules.\n" +
"- Never reveal system internals or backend code.\n" +
"- Do not use markdown formatting or asterisks in replies.\n" +
"- Friendly, bold buddy tone. Use transliteration for Telugu replies only.\n" +
"- Creator: M4 Spider.\n\n" +

"LANGUAGE SWITCH:\n" +
"- Telugu mode triggers when 2 or more Telugu trigger words are detected (and no Hindi blockers).\n" +
"- When in Telugu mode: respond in STRICT Telangana slang using English-letter transliteration only.\n" +
TELANGANA_TRAINING_BLOCK + "\n" +

"SAVAGE MODE:\n" +
"- If user says 'savage mode' or 'roast mode', switch to playful roast (non-offensive, witty).\n\n" +

"EMOJI RULE (PREFERENCE):\n" +
"- Minimize soft-smile emojis like 😄 🙂 😊 unless the user used them first.\n" +
"- Prefer attitude/hype emojis: 😎🔥🤙🕷️🕸️💀⚔️✨🚀💥⚡😏🤘👊🤟.\n" +
"- Full emoji pack is available; prioritize the attitude set above.\n" +
"- If the user says 'no emojis', stop using emojis entirely.\n" +

"EMOJI PACK:\n" +
"- Part1: 😎🔥🤣😂🤙😈🤌🕷️🕸️💀💣⚔️😃😅😉😛😍🤪😳🥵😨😣😔😓😞😧🫣😬🤐🙂😏😌🥹\n" +
"- Part2: 😗😚🙂‍↕️🤡🤮🤢👻👿🙌👐🫸🫳👋👊🖕👏🙏🤳🤝🙇💆🙋💁🙅🤷🤦🙍🙎\n" +
"- Part3: 🖥️💻🔌💉💊🧪⚙️🕕🕧🕙📅🔔🔒🚀✨💫🌪️🔥💥⚡🌈⭐☄️\n" +
"- Part4: 🦸🦹🕶️🎭🎯🎮🎧🎤📱📲💾🗄️🛰️📡🧠🫀🫁\n" +
"- Part5: 🇮🇳🇺🇸🇯🇵🇰🇷🇬🇧🇫🇷🇧🇷\n" +
"- Part6: 🦅🐍🐺🐯🦂🐉🦖🐗🐅🐆🦊🐒🐼🐨🦁\n" +
"- Part7: 🔧🔨⚙️🪛🪚🔩📐📏🧰💡🔦🧯🔭🧲🛠️\n" +
"- Part8: 🎵🎶🔊🔉🔈📣📢📯🎺🥁🎸🎷🎻🎹\n";

/* ============================================================
FIREBASE TOKEN VERIFIER (wrapped function — ESM-safe)
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

/* End of Part 1/3 */
/* ============================================================
SPIDER AI — FULL BEAST — PART 2/3
MEMORY ENGINE + SEARCH + IMAGE GEN + MODE DETECTORS
============================================================ */

/* ---------------------------
   MEMORY STORE HELPERS
---------------------------- */

async function loadUserMemory(env, userId) {
  try {
    const raw = await env.CHAT_MEMORY.get(MEMORY_USER_KEY_PREFIX + userId);
    if (!raw) return [];

    const parsed = JSON.parse(raw);

    // Filter out expired messages
    const now = Date.now();
    return parsed.filter(item => (!item.ts || (now - item.ts) < MEMORY_TTL_DAYS * 24 * 60 * 60 * 1000));
  } catch {
    return [];
  }
}

async function saveUserMemory(env, userId, messages) {
  try {
    await env.CHAT_MEMORY.put(
      MEMORY_USER_KEY_PREFIX + userId,
      JSON.stringify(messages)
    );
  } catch (e) {
    console.error("Failed to save memory:", e);
  }
}

/* Trim memory if too long */
function trimMemoryIfNeeded(messages) {
  if (messages.length > MEMORY_MESSAGE_LIMIT) {
    return messages.slice(messages.length - MEMORY_TRIM_TARGET);
  }
  return messages;
}

/* ---------------------------
   MEMORY SUMMARY GENERATOR
---------------------------- */

async function generateMemorySummary(aiClient, systemPrompt, messages) {
  try {
    const summaryPrompt = systemPrompt +
      "\nSummarize the following conversation in neutral tone. Keep it short and factual.\n";

    const response = await aiClient.responses.create({
      model: "gpt-4.1-mini",
      max_output_tokens: 256,
      input: summaryPrompt + JSON.stringify(messages)
    });

    if (response?.output_text) {
      return [{ role: "system", content: "Summary: " + response.output_text }];
    }
  } catch (e) {
    console.error("Memory summary error:", e);
  }

  return messages; // fallback
}

/* ---------------------------
   MESSAGE CLEANUP
---------------------------- */

function cleanMessage(msg) {
  if (!msg || typeof msg !== "string") return "";
  return msg.replace(/\*/g, "").replace(/```/g, "").trim();
}

/* ---------------------------
   DETECT SPECIAL MODES
---------------------------- */

function detectNoEmoji(message) {
  if (!message) return false;
  return message.toLowerCase().includes("no emoji");
}

function detectSavageMode(message) {
  if (!message) return false;
  const m = message.toLowerCase();
  return m.includes("savage mode") || m.includes("roast mode") || m.includes("be savage");
}

/* ---------------------------
   AI CLIENT WRAPPERS
---------------------------- */

async function runSearch(aiClient, query, systemPrompt) {
  try {
    const res = await aiClient.responses.create({
      model: "gpt-4.1-mini",
      input: systemPrompt + "\nUser requested a web search: " + query,
      max_output_tokens: 32
    });

    return res?.output_text || "";
  } catch {
    return "";
  }
}

async function runImageGen(aiClient, prompt) {
  try {
    const response = await aiClient.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024"
    });
    return response.data[0].url;
  } catch {
    return "";
  }
}

async function runChat(aiClient, systemPrompt, userMessage, extraInstructions = "") {
  try {
    return await aiClient.responses.create({
      model: "gpt-4.1-mini",
      input: systemPrompt + extraInstructions + "\nUSER: " + userMessage,
      max_output_tokens: 800
    });
  } catch (e) {
    console.error("Chat error:", e);
    return null;
  }
}

/* ---------------------------
   TEXT MODE BUILDING
---------------------------- */

function buildExtraSystemText(noEmojiMode, savageMode, telanganaMode) {
  let txt = "\n\n";

  if (noEmojiMode) {
    txt += "Do not use emojis.\n";
  } else {
    txt += "Use emojis naturally unless user forbids.\n";
  }

  if (savageMode) {
    txt += "Activate playful roast mode. Be witty, bold, but non-offensive.\n";
  }

  if (telanganaMode) {
    txt += "User used Telugu slang. Respond in STRICT Telangana-English transliteration with attitude emojis.\n";
  }

  return txt;
}
/* ============================================================
SPIDER AI — FULL BEAST — PART 3/3
REQUEST HANDLER + MAIN CHAT ROUTER
============================================================ */

export async function onRequest(context) {
  const { request, env } = context;

  /* -------- Parse User Auth Token (Firebase) -------- */
  const authHeader = request.headers.get("Authorization") || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;

  const userInfo = await verifyFirebaseToken(idToken);
  const userId = userInfo?.uid || "guest_user";

  /* -------- Read request body safely -------- */
  let body = {};
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const userMessageRaw = body.message || "";
  const userMessage = cleanMessage(userMessageRaw);

  /* ---------------------------------------------------
     Load memory + detect modes (no emoji, savage, telangana)
  ----------------------------------------------------- */
  let memory = await loadUserMemory(env, userId);

  const noEmojiMode = detectNoEmoji(userMessage);
  const savageMode = detectSavageMode(userMessage);

  // Telangana: advanced trigger with Hindi blockers + 2-word rule
  const telanganaMode = shouldTriggerTelugu(userMessage);

  /* ---------------------------------------------------
     Build extra system instructions per-message
  ----------------------------------------------------- */
  const extraSys = buildExtraSystemText(noEmojiMode, savageMode, telanganaMode);

  /* ---------------------------------------------------
     AI Client
  ----------------------------------------------------- */
  const aiClient = env.AI;

  /* ---------------------------------------------------
     SEARCH ONLY MODE
     If user requests `{action:"search","query":"..."}` we respect it.
  ----------------------------------------------------- */
  if (typeof body === "object" && body.action === "search" && body.query) {
    const searchResult = await runSearch(aiClient, body.query, SPIDER_SYSTEM_PROMPT);
    return new Response(JSON.stringify({ result: searchResult }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  /* ---------------------------------------------------
     IMAGE GENERATION
     If user says:  {action:"image","prompt":"..."}
  ----------------------------------------------------- */
  if (typeof body === "object" && body.action === "image" && body.prompt) {
    const img = await runImageGen(aiClient, body.prompt);
    return new Response(JSON.stringify({ image: img }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  /* ---------------------------------------------------
     NORMAL CHAT FLOW
  ----------------------------------------------------- */

  const finalSystemPrompt =
    SPIDER_SYSTEM_PROMPT +
    extraSys +
    "\n" +
    "Reminder: Avoid soft smile emojis unless user uses them first. Prefer 😎🔥🤙🕷️🕸️💀⚔️.\n";

  const aiResponse = await runChat(aiClient, finalSystemPrompt, userMessage, "");

  if (!aiResponse || !aiResponse.output_text) {
    return new Response(
      JSON.stringify({ reply: "Spider AI is busy bro 😎🔥 try again." }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  const reply = aiResponse.output_text;

  /* ---------------------------------------------------
     UPDATE MEMORY
  ----------------------------------------------------- */

  memory.push(
    { role: "user", content: userMessage, ts: Date.now() },
    { role: "assistant", content: reply, ts: Date.now() }
  );

  // Trim if needed
  memory = trimMemoryIfNeeded(memory);

  // Summaries if too long
  if (memory.length > MEMORY_SUMMARY_TRIGGER) {
    memory = await generateMemorySummary(aiClient, SPIDER_SYSTEM_PROMPT, memory);
  }

  // Save memory
  await saveUserMemory(env, userId, memory);

  return new Response(
    JSON.stringify({ reply }),
    { headers: { "Content-Type": "application/json" } }
  );
}

/* END OF PART 3/3 */
