// HUB — real-time seat HOLDS service (box office). Per-seat KV locks with a TTL so two
// clerks can't sell the same seat. Key: hold:<perfId>:<seat> = "<by>|<untilMs>" (EX ttl).
// Sold seats are NOT here — those live in the `sales` collection (the data spine). This is
// only the ephemeral hold layer. Env-gated: without KV it returns NOKV and the client falls
// back to seeded/local holds for the demo. Accelerated Experiences, LLC.

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const KV_TOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const configured = !!(KV_URL && KV_TOK);
const DEFAULT_TTL = 8 * 60; // seconds

const clean = (s, n) => String(s == null ? "" : s).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, n || 48);
function hk(perf, seat) { return "hold:" + clean(perf, 48) + ":" + clean(seat, 48); }
async function kvGET(cmdPath) { const r = await fetch(`${KV_URL}/${cmdPath}`, { headers: { Authorization: `Bearer ${KV_TOK}` } }); return r.json(); }

async function listHolds(perf) {
  const pattern = "hold:" + clean(perf, 48) + ":*";
  let cursor = "0", keys = [], guard = 0;
  do {
    const j = await kvGET(`scan/${cursor}/match/${encodeURIComponent(pattern)}/count/1000`);
    const res = j && j.result; if (!res) break;
    cursor = String(res[0]); (res[1] || []).forEach((k) => keys.push(k));
  } while (cursor !== "0" && ++guard < 20);
  const holds = [];
  for (const k of keys) {
    const j = await kvGET(`get/${encodeURIComponent(k)}`); const v = j && j.result; if (!v) continue;
    const i = String(v).indexOf("|"); const by = i >= 0 ? String(v).slice(0, i) : String(v); const until = i >= 0 ? +String(v).slice(i + 1) : 0;
    if (until && until < Date.now()) continue; // expired (belt-and-suspenders; EX should have removed it)
    holds.push({ seat: k.slice(k.lastIndexOf(":") + 1), by, until });
  }
  return holds;
}
async function setNX(perf, seat, by, ttl, untilMs) {
  const key = hk(perf, seat), val = encodeURIComponent(by + "|" + untilMs);
  const j = await kvGET(`set/${encodeURIComponent(key)}/${val}?NX=true&EX=${ttl}`);
  if (j && j.result === "OK") return "held";
  const cur = await kvGET(`get/${encodeURIComponent(key)}`); const v = cur && cur.result || "";
  const owner = String(v).split("|")[0];
  if (owner === by) { await kvGET(`set/${encodeURIComponent(key)}/${val}?EX=${ttl}`); return "held"; } // refresh my own hold
  return "rejected";
}
async function releaseOwn(perf, seat, by) {
  const key = hk(perf, seat); const cur = await kvGET(`get/${encodeURIComponent(key)}`); const v = cur && cur.result || "";
  if (String(v).split("|")[0] === by) { await kvGET(`del/${encodeURIComponent(key)}`); return true; }
  return false;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ ok: false, error: "POST only" }); return; }
  if (!configured) { res.status(200).json({ ok: false, error: "NOKV", message: "Add KV_REST_API_URL + KV_REST_API_TOKEN to enable real-time seat holds." }); return; }

  let body = req.body; if (typeof body === "string") { try { body = JSON.parse(body); } catch (_) { body = {}; } } body = body || {};
  const action = body.action || "holds";
  const perf = clean(body.perfId, 48);
  const by = clean(body.by, 48) || "anon";
  const ttl = Math.min(3600, Math.max(30, +body.ttl || DEFAULT_TTL));
  const seats = Array.isArray(body.seats) ? body.seats.slice(0, 60) : [];
  if (!perf) { res.status(400).json({ ok: false, error: "NO_PERF" }); return; }

  try {
    if (action === "holds") { res.status(200).json({ ok: true, holds: await listHolds(perf) }); return; }
    if (action === "hold") {
      const until = Date.now() + ttl * 1000, held = [], rejected = [];
      for (const s of seats) { const r = await setNX(perf, s, by, ttl, until); (r === "held" ? held : rejected).push(s); }
      res.status(200).json({ ok: true, held, rejected, until }); return;
    }
    if (action === "release") {
      for (const s of seats) { await releaseOwn(perf, s, by); }
      res.status(200).json({ ok: true, released: seats.length }); return;
    }
    res.status(400).json({ ok: false, error: "UNKNOWN_ACTION" });
  } catch (_) { res.status(200).json({ ok: false, error: "KV_ERROR", message: "Hold service hiccup — try again." }); }
}
