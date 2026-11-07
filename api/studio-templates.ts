// /api/studio-templates: the signed-in user's generated templates.
//   GET                      → { templates: [...] } (newest first)
//   GET ?id=                 → { template, versions }
//   POST { id, restore: n }  → { template } (restores version n as a new version)
//   DELETE ?id=              → { ok: true }
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserId } from "./_auth.js";
import { deleteTemplate, getSnapshot, getTemplate, listTemplates, listVersions, saveVersion } from "./_studio/db.js";

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

export default makeHandler(getUserId);
