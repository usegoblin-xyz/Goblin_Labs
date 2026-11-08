// End-to-end test of the studio API against a real Postgres with a fake
// Claude. Needs DATABASE_URL pointing at a database with db/studio.sql
// applied and users u_obi / u_other in better_auth."user".
//   DATABASE_URL=... STUDIO_DB_NO_SSL=1 npx tsx scripts/studio-api.test.ts
import fs from "node:fs";
import assert from "node:assert/strict";
import type { CallClaude, ToolInput } from "../api/_studio/claude.ts";

process.env.STUDIO_DAILY_LIMIT = "3";
const { makeHandler: makeGen } = await import("../api/_studio/generate.ts");
const { makeHandler: makeTpl } = await import("../api/_studio/templates.ts");
const { db } = await import("../api/_studio/db.ts");
const { makeHandler: makeChat, toMessages } = await import("../api/_studio/chat.ts");

const [goodFile, badFile] = process.argv.length > 3 ? process.argv.slice(2) : ["scripts/studio-fixtures/good.tsx", "scripts/studio-fixtures/bad.tsx"];
const good = fs.readFileSync(goodFile, "utf8");
const bad = fs.readFileSync(badFile, "utf8");
const meta = (code: string, title = "Launch Checklist"): ToolInput => ({
  title, outcome: "Tick off three features, then go live", category: "Launch", tags: ["launch", "checklist"], durationSeconds: 9,
  fields: [
    { key: "product", label: "Product name", type: "text", hint: "", default: "Notewise" },
    { key: "features", label: "Three features", type: "text", hint: "Comma separated", default: "Records every call, Writes the summary, Sends the follow-ups" },
    { key: "cta", label: "Call to action", type: "text", hint: "", default: "Live today" },
  ],
  code,
});

// A fake Claude that plays back a script of answers and records what it was sent.
function fake(answers: (ToolInput | "refuse")[]) {
  const sent: unknown[][] = [];
  const call: CallClaude = async (messages, onChars) => {
    sent.push(structuredClone(messages));
    const a = answers.shift();
    if (!a) throw new Error("fake Claude ran out of answers");
    for (let n = 500; n <= 4000; n += 500) onChars(n);
    const usage = { inputTokens: 1200, outputTokens: 3000, cacheRead: 11000, cacheWrite: 0 };
    if (a === "refuse") return { input: null, raw: "", stop: "refusal", usage };
    return { input: a, raw: JSON.stringify(a), stop: "end_turn", usage };
  };
  return { call, sent };
}

function mockRes() {
  const r = { statusCode: 200, headers: {} as Record<string, string>, body: "", json: undefined as unknown, ended: false };
  const res = {
    get statusCode() { return r.statusCode; },
    set statusCode(v: number) { r.statusCode = v; },
    status(c: number) { r.statusCode = c; return res; },
    json(b: unknown) { r.json = b; r.ended = true; return res; },
    setHeader(k: string, v: string) { r.headers[k.toLowerCase()] = v; },
    write(s: string) { r.body += s; return true; },
    end() { r.ended = true; },
  };
  return { res: res as never, r };
}
const req = (method: string, body?: object, query: Record<string, string> = {}) => ({ method, body, query, headers: {} }) as never;
const as = (u: string | null) => async () => u;
const events = (body: string) => body.trim().split("\n").map((l) => JSON.parse(l));

async function gen(user: string | null, call: CallClaude, body: object) {
  const { res, r } = mockRes();
  await makeGen({ call, userId: as(user) })(req("POST", body), res);
  return { status: r.statusCode, json: r.json as { error?: string } | undefined, ev: r.body ? events(r.body) : [] };
}
async function tpl(user: string | null, method: string, body?: object, query?: Record<string, string>) {
  const { res, r } = mockRes();
  await makeTpl(as(user))(req(method, body, query), res);
  return { status: r.statusCode, json: r.json as Record<string, any> };
}

await db().query("delete from studio.generations; delete from studio.templates;");
let pass = 0;
const ok = (name: string) => { pass++; console.log("  ✓", name); };

// 1. Create: the first answer breaks the rules, the fix passes.
{
  const f = fake([meta(bad), meta(good)]);
  const out = await gen("u_obi", f.call, { mode: "create", prompt: "A launch video for Notewise with three features", aspect: "16:9" });
  assert.equal(out.status, 200);
  const kinds = out.ev.map((e) => (e.type === "stage" ? `${e.stage}` : e.type)).filter((k) => k !== "progress");
  assert.deepEqual(kinds, ["writing", "checking", "fixing", "checking", "done"]);
  const fixing = out.ev.find((e) => e.stage === "fixing");
  assert.ok(fixing.problems.some((p: string) => p.includes("#101010")), "fix stage lists the colour problem");
  assert.ok(fixing.problems.some((p: string) => p.includes("nameOf")), "fix stage lists the brand-name problem");
  const second = f.sent[1] as any[];
  assert.equal(second.length, 3, "fix is asked in the same conversation");
  assert.equal(second[1].role, "assistant");
  assert.ok(String(second[1].content).includes("#101010"), "the failed answer is sent back");
  assert.equal(second[2].role, "user");
  assert.ok(String(second[2].content).includes("#101010"), "with the problems listed");
  const progress = out.ev.filter((e) => e.type === "progress").length;
  assert.ok(progress > 0 && progress <= 20, `progress throttled (${progress})`);
  const t = out.ev.at(-1).template;
  assert.equal(t.width, 1920); assert.equal(t.height, 1080); assert.equal(t.durationInFrames, 270); assert.equal(t.version, 1);
  assert.ok(t.compiled.includes("require(\"../../motion\")"), "compiled to CommonJS");
  assert.equal(t.defaults.product, "Notewise");
  const g = await db().query("select kind, ok from studio.generations order by id");
  assert.deepEqual(g.rows, [{ kind: "create", ok: false }, { kind: "fix", ok: true }]);
  ok("create → automatic fix → saved v1, both calls logged");
  globalThis.T = t;
}
const T = (globalThis as any).T;

// 2. Edit makes v2 and sends the current code with the request.
{
  const f = fake([meta(good.replace('"Live today"', '"Out now"'), "Launch Checklist")]);
  const out = await gen("u_obi", f.call, { mode: "edit", id: T.id, instruction: "Change the call to action to Out now" });
  assert.equal(out.ev.at(-1).type, "done");
  assert.equal(out.ev.at(-1).template.version, 2);
  const first = String((f.sent[0] as any[])[0].content);
  assert.ok(first.includes("Change the call to action to Out now") && first.includes("export default function LaunchChecklist"));
  assert.ok(first.includes("Canvas: 1920x1080"));
  ok("edit → v2, request carries the current code and the change");
}

// 3. Preview repair makes v3 and doesn't count toward the daily limit.
{
  const f = fake([meta(good)]);
  const out = await gen("u_obi", f.call, { mode: "repair", id: T.id, error: "TypeError: Cannot read properties of undefined (reading 'deep')" });
  assert.equal(out.ev.at(-1).template.version, 3);
  assert.ok(String((f.sent[0] as any[])[0].content).includes("reading 'deep'"));
  ok("preview repair → v3");
}

// 4. Other users can't see, edit, restore or delete it.
{
  assert.equal((await gen("u_other", fake([]).call, { mode: "edit", id: T.id, instruction: "x" })).status, 404);
  assert.equal((await tpl("u_other", "GET", undefined, { id: T.id })).status, 404);
  assert.equal((await tpl("u_other", "POST", { id: T.id, restore: 1 })).status, 404);
  assert.equal((await tpl("u_other", "DELETE", undefined, { id: T.id })).status, 404);
  assert.equal((await tpl("u_other", "GET")).json.templates.length, 0);
  ok("templates are private to their owner");
}

// 5. Signed out, bad input, refusal.
{
  assert.equal((await gen(null, fake([]).call, { mode: "create", prompt: "anything at all", aspect: "16:9" })).status, 401);
  assert.equal((await tpl(null, "GET")).status, 401);
  assert.equal((await gen("u_obi", fake([]).call, { mode: "create", prompt: "hi", aspect: "16:9" })).status, 400);
  assert.equal((await gen("u_obi", fake([]).call, { mode: "nope" })).status, 400);
  const r = await gen("u_obi", fake(["refuse"]).call, { mode: "create", prompt: "Something Claude declines to make", aspect: "9:16" });
  assert.equal(r.ev.at(-1).type, "error");
  assert.match(r.ev.at(-1).message, /declined/);
  ok("401 signed out, 400 bad input, refusal reported");
}

// 6. Gives up after two failed fixes, with the problems listed.
{
  const r = await gen("u_other", fake([meta(bad), meta(bad), meta(bad)]).call, { mode: "create", prompt: "A square stat video for our 10k users", aspect: "1:1" });
  const last = r.ev.at(-1);
  assert.equal(last.type, "error");
  assert.ok(last.problems.length >= 2);
  assert.equal(r.ev.filter((e) => e.stage === "fixing").length, 2);
  const n = await db().query("select count(*)::int n from studio.templates where user_id = 'u_other'");
  assert.equal(n.rows[0].n, 0, "nothing saved");
  ok("stops after 2 fixes, saves nothing");
}

// 7. Daily limit (3): u_obi has used create + edit + the refused create = 3.
{
  const r = await gen("u_obi", fake([meta(good)]).call, { mode: "create", prompt: "One more launch video please", aspect: "16:9" });
  assert.equal(r.status, 429);
  const rep = await gen("u_obi", fake([meta(good)]).call, { mode: "repair", id: T.id, error: "Error: again" });
  assert.equal(rep.ev.at(-1).type, "done", "repairs still work at the limit");
  ok("daily limit blocks create/edit but not repairs");
}

// 8. Repairs are capped per template.
{
  const third = await gen("u_obi", fake([meta(good)]).call, { mode: "repair", id: T.id, error: "Error: 3" });
  assert.equal(third.ev.at(-1).type, "done", "third repair allowed");
  const r = await gen("u_obi", fake([meta(good)]).call, { mode: "repair", id: T.id, error: "Error: 4" });
  assert.equal(r.status, 429);
  ok("preview repairs capped at 3 per 15 minutes; in-request fixes don't count");
}

// 9. List, get with versions, restore, delete.
{
  const list = await tpl("u_obi", "GET");
  assert.equal(list.json.templates.length, 1);
  const one = await tpl("u_obi", "GET", undefined, { id: T.id });
  assert.equal(one.json.template.version, 5);
  assert.deepEqual(one.json.versions.map((v: any) => v.version), [5, 4, 3, 2, 1]);
  assert.equal(one.json.versions.at(-1).instruction, "A launch video for Notewise with three features");
  const restored = await tpl("u_obi", "POST", { id: T.id, restore: 2 });
  assert.equal(restored.json.template.version, 6);
  assert.ok(restored.json.template.code.includes('"Out now"'));
  assert.equal(restored.json.versions[0].instruction, "Restored version 2");
  assert.equal((await tpl("u_obi", "DELETE", undefined, { id: T.id })).status, 200);
  assert.equal((await tpl("u_obi", "GET")).json.templates.length, 0);
  const v = await db().query("select count(*)::int n from studio.template_versions");
  assert.equal(v.rows[0].n, 0, "versions deleted with the template");
  const g = await db().query("select count(*)::int n from studio.generations where template_id is null and user_id='u_obi'");
  assert.ok(g.rows[0].n >= 2, "generation log kept, unlinked");
  ok("list, versions, restore, delete (cascade)");
}

// 9b. Chat: talks without building, builds only when the reply says so, logs as chat.
{
  const replies: any[] = [];
  const fakeChat = (out: any) => async (system: string, messages: any[]) => {
    replies.push({ system, messages });
    return { out, usage: { inputTokens: 5, outputTokens: 7, cacheRead: 0, cacheWrite: 0 } };
  };
  const chat = async (user: string | null, out: any, body: object) => {
    const { res, r } = mockRes();
    await makeChat({ call: fakeChat(out), userId: as(user), configured: () => true })(req("POST", body), res);
    return { status: r.statusCode, json: r.json as Record<string, any> };
  };
  assert.equal((await chat(null, null, { messages: [{ role: "user", text: "hi" }] })).status, 401);
  assert.equal((await chat("u_other", null, { messages: [] })).status, 400);
  const talk = await chat("u_other", { reply: "Hey! What are you launching?", action: "chat", brief: "ignored", aspect: "none" }, { messages: [{ role: "user", text: "hey" }], aspect: "9:16", brand: "Notewise" });
  assert.equal(talk.status, 200);
  assert.deepEqual(talk.json, { reply: "Hey! What are you launching?", action: "chat", brief: "", aspect: "9:16" });
  assert.match(replies.at(-1).system, /Notewise/);
  // "change" with no template becomes a build; a too-short brief stays chat.
  const b = await chat("u_other", { reply: "On it.", action: "change", brief: "A launch video with three features", aspect: "1:1" }, { messages: [{ role: "user", text: "build it" }] });
  assert.equal(b.json.action, "build");
  assert.equal(b.json.aspect, "1:1");
  assert.equal((await chat("u_other", { reply: "On it.", action: "build", brief: "x", aspect: "none" }, { messages: [{ role: "user", text: "go" }] })).json.action, "chat");
  // A broken reply is a clean 502.
  assert.equal((await chat("u_other", null, { messages: [{ role: "user", text: "hi" }] })).status, 502);
  // History is cleaned up: alternating roles, starting with the user.
  assert.deepEqual(toMessages([{ role: "assistant", text: "a" }, { role: "user", text: "b" }, { role: "user", text: "c" }, { role: "assistant", text: "" }, { role: "x", text: "y" }]), [{ role: "user", content: "b\n\nc" }]);
  const logs = await db().query("select count(*)::int n from studio.generations where user_id='u_other' and kind='chat'");
  assert.equal(logs.rows[0].n, 4);
  ok("chat replies, build decisions and logging");
}

// 10. Deleting the account removes everything.
{
  await db().query("delete from better_auth.\"user\" where id = 'u_other'");
  const g = await db().query("select count(*)::int n from studio.generations where user_id='u_other'");
  assert.equal(g.rows[0].n, 0);
  await db().query("insert into better_auth.\"user\" values ('u_other','Other','o@example.com')");
  ok("account deletion cascades to templates and logs");
}

console.log(`\n${pass} groups passed`);
await db().end();
