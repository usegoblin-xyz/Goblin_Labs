// Creates (or updates) Goblin Breakdown: a Managed Agent on Opus 5.5 that
// studies a reference video frame by frame so Goblin can remake its format.
// It runs on Goblin Editor's machine (same environment: ffmpeg, Python, OpenCV).
// Run once, then set GOBLIN_BREAKDOWN_AGENT_ID in Vercel.
//   npx tsx scripts/setup-breakdown-agent.ts            create it
//   npx tsx scripts/setup-breakdown-agent.ts --update   push a new system prompt
import fs from "node:fs";
import path from "node:path";

const BASE = "https://api.anthropic.com/v1";
const headers = { "x-api-key": process.env.ANTHROPIC_API_KEY ?? "", "anthropic-version": "2023-06-01", "anthropic-beta": "managed-agents-2026-04-01", "content-type": "application/json" };
async function call(p: string, method: string, body?: unknown) {
  const r = await fetch(BASE + p, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${p} → ${r.status}: ${t.slice(0, 600)}`);
  return JSON.parse(t);
}

const system = fs.readFileSync(path.join(import.meta.dirname, "../agents/breakdown.md"), "utf8");
const MODEL = process.env.GOBLIN_BREAKDOWN_MODEL || "claude-opus-5-5";

if (process.argv.includes("--update")) {
  const id = process.env.GOBLIN_BREAKDOWN_AGENT_ID;
  if (!id) throw new Error("Set GOBLIN_BREAKDOWN_AGENT_ID");
  const cur = await call(`/agents/${id}`, "GET");
  const a = await call(`/agents/${id}`, "POST", { version: cur.version, system, model: MODEL });
  console.log("updated agent", a.id, "version", a.version);
} else {
  const agent = await call("/agents", "POST", {
    name: "Goblin Breakdown",
    description: "Takes a reference video apart frame by frame (cuts, recurring looks, type, imagery, sound) so Goblin (usegoblin.xyz) can remake its format.",
    model: MODEL,
    system,
    tools: [{ type: "agent_toolset_20260401", default_config: { enabled: true } }],
  });
  console.log("agent", agent.id, "version", agent.version);
}
