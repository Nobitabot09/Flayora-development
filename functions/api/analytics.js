const PREFIX = "flayora-analytics-event:";
const MAX_EVENT_BYTES = 2048;

async function readBoundedBody(request, maxBytes) {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function onRequest({ request, env }) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  };
  const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (!env.FLAYORA_BUCKET) return json({ error: "Analytics storage is unavailable" }, 503);

  if (request.method === "POST") {
    const origin = request.headers.get("Origin");
    const requestOrigin = new URL(request.url).origin;
    if (origin && origin !== requestOrigin) return json({ error: "Origin not allowed" }, 403);

    const declaredLength = Number(request.headers.get("Content-Length") || 0);
    if (declaredLength > MAX_EVENT_BYTES) return json({ error: "Event is too large" }, 413);

    let body;
    try {
      body = await readBoundedBody(request, MAX_EVENT_BYTES);
    } catch {
      return json({ error: "Invalid request body" }, 400);
    }
    if (body === null) return json({ error: "Event is too large" }, 413);

    let event;
    try { event = JSON.parse(body); } catch { return json({ error: "Invalid JSON" }, 400); }
    if (!event || !["page_view", "enquiry"].includes(event.type)) return json({ error: "Unsupported event type" }, 400);

    const record = {
      type: event.type,
      at: new Date().toISOString()
    };
    if (event.type === "enquiry") {
      record.code = String(event.code || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
      record.name = String(event.name || "").replace(/[<>]/g, "").slice(0, 100);
      if (!record.code) return json({ error: "Product code is required" }, 400);
    }

    const id = crypto.randomUUID();
    await env.FLAYORA_BUCKET.put(PREFIX + Date.now() + ":" + id, JSON.stringify(record), {
      httpMetadata: { contentType: "application/json; charset=utf-8" }
    });
    return json({ ok: true }, 201);
  }

  return json({error:"Method not allowed"},405);
}
