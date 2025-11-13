export async function onRequest(context) {
  const request = context.request;
  const env = context.env;

  let body = {};
  try {
    body = await request.json();
  } catch (_) {
    body = {};
  }

  const { prompt, system_instruction, mode, image, strength } = body;

  // 🧠 TEXT MODE (GPT-120B)
  if (mode === "chat" || !mode) {
    const aiResponse = await env.SPY_AI.run("@cf/openai/gpt-oss-120b", {
      instructions: system_instruction || "You are Spider created by M4 Spider.",
      input: prompt || "Hello Spider"
    });

    return new Response(JSON.stringify(aiResponse), {
      headers: { "content-type": "application/json" }
    });
  }

  // 🎨 IMAGE GENERATION (SDXL)
  if (mode === "image_gen") {
    const img = await env.SPY_AI.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", {
      prompt
    });

    return new Response(img, {
      headers: { "content-type": "image/png" }
    });
  }

  // 🖌 IMAGE EDIT (SDXL Refiner)
  if (mode === "image_edit") {
    const result = await env.SPY_AI.run("@cf/stabilityai/stable-diffusion-xl-refiner-1.0", {
      prompt,
      image,
      strength: strength || 0.7
    });

    return new Response(result, {
      headers: { "content-type": "image/png" }
    });
  }

  return new Response(JSON.stringify({ error: "Invalid mode" }), {
    headers: { "content-type": "application/json" }
  });
}

