// POST /api/studio?op=stock { queries: string[], aspect }: free stock photos
// from Pexels for things the user asked to see but didn't attach ("add some
// nature photos"). Each query becomes one photo, saved to the user's media like
// an upload (with a small preview Goblin can look at), so builds and edits use
// it exactly as they would the user's own photo.
// Returns { photos: [{ id, ref, name, alt, width, height, url, credit }] }.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put } from "@vercel/blob";
import { db } from "./db.js";
import { readLink, type MediaRow } from "./media.js";

export const MAX_PHOTOS = 6;
const LONG_SIDE = 1920;
const PREVIEW_SIDE = 768;
type Aspect = "16:9" | "9:16" | "1:1";
export type PexelsPhoto = { id: number; width: number; height: number; url: string; alt?: string; photographer?: string; photographer_url?: string; src: { original: string } };
export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

export const stockOn = () => !!process.env.PEXELS_API_KEY;
const orientation = (a: Aspect) => (a === "9:16" ? "portrait" : a === "1:1" ? "square" : "landscape");
export const cleanQueries = (raw: unknown): string[] =>
  [...new Set((Array.isArray(raw) ? raw : []).map((q) => (typeof q === "string" ? q.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 80) : "")).filter((q) => q.length >= 2))].slice(0, MAX_PHOTOS);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "photo";

// A Pexels image resized on their CDN, as JPEG.
export function sized(p: PexelsPhoto, side: number) {
  const landscape = p.width >= p.height;
  const scale = Math.min(1, side / Math.max(p.width, p.height));
  const u = new URL(p.src.original);
  u.search = "";
  u.searchParams.set("auto", "compress");
  u.searchParams.set("cs", "tinysrgb");
  u.searchParams.set("fm", "jpg");
  u.searchParams.set(landscape ? "w" : "h", String(Math.round((landscape ? p.width : p.height) * scale)));
  return { url: u.toString(), width: Math.round(p.width * scale), height: Math.round(p.height * scale) };
}

// The best photo for a query that isn't already picked, in the video's orientation.
export async function search(fetcher: Fetcher, query: string, aspect: Aspect, skip: Set<number>): Promise<PexelsPhoto | null> {
  const u = new URL("https://api.pexels.com/v1/search");
  u.searchParams.set("query", query);
  u.searchParams.set("per_page", "8");
  u.searchParams.set("orientation", orientation(aspect));
  const r = await fetcher(u.toString(), { headers: { authorization: process.env.PEXELS_API_KEY ?? "" } });
  if (!r.ok) throw new Error(`Pexels ${r.status}`);
  const photos = ((await r.json()) as { photos?: PexelsPhoto[] }).photos ?? [];
  return photos.find((p) => !skip.has(p.id) && p.src?.original?.startsWith("https://images.pexels.com/")) ?? null;
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

    const picked = new Set<number>();
    const found: { q: string; p: PexelsPhoto }[] = [];
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
            const name = `pexels-${slug(q)}-${p.id}.jpg`;
            const base = `media/${userId}/${name}`;
            const [a, b] = await Promise.all([
              put(base, img, { access: "private", contentType: "image/jpeg", addRandomSuffix: true }),
              put(base.replace(/\.jpg$/, "-preview.jpg"), prev, { access: "private", contentType: "image/jpeg", addRandomSuffix: true }),
            ]);
            const credit = { source: "pexels", photographer: (p.photographer ?? "").slice(0, 80), photographerUrl: p.photographer_url ?? "", url: p.url, alt: (p.alt ?? "").slice(0, 200) };
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
