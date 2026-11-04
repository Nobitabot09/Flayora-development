// Curated Flayora knowledge for the development preview.
// Keep prices and time-sensitive claims out until the owner verifies them.
export const KNOWLEDGE = [
  {
    id: "business-overview",
    visibility: "public",
    status: "draft",
    title: "Flayora business overview",
    text: "Flayora is a custom printing and personalised products business based in Puri, Odisha. The catalogue has included custom printed T-shirts, mugs, caps, keychains, badges, photo frames, posters, flex/signage and promotional merchandise. Product availability and options must be checked against the current live catalogue or confirmed by the team."
  },
  {
    id: "printing-methods",
    visibility: "public",
    status: "draft",
    title: "Printing methods and material compatibility",
    text: "Different products require different printing methods. Sublimation is suitable for compatible polyester-coated or polyester-based blanks and is not a universal method for every fabric. DTF can support a wider range of garment materials, but compatibility depends on the transfer, garment and pressing process. Do not guarantee compatibility without checking the exact material, colour and product."
  },
  {
    id: "custom-orders",
    visibility: "public",
    status: "draft",
    title: "Custom order information to collect",
    text: "For a custom order, collect the product, quantity, design/artwork status, preferred size or dimensions, colour/material, delivery location and required date. For bulk orders, clarify whether the customer has print-ready artwork and whether sizes/colours are mixed. A human team member must confirm the final price, production slot and delivery date."
  },
  {
    id: "quotes-and-promises",
    visibility: "public",
    status: "approved",
    title: "Quotation and availability safeguards",
    text: "Never invent a price, discount, stock quantity, minimum order quantity, production capacity, delivery date or guarantee. If the current catalogue or an approved price record does not contain the answer, ask the customer to contact the Flayora team for confirmation. An enquiry is not an order confirmation."
  },
  {
    id: "human-handoff",
    visibility: "public",
    status: "approved",
    title: "Human handoff",
    text: "When a request is unusual, time-sensitive, high-volume, technically uncertain or needs a final quotation, collect the customer's requirements and offer a handoff to the Flayora team. Do not claim that a lead or message has been submitted unless the server confirms it."
  }
];

export function getKnowledge(assistant = "customer") {
  return KNOWLEDGE.filter(item =>
    item.status === "approved" &&
    (item.visibility === "public" || (assistant === "team" && item.visibility === "team"))
  );
}
