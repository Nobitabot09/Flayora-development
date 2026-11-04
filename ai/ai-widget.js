(() => {
  if (window.__flayoraAIWidgetLoaded) return;
  window.__flayoraAIWidgetLoaded = true;
  const launcher = document.createElement("button");
  launcher.id = "fl-ai-launcher"; launcher.type = "button"; launcher.textContent = "Ask Flayora AI";
  const panel = document.createElement("section");
  panel.id = "fl-ai-panel"; panel.setAttribute("aria-label", "Flayora AI assistant");
  panel.innerHTML = '<header class="fl-ai-head"><strong>Flayora AI</strong><button class="fl-ai-close" type="button" aria-label="Close">×</button></header><nav class="fl-ai-modes"><button class="fl-ai-mode active" data-mode="customer" type="button">Customer assistant</button><button class="fl-ai-mode" data-mode="team" type="button">Team Desk AI</button></nav><div class="fl-ai-messages" aria-live="polite"></div><div class="fl-ai-meta">Preview assistant · Answers may need team confirmation</div><form class="fl-ai-form"><textarea rows="1" maxlength="1800" aria-label="Your message" placeholder="Ask about products or custom printing…"></textarea><button class="fl-ai-send" type="submit">Send</button></form>';
  document.body.append(launcher, panel);
  const messages = panel.querySelector(".fl-ai-messages"), form = panel.querySelector("form"), input = form.querySelector("textarea"), send = form.querySelector("button");
  let mode = "customer", history = [], teamKey = "";
  function bubble(text, who) { const el=document.createElement("div"); el.className="fl-ai-msg "+who; el.textContent=text; messages.append(el); messages.scrollTop=messages.scrollHeight; }
  function welcome(){ messages.replaceChildren(); history=[]; bubble(mode==="team"?"Team Desk preview is separate from customer chat. Enter the preview access key when prompted. This is not the final staff login.":"Hi! I'm Flayora's assistant. Ask me about custom printing, products or planning an order. I'll confirm when something needs the team.", "bot"); input.placeholder=mode==="team"?"Ask an internal business question…":"Ask about products or custom printing…"; }
  launcher.onclick=()=>panel.classList.toggle("open");
  panel.querySelector(".fl-ai-close").onclick=()=>panel.classList.remove("open");
  panel.querySelectorAll("[data-mode]").forEach(btn=>btn.onclick=()=>{mode=btn.dataset.mode;panel.querySelectorAll("[data-mode]").forEach(b=>b.classList.toggle("active",b===btn));if(mode==="team"&&!teamKey){const key=document.createElement("input");key.className="fl-ai-key";key.type="password";key.autocomplete="off";key.placeholder="Team preview access key";key.setAttribute("aria-label","Team preview access key");panel.insertBefore(key,messages);key.addEventListener("change",()=>{teamKey=key.value.trim();key.remove();});key.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();teamKey=key.value.trim();key.remove();}});}welcome();});
  welcome();
  form.addEventListener("submit",async e=>{
    e.preventDefault();const message=input.value.trim();if(!message||send.disabled)return;
    if(mode==="team"&&!teamKey){bubble("Enter the Team preview access key above first.","bot");return;}
    bubble(message,"user");input.value="";send.disabled=true;send.textContent="…";
    const prior=history.slice(-8);
    try{
      const headers={"Content-Type":"application/json"};if(mode==="team")headers["X-Flayora-Team-Key"]=teamKey;
      const res=await fetch("/api/ai/chat",{method:"POST",headers,body:JSON.stringify({assistant:mode,message,history:prior})});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(data.error||"AI request failed ("+res.status+").");
      bubble(data.answer||"I couldn't produce an answer. Please try again.","bot");
      history.push({role:"user",content:message},{role:"assistant",content:data.answer||""});
    }catch(err){bubble(err.message||"Flayora AI is temporarily unavailable.","bot");}
    finally{send.disabled=false;send.textContent="Send";input.focus();}
  });
})();