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
export type ChatReply = { reply: string; action: "chat" | "build" | "change" | "explainer"; brief: string; title: string; aspect: Aspect };
export type ChatContext = {
  aspect: Aspect;
  brand?: string;
  template?: { title: string; outcome: string; version: number; format: Aspect; seconds: number; copy: Record<string, string> };
  video?: { title: string; format: Aspect };
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

// Explainer videos, made by the explainer agent (api/_studio/videos.ts).
export type VideoStep = { key: string; label: string; state: "active" | "done" | "failed" };
export type ExplainerVideo = {
  id: string;
  title: string;
  aspect: Aspect;
  status: "running" | "done" | "failed";
  message: string | null;
  steps: VideoStep[];
  files: { mp4: boolean; gif: boolean; png: boolean };
  turns: number;
  createdAt: string;
  updatedAt: string;
};

async function videoCall(init?: RequestInit, query = ""): Promise<Record<string, any>> {
  const r = await fetch(`/api/studio?op=video${query}`, { credentials: "same-origin", ...init, headers: init?.body ? { "content-type": "application/json" } : undefined });
  if (!r.ok) throw await errorOf(r);
  return r.json();
}
export const startVideo = async (req: { brief: string; title: string; aspect: Aspect; brand: Record<string, string> }) =>
  (await videoCall({ method: "POST", body: JSON.stringify(req) })).video as ExplainerVideo;
export const changeVideo = async (id: string, message: string) => (await videoCall({ method: "POST", body: JSON.stringify({ id, message }) })).video as ExplainerVideo;
export const getVideo = async (id: string) => (await videoCall(undefined, `&id=${encodeURIComponent(id)}`)).video as ExplainerVideo;
export const listVideos = async () => (await videoCall()).videos as ExplainerVideo[];
// `v` busts the browser cache when a change makes new files.
export const videoFile = (v: ExplainerVideo, kind: "mp4" | "gif" | "png", download = false) =>
  `/api/studio?op=video&id=${encodeURIComponent(v.id)}&file=${kind}&v=${encodeURIComponent(v.updatedAt)}${download ? "&download=1" : ""}`;

export const formatOf = (t: { width: number; height: number }): Aspect => (t.width < t.height ? "9:16" : t.width === t.height ? "1:1" : "16:9");

export const slugOf = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "goblin-video";

export function saveFile(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
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
