/* HUB CORE — shared, config-driven side navigation + skin + header. Role-aware.
   Drop on any page:  <script src="/config.js"></script><script src="/hub-nav.js" defer></script>
   Reads window.HUB_CONFIG. Nothing here is tenant-specific. Accelerated Experiences, LLC. */
(function () {
  var C = window.HUB_CONFIG || {};
  var SECTIONS = C.sections || [];
  var DEPTS = C.departments || [{ name: "", keys: SECTIONS.map(function (s) { return s.k; }) }];
  var ROLES = C.roles || { guest: ["home"] };
  var PRETTY = C.rolePretty || {};
  var SK = C.skin || {};
  var BR = C.brand || { name: "OS", short: "OS", version: "" };
  var ALLKEYS = SECTIONS.map(function (s) { return s.k; });

  var TOKEN = (new URLSearchParams(location.search).get("sess")) || (function () { try { return localStorage.getItem("hub_sess") || ""; } catch (e) { return ""; } })();
  if (TOKEN) { try { localStorage.setItem("hub_sess", TOKEN); } catch (e) {} }
  var S = TOKEN ? ("?sess=" + encodeURIComponent(TOKEN)) : "";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // shared whoami promise (deduped across every include on the page)
  window.hubWho = window.hubWho || fetch("/api/auth?do=whoami&t=" + encodeURIComponent(TOKEN)).then(function (r) { return r.json(); }).catch(function () { return null; });

  function allowed(roles) {
    if (!roles || !roles.length) return ROLES.guest || ["home"];
    var set = {};
    roles.forEach(function (r) { var v = ROLES[r]; if (v === "*") ALLKEYS.forEach(function (k) { set[k] = 1; }); else (v || []).forEach(function (k) { set[k] = 1; }); });
    var keys = ALLKEYS.filter(function (k) { return set[k]; });
    return keys.length ? keys : (ROLES.guest || ["home"]);
  }
  function curKey() { var here = (location.pathname || "/hub.html").replace(/\/index\.html$/, "/"); if (here === "/hub.html" || here === "/") return "home"; for (var i = 0; i < SECTIONS.length; i++) { var s = SECTIONS[i]; if (s.href !== "/hub.html" && here.indexOf(s.href) === 0) return s.k; } return "home"; }
  function curDept() { var k = curKey(); for (var d = 0; d < DEPTS.length; d++) { if ((DEPTS[d].keys || []).indexOf(k) >= 0) return DEPTS[d]; } return null; }
  function curSec() { var k = curKey(); for (var i = 0; i < SECTIONS.length; i++) if (SECTIONS[i].k === k) return SECTIONS[i]; return null; }

  // ---- skin: brand base + this page's department accent ----
  var dep = curDept();
  var A = (dep && dep.accent) || SK.accent || "#a8762c";
  function shade(hex, f) { try { var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; r = Math.round(r * f); g = Math.round(g * f); b = Math.round(b * f); return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); } catch (e) { return hex; } }
  var A2 = SK.accent2 || shade(A, 0.82), A3 = SK.accent3 || shade(A, 0.66);
  if (dep && dep.accent) { A2 = shade(A, 0.82); A3 = shade(A, 0.66); }
  var root = ":root{--paper:" + (SK.paper || "#f4f1ea") + ";--card:" + (SK.card || "#fff") + ";--cream:" + (SK.cream || "#eae5da") +
    ";--ink:" + (SK.ink || "#1d1a16") + ";--ink2:" + (SK.ink2 || "#4a443b") + ";--mut:" + (SK.mut || "#8b8175") +
    ";--line:" + (SK.line || "#ddd6c8") + ";--line2:" + (SK.line2 || "#efe9dd") +
    ";--accent:" + A + ";--accent2:" + A2 + ";--accent3:" + A3 + ";--onAccent:" + (SK.onAccent || "#fffdf8") + "}";

  var css = root +
    ".hn{position:fixed;top:0;left:0;bottom:0;width:248px;background:var(--cream);border-right:1px solid var(--line);z-index:1200;display:flex;flex-direction:column;padding:18px 14px;transform:translateX(-100%);transition:transform .26s ease;overflow-y:auto;font-family:'Inter',system-ui,sans-serif}" +
    "body.hn-open .hn{transform:none}body{transition:padding-left .26s ease}body.hn-open{padding-left:248px}" +
    "@media(max-width:900px){body.hn-open{padding-left:0}.hn{box-shadow:0 0 44px rgba(0,0,0,.25)}}" +
    ".hn-top{display:flex;align-items:center;gap:9px;margin-bottom:6px}" +
    ".hn-logo{flex:1;display:flex;align-items:center;gap:9px;text-decoration:none;color:var(--ink)}.hn-mark{width:34px;height:34px;flex:none;border-radius:8px;object-fit:contain;background:var(--accent);display:grid;place-items:center;color:var(--onAccent);font-weight:800;font-family:Georgia,serif}" +
    ".hn-word{font-family:Georgia,serif;font-weight:800;font-size:19px;letter-spacing:-.01em;line-height:1}.hn-ver{display:block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--mut);margin-top:3px}" +
    ".hn-collapse{background:rgba(0,0,0,.05);border:1px solid var(--line);color:var(--mut);width:30px;height:30px;border-radius:8px;font-size:17px;cursor:pointer;flex:none}" +
    ".hn-tag{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--mut);margin:2px 2px 10px}" +
    ".hn-links{display:flex;flex-direction:column;gap:2px}" +
    ".hn-dept{font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--mut);margin:12px 2px 4px;padding-top:10px;border-top:1px solid var(--line)}.hn-dept.first{margin-top:2px;padding-top:0;border-top:none}" +
    ".hn-link{display:flex;align-items:center;gap:11px;padding:9px 11px;border-radius:9px;color:var(--ink2);text-decoration:none;font-size:14px;transition:background .14s,color .14s}" +
    ".hn-link:hover{background:rgba(0,0,0,.05);color:var(--ink)}" +
    ".hn-link.active{background:rgba(0,0,0,.05);color:var(--accent);box-shadow:inset 3px 0 0 var(--accent);font-weight:600}" +
    ".hn-ic{font-size:16px;width:20px;text-align:center;flex:none}" +
    ".hn-foot{margin-top:auto;padding-top:14px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:9px}" +
    ".hn-who{font-size:12px;color:var(--mut);line-height:1.5}.hn-who b{color:var(--accent)}" +
    ".hn-acts{display:flex;gap:8px}.hn-acts a{flex:1;text-align:center;font-size:12px;padding:8px;border-radius:8px;text-decoration:none;border:1px solid var(--line);color:var(--ink2);cursor:pointer}.hn-acts a:hover{background:rgba(0,0,0,.04)}" +
    ".hn-openbtn{position:fixed;top:13px;left:13px;z-index:1201;width:44px;height:44px;border-radius:11px;background:var(--card);border:1px solid var(--line);color:var(--ink);font-size:19px;cursor:pointer;display:none;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,.14)}" +
    "body:not(.hn-open) .hn-openbtn{display:flex}" +
    ".hn-hdr{background:linear-gradient(180deg,var(--accent),var(--accent2));color:var(--onAccent);padding:12px 0;position:sticky;top:0;z-index:30;box-shadow:0 3px 14px rgba(0,0,0,.12)}" +
    ".hn-hb{max-width:1180px;margin:0 auto;padding:0 16px;display:flex;align-items:center;gap:12px}" +
    ".hn-htitle{font-family:Georgia,serif;font-weight:700;font-size:19px;line-height:1.1}.hn-hsub{font-size:11px;opacity:.85;margin-top:2px}.hn-hsp{flex:1}" +
    ".hn-hrole{font-size:11px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.28);padding:5px 10px;border-radius:99px}.hn-hrole:empty{display:none}" +
    "@media(max-width:900px){.hn-hb{padding-left:60px}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var logoImg = BR.logo ? ('<img class="hn-mark" src="' + esc(BR.logo) + '" alt="" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'hn-mark\',textContent:\'' + esc((BR.short || "H")[0]) + '\'}))">') : ('<span class="hn-mark">' + esc((BR.short || "H")[0]) + '</span>');
  var aside = document.createElement("aside");
  aside.className = "hn"; aside.setAttribute("aria-label", "Navigation");
  aside.innerHTML =
    '<div class="hn-top"><a class="hn-logo" href="/hub.html' + S + '">' + logoImg + '<span class="hn-word">' + esc(BR.short || BR.name) + (BR.version ? '<small class="hn-ver">' + esc(BR.version) + '</small>' : '') + '</span></a>' +
    '<button class="hn-collapse" onclick="hubToggle()" title="Collapse">&lsaquo;</button></div>' +
    '<div class="hn-tag">' + esc(BR.tagline || "") + '</div>' +
    '<nav class="hn-links" id="hnLinks"></nav>' +
    '<div class="hn-foot"><div class="hn-who" id="hnWho">Loading…</div>' +
    '<div class="hn-acts"><a href="/signin.html">Switch role</a><a id="hnOut">Sign out</a></div></div>';
  var openBtn = document.createElement("button");
  openBtn.className = "hn-openbtn"; openBtn.setAttribute("aria-label", "Open menu"); openBtn.innerHTML = "&#9776;"; openBtn.onclick = function () { window.hubToggle(); };

  function mount() { document.body.appendChild(aside); document.body.appendChild(openBtn); }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);

  window.hubToggle = function () { document.body.classList.toggle("hn-open"); };
  // open by default on wide screens
  if (window.innerWidth > 900) document.body.classList.add("hn-open");

  function renderLinks(keys) {
    var here = curKey(), html = "", first = true;
    DEPTS.forEach(function (d) {
      var items = (d.keys || []).filter(function (k) { return keys.indexOf(k) >= 0; }).map(function (k) { return SECTIONS.filter(function (s) { return s.k === k; })[0]; }).filter(Boolean);
      if (!items.length) return;
      if (d.name) { html += '<div class="hn-dept' + (first ? " first" : "") + '">' + esc(d.name) + "</div>"; }
      items.forEach(function (s) { html += '<a class="hn-link' + (s.k === here ? " active" : "") + '" href="' + s.href + S + '"><span class="hn-ic">' + (s.ic || "•") + "</span>" + esc(s.label) + "</a>"; });
      first = false;
    });
    document.getElementById("hnLinks").innerHTML = html;
  }

  window.hubWho.then(function (w) {
    var roles = (w && (w.roles || (w.role ? [w.role] : []))) || [];
    var name = (w && w.name) || "";
    renderLinks(allowed(roles));
    var pr = roles.map(function (r) { return PRETTY[r] || r; }).join(" · ") || "Guest";
    var wl = document.getElementById("hnWho"); if (wl) wl.innerHTML = (name ? "<b>" + esc(name) + "</b><br>" : "") + esc(pr);
    var role = roles[0] || "guest";
    var hr = document.getElementById("hnHdrRole"); if (hr) hr.textContent = PRETTY[role] || role;
    var out = document.getElementById("hnOut"); if (out) out.onclick = function () { try { localStorage.removeItem("hub_sess"); } catch (e) {} location.href = "/signin.html"; };
  });

  // ---- inject the header on any page without its own <header> ----
  (function () {
    function buildHdr() {
      if (document.querySelector("header")) return;
      var sec = curSec();
      var ebEl = document.querySelector(".eyebrow"), h1El = document.querySelector("h1");
      var title = sec ? (sec.ic + " " + sec.label) : ((h1El && h1El.textContent.trim()) || BR.name);
      var sub = ((ebEl && ebEl.textContent.trim()) || BR.name) + (BR.version ? " \u00b7 " + BR.version : "");
      var hdr = document.createElement("header"); hdr.className = "hn-hdr";
      hdr.innerHTML = '<div class="hn-hb"><div><div class="hn-htitle">' + esc(title) + '</div><div class="hn-hsub">' + esc(sub) + '</div></div><div class="hn-hsp"></div><span class="hn-hrole" id="hnHdrRole"></span></div>';
      document.body.insertBefore(hdr, document.body.firstChild);
      if (ebEl) ebEl.style.display = "none";
      if (h1El && sec && h1El.textContent.trim().toLowerCase() === sec.label.toLowerCase()) h1El.style.display = "none";
    }
    if (document.body) buildHdr(); else document.addEventListener("DOMContentLoaded", buildHdr);
  })();
})();

/* AE OS icon system — additive loader. */
;(function(){try{if(document.getElementById("ae-icons-js"))return;var s=document.createElement("script");s.id="ae-icons-js";s.src="https://aexperiences.studio/aehub-icons.js";s.defer=true;(document.head||document.documentElement).appendChild(s);}catch(e){}})();
