// POST /api/studio?op=generate: create a template from a prompt, change one
// with a follow-up prompt, or fix one after the preview reports an error.
//
// Body: { mode: "create", prompt, aspect }
//     | { mode: "edit", id, instruction }
//     | { mode: "repair", id, error }
// Streams newline-delimited JSON events (see api/_studio/pipeline.ts), ending
// with { type: "done", template } or { type: "error", message, problems? }.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserId } from "../_auth.js";
import { callClaude, MODEL, type CallClaude } from "./claude.js";
import { createTemplate, getTemplate, logGeneration, recentRepairs, saveVersion, usedToday, type StudioTemplate } from "./db.js";
import { ASPECTS, runJob, type Aspect, type Job } from "./pipeline.js";

export const DAILY_LIMIT = Number(process.env.STUDIO_DAILY_LIMIT || 20);
const MAX_PROMPT = 1200;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Exposed for tests: the handler with the Claude call and auth swappable.
export function makeHandler(deps: { call: CallClaude; userId: (req: VercelRequest) => Promise<string | null>; configured?: () => boolean }) {
  const configured = deps.configured ?? (() => !!process.env.ANTHROPIC_API_KEY || deps.call !== callClaude);
  return async function handler(req: VercelRequest, res: VercelResponse) {
    try {
      await handle(req, res);
    } catch (e) {
      // Anything before streaming starts (bad JSON, database down) gets a clean error.
      console.error("studio generate failed early", (e as Error).message);
      if (!res.headersSent) res.status(500).json({ error: "Something went wrong. Try again in a moment." });
      else res.end();
    }
  };

  async function handle(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    if (!configured()) {
      return res.status(503).json({ error: "Template generation isn't switched on yet." });
    }
    const userId = await deps.userId(req);
    if (!userId) return res.status(401).json({ error: "Sign in to create templates." });

    const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body) ?? {};
    const mode = body.mode;
    let job: Job;
    let templateId: string | null = null;
    let label: string;

    if (mode === "create") {
      const prompt = str(body.prompt, MAX_PROMPT);
      const aspect = (Object.keys(ASPECTS).includes(body.aspect) ? body.aspect : "16:9") as Aspect;
      if (prompt.length < 8) return res.status(400).json({ error: "Describe the video in a sentence or two." });
      job = { mode, prompt, aspect };
      label = prompt;
    } else if (mode === "edit" || mode === "repair") {
      const current = await getTemplate(userId, str(body.id, 40));
      if (!current) return res.status(404).json({ error: "Template not found." });
      templateId = current.id;
      const instruction = str(mode === "edit" ? body.instruction : body.error, MAX_PROMPT);
      if (!instruction) return res.status(400).json({ error: mode === "edit" ? "Say what to change." : "Missing error." });
      if (mode === "repair" && (await recentRepairs(userId, current.id)) >= 3) {
        return res.status(429).json({ error: "This template keeps failing in the preview. Try describing it differently." });
      }
      job = { mode, current, instruction };
      label = mode === "edit" ? instruction : `Automatic fix: ${instruction.slice(0, 200)}`;
    } else {
      return res.status(400).json({ error: "Unknown mode." });
    }

    // Repairs are free; creating and editing count toward the daily limit.
    if (mode !== "repair") {
      const used = await usedToday(userId);
      if (used >= DAILY_LIMIT) {
        return res.status(429).json({ error: `You've used all ${DAILY_LIMIT} generations for today. Try again tomorrow.` });
      }
    }

    res.statusCode = 200;
    res.setHeader("content-type", "application/x-ndjson; charset=utf-8");
    res.setHeader("cache-control", "no-store");
    res.setHeader("x-accel-buffering", "no");
    const send = (e: object) => res.write(JSON.stringify(e) + "\n");
    let lastChars = 0;

    try {
      const out = await runJob(job, deps.call, (e) => {
        // Throttle progress to about one event per 400 characters.
        if (e.type === "progress") {
          if (e.chars - lastChars < 400) return;
          lastChars = e.chars;
        }
        send(e);
      });
      let saved: StudioTemplate | null = null;
      if (out.snapshot) {
        saved = job.mode === "create" ? await createTemplate(userId, job.prompt, out.snapshot) : await saveVersion(userId, templateId!, label, out.snapshot);
        templateId = saved?.id ?? templateId;
      }
      // Log each Claude call: the first under the request's kind, follow-ups as fixes.
      for (const [i, c] of out.calls.entries()) {
        await logGeneration({ userId, templateId, kind: i === 0 ? mode : "fix", model: MODEL, ok: c.ok, error: c.error, ...c.usage, ms: c.ms });
      }
      if (saved) send({ type: "done", template: saved });
      else send({ type: "error", message: out.refused ? "Claude declined this request. Try describing the video differently." : "Couldn't produce a working template this time. Try rephrasing the prompt.", problems: out.problems });
    } catch (e) {
      console.error("studio-generate failed", (e as Error).message);
      await logGeneration({ userId, templateId, kind: mode, model: MODEL, ok: false, error: (e as Error).message, inputTokens: 0, outputTokens: 0, cacheRead: 0, cacheWrite: 0, ms: 0 });
      send({ type: "error", message: "Generation failed. Try again in a moment." });
    }
    res.end();
  }
}

