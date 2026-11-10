// POST /api/studio?op=stock { queries: string[], aspect }: free stock photos
// for things the user asked to see but didn't attach ("add some nature
// photos"). Each query becomes one photo, saved to the user's media like an
// upload (with a small preview Goblin can look at), so builds and edits use it
// exactly as they would the user's own photo.
// Sources, in order: Pixabay (PIXABAY_API_KEY), then Unsplash
// (UNSPLASH_ACCESS_KEY) for a search Pixabay has nothing for.
// Pixabay's rules: searches are cached for 24 hours, photos are copied to our
// storage (never hotlinked), and the chat says they came from Pixabay.
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

const pixabayOn = () => !!process.env.PIXABAY_API_KEY;
const unsplashOn = () => !!process.env.UNSPLASH_ACCESS_KEY;
export const stockOn = () => pixabayOn() || unsplashOn();
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

export type Credit = { source: "unsplash" | "pixabay"; photographer: string; photographerUrl: string; photoUrl: string; thumb: string; alt: string };
// One photo picked for a query, from whichever source.
export type Pick = { source: Credit["source"]; id: string; full: { url: string; width: number; height: number }; preview: string; credit: Credit; used?: () => Promise<void> };

export function creditOf(p: UnsplashPhoto): Credit {
  return {
    source: "unsplash",
    photographer: (p.user?.name ?? "").slice(0, 80) || "Unknown",
    photographerUrl: withUtm(p.user?.links?.html ?? ""),
    photoUrl: withUtm(p.links?.html ?? ""),
    thumb: hostIs(p.urls.small, "images.unsplash.com") ? p.urls.small : "",
    alt: (p.alt_description || p.description || "").slice(0, 200),
  };
}

const unsplashPick = (fetcher: Fetcher, p: UnsplashPhoto): Pick => ({ source: "unsplash", id: p.id, full: sized(p, LONG_SIDE), preview: sized(p, PREVIEW_SIDE).url, credit: creditOf(p), used: () => reportDownload(fetcher, p) });

// ---- Pixabay ----------------------------------------------------------------------
export type PixabayHit = { id: number; pageURL: string; tags?: string; webformatURL: string; largeImageURL: string; imageWidth: number; imageHeight: number; user?: string; user_id?: number };
const PIXABAY_SIDE = 1280; // largeImageURL's long side on a standard key

// Searches are kept for 24 hours, as Pixabay asks (and to stay well under its limit).
export type Cache = { get: (key: string) => Promise<PixabayHit[] | null>; set: (key: string, hits: PixabayHit[]) => Promise<void> };
export const dbCache: Cache = {
  get: async (key) => {
    const { rows } = await db().query(`select hits from studio.stock_cache where key = $1 and fetched_at > now() - interval '24 hours'`, [key]);
    return rows[0]?.hits ?? null;
  },
  set: async (key, hits) => {
    await db().query(`insert into studio.stock_cache (key, hits) values ($1, $2::jsonb) on conflict (key) do update set hits = excluded.hits, fetched_at = now()`, [key, JSON.stringify(hits)]);
  },
};

export async function searchPixabay(fetcher: Fetcher, cache: Cache, query: string, aspect: Aspect, skip: Set<string>): Promise<Pick | null> {
  const orient = aspect === "9:16" ? "vertical" : aspect === "16:9" ? "horizontal" : "all";
  const key = `pixabay:${orient}:${query.toLowerCase()}`;
  let hits = await cache.get(key).catch(() => null);
  if (!hits) {
    const u = new URL("https://pixabay.com/api/");
    u.searchParams.set("key", process.env.PIXABAY_API_KEY ?? "");
    u.searchParams.set("q", query.slice(0, 100));
    u.searchParams.set("image_type", "photo");
    u.searchParams.set("orientation", orient);
    u.searchParams.set("safesearch", "true");
    u.searchParams.set("per_page", "10");
    const r = await fetcher(u.toString());
    if (!r.ok) throw new Error(`Pixabay ${r.status}`);
    hits = ((await r.json()) as { hits?: PixabayHit[] }).hits ?? [];
    await cache.set(key, hits).catch(() => {});
  }
  // For a square video, the most square photo of the top few.
  const ok = hits.filter((h) => !skip.has(`pixabay:${h.id}`) && hostIs(h.largeImageURL, "pixabay.com") && hostIs(h.webformatURL, "pixabay.com") && h.imageWidth > 0 && h.imageHeight > 0);
  const squareness = (h: PixabayHit) => Math.abs(Math.log(h.imageWidth / h.imageHeight));
  const h = aspect === "1:1" ? [...ok.slice(0, 5)].sort((a, b) => squareness(a) - squareness(b))[0] : ok[0];
  if (!h) return null;
  const scale = Math.min(1, PIXABAY_SIDE / Math.max(h.imageWidth, h.imageHeight));
  const user = (h.user ?? "").slice(0, 80);
  return {
    source: "pixabay",
    id: String(h.id),
    full: { url: h.largeImageURL, width: Math.round(h.imageWidth * scale), height: Math.round(h.imageHeight * scale) },
    preview: h.webformatURL,
    credit: {
      source: "pixabay",
      photographer: user || "Pixabay",
      photographerUrl: user && h.user_id ? `https://pixabay.com/users/${encodeURIComponent(user)}-${h.user_id}/` : "https://pixabay.com/",
      photoUrl: hostIs(h.pageURL, "pixabay.com") ? h.pageURL : "https://pixabay.com/",
      thumb: "", // Pixabay doesn't allow hotlinking: the chat shows our copy
      alt: (h.tags ?? "").slice(0, 200),
    },
  };
}

// The photo for one query: Pixabay first, then Unsplash.
export async function pickFor(fetcher: Fetcher, cache: Cache, query: string, aspect: Aspect, skip: Set<string>): Promise<Pick | null> {
  if (pixabayOn()) {
    const p = await searchPixabay(fetcher, cache, query, aspect, skip).catch((e) => (console.error("pixabay search failed", (e as Error).message), null));
    if (p) return p;
  }
  if (unsplashOn()) {
    const u = await search(fetcher, query, aspect, new Set([...skip].filter((k) => k.startsWith("unsplash:")).map((k) => k.slice(9)))).catch(() => null);
    if (u) return unsplashPick(fetcher, u);
  }
  return null;
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

export function makeHandler(userIdOf: (req: VercelRequest) => Promise<string | null>, fetcher: Fetcher = fetch, cache: Cache = dbCache) {
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
    const found: { q: string; p: Pick }[] = [];
    for (const q of queries) {
      const p = await pickFor(fetcher, cache, q, aspect, picked);
      if (p) {
        picked.add(`${p.source}:${p.id}`);
        found.push({ q, p });
      }
    }
    const photos = (
      await Promise.all(
        found.map(async ({ q, p }) => {
          try {
            const full = p.full;
            const [img, prev] = await Promise.all([download(fetcher, full.url, 15 * 1024 * 1024), download(fetcher, p.preview, 4 * 1024 * 1024)]);
            const name = `${p.source}-${slug(q)}-${slug(p.id)}.jpg`;
            const base = `media/${userId}/${name}`;
            const [a, b] = await Promise.all([
              put(base, img, { access: "private", contentType: "image/jpeg", addRandomSuffix: true }),
              put(base.replace(/\.jpg$/, "-preview.jpg"), prev, { access: "private", contentType: "image/jpeg", addRandomSuffix: true }),
            ]);
            const credit = p.credit;
            await p.used?.();
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
