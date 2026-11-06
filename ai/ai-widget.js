(() => {
  if (window.__flayoraAIWidgetLoaded) return;
  window.__flayoraAIWidgetLoaded = true;

  const CUSTOMER_AI_URL = "https://flayora-ai-customer.pages.dev";

  const launcher = document.createElement("button");
  launcher.id = "fl-ai-launcher";
  launcher.type = "button";
  launcher.innerHTML = '<span aria-hidden="true">🐦</span> Ask Flayora AI';

  const panel = document.createElement("section");
  panel.id = "fl-ai-panel";
  panel.setAttribute("aria-label", "Flayora AI assistant");
  panel.innerHTML = `
    <header class="fl-ai-head"><strong>Flayora AI</strong><button class="fl-ai-close" type="button" aria-label="Close">×</button></header>
    <nav class="fl-ai-modes" aria-label="Assistant type">
      <button class="fl-ai-mode active" data-mode="customer" type="button">Customer assistant</button>
      <button class="fl-ai-mode" data-mode="team" type="button">Team Desk AI</button>
    </nav>
    <iframe class="fl-ai-customer-frame" title="Flayora AI customer assistant" src="${CUSTOMER_AI_URL}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>
    <div class="fl-ai-team-view" hidden>
      <div class="fl-ai-messages" aria-live="polite"></div>
      <div class="fl-ai-meta">Team Desk preview · Internal answers may need team confirmation</div>
      <form class="fl-ai-form"><textarea rows="1" maxlength="1800" aria-label="Your message" placeholder="Ask an internal business question…"></textarea><button class="fl-ai-send" type="submit">Send</button></form>
    </div>`;
  document.body.append(launcher, panel);

  const messages = panel.querySelector(".fl-ai-messages");
  const form = panel.querySelector(".fl-ai-form");
  const input = form.querySelector("textarea");
  const send = form.querySelector("button");
  const customerFrame = panel.querySelector(".fl-ai-customer-frame");
  const teamView = panel.querySelector(".fl-ai-team-view");
  let mode = "customer", history = [], teamKey = "";

  function bubble(text, who) {
    const el = document.createElement("div");
    el.className = "fl-ai-msg " + who;
    el.textContent = text;
    messages.append(el);
    messages.scrollTop = messages.scrollHeight;
  }
  function welcomeTeam() {
    messages.replaceChildren();
    history = [];
    bubble("Team Desk preview is separate from customer chat. Enter the preview access key when prompted. This is not the final staff login.", "bot");
  }
  function setMode(nextMode) {
    mode = nextMode;
    panel.querySelectorAll("[data-mode]").forEach(btn => btn.classList.toggle("active", btn.dataset.mode === mode));
    const customer = mode === "customer";
    customerFrame.hidden = !customer;
    teamView.hidden = customer;
    if (!customer) {
      if (!teamKey && !panel.querySelector(".fl-ai-key")) {
        const key = document.createElement("input");
        key.className = "fl-ai-key";
        key.type = "password";
        key.autocomplete = "off";
        key.placeholder = "Team preview access key";
        key.setAttribute("aria-label", "Team preview access key");
        panel.insertBefore(key, teamView);
        key.addEventListener("change", () => { teamKey = key.value.trim(); key.remove(); });
        key.addEventListener("keydown", e => {
          if (e.key === "Enter") { e.preventDefault(); teamKey = key.value.trim(); key.remove(); }
        });
      }
      welcomeTeam();
    }
  }

  launcher.addEventListener("click", () => panel.classList.toggle("open"));
  panel.querySelector(".fl-ai-close").addEventListener("click", () => panel.classList.remove("open"));
  panel.querySelectorAll("[data-mode]").forEach(btn => btn.addEventListener("click", () => setMode(btn.dataset.mode)));

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message || send.disabled) return;
    if (mode !== "team") return;
    if (!teamKey) { bubble("Enter the Team preview access key above first.", "bot"); return; }

    bubble(message, "user");
    input.value = "";
    send.disabled = true;
    send.textContent = "…";
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Flayora-Team-Key": teamKey },
        body: JSON.stringify({ assistant: "team", message, history: history.slice(-8) })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "AI request failed (" + res.status + ").");
      const answer = data.answer || "I couldn't produce an answer. Please try again.";
      bubble(answer, "bot");
      history.push({ role: "user", content: message }, { role: "assistant", content: answer });
    } catch (err) {
      bubble(err.message || "Flayora Team Desk AI is temporarily unavailable.", "bot");
    } finally {
      send.disabled = false;
      send.textContent = "Send";
      input.focus();
    }
  });
})();
