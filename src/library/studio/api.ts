// Browser client for template generation and saved templates (api/studio.ts).
import type { Template } from "../kit";

export type StudioField = { key: string; label: string; type: "text" | "textarea"; hint?: string };
export type StudioTemplate = {
  id: string;
  title: string;
  outcome: string;
  category: string;
  tags: string[];
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  fields: StudioField[];
  defaults: Record<string, string>;
  code: string;
  compiled: string;
  prompt: string;
  version: number;
  updatedAt: string;
};
export type Version = { version: number; instruction: string; createdAt: string };
export type Aspect = "16:9" | "9:16" | "1:1";

export type GenEvent =
  | { type: "stage"; stage: "writing" | "checking" | "fixing"; attempt: number; problems?: string[] }
  | { type: "progress"; chars: number }
  | { type: "done"; template: StudioTemplate }
  | { type: "error"; message: string; problems?: string[] };

export type GenRequest =
  | { mode: "create"; prompt: string; aspect: Aspect }
  | { mode: "edit"; id: string; instruction: string }
  | { mode: "repair"; id: string; error: string };

export class StudioError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function errorOf(r: Response) {
  const body = await r.json().catch(() => ({}));
  return new StudioError(body.error || `Request failed (${r.status})`, r.status);
}

// Streams generation events; resolves with the saved template or throws.
export async function generate(req: GenRequest, onEvent: (e: GenEvent) => void, signal?: AbortSignal): Promise<StudioTemplate> {
  const r = await fetch("/api/studio?op=generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(req),
    credentials: "same-origin",
    signal,
  });
  if (!r.ok || !r.body) throw await errorOf(r);
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let result: StudioTemplate | null = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (value) buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line) continue;
      const e = JSON.parse(line) as GenEvent;
      onEvent(e);
      if (e.type === "done") result = e.template;
      if (e.type === "error") throw new StudioError(e.message, 200);
    }
    if (done) break;
  }
  if (!result) throw new StudioError("The connection closed before the template was ready. Try again.", 0);
  return result;
}

export type ChatMessage = { role: "user" | "assistant"; text: string };
export type ChatReply = { reply: string; action: "chat" | "build" | "change"; brief: string; aspect: Aspect };
export type ChatContext = {
  aspect: Aspect;
  brand?: string;
  template?: { title: string; outcome: string; version: number; format: Aspect; seconds: number; copy: Record<string, string> };
};

// One conversational reply from Goblin, saying whether to build.
export async function chat(messages: ChatMessage[], ctx: ChatContext, signal?: AbortSignal): Promise<ChatReply> {
  const r = await fetch("/api/studio?op=chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages, ...ctx }),
    credentials: "same-origin",
    signal,
  });
  if (!r.ok) throw await errorOf(r);
  return r.json();
}

export const formatOf = (t: { width: number; height: number }): Aspect => (t.width < t.height ? "9:16" : t.width === t.height ? "1:1" : "16:9");

// The template as a .tsx file: a header with its details and copy, then the code.
export function downloadTemplate(t: StudioTemplate, copy: Record<string, string>) {
  const slug = t.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "template";
  const header = [
    `// ${t.title} (v${t.version}): ${t.outcome}`,
    `// Made with Goblin (usegoblin.xyz). ${formatOf(t)}, ${t.width}×${t.height}, ${t.fps} fps, ${Math.round(t.durationInFrames / t.fps)}s.`,
    `// Uses Goblin's motion kit (brand.ts, kit.ts, motion.tsx) and Remotion.`,
    `//`,
    `// Copy:`,
    ...t.fields.map((f) => `//   ${f.key}: ${JSON.stringify(copy[f.key] ?? t.defaults[f.key] ?? "")}`),
    "",
  ].join("\n");
  const url = URL.createObjectURL(new Blob([header + "\n" + t.code], { type: "text/plain" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}-v${t.version}.tsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function listTemplates(): Promise<StudioTemplate[]> {
  const r = await fetch("/api/studio?op=templates", { credentials: "same-origin" });
  if (!r.ok) throw await errorOf(r);
  return (await r.json()).templates;
}

export async function getTemplate(id: string): Promise<{ template: StudioTemplate; versions: Version[] }> {
  const r = await fetch(`/api/studio?op=templates&id=${encodeURIComponent(id)}`, { credentials: "same-origin" });
  if (!r.ok) throw await errorOf(r);
  return r.json();
}

export async function restoreVersion(id: string, version: number): Promise<{ template: StudioTemplate; versions: Version[] }> {
  const r = await fetch("/api/studio?op=templates", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id, restore: version }),
    credentials: "same-origin",
  });
  if (!r.ok) throw await errorOf(r);
  return r.json();
}

export async function deleteTemplate(id: string): Promise<void> {
  const r = await fetch(`/api/studio?op=templates&id=${encodeURIComponent(id)}`, { method: "DELETE", credentials: "same-origin" });
  if (!r.ok) throw await errorOf(r);
}

// The library's Template shape, for reusing the Copy prompt text.
export function asTemplate(s: StudioTemplate): Template {
  return {
    id: `studio-${s.id}`,
    title: s.title,
    outcome: s.outcome,
    category: (s.category as Template["category"]) || "Launch",
    tags: s.tags,
    width: s.width,
    height: s.height,
    fps: s.fps,
    durationInFrames: s.durationInFrames,
    defaults: s.defaults,
    fields: s.fields,
  };
}
