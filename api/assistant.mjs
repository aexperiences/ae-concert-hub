// HUB CORE — the shared AI assistant. DeepSeek (deepseek-chat). Persona comes from the
// tenant config; the honesty rule is enforced here no matter what. Signed-in only.
// DeepSeek is the default brain — only reach for a vision model if the task must "see".
// Accelerated Experiences, LLC.

const KV_URL   = process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL   || "";
const KV_TOK   = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const DEEPSEEK = process.env.DEEPSEEK_API_KEY   || "";
const configured = !!(KV_URL && KV_TOK);

async function kvGet(k) { const r = await fetch(`${KV_URL}/get/${encodeURIComponent(k)}`, { headers: { Authorization: `Bearer ${KV_TOK}` } }); return (await r.json()).result; }
async function roleOf(t) { if (!t || !configured) return "guest"; let raw = null; try { raw = await kvGet("hub:sess:" + t); } catch (_) {} if (!raw) return "guest"; const s = String(raw), i = s.indexOf("|"); return i >= 0 ? s.slice(0, i) : "guest"; }
const clean = (s, n) => String(s == null ? "" : s).slice(0, n || 4000);

const HONESTY = " Ground every answer in the real data you are given. NEVER invent facts — names, dates, numbers, prices, quotes. If you don't know or weren't given it, say so or say 'verify'. Be warm, concise, and useful.";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ ok: false, error: "POST only" }); return; }

  let body = req.body; if (typeof body === "string") { try { body = JSON.parse(body); } catch (_) { body = {}; } } body = body || {};
  const role = await roleOf(body.sess || "");
  if (role === "guest") { res.status(401).json({ ok: false, error: "AUTH", message: "Sign in to use the assistant." }); return; }
  if (!DEEPSEEK) { res.status(200).json({ ok: false, reason: "no_ai", message: "Add DEEPSEEK_API_KEY to wake the assistant." }); return; }

  const brand   = clean(body.brand, 80) || "this OS";
  const persona = (clean(body.persona, 700) || ("You are the AI assistant for " + brand + ".")).replace(/\{BRAND\}/g, brand);
  const section = clean(body.section, 40);
  const prompt  = clean(body.prompt, 1200);
  const context = body.context ? clean(typeof body.context === "string" ? body.context : JSON.stringify(body.context), 3000) : "";
  if (!prompt) { res.status(400).json({ ok: false, message: "Tell me what you need." }); return; }

  const system = persona + HONESTY + (section ? (" The user is on the '" + section + "' screen.") : "");
  const user = (context ? ("Context (the real data):\n" + context + "\n\n") : "") + prompt;

  try {
    const r = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${DEEPSEEK}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "deepseek-chat", temperature: 0.6, max_tokens: 1400, messages: [{ role: "system", content: system }, { role: "user", content: user }] })
    });
    const j = await r.json();
    const text = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    if (!text) { res.status(200).json({ ok: false, message: "No answer came back — try again." }); return; }
    res.status(200).json({ ok: true, text: String(text).slice(0, 6000) });
  } catch (_) {
    res.status(200).json({ ok: false, message: "The assistant hit a snag — try again." });
  }
}
