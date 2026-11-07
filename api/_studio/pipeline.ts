// Prompt → template: ask Claude, check what comes back, and send any
// problems back for a fix (up to MAX_FIXES times) before giving up.
import type Anthropic from "@anthropic-ai/sdk";
import { checkTemplate, compileTemplate } from "./check.js";
import type { CallClaude, ToolInput, Usage } from "./claude.js";
import type { Snapshot } from "./db.js";
import { EDIT_NOTE, REPAIR_NOTE } from "./guide.js";

export const ASPECTS = { "16:9": [1920, 1080], "9:16": [1080, 1920], "1:1": [1080, 1080] } as const;
export type Aspect = keyof typeof ASPECTS;
const MAX_FIXES = 2;
const KEY_RE = /^[a-z][A-Za-z0-9]{0,31}$/;

export type Event =
  | { type: "stage"; stage: "writing" | "checking" | "fixing"; attempt: number; problems?: string[] }
  | { type: "progress"; chars: number };

export type Job =
  | { mode: "create"; prompt: string; aspect: Aspect }
  | { mode: "edit" | "repair"; current: Snapshot; instruction: string };

export type Outcome = {
  snapshot: Snapshot | null;
  problems: string[];
  calls: { usage: Usage; ms: number; ok: boolean; error?: string }[];
  refused?: boolean;
};

const canvas = (w: number, h: number, s?: number) =>
  `Canvas: ${w}x${h} (${w === h ? "1:1" : w > h ? "16:9" : "9:16"}), 30 fps${s ? `, about ${s} seconds` : ""}.`;

function firstMessage(job: Job): string {
  if (job.mode === "create") {
    const [w, h] = ASPECTS[job.aspect];
    return `${canvas(w, h)}\n\nThe user's brief:\n<brief>\n${job.prompt}\n</brief>\n\nDesign the template and save it.`;
  }
  const c = job.current;
  const meta = { title: c.title, outcome: c.outcome, category: c.category, tags: c.tags, durationSeconds: Math.round(c.durationInFrames / c.fps), fields: c.fields.map((f) => ({ ...f, default: c.defaults[f.key] ?? "" })) };
  const note = job.mode === "edit" ? EDIT_NOTE : REPAIR_NOTE;
  const ask = job.mode === "edit" ? `The user's change:\n<change>\n${job.instruction}\n</change>` : `The problem, reported by the live preview:\n<problem>\n${job.instruction}\n</problem>`;
  return `${note}\n\n${canvas(c.width, c.height, meta.durationSeconds)}\n\nCurrent template metadata:\n${JSON.stringify(meta, null, 2)}\n\nCurrent code:\n\`\`\`tsx\n${c.code}\n\`\`\`\n\n${ask}`;
}

// Validates Claude's answer and turns it into a saved-template snapshot.
export function toSnapshot(input: ToolInput, width: number, height: number): { snapshot: Snapshot | null; problems: string[] } {
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
  }
  const secs = Math.round(Number(input.durationSeconds));
  if (!(secs >= 3 && secs <= 20)) problems.push(`durationSeconds is ${input.durationSeconds}; use 4 to 15.`);
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
      fields: fields.map((f) => ({ key: f.key, label: clip(f.label, 60) || f.key, type: f.type === "textarea" ? "textarea" : "text", ...(f.hint?.trim() ? { hint: clip(f.hint, 120) } : {}) })),
      defaults: Object.fromEntries(fields.map((f) => [f.key, clip(f.default, 500)])),
      code,
      compiled,
    },
  };
}

export async function runJob(job: Job, call: CallClaude, emit: (e: Event) => void): Promise<Outcome> {
  const [width, height] = job.mode === "create" ? ASPECTS[job.aspect] : [job.current.width, job.current.height];
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: firstMessage(job) }];
  const calls: Outcome["calls"] = [];
  let problems: string[] = [];

  for (let attempt = 0; attempt <= MAX_FIXES; attempt++) {
    emit(attempt === 0 ? { type: "stage", stage: "writing", attempt } : { type: "stage", stage: "fixing", attempt, problems });
    const started = Date.now();
    let res;
    try {
      res = await call(messages, (chars) => emit({ type: "progress", chars }));
    } catch (e) {
      calls.push({ usage: { inputTokens: 0, outputTokens: 0, cacheRead: 0, cacheWrite: 0 }, ms: Date.now() - started, ok: false, error: (e as Error).message });
      throw e;
    }
    const ms = Date.now() - started;
    if (res.stop === "refusal") {
      calls.push({ usage: res.usage, ms, ok: false, error: "refusal" });
      return { snapshot: null, problems: ["Claude declined this request."], calls, refused: true };
    }
    if (!res.input || res.stop === "max_tokens") {
      problems = [res.stop === "max_tokens" ? "the template was too long and got cut off; make it more compact." : "no template was returned."];
    } else {
      emit({ type: "stage", stage: "checking", attempt });
      const out = toSnapshot(res.input, width, height);
      if (out.snapshot) {
        calls.push({ usage: res.usage, ms, ok: true });
        return { snapshot: out.snapshot, problems: [], calls };
      }
      problems = out.problems;
    }
    calls.push({ usage: res.usage, ms, ok: false, error: problems.join(" | ") });
    // Ask for a fix in the same conversation, answering the tool call.
    if (res.toolUseId && res.input) {
      messages.push({ role: "assistant", content: [{ type: "tool_use", id: res.toolUseId, name: "save_template", input: res.input }] });
      messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: res.toolUseId, is_error: true, content: `${REPAIR_NOTE}\n\n${problems.map((p) => `- ${p}`).join("\n")}` }] });
    } else {
      messages.push({ role: "assistant", content: "(no template)" }, { role: "user", content: `${REPAIR_NOTE}\n\n${problems.map((p) => `- ${p}`).join("\n")}` });
    }
  }
  return { snapshot: null, problems, calls };
}
