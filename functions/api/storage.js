export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  const prefix = url.searchParams.get("prefix") || "";
  const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
  if (!env.FLAYORA_BUCKET) return new Response(JSON.stringify({ error: "R2 binding FLAYORA_BUCKET is missing" }), { status: 503, headers });
  if(request.method!=="GET")return new Response("Read only",{status:405,headers:{Allow:"GET"}});
  if(key!==null ? !/^(?:flayora-catalog|flayora-hero-slides|flayora-hero-image:\d+|flayora-image:[\w-]+(?::\d+)?)$/.test(key) : prefix!=="flayora-image:")return new Response("Unknown resource",{status:404});
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
}
