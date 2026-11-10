// POST /api/studio?op=stock { queries: string[], aspect }: free stock photos
// from Unsplash for things the user asked to see but didn't attach ("add some
// nature photos"). Each query becomes one photo, saved to the user's media like
// an upload (with a small preview Goblin can look at), so builds and edits use
// it exactly as they would the user's own photo.
// Unsplash's rules: the chat shows each photo from Unsplash's own image link
// (credit.thumb), every photo we use is reported to its download endpoint, and
// the photographer and Unsplash are credited with links.
// Returns { photos: [{ id, ref, name, query, alt, width, height, url, credit }] }.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put } from "@vercel/blob";
import { db } from "./db.js";
import { readLink, type MediaRow } from "./media.js";

export const MAX_PHOTOS = 6;
const LONG_SIDE = 1920;
const PREVIEW_SIDE = 768;
const UTM = "utm_source=goblin&utm_medium=referral";
type Aspect = "16:9" | "9:16" | "1:1";
export type UnsplashPhoto = {
  id: string;
  width: number;
  height: number;
  alt_description?: string | null;
  description?: string | null;
  urls: { raw: string; small: string };
  links: { html: string; download_location: string };
  user: { name: string; links: { html: string } };
};
export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

export const stockOn = () => !!process.env.UNSPLASH_ACCESS_KEY;
const auth = () => ({ authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY ?? ""}`, "accept-version": "v1" });
const orientation = (a: Aspect) => (a === "9:16" ? "portrait" : a === "1:1" ? "squarish" : "landscape");
export const cleanQueries = (raw: unknown): string[] =>
  [...new Set((Array.isArray(raw) ? raw : []).map((q) => (typeof q === "string" ? q.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 80) : "")).filter((q) => q.length >= 2))].slice(0, MAX_PHOTOS);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "photo";
const hostIs = (u: string, host: string) => {
  try {
    const x = new URL(u);
    return x.protocol === "https:" && x.host === host;
  } catch {
    return false;
  }
};
export const withUtm = (u: string) => (hostIs(u, "unsplash.com") ? `${u}${u.includes("?") ? "&" : "?"}${UTM}` : "https://unsplash.com/?" + UTM);

// An Unsplash image resized on their CDN, as JPEG (the ixid parameter stays).
export function sized(p: UnsplashPhoto, side: number) {
  const landscape = p.width >= p.height;
  const scale = Math.min(1, side / Math.max(p.width, p.height));
  const u = new URL(p.urls.raw);
  u.searchParams.set("fm", "jpg");
  u.searchParams.set("q", "85");
  u.searchParams.set("fit", "max");
  u.searchParams.set(landscape ? "w" : "h", String(Math.round((landscape ? p.width : p.height) * scale)));
  return { url: u.toString(), width: Math.round(p.width * scale), height: Math.round(p.height * scale) };
}

// The best photo for a query that isn't already picked, in the video's orientation.
export async function search(fetcher: Fetcher, query: string, aspect: Aspect, skip: Set<string>): Promise<UnsplashPhoto | null> {
  const u = new URL("https://api.unsplash.com/search/photos");
  u.searchParams.set("query", query);
  u.searchParams.set("per_page", "8");
  u.searchParams.set("orientation", orientation(aspect));
  u.searchParams.set("content_filter", "high");
  const r = await fetcher(u.toString(), { headers: auth() });
  if (!r.ok) throw new Error(`Unsplash ${r.status}`);
  const photos = ((await r.json()) as { results?: UnsplashPhoto[] }).results ?? [];
  return photos.find((p) => !skip.has(p.id) && hostIs(p.urls?.raw ?? "", "images.unsplash.com") && hostIs(p.links?.download_location ?? "", "api.unsplash.com") && p.width > 0 && p.height > 0) ?? null;
}

// Unsplash counts a download each time a photo is used.
export async function reportDownload(fetcher: Fetcher, p: UnsplashPhoto) {
  if (!hostIs(p.links.download_location, "api.unsplash.com")) return;
  await fetcher(p.links.download_location, { headers: auth() }).catch(() => {});
}

export function creditOf(p: UnsplashPhoto) {
  return {
    source: "unsplash" as const,
    photographer: (p.user?.name ?? "").slice(0, 80) || "Unknown",
    photographerUrl: withUtm(p.user?.links?.html ?? ""),
    photoUrl: withUtm(p.links?.html ?? ""),
    thumb: hostIs(p.urls.small, "images.unsplash.com") ? p.urls.small : "",
    alt: (p.alt_description || p.description || "").slice(0, 200),
  };
}

async function download(fetcher: Fetcher, url: string, max: number) {
  const r = await fetcher(url);
  if (!r.ok) throw new Error(`photo ${r.status}`);
  const type = (r.headers.get("content-type") || "").split(";")[0];
  if (type !== "image/jpeg") throw new Error(`photo type ${type}`);
  const b = Buffer.from(await r.arrayBuffer());
  if (b.length > max) throw new Error("photo too large");
  return b;
}

export function makeHandler(userIdOf: (req: VercelRequest) => Promise<string | null>, fetcher: Fetcher = fetch) {
  return async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
    if (!stockOn() || !process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: "Stock photos aren't set up yet." });
    const userId = await userIdOf(req);
    if (!userId) return res.status(401).json({ error: "Sign in to add photos." });
    const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body) ?? {};
    const queries = cleanQueries(body.queries);
    const aspect: Aspect = ["16:9", "9:16", "1:1"].includes(body.aspect) ? body.aspect : "16:9";
    if (!queries.length) return res.status(400).json({ error: "What should the photos show?" });

    const picked = new Set<string>();
    const found: { q: string; p: UnsplashPhoto }[] = [];
    for (const q of queries) {
      const p = await search(fetcher, q, aspect, picked).catch(() => null);
      if (p) {
        picked.add(p.id);
        found.push({ q, p });
      }
    }
    const photos = (
      await Promise.all(
        found.map(async ({ q, p }) => {
          try {
            const full = sized(p, LONG_SIDE);
            const small = sized(p, PREVIEW_SIDE);
            const [img, prev] = await Promise.all([download(fetcher, full.url, 15 * 1024 * 1024), download(fetcher, small.url, 4 * 1024 * 1024)]);
            const name = `unsplash-${slug(q)}-${slug(p.id)}.jpg`;
            const base = `media/${userId}/${name}`;
            const [a, b] = await Promise.all([
              put(base, img, { access: "private", contentType: "image/jpeg", addRandomSuffix: true }),
              put(base.replace(/\.jpg$/, "-preview.jpg"), prev, { access: "private", contentType: "image/jpeg", addRandomSuffix: true }),
            ]);
            const credit = creditOf(p);
            await reportDownload(fetcher, p);
            const { rows } = await db().query<MediaRow>(
              `insert into studio.media (user_id, pathname, kind, mime, bytes, name, width, height, duration_seconds, preview_pathname, meta)
               values ($1, $2, 'image', 'image/jpeg', $3, $4, $5, $6, null, $7, $8) returning *`,
              [userId, a.pathname, img.length, name, full.width, full.height, b.pathname, JSON.stringify({ stock: credit })],
            );
            const m = rows[0];
            return { id: m.id, ref: `media:${m.id}`, name, query: q, alt: credit.alt, width: full.width, height: full.height, url: await readLink(m.pathname), credit };
          } catch (e) {
            console.error("stock photo failed", (e as Error).message);
            return null;
          }
        }),
      )
    ).filter((x) => x !== null);
    if (!photos.length) return res.status(502).json({ error: "Couldn't find photos for that just now." });
    return res.status(200).json({ photos });
  };
}
