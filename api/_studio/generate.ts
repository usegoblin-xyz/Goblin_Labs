// POST /api/studio?op=generate: create a template from a prompt, change one
// with a follow-up prompt, or fix one after the preview reports an error.
//
// Body: { mode: "create", prompt, aspect, media? }
//     | { mode: "edit", id, instruction, media? }   (media: refs to the caller's uploads)
//     | { mode: "repair", id, error }
// Streams newline-delimited JSON events (see api/_studio/pipeline.ts), ending
// with { type: "done", template } or { type: "error", message, problems? }.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserId } from "../_auth.js";
import { callClaude, MODEL, type CallClaude } from "./claude.js";
import { createTemplate, getTemplate, logGeneration, recentRepairs, saveVersion, usedToday, type StudioTemplate } from "./db.js";
import { ASPECTS, runJob, type Aspect, type Attachment, type Job } from "./pipeline.js";
import { blocks as refBlocks, loadAttachments } from "./refs.js";
import { loadRemake, remakeSpec, MAX_REMAKE_SECONDS } from "./replicate.js";
import { agentApi, type AgentApi } from "./agent.js";

export const DAILY_LIMIT = Number(process.env.STUDIO_DAILY_LIMIT || 20);
const MAX_PROMPT = 1200;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Exposed for tests: the handler with the Claude call and auth swappable.
export function makeHandler(deps: { call: CallClaude; userId: (req: VercelRequest) => Promise<string | null>; configured?: () => boolean; agent?: AgentApi }) {
  const agent = deps.agent ?? agentApi;
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

    // Photos, clips, music and documents attached to this request: only the
    // caller's own. Pictures and documents are shown to Claude.
    const media: Attachment[] = mode === "repair" ? [] : await loadAttachments(userId, body.media, 8);
    // Same budget as the chat: at most two documents in full.
    const docs = media.filter((m) => m.kind === "doc");
    if (docs.length > 2) media.splice(0, media.length, ...media.filter((m) => m.kind !== "doc" || docs.slice(-2).includes(m)));
    const blocksFor = media.length ? await refBlocks(media) : undefined;
    // A remake of a reference video: its breakdown becomes the spec, its sheets pictures.
    const remake = mode !== "repair" && body.replicate ? await loadRemake(userId, str(body.replicate, 40), agent) : null;
    if (mode !== "repair" && body.replicate && !remake) return res.status(404).json({ error: "The reference's breakdown isn't ready." });
    const spec = remake ? remakeSpec(remake.breakdown) : null;
    const allBlocks = remake ? [...remake.blocks, ...(blocksFor ?? [])] : blocksFor;
    // Vercel stops the function at 300 s; leave room to save and answer.
    const deadline = Date.now() + 270_000;
    // Picking up a draft that ran out of time in an earlier request.
    const r0 = body.resume && typeof body.resume === "object" ? body.resume : null;
    const resume = r0 && typeof r0.raw === "string" && Array.isArray(r0.problems) ? { raw: r0.raw.slice(0, 400_000), problems: r0.problems.filter((p: unknown) => typeof p === "string").slice(0, 40) } : undefined;
    const extra = { ...(spec ? { spec: spec.text, maxSeconds: MAX_REMAKE_SECONDS } : {}), deadline, ...(resume ? { resume } : {}) };

    if (mode === "create") {
      const prompt = str(body.prompt, MAX_PROMPT);
      const aspect = (Object.keys(ASPECTS).includes(body.aspect) ? body.aspect : remake?.breakdown.aspect ?? "16:9") as Aspect;
      if (prompt.length < 8) return res.status(400).json({ error: "Describe the video in a sentence or two." });
      job = { mode, prompt, aspect, media, blocks: allBlocks, ...extra };
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
      // A remake can run longer than an ordinary template; later changes keep that allowance.
      const longer = current.durationInFrames > 600 ? { maxSeconds: MAX_REMAKE_SECONDS } : {};
      job = { mode, current, instruction, ...longer, ...(mode === "edit" ? { media, blocks: allBlocks, ...extra } : { deadline }) };
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
      // Out of time with a draft that needs fixing: the page resumes it in a new request.
      else if (out.draft) send({ type: "error", message: "Ran out of time before fixing the last problems.", problems: out.problems, resume: out.draft });
      else send({ type: "error", message: out.refused ? "Claude declined this request. Try describing the video differently." : "Couldn't produce a working template this time. Try rephrasing the prompt.", problems: out.problems });
    } catch (e) {
      console.error("studio-generate failed", (e as Error).message);
      await logGeneration({ userId, templateId, kind: mode, model: MODEL, ok: false, error: (e as Error).message, inputTokens: 0, outputTokens: 0, cacheRead: 0, cacheWrite: 0, ms: 0 });
      send({ type: "error", message: "Generation failed. Try again in a moment." });
    }
    res.end();
  }
}

