// The one Claude call template generation makes, streamed so the page can
// show progress while the code is written.
import Anthropic from "@anthropic-ai/sdk";
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

let client: Anthropic | null = null;

export const callClaude: CallClaude = async (messages, onChars) => {
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 2 });
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
