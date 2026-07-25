// HUB CORE — the data spine. Generic CRUD over KV collections: hub:col:<name> = JSON array
// of records {id, createdAt, updatedAt, ...}. Your vertical's "one true object" (projects,
// listings, commissions…) is just a collection. Reads need a session; writes need a
// non-guest role. Accelerated Experiences, LLC.

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const KV_TOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const configured = !!(KV_URL && KV_TOK);

async function kvGet(k) { const r = await fetch(`${KV_URL}/get/${encodeURIComponent(k)}`, { headers: { Authorization: `Bearer ${KV_TOK}` } }); return (await r.json()).result; }
async function kvSet(k, v) { await fetch(`${KV_URL}/set/${encodeURIComponent(k)}`, { method: "POST", headers: { Authorization: `Bearer ${KV_TOK}`, "Content-Type": "text/plain" }, body: v }); }
async function roleOf(t) { if (!t || !configured) return "guest"; let raw = null; try { raw = await kvGet("hub:sess:" + t); } catch (_) {} if (!raw) return "guest"; const s = String(raw), i = s.indexOf("|"); return i >= 0 ? s.slice(0, i) : "guest"; }

const clean = (s, n) => String(s == null ? "" : s).replace(/[^a-z0-9_-]/gi, "").slice(0, n || 40);
const id = () => (Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
async function loadCol(name) { let a = null; try { const raw = await kvGet("hub:col:" + name); if (raw) a = JSON.parse(raw); } catch (_) {} return Array.isArray(a) ? a : []; }
async function saveCol(name, arr) { await kvSet("hub:col:" + name, JSON.stringify(arr.slice(0, 5000))); }

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (!configured) { res.status(200).json({ ok: false, error: "NOKV", message: "Add KV_REST_API_URL + KV_REST_API_TOKEN." }); return; }

  const q = req.query || {};
  let body = {};
  if (req.method === "POST") { body = req.body; if (typeof body === "string") { try { body = JSON.parse(body); } catch (_) { body = {}; } } body = body || {}; }
  const doo = body.action || q.do || "list";
  const col = clean(body.collection || q.collection, 40);
  const token = body.sess || q.sess || "";
  const role = await roleOf(token);
  if (role === "guest") { res.status(401).json({ ok: false, error: "AUTH", message: "Sign in to use the data spine." }); return; }
  if (!col) { res.status(400).json({ ok: false, error: "NO_COLLECTION" }); return; }

  // reads
  if (doo === "list") { const arr = await loadCol(col); res.status(200).json({ ok: true, records: arr, count: arr.length }); return; }
  if (doo === "get") { const arr = await loadCol(col); const r = arr.find((x) => x.id === clean(body.id || q.id, 20)); res.status(200).json({ ok: !!r, record: r || null }); return; }

  // writes — non-guest already enforced above
  if (doo === "save") {
    const rec = (body.record && typeof body.record === "object") ? body.record : {};
    const arr = await loadCol(col); const now = new Date().toISOString();
    let rid = clean(rec.id, 20); const i = rid ? arr.findIndex((x) => x.id === rid) : -1;
    if (i >= 0) { arr[i] = Object.assign({}, arr[i], rec, { id: rid, updatedAt: now }); }
    else if (rid) { arr.push(Object.assign({}, rec, { id: rid, createdAt: now, updatedAt: now })); } // upsert: honor a caller-supplied id (e.g. compliance keyed to the listing id)
    else { rid = id(); arr.push(Object.assign({}, rec, { id: rid, createdAt: now, updatedAt: now })); }
    await saveCol(col, arr);
    res.status(200).json({ ok: true, id: rid, total: arr.length }); return;
  }
  if (doo === "delete") {
    const rid = clean(body.id || q.id, 20); let arr = await loadCol(col); const before = arr.length;
    arr = arr.filter((x) => x.id !== rid); if (arr.length === before) { res.status(404).json({ ok: false }); return; }
    await saveCol(col, arr); res.status(200).json({ ok: true, total: arr.length }); return;
  }
  res.status(400).json({ ok: false, error: "UNKNOWN_ACTION" });
}
