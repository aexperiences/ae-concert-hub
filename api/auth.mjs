// HUB CORE — sign-in + whoami. Session token in KV: hub:sess:<token> = "role|name".
// Admin passcode is env-gated (HUB_ADMIN_PASS). If it's UNSET, admin is OPEN so you can
// explore the hub before you harden it — set the env var when you go live with real data.
// Never handles real credentials/payment. Accelerated Experiences, LLC.

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const KV_TOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const ADMIN_PASS = process.env.HUB_ADMIN_PASS || "";
const configured = !!(KV_URL && KV_TOK);
const TTL = 60 * 60 * 12; // 12h

async function kvGet(k) { const r = await fetch(`${KV_URL}/get/${encodeURIComponent(k)}`, { headers: { Authorization: `Bearer ${KV_TOK}` } }); return (await r.json()).result; }
async function kvSetEx(k, v, ttl) { await fetch(`${KV_URL}/set/${encodeURIComponent(k)}/${encodeURIComponent(v)}?EX=${ttl}`, { method: "POST", headers: { Authorization: `Bearer ${KV_TOK}` } }); }
const clean = (s, n) => String(s == null ? "" : s).replace(/[|<>]/g, "").trim().slice(0, n || 60);
const token = () => (Date.now().toString(36) + Math.random().toString(36).slice(2, 12));

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const q = req.query || {};
  // ---- whoami (public) ----
  if ((q.do || "") === "whoami") {
    const t = q.t || "";
    if (!t || !configured) { res.status(200).json({ roles: ["guest"], role: "guest", name: "" }); return; }
    let raw = null; try { raw = await kvGet("hub:sess:" + t); } catch (_) {}
    if (!raw) { res.status(200).json({ roles: ["guest"], role: "guest", name: "" }); return; }
    const s = String(raw), i = s.indexOf("|");
    const role = i >= 0 ? s.slice(0, i) : "guest", name = i >= 0 ? s.slice(i + 1) : "";
    res.status(200).json({ roles: [role], role, name });
    return;
  }

  if (req.method !== "POST") { res.status(405).json({ ok: false, error: "POST only" }); return; }
  let body = req.body; if (typeof body === "string") { try { body = JSON.parse(body); } catch (_) { body = {}; } } body = body || {};

  if (body.action === "signin") {
    const role = clean(body.role, 30) || "member";
    const name = clean(body.name, 60);
    if (role === "admin" && ADMIN_PASS && String(body.pass || "") !== ADMIN_PASS) {
      res.status(200).json({ ok: false, error: "PASS", message: "Wrong administrator passcode." }); return;
    }
    if (!configured) { res.status(200).json({ ok: false, error: "NOKV", message: "Add KV_REST_API_URL + KV_REST_API_TOKEN to enable sign-in." }); return; }
    const t = token();
    try { await kvSetEx("hub:sess:" + t, role + "|" + name, TTL); } catch (_) { res.status(200).json({ ok: false, message: "Could not start a session." }); return; }
    res.status(200).json({ ok: true, token: t, role, name });
    return;
  }
  res.status(400).json({ ok: false, error: "UNKNOWN_ACTION" });
}
