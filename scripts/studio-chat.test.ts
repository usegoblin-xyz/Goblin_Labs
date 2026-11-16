// callChat against a stand-in Claude API: a reply cut off at max_tokens is
// retried once with more room, and a reply that still can't be read comes
// back with a reason instead of failing silently.
//   npx tsx scripts/studio-chat.test.ts
import { createServer } from "node:http";
import assert from "node:assert/strict";

type Canned = { text: string; stop: string };
let queue: Canned[] = [];
const seen: number[] = [];

const server = createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    seen.push(JSON.parse(body).max_tokens);
    const c = queue.shift() ?? { text: "", stop: "end_turn" };
    res.setHeader("content-type", "application/json");
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
assert.deepEqual(seen, [6000]);
console.log("ok: normal reply, single call at", CHAT_MAX_TOKENS);

server.close();
