// Which Claude model Goblin uses, and how it falls back.
//
// Chat and template building run on Claude Fable 5.2. Fable always thinks
// before it answers (adaptive thinking), and those thinking tokens count
// toward max_tokens, so the limits here leave room for them; effort sets how
// much it thinks. Template building also asks for fast mode, so a long build
// fits in the function's 300 s.
//
// Fallbacks, each tried once and logged:
//   - fast mode out of capacity (429 / 529) -> the same model at standard speed
//   - the model rejects the request itself (400 / 404) -> STUDIO_FALLBACK_MODEL
//
// Settings (all optional):
//   STUDIO_MODEL / STUDIO_CHAT_MODEL       model ids (default claude-fable-5-2)
//   STUDIO_FALLBACK_MODEL                  default claude-opus-5-5
//   STUDIO_BUILD_EFFORT / STUDIO_CHAT_EFFORT   low | medium | high | xhigh | max
//   STUDIO_BUILD_SPEED / STUDIO_CHAT_SPEED     fast | standard
type Effort = "low" | "medium" | "high" | "xhigh" | "max";
type Speed = "fast" | "standard";

const EFFORTS: Effort[] = ["low", "medium", "high", "xhigh", "max"];
const effort = (v: string | undefined, d: Effort): Effort => (EFFORTS.includes(v as Effort) ? (v as Effort) : d);
const speed = (v: string | undefined, d: Speed): Speed => (v === "fast" || v === "standard" ? v : d);

export const FALLBACK_MODEL = process.env.STUDIO_FALLBACK_MODEL || "claude-opus-5-5";
export const BUILD = {
  model: process.env.STUDIO_MODEL || "claude-fable-5-2",
  effort: effort(process.env.STUDIO_BUILD_EFFORT, "medium"),
  speed: speed(process.env.STUDIO_BUILD_SPEED, "fast"),
};
export const CHAT = {
  model: process.env.STUDIO_CHAT_MODEL || process.env.STUDIO_MODEL || "claude-fable-5-2",
  effort: effort(process.env.STUDIO_CHAT_EFFORT, "low"),
  speed: speed(process.env.STUDIO_CHAT_SPEED, "standard"),
};

// Only models that take these options get them.
const takesEffort = (model: string) => /fable|mythos|opus-(4-[5-9]|5)|sonnet-(4-6|5)/.test(model);
const takesFast = (model: string) => /fable-5-2|opus-5|opus-4-8/.test(model);

export type Plan = { model: string; effort: Effort; speed: Speed };

// Request fields and headers for one attempt.
export function requestFor(p: Plan) {
  const fast = p.speed === "fast" && takesFast(p.model);
  return {
    model: p.model,
    ...(fast ? { speed: "fast" as const } : {}),
    effort: takesEffort(p.model) ? p.effort : undefined,
    headers: fast ? { "anthropic-beta": "fast-mode-2026-02-01" } : undefined,
  };
}

const status = (e: unknown) => (e && typeof e === "object" && "status" in e ? Number((e as { status: unknown }).status) : 0);

// The next plan to try after `e`, or null to give up.
export function nextPlan(p: Plan, e: unknown): Plan | null {
  const s = status(e);
  if (p.speed === "fast" && (s === 429 || s === 529)) return { ...p, speed: "standard" };
  if ((s === 400 || s === 404) && p.model !== FALLBACK_MODEL) return { model: FALLBACK_MODEL, effort: p.effort, speed: "standard" };
  return null;
}

// Run `attempt` with each plan in turn until one works.
export async function withFallbacks<T>(first: Plan, label: string, attempt: (p: Plan) => Promise<T>): Promise<T & { used: Plan }> {
  let plan = first;
  for (;;) {
    try {
      return { ...(await attempt(plan)), used: plan };
    } catch (e) {
      const next = nextPlan(plan, e);
      if (!next) throw e;
      console.error(`[studio ${label}] ${plan.model} (${plan.speed}) failed with ${status(e)}: ${(e as Error).message.slice(0, 300)}; retrying on ${next.model} (${next.speed})`);
      plan = next;
    }
  }
}
