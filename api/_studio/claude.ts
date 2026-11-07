// The one Claude call template generation makes, streamed so the page can
// show progress while the code is written.
import Anthropic from "@anthropic-ai/sdk";
import { oidcFederationProvider } from "@anthropic-ai/sdk/lib/credentials/oidc-federation";
import { systemPrompt } from "./context.js";

export const MODEL = process.env.STUDIO_MODEL || "claude-sonnet-5-5";
const CATEGORIES = ["Launch", "Product", "Data", "Explainer", "Social", "Brand", "Showreel", "Story"];

// Strict tool use: the reply is always valid JSON in this shape. `code` comes
// last so the metadata streams first.
export const SAVE_TOOL: Anthropic.Tool = {
  name: "save_template",
  description: "Save the finished motion template.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["title", "outcome", "category", "tags", "durationSeconds", "fields", "code"],
    properties: {
      title: { type: "string", description: "2 to 4 words, title case, e.g. 'Feature Countdown'." },
      outcome: { type: "string", description: "One line on what someone makes with it, in a founder's words." },
      category: { type: "string", enum: CATEGORIES },
      tags: { type: "array", items: { type: "string" }, description: "3 to 6 short lowercase tags." },
      durationSeconds: { type: "integer", description: "Length in seconds, 4 to 15. Match the timing in the code." },
      fields: {
        type: "array",
        description: "2 to 6 editable copy fields, in on-screen order.",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["key", "label", "type", "hint", "default"],
          properties: {
            key: { type: "string", description: "camelCase key used as c.<key> in the code." },
            label: { type: "string", description: "Short label shown in the editor." },
            type: { type: "string", enum: ["text", "textarea"] },
            hint: { type: "string", description: "Short help text, e.g. 'Comma separated'. Empty string if none." },
            default: { type: "string", description: "Realistic default copy." },
          },
        },
      },
      code: { type: "string", description: "The complete .tsx file." },
    },
  },
};

export type ToolInput = {
  title: string; outcome: string; category: string; tags: string[]; durationSeconds: number;
  fields: { key: string; label: string; type: "text" | "textarea"; hint: string; default: string }[];
  code: string;
};
export type Usage = { inputTokens: number; outputTokens: number; cacheRead: number; cacheWrite: number };
export type CallResult = { input: ToolInput | null; toolUseId: string | null; stop: string | null; usage: Usage };
export type CallClaude = (messages: Anthropic.MessageParam[], onChars: (n: number) => void) => Promise<CallResult>;

// ---- authentication ------------------------------------------------------
// Preferred: workload identity federation. Vercel gives every function
// request a short-lived OIDC token (x-vercel-oidc-token); the SDK exchanges
// it for a short-lived Anthropic token (cached and refreshed by the SDK), so
// no Claude API key is stored anywhere. Fallback: ANTHROPIC_API_KEY.
const env = process.env;
export const usesFederation = () => !!(env.ANTHROPIC_FEDERATION_RULE_ID && env.ANTHROPIC_ORGANIZATION_ID && env.ANTHROPIC_SERVICE_ACCOUNT_ID);
export const claudeConfigured = () => usesFederation() || !!env.ANTHROPIC_API_KEY;

// The newest Vercel OIDC token seen by this function instance. Updated on
// every request, so a warm instance always exchanges a fresh one.
let identityToken = "";
export function rememberIdentityToken(header: string | string[] | undefined) {
  const t = Array.isArray(header) ? header[0] : header;
  if (t) identityToken = t;
}
const currentIdentityToken = () => {
  const t = identityToken || env.VERCEL_OIDC_TOKEN || "";
  if (!t) throw new Error("No Vercel OIDC token on this request. Check that OIDC Federation is enabled for the project.");
  return t;
};

let client: Anthropic | null = null;
function getClient() {
  if (client) return client;
  client = usesFederation()
    ? new Anthropic({
        maxRetries: 2,
        credentials: oidcFederationProvider({
          identityTokenProvider: currentIdentityToken,
          federationRuleId: env.ANTHROPIC_FEDERATION_RULE_ID!,
          organizationId: env.ANTHROPIC_ORGANIZATION_ID!,
          serviceAccountId: env.ANTHROPIC_SERVICE_ACCOUNT_ID!,
          workspaceId: env.ANTHROPIC_WORKSPACE_ID || undefined,
          baseURL: env.ANTHROPIC_BASE_URL || "https://api.anthropic.com",
          fetch: globalThis.fetch,
        }),
      })
    : new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 2 });
  return client;
}

export const callClaude: CallClaude = async (messages, onChars) => {
  const client = getClient();
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    // The guide, kit sources and examples are identical on every call;
    // cache them for an hour since traffic is bursty.
    system: [{ type: "text", text: systemPrompt(), cache_control: { type: "ephemeral", ttl: "1h" } }],
    tools: [SAVE_TOOL],
    tool_choice: { type: "tool", name: SAVE_TOOL.name },
    messages,
  });
  let chars = 0;
  for await (const ev of stream) {
    if (ev.type === "content_block_delta" && ev.delta.type === "input_json_delta") {
      chars += ev.delta.partial_json.length;
      onChars(chars);
    }
  }
  const msg = await stream.finalMessage();
  const block = msg.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
  return {
    input: (block?.input as ToolInput) ?? null,
    toolUseId: block?.id ?? null,
    stop: msg.stop_reason,
    usage: {
      inputTokens: msg.usage.input_tokens,
      outputTokens: msg.usage.output_tokens,
      cacheRead: msg.usage.cache_read_input_tokens ?? 0,
      cacheWrite: msg.usage.cache_creation_input_tokens ?? 0,
    },
  };
};
