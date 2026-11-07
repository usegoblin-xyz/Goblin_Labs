// /api/studio: template generation and saved templates in one function,
// to stay inside the Hobby plan's 12 serverless functions.
//   ?op=generate   POST, see api/_studio/generate.ts
//   ?op=templates  GET / POST / DELETE, see api/_studio/templates.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserId } from "./_auth.js";
import { callClaude } from "./_studio/claude.js";
import { makeHandler as makeGenerate } from "./_studio/generate.js";
import { makeHandler as makeTemplates } from "./_studio/templates.js";

const generate = makeGenerate({ call: callClaude, userId: getUserId });
const templates = makeTemplates(getUserId);

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.query.op === "generate") return generate(req, res);
  if (req.query.op === "templates") return templates(req, res);
  return res.status(404).json({ error: "Not found" });
}
