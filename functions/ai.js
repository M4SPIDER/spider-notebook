export async function onRequest(context) {
  const request = context.request;
  const env = context.env;

  const body = await request.json().catch(() => ({}));
  const { prompt, system_instruction, mode, image, strength } = body;

  if (mode === "chat" || !mode) {
    const response = await env.SPY_AI.run("@cf/openai/gpt-oss-120b", {
      instructions: system_instruction || "You are Spider created by M4 Spider.",
      input: prompt || "Hello Spider"
    });

    return Response.json(response);
  }

  if (mode === "image_gen") {
    const output = await env.SPY_AI.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", {
      prompt
    });

    return new Response(output, {
      headers: { "content-type": "image/png" }
    });
  }

  if (mode === "image_edit") {
    const output = await env.SPY_AI.run("@cf/stabilityai/stable-diffusion-xl-refiner-1.0", {
      prompt,
      image,
      strength: strength || 0.7
    });

    return new Response(output, {
      headers: { "content-type": "image/png" }
    });
  }

  return Response.json({ error: "Invalid mode" });
}

