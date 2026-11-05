const PREFIX = "flayora-analytics-event:";

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

    const length = Number(request.headers.get("Content-Length") || 0);
    if (length > 2048) return json({ error: "Event is too large" }, 413);

    let event;
    try { event = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
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

  if (request.method === "GET") {
    const listed = await env.FLAYORA_BUCKET.list({ prefix: PREFIX, limit: 1000 });
    const records = await Promise.all(listed.objects.map(async item => {
      try {
        const object = await env.FLAYORA_BUCKET.get(item.key);
        return object ? await object.json() : null;
      } catch { return null; }
    }));
    const events = records.filter(Boolean);
    return json({
      visits: events.filter(event => event.type === "page_view").length,
      enquiries: events.filter(event => event.type === "enquiry")
        .sort((a, b) => String(b.at).localeCompare(String(a.at)))
        .slice(0, 200)
        .map(event => ({ code: event.code, name: event.name, time: event.at }))
    });
  }

  return json({ error: "Method not allowed" }, 405);
}