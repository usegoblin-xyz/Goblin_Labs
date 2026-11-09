// Checks for Goblin Editor's plumbing that need no network: the message it's
// sent, and how its session events become progress steps and output files.
//   npx tsx scripts/studio-editor.test.ts
import assert from "node:assert/strict";
import { describeFile, editorMessage, progress } from "../api/_studio/videos.ts";

const att = (over = {}) => ({ ref: "media:11111111-2222-4333-8444-555555555555#t=2,9", use: "auto" as const, kind: "video" as const, mime: "video/mp4", name: "beach.mov", width: 1920, height: 1080, durationSeconds: 24, meta: {}, pathname: "p", preview: null, ...over });
const line = describeFile(att(), "https://x.private.blob.vercel-storage.com/a?sig=1");
assert.ok(line.includes('"beach.mov"') && line.includes("video clip") && line.includes("2 s to 9 s") && line.endsWith("sig=1"));
assert.ok(describeFile(att({ use: "reference", kind: "image" }), "u").includes("a reference"));
const msg = editorMessage("Add captions", "9:16", { name: "Tidybox", primary: "#8b7bff", font: "inter" }, [line]);
assert.ok(msg.includes("Add captions") && msg.includes("1080×1920") && msg.includes("primary #8b7bff") && msg.includes("Brand font: Inter") && msg.includes(line));
assert.ok(editorMessage("Make it shorter", "9:16", {}, [], true).startsWith("[From Goblin: the user asks for a change"));

const T = Date.parse("2026-11-09T12:00:00Z");
const ev = (type: string, extra = {}, s = 1) => ({ id: String(Math.random()), type, processed_at: new Date(T + s * 1000).toISOString(), ...extra });
const say = (text: string, s: number) => ev("agent.message", { content: [{ type: "text", text }] }, s);
const base = [ev("user.message", {}, 0), say("Downloading your files", 2), say("Transcribing the speech", 10), say("Burning in captions", 40)];
let p = progress(base, { id: "s", status: "running" }, [], T, T + 50_000, "edit");
assert.equal(p.status, "running");
assert.deepEqual(p.steps.map((s) => [s.label, s.state]), [["Got your files", "done"], ["Downloading your files", "done"], ["Transcribing the speech", "done"], ["Burning in captions", "active"]]);
const done = [...base, say("Done. I joined the two clips, added word-by-word captions and mixed the music under your voice.", 90), ev("session.status_idle", { stop_reason: { type: "end_turn" } }, 91)];
const files = [
  { id: "f1", filename: "clip-1.mp4", created_at: new Date(T + 80_000).toISOString() },
  { id: "f2", filename: "tidybox-live.mp4", created_at: new Date(T + 85_000).toISOString() },
  { id: "f3", filename: "captions.srt", created_at: new Date(T + 85_000).toISOString() },
  { id: "f4", filename: "preview.gif", created_at: new Date(T + 86_000).toISOString() },
];
p = progress(done, { id: "s", status: "idle" }, files, T, T + 95_000, "edit");
assert.equal(p.status, "done");
assert.equal(p.files.mp4, "f2", "the main video is the one not called clip-N");
assert.equal(p.files.srt, "f3");
assert.ok(p.message?.startsWith("Done. I joined"));
assert.ok(p.steps.every((s) => s.state === "done") && !p.steps.some((s) => s.label.startsWith("Done.")), "the summary isn't a step");
console.log("studio editor checks passed");
