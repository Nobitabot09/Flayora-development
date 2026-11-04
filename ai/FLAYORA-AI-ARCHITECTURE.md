# Flayora AI — Architecture & Development Plan

Status: Architecture proposal / Phase 0
Target branch: `growth/sales-funnel-b2b`
Production: `main` — do not modify or deploy without explicit approval.

## 1. Product goal

Build one Flayora business knowledge system with two separate AI experiences:

1. **Customer AI** embedded in the public storefront. It helps visitors discover products, understand print methods, collect custom-order requirements, and create a customer enquiry/lead.
2. **Team Desk AI** inside the private Team Desk. It helps authorized team members find operational information, summarize enquiries, draft quotes for human approval, and later query authorized business records.

Both experiences use the same curated business knowledge and AI service, but have different identities, permissions, tools, data visibility, rate limits, and system instructions. They must never share a conversation or expose internal records across roles.

## 2. Architecture

```
Public storefront                         Private Team Desk
  Customer AI widget                        Team AI panel
        |                                         |
        +-------------------+---------------------+
                            |
                 Pages Functions API
              /api/ai/customer/chat
              /api/ai/team/chat
              /api/ai/customer/lead
                            |
                 Auth + validation layer
             rate limits / input limits / origin
             session identity / role checks
                            |
                   AI orchestration
              prompt + intent + tool allowlist
                 retrieval + citations
                            |
          +-----------------+-----------------+
          |                 |                 |
     Workers AI         Vectorize           D1
   chat generation     semantic search   canonical records
   embeddings           knowledge index   users, leads,
                                           conversations,
                                           audit events
          |                 |
          +--------+--------+
                   |
             R2 knowledge files
       approved product/service facts,
       policies, print guides, FAQs,
       approved price tables and revisions
```

### Cloudflare components

| Component | Responsibility | Design choice |
|---|---|---|
| Cloudflare Pages Functions | API routes and orchestration | Keep API on same origin as the existing site |
| Workers AI | LLM inference and embeddings | Start with a cost-conscious model; benchmark quality before locking model IDs |
| Vectorize | Semantic retrieval | Store embeddings and safe metadata; keep canonical source text in D1/R2 |
| D1 | Structured business data | Users/roles, customer leads, conversation metadata, knowledge versions, audit log; later orders/CRM |
| R2 | Knowledge source files and uploaded documents | Versioned approved source documents; do not expose private objects publicly |
| Cloudflare Turnstile / rate limiting | Abuse and automated traffic controls | Add before public launch; do not treat client-side checks as security |

Do not introduce Agents SDK or Durable Objects in the first release. A stateless request/response assistant is enough initially. Add stateful agent infrastructure only if a demonstrated need for long-running or realtime tasks appears.

## 3. Knowledge strategy: retrieval first, not fine-tuning

"Training the AI" for this project means preparing a reliable Flayora knowledge base and using retrieval-augmented generation (RAG). We should **not fine-tune a model in v1**. Fine-tuning would be harder to update when prices, products, suppliers, or policies change, and it would not guarantee factual answers.

### Initial knowledge packs

1. Business identity, location, contact details, working hours (only after confirmed), service boundaries.
2. Product catalogue: name, code, description, options, public price if approved, made-to-order/stock status.
3. Printing capability matrix: sublimation, DTF, vinyl, heat press, material compatibility, size/colour limitations.
4. Custom-order intake: quantity, artwork, garment/material, sizes, colours, delivery location, required date.
5. Customer FAQs: artwork requirements, turnaround caveats, proof approval, payment and delivery policies.
6. Bulk/B2B workflow: minimum quantity rules, quote variables, lead qualification, human escalation.
7. Internal-only playbook: costing, supplier details, margins, production capacity, internal pricing floors and operational notes. **Team-only retrieval, never customer-visible.**

Every source needs an owner, status (draft/approved/retired), effective date, version and visibility classification: `public`, `team`, or `restricted`. The AI must retrieve only sources permitted for the active assistant.

### Data quality rules

- No invented prices, stock, delivery dates, production capacity, guarantees, or material compatibility.
- If a value is missing or stale, ask a follow-up or route to a human.
- Public answers may cite product/service names or approved policy snippets; internal documents and supplier/cost details must never be returned to customers.
- Keep price and policy facts in structured records where possible, not buried only in prose.
- Re-index only approved, changed knowledge sources; retain source version and retrieval trace for debugging.

## 4. Assistant roles and permissions

### Customer AI

Allowed:
- Search and explain public products/services.
- Ask structured follow-up questions for custom work.
- Explain known material/printing compatibility with caveats.
- Create a lead/enquiry after clear customer intent and consent.
- Hand off to WhatsApp or a human when uncertain.

Not allowed:
- Read internal costing, supplier, margin, finance, staff or private customer records.
- Change catalogue, stock, price, orders or policies.
- Confirm an order, payment, deadline or production slot.
- Claim an enquiry was submitted unless the API confirms it.

### Team Desk AI

Allowed only after server-verified staff authentication and role checks:
- Search public and team-approved knowledge.
- Summarize customer enquiries the user is authorized to view.
- Draft quote text and production checklists for human approval.
- Explain costing/pricing rules to roles with the relevant permission.
- Read business data through narrowly scoped server-side tools.

Not allowed by default:
- Send messages, issue final quotations, modify inventory, approve discounts, mark payments, delete records, or change user permissions.
- Access restricted finance data without explicit permission.
- Execute arbitrary SQL, arbitrary URLs, or model-generated code.

All write actions should require explicit human confirmation and be recorded in an audit log.

## 5. API contracts (proposed)

- `POST /api/ai/customer/chat` — public chat; strict rate limit; no private data.
- `POST /api/ai/team/chat` — authenticated team chat; role-scoped retrieval and tools.
- `POST /api/ai/customer/lead` — validate and create a customer lead; consent and idempotency key.
- `GET /api/ai/health` — non-sensitive service health only; no secrets or binding details.

Request bodies should be schema-validated, size-limited, and reject unexpected fields. Keep provider/model credentials and all privileged tool logic server-side. Do not trust a role, user ID, price, product state, or permission supplied by the browser.

## 6. Security prerequisite — block before AI launch

The existing `/api/storage` route currently allows unauthenticated reads, writes and deletes against the shared R2 bucket. The Team PIN is also embedded in public JavaScript. This is not real authentication.

Before private Team Desk AI or private business knowledge is connected:
1. Replace the public generic R2 key/value read/write API with explicit public read endpoints and authenticated private endpoints.
2. Preserve public storefront access only to the approved catalogue and product images.
3. Move team authentication to server-verified sessions; hash credentials, use secure HttpOnly cookies, CSRF protection where applicable, expiry and logout.
4. Enforce roles and permissions inside every server route, not in UI state or prompt text.
5. Move private records to D1 with ownership/role checks; keep R2 objects private by default.
6. Rotate/remove the exposed Team PIN and audit existing public bucket keys for private information.
7. Add request validation, rate limits, abuse controls, safe error responses and audit logging.

Do not store customer PII, business costs, margins or staff data in Vectorize without access-safe partitioning. For v1, prefer indexing public knowledge and team knowledge separately (separate namespaces/indexes as appropriate), and enforce the role boundary server-side before retrieval. Never rely on a prompt instruction as the security boundary.

## 7. Development phases

### Phase 0 — Architecture and inventory (this document)
- Confirm source-of-truth for product data, prices, policies and print capability.
- Inventory existing Cloudflare bindings, R2 objects and current data formats.
- Decide which facts are public, team-only and restricted.
- No production changes.

### Phase 1 — Security and data foundation
- Fix the unauthenticated storage API and replace the exposed PIN gate.
- Establish server-side staff sessions and roles.
- Add D1 schema/migrations for users, leads, conversation metadata, knowledge sources/versions and audit events.
- Keep storefront public catalogue reads functioning.
- Add tests for anonymous access, role boundaries and data isolation.

### Phase 2 — Knowledge ingestion and retrieval
- Create curated Markdown/JSON source files in the repository.
- Add an admin-only ingestion/re-index operation.
- Generate embeddings with Workers AI and upsert to Vectorize.
- Retrieve top relevant passages with source IDs, version and visibility checks.
- Add stale/missing knowledge fallbacks and retrieval evaluation tests.

### Phase 3 — Customer AI
- Add a responsive, accessible chat widget to the storefront.
- Implement product/service lookup and custom-order intake.
- Save leads through the validated lead endpoint.
- Provide WhatsApp/human handoff.
- No order/payment/availability promises.

### Phase 4 — Team Desk AI
- Add private AI panel after secure login is working.
- Add read-only tools first: product lookup, knowledge search, enquiry summaries.
- Add quote drafting and checklists with human approval.
- Apply role-based visibility and audit every tool call.

### Phase 5 — Evaluation, preview and release
- Run a versioned test suite and regression checks on the development preview.
- Test mobile, desktop, accessibility, abuse cases, prompt injection, data leakage, malformed input, provider failure and R2/D1/Vectorize failure.
- Shadow-test answers against known facts; record retrieval source and expected answer.
- Release only after acceptance gates pass and owner explicitly approves production rollout.

## 8. Test and release gates

Minimum pre-release evaluation set: 100+ questions, including:
- Public product discovery and accurate product facts.
- DTF/sublimation compatibility edge cases.
- Bulk enquiry intake with missing quantity, artwork, material or deadline.
- Unknown prices and unavailable policy facts (must not hallucinate).
- Prompt injection asking for system prompts, staff data, supplier costs or margins.
- Customer assistant attempting team-only retrieval.
- Team member with limited role attempting restricted finance access.
- Duplicate lead submission, spam, oversized payload and malformed JSON.
- Provider timeout, empty retrieval, stale index and database failure.
- Mobile keyboard, long messages, loading state, retry and human handoff.

Release criteria:
- Zero cross-role/private-data leakage in the test suite.
- Zero fabricated prices, stock or delivery promises in critical test cases.
- All lead writes are validated, idempotent and auditable.
- No secrets in client assets or logs.
- No regression to storefront catalogue, product images, WhatsApp links or Team Desk inventory.
- Manual owner approval before any production deployment.

## 9. Cost and model strategy

Start with Workers AI because the site and storage already use Cloudflare. Keep the model behind a server-side provider adapter so a different model/provider can be introduced later without changing the widget. Benchmark answer quality, latency and usage on real Flayora questions before selecting the final model. Add AI Gateway only if observability, caching or provider routing justifies it. Set per-session limits, request token limits, daily budgets/alerts where supported, and a safe fallback when AI is unavailable.

Do not promise that this is free: inference, embeddings, vector search, D1, R2 and traffic may incur usage charges depending on account plan and usage. Verify current pricing and account entitlements before enabling public traffic.

## 10. Immediate next implementation tasks

1. Inspect current Cloudflare Pages project bindings and the R2 bucket contents/data classification.
2. Create a separate AI architecture branch or continue only on `growth/sales-funnel-b2b` after confirming its current head; never touch `main`.
3. Build the security/data foundation before exposing AI endpoints.
4. Draft the first approved knowledge pack from verified catalogue and business facts.
5. Add an offline evaluation fixture before connecting a live model.
