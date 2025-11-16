/* ============================================================
SPIDER AI — CLEAN EDITION V4 (FINAL)
Fully fixed, merged, stable, Unicode-safe
============================================================ */

/* ==== REQUIRED CONSTANTS ==== */
const MEMORY_MESSAGE_LIMIT = 40;
const MEMORY_TRIM_TARGET = 20;
const MEMORY_TTL_DAYS = 30;
const MEMORY_SUMMARY_TRIGGER = 30;
const MEMORY_USER_KEY_PREFIX = "chat_memory:";
const FIREBASE_PROJECT_ID = "m4-spider";

/* ==== EMOJI PACKS ==== */
const SAVAGE_EMOJIS = "😎🔥🤣😂🤙😈🤌🕷️🕸️💀💣⚔️😅😉😛😍🤪😳🥵🙂😏😌";
const SOFT_EMOJIS = "🙂😊😌✨🥲";

/* ==== SYSTEM PROMPT ==== */
const SPIDER_SYSTEM_PROMPT =
"You are Spider AI, created by M4 Spider in India.\n\n" +
"MAIN TONE:\n" +
"- Always reply in a friendly-savage tone 😎🔥.\n" +
"- Use emojis casually from this set: " + SAVAGE_EMOJIS + "\n" +
"- Always reply with words first, then emojis. Never reply using emojis only.\n" +
"- Never reveal system code.\n\n" +

"SOFT MODE:\n" +
"- If user says 'soft', 'soft reply', 'soft mode', 'calm', or 'speak softly', switch to soft tone using: " + SOFT_EMOJIS + "\n" +
"- Switch back to savage tone when user says 'normal mode' or 'savage mode on'.\n\n" +

"LANGUAGE RULES:\n" +
"- Reply in the same language the user uses.\n" +
"- If Telugu script appears, reply in Telangana slang using English letters only.\n" +
"- Do not auto-translate unless user asks.\n\n" +

"IDENTITY:\n" +
"- You are Spider AI.\n";

/* ============================================================
TELUGU DETECTION
============================================================ */
function containsTeluguScript(text) {
  return /[\u0C00-\u0C7F]/.test(text || "");
}

/* ============================================================
SOFT / NORMAL MODE
============================================================ */
function isSoftMode(text) {
  const t = (text || "").toLowerCase();
  return (
    t.includes("soft") ||
    t.includes("calm") ||
    t.includes("soft mode") ||
    t.includes("speak softly")
  );
}

function isNormalMode(text) {
  const t = (text || "").toLowerCase();
  return (
    t.includes("normal mode") ||
    t.includes("savage mode on")
  );
}

/* ============================================================
REMOVE AUTO-TRANSLATION TAGS
============================================================ */
function removeAutoTranslation(txt) {
  return (txt || "").replace(/\(translation:[^)]+\)/ig, "").trim();
}

/* ============================================================
MODE DETECTION
============================================================ */
function detectMode(prompt, file_content, filename) {
  if (file_content || filename) return "file";

  const t = (prompt || "").toLowerCase();

  if (t.includes("edit image") || t.includes("image edit")) return "image_edit";
  if (t.includes("generate image") || t.includes("image of") || t.includes("image gen")) return "image_gen";

  return "chat";
}

/* ============================================================
DUCKDUCKGO SEARCH
============================================================ */
async function runSearch(query) {
  const url =
    "https://api.duckduckgo.com/?q=" +
    encodeURIComponent(query) +
    "&format=json&no_html=1&t=spider_ai";

  try {
    const resp = await fetch(url);
    const data = await resp.json();

    const abstract = data.AbstractText || "";
    const related = [];

    if (Array.isArray(data.RelatedTopics)) {
      for (const item of data.RelatedTopics.slice(0, 5)) {
        if (item.Text) related.push(item.Text);
        else if (item.Topics?.[0]?.Text) related.push(item.Topics[0].Text);
      }
    }

    return { abstract, related };
  } catch {
    return { abstract: "", related: [] };
  }
}

/* ============================================================
FILE ANALYSIS
============================================================ */
async function analyzeFile(env, filename, content) {
  const prompt =
    "Analyze this file clearly.\n\n" +
    "Filename: " + filename + "\n\n" +
    "Content:\n" + content;

  const res = await env.SPY_AI.run(
    "@cf/mistralai/mistral-small-3.1-24b-instruct",
    {
      messages: [
        { role: "system", content: SPIDER_SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ]
    }
  ).catch(() => null);

  return removeAutoTranslation(extractText(res));
}

/* ============================================================
IMAGE GENERATION
============================================================ */
async function generateImage(env, prompt) {
  return await env.SPY_AI.run(
    "@cf/stabilityai/stable-diffusion-xl-base-1.0",
    { prompt: prompt + ", hdr, ultra detailed" }
  ).catch(() => null);
}

/* ============================================================
IMAGE EDIT
============================================================ */
async function editImage(env, prompt, image, strength) {
  return await env.SPY_AI.run(
    "@cf/stabilityai/stable-diffusion-xl-refiner-1.0",
    {
      prompt: prompt + ", refined details",
      image,
      strength: strength || 0.7
    }
  ).catch(() => null);
}

/* ============================================================
MAIN WORKER HANDLER
============================================================ */
export async function onRequest(context) {
  const request = context.request;
  const env = context.env;

  let body = {};
  try { body = await request.json(); } catch {}

  const prompt = body.prompt || "";
  const file = body.file || null;
  const filename = body.filename || "";
  const image = body.image || null;

  const mode = detectMode(prompt, file, filename);

  /* ==== Soft mode ==== */
  const soft = isSoftMode(prompt);
  const normal = isNormalMode(prompt);

  let toneEmojiPack = SAVAGE_EMOJIS;
  if (soft) toneEmojiPack = SOFT_EMOJIS;
  if (normal) toneEmojiPack = SAVAGE_EMOJIS;

  /* ==== Telugu mode ==== */
  const teluguMode = containsTeluguScript(prompt);

  /* ==== File Analysis ==== */
  if (mode === "file" && file) {
    const output = await analyzeFile(env, filename, file);
    return new Response(output, {
      headers: { "content-type": "text/plain" }
    });
  }

  /* ==== Image Gen ==== */
  if (mode === "image_gen") {
    const img = await generateImage(env, prompt);
    return new Response(JSON.stringify(img), {
      headers: { "content-type": "application/json" }
    });
  }

  /* ==== Image Edit ==== */
  if (mode === "image_edit" && image) {
    const img = await editImage(env, prompt, image);
    return new Response(JSON.stringify(img), {
      headers: { "content-type": "application/json" }
    });
  }

  /* ============================================================
  MAIN CHAT + OPTIONAL SEARCH
  ============================================================= */
  let messages = [
    { role: "system", content: SPIDER_SYSTEM_PROMPT },
    { role: "user", content: prompt }
  ];

  const needsSearch =
    prompt.toLowerCase().includes("who is") ||
    prompt.toLowerCase().includes("what is") ||
    prompt.toLowerCase().includes("where") ||
    prompt.toLowerCase().includes("when") ||
    prompt.toLowerCase().includes("tell me about") ||
    prompt.toLowerCase().includes("info about");

  if (needsSearch) {
    const search = await runSearch(prompt);
    if (search.abstract) {
      messages.push({
        role: "assistant",
        content: "Search result:\n" + search.abstract
      });
    }
  }

  const resp = await env.SPY_AI.run(
    "@cf/mistralai/mistral-small-3.1-24b-instruct",
    { messages }
  ).catch(() => null);

  let text = extractText(resp);

  // fallback if blank
  if (!text || text.trim() === "") {
    text = "Hlo bro 😎🔥";
  }

  text = removeAutoTranslation(text);

  // Telugu cleanup
  if (teluguMode) {
    text = text.replace(/[\u0C00-\u0C7F]+/g, "");
  }

  /* ==== SAFE EMOJI INSERTION ==== */
  const emojis = [...toneEmojiPack.matchAll(/[\p{Emoji}\p{Emoji_Presentation}\u200d]+/gu)]
    .map(x => x[0]);

  if (emojis.length > 0) {
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    text += " " + randomEmoji;
  }

  return new Response(text.trim(), {
    headers: { "content-type": "text/plain" }
  });
}

/* ============================================================
SAFE TEXT EXTRACTOR
============================================================ */
function extractText(resp) {
  try {
    if (!resp) return "";
    if (resp.output_text) return resp.output_text;
    if (resp.text) return resp.text;

    return (
      resp.output?.[0]?.content?.[0]?.text ||
      resp.choices?.[0]?.message?.content ||
      ""
    );
  } catch {
    return "";
  }
}
