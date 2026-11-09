// /api/studio?op=video: explainer videos made by the explainer agent built in
// the Claude Console (Managed Agents). Goblin starts a session, the page polls
// it for progress, and the finished MP4 is streamed back from the session's
// output files.
//
//   POST { brief, title, aspect, brand }  → { video }   start a new explainer
//   POST { id, message }                  → { video }   ask the agent for a change
//   GET  ?id=                             → { video }   progress, refreshed from the session
//   GET  ?id=&file=mp4|gif|png[&download=1]             the output file
//   GET                                   → { videos }  the user's explainers and edits
//
// Edits: { mode: "edit", brief, title, aspect, brand, media } hands the user's
// own files (as short-lived private links) to Goblin Editor, a second agent
// with a real editing machine; a change can bring new media too.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Readable } from "node:stream";
import { agentApi, type AgentApi, type AgentEvent, type OutputFile, type SessionInfo } from "./agent.js";
import { db } from "./db.js";
import { loadAttachments, type Attachment } from "./refs.js";
import { readLink } from "./media.js";
import { parseMediaRef } from "../../src/library/media.js";

export const VIDEO_LIMIT = () => Number(process.env.STUDIO_VIDEO_LIMIT || 3);
export const EDIT_LIMIT = () => Number(process.env.STUDIO_EDIT_LIMIT || 5);
const EDIT_BUDGET_CENTS = () => Number(process.env.STUDIO_EDIT_BUDGET_CENTS || 500);
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
  kind: "explainer" | "edit";
  title: string;
  aspect: string;
  status: "running" | "done" | "failed";
  message: string | null;
  steps: Step[];
  files: { mp4: boolean; gif: boolean; png: boolean; srt: boolean };
  turns: number;
  createdAt: string;
  updatedAt: string;
};

type Row = {
  id: string; user_id: string; session_id: string; title: string; brief: string; aspect: string; status: Video["status"];
  message: string | null; files: Partial<Record<"mp4" | "gif" | "png" | "srt", string>>; turn_at: Date; turns: number; cost_cents: number;
  created_at: Date; updated_at: Date; kind: "explainer" | "edit";
};
const COLS = "id, user_id, session_id, title, brief, aspect, status, message, files, turn_at, turns, cost_cents, created_at, updated_at, kind";

const toVideo = (r: Row, steps: Step[] = []): Video => ({
  id: r.id, kind: r.kind ?? "explainer", title: r.title, aspect: r.aspect, status: r.status, message: r.message, steps,
  files: { mp4: !!r.files.mp4, gif: !!r.files.gif, png: !!r.files.png, srt: !!r.files.srt },
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

// What Goblin tells the editor: the brief, the user's files as download links,
// the format and the brand.
const fmtS = (s: number) => (s >= 10 ? Math.round(s) : +s.toFixed(1)) + " s";
export function describeFile(a: Attachment, url: string) {
  const r = parseMediaRef(a.ref);
  const bits = [a.kind === "image" ? "photo" : a.kind === "video" ? "video clip" : a.kind === "audio" ? (a.meta.generated ? "music (made by Goblin)" : "audio") : "document"];
  if (a.width && a.height) bits.push(`${a.width}x${a.height}`);
  if (a.durationSeconds) bits.push(fmtS(a.durationSeconds));
  if (r?.start != null || r?.end != null) bits.push(`the user trimmed it to ${fmtS(r?.start ?? 0)} to ${r?.end != null ? fmtS(r.end) : "the end"}: use only that part`);
  if (a.kind === "audio" && typeof a.meta.bpm === "number") bits.push(`${Math.round(a.meta.bpm as number)} BPM`);
  if (a.use === "reference") bits.push("a reference: look at it for style, don't put it in the video");
  return `- "${a.name}" (${bits.join(", ")}): ${url}`;
}
export function editorMessage(brief: string, aspect: string, brand: Record<string, string>, files: string[], change = false) {
  const colours = ["background", "foreground", "primary", "accent"].filter((k) => HEX.test(brand[k] ?? "")).map((k) => `${k === "foreground" ? "text" : k} ${brand[k]}`);
  return [
    change
      ? "[From Goblin: the user asks for a change to the video you made. Make new output files (new names), keep what they didn't ask to change. Reply in short plain text.]"
      : "[Sent by Goblin (usegoblin.xyz) for one of its users. They read your replies in Goblin's chat and watch the result in Goblin's player. Send a short status line before each stage, finish with a short plain-text summary, and make reasonable choices instead of asking questions.]",
    "",
    change ? "The change:" : "The edit:",
    brief,
    "",
    files.length ? (change ? "New files from the user (download them first; the links expire in about an hour):" : "The user's files (download them first; the links expire in about an hour):") : change ? "" : "The user attached no files: say so, and make what you can from the brief.",
    ...files,
    "",
    change ? "" : `Format: ${ASPECTS[aspect] ?? ASPECTS["16:9"]}, 30 fps, unless the edit says otherwise.`,
    colours.length ? `Brand colours for anything you add (captions, titles, overlays): ${colours.join(", ")}.` : "",
    brand.font && FONT_LABELS[brand.font] ? `Brand font: ${FONT_LABELS[brand.font]}.` : "",
    brand.name && !change ? `The brand is "${brand.name}".` : "",
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
export function progress(events: AgentEvent[], session: SessionInfo, files: OutputFile[], turnAt: number, now = Date.now(), kind: "explainer" | "edit" = "explainer") {
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

  if (kind === "edit") {
    // The editor sends a short status line before each stage; the last
    // message of a finished turn is its summary, not a step.
    const lines = turn.filter((e) => e.type === "agent.message").map((e) => cleanReply(textOf(e))).filter(Boolean);
    const statuses = (idle ? lines.slice(0, -1) : lines).filter((l) => l.length <= 80 && !l.includes("\n"));
    steps.push({ key: "files", label: statuses.length ? "Got your files" : "Getting your files", state: statuses.length || idle ? "done" : "active" });
    statuses.forEach((l, i) => steps.push({ key: `s${i}`, label: l.replace(/[.…]+$/, ""), state: i === statuses.length - 1 && !idle ? "active" : "done" }));
  } else steps.push({ key: "plan", label: created ? "Planned the storyboard" : "Planning the storyboard", state: created || idle ? "done" : "active" });
  if (created && kind === "explainer") {
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
  // An edit can make several clips: the main video is the one not called clip-N, or clip-1.
  const mainMp4 = () => {
    const fresh = files.filter((f) => f.filename.toLowerCase().endsWith(".mp4") && Date.parse(f.created_at) >= turnAt - 5_000);
    const main = fresh.filter((f) => !/^clip-\d+\.mp4$/i.test(f.filename)).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0] ?? fresh.find((f) => /^clip-1\.mp4$/i.test(f.filename));
    return main?.id ?? pick(".mp4");
  };
  const out = { mp4: kind === "edit" ? mainMp4() : pick(".mp4"), gif: pick(".gif"), png: pick(".png"), srt: pick(".srt") };
  const stop = (idle?.stop_reason as { type?: string } | undefined)?.type;

  let status: Video["status"] = "running";
  let error: string | null = null;
  if (errored) {
    status = "failed";
    error = kind === "edit" ? "The editor hit an error and stopped." : "The explainer agent hit an error and stopped.";
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

type Deps = { agent: AgentApi; userId: (req: VercelRequest) => Promise<string | null>; configured?: () => boolean; editorConfigured?: () => boolean };

export function makeHandler(deps: Deps) {
  const agentId = () => process.env.GOBLIN_EXPLAINER_AGENT_ID ?? "";
  const envId = () => process.env.GOBLIN_AGENT_ENVIRONMENT_ID ?? "";
  const configured = deps.configured ?? (() => !!(process.env.ANTHROPIC_API_KEY && agentId() && envId()));
  const editorId = () => process.env.GOBLIN_EDITOR_AGENT_ID ?? "";
  const editorEnv = () => process.env.GOBLIN_EDITOR_ENVIRONMENT_ID ?? "";
  const editorReady = deps.editorConfigured ?? (() => !!(process.env.ANTHROPIC_API_KEY && editorId() && editorEnv()));
  // The user's files for the editor, as hour-long private links.
  const linksFor = async (userId: string, media: unknown) => {
    const list = await loadAttachments(userId, media, 12);
    return { list, lines: await Promise.all(list.map(async (a) => describeFile(a, await readLink(a.pathname)))) };
  };

  async function refresh(r: Row): Promise<{ row: Row; steps: Step[] }> {
    if (r.status !== "running") return { row: r, steps: [] };
    const [session, events] = await Promise.all([deps.agent.getSession(r.session_id), deps.agent.listEvents(r.session_id)]);
    const idle = session.status === "idle" || session.status === "terminated";
    const files = idle ? await deps.agent.listFiles(r.session_id) : [];
    const p = progress(events, session, files, r.turn_at.getTime(), Date.now(), r.kind ?? "explainer");
    const cost = Number(session.usage?.list_cost?.amount ?? r.cost_cents) || 0;
    const nextFiles = p.status === "done" && p.files.mp4 ? { mp4: p.files.mp4, gif: p.files.gif, png: p.files.png, srt: p.files.srt } : r.files;
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
        if (kind === "mp4" || kind === "gif" || kind === "png" || kind === "srt") {
          const fileId = row.files[kind];
          if (!fileId) return res.status(404).json({ error: "That file isn't ready." });
          const r = await deps.agent.fileContent(fileId);
          if (!r.ok || !r.body) return res.status(502).json({ error: "Couldn't fetch the file." });
          const slug = row.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || (row.kind === "edit" ? "edit" : "explainer");
          res.statusCode = 200;
          res.setHeader("content-type", kind === "mp4" ? "video/mp4" : kind === "gif" ? "image/gif" : kind === "srt" ? "application/x-subrip" : "image/png");
          const len = r.headers.get("content-length");
          if (len) res.setHeader("content-length", len);
          // Files never change once made (a change makes new ones), so the browser can keep them.
          res.setHeader("cache-control", "private, max-age=86400, immutable");
          res.setHeader("content-disposition", `${req.query.download ? "attachment" : "inline"}; filename="${slug}${kind === "mp4" ? "" : kind === "gif" ? "-preview" : kind === "srt" ? "-captions" : "-stills"}.${kind}"`);
          Readable.fromWeb(r.body as never).pipe(res);
          return;
        }
        if (!configured() && row.status === "running") return res.status(200).json({ video: toVideo(row) });
        const { row: fresh, steps } = await refresh(row);
        return res.status(200).json({ video: toVideo(fresh, steps) });
      }

      if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
      const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body) ?? {};
      const editing = body.mode === "edit";
      if (editing ? !editorReady() : !configured() && !body.id) return res.status(503).json({ error: editing ? "Editing isn't switched on yet." : "Explainer videos aren't switched on yet." });

      // A change to an existing explainer: same session, so the agent keeps its scenes.
      if (body.id) {
        const row = await (async () => {
          if (!/^[0-9a-f-]{36}$/i.test(String(body.id))) return null;
          const { rows } = await db().query(`select ${COLS} from studio.videos where id = $1 and user_id = $2`, [body.id, userId]);
          return (rows[0] as Row) ?? null;
        })();
        if (!row) return res.status(404).json({ error: "Video not found." });
        if (row.status === "running") return res.status(409).json({ error: "This video is still being made. Try again when it's done." });
        if (row.kind === "edit" ? !editorReady() : !configured()) return res.status(503).json({ error: "This isn't switched on right now." });
        const message = str(body.message, row.kind === "edit" ? 4000 : 1200);
        if (message.length < 3) return res.status(400).json({ error: "Say what to change." });
        if (row.kind === "edit") {
          const { list, lines } = await linksFor(userId, body.media);
          await deps.agent.sendMessage(row.session_id, editorMessage(message, row.aspect, {}, lines, true));
          if (list.length) await db().query(`update studio.videos set media = media || $2::jsonb where id = $1`, [row.id, JSON.stringify(list.map((a) => ({ ref: a.ref, use: a.use })))]);
        } else await deps.agent.sendMessage(row.session_id, `[From Goblin: the user asks for a change. Re-render and replace the output files. Reply in short plain text.]\n\n${message}`);
        const { rows } = await db().query(
          `update studio.videos set status = 'running', turn_at = now(), turns = turns + 1, updated_at = now() where id = $1 returning ${COLS}`,
          [row.id],
        );
        return res.status(200).json({ video: toVideo(rows[0], [{ key: "plan", label: "Working on your change", state: "active" }]) });
      }

      // A new edit of the user's own files, by Goblin Editor.
      if (editing) {
        const brief = str(body.brief, 4000);
        if (brief.length < 8) return res.status(400).json({ error: "Say what the edit should do." });
        const title = str(body.title, 80) || brief.split(/[.\n]/)[0].slice(0, 60);
        const aspect = ASPECTS[body.aspect] ? body.aspect : "16:9";
        const brand = Object.fromEntries(Object.entries(body.brand && typeof body.brand === "object" ? body.brand : {}).map(([k, v]) => [k, str(v, 60)]));
        const { rows: used } = await db().query(`select count(*)::int as n from studio.videos where user_id = $1 and kind = 'edit' and created_at > now() - interval '24 hours'`, [userId]);
        if (used[0].n >= EDIT_LIMIT()) return res.status(429).json({ error: `You've made ${EDIT_LIMIT()} edits today, the daily limit. Try again tomorrow.` });
        const { list, lines } = await linksFor(userId, body.media);
        const session = await deps.agent.createSession({ agent: editorId(), environmentId: editorEnv(), title: `Goblin edit: ${title}`, text: editorMessage(brief, aspect, brand, lines), budgetCents: EDIT_BUDGET_CENTS() });
        const { rows } = await db().query(
          `insert into studio.videos (user_id, session_id, title, brief, aspect, kind, media) values ($1,$2,$3,$4,$5,'edit',$6) returning ${COLS}`,
          [userId, session.id, title, brief, aspect, JSON.stringify(list.map((a) => ({ ref: a.ref, use: a.use })))],
        );
        return res.status(200).json({ video: toVideo(rows[0], [{ key: "files", label: "Getting your files", state: "active" }]) });
      }

      const brief = str(body.brief, 4000);
      if (brief.length < 8) return res.status(400).json({ error: "Describe the explainer in a sentence or two." });
      const title = str(body.title, 80) || brief.split(/[.\n]/)[0].slice(0, 60);
      const aspect = ASPECTS[body.aspect] ? body.aspect : "16:9";
      const brand = Object.fromEntries(Object.entries(body.brand && typeof body.brand === "object" ? body.brand : {}).map(([k, v]) => [k, str(v, 60)]));

      const { rows: used } = await db().query(`select count(*)::int as n from studio.videos where user_id = $1 and kind = 'explainer' and created_at > now() - interval '24 hours'`, [userId]);
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

