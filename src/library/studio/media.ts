// The browser side of uploaded photos and clips: upload a file to the private
// store, record it, and fetch files back (through short-lived links) to hand
// to the preview sandbox, which has no network of its own.
import { upload } from "@vercel/blob/client";
import { mediaIdsIn } from "../media";
import type { MediaFile } from "../../sandbox/protocol";

export type UploadedMedia = {
  id: string;
  ref: string;
  kind: "image" | "video";
  mime: string;
  bytes: number;
  name: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  url: string;
  expiresAt: number;
};

export const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm";
export const MAX_IMAGE_MB = 20;
export const MAX_VIDEO_MB = 150;
export const MAX_VIDEO_SECONDS = 180;

// Reads a picked file's size (and length, for clips) before it's uploaded.
export function probe(file: File): Promise<{ kind: "image" | "video"; width: number; height: number; durationSeconds: number | null }> {
  const kind = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : null;
  if (!kind) return Promise.reject(new Error("Use a photo (JPG, PNG, WebP, GIF) or a clip (MP4, MOV, WebM)."));
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const done = () => URL.revokeObjectURL(url);
    if (kind === "image") {
      const img = new Image();
      img.onload = () => (done(), resolve({ kind, width: img.naturalWidth, height: img.naturalHeight, durationSeconds: null }));
      img.onerror = () => (done(), reject(new Error("That photo couldn't be opened. Try a JPG or PNG.")));
      img.src = url;
    } else {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.muted = true;
      v.onloadedmetadata = () => (done(), resolve({ kind, width: v.videoWidth, height: v.videoHeight, durationSeconds: Number.isFinite(v.duration) ? v.duration : null }));
      v.onerror = () => (done(), reject(new Error("That clip couldn't be opened in this browser. Try an MP4.")));
      v.src = url;
    }
  });
}

export function checkFile(file: File, info: { kind: "image" | "video"; durationSeconds: number | null }): string | null {
  const mb = file.size / 1024 / 1024;
  if (info.kind === "image" && mb > MAX_IMAGE_MB) return `That photo is over ${MAX_IMAGE_MB} MB.`;
  if (info.kind === "video" && mb > MAX_VIDEO_MB) return `That clip is over ${MAX_VIDEO_MB} MB. Trim it on your phone first, or pick a shorter one.`;
  if (info.kind === "video" && (info.durationSeconds ?? 0) > MAX_VIDEO_SECONDS + 1) return `That clip is longer than ${MAX_VIDEO_SECONDS / 60} minutes.`;
  return null;
}

const safeName = (name: string) => name.replace(/\.[^.]+$/, "").replace(/[^\w.\- ]+/g, "-").replace(/\s+/g, "-").slice(0, 60) || "upload";
const extOf = (file: File) => ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" })[file.type] ?? "bin";

export async function uploadMedia(file: File, userId: string, onProgress?: (p: number) => void, signal?: AbortSignal): Promise<UploadedMedia> {
  const info = await probe(file);
  const problem = checkFile(file, info);
  if (problem) throw new Error(problem);
  const blob = await upload(`media/${userId}/${safeName(file.name)}.${extOf(file)}`, file, {
    access: "private",
    handleUploadUrl: "/api/studio?op=media-upload",
    contentType: file.type,
    multipart: file.size > 8 * 1024 * 1024,
    abortSignal: signal,
    onUploadProgress: (e) => onProgress?.(e.percentage / 100),
  });
  const r = await fetch("/api/studio?op=media", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ pathname: blob.pathname, name: file.name, width: info.width, height: info.height, durationSeconds: info.durationSeconds }),
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
  if (file) files.set(m.id, file.arrayBuffer().then((data) => ({ data, mime: m.mime, kind: m.kind, width: m.width, height: m.height, durationSeconds: m.durationSeconds })));
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
    if (files.has(id)) continue;
    files.set(
      id,
      fetch(m.url)
        .then((r) => (r.ok ? r.arrayBuffer() : null))
        .then((data) => (data ? { data, mime: m.mime, kind: m.kind, width: m.width, height: m.height, durationSeconds: m.durationSeconds } : null))
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
