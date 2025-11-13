export async function onRequest(context) {
  return new Response("Spider AI Test OK", {
    headers: { "content-type": "text/plain" }
  });
}

