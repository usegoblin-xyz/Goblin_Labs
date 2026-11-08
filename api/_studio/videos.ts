// /api/studio?op=video: explainer videos made by the explainer agent built in
// the Claude Console (Managed Agents). Goblin starts a session, the page polls
// it for progress, and the finished MP4 is streamed back from the session's
// output files.
//
//   POST { brief, title, aspect, brand }  → { video }   start a new explainer
//   POST { id, message }                  → { video }   ask the agent for a change
//   GET  ?id=                             → { video }   progress, refreshed from the session
//   GET  ?id=&file=mp4|gif|png[&download=1]             the output file
//   GET                                   → { videos }  the user's explainers
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Readable } from "node:stream";
import { agentApi, type AgentApi, type AgentEvent, type OutputFile, type SessionInfo } from "./agent.js";
import { db } from "./db.js";

export const VIDEO_LIMIT = () => Number(process.env.STUDIO_VIDEO_LIMIT || 3);
const BUDGET_CENTS = () => Number(process.env.STUDIO_VIDEO_BUDGET_CENTS || 400);
// Output files can show up a few seconds after the session goes idle.
const FILE_GRACE_MS = 45_000;

const ASPECTS: Record<string, string> = {
  "16:9": "1920×1080 landscape",
  "9:16": "1080×1920 vertical",
  "1:1": "1080×1080 square",
};
const FONT_LABELS: Record<string, string> = { inter: "Inter", grotesk: "Space Grotesk", serif: "Instrument Serif", mono: "JetBrains Mono" };
const HEX = /^#[0-9a-f]{6}$/i;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export type Step = { key: string; label: string; state: "active" | "done" | "failed" };
export type Video = {
  id: string;
  title: string;
  aspect: string;
  status: "running" | "done" | "failed";
  message: string | null;
  steps: Step[];
  files: { mp4: boolean; gif: boolean; png: boolean };
  turns: number;
  createdAt: string;
  updatedAt: string;
};

type Row = {
  id: string; user_id: string; session_id: string; title: string; brief: string; aspect: string; status: Video["status"];
  message: string | null; files: Partial<Record<"mp4" | "gif" | "png", string>>; turn_at: Date; turns: number; cost_cents: number;
  created_at: Date; updated_at: Date;
};
const COLS = "id, user_id, session_id, title, brief, aspect, status, message, files, turn_at, turns, cost_cents, created_at, updated_at";

const toVideo = (r: Row, steps: Step[] = []): Video => ({
  id: r.id, title: r.title, aspect: r.aspect, status: r.status, message: r.message, steps,
  files: { mp4: !!r.files.mp4, gif: !!r.files.gif, png: !!r.files.png },
  turns: r.turns, createdAt: r.created_at.toISOString(), updatedAt: r.updated_at.toISOString(),
});

// What Goblin tells the agent: the brief, the format and the brand, plus how
// to reply, since the user reads the reply in Goblin's chat.
export function agentMessage(brief: string, aspect: string, brand: Record<string, string>) {
  const colours = ["background", "foreground", "primary", "accent"].filter((k) => HEX.test(brand[k] ?? "")).map((k) => `${k === "foreground" ? "text" : k} ${brand[k]}`);
  return [
    "[Sent by Goblin (usegoblin.xyz) for one of its users. They see your replies in Goblin's chat and the video in Goblin's player, so reply in short plain text: no markdown, no file paths. Make reasonable choices instead of asking questions, and say what you chose.]",
    "",
    "Make this video:",
    brief,
    "",
    `Format: ${ASPECTS[aspect] ?? ASPECTS["16:9"]}, 30 fps.`,
    colours.length ? `Brand colours, use only these: ${colours.join(", ")}.` : "",
    brand.font && FONT_LABELS[brand.font] ? `Font: ${FONT_LABELS[brand.font]} if it's installed, otherwise a clean sans-serif.` : "",
    brand.name ? `End on the brand name "${brand.name}".` : "",
    "Keep to the default of 4 scenes unless the brief asks for more.",
  ].join("\n").replace(/\n{3,}/g, "\n\n");
}

// The agent's replies are written for a terminal; tidy them for the chat.
export function cleanReply(t: string) {
  return t
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const textOf = (e: AgentEvent) => ((e.content as { type: string; text?: string }[] | undefined) ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
const at = (e: AgentEvent) => (e.processed_at ? Date.parse(e.processed_at) : 0);

// Progress of the latest turn (everything after the last user message).
export function progress(events: AgentEvent[], session: SessionInfo, files: OutputFile[], turnAt: number, now = Date.now()) {
  let start = 0;
  events.forEach((e, i) => {
    if (e.type === "user.message") start = i;
  });
  const turn = events.slice(start);
  const steps: Step[] = [];
  const created = turn.find((e) => e.type === "workflow_run.created");
  const idle = [...turn].reverse().find((e) => e.type === "session.status_idle");
  const errored = turn.some((e) => e.type === "session.error") || session.status === "terminated";
  const messages = turn.filter((e) => e.type === "agent.message").map(textOf).filter(Boolean);
  const message = messages.length ? cleanReply(messages[messages.length - 1]) : null;

  steps.push({ key: "plan", label: created ? "Planned the storyboard" : "Planning the storyboard", state: created || idle ? "done" : "active" });
  if (created) {
    const phases = (created.phases as { id: string; name: string }[] | undefined) ?? [];
    for (const p of phases) {
      const started = turn.some((e) => e.type === "workflow_run.phase_started" && e.workflow_run_phase_id === p.id);
      const ended = turn.some((e) => e.type === "workflow_run.phase_ended" && e.workflow_run_phase_id === p.id);
      if (started || ended) steps.push({ key: p.id, label: p.name, state: ended || idle ? "done" : "active" });
    }
    if (turn.some((e) => e.type === "workflow_run.status_ended")) steps.push({ key: "join", label: "Joining the scenes and mixing the music", state: idle ? "done" : "active" });
  }

  const pick = (ext: string) =>
    files
      .filter((f) => f.filename.toLowerCase().endsWith(ext) && Date.parse(f.created_at) >= turnAt - 5_000)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0]?.id;
  const out = { mp4: pick(".mp4"), gif: pick(".gif"), png: pick(".png") };
  const stop = (idle?.stop_reason as { type?: string } | undefined)?.type;

  let status: Video["status"] = "running";
  let error: string | null = null;
  if (errored) {
    status = "failed";
    error = "The explainer agent hit an error and stopped.";
  } else if (idle && session.status === "idle" && stop === "budget_reached") {
    status = "failed";
    error = "This video reached its spending limit before it finished.";
  } else if (idle && session.status === "idle" && stop !== "requires_action") {
    if (out.mp4) status = "done";
    else if (now - at(idle) > FILE_GRACE_MS) status = "done"; // finished without a video: the reply says why
  }
  if (status !== "running") for (const s of steps) if (s.state === "active") s.state = status === "failed" ? "failed" : "done";
  return { status, steps, message: error ? (message ? `${error} ${message}` : error) : message, files: out };
}

type Deps = { agent: AgentApi; userId: (req: VercelRequest) => Promise<string | null>; configured?: () => boolean };

export function makeHandler(deps: Deps) {
  const agentId = () => process.env.GOBLIN_EXPLAINER_AGENT_ID ?? "";
  const envId = () => process.env.GOBLIN_AGENT_ENVIRONMENT_ID ?? "";
  const configured = deps.configured ?? (() => !!(process.env.ANTHROPIC_API_KEY && agentId() && envId()));

  async function refresh(r: Row): Promise<{ row: Row; steps: Step[] }> {
    if (r.status !== "running") return { row: r, steps: [] };
    const [session, events] = await Promise.all([deps.agent.getSession(r.session_id), deps.agent.listEvents(r.session_id)]);
    const idle = session.status === "idle" || session.status === "terminated";
    const files = idle ? await deps.agent.listFiles(r.session_id) : [];
    const p = progress(events, session, files, r.turn_at.getTime());
    const cost = Number(session.usage?.list_cost?.amount ?? r.cost_cents) || 0;
    const nextFiles = p.status === "done" && p.files.mp4 ? { mp4: p.files.mp4, gif: p.files.gif, png: p.files.png } : r.files;
    const { rows } = await db().query(
      `update studio.videos set status = $2, message = coalesce($3, message), files = $4::jsonb, cost_cents = $5, updated_at = now() where id = $1 returning ${COLS}`,
      [r.id, p.status, p.message, JSON.stringify(nextFiles), cost],
    );
    return { row: rows[0], steps: p.steps };
  }

  return async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("cache-control", "no-store");
    try {
      const userId = await deps.userId(req);
      if (!userId) return res.status(401).json({ error: "Sign in to make explainer videos." });
      const id = typeof req.query.id === "string" ? req.query.id : "";
      const load = async () => {
        if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
        const { rows } = await db().query(`select ${COLS} from studio.videos where id = $1 and user_id = $2`, [id, userId]);
        return (rows[0] as Row) ?? null;
      };

      if (req.method === "GET") {
        if (!id) {
          const { rows } = await db().query(`select ${COLS} from studio.videos where user_id = $1 order by created_at desc limit 100`, [userId]);
          return res.status(200).json({ videos: (rows as Row[]).map((r) => toVideo(r)) });
        }
        const row = await load();
        if (!row) return res.status(404).json({ error: "Video not found." });
        const kind = req.query.file;
        if (kind === "mp4" || kind === "gif" || kind === "png") {
          const fileId = row.files[kind];
          if (!fileId) return res.status(404).json({ error: "That file isn't ready." });
          const r = await deps.agent.fileContent(fileId);
          if (!r.ok || !r.body) return res.status(502).json({ error: "Couldn't fetch the file." });
          const slug = row.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "explainer";
          res.statusCode = 200;
          res.setHeader("content-type", kind === "mp4" ? "video/mp4" : kind === "gif" ? "image/gif" : "image/png");
          const len = r.headers.get("content-length");
          if (len) res.setHeader("content-length", len);
          // Files never change once made (a change makes new ones), so the browser can keep them.
          res.setHeader("cache-control", "private, max-age=86400, immutable");
          res.setHeader("content-disposition", `${req.query.download ? "attachment" : "inline"}; filename="${slug}${kind === "mp4" ? "" : kind === "gif" ? "-preview" : "-stills"}.${kind}"`);
          Readable.fromWeb(r.body as never).pipe(res);
          return;
        }
        if (!configured() && row.status === "running") return res.status(200).json({ video: toVideo(row) });
        const { row: fresh, steps } = await refresh(row);
        return res.status(200).json({ video: toVideo(fresh, steps) });
      }

      if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
      if (!configured()) return res.status(503).json({ error: "Explainer videos aren't switched on yet." });
      const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body) ?? {};

      // A change to an existing explainer: same session, so the agent keeps its scenes.
      if (body.id) {
        const row = await (async () => {
          if (!/^[0-9a-f-]{36}$/i.test(String(body.id))) return null;
          const { rows } = await db().query(`select ${COLS} from studio.videos where id = $1 and user_id = $2`, [body.id, userId]);
          return (rows[0] as Row) ?? null;
        })();
        if (!row) return res.status(404).json({ error: "Video not found." });
        if (row.status === "running") return res.status(409).json({ error: "This video is still being made. Try again when it's done." });
        const message = str(body.message, 1200);
        if (message.length < 3) return res.status(400).json({ error: "Say what to change." });
        await deps.agent.sendMessage(row.session_id, `[From Goblin: the user asks for a change. Re-render and replace the output files. Reply in short plain text.]\n\n${message}`);
        const { rows } = await db().query(
          `update studio.videos set status = 'running', turn_at = now(), turns = turns + 1, updated_at = now() where id = $1 returning ${COLS}`,
          [row.id],
        );
        return res.status(200).json({ video: toVideo(rows[0], [{ key: "plan", label: "Working on your change", state: "active" }]) });
      }

      const brief = str(body.brief, 4000);
      if (brief.length < 8) return res.status(400).json({ error: "Describe the explainer in a sentence or two." });
      const title = str(body.title, 80) || brief.split(/[.\n]/)[0].slice(0, 60);
      const aspect = ASPECTS[body.aspect] ? body.aspect : "16:9";
      const brand = Object.fromEntries(Object.entries(body.brand && typeof body.brand === "object" ? body.brand : {}).map(([k, v]) => [k, str(v, 60)]));

      const { rows: used } = await db().query(`select count(*)::int as n from studio.videos where user_id = $1 and created_at > now() - interval '24 hours'`, [userId]);
      if (used[0].n >= VIDEO_LIMIT()) {
        return res.status(429).json({ error: `You've made ${VIDEO_LIMIT()} explainer videos today, the daily limit. Try again tomorrow.` });
      }

      const session = await deps.agent.createSession({ agent: agentId(), environmentId: envId(), title: `Goblin: ${title}`, text: agentMessage(brief, aspect, brand), budgetCents: BUDGET_CENTS() });
      const { rows } = await db().query(
        `insert into studio.videos (user_id, session_id, title, brief, aspect) values ($1,$2,$3,$4,$5) returning ${COLS}`,
        [userId, session.id, title, brief, aspect],
      );
      return res.status(200).json({ video: toVideo(rows[0], [{ key: "plan", label: "Planning the storyboard", state: "active" }]) });
    } catch (e) {
      console.error("studio video failed", (e as Error).message);
      if (!res.headersSent) res.status(500).json({ error: "Something went wrong with the explainer agent. Try again in a moment." });
      else res.end();
    }
  };
}

