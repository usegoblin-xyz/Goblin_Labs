// Prompt → template: ask Claude, check what comes back, and send any
// problems back for a fix (up to MAX_FIXES times) before giving up.
import type Anthropic from "@anthropic-ai/sdk";
import { checkTemplate, compileTemplate } from "./check.js";
import type { CallClaude, ToolInput, Usage } from "./claude.js";
import type { Snapshot } from "./db.js";
import { EDIT_NOTE, REPAIR_NOTE } from "./guide.js";
import { parseMediaRef } from "../../src/library/media.js";

import type { Attachment } from "./refs.js";
export type { Attachment };

export const ASPECTS = { "16:9": [1920, 1080], "9:16": [1080, 1920], "1:1": [1080, 1080] } as const;
export type Aspect = keyof typeof ASPECTS;
const MAX_FIXES = 2;
const KEY_RE = /^[a-z][A-Za-z0-9]{0,31}$/;

export type Event =
  | { type: "stage"; stage: "writing" | "checking" | "fixing"; attempt: number; problems?: string[] }
  | { type: "progress"; chars: number };

export type Outcome = {
  snapshot: Snapshot | null;
  problems: string[];
  calls: { usage: Usage; ms: number; ok: boolean; error?: string }[];
  refused?: boolean;
  draft?: Draft;
};

export type Job =
  | { mode: "create"; prompt: string; aspect: Aspect; media?: Attachment[]; blocks?: Anthropic.ContentBlockParam[]; spec?: string; maxSeconds?: number; deadline?: number; resume?: Draft }
  | { mode: "edit" | "repair"; current: Snapshot; instruction: string; media?: Attachment[]; blocks?: Anthropic.ContentBlockParam[]; spec?: string; maxSeconds?: number; deadline?: number; resume?: Draft };
// An answer that failed the checks when the request ran out of time to fix it.
// The page sends it back in a new request (resume), which picks up with the fix.
export type Draft = { raw: string; problems: string[] };
// A remake (replicate.ts) sends the reference's breakdown as the spec.
// deadline: when the request must end; a fix isn't started without time for it.

// How to use the attachments, after the brief. The pictures and documents
// themselves come first in the message (see refs.blocks).
function describeMedia(media: Attachment[] | undefined): string {
  if (!media?.length) return "";
  const inVideo = media.filter((m) => m.use !== "reference" && m.kind !== "doc");
  const lines: string[] = [];
  lines.push("\n\nAttachments (shown above):");
  for (const m of media) lines.push(`- ${m.kind === "audio" ? "Music" : m.kind === "doc" ? "Document" : m.kind === "image" ? "Photo" : "Clip"} "${m.name}": ${m.use === "video" ? "put it in the video" : m.use === "reference" ? "reference only" : m.kind === "doc" ? "reference" : m.kind === "audio" ? "the soundtrack" : "use it as the brief says (in the video, or as a reference)"}. Ref "${m.ref}".`);
  if (inVideo.some((m) => m.kind === "image" || m.kind === "video"))
    lines.push(`For each photo or clip that goes in the video, declare a field of type "media" with exactly its ref as the default, and draw it with <Media src={c.<key>} /> from ../../motion. Keep text readable over it (a linear-gradient scrim of rgba(0,0,0,a)), keep faces clear, and keep a fallback design for when the field is empty (check hasMedia(c.<key>)).`);
  if (inVideo.some((m) => m.kind === "audio"))
    lines.push(`For the music, declare a field of type "audio" with exactly its ref as the default, put <Music src={c.<key>} duck={[...]} /> in the top-level tree (duck lists the seconds where your sound effects land), and time cuts and key words to its beats with beats(c.<key>), always with a fallback for when the field is empty or has no beats.`);
  if (media.some((m) => m.use === "reference" || m.kind === "doc"))
    lines.push("Use the references for what the brief takes from them (style, layout, pacing, type, colour mood, facts and copy), but never draw them in the video and never declare fields for them. Colours still come only from the brand kit.");
  return lines.join("\n");
}

const canvas = (w: number, h: number, s?: number) =>
  `Canvas: ${w}x${h} (${w === h ? "1:1" : w > h ? "16:9" : "9:16"}), 30 fps${s ? `, about ${s} seconds` : ""}.`;

function firstMessage(job: Job): string {
  if (job.mode === "create") {
    const [w, h] = ASPECTS[job.aspect];
    const spec = job.spec ? `\n\nThe reference video's breakdown:\n<reference_breakdown>\n${job.spec}\n</reference_breakdown>` : "";
    return `${canvas(w, h)}${spec}\n\nThe user's brief:\n<brief>\n${job.prompt}\n</brief>${describeMedia(job.media)}\n\nDesign the template and save it.`;
  }
  const c = job.current;
  const meta = { title: c.title, outcome: c.outcome, category: c.category, tags: c.tags, durationSeconds: Math.round(c.durationInFrames / c.fps), fields: c.fields.map((f) => ({ ...f, default: c.defaults[f.key] ?? "" })) };
  const note = job.mode === "edit" ? EDIT_NOTE : REPAIR_NOTE;
  const ask = job.mode === "edit" ? `The user's change:\n<change>\n${job.instruction}\n</change>` : `The problem, reported by the live preview:\n<problem>\n${job.instruction}\n</problem>`;
  const spec = job.spec ? `\n\nThis template remakes a reference video. Its breakdown:\n<reference_breakdown>\n${job.spec}\n</reference_breakdown>` : "";
  return `${note}\n\n${canvas(c.width, c.height, meta.durationSeconds)}${spec}\n\nCurrent template metadata:\n${JSON.stringify(meta, null, 2)}\n\nCurrent code:\n\`\`\`tsx\n${c.code}\n\`\`\`\n\n${ask}${describeMedia(job.media)}`;
}

// Validates Claude's answer and turns it into a saved-template snapshot.
export function toSnapshot(input: ToolInput, width: number, height: number, maxSeconds = 20): { snapshot: Snapshot | null; problems: string[] } {
  const problems: string[] = [];
  const code = String(input.code ?? "");
  const fields = Array.isArray(input.fields) ? input.fields : [];
  if (fields.length < 1 || fields.length > 8) problems.push(`declares ${fields.length} fields; use 2 to 6.`);
  const seen = new Set<string>();
  for (const f of fields) {
    if (!KEY_RE.test(f.key)) problems.push(`field key "${f.key}" must be camelCase letters and digits.`);
    if (seen.has(f.key)) problems.push(`field key "${f.key}" is declared twice.`);
    seen.add(f.key);
    if (!new RegExp(`\\bc\\.${f.key}\\b|\\bc\\[["']${f.key}["']\\]`).test(code)) problems.push(`field "${f.key}" is declared but the code never reads c.${f.key}.`);
    if ((f.type === "media" || f.type === "audio") && f.default && !parseMediaRef(f.default)) problems.push(`${f.type} field "${f.key}" must default to an attached media ref like "media:<id>", or "".`);
  }
  const secs = Math.round(Number(input.durationSeconds));
  if (!(secs >= 3 && secs <= maxSeconds)) problems.push(`durationSeconds is ${input.durationSeconds}; use ${maxSeconds > 20 ? `3 to ${maxSeconds}` : "4 to 15"}.`);
  problems.push(...checkTemplate(code));
  if (problems.length) return { snapshot: null, problems };

  let compiled: string;
  try {
    compiled = compileTemplate(code);
  } catch (e) {
    return { snapshot: null, problems: [`could not compile: ${(e as Error).message}`] };
  }
  const clip = (s: unknown, n: number) => String(s ?? "").trim().slice(0, n);
  return {
    problems: [],
    snapshot: {
      title: clip(input.title, 60) || "Untitled template",
      outcome: clip(input.outcome, 200),
      category: clip(input.category, 20),
      tags: (input.tags ?? []).slice(0, 8).map((t) => clip(t, 30)).filter(Boolean),
      width,
      height,
      fps: 30,
      durationInFrames: secs * 30,
      fields: fields.map((f) => ({ key: f.key, label: clip(f.label, 60) || f.key, type: f.type === "textarea" ? "textarea" : f.type === "media" ? "media" : f.type === "audio" ? "audio" : "text", ...(f.hint?.trim() ? { hint: clip(f.hint, 120) } : {}) })),
      defaults: Object.fromEntries(fields.map((f) => [f.key, clip(f.default, 500)])),
      code,
      compiled,
    },
  };
}

export async function runJob(job: Job, call: CallClaude, emit: (e: Event) => void): Promise<Outcome> {
  const [width, height] = job.mode === "create" ? ASPECTS[job.aspect] : [job.current.width, job.current.height];
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: job.blocks?.length ? [...job.blocks, { type: "text", text: firstMessage(job) }] : firstMessage(job) }];
  const calls: Outcome["calls"] = [];
  let problems: string[] = [];
  let raw = "";
  // Resuming: the failed answer and its problems are already in the conversation.
  if (job.resume) {
    problems = job.resume.problems.slice(0, 40).map((p) => String(p).slice(0, 400));
    messages.push({ role: "assistant", content: job.resume.raw.slice(0, 400_000) || "(no template)" }, { role: "user", content: `${REPAIR_NOTE}\n\n${problems.map((p) => `- ${p}`).join("\n")}` });
  }

  let lastMs = 0;
  for (let attempt = 0; attempt <= MAX_FIXES; attempt++) {
    // A fix takes about as long as the last call did; don't start one that can't finish.
    if (attempt > 0 && job.deadline && Date.now() + lastMs * 0.8 > job.deadline) return { snapshot: null, problems, calls, draft: { raw, problems } };
    emit(attempt === 0 && !job.resume ? { type: "stage", stage: "writing", attempt } : { type: "stage", stage: "fixing", attempt, problems });
    const started = Date.now();
    let res;
    try {
      res = await call(messages, (chars) => emit({ type: "progress", chars }));
    } catch (e) {
      calls.push({ usage: { inputTokens: 0, outputTokens: 0, cacheRead: 0, cacheWrite: 0 }, ms: Date.now() - started, ok: false, error: (e as Error).message });
      throw e;
    }
    const ms = Date.now() - started;
    lastMs = ms;
    raw = res.raw;
    if (res.stop === "refusal") {
      calls.push({ usage: res.usage, ms, ok: false, error: "refusal" });
      return { snapshot: null, problems: ["Claude declined this request."], calls, refused: true };
    }
    if (!res.input || res.stop === "max_tokens") {
      problems = [res.stop === "max_tokens" ? "the template was too long and got cut off; make it more compact." : "no template was returned."];
    } else {
      emit({ type: "stage", stage: "checking", attempt });
      const out = toSnapshot(res.input, width, height, job.maxSeconds);
      if (out.snapshot) {
        calls.push({ usage: res.usage, ms, ok: true });
        return { snapshot: out.snapshot, problems: [], calls };
      }
      problems = out.problems;
    }
    calls.push({ usage: res.usage, ms, ok: false, error: problems.join(" | ") });
    // Ask for a fix in the same conversation.
    messages.push(
      { role: "assistant", content: res.raw.trim() || "(no template)" },
      { role: "user", content: `${REPAIR_NOTE}\n\n${problems.map((p) => `- ${p}`).join("\n")}` },
    );
  }
  return { snapshot: null, problems, calls };
}
