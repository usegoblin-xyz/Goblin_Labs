// POST /api/subscribe: the footer "Stay updated" form.
// Saves the email in Postgres (newsletter.subscribers, the system of record),
// then forwards it to the Goblin Substack so the person gets the newsletter
// and Substack's welcome email. Substack has no official subscribe API, so
// the forward is best-effort: its outcome is stored per row, and anything
// that failed can be imported into Substack by hand later.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import pg from "pg";
import { getUserId } from "./_auth.js";

const SUBSTACK = process.env.SUBSTACK_URL || "https://goblinlabs.substack.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

let pool: pg.Pool | null = null;
const db = () =>
  (pool ??= new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2, ssl: { rejectUnauthorized: false } }));

const str = (v: unknown, max = 200) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

async function forwardToSubstack(email: string, page: string) {
  try {
    const r = await fetch(`${SUBSTACK}/api/v1/free?nojs=true`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: SUBSTACK, referer: `${SUBSTACK}/` },
      body: JSON.stringify({ email, first_url: page, current_url: page, source: "embed" }),
      signal: AbortSignal.timeout(6000),
    });
    return { status: r.ok ? "subscribed" : "failed", detail: `HTTP ${r.status}` };
  } catch (e) {
    return { status: "failed", detail: String((e as Error).message || e).slice(0, 200) };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body) ?? {};

  // Honeypot: a hidden field real people never fill. Pretend it worked.
  if (str(body.website)) return res.status(200).json({ ok: true });

  const email = str(body.email, 254)?.toLowerCase();
  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: "Enter a valid email address." });

  const source = str(body.source, 60) ?? "footer";
  const page = str(body.page, 500) ?? "https://www.usegoblin.xyz/";
  const utm = body.utm && typeof body.utm === "object" ? JSON.stringify(body.utm).slice(0, 1000) : null;
  const userId = await getUserId(req).catch(() => null);

  try {
    const { rows } = await db().query(
      `insert into newsletter.subscribers (email, source, utm, user_id)
       values ($1, $2, $3::jsonb, $4)
       on conflict (email) do update set updated_at = now(), user_id = coalesce(newsletter.subscribers.user_id, excluded.user_id)
       returning id, substack_status`,
      [email, source, utm, userId],
    );
    const row = rows[0] as { id: number; substack_status: string };
    // The browser also submits to Substack (see NewsletterSignup); this
    // server-side try is a backup and is often refused with a 403.
    if (row.substack_status !== "subscribed") {
      const sub = await forwardToSubstack(email, page);
      await db().query(
        `update newsletter.subscribers set substack_status = $2, substack_detail = $3, updated_at = now() where id = $1`,
        [row.id, sub.status, sub.detail],
      );
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("subscribe failed", (e as Error).message);
    return res.status(500).json({ error: "Something went wrong. Try again in a moment." });
  }
}
