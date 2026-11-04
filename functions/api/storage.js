export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  const prefix = url.searchParams.get("prefix") || "";
  const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
  if (!env.FLAYORA_BUCKET) return new Response(JSON.stringify({ error: "R2 binding FLAYORA_BUCKET is missing" }), { status: 503, headers });
  if (request.method === "GET") {
    if (key !== null) {
      if (!key || key.includes("..")) return new Response("Invalid key", { status: 400 });
      const object = await env.FLAYORA_BUCKET.get(key);
      if (!object) return new Response(null, { status: 404 });
      return new Response(JSON.stringify({ key, value: await object.text(), shared: true, storageMode: "r2" }), { headers });
    }
    const listed = await env.FLAYORA_BUCKET.list({ prefix, limit: 1000 });
    return new Response(JSON.stringify({ keys: listed.objects.map(o => o.key), prefix, shared: true, storageMode: "r2" }), { headers });
  }
  if (request.method === "PUT") {
    if (!key || key.includes("..")) return new Response("A valid key is required", { status: 400 });
    const value = await request.text();
    await env.FLAYORA_BUCKET.put(key, value, { httpMetadata: { contentType: "text/plain; charset=utf-8" } });
    return new Response(JSON.stringify({ key, value, shared: true, storageMode: "r2" }), { headers });
  }
  if (request.method === "DELETE") {
    if (!key || key.includes("..")) return new Response("A valid key is required", { status: 400 });
    await env.FLAYORA_BUCKET.delete(key);
    return new Response(JSON.stringify({ key, deleted: true, shared: true, storageMode: "r2" }), { headers });
  }
  return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, PUT, DELETE" } });
}
