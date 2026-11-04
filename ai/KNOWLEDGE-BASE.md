# Flayora AI knowledge base

This is the initial curated seed for the development preview. It is intentionally conservative.

## Approval status

- The initial assistant only retrieves entries marked `approved`.
- Entries marked `draft` are excluded until the owner verifies them.
- Do not add supplier costs, margins, staff details, private customer data or credentials to public knowledge.
- Do not add prices until they have a current source, effective date and owner approval.

## Initial verified response rules

- Never invent a price, stock quantity, discount, MOQ, production slot or delivery promise.
- Treat a customer enquiry as a lead, not an order confirmation.
- Escalate unusual material/printing combinations to a human.
- Ask for product, quantity, artwork status, sizes/dimensions, colour/material, delivery location and required date when qualifying custom work.

## Draft facts requiring owner review

The following are present in `functions/_lib/flayora-knowledge.js` but intentionally excluded from AI retrieval until reviewed:

- Flayora business overview and current product range.
- Sublimation and DTF compatibility guidance.

The catalogue should become the source of truth for current products and public prices. The knowledge base should not become a competing manually-maintained catalogue.
