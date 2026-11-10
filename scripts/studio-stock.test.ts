// Checks for stock photos that don't need Unsplash, Blob or a database.
//   npx tsx scripts/studio-stock.test.ts
import assert from "node:assert/strict";
import { cleanQueries, creditOf, reportDownload, search, sized, withUtm, MAX_PHOTOS, type UnsplashPhoto } from "../api/_studio/stock.ts";

const photo = (id: string, w = 6000, h = 4000, o: Partial<UnsplashPhoto> = {}): UnsplashPhoto => ({
  id,
  width: w,
  height: h,
  alt_description: "a green leaf",
  urls: { raw: `https://images.unsplash.com/photo-${id}?ixid=abc123`, small: `https://images.unsplash.com/photo-${id}?ixid=abc123&w=400` },
  links: { html: `https://unsplash.com/photos/${id}`, download_location: `https://api.unsplash.com/photos/${id}/download?ixid=abc123` },
  user: { name: "Ann Lee", links: { html: "https://unsplash.com/@annlee" } },
  ...o,
});

// queries: trimmed, deduped, short ones dropped, capped
assert.deepEqual(cleanQueries([" misty forest ", "misty forest", "a", 5, "ocean\nwave"]), ["misty forest", "ocean wave"]);
assert.equal(cleanQueries(Array.from({ length: 10 }, (_, i) => `q${i}`)).length, MAX_PHOTOS);
assert.deepEqual(cleanQueries("nope"), []);

// resizing on the CDN: long side capped, never upscaled, JPEG, ixid kept
let s = sized(photo("a"), 1920);
assert.deepEqual([s.width, s.height], [1920, 1280]);
const su = new URL(s.url);
assert.equal(su.host, "images.unsplash.com");
assert.equal(su.searchParams.get("ixid"), "abc123");
assert.equal(su.searchParams.get("fm"), "jpg");
assert.equal(su.searchParams.get("w"), "1920");
s = sized(photo("b", 3000, 4500), 1920);
assert.deepEqual([s.width, s.height], [1280, 1920]);
assert.equal(new URL(s.url).searchParams.get("h"), "1920");
assert.deepEqual([sized(photo("c", 800, 600), 1920).width, sized(photo("c", 800, 600), 1920).height], [800, 600]);

// credit: links carry the referral, nothing off-site gets through
const c = creditOf(photo("a"));
assert.equal(c.photographer, "Ann Lee");
assert.equal(c.photographerUrl, "https://unsplash.com/@annlee?utm_source=goblin&utm_medium=referral");
assert.equal(c.photoUrl, "https://unsplash.com/photos/a?utm_source=goblin&utm_medium=referral");
assert.ok(c.thumb.startsWith("https://images.unsplash.com/"));
assert.equal(withUtm("https://evil.example/x"), "https://unsplash.com/?utm_source=goblin&utm_medium=referral");

// search: orientation from the format, key in the header, skips picked and off-site photos
process.env.UNSPLASH_ACCESS_KEY = "test-key";
const calls: { url: string; auth: string }[] = [];
const fake = async (url: string, init?: RequestInit) => {
  calls.push({ url, auth: String((init?.headers as Record<string, string>)?.authorization) });
  return new Response(JSON.stringify({ results: [photo("x"), photo("y"), photo("z", 10, 10, { urls: { raw: "https://evil.example/z", small: "" } })] }), { status: 200 });
};
const p = await search(fake, "pine forest", "9:16", new Set(["x"]));
assert.equal(p?.id, "y");
const u = new URL(calls[0].url);
assert.equal(u.host, "api.unsplash.com");
assert.equal(u.pathname, "/search/photos");
assert.equal(u.searchParams.get("orientation"), "portrait");
assert.equal(u.searchParams.get("query"), "pine forest");
assert.equal(calls[0].auth, "Client-ID test-key");
await search(fake, "x", "1:1", new Set());
assert.equal(new URL(calls[1].url).searchParams.get("orientation"), "squarish");
assert.equal(await search(fake, "x", "16:9", new Set(["x", "y"])), null);
await assert.rejects(search(async () => new Response("", { status: 403 }), "x", "16:9", new Set()));

// a used photo is reported to its download endpoint, and only to Unsplash
calls.length = 0;
await reportDownload(fake, photo("y"));
assert.equal(calls[0].url, "https://api.unsplash.com/photos/y/download?ixid=abc123");
assert.equal(calls[0].auth, "Client-ID test-key");
await reportDownload(fake, photo("q", 1, 1, { links: { html: "", download_location: "https://evil.example/steal" } }));
assert.equal(calls.length, 1);
console.log("stock ok");
