// Browser client for template generation and saved templates (api/studio.ts).
import type { Template } from "../kit";

export type StudioField = { key: string; label: string; type: "text" | "textarea" | "media" | "audio"; hint?: string };
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
  | { type: "error"; message: string; problems?: string[]; resume?: Draft };
// A draft that ran out of time before its last fix; send it back as `resume` to finish it.
export type Draft = { raw: string; problems: string[] };

export type GenRequest =
  | { mode: "create"; prompt: string; aspect: Aspect; media?: (string | { ref: string; use: string })[]; replicate?: string; resume?: Draft }
  | { mode: "edit"; id: string; instruction: string; media?: (string | { ref: string; use: string })[]; replicate?: string; resume?: Draft }
  | { mode: "repair"; id: string; error: string };

// The current chat's id, sent with each chat and build request so PostHog can
// group a conversation's Claude calls into one trace. A new chat gets a new id.
let conversation = newId();
function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}
export const conversationId = () => conversation;
// Reopening a saved chat carries on under its id.
export function setConversationId(id: string) {
  conversation = id;
}
export function newConversation() {
  conversation = newId();
}
const traceHeaders = () => ({ "content-type": "application/json", "x-goblin-conversation": conversation });

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
    headers: traceHeaders(),
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
      if (e.type === "error") throw Object.assign(new StudioError(e.message, 200), { resume: e.resume });
    }
    if (done) break;
  }
  if (!result) throw new StudioError("The connection closed before the template was ready. Try again.", 0);
  return result;
}

export type ChatMessage = { role: "user" | "assistant"; text: string; media?: { ref: string; use: "auto" | "video" | "reference" }[] };
export type ChatReply = { reply: string; action: "chat" | "build" | "change" | "explainer" | "edit" | "replicate"; brief: string; title: string; aspect: Aspect; music?: string; photos?: string[]; links?: { url: string; title: string; ok: boolean; text: string }[] };
export type ChatContext = {
  aspect: Aspect;
  brand?: string;
  template?: { title: string; outcome: string; version: number; format: Aspect; seconds: number; copy: Record<string, string> };
  video?: { title: string; format: Aspect; kind?: "explainer" | "edit" };
  mode?: "explainer";
};

// One conversational reply from Goblin, saying whether to build.
export async function chat(messages: ChatMessage[], ctx: ChatContext, signal?: AbortSignal): Promise<ChatReply> {
  const r = await fetch("/api/studio?op=chat", {
    method: "POST",
    headers: traceHeaders(),
    body: JSON.stringify({ messages, ...ctx }),
    credentials: "same-origin",
    signal,
  });
  if (!r.ok) throw await errorOf(r);
  return r.json();
}

// Explainer videos, made by the explainer agent (api/_studio/videos.ts).
export type VideoStep = { key: string; label: string; state: "active" | "done" | "failed" };
// An explainer (from the explainer agent) or an edit of the user's own files
// (from Goblin Editor). Both are made in a cloud session and polled.
export type ExplainerVideo = {
  id: string;
  kind: "explainer" | "edit" | "breakdown";
  title: string;
  aspect: Aspect;
  status: "running" | "done" | "failed";
  message: string | null;
  steps: VideoStep[];
  files: { mp4: boolean; gif: boolean; png: boolean; srt?: boolean; breakdown?: boolean };
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
export const changeVideo = async (id: string, message: string, media?: { ref: string; use: string }[]) => (await videoCall({ method: "POST", body: JSON.stringify({ id, message, media }) })).video as ExplainerVideo;
export const startEdit = async (req: { brief: string; title: string; aspect: Aspect; brand: Record<string, string>; media: { ref: string; use: string }[] }) =>
  (await videoCall({ method: "POST", body: JSON.stringify({ mode: "edit", ...req }) })).video as ExplainerVideo;
// Remaking a reference video: Goblin Breakdown studies the clip first (api/_studio/videos.ts).
export const startBreakdown = async (req: { title: string; media: { ref: string; use: string }[] }) =>
  (await videoCall({ method: "POST", body: JSON.stringify({ mode: "breakdown", ...req }) })).video as ExplainerVideo;
export const breakdownOf = async (id: string) => (await videoCall(undefined, `&id=${encodeURIComponent(id)}&file=json`)) as { aspect?: Aspect; duration?: number; compare?: number[]; cards?: unknown[]; shots?: unknown[] };
export const breakdownFrame = (id: string, i: number) => `/api/studio?op=video&id=${encodeURIComponent(id)}&file=ref-${String(i).padStart(2, "0")}`;
export const getVideo = async (id: string) => (await videoCall(undefined, `&id=${encodeURIComponent(id)}`)).video as ExplainerVideo;
export const listVideos = async () => (await videoCall()).videos as ExplainerVideo[];
// `v` busts the browser cache when a change makes new files.
export const videoFile = (v: ExplainerVideo, kind: "mp4" | "gif" | "png" | "srt", download = false) =>
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

// Saves edits made in the panel (text, photos, clips, music settings).
export async function saveDefaults(id: string, defaults: Record<string, string>) {
  const r = await fetch("/api/studio?op=templates", { method: "PATCH", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, defaults }) });
  if (!r.ok) throw await errorOf(r);
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

// ---- saved chats ----------------------------------------------------------------
// Free stock photos from Pixabay or Unsplash, saved to the user's media (api/_studio/stock.ts).
export type StockPhoto = { id: string; ref: string; name: string; query: string; alt: string; width: number; height: number; url: string; credit: StockCredit };
export type StockCredit = { source: "pixabay" | "unsplash"; photographer: string; photographerUrl: string; photoUrl: string; thumb: string };
export async function stockPhotos(queries: string[], aspect: Aspect): Promise<StockPhoto[]> {
  const r = await fetch("/api/studio?op=stock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ queries, aspect }), credentials: "same-origin" });
  if (!r.ok) throw await errorOf(r);
  return (await r.json()).photos;
}

export type ChatSummary = { id: string; title: string; updatedAt: string };
const chatsCall = async (init?: RequestInit, query = "") => {
  const r = await fetch(`/api/studio?op=chats${query}`, { credentials: "same-origin", ...init, headers: init?.body ? { "content-type": "application/json" } : undefined });
  if (!r.ok) throw await errorOf(r);
  return r.json();
};
export const CHATS_CHANGED = "goblin:chats-changed";
const changed = () => window.dispatchEvent(new Event(CHATS_CHANGED));
export const listChats = async () => (await chatsCall()).chats as ChatSummary[];
export const getChat = async (id: string) => (await chatsCall(undefined, `&id=${encodeURIComponent(id)}`)).chat as { id: string; title: string; turns: unknown[]; updatedAt: string };
export async function saveChat(id: string, title: string, turns: unknown[]) {
  await chatsCall({ method: "PUT", body: JSON.stringify({ id, title, turns }) });
  changed();
}
export async function renameChat(id: string, title: string) {
  await chatsCall({ method: "PATCH", body: JSON.stringify({ id, title }) });
  changed();
}
export async function deleteChat(id: string) {
  await chatsCall({ method: "DELETE" }, `&id=${encodeURIComponent(id)}`);
  changed();
}
