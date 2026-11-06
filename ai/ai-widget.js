(() => {
  if (window.__flayoraAIWidgetLoaded) return;
  window.__flayoraAIWidgetLoaded = true;

  const CUSTOMER_AI_URL = "https://flayora-ai-customer.pages.dev/?embed=1";
  const launcher = document.createElement("button");
  launcher.id = "fl-ai-launcher";
  launcher.type = "button";
  launcher.innerHTML = '<span aria-hidden="true">🐦</span> Ask Flayora AI';

  const panel = document.createElement("section");
  panel.id = "fl-ai-panel";
  panel.setAttribute("aria-label", "Flayora AI assistant");
  panel.innerHTML = `
    <header class="fl-ai-head"><strong>Flayora AI</strong><button class="fl-ai-close" type="button" aria-label="Close">×</button></header>
    <iframe class="fl-ai-customer-frame" title="Flayora AI customer assistant" src="${CUSTOMER_AI_URL}" loading="eager" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  document.body.append(launcher, panel);
  launcher.addEventListener("click", () => {
    panel.classList.toggle("open");
    if (panel.classList.contains("open")) panel.querySelector("iframe").focus();
  });
  panel.querySelector(".fl-ai-close").addEventListener("click", () => panel.classList.remove("open"));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") panel.classList.remove("open");
  });
})();