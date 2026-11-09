// Creates (or updates) Goblin Editor: a Managed Agent on Opus 5.5 with its own
// cloud computer (ffmpeg, faster-whisper, OpenCV, audio tools, fonts). Run once,
// then set GOBLIN_EDITOR_AGENT_ID and GOBLIN_EDITOR_ENVIRONMENT_ID in Vercel.
//   npx tsx scripts/setup-editor-agent.ts            create both
//   npx tsx scripts/setup-editor-agent.ts --update   push a new system prompt to the existing agent
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

const system = fs.readFileSync(path.join(import.meta.dirname, "../agents/editor.md"), "utf8");
const MODEL = process.env.GOBLIN_EDITOR_MODEL || "claude-opus-5-5";

if (process.argv.includes("--update")) {
  const id = process.env.GOBLIN_EDITOR_AGENT_ID;
  if (!id) throw new Error("Set GOBLIN_EDITOR_AGENT_ID");
  const cur = await call(`/agents/${id}`, "GET");
  const a = await call(`/agents/${id}`, "POST", { version: cur.version, system, model: MODEL });
  console.log("updated agent", a.id, "version", a.version);
} else {
  const env = await call("/environments", "POST", {
    name: "goblin-editor",
    config: {
      type: "cloud",
      packages: {
        apt: ["fonts-inter", "fonts-noto-color-emoji"],
        pip: ["faster-whisper", "opencv-python-headless", "scipy", "soundfile", "noisereduce", "pyloudnorm", "Pillow"],
      },
      networking: {
        type: "limited",
        allow_package_managers: true,
        // the user's files (presigned links), speech models, brand fonts
        allowed_hosts: ["*.blob.vercel-storage.com", "huggingface.co", "*.huggingface.co", "*.hf.co", "fonts.googleapis.com", "fonts.gstatic.com"],
      },
    },
  });
  console.log("environment", env.id);
  const agent = await call("/agents", "POST", {
    name: "Goblin Editor",
    description: "Edits users' footage, photos and music for Goblin (usegoblin.xyz): cuts, captions, reframing, audio cleanup and mixing, colour.",
    model: MODEL,
    system,
    tools: [{ type: "agent_toolset_20260401", default_config: { enabled: true } }],
  });
  console.log("agent", agent.id, "version", agent.version);
}
