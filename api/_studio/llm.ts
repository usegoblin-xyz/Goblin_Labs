// AI observability: every Claude call Goblin makes is sent to PostHog as an
// $ai_generation event (PostHog's LLM analytics), so cost, tokens, latency,
// errors and the conversation itself show up per user and per chat.
//   Settings: POSTHOG_KEY (or the site's VITE_POSTHOG_KEY), POSTHOG_HOST
//   (default US Cloud). Without a key, nothing is sent.
// Events use the signed-in user's id as distinct_id, the same id the site
// identifies people with, so they join the person's other events. A chat's
// conversation id (the x-goblin-conversation header) is the trace id, so a
// conversation's replies and builds group into one trace.
import { randomUUID } from "node:crypto";
import type { VercelRequest } from "@vercel/node";
import type { CallClaude, Usage } from "./claude.js";
import type { CallChat } from "./chat.js";

const KEY = () => process.env.POSTHOG_KEY || process.env.VITE_POSTHOG_KEY || "";
const HOST = () => (process.env.POSTHOG_HOST || "https://us.i.posthog.com").replace(/\/$/, "");
const MAX = 20000; // characters per message, to stay well under PostHog's event size limit

export type Trace = { userId: string | null; traceId: string; conversationId: string | null };

export function traceFor(req: VercelRequest): Trace {
  const h = req.headers["x-goblin-conversation"];
  const id = typeof h === "string" && /^[\w-]{8,64}$/.test(h) ? h : null;
  return { userId: null, traceId: id ?? randomUUID(), conversationId: id };
}

const clip = (s: string) => (s.length > MAX ? s.slice(0, MAX) + `… [${s.length - MAX} more characters]` : s);
const text = (c: unknown): string =>
  typeof c === "string" ? c : Array.isArray(c) ? c.map((b) => (b && typeof b === "object" && "text" in b ? String(b.text) : "")).join("\n") : "";

type Report = {
  span: string;
  model: string;
  input: { role: string; content: string }[];
  output?: string;
  usage?: Usage;
  ms: number;
  maxTokens: number;
  error?: string;
  props?: Record<string, unknown>;
};

export async function reportGeneration(trace: Trace, r: Report) {
  const key = KEY();
  if (!key) return;
  const properties: Record<string, unknown> = {
    $ai_trace_id: trace.traceId,
    $ai_span_name: r.span,
    $ai_provider: "anthropic",
    $ai_model: r.model,
    $ai_input: r.input.map((m) => ({ role: m.role, content: clip(m.content) })),
    $ai_output_choices: r.output !== undefined ? [{ role: "assistant", content: clip(r.output) }] : [],
    $ai_input_tokens: r.usage?.inputTokens ?? 0,
    $ai_output_tokens: r.usage?.outputTokens ?? 0,
    $ai_cache_read_input_tokens: r.usage?.cacheRead ?? 0,
    $ai_cache_creation_input_tokens: r.usage?.cacheWrite ?? 0,
    $ai_latency: r.ms / 1000,
    $ai_max_tokens: r.maxTokens,
    $ai_is_error: !!r.error,
    ...(r.error ? { $ai_error: r.error.slice(0, 500) } : {}),
    ...(trace.conversationId ? { $ai_session_id: trace.conversationId, conversation_id: trace.conversationId } : {}),
    ...(trace.userId ? {} : { $process_person_profile: false }),
    ...r.props,
  };
  try {
    // Awaited (briefly) so the event leaves before the function is frozen.
    await fetch(`${HOST()}/i/v0/e/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ api_key: key, event: "$ai_generation", distinct_id: trace.userId ?? `anon-${trace.traceId}`, properties }),
      signal: AbortSignal.timeout(1500),
    });
  } catch {
    // Analytics never gets in the way of a reply.
  }
}

// The same calls, reporting as they go.
export function tracedChat(call: CallChat, trace: Trace, model: string): CallChat {
  return async (system, messages) => {
    const input = [{ role: "system", content: system }, ...messages.map((m) => ({ role: m.role, content: text(m.content) }))];
    const t0 = Date.now();
    try {
      const r = await call(system, messages);
      await reportGeneration(trace, { span: "chat", model, input, output: r.out ? JSON.stringify(r.out) : "", usage: r.usage, ms: Date.now() - t0, maxTokens: 1500, error: r.out ? undefined : "Reply wasn't valid JSON", props: { goblin_action: r.out?.action ?? null } });
      return r;
    } catch (e) {
      await reportGeneration(trace, { span: "chat", model, input, ms: Date.now() - t0, maxTokens: 1500, error: (e as Error).message });
      throw e;
    }
  };
}

export function tracedTemplate(call: CallClaude, trace: Trace, model: string): CallClaude {
  let attempt = 0;
  return async (messages, onChars) => {
    attempt++;
    // The system prompt (Goblin's template guide and kit) is the same on every
    // call and very long, so it's named rather than sent.
    const input = [{ role: "system", content: "[Goblin template guide, kit sources and examples]" }, ...messages.map((m) => ({ role: m.role, content: text(m.content) }))];
    const t0 = Date.now();
    try {
      const r = await call(messages, onChars);
      await reportGeneration(trace, { span: attempt === 1 ? "template" : "template-fix", model, input, output: r.raw, usage: r.usage, ms: Date.now() - t0, maxTokens: 32000, error: r.input ? undefined : `No usable template (stop: ${r.stop ?? "unknown"})`, props: { goblin_attempt: attempt } });
      return r;
    } catch (e) {
      await reportGeneration(trace, { span: "template", model, input, ms: Date.now() - t0, maxTokens: 32000, error: (e as Error).message, props: { goblin_attempt: attempt } });
      throw e;
    }
  };
}
