export default {
  async fetch(request, env) {
    const body = await request.json().catch(() => ({}));
    const { prompt, system_instruction, mode, image, strength } = body;

    // 🧠 TEXT MODE (GPT-120B)
    if (mode === "chat" || !mode) {
      const response = await env.SPY_AI.run("@cf/openai/gpt-oss-120b", {
        instructions: system_instruction || "You are Spider created by M4 Spider.",
        input: prompt || "Hello Spider"
      });

      return Response.json(response);
    }

    // 🎨 IMAGE GEN (SDXL)
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
      const edit = await env.SPY_AI.run("@cf/stabilityai/stable-diffusion-xl-refiner-1.0", {
        prompt,
        image,
        strength: strength || 0.7
      });

      return new Response(edit, {
        headers: { "content-type": "image/png" }
      });
    }

    return Response.json({ error: "Invalid mode" });
  }
};
