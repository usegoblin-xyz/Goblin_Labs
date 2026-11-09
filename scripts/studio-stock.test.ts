// Checks for stock photos that don't need Pexels, Blob or a database.
//   npx tsx scripts/studio-stock.test.ts
import assert from "node:assert/strict";
import { cleanQueries, search, sized, MAX_PHOTOS, type PexelsPhoto } from "../api/_studio/stock.ts";

const photo = (id: number, w = 6000, h = 4000): PexelsPhoto => ({ id, width: w, height: h, url: `https://www.pexels.com/photo/${id}/`, alt: "a leaf", photographer: "Ann", src: { original: `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?x=1` } });

// queries: trimmed, deduped, short ones dropped, capped
assert.deepEqual(cleanQueries([" misty forest ", "misty forest", "a", 5, "ocean\nwave"]), ["misty forest", "ocean wave"]);
assert.equal(cleanQueries(Array.from({ length: 10 }, (_, i) => `q${i}`)).length, MAX_PHOTOS);
assert.deepEqual(cleanQueries("nope"), []);

// resizing on the CDN: long side capped, never upscaled, JPEG
let s = sized(photo(1), 1920);
assert.equal(s.width, 1920);
assert.equal(s.height, 1280);
assert.match(s.url, /^https:\/\/images\.pexels\.com\/photos\/1\/pexels-photo-1\.jpeg\?/);
assert.ok(s.url.includes("fm=jpg") && s.url.includes("w=1920") && !s.url.includes("x=1"));
s = sized(photo(2, 3000, 4500), 1920);
assert.deepEqual([s.width, s.height], [1280, 1920]);
assert.ok(s.url.includes("h=1920"));
s = sized(photo(3, 800, 600), 1920);
assert.deepEqual([s.width, s.height], [800, 600]);

// search: orientation from the format, key in the header, skips photos already picked
process.env.PEXELS_API_KEY = "test-key";
const calls: { url: string; auth: string }[] = [];
const fake = async (url: string, init?: RequestInit) => {
  calls.push({ url, auth: String((init?.headers as Record<string, string>)?.authorization) });
  return new Response(JSON.stringify({ photos: [photo(10), photo(11), { ...photo(12), src: { original: "https://evil.example/x.jpg" } }] }), { status: 200 });
};
const p = await search(fake, "pine forest", "9:16", new Set([10]));
assert.equal(p?.id, 11);
const u = new URL(calls[0].url);
assert.equal(u.host, "api.pexels.com");
assert.equal(u.searchParams.get("orientation"), "portrait");
assert.equal(u.searchParams.get("query"), "pine forest");
assert.equal(calls[0].auth, "test-key");
assert.equal(await search(fake, "x", "1:1", new Set([10, 11])), null); // the off-site one is never used
await assert.rejects(search(async () => new Response("", { status: 429 }), "x", "16:9", new Set()));
console.log("stock ok");
