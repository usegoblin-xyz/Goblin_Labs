// The browser side of uploaded photos and clips: upload a file to the private
// store, record it, and fetch files back (through short-lived links) to hand
// to the preview sandbox, which has no network of its own.
import { upload } from "@vercel/blob/client";
import { mediaIdsIn, type MediaInfo } from "../media";
import type { MediaFile } from "../../sandbox/protocol";

export type Kind = "image" | "video" | "audio" | "doc";
export type UploadedMedia = {
  id: string;
  ref: string;
  kind: Kind;
  mime: string;
  bytes: number;
  name: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  meta: NonNullable<MediaInfo["meta"]> & { pages?: number | null; frames?: number[] };
  url: string;
  expiresAt: number;
};

const IMAGE = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO = ["video/mp4", "video/quicktime", "video/webm"];
const AUDIO = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/wave", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/ogg", "audio/webm", "audio/flac"];
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const BY_EXT: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif",
  mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm",
  mp3: "audio/mpeg", wav: "audio/wav", m4a: "audio/mp4", aac: "audio/aac", ogg: "audio/ogg", flac: "audio/flac",
  pdf: "application/pdf", txt: "text/plain", md: "text/markdown", markdown: "text/markdown", csv: "text/csv", docx: DOCX,
};
export const ACCEPT = [...IMAGE, ...VIDEO, ...AUDIO, "application/pdf", "text/plain", "text/markdown", "text/csv", DOCX, ".md", ".txt", ".csv", ".docx", ".m4a", ".mp3", ".wav"].join(",");
export const MAX_IMAGE_MB = 20;
export const MAX_VIDEO_MB = 150;
export const MAX_AUDIO_MB = 40;
export const MAX_DOC_MB = 20;
export const MAX_VIDEO_SECONDS = 180;
export const MAX_AUDIO_SECONDS = 15 * 60;

// A file's type, from the browser or its extension (some systems leave it blank).
export function mimeOf(file: File): string {
  const t = (file.type || "").toLowerCase();
  if (t && t !== "application/octet-stream") return t === "audio/x-m4a" ? "audio/mp4" : t;
  return BY_EXT[file.name.split(".").pop()?.toLowerCase() ?? ""] ?? "";
}
export function kindOfFile(file: File): Kind | null {
  const t = mimeOf(file);
  if (IMAGE.includes(t)) return "image";
  if (VIDEO.includes(t)) return "video";
  if (AUDIO.includes(t)) return "audio";
  if (["application/pdf", "text/plain", "text/markdown", "text/csv", DOCX].includes(t)) return "doc";
  return null;
}

// Reads a picked file's size (and length, for clips and music) before upload.
export function probe(file: File): Promise<{ kind: Kind; width: number; height: number; durationSeconds: number | null }> {
  const kind = kindOfFile(file);
  if (!kind) return Promise.reject(new Error("That file type isn't supported. Use a photo, clip, music file, PDF, Word or text file."));
  if (kind === "doc") return Promise.resolve({ kind, width: 0, height: 0, durationSeconds: null });
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const done = () => URL.revokeObjectURL(url);
    if (kind === "image") {
      const img = new Image();
      img.onload = () => (done(), resolve({ kind, width: img.naturalWidth, height: img.naturalHeight, durationSeconds: null }));
      img.onerror = () => (done(), reject(new Error("That photo couldn't be opened. Try a JPG or PNG.")));
      img.src = url;
    } else {
      const v = document.createElement(kind === "video" ? "video" : "audio");
      v.preload = "metadata";
      v.muted = true;
      v.onloadedmetadata = () => {
        done();
        const el = v as HTMLVideoElement;
        resolve({ kind, width: el.videoWidth ?? 0, height: el.videoHeight ?? 0, durationSeconds: Number.isFinite(v.duration) ? v.duration : null });
      };
      v.onerror = () => (done(), reject(new Error(kind === "video" ? "That clip couldn't be opened in this browser. Try an MP4." : "That music file couldn't be opened. Try an MP3 or WAV.")));
      v.src = url;
    }
  });
}

export function checkFile(file: File, info: { kind: Kind; durationSeconds: number | null }): string | null {
  const mb = file.size / 1024 / 1024;
  if (info.kind === "image" && mb > MAX_IMAGE_MB) return `That photo is over ${MAX_IMAGE_MB} MB.`;
  if (info.kind === "video" && mb > MAX_VIDEO_MB) return `That clip is over ${MAX_VIDEO_MB} MB. Trim it on your phone first, or pick a shorter one.`;
  if (info.kind === "video" && (info.durationSeconds ?? 0) > MAX_VIDEO_SECONDS + 1) return `That clip is longer than ${MAX_VIDEO_SECONDS / 60} minutes.`;
  if (info.kind === "audio" && mb > MAX_AUDIO_MB) return `That music file is over ${MAX_AUDIO_MB} MB.`;
  if (info.kind === "audio" && (info.durationSeconds ?? 0) > MAX_AUDIO_SECONDS + 1) return `That track is longer than ${MAX_AUDIO_SECONDS / 60} minutes.`;
  if (info.kind === "doc" && mb > MAX_DOC_MB) return `That document is over ${MAX_DOC_MB} MB.`;
  return null;
}

// ---- what Claude looks at ----------------------------------------------------------
const MAX_SIDE = 1568;
const toJpeg = (canvas: HTMLCanvasElement, q = 0.82) => new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Couldn't make a preview."))), "image/jpeg", q));

async function photoPreview(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return toJpeg(c);
}

// Six frames from a clip, in order, on one sheet with their times.
async function clipSheet(file: File, duration: number): Promise<{ sheet: Blob; frames: number[] }> {
  const url = URL.createObjectURL(file);
  const v = document.createElement("video");
  v.muted = true;
  v.playsInline = true;
  v.preload = "auto";
  v.src = url;
  try {
    await new Promise<void>((res, rej) => {
      v.onloadeddata = () => res();
      v.onerror = () => rej(new Error("That clip couldn't be read."));
    });
    const frames = Array.from({ length: 6 }, (_, i) => +((duration * (i + 0.5)) / 6).toFixed(2));
    const cols = 3;
    const cellW = 512;
    const cellH = Math.round(cellW * (v.videoHeight / Math.max(1, v.videoWidth)));
    const c = document.createElement("canvas");
    c.width = cellW * cols;
    c.height = cellH * 2;
    const g = c.getContext("2d")!;
    g.fillStyle = "#000";
    g.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < frames.length; i++) {
      await new Promise<void>((res) => {
        v.onseeked = () => res();
        v.currentTime = Math.min(duration - 0.05, frames[i]);
      });
      const x = (i % cols) * cellW;
      const y = Math.floor(i / cols) * cellH;
      g.drawImage(v, x, y, cellW, cellH);
      g.fillStyle = "rgba(0,0,0,0.6)";
      g.fillRect(x + 8, y + 8, 64, 26);
      g.fillStyle = "#fff";
      g.font = "16px sans-serif";
      g.fillText(`${frames[i].toFixed(1)}s`, x + 14, y + 27);
    }
    return { sheet: await toJpeg(c, 0.78), frames };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Word files go up as their text, which Claude reads directly.
async function docxText(file: File): Promise<File> {
  const mammoth = await import("mammoth");
  const { value } = await (mammoth.default ?? mammoth).extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return new File([value], file.name.replace(/\.docx$/i, "") + ".txt", { type: "text/plain" });
}

async function pdfPages(file: File): Promise<number | null> {
  const text = new TextDecoder("latin1").decode(await file.slice(0, Math.min(file.size, 8 * 1024 * 1024)).arrayBuffer());
  const n = (text.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  return n || null;
}

const safeName = (name: string) => name.replace(/\.[^.]+$/, "").replace(/[^\w.\- ]+/g, "-").replace(/\s+/g, "-").slice(0, 60) || "upload";
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm", "audio/mpeg": "mp3", "audio/mp3": "mp3", "audio/wav": "wav", "audio/x-wav": "wav", "audio/wave": "wav", "audio/mp4": "m4a", "audio/aac": "aac", "audio/ogg": "ogg", "audio/webm": "weba", "audio/flac": "flac", "application/pdf": "pdf", "text/plain": "txt", "text/markdown": "md", "text/csv": "csv" };

const put = (pathname: string, body: Blob, contentType: string, onProgress?: (p: number) => void, signal?: AbortSignal) =>
  upload(pathname, body, { access: "private", handleUploadUrl: "/api/studio?op=media-upload", contentType, multipart: body.size > 8 * 1024 * 1024, abortSignal: signal, onUploadProgress: (e) => onProgress?.(e.percentage / 100) });

export async function uploadMedia(
  picked: File,
  userId: string,
  onProgress?: (p: number) => void,
  signal?: AbortSignal,
  opts?: { meta?: Record<string, unknown> },
): Promise<UploadedMedia> {
  const info = await probe(picked);
  const problem = checkFile(picked, info);
  if (problem) throw new Error(problem);
  let file = picked;
  let mime = mimeOf(picked);
  if (mime === DOCX) {
    file = await docxText(picked);
    mime = "text/plain";
  }
  const base = `media/${userId}/${safeName(picked.name)}`;
  // Work out what Claude sees (and, for music, the beats) before uploading.
  let preview: Blob | null = null;
  let meta: Record<string, unknown> = { ...(opts?.meta ?? {}) };
  if (info.kind === "image") preview = await photoPreview(file).catch(() => null);
  if (info.kind === "video" && info.durationSeconds) {
    const s = await clipSheet(file, info.durationSeconds).catch(() => null);
    if (s) {
      preview = s.sheet;
      meta.frames = s.frames;
    }
  }
  if (info.kind === "audio" && !opts?.meta) {
    const { analyse } = await import("./beats");
    const a = await analyse(await file.arrayBuffer()).catch(() => null);
    if (a) meta = { bpm: a.bpm, beats: a.beats, downbeats: a.downbeats, energy: a.energy };
  }
  if (info.kind === "doc" && mime === "application/pdf") meta.pages = await pdfPages(file).catch(() => null);
  if (mimeOf(picked) === DOCX) meta.from = "docx";

  const previewPath = preview ? (await put(`${base}.preview.jpg`, preview, "image/jpeg", undefined, signal)).pathname : null;
  const blob = await put(`${base}.${EXT[mime] ?? "bin"}`, file, mime, onProgress, signal);
  const r = await fetch("/api/studio?op=media", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ pathname: blob.pathname, previewPathname: previewPath, name: picked.name, width: info.width || null, height: info.height || null, durationSeconds: info.durationSeconds, meta }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "The upload couldn't be saved.");
  const m = j.media as UploadedMedia;
  // The file is already here, so the first preview doesn't download it again.
  remember(m, file);
  return m;
}

// ---- reading files back -------------------------------------------------------
const infos = new Map<string, UploadedMedia>();
const files = new Map<string, Promise<MediaFile | null>>();

function remember(m: UploadedMedia, file?: Blob) {
  infos.set(m.id, m);
  // Documents never go to the sandbox: they're for Claude only.
  if (file && m.kind !== "doc") files.set(m.id, file.arrayBuffer().then((data) => ({ data, mime: m.mime, kind: m.kind, width: m.width, height: m.height, durationSeconds: m.durationSeconds, meta: m.meta })));
}

export async function mediaInfos(ids: string[]): Promise<Record<string, UploadedMedia>> {
  const need = ids.filter((id) => {
    const m = infos.get(id);
    return !m || m.expiresAt - Date.now() < 5 * 60 * 1000;
  });
  if (need.length) {
    const r = await fetch(`/api/studio?op=media&ids=${need.join(",")}`, { credentials: "include" });
    if (r.ok) for (const m of ((await r.json()).media ?? []) as UploadedMedia[]) infos.set(m.id, m);
  }
  const out: Record<string, UploadedMedia> = {};
  for (const id of ids) {
    const m = infos.get(id);
    if (m) out[id] = m;
  }
  return out;
}

// The files a set of field values refers to, ready for the sandbox.
export async function mediaFiles(values: Record<string, unknown>): Promise<Record<string, MediaFile>> {
  const ids = mediaIdsIn(values);
  if (!ids.length) return {};
  const meta = await mediaInfos(ids.filter((id) => !files.has(id)));
  for (const [id, m] of Object.entries(meta)) {
    if (files.has(id) || m.kind === "doc") continue;
    files.set(
      id,
      fetch(m.url)
        .then((r) => (r.ok ? r.arrayBuffer() : null))
        .then((data) => (data ? { data, mime: m.mime, kind: m.kind, width: m.width, height: m.height, durationSeconds: m.durationSeconds, meta: m.meta } : null))
        .catch(() => null),
    );
  }
  const out: Record<string, MediaFile> = {};
  await Promise.all(
    ids.map(async (id) => {
      const f = await files.get(id);
      if (f) out[id] = f;
      else files.delete(id); // try again next time
    }),
  );
  return out;
}

export const cachedInfo = (id: string) => infos.get(id) ?? null;
