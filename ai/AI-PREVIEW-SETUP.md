# Flayora AI preview setup

All work is for `growth/sales-funnel-b2b`. Do not merge or deploy to `main`.

## Endpoint

`POST /api/ai/chat`

Example body:

```json
{
  "assistant": "customer",
  "message": "Can you help me plan a bulk T-shirt order?",
  "history": []
}
```

Team preview requests may set `assistant: "team"` and send `X-Flayora-Team-Key`. The key must be a long random secret stored as a Pages **preview-only** environment variable named `FLAYORA_TEAM_PREVIEW_KEY`. This is a temporary development gate, not the final staff authentication system.

## Preview environment variables

Configure these only under Cloudflare Pages > flayora-development > Settings > Environment variables > Preview:

- `CF_ACCOUNT_ID`: Cloudflare account ID.
- `CF_AI_TOKEN`: API token with Workers AI permissions. Store as a secret.
- `FLAYORA_AI_MODEL`: optional model ID; defaults to `@cf/meta/llama-3.1-8b-instruct`.
- `FLAYORA_TEAM_PREVIEW_KEY`: optional long random secret for Team Desk preview access.

Do not set these under Production. Do not put tokens in HTML, Git, client JavaScript, or chat messages.

## Important

- The API is a first preview scaffold. It currently uses approved curated knowledge only; Vectorize/D1 ingestion and dynamic catalogue retrieval are later phases.
- The public endpoint should receive Cloudflare rate limiting / abuse controls before any public launch.
- Team preview key is not a replacement for staff accounts, secure sessions, roles or audit logs.
- Never use real customer, payment, supplier, margin or sensitive business records in this preview.
