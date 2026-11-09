// Checks for the user-media pieces that don't need a browser or a database:
// media refs, the template check's rule for <Media src>, and the snapshot
// validation of media fields.
//   npx tsx scripts/studio-media.test.ts
import assert from "node:assert/strict";
import { checkTemplate } from "../api/_studio/check.ts";
import { toSnapshot } from "../api/_studio/pipeline.ts";
import { mediaIdsIn, mediaRef, parseMediaRef } from "../src/library/media.ts";

const ID = "11111111-2222-4333-8444-555555555555";

// refs
assert.deepEqual(parseMediaRef(`media:${ID}`), { id: ID, start: null, end: null });
assert.deepEqual(parseMediaRef(`media:${ID}#t=2.5,9`), { id: ID, start: 2.5, end: 9 });
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

console.log("studio media checks passed");
