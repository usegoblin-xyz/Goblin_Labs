// Photos and short clips people upload to use in their videos.
//   POST ?op=media-upload  Vercel Blob client-upload handshake: hands the
//                          browser a short-lived token to upload one file
//                          straight to the private store, under media/<user>/.
//   POST ?op=media         records an uploaded file, returns its "media:<id>" ref
//   GET  ?op=media&ids=a,b short-lived read links for the caller's own files
//   DELETE ?op=media&id=a  removes a file
// Files are private: the only way to read one is a presigned link from here,
// which the server issues only to the file's owner and which expires in an hour.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { del, head, issueSignedToken, presignUrl } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { db } from "./db.js";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
export const AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/wave", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/ogg", "audio/webm", "audio/flac"];
// Word files are turned into text in the browser before upload.
export const DOC_TYPES = ["application/pdf", "text/plain", "text/markdown", "text/csv"];
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 150 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 40 * 1024 * 1024;
export const MAX_DOC_BYTES = 20 * 1024 * 1024; // PDFs are sent to Claude whole, base64-encoded
export const MAX_VIDEO_SECONDS = 180;
export const MAX_AUDIO_SECONDS = 15 * 60;
type Kind = "image" | "video" | "audio" | "doc";
export const kindOf = (mime: string): Kind | null =>
  IMAGE_TYPES.includes(mime) ? "image" : VIDEO_TYPES.includes(mime) ? "video" : AUDIO_TYPES.includes(mime) ? "audio" : DOC_TYPES.includes(mime) ? "doc" : null;
const READ_FOR_MS = 60 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const prefix = (userId: string) => `media/${userId}/`;
const ownPath = (userId: string, p: unknown): p is string =>
  typeof p === "string" && p.startsWith(prefix(userId)) && /^[\w.\- ]{1,140}$/.test(p.slice(prefix(userId).length)) && !p.includes("..");

export type MediaRow = { id: string; kind: Kind; mime: string; bytes: number; name: string; width: number | null; height: number | null; duration_seconds: number | null; pathname: string; preview_pathname: string | null; meta: Record<string, unknown> };
const pub = (m: MediaRow) => ({ id: m.id, ref: `media:${m.id}`, kind: m.kind, mime: m.mime, bytes: Number(m.bytes), name: m.name, width: m.width, height: m.height, durationSeconds: m.duration_seconds, meta: m.meta ?? {} });

// What the browser measured on upload, kept small and well-formed.
function cleanMeta(kind: Kind, raw: unknown): Record<string, unknown> {
  const m = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const num = (v: unknown, lo: number, hi: number) => (typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi ? +v.toFixed(3) : null);
  if (kind === "audio") {
    const beats = Array.isArray(m.beats) ? m.beats.map((b) => num(b, 0, MAX_AUDIO_SECONDS)).filter((b): b is number => b !== null).slice(0, 4000) : [];
    const bars = Array.isArray(m.downbeats) ? m.downbeats.map((b) => num(b, 0, MAX_AUDIO_SECONDS)).filter((b): b is number => b !== null).slice(0, 1000) : [];
    const loud = Array.isArray(m.energy) ? m.energy.map((b) => num(b, 0, 1)).filter((b): b is number => b !== null).slice(0, 2000) : [];
    return { bpm: num(m.bpm, 30, 260), beats, downbeats: bars, energy: loud, generated: m.generated === true ? true : undefined, mood: typeof m.mood === "string" ? m.mood.slice(0, 30) : undefined };
  }
  if (kind === "doc") return { pages: num(m.pages, 0, 5000), chars: num(m.chars, 0, 1e8), from: typeof m.from === "string" ? m.from.slice(0, 20) : undefined };
  if (kind === "video") return { frames: Array.isArray(m.frames) ? m.frames.map((f) => num(f, 0, 24 * 3600)).filter((f) => f !== null).slice(0, 16) : [] };
  return {};
}

export async function readLink(pathname: string) {
  const tok = await issueSignedToken({ pathname, operations: ["get"], validUntil: Date.now() + READ_FOR_MS });
  const { presignedUrl } = await presignUrl(tok, { operation: "get", pathname, access: "private" });
  return presignedUrl;
}

export function makeHandler(userIdOf: (req: VercelRequest) => Promise<string | null>) {
  const configured = () => !!process.env.BLOB_READ_WRITE_TOKEN;

  const upload = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
    if (!configured()) return res.status(503).json({ error: "Uploads aren't set up yet." });
    const userId = await userIdOf(req);
    if (!userId) return res.status(401).json({ error: "Sign in to upload." });
    try {
      const out = await handleUpload({
        body: req.body as HandleUploadBody,
        request: req,
        onBeforeGenerateToken: async (pathname) => {
          if (!ownPath(userId, pathname)) throw new Error("Bad upload path.");
          return {
            allowedContentTypes: [...IMAGE_TYPES, ...VIDEO_TYPES, ...AUDIO_TYPES, ...DOC_TYPES],
            maximumSizeInBytes: MAX_VIDEO_BYTES,
            addRandomSuffix: true,
            validUntil: Date.now() + 15 * 60 * 1000,
          };
        },
      });
      return res.status(200).json(out);
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message || "Couldn't start the upload." });
    }
  };

  const media = async (req: VercelRequest, res: VercelResponse) => {
    if (!configured()) return res.status(503).json({ error: "Uploads aren't set up yet." });
    const userId = await userIdOf(req);
    if (!userId) return res.status(401).json({ error: "Sign in to use your photos and clips." });
    res.setHeader("cache-control", "no-store");

    if (req.method === "GET") {
      const ids = String(req.query.ids ?? "").split(",").map((s) => s.trim()).filter((s) => UUID.test(s)).slice(0, 20);
      if (!ids.length) return res.status(200).json({ media: [] });
      const { rows } = await db().query<MediaRow>(`select * from studio.media where user_id = $1 and id = any($2::uuid[])`, [userId, ids]);
      const media = await Promise.all(rows.map(async (m) => ({ ...pub(m), url: await readLink(m.pathname), expiresAt: Date.now() + READ_FOR_MS })));
      return res.status(200).json({ media });
    }

    if (req.method === "POST") {
      const b = (req.body ?? {}) as Record<string, unknown>;
      if (!ownPath(userId, b.pathname)) return res.status(400).json({ error: "That upload doesn't belong to you." });
      let info;
      try {
        info = await head(b.pathname);
      } catch {
        return res.status(400).json({ error: "That upload didn't finish. Try again." });
      }
      const mime = (info.contentType || "").split(";")[0].trim().toLowerCase();
      const kind = kindOf(mime);
      const fail = async (msg: string) => {
        await del(info.url).catch(() => {});
        return res.status(400).json({ error: msg });
      };
      if (!kind) return fail("That file type isn't supported. Use a photo, a clip, a music file, a PDF or a text file.");
      if (kind === "image" && info.size > MAX_IMAGE_BYTES) return fail("That photo is over 20 MB.");
      if (kind === "audio" && info.size > MAX_AUDIO_BYTES) return fail("That music file is over 40 MB.");
      if (kind === "doc" && info.size > MAX_DOC_BYTES) return fail("That document is over 20 MB.");
      const num = (v: unknown, max: number) => (typeof v === "number" && Number.isFinite(v) && v > 0 && v <= max ? v : null);
      const duration = kind === "video" || kind === "audio" ? num(b.durationSeconds, 24 * 3600) : null;
      if (kind === "video" && duration !== null && duration > MAX_VIDEO_SECONDS + 1) return fail(`That clip is longer than ${MAX_VIDEO_SECONDS / 60} minutes.`);
      if (kind === "audio" && duration !== null && duration > MAX_AUDIO_SECONDS + 1) return fail(`That track is longer than ${MAX_AUDIO_SECONDS / 60} minutes.`);
      // A small JPEG Claude looks at: a downscaled photo, or frames from a clip.
      let preview: string | null = null;
      if (b.previewPathname !== undefined && b.previewPathname !== null) {
        if (!ownPath(userId, b.previewPathname)) return fail("That preview doesn't belong to you.");
        const p = await head(b.previewPathname).catch(() => null);
        if (!p || (p.contentType || "").split(";")[0] !== "image/jpeg" || p.size > 5 * 1024 * 1024) return fail("The preview didn't upload properly. Try again.");
        preview = b.previewPathname;
      }
      const name = String(b.name ?? "").replace(/[\u0000-\u001f]/g, "").slice(0, 120);
      const { rows } = await db().query<MediaRow>(
        `insert into studio.media (user_id, pathname, kind, mime, bytes, name, width, height, duration_seconds, preview_pathname, meta)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         on conflict (pathname) do update set name = excluded.name, preview_pathname = excluded.preview_pathname, meta = excluded.meta
         returning *`,
        [userId, b.pathname, kind, mime, info.size, name, num(b.width, 20000), num(b.height, 20000), duration, preview, JSON.stringify(cleanMeta(kind, b.meta))],
      );
      return res.status(200).json({ media: { ...pub(rows[0]), url: await readLink(rows[0].pathname), expiresAt: Date.now() + READ_FOR_MS } });
    }

    if (req.method === "DELETE") {
      const id = String(req.query.id ?? "");
      if (!UUID.test(id)) return res.status(400).json({ error: "Which file?" });
      const { rows } = await db().query<MediaRow>(`delete from studio.media where user_id = $1 and id = $2 returning *`, [userId, id]);
      if (rows[0]) await del([rows[0].pathname, ...(rows[0].preview_pathname ? [rows[0].preview_pathname] : [])]).catch(() => {});
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: "Method not allowed." });
  };

  return { upload, media };
}
