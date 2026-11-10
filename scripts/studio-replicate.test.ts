// Checks for remaking a reference video that need no network: the breakdown
// agent's progress and files, cleaning its JSON, and the spec it becomes.
//   npx tsx scripts/studio-replicate.test.ts
import assert from "node:assert/strict";
import fs from "node:fs";
import { breakdownMessage, progress } from "../api/_studio/videos.ts";
import { cleanBreakdown, remakeSpec, MAX_REMAKE_SECONDS } from "../api/_studio/replicate.ts";

// the message: the link, and a trimmed clip's part
const clip = { ref: "media:11111111-2222-4333-8444-555555555555#t=2,9", use: "reference" as const, kind: "video" as const, mime: "video/mp4", name: "ad.mp4", width: 576, height: 1024, durationSeconds: 19, meta: {}, pathname: "p", preview: null };
const m = breakdownMessage(clip, "https://x.private.blob.vercel-storage.com/a?sig=1");
assert.ok(m.startsWith("[From Goblin: break down") && m.includes("from 2.00 s to 9.00 s") && m.endsWith("sig=1"));
assert.ok(!breakdownMessage({ ...clip, ref: "media:11111111-2222-4333-8444-555555555555" }, "u").includes("Only study"));

// progress: status lines become steps; done only once breakdown.json exists
const T = Date.parse("2026-11-09T12:00:00Z");
const ev = (type: string, extra = {}, s = 1) => ({ id: String(Math.random()), type, processed_at: new Date(T + s * 1000).toISOString(), ...extra });
const say = (text: string, s: number) => ev("agent.message", { content: [{ type: "text", text }] }, s);
const events = [ev("user.message", {}, 0), say("Downloading the reference", 2), say("Finding every cut", 10)];
let p = progress(events, { id: "s", status: "running" }, [], T, T + 20_000, "breakdown");
assert.equal(p.status, "running");
assert.deepEqual(p.steps.map((s) => [s.label, s.state]), [["Got the reference", "done"], ["Downloading the reference", "done"], ["Finding every cut", "active"]]);
const file = (filename: string, s = 300) => ({ id: `file_${filename}`, filename, created_at: new Date(T + s * 1000).toISOString() });
const finished = [...events, say("A 19-second montage: 150 cuts.", 300), ev("session.status_idle", { stop_reason: { type: "end_turn" } }, 301)];
const files = [file("ref-10.jpg"), file("ref-02.jpg"), file("shots-2.jpg"), file("shots-1.jpg"), file("cards.jpg"), file("breakdown.json"), file("old.mp4", -100)];
p = progress(finished, { id: "s", status: "idle" }, files, T, T + 310_000, "breakdown");
assert.equal(p.status, "done");
assert.equal(p.breakdown?.json, "file_breakdown.json");
assert.deepEqual(p.breakdown?.shots, ["file_shots-1.jpg", "file_shots-2.jpg"]);
assert.deepEqual(p.breakdown?.refs, ["file_ref-02.jpg", "file_ref-10.jpg"]);
assert.equal(p.message, "A 19-second montage: 150 cuts.");
// idle with no breakdown.json: fails after the grace period, not before
p = progress(finished, { id: "s", status: "idle" }, [file("cards.jpg")], T, T + 310_000, "breakdown");
assert.equal(p.status, "running");
p = progress(finished, { id: "s", status: "idle" }, [file("cards.jpg")], T, T + 400_000, "breakdown");
assert.equal(p.status, "failed");
assert.ok(p.message?.startsWith("Couldn't finish studying the reference."));

// cleaning: a real breakdown passes; junk doesn't
const real = cleanBreakdown(JSON.parse(fs.readFileSync(new URL("./studio-fixtures/breakdown-strobe.json", import.meta.url), "utf8")))!;
assert.ok(real);
assert.equal(real.shots.length, 150);
assert.equal(real.aspect, "9:16");
assert.equal(real.compare?.length, 12);
assert.equal(cleanBreakdown(null), null);
assert.equal(cleanBreakdown({ duration: 5, shots: [], cards: [{ code: "A", description: "x" }] }), null);
const odd = cleanBreakdown({ fps: 25, duration: 120, aspect: "4:3", shots: [{ start: 50, end: 25, card: "A" }, { start: 0, end: 25, card: "A", mods: "*" }, { start: 25, end: 3000, card: "B" }], cards: [{ code: "A", description: "a" }, { code: "B", description: "<b>" }], audio: { bpm: 999, beats: [1, -2, "x"] } })!;
assert.equal(odd.shots.length, 2); // the backwards shot is dropped
assert.equal(odd.aspect, "9:16");
assert.equal(odd.audio?.bpm, null);
assert.deepEqual(odd.audio?.beats, [1]);

// the spec: 30 fps frames, capped length, the shot list as one string
const spec = remakeSpec(real);
assert.equal(spec.seconds, 19);
assert.ok(spec.text.includes("570 frames at 30 fps") && spec.text.includes("150 shots") && spec.text.startsWith("Remake the FORMAT"));
assert.ok(spec.text.includes("0:A 3:-o 6:A 9:E*"));
const long = remakeSpec(odd);
assert.equal(long.seconds, MAX_REMAKE_SECONDS);
assert.ok(long.text.includes("0:A* 30:B") && long.text.includes("remake its first 30 s"));
console.log("studio replicate checks passed");
