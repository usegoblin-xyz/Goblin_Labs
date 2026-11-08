// A small client for the Managed Agents API (beta), used to run the explainer
// agent built in the Claude Console. Kept to plain fetch so the calls are easy
// to read and to fake in tests.
export const AGENT_BETA = "managed-agents-2026-04-01";
const BASE = "https://api.anthropic.com/v1";

export type AgentEvent = { id: string; type: string; processed_at?: string; [k: string]: unknown };
export type SessionInfo = {
  id: string;
  status: string; // "idle" | "running" | "rescheduling" | "terminated" ...
  usage?: { list_cost?: { amount: string } };
};
export type OutputFile = { id: string; filename: string; created_at: string; size_bytes?: number; mime_type?: string };

export type AgentApi = {
  createSession(opts: { agent: string; environmentId: string; title: string; text: string; budgetCents: number }): Promise<{ id: string }>;
  getSession(id: string): Promise<SessionInfo>;
  listEvents(id: string): Promise<AgentEvent[]>;
  sendMessage(id: string, text: string): Promise<void>;
  listFiles(sessionId: string): Promise<OutputFile[]>;
  fileContent(fileId: string): Promise<Response>;
};

function headers(extra: Record<string, string> = {}) {
  return {
    "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
    "anthropic-version": "2023-06-01",
    "anthropic-beta": `${AGENT_BETA},files-api-2025-04-14`,
    ...extra,
  };
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(`${BASE}${path}`, { ...init, headers: headers(init.body ? { "content-type": "application/json" } : {}) });
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    throw new Error(`Agent API ${init.method ?? "GET"} ${path.split("?")[0]} failed (${r.status}): ${body.slice(0, 300)}`);
  }
  return (await r.json()) as T;
}

const text = (t: string) => [{ type: "user.message", content: [{ type: "text", text: t }] }];

export const agentApi: AgentApi = {
  async createSession({ agent, environmentId, title, text: t, budgetCents }) {
    return call<{ id: string }>("/sessions", {
      method: "POST",
      body: JSON.stringify({
        agent,
        environment_id: environmentId,
        title,
        metadata: { app: "goblin" },
        budget: { type: "limit", max_list_cost: { amount: String(budgetCents), currency: "USD" } },
        initial_events: text(t),
      }),
    });
  },
  getSession: (id) => call<SessionInfo>(`/sessions/${encodeURIComponent(id)}`),
  async listEvents(id) {
    const out: AgentEvent[] = [];
    let page: string | undefined;
    for (let i = 0; i < 10; i++) {
      const d = await call<{ data: AgentEvent[]; next_page?: string | null }>(`/sessions/${encodeURIComponent(id)}/events?limit=1000${page ? `&page=${encodeURIComponent(page)}` : ""}`);
      out.push(...d.data);
      if (!d.next_page) break;
      page = d.next_page;
    }
    return out;
  },
  async sendMessage(id, t) {
    await call(`/sessions/${encodeURIComponent(id)}/events`, { method: "POST", body: JSON.stringify({ events: text(t) }) });
  },
  async listFiles(sessionId) {
    const d = await call<{ data: OutputFile[] }>(`/files?scope_id=${encodeURIComponent(sessionId)}&limit=100`);
    return d.data;
  },
  fileContent: (fileId) => fetch(`${BASE}/files/${encodeURIComponent(fileId)}/content`, { headers: headers() }),
};
