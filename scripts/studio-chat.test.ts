// callChat and callClaude against a stand-in Claude API: model, effort and
// speed settings, fallbacks, and cut-off replies.
// retried once with more room, and a reply that still can't be read comes
// back with a reason instead of failing silently.
//   npx tsx scripts/studio-chat.test.ts
import { createServer } from "node:http";
import assert from "node:assert/strict";

type Canned = { text: string; stop: string; status?: number };
let queue: Canned[] = [];
const seen: number[] = [];
const bodies: any[] = [];

const server = createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const b = JSON.parse(body);
    seen.push(b.max_tokens);
    bodies.push({ ...b, beta: req.headers["anthropic-beta"] });
    const c = queue.shift() ?? { text: "", stop: "end_turn" };
    res.setHeader("content-type", "application/json");
    if (c.status) {
      res.statusCode = c.status;
      res.end(JSON.stringify({ type: "error", error: { type: c.status === 529 ? "overloaded_error" : "invalid_request_error", message: "stand-in error" } }));
      return;
    }
    res.end(
      JSON.stringify({
        id: "msg_test",
        type: "message",
        role: "assistant",
        model: "claude-opus-5-5",
        content: [{ type: "text", text: c.text }],
        stop_reason: c.stop,
        stop_sequence: null,
        usage: { input_tokens: 4, output_tokens: c.stop === "max_tokens" ? 6000 : 120, cache_read_input_tokens: 10, cache_creation_input_tokens: 0 },
      }),
    );
  });
});

await new Promise<void>((r) => server.listen(0, r));
const port = (server.address() as { port: number }).port;
process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${port}`;
process.env.ANTHROPIC_API_KEY = "test";
const { callChat, CHAT_MAX_TOKENS } = await import("../api/_studio/chat.js");

const good = JSON.stringify({ reply: "Starting the remake now.", action: "replicate", brief: "Remake the attached clip for Goblin…", title: "Attach References", aspect: "16:9", music: "none", photos: [] });
const cut = good.slice(0, 40);

// 1. Cut off, then fits with more room.
queue = [{ text: cut, stop: "max_tokens" }, { text: good, stop: "end_turn" }];
seen.length = 0;
let r = await callChat("system", [{ role: "user", content: "Go" }]);
assert.equal(r.out?.action, "replicate");
assert.deepEqual(seen, [CHAT_MAX_TOKENS, 16000]);
assert.equal(r.usage.outputTokens, 6120, "usage adds up across both calls");
assert.equal(r.usage.cacheRead, 20);
console.log("ok: cut-off reply retried with more room");

// 2. Cut off twice: a clear reason, one retry only.
queue = [{ text: cut, stop: "max_tokens" }, { text: cut, stop: "max_tokens" }];
seen.length = 0;
r = await callChat("system", [{ role: "user", content: "Go" }]);
assert.equal(r.out, null);
assert.equal(seen.length, 2);
assert.match(r.error ?? "", /cut off at max_tokens \(16000\)/);
console.log("ok: still cut off -> reason given:", r.error);

// 3. Unreadable for another reason: no retry, reason given.
queue = [{ text: "not json", stop: "end_turn" }];
seen.length = 0;
r = await callChat("system", [{ role: "user", content: "hi" }]);
assert.equal(r.out, null);
assert.equal(seen.length, 1);
assert.match(r.error ?? "", /wasn't valid JSON \(stop: end_turn/);
console.log("ok: bad JSON -> no retry, reason given");

// 4. Normal short reply: one call at the new limit.
queue = [{ text: good, stop: "end_turn" }];
seen.length = 0;
r = await callChat("system", [{ role: "user", content: "hi" }]);
assert.ok(r.out);
assert.deepEqual(seen, [CHAT_MAX_TOKENS]);
assert.equal(bodies.at(-1).model, "claude-fable-5-2");
assert.equal(bodies.at(-1).output_config.effort, "low");
assert.equal(bodies.at(-1).speed, undefined, "chat runs at standard speed");
assert.equal(r.model, "claude-fable-5-2");
console.log("ok: normal reply on Fable 5.2, low effort, single call at", CHAT_MAX_TOKENS);

// 5. Fable rejects the request -> retried once on the fallback model.
queue = [{ text: "", stop: "", status: 400 }, { text: good, stop: "end_turn" }];
bodies.length = 0;
r = await callChat("system", [{ role: "user", content: "hi" }]);
assert.ok(r.out);
assert.deepEqual(bodies.map((b) => b.model), ["claude-fable-5-2", "claude-opus-5-5"]);
assert.equal(r.model, "claude-opus-5-5", "the model actually used is reported");
console.log("ok: 400 from Fable -> answered by", r.model);

// 6. Template builds: fast mode, medium effort, 64k; 529 in fast mode -> standard speed.
const { callClaude, BUILD_MAX_TOKENS } = await import("../api/_studio/claude.js");
const tpl = JSON.stringify({ title: "T", outcome: "o", category: "Launch", tags: [], durationSeconds: 5, fields: [], code: "export default () => null" });
const sse = (text: string) =>
  [
    ["message_start", { type: "message_start", message: { id: "m", type: "message", role: "assistant", model: "claude-fable-5-2", content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 4, output_tokens: 1 } } }],
    ["content_block_start", { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } }],
    ["content_block_delta", { type: "content_block_delta", index: 0, delta: { type: "text_delta", text } }],
    ["content_block_stop", { type: "content_block_stop", index: 0 }],
    ["message_delta", { type: "message_delta", delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: 900 } }],
    ["message_stop", { type: "message_stop" }],
  ].map(([e, d]) => `event: ${e}\ndata: ${JSON.stringify(d)}\n\n`).join("");
server.removeAllListeners("request");
let streamQueue: (number | string)[] = [];
const streamBodies: any[] = [];
server.on("request", (req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    streamBodies.push({ ...JSON.parse(body), beta: req.headers["anthropic-beta"] });
    const next = streamQueue.shift();
    if (typeof next === "number") {
      res.statusCode = next;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ type: "error", error: { type: "overloaded_error", message: "stand-in overload" } }));
      return;
    }
    res.setHeader("content-type", "text/event-stream");
    res.end(next);
  });
});
// The SDK retries a 529 twice itself; after that Goblin drops to standard speed.
streamQueue = [529, 529, 529, sse(tpl)];
let progress = 0;
const t = await callClaude([{ role: "user", content: "build" }], (n) => (progress = n));
assert.equal(t.input?.title, "T");
assert.equal(streamBodies[0].speed, "fast");
assert.equal(streamBodies[0].beta, "fast-mode-2026-02-01");
assert.equal(streamBodies[0].output_config.effort, "medium");
assert.equal(streamBodies[0].max_tokens, BUILD_MAX_TOKENS);
assert.equal(streamBodies.length, 4);
assert.deepEqual(streamBodies.slice(0, 3).map((b) => b.speed), ["fast", "fast", "fast"]);
assert.equal(streamBodies[3].speed, undefined, "then retried at standard speed");
assert.equal(streamBodies[3].model, "claude-fable-5-2");
assert.equal(t.model, "claude-fable-5-2");
assert.ok(progress > 0);
console.log("ok: build asks for fast mode at medium effort; 529 -> standard speed on Fable");

server.close();
