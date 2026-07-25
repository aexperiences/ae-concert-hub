/* HUB CORE — the shared floating AI assistant. Reads HUB_CONFIG.assistant + brand,
   calls /api/assistant (DeepSeek). Mounts only for signed-in (non-guest) users.
   A page may set window.AssistantContext = function(){ return {...} } to feed the AI
   its real on-screen data. Accelerated Experiences, LLC. */
(function () {
  var C = window.HUB_CONFIG || {}; var AS = C.assistant || {}; var BR = C.brand || {};
  var TOKEN = (new URLSearchParams(location.search).get("sess")) || (function () { try { return localStorage.getItem("hub_sess") || ""; } catch (e) { return ""; } })();
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var name = AS.name || "Assistant";

  var css =
    ".as-fab{position:fixed;right:18px;bottom:18px;z-index:1400;width:54px;height:54px;border-radius:50%;border:none;cursor:pointer;font-size:23px;background:linear-gradient(180deg,var(--accent),var(--accent2));color:var(--onAccent);box-shadow:0 8px 22px rgba(0,0,0,.28)}" +
    ".as-fab:hover{transform:translateY(-2px)}" +
    ".as-panel{position:fixed;right:18px;bottom:84px;z-index:1400;width:360px;max-width:calc(100vw - 28px);max-height:74vh;display:none;flex-direction:column;background:var(--card);border:1px solid var(--line);border-radius:16px;box-shadow:0 22px 60px rgba(0,0,0,.28);overflow:hidden;font-family:Inter,system-ui,sans-serif}" +
    ".as-panel.on{display:flex}" +
    ".as-head{display:flex;align-items:center;gap:9px;padding:12px 15px;background:linear-gradient(180deg,var(--accent),var(--accent2));color:var(--onAccent)}" +
    ".as-head b{font-family:Georgia,serif;font-size:16px}.as-head small{opacity:.85;font-size:11px}" +
    ".as-x{margin-left:auto;background:rgba(255,255,255,.18);border:none;color:var(--onAccent);width:26px;height:26px;border-radius:7px;cursor:pointer;font-size:16px}" +
    ".as-body{flex:1;overflow-y:auto;padding:13px 15px;font-size:14px}" +
    ".as-in{display:flex;gap:8px;padding:12px 15px;border-top:1px solid var(--line)}" +
    ".as-in textarea{flex:1;border:1px solid var(--line);border-radius:9px;padding:9px 11px;font:inherit;font-size:14px;min-height:52px;resize:vertical;color:var(--ink);background:var(--paper)}" +
    ".as-in textarea:focus{outline:none;border-color:var(--accent)}" +
    ".as-go{background:linear-gradient(180deg,var(--accent),var(--accent2));color:var(--onAccent);border:none;border-radius:9px;padding:0 14px;font-weight:700;cursor:pointer;font-family:Georgia,serif}.as-go:disabled{opacity:.5}" +
    ".as-msg{white-space:pre-wrap;line-height:1.55;color:var(--ink);background:var(--paper);border:1px solid var(--line);border-radius:11px;padding:11px 12px;margin-bottom:9px}" +
    ".as-msg.me{background:transparent;border:none;color:var(--mut);padding:2px 2px 6px}" +
    ".as-cp{font-size:11.5px;border:1px solid var(--line);background:var(--card);border-radius:8px;padding:6px 11px;cursor:pointer;color:var(--ink2)}" +
    ".as-hint{color:var(--mut);font-size:12.5px;line-height:1.5}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var fab, panel, out, busy = false;
  function mountUI() {
    fab = document.createElement("button"); fab.className = "as-fab"; fab.type = "button"; fab.title = name; fab.innerHTML = "&#10024;";
    panel = document.createElement("div"); panel.className = "as-panel";
    panel.innerHTML =
      '<div class="as-head"><span>&#10024;</span><div><b>' + esc(name) + "</b><br><small>" + esc(AS.role || "Assistant") + "</small></div><button class=\"as-x\">&times;</button></div>" +
      '<div class="as-body" id="asBody"><div class="as-hint">' + esc(AS.blurb || "Ask me anything about your work here.") + "</div></div>" +
      '<div class="as-in"><textarea id="asPrompt" placeholder="Ask ' + esc(name) + "…\"></textarea><button class=\"as-go\" id=\"asGo\">Ask</button></div>";
    document.body.appendChild(fab); document.body.appendChild(panel);
    out = panel.querySelector("#asBody");
    fab.onclick = function () { panel.classList.toggle("on"); if (panel.classList.contains("on")) panel.querySelector("#asPrompt").focus(); };
    panel.querySelector(".as-x").onclick = function () { panel.classList.remove("on"); };
    panel.querySelector("#asGo").onclick = ask;
    panel.querySelector("#asPrompt").addEventListener("keydown", function (e) { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") ask(); });
  }
  function ask() {
    if (busy) return; var ta = panel.querySelector("#asPrompt"); var p = ta.value.trim(); if (!p) return;
    busy = true; panel.querySelector("#asGo").disabled = true;
    var me = document.createElement("div"); me.className = "as-msg me"; me.textContent = p; out.appendChild(me); ta.value = "";
    var wait = document.createElement("div"); wait.className = "as-msg"; wait.textContent = "…"; out.appendChild(wait); out.scrollTop = out.scrollHeight;
    var ctx = null; try { if (typeof window.AssistantContext === "function") ctx = window.AssistantContext(); } catch (e) {}
    var sec = (function () { try { return (location.pathname.split("/").pop() || "").replace(".html", ""); } catch (e) { return ""; } })();
    fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sess: TOKEN, brand: BR.name || "", persona: AS.persona || "", section: sec, prompt: p, context: ctx }) })
      .then(function (r) { return r.json(); }).then(function (j) {
        busy = false; panel.querySelector("#asGo").disabled = false;
        wait.textContent = (j && j.ok) ? j.text : ((j && j.message) || "No answer.");
        if (j && j.ok) { var cp = document.createElement("button"); cp.className = "as-cp"; cp.textContent = "Copy"; cp.onclick = function () { navigator.clipboard && navigator.clipboard.writeText(j.text); cp.textContent = "Copied"; }; out.appendChild(cp); }
        out.scrollTop = out.scrollHeight;
      }).catch(function () { busy = false; panel.querySelector("#asGo").disabled = false; wait.textContent = "Network hiccup — try again."; });
  }

  (window.hubWho || Promise.resolve(null)).then(function (w) {
    var roles = (w && (w.roles || (w.role ? [w.role] : []))) || [];
    if (roles.length && roles.indexOf("guest") < 0) mountUI();   // signed-in only
  });
})();
