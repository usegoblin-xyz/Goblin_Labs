// /api/studio?op=templates: the signed-in user's generated templates.
//   GET                      → { templates: [...] } (newest first)
//   GET ?id=                 → { template, versions }
//   POST { id, restore: n }  → { template } (restores version n as a new version)
//   PATCH { id, defaults }   → { template } (saves edits made in the panel:
//                              text, photos, clips and music settings)
//   DELETE ?id=              → { ok: true }
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserId } from "../_auth.js";
import { db, deleteTemplate, getSnapshot, getTemplate, listTemplates, listVersions, saveVersion } from "./db.js";

export function makeHandler(userIdOf: (req: VercelRequest) => Promise<string | null>) {
  return async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("cache-control", "no-store");
    const userId = await userIdOf(req);
    if (!userId) return res.status(401).json({ error: "Sign in to see your templates." });
    const id = typeof req.query.id === "string" ? req.query.id : "";

    try {
      if (req.method === "GET") {
        if (!id) return res.status(200).json({ templates: await listTemplates(userId) });
        const template = await getTemplate(userId, id);
        if (!template) return res.status(404).json({ error: "Template not found." });
        return res.status(200).json({ template, versions: await listVersions(id) });
      }
      if (req.method === "POST") {
        const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body) ?? {};
        const current = await getTemplate(userId, String(body.id ?? ""));
        const n = Number(body.restore);
        if (!current || !Number.isInteger(n)) return res.status(404).json({ error: "Template not found." });
        const snap = await getSnapshot(current.id, n);
        if (!snap) return res.status(404).json({ error: "Version not found." });
        const template = await saveVersion(userId, current.id, `Restored version ${n}`, snap);
        return res.status(200).json({ template, versions: await listVersions(current.id) });
      }
      if (req.method === "PATCH") {
        const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body) ?? {};
        const current = await getTemplate(userId, String(body.id ?? ""));
        if (!current) return res.status(404).json({ error: "Template not found." });
        const given = body.defaults && typeof body.defaults === "object" ? (body.defaults as Record<string, unknown>) : {};
        // Only the template's own fields, as strings.
        const defaults = Object.fromEntries(current.fields.map((f) => [f.key, typeof given[f.key] === "string" ? (given[f.key] as string).slice(0, 2000) : current.defaults[f.key] ?? ""]));
        await db().query(`update studio.templates set defaults = $3, updated_at = now() where user_id = $1 and id = $2`, [userId, current.id, JSON.stringify(defaults)]);
        return res.status(200).json({ template: { ...current, defaults } });
      }
      if (req.method === "DELETE") {
        const ok = await deleteTemplate(userId, id);
        return ok ? res.status(200).json({ ok: true }) : res.status(404).json({ error: "Template not found." });
      }
      return res.status(405).json({ error: "Method not allowed" });
    } catch (e) {
      console.error("studio-templates failed", (e as Error).message);
      return res.status(500).json({ error: "Something went wrong. Try again in a moment." });
    }
  };
}

