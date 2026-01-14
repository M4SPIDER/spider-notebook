/**
 * =========================================================
 * SPIDER AI — FINAL STABLE BACKEND (v9.9.63)
 * FIXES: CHAIN IMAGE EDITING + EDIT DETECTION + FORMAT HANDLING
 * =========================================================
 */

//////////////////////////////
// CONFIG - UPDATED FOR CHAIN EDITING
//////////////////////////////
const AI_NAME = "Spider AI";
const VERSION = "9.9.63";

const AI_MEMORY_TRIM_TARGET = 25;
const AI_MEMORY_TTL_DAYS = 30;
const AI_MEMORY_USER_KEY_PREFIX = "spider_ai_mem:";
const AI_MEMORY_IMAGE_SESSION_KEY = "spider_ai_img_session:"; // NEW: For chain editing
const AI_RETRY_LIMIT = 2;
const AI_RETRY_DELAY_BASE = 1500;
const AI_MAX_OUTPUT_LINES = 300;

// MODELS
const MODEL_STD_CHAT = "@cf/openai/gpt-oss-120b";
const MODEL_PRO_CHAT = "@cf/mistralai/mistral-small-3.1-24b-instruct";
const MODEL_ASR = "@cf/openai/whisper-large-v3-turbo";
const MODEL_GEN_LUCID = "@cf/leonardo/lucid-origin";
const MODEL_EDIT_FLUX = "@cf/black-forest-labs/flux-2-dev";

//////////////////////////////
// NEW: IMAGE SESSION MANAGEMENT FOR CHAIN EDITING
//////////////////////////////

// Store image edit session (multiple images in sequence)
async function getImageSession(env, userId) {
  try {
    const key = AI_MEMORY_IMAGE_SESSION_KEY + userId;
    const session = env.CHAT_KV ? await env.CHAT_KV.get(key) : null;
    return session ? JSON.parse(session) : {
      active: false,
      images: [], // Stack of images in edit session
      currentImageIndex: 0,
      createdAt: Date.now(),
      lastEdit: null
    };
  } catch {
    return {
      active: false,
      images: [],
      currentImageIndex: 0,
      createdAt: Date.now(),
      lastEdit: null
    };
  }
}

async function saveImageSession(env, userId, session) {
  if (!env.CHAT_KV) return;
  const key = AI_MEMORY_IMAGE_SESSION_KEY + userId;
  // Keep sessions for 2 hours (7200 seconds)
  await env.CHAT_KV.put(key, JSON.stringify(session), {
    expirationTtl: 7200
  });
}

async function startImageSession(env, userId, base64Image) {
  const session = {
    active: true,
    images: [base64Image], // Start with first image
    currentImageIndex: 0,
    createdAt: Date.now(),
    lastEdit: Date.now()
  };
  await saveImageSession(env, userId, session);
  return session;
}

async function addToImageSession(env, userId, newImage) {
  const session = await getImageSession(env, userId);
  session.images.push(newImage);
  session.currentImageIndex = session.images.length - 1;
  session.lastEdit = Date.now();
  await saveImageSession(env, userId, session);
  return session;
}

async function clearImageSession(env, userId) {
  if (!env.CHAT_KV) return;
  const key = AI_MEMORY_IMAGE_SESSION_KEY + userId;
  await env.CHAT_KV.delete(key);
}

//////////////////////////////
// UPDATED UTILS WITH BETTER IMAGE DETECTION
//////////////////////////////
const sleep = ms => new Promise(r => setTimeout(r, ms));

function cleanAiResponse(text) {
  if (!text) return "";
  return text
    .replace(/#\*[\s\S]*?\*#/g, "")
    .replace(/#\*/g, "")
    .replace(/\*#/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractText(resp) {
  return (
    resp?.output?.[1]?.content?.[0]?.text ||
    resp?.response ||
    resp?.result ||
    resp?.text ||
    resp?.transcription || // For Whisper
    ""
  );
}

// IMPROVED: Base64 validation
function isValidBase64(str) {
  if (!str || typeof str !== 'string') return false;
  // Remove data URL prefix if present
  const cleanStr = str.replace(/^data:image\/\w+;base64,/, '');
  try {
    return btoa(atob(cleanStr)) === cleanStr;
  } catch (e) {
    return false;
  }
}

const base64ToUint8Array = (base64) => {
  try {
    // Handle both data URLs and plain base64
    const cleanBase64 = base64.includes(',') 
      ? base64.split(',').pop() 
      : base64;
    const sanitized = cleanBase64.replace(/[\r\n\s]/g, '');
    const binaryString = atob(sanitized);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Base64 conversion error:", e);
    return null;
  }
};

// NEW: Detect image in message
function containsImageKeywords(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  const imageWords = ['image', 'photo', 'picture', 'pic', 'img', 'snap', 'shot'];
  return imageWords.some(word => lower.includes(word));
}

// IMPROVED EDIT DETECTION
function isEditRequest(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  
  // Strong edit indicators
  const strongIndicators = [
    'edit this', 'change this', 'modify this', 'adjust this',
    'edit the', 'change the', 'modify the',
    'make it', 'turn it', 'transform it',
    'add to', 'remove from', 'replace in',
    'background', 'foreground', 'color of', 'size of',
    'zoom in', 'zoom out', 'pan left', 'pan right',
    'crop', 'rotate', 'flip', 'mirror',
    'enhance', 'improve', 'fix'
  ];
  
  // Contextual edit indicators (when combined with image context)
  const contextualIndicators = [
    'more', 'again', 'next', 'another', 'also',
    'too', 'and', 'plus', 'additional',
    'different', 'alternative', 'variant'
  ];
  
  // Check for strong indicators
  if (strongIndicators.some(ind => lower.includes(ind))) {
    return true;
  }
  
  // Check for contextual indicators when image is mentioned
  if (containsImageKeywords(lower)) {
    return contextualIndicators.some(ind => lower.includes(ind));
  }
  
  return false;
}

async function streamToBase64(stream) {
  const reader = stream.getReader();
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  let binary = '';
  const len = result.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(result[i]);
  }
  return btoa(binary);
}

// NEW: Image format conversion helper
async function convertImageFormat(imageBytes, targetFormat = 'png') {
  try {
    // Create ImageBitmap from bytes
    const blob = new Blob([imageBytes], { type: 'image/*' });
    const imgBitmap = await createImageBitmap(blob);
    
    // Create canvas and draw
    const canvas = new OffscreenCanvas(imgBitmap.width, imgBitmap.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgBitmap, 0, 0);
    
    // Convert to blob
    const blobResult = await canvas.convertToBlob({ type: `image/${targetFormat}` });
    
    // Convert blob to Uint8Array
    const arrayBuffer = await blobResult.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (e) {
    console.error("Image conversion failed, returning original:", e);
    return imageBytes; // Return original if conversion fails
  }
}

//////////////////////////////
// MAIN HANDLER - UPDATED WITH CHAIN EDITING
//////////////////////////////
export async function onRequest(context) {
  const { request, env } = context;

  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Ai-Expanded-Prompt, X-Edit-Session"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const payload = await request.json();
    let {
      prompt = "",
      mode = "chat",
      user_preference_id = "anon",
      aspect_ratio = "1:1",
      stream = false,
      file_content,
      filename,
      stream_id,
      image: base64ImageInput
    } = payload;

    const memKey = AI_MEMORY_USER_KEY_PREFIX + user_preference_id;
    const cleanPrompt = (prompt || "").trim().toLowerCase();
    
    // Check for active image session FIRST
    const imageSession = await getImageSession(env, user_preference_id);
    const hasActiveSession = imageSession.active && imageSession.images.length > 0;

    // -----------------------------------------------------------------
    // AUTO-MODE DETECTION WITH CHAIN EDITING SUPPORT
    // -----------------------------------------------------------------
    
    // 1. Check for explicit image generation
    const IMAGE_GEN_TRIGGERS = [
      "generate image", "create image", "make an image", "draw a",
      "generate a picture", "create a picture", "imagine this", "draw this",
      "make me a", "design a"
    ];
    
    if (mode === "chat" && IMAGE_GEN_TRIGGERS.some(t => cleanPrompt.includes(t))) {
      mode = "image_gen";
    }
    
    // 2. Check for edit requests - IMPROVED DETECTION
    const isEditIntent = isEditRequest(cleanPrompt);
    
    // 3. AUTO-SWITCH TO EDIT MODE IF:
    //    a) User has active image session AND says anything about changing
    //    b) User explicitly mentions edit
    //    c) User provides an image in payload
    if (mode === "chat" && 
        (hasActiveSession || base64ImageInput || isEditIntent)) {
      
      // Determine which image to use (priority order):
      let editImage = null;
      
      if (base64ImageInput && isValidBase64(base64ImageInput)) {
        // 1. Use newly uploaded image
        editImage = base64ImageInput;
        // Start new session or add to existing
        if (hasActiveSession) {
          await addToImageSession(env, user_preference_id, editImage);
        } else {
          await startImageSession(env, user_preference_id, editImage);
        }
      } else if (hasActiveSession) {
        // 2. Use last image from active session
        const lastImage = imageSession.images[imageSession.currentImageIndex];
        if (lastImage && isValidBase64(lastImage)) {
          editImage = lastImage;
        }
      }
      
      // Only switch to edit mode if we have a valid image
      if (editImage) {
        mode = "image_edit";
        base64ImageInput = editImage;
      }
    }
    
    // 4. Check for session management commands
    if (cleanPrompt.includes("clear image session") || 
        cleanPrompt.includes("reset edits") ||
        cleanPrompt.includes("start over")) {
      await clearImageSession(env, user_preference_id);
      return new Response(JSON.stringify({
        status: "success",
        message: "Image editing session cleared. Ready for new images."
      }), { headers: { ...cors, "Content-Type": "application/json" } });
    }
    
    if (cleanPrompt.includes("show edit history") ||
        cleanPrompt.includes("previous edits")) {
      return new Response(JSON.stringify({
        session: {
          ...imageSession,
          images: imageSession.images.map((_, i) => `Image ${i + 1}`) // Don't send actual base64
        }
      }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    // -----------------------------------------------------------------
    // IMAGE EDITING WITH CHAIN SUPPORT
    // -----------------------------------------------------------------
    if (mode === "image_edit") {
      // Validate we have an image
      if (!base64ImageInput || !isValidBase64(base64ImageInput)) {
        return new Response(JSON.stringify({
          error: "Invalid or missing image",
          suggestion: "Please upload an image first or generate one"
        }), { status: 400, headers: cors });
      }
      
      // Convert image to proper format for Flux
      let imageBytes = base64ToUint8Array(base64ImageInput);
      if (!imageBytes) {
        return new Response(JSON.stringify({
          error: "Could not process image format"
        }), { status: 400, headers: cors });
      }
      
      // Try to convert to PNG if needed (Flux works best with PNG)
      try {
        imageBytes = await convertImageFormat(imageBytes, 'png');
      } catch (e) {
        console.log("Using original image format");
      }
      
      const imageBlob = new Blob([imageBytes], { type: 'image/png' });
      
      const form = new FormData();
      form.append('prompt', prompt);
      form.append('image', imageBlob, 'edit_input.png');
      form.append('strength', '0.7');
      
      // Add session header for frontend to know this is part of a chain
      const sessionHeaders = {
        ...cors,
        'X-Edit-Session': 'active',
        'X-Edit-Step': (imageSession.images.length + 1).toString()
      };
      
      try {
        // Get memory for context
        let memory = await getMemory(env, memKey);
        memory.push({ 
          role: "user", 
          content: `[Image Edit #${imageSession.images.length + 1}]: ${prompt}` 
        });
        await saveMemory(env, memKey, memory.slice(-AI_MEMORY_TRIM_TARGET));
        
        // Call Flux
        const dummyReq = new Request('http://dummy', {
          method: 'POST',
          body: form
        });
        
        const fluxResponse = await env.SPY_AI.run(MODEL_EDIT_FLUX, {
          multipart: {
            body: dummyReq.body,
            contentType: dummyReq.headers.get('content-type') || 'multipart/form-data'
          }
        });
        
        if (fluxResponse instanceof ReadableStream) {
          const [stream1, stream2] = fluxResponse.tee();
          
          // Save edited image to session
          context.waitUntil(async function() {
            try {
              const newBase64 = await streamToBase64(stream2);
              
              // Add to image session for chain editing
              await addToImageSession(env, user_preference_id, newBase64);
              
              // Update text memory
              memory.push({ 
                role: "assistant", 
                content: `Image edited (step ${imageSession.images.length}). You can continue editing this image.` 
              });
              await saveMemory(env, memKey, memory.slice(-AI_MEMORY_TRIM_TARGET));
            } catch(e) {
              console.error("Failed to save edited image:", e);
            }
          }());
          
          return new Response(stream1, { 
            headers: { ...sessionHeaders, "Content-Type": "image/png" } 
          });
        }
        
        // Handle non-stream response
        let resultBase64 = fluxResponse?.image || fluxResponse?.result?.image;
        if (resultBase64) {
          // Add to session
          await addToImageSession(env, user_preference_id, resultBase64);
          
          // Update memory
          memory.push({ 
            role: "assistant", 
            content: `Image edited successfully! 🎨 (Step ${imageSession.images.length})` 
          });
          await saveMemory(env, memKey, memory.slice(-AI_MEMORY_TRIM_TARGET));
          
          return new Response(base64ToUint8Array(resultBase64), {
            headers: { ...sessionHeaders, "Content-Type": "image/png" }
          });
        }
        
        throw new Error("Flux returned no image data");
        
      } catch (fluxErr) {
        return new Response(JSON.stringify({
          error: "Edit Failed",
          message: fluxErr.message,
          suggestion: "Try with a different image or simpler edit request"
        }), { status: 500, headers: cors });
      }
    }
    
    // -----------------------------------------------------------------
    // IMAGE GENERATION - UPDATED TO START SESSION
    // -----------------------------------------------------------------
    if (mode === "image_gen") {
      let width = 1024;
      let height = 1024;
      
      if (aspect_ratio === "16:9") { width = 1280; height = 720; }
      else if (aspect_ratio === "9:16") { width = 720; height = 1280; }
      else if (aspect_ratio === "4:3")  { width = 1152; height = 864; }
      else if (aspect_ratio === "3:4")  { width = 864; height = 1152; }
      
      try {
        // Save to memory
        let memory = await getMemory(env, memKey);
        memory.push({ role: "user", content: prompt, ts: Date.now() });
        await saveMemory(env, memKey, memory.slice(-AI_MEMORY_TRIM_TARGET));
        
        const response = await env.SPY_AI.run(
          MODEL_GEN_LUCID,
          {
            prompt: prompt,
            width: width,
            height: height
          }
        );
        
        const extraHeaders = {
          ...cors,
          "X-Ai-Expanded-Prompt": prompt.substring(0, 500),
          "X-Edit-Session": "started" // Tell frontend session is ready
        };
        
        if (response instanceof ReadableStream) {
          const [stream1, stream2] = response.tee();
          
          context.waitUntil(async function() {
            try {
              const base64 = await streamToBase64(stream2);
              // Start new image session with generated image
              await startImageSession(env, user_preference_id, base64);
            } catch(e) {
              console.error("Failed to save generated image:", e);
            }
          }());
          
          return new Response(stream1, {
            headers: { ...extraHeaders, "Content-Type": "image/png" }
          });
        }
        
        let base64Image = null;
        if (response && response.image) {
          base64Image = response.image;
        } else if (response && response.result && response.result.image) {
          base64Image = response.result.image;
        } else if (Array.isArray(response) && response[0] && response[0].image) {
          base64Image = response[0].image;
        }
        
        if (base64Image) {
          // Start session
          await startImageSession(env, user_preference_id, base64Image);
          
          const binaryString = atob(base64Image);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          return new Response(bytes.buffer, {
            headers: { ...extraHeaders, "Content-Type": "image/png" }
          });
        }
        
        return new Response(JSON.stringify({
          error: "Image Generation Failed",
          debug: "No image data in response"
        }), { headers: cors });
        
      } catch (genError) {
        return new Response(JSON.stringify({
          error: "Image API Error",
          message: genError.message
        }), { headers: cors });
      }
    }
    
    // -----------------------------------------------------------------
    // REST OF THE CODE (chat, stream, ASR, etc.) - UNCHANGED
    // -----------------------------------------------------------------
    // ... [Keep all your existing chat, stream, ASR code here]
    // Add this note where you'd continue with your existing code
    
    // For brevity, I've focused on the image editing chain fix
    // You would continue with your existing chat/stream/ASR logic here
    
    return new Response("Mode not fully implemented in this snippet", {
      headers: cors
    });
    
  } catch (e) {
    return new Response(JSON.stringify({
      error: "Spider AI Error",
      message: e.message,
      version: VERSION
    }), {
      status: 500,
      headers: cors
    });
  }
}
