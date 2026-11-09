// POST /api/studio?op=chat: Goblin's side of the conversation. Goblin talks
// the idea through first and only builds when the user asks it to. Each reply
// says whether to just talk, build a new template, or change the current one,
// and when building it hands the generator a complete brief.
//
// Body: { messages: [{ role: "user" | "assistant", text }], aspect, brand?, template? }
// Reply: { reply, action: "chat" | "build" | "change", brief, aspect }
import Anthropic from "@anthropic-ai/sdk";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { logGeneration, usedToday, chatsToday } from "./db.js";
import type { Usage } from "./claude.js";

export const CHAT_MODEL = process.env.STUDIO_CHAT_MODEL || process.env.STUDIO_MODEL || "claude-sonnet-5-5";
export const CHAT_LIMIT = Number(process.env.STUDIO_CHAT_LIMIT || 200);
const ASPECTS = ["16:9", "9:16", "1:1"] as const;

export type ChatAction = "chat" | "build" | "change" | "explainer";
export type ChatOut = { reply: string; action: ChatAction; brief: string; title: string; aspect: (typeof ASPECTS)[number] | "none" };
const explainersOn = () => !!(process.env.GOBLIN_EXPLAINER_AGENT_ID && process.env.GOBLIN_AGENT_ENVIRONMENT_ID);
export type CallChat = (system: string, messages: Anthropic.MessageParam[]) => Promise<{ out: ChatOut | null; usage: Usage }>;

export const CHAT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "action", "brief", "title", "aspect"],
  properties: {
    reply: { type: "string", description: "What Goblin says to the user. Plain text, usually one to three sentences." },
    action: {
      type: "string",
      enum: ["chat", "build", "change", "explainer"],
      description: "chat: just talk. build: make a new short template now. change: change the current template or explainer now. explainer: make a new explainer video now.",
    },
    brief: {
      type: "string",
      description: "For build: a complete, self-contained description of the video for the template writer (scenes in order, the on-screen copy, timing, feel). For explainer: the topic, audience, length, any scenes asked for, and every fact, number and name the user gave, with any source text they pasted copied in full. For change: the exact change to make. Empty string for chat.",
    },
    title: { type: "string", description: "For build or explainer: a 2 to 5 word title in title case. Empty string otherwise." },
    aspect: { type: "string", enum: [...ASPECTS, "none"], description: "The format the user asked for, or none if they didn't say." },
  },
};

export function chatSystem(ctx: {
  brand?: string;
  aspect: string;
  template?: { title: string; outcome: string; version: number; format: string; seconds: number; copy: Record<string, string> };
  video?: { title: string; format: string };
  explainers?: boolean;
  // The user turned on Explainer (the button). Only then can Goblin make explainers.
  explainerMode?: boolean;
}) {
  return `You are Goblin, the assistant on usegoblin.xyz. Goblin builds short motion-graphics videos as templates: code-based animations, 4 to 15 seconds long, in 16:9, 9:16 or 1:1, styled automatically from the user's brand kit (colours, font, motion feel), with editable text fields, and optionally the user's own photo or clip as the background. They can carry sound effects from Goblin's library (whooshes, pops, clicks, ticks, typing, dings, chimes, sparkles, impacts, booms, bass drops, risers, glitches, drumrolls and more) timed to the motion, but no music. Users preview them on the site and download them as MP4 files, with sound.

How to talk:
- Talk like a friendly, sharp motion designer. Be natural and brief: usually one to three sentences. No headings, no bullet lists, no markdown, no code.
- Start with a real conversation. Help the user shape the idea: what they're announcing, the one message that matters, the copy on screen, the length, the format, the feel. Ask at most one question at a time, and only when it helps.
- Greetings, questions and small talk get a normal reply. Don't push a build.
- When the idea is clear enough, you may suggest what you'd make in a sentence and ask if they want you to build it.

When to build (action "build" or "change"):
- Only when the user asks you to make it now: "build it", "make it", "go ahead", "yes" to your offer to build, or a request that plainly says to create the video now (for example "Make a 10-second launch video for…").
- Ideas, descriptions, questions and "what if" talk are not a request to build. Reply with action "chat".
- If a template exists and the user asks for a change to it, use "change" with the exact change as the brief. If they ask for something new instead, use "build".
- On build or change, the reply is one short line saying what you're making (for example "On it: a 9-second vertical launch video for Notewise."). Don't promise details the brief doesn't have.
- A build brief must stand alone: the template writer sees only the brief, not this conversation. Include the scenes in order, the exact on-screen copy, the length and the feel. Leave colours and fonts to the brand kit.
- Sound: if the user wants sound or sound effects, say so in the brief and describe which sounds go where (for example "a whoosh as each card slides in, a ding on the final stat, a riser into the logo"). If they haven't mentioned sound, you can ask whether they want sound effects before building; if they don't want any, or never said, leave sound out of the brief.

Their own photos and clips:
- The user can attach a photo or a short clip from their device with the + button by the message box, and trim a clip to the part they want. Attached files show in their message as a note like [Attached photo "beach.jpg", 1080x1350]. Goblin doesn't see what's in a photo, only that note, so ask what's in it if that matters (for example where the faces are).
- When they want a quote or caption on their photo or clip, build it with the media as the background. In the brief, say how to use each attachment by its file name (for example "the attached photo beach.jpg full-bleed as the background, with a slow push-in"); the template writer gets the files themselves. Keep the clip silent unless they ask to keep its sound.
- Any finished video can be cut into shorter clips with the Clips button in the video panel (for Reels, TikTok or Shorts). If they ask how to cut or split a video, tell them that.

${ctx.explainers && ctx.explainerMode ? `Explainer mode is ON (the user clicked the Explainer button):
- In this mode you make explainer videos, not templates, with a separate explainer agent: 30 to 60 seconds, 4 scenes by default (up to 8), each with an on-screen caption, quiet background music made with code, in the brand's colours, delivered as an MP4. They take a few minutes to make, and the user can keep chatting meanwhile. The agent has no internet access: it uses what the user gives it and what it already knows.
- Talk it through first: what it explains, for whom, the key facts or source text, the length. Then, only when they ask you to make it now (or say yes to your offer), use action "explainer". Never use "build" in this mode. The reply is one short line saying what you're making and that it takes a few minutes.
- If the current item is an explainer and they ask for a change to it, use "change" with the exact change as the brief.
- If they'd rather have a short template instead, tell them to turn off Explainer (the same button) first.
- The user can turn Explainer on partway through a chat (their message then starts with a note saying so), so earlier replies may have been written with it off. Those replies were right at the time: don't apologise, correct yourself or mention the switch, just answer as an explainer maker.

` : `Explainer videos:
- Never make explainer videos in this conversation, and never use action "explainer". Longer explainer videos are only made when the user turns on Explainer with the Explainer button (next to the message box). If they ask for an explainer, a walkthrough, a lesson or a 30 to 60 second video with captions and music, tell them to click Explainer first, in one short line, with action "chat".

`}Context:
- The user's brand: ${ctx.brand || "not named yet"}.
- Format selected in the input: ${ctx.aspect}. Use it unless the user asks for another.
- ${ctx.video ? `Current item: the explainer video "${ctx.video.title}" (${ctx.video.format}). A change re-edits this video.` : ctx.template ? `Current template: "${ctx.template.title}" (v${ctx.template.version}, ${ctx.template.format}, ${ctx.template.seconds}s): ${ctx.template.outcome}. Its text: ${JSON.stringify(ctx.template.copy)}.` : "Nothing has been built in this chat yet."}`;
}

let client: Anthropic | null = null;
export const callChat: CallChat = async (system, messages) => {
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 2 });
  const msg = await client.messages.create({
    model: CHAT_MODEL,
    max_tokens: 1500,
    system,
    output_config: { format: { type: "json_schema", schema: CHAT_SCHEMA } },
    messages,
  });
  const raw = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  let out: ChatOut | null = null;
  try {
    out = JSON.parse(raw) as ChatOut;
  } catch {
    out = null;
  }
  return {
    out,
    usage: {
      inputTokens: msg.usage.input_tokens,
      outputTokens: msg.usage.output_tokens,
      cacheRead: msg.usage.cache_read_input_tokens ?? 0,
      cacheWrite: msg.usage.cache_creation_input_tokens ?? 0,
    },
  };
};

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// The conversation as Claude needs it: alternating turns, starting with the user.
export function toMessages(raw: unknown): Anthropic.MessageParam[] {
  const list = Array.isArray(raw) ? raw.slice(-40) : [];
  const out: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of list) {
    const role = m?.role === "assistant" ? "assistant" : m?.role === "user" ? "user" : null;
    const text = str(m?.text, 2000);
    if (!role || !text) continue;
    const last = out[out.length - 1];
    if (last && last.role === role) last.content += "\n\n" + text;
    else out.push({ role, content: text });
  }
  while (out.length && out[0].role !== "user") out.shift();
  return out;
}

export function makeHandler(deps: { call: CallChat; userId: (req: VercelRequest) => Promise<string | null>; configured?: () => boolean }) {
  const configured = deps.configured ?? (() => !!process.env.ANTHROPIC_API_KEY);
  return async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("cache-control", "no-store");
    try {
      if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
      if (!configured()) return res.status(503).json({ error: "Goblin's chat isn't switched on yet." });
      const userId = await deps.userId(req);
      if (!userId) return res.status(401).json({ error: "Sign in to chat with Goblin." });

      const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body) ?? {};
      const messages = toMessages(body.messages);
      if (!messages.length || messages[messages.length - 1].role !== "user") return res.status(400).json({ error: "Say something first." });
      const aspect = ASPECTS.includes(body.aspect) ? body.aspect : "16:9";
      const t = body.template && typeof body.template === "object" ? body.template : null;
      const template = t
        ? {
            title: str(t.title, 80),
            outcome: str(t.outcome, 200),
            version: Number(t.version) || 1,
            format: ASPECTS.includes(t.format) ? t.format : "16:9",
            seconds: Number(t.seconds) || 0,
            copy: Object.fromEntries(Object.entries(t.copy && typeof t.copy === "object" ? t.copy : {}).slice(0, 8).map(([k, v]) => [str(k, 40), str(v, 300)])),
          }
        : undefined;

      if ((await chatsToday(userId)) >= CHAT_LIMIT) {
        return res.status(429).json({ error: "That's a lot of chatting for one day. Try again tomorrow." });
      }

      // Explainer mode is on only while the user has the Explainer button turned on.
      const explainerMode = body.mode === "explainer" && explainersOn();
      const started = Date.now();
      let result: Awaited<ReturnType<CallChat>>;
      try {
        const v = body.video && typeof body.video === "object" ? body.video : null;
        const video = v ? { title: str(v.title, 80), format: ASPECTS.includes(v.format) ? v.format : "16:9" } : undefined;
        result = await deps.call(chatSystem({ brand: str(body.brand, 60), aspect, template: video ? undefined : template, video, explainers: explainersOn(), explainerMode }), messages);
      } catch (e) {
        await logGeneration({ userId, templateId: null, kind: "chat", model: CHAT_MODEL, ok: false, error: (e as Error).message, inputTokens: 0, outputTokens: 0, cacheRead: 0, cacheWrite: 0, ms: Date.now() - started });
        return res.status(502).json({ error: "Goblin couldn't reply just now. Try again in a moment." });
      }
      const out = result.out;
      await logGeneration({ userId, templateId: null, kind: "chat", model: CHAT_MODEL, ok: !!out, ...result.usage, ms: Date.now() - started });
      if (!out || !out.reply) return res.status(502).json({ error: "Goblin couldn't reply just now. Try again in a moment." });

      let action: ChatAction = out.action === "build" || out.action === "change" || out.action === "explainer" ? out.action : "chat";
      let reply = str(out.reply, 2000);
      // The agent is used strictly in explainer mode: outside it, an explainer
      // never starts; inside it, a template is never built.
      if (action === "explainer" && !explainerMode) {
        action = "chat";
        reply = explainersOn() ? "To make an explainer video, click the Explainer button next to the message box, then tell me what it should explain." : "Explainer videos aren't switched on yet.";
      }
      if (action === "change" && body.video && !explainerMode) {
        action = "chat";
        reply = "To change this explainer, turn on Explainer with the button next to the message box, then tell me what to change.";
      }
      if (action === "change" && !template && !body.video) action = "build";
      if (action === "build" && explainerMode) action = "explainer";
      const brief = action === "chat" ? "" : str(out.brief, action === "explainer" ? 4000 : 1200);
      if (action !== "chat" && brief.length < 8) action = "chat";
      // A build counts toward the daily generation limit; say so before starting.
      // (Explainers have their own limit, checked when one starts.)
      if (action === "build" || (action === "change" && !body.video)) {
        const limit = Number(process.env.STUDIO_DAILY_LIMIT || 20);
        if ((await usedToday(userId)) >= limit) {
          return res.status(200).json({ reply: `I'd love to, but you've used all ${limit} builds for today. We can keep planning it, and I'll build it tomorrow.`, action: "chat", brief: "", aspect });
        }
      }
      return res.status(200).json({ reply, action, brief, title: action === "build" || action === "explainer" ? str(out.title, 80) : "", aspect: out.aspect === "none" || !ASPECTS.includes(out.aspect as never) ? aspect : out.aspect });
    } catch (e) {
      console.error("studio chat failed", (e as Error).message);
      if (!res.headersSent) res.status(500).json({ error: "Something went wrong. Try again in a moment." });
    }
  };
}
