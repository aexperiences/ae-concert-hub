/* OS data layer — generic + config-driven. KV-first (the Core spine, /api/data) with an
   instant localStorage demo fallback seeded from window.HUB_CONFIG.seed, version-stamped so
   cached demo browsers refresh when the seed changes. Collections come from HUB_CONFIG.
   One data layer, any vertical. Accelerated Experiences, LLC. */
window.HUBDATA = (function () {
  var C = window.HUB_CONFIG || {};
  var SESS = (new URLSearchParams(location.search).get("sess")) || (function () { try { return localStorage.getItem("hub_sess") || ""; } catch (e) { return ""; } })();
  var NS = (C.tenant || "hub");
  var SEED = C.seed || {};
  var VER = C.seedVersion || "v1";

  function lkey(c) { return NS + ":" + c; }
  function seedIfEmpty() {
    try {
      if (localStorage.getItem(NS + ":seed_version") !== VER) {
        Object.keys(SEED).forEach(function (c) { localStorage.setItem(lkey(c), JSON.stringify(SEED[c])); });
        localStorage.setItem(NS + ":seed_version", VER);
        return;
      }
      Object.keys(SEED).forEach(function (c) { if (!localStorage.getItem(lkey(c))) localStorage.setItem(lkey(c), JSON.stringify(SEED[c])); });
    } catch (e) {}
  }
  function lget(c) { try { return JSON.parse(localStorage.getItem(lkey(c)) || "[]"); } catch (e) { return []; } }
  function lset(c, a) { try { localStorage.setItem(lkey(c), JSON.stringify(a)); } catch (e) {} }

  async function api(action, body) {
    return fetch("/api/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.assign({ action: action, sess: SESS }, body)) }).then(function (r) { return r.json(); });
  }
  async function list(c) {
    try { var j = await api("list", { collection: c }); if (j && j.ok) { lset(c, j.records); return j.records; } } catch (e) {}
    seedIfEmpty(); return lget(c);
  }
  async function save(c, rec) {
    try { var j = await api("save", { collection: c, record: rec }); if (j && j.ok) return j; } catch (e) {}
    var a = lget(c), now = new Date().toISOString();
    if (!rec.id) { rec.id = "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); rec.createdAt = now; rec.updatedAt = now; a.push(rec); }
    else { var i = a.findIndex(function (x) { return x.id === rec.id; }); rec.updatedAt = now; if (i >= 0) a[i] = Object.assign({}, a[i], rec); else a.push(rec); }
    lset(c, a); return { ok: true, id: rec.id, local: true };
  }
  async function del(c, id) {
    try { var j = await api("delete", { collection: c, id: id }); if (j && j.ok) return j; } catch (e) {}
    lset(c, lget(c).filter(function (x) { return x.id !== id; })); return { ok: true, local: true };
  }
  return { list: list, save: save, del: del, SESS: SESS, CFG: C };
})();
