// Checks for the user-media pieces that don't need a browser or a database:
// media refs, the template check's rule for <Media src>, and the snapshot
// validation of media fields.
//   npx tsx scripts/studio-media.test.ts
import assert from "node:assert/strict";
import { checkTemplate } from "../api/_studio/check.ts";
import { toSnapshot } from "../api/_studio/pipeline.ts";
import { mediaIdsIn, mediaRef, parseMediaRef, setMediaResolver, withMix } from "../src/library/media.ts";
import { beats, beatPulse, downbeats, bpmOf, hasMusic } from "../src/library/motion.tsx";
import { htmlToText, linksIn } from "../api/_studio/refs.ts";

const ID = "11111111-2222-4333-8444-555555555555";

// refs
const none = { volume: null, fadeIn: null, fadeOut: null, loop: null, duck: null };
assert.deepEqual(parseMediaRef(`media:${ID}`), { id: ID, start: null, end: null, ...none });
assert.deepEqual(parseMediaRef(`media:${ID}#t=2.5,9`), { id: ID, start: 2.5, end: 9, ...none });
// music settings ride along in the ref
const mix = parseMediaRef(`media:${ID}#t=12,&v=0.6&fi=1&fo=2.5&loop=0&duck=0.3`);
assert.deepEqual(mix, { id: ID, start: 12, end: null, volume: 0.6, fadeIn: 1, fadeOut: 2.5, loop: false, duck: 0.3 });
assert.equal(parseMediaRef(`media:${ID}#v=7`)?.volume, 1, "volume is capped at 1");
assert.equal(parseMediaRef(`media:${ID}#evil=1`), null, "unknown settings are rejected");
assert.equal(withMix(`media:${ID}#t=12,&v=0.6`, { volume: 0.9 }), `media:${ID}#t=12,&v=0.9`);
assert.equal(withMix(`media:${ID}#v=0.6`, { start: 4, loop: true }), `media:${ID}#t=4,&v=0.6&loop=1`);
assert.equal(parseMediaRef(`media:${ID}#t=9,2`)?.end, null, "an end before the start is dropped");
assert.equal(parseMediaRef("media:not-an-id"), null);
assert.equal(parseMediaRef("https://example.com/a.jpg"), null);
assert.equal(mediaRef(ID, { start: 1.234, end: 5 }), `media:${ID}#t=1.23,5`);
assert.deepEqual(mediaIdsIn({ a: `media:${ID}#t=1,2`, b: "hello", c: `media:${ID}` }), [ID]);

const tpl = (body: string) => `import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Media, hasMedia, palette, nameOf, fontOf, useT } from "../../motion";
type C = { photo: string };
export default function T({ brand: b, content: c }: TemplateProps<C>) {
  const pal = palette(b);
  const { t } = useT();
  return <AbsoluteFill style={{ background: pal.bg, fontFamily: fontOf(b), opacity: Math.min(1, t) }}>${body}<div style={{ color: pal.fg }}>{nameOf(b)}</div></AbsoluteFill>;
}`;
const srcProblems = (code: string) => checkTemplate(code).filter((p) => /src|URL/.test(p));
assert.deepEqual(srcProblems(tpl(`{hasMedia(c.photo) && <Media src={c.photo} />}`)), [], "<Media src={c.photo}> is allowed");
assert.ok(srcProblems(tpl(`<Media src="https://x.com/a.jpg" />`)).length > 0, "a literal URL in Media is rejected");
assert.ok(srcProblems(tpl(`<Media src={"media:abc"} />`)).length > 0, "a literal string in Media is rejected");
assert.ok(srcProblems(tpl(`<img src={c.photo} />`)).length > 0, "src on other elements is still rejected");

// snapshot validation
const input = (fieldDefault: string) => ({
  title: "Quote", outcome: "A quote on a photo", category: "Social", tags: [], durationSeconds: 8,
  fields: [{ key: "photo", label: "Background photo", type: "media" as const, hint: "", default: fieldDefault }],
  code: tpl(`{hasMedia(c.photo) && <Media src={c.photo} />}`),
});
const ok = toSnapshot(input(`media:${ID}`), 1080, 1920);
assert.deepEqual(ok.problems, []);
assert.equal(ok.snapshot?.fields[0].type, "media");
assert.equal(ok.snapshot?.defaults.photo, `media:${ID}`);
assert.ok(toSnapshot(input("sunset.jpg"), 1080, 1920).problems.some((p) => /media ref/.test(p)), "a media field must default to a ref");
assert.deepEqual(toSnapshot(input(""), 1080, 1920).problems, [], "an empty media field is fine");

// beat helpers follow the start point and looping
setMediaResolver((id) => (id === ID ? { url: "blob:x", kind: "audio", durationSeconds: 8, meta: { bpm: 120, beats: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5], downbeats: [0, 2, 4, 6] } } : null));
assert.ok(hasMusic(`media:${ID}`));
assert.equal(bpmOf(`media:${ID}`), 120);
assert.deepEqual(beats(`media:${ID}#t=1,3&loop=0`), [0, 0.5, 1, 1.5]);
assert.deepEqual(downbeats(`media:${ID}#t=1,`).slice(0, 4), [1, 3, 5, 8], "starting at 1 s shifts the bars, then the 7 s segment loops");
assert.ok(Math.abs(beatPulse(0.5, `media:${ID}`) - 1) < 1e-9 && beatPulse(0.7, `media:${ID}`) < 0.4);
assert.deepEqual(beats(""), []);
assert.equal(beatPulse(1, undefined), 0);

// links and pages
assert.deepEqual(linksIn("see https://tidybox.app/launch, and (https://x.com/a/status/1)."), ["https://tidybox.app/launch", "https://x.com/a/status/1"]);
const page = htmlToText(`<html><head><title>Tidybox &amp; you</title><meta name="description" content="Shared inboxes for small teams"><style>.a{}</style></head><body><nav>Menu</nav><h1>One inbox</h1><p>Every reply,<br>one place.</p><script>alert(1)</script></body></html>`);
assert.equal(page.title, "Tidybox & you");
assert.ok(page.text.includes("Shared inboxes for small teams") && page.text.includes("One inbox") && !page.text.includes("alert"));

console.log("studio media checks passed");
