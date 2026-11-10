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
import { stockOn, cleanQueries } from "./stock.js";
import { blocks, describe, linksIn, loadAttachments, readLinkPage, type AttachmentIn, type LinkRead } from "./refs.js";

export const CHAT_MODEL = process.env.STUDIO_CHAT_MODEL || process.env.STUDIO_MODEL || "claude-opus-5-5";
export const CHAT_LIMIT = Number(process.env.STUDIO_CHAT_LIMIT || 200);
const ASPECTS = ["16:9", "9:16", "1:1"] as const;

export type ChatAction = "chat" | "build" | "change" | "explainer" | "edit";
export const MOODS = ["calm", "upbeat", "cinematic", "lofi", "epic", "playful", "corporate"] as const;
export type ChatOut = { reply: string; action: ChatAction; brief: string; title: string; aspect: (typeof ASPECTS)[number] | "none"; music: "none" | (typeof MOODS)[number]; photos?: string[] };
const explainersOn = () => !!(process.env.GOBLIN_EXPLAINER_AGENT_ID && process.env.GOBLIN_AGENT_ENVIRONMENT_ID);
const editorOn = () => !!(process.env.GOBLIN_EDITOR_AGENT_ID && process.env.GOBLIN_EDITOR_ENVIRONMENT_ID);
export type CallChat = (system: string, messages: Anthropic.MessageParam[]) => Promise<{ out: ChatOut | null; usage: Usage }>;

export const CHAT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "action", "brief", "title", "aspect", "music", "photos"],
  properties: {
    reply: { type: "string", description: "What Goblin says to the user. Plain text, usually one to three sentences." },
    action: {
      type: "string",
      enum: ["chat", "build", "change", "explainer", "edit"],
      description: "chat: just talk. build: make a new short template now. change: change the current template, explainer or edit now. explainer: make a new explainer video now. edit: hand the user's own footage and audio to Goblin Editor for real editing now.",
    },
    brief: {
      type: "string",
      description: "For build: a complete, self-contained description of the video for the template writer (scenes in order, the on-screen copy, timing, feel). For explainer: the topic, audience, length, any scenes asked for, and every fact, number and name the user gave, with any source text they pasted copied in full. For edit: complete instructions for the editor: every attached file by name and what to do with it, in order (cuts with times, joins, captions and their style, reframing, audio cleanup, music and sound effects, colour, overlays), plus the format and length. For change: the exact change to make. Empty string for chat.",
    },
    title: { type: "string", description: "For build, explainer or edit: a 2 to 5 word title in title case. Empty string otherwise." },
    aspect: { type: "string", enum: [...ASPECTS, "none"], description: "The format the user asked for, or none if they didn't say." },
    music: {
      type: "string",
      enum: ["none", ...MOODS],
      description: "For build or change: the mood of Goblin-made music to add, only when the user wants music and hasn't attached their own track (their track is used as is). Otherwise none.",
    },
    photos: {
      type: "array",
      items: { type: "string" },
      description: "For build, change or edit: stock photo searches, one photo each (at most 6), only when the user wants photos of things they haven't attached. Each is a short, concrete search like \"misty pine forest\" or \"close-up of a dew-covered leaf\". Empty array otherwise.",
    },
  },
};

export function chatSystem(ctx: {
  brand?: string;
  aspect: string;
  template?: { title: string; outcome: string; version: number; format: string; seconds: number; copy: Record<string, string> };
  video?: { title: string; format: string; kind?: "explainer" | "edit" };
  explainers?: boolean;
  // The user turned on Explainer (the button). Only then can Goblin make explainers.
  explainerMode?: boolean;
  // Goblin Editor (a Managed Agent with a real editing machine) is set up.
  editor?: boolean;
  // A stock photo source (Pixabay or Unsplash) is set up, so Goblin can add stock photos itself.
  stock?: boolean;
}) {
  return `You are Goblin, the assistant on usegoblin.xyz. Goblin builds short motion-graphics videos as templates: code-based animations, 4 to 15 seconds long, in 16:9, 9:16 or 1:1, styled automatically from the user's brand kit (colours, font, motion feel), with editable text fields, and optionally the user's own photo or clip as the background. They can carry sound effects from Goblin's library (whooshes, pops, clicks, ticks, typing, dings, chimes, sparkles, impacts, booms, bass drops, risers, glitches, drumrolls and more) timed to the motion, and music: the user's own track or original Goblin-made music. Users preview them on the site and download them as MP4 files, with sound.

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

Attachments, references and links:
- The user can attach photos, clips, music, PDFs and text documents with the + button, and paste links. You see photos directly, clips as a contact sheet of frames, and documents in full; links in the newest message are read for you. Music is described by its length, tempo and beats.
- Each attachment is marked for the video (put it in), as a reference (look at it, don't put it in), or left for you to judge from what they said. A screenshot of an ad, a brand board or a competitor's video is usually a reference; "put my quote on this" means it goes in.
- Use what you see. Describe a reference's style concretely in the brief for the template writer (layout, pacing, type treatment, colour mood, motion), pull exact facts, names, numbers and copy from documents and links, and ask about things you can't tell.
- In a build brief, name each attachment by its file name and say how it's used: "the attached photo beach.jpg full-bleed behind the quote, slow push-in", "match the layout and pacing of the reference ad.png", "use the attached track song.mp3 as the soundtrack and cut on its beats". The template writer gets the same files.
${ctx.stock ? `- Stock photos: when the user wants photos of things they haven't attached ("add some nature photos", "show a city at night", "random real-life objects"), add them yourself: put one concrete search per photo in "photos" (at most 6, varied, matching the look they want), and Goblin fetches free stock photos (from Pixabay or Unsplash) and attaches them to the video. Never tell the user you can't get photos or ask them to find their own. In the brief, say how the stock photos are used (for example "flash the stock photos one after another in stark black and white, with glitch cuts between them"); their file names are added for you. If they ask for the photos on a change, use change. Photos only: there's no stock footage or music.
` : `- You can't find photos on the web yourself: if the user wants photos they haven't attached, ask them to attach them with the + button.
`}- A clip stays silent unless the user wants its sound. Any finished video can be cut into shorter clips with the Clips button in the video panel.

Music:
- Goblin can use the user's own track, or make original music in code in a mood (calm, upbeat, cinematic, lofi, epic, playful or corporate). If the user wants music and hasn't attached a track, set "music" to the mood closest to how they describe it, in their words ("something chill", "hype", "like a movie trailer"). Don't offer them a list of moods to pick from; if they haven't said what they want, choose what suits the video. For different music later, use change with the new mood. Music is mixed under the sound effects (it dips when they play).
- With music, say in the brief to time the cuts and key words to the beats. After it's built the user can change the start point, volume, fades and looping in the panel, and the motion stays on the beat.

${ctx.explainers && ctx.explainerMode ? `Explainer mode is ON (the user clicked the Explainer button):
- In this mode you make explainer videos, not templates, with a separate explainer agent: 30 to 60 seconds, 4 scenes by default (up to 8), each with an on-screen caption, quiet background music made with code, in the brand's colours, delivered as an MP4. They take a few minutes to make, and the user can keep chatting meanwhile. The agent has no internet access: it uses what the user gives it and what it already knows.
- Talk it through first: what it explains, for whom, the key facts or source text, the length. Then, only when they ask you to make it now (or say yes to your offer), use action "explainer". Never use "build" in this mode. The reply is one short line saying what you're making and that it takes a few minutes.
- If the current item is an explainer and they ask for a change to it, use "change" with the exact change as the brief.
- If they'd rather have a short template instead, tell them to turn off Explainer (the same button) first.
- The user can turn Explainer on partway through a chat (their message then starts with a note saying so), so earlier replies may have been written with it off. Those replies were right at the time: don't apologise, correct yourself or mention the switch, just answer as an explainer maker.

` : `Explainer videos:
- Never make explainer videos in this conversation, and never use action "explainer". Longer explainer videos are only made when the user turns on Explainer with the Explainer button (next to the message box). If they ask for an explainer, a walkthrough, a lesson or a 30 to 60 second video with captions and music, tell them to click Explainer first, in one short line, with action "chat".

`}Context:
${ctx.editor && !ctx.explainerMode ? `Goblin Editor (real video editing):
- Besides quick motion videos, you can hand the user's own footage, photos and audio to Goblin Editor, an editor with a real editing machine (ffmpeg, speech-to-text, OpenCV). Use action "edit" when the request needs real editing of their files: captions from what's said in a clip, cutting, trimming, joining or reordering their clips, removing silences, changing speed, reframing footage to vertical or square while following the subject, cleaning up or levelling audio, mixing music under a voice, adding sound effects at exact moments, colour grading, stabilising, blurring faces or logos, or putting text, titles or a logo over their footage.
- Keep "build" for motion videos made from words (a photo or clip used only as a background is still a build).
- Edits take a few minutes; the user can keep chatting. If the files aren't attached yet, ask for them. If the request is clear, go ahead without asking more. The reply is one short line saying what you're editing and that it takes a few minutes.
- If the current item is an edit and they ask for a change to it, use "change" with the exact change as the brief; new attachments in that message go to the editor too.

` : ""}- The user's brand: ${ctx.brand || "not named yet"}.
- Format selected in the input: ${ctx.aspect}. Use it unless the user asks for another.
- ${ctx.video ? `Current item: the ${ctx.video.kind === "edit" ? "edited video" : "explainer video"} "${ctx.video.title}" (${ctx.video.format}). A change re-edits this video.` : ctx.template ? `Current template: "${ctx.template.title}" (v${ctx.template.version}, ${ctx.template.format}, ${ctx.template.seconds}s): ${ctx.template.outcome}. Its text: ${JSON.stringify(ctx.template.copy)}.` : "Nothing has been built in this chat yet."}`;
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

// The conversation with attachments: the most recent photos, clips and
// documents are shown to Claude where they were sent; older ones (and all
// music) are described in a line. Links in the newest message are read here.
type Entry = { role: "user" | "assistant"; text: string; media: AttachmentIn[] };
export function toEntries(raw: unknown): Entry[] {
  const list = Array.isArray(raw) ? raw.slice(-40) : [];
  const out: Entry[] = [];
  for (const m of list) {
    const role = m?.role === "assistant" ? "assistant" : m?.role === "user" ? "user" : null;
    const text = str(m?.text, 6000);
    const media: AttachmentIn[] = role === "user" && Array.isArray(m?.media) ? m.media.slice(0, 6) : [];
    if (!role || (!text && !media.length)) continue;
    const last = out[out.length - 1];
    if (last && last.role === role) {
      last.text += "\n\n" + text;
      last.media.push(...media);
    } else out.push({ role, text, media });
  }
  while (out.length && out[0].role !== "user") out.shift();
  return out;
}

export async function withMedia(userId: string, entries: Entry[], links: LinkRead[]): Promise<Anthropic.MessageParam[]> {
  const all = entries.flatMap((e) => e.media);
  const loaded = await loadAttachments(userId, all, 16);
  const byRef = new Map(loaded.map((a) => [a.ref, a]));
  // Show (rather than describe) the last four photos or clips and the last
  // two documents; that keeps each request well under Claude's size limit.
  const shown = new Set([...loaded.filter((a) => a.kind === "image" || a.kind === "video").slice(-4), ...loaded.filter((a) => a.kind === "doc").slice(-2)].map((a) => a.ref));
  const out: Anthropic.MessageParam[] = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.role === "assistant") {
      out.push({ role: "assistant", content: e.text || "…" });
      continue;
    }
    const content: Anthropic.ContentBlockParam[] = [];
    for (const m of e.media) {
      const a = byRef.get(m.ref);
      if (!a) continue;
      if (shown.has(a.ref)) content.push(...(await blocks([a])));
      else content.push({ type: "text", text: `[Earlier attachment] ${describe(a)}` });
    }
    if (i === entries.length - 1)
      for (const l of links)
        content.push({ type: "text", text: l.ok ? `[Contents of the link ${l.url}${l.title ? ` (“${l.title}”)` : ""}]\n${l.text}` : `[The link ${l.url} couldn't be read (it may need a login or JavaScript). Ask the user to paste the key text if it matters.]` });
    content.push({ type: "text", text: e.text || "(The user sent the attachments above without a message.)" });
    out.push({ role: "user", content });
  }
  // Cache the conversation so far for the next turn.
  const last = out[out.length - 1];
  if (last && Array.isArray(last.content) && last.content.length) (last.content[last.content.length - 1] as { cache_control?: object }).cache_control = { type: "ephemeral" };
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
      const entries = toEntries(body.messages);
      if (!entries.length || entries[entries.length - 1].role !== "user") return res.status(400).json({ error: "Say something first." });
      const links = await Promise.all(linksIn(entries[entries.length - 1].text).map(readLinkPage));
      const messages = await withMedia(userId, entries, links);
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
        const video = v ? { title: str(v.title, 80), format: ASPECTS.includes(v.format) ? v.format : "16:9", kind: v.kind === "edit" ? ("edit" as const) : ("explainer" as const) } : undefined;
        result = await deps.call(chatSystem({ brand: str(body.brand, 60), aspect, template: video ? undefined : template, video, explainers: explainersOn(), explainerMode, editor: editorOn(), stock: stockOn() }), messages);
      } catch (e) {
        await logGeneration({ userId, templateId: null, kind: "chat", model: CHAT_MODEL, ok: false, error: (e as Error).message, inputTokens: 0, outputTokens: 0, cacheRead: 0, cacheWrite: 0, ms: Date.now() - started });
        return res.status(502).json({ error: "Goblin couldn't reply just now. Try again in a moment." });
      }
      const out = result.out;
      await logGeneration({ userId, templateId: null, kind: "chat", model: CHAT_MODEL, ok: !!out, ...result.usage, ms: Date.now() - started });
      if (!out || !out.reply) return res.status(502).json({ error: "Goblin couldn't reply just now. Try again in a moment." });

      let action: ChatAction = out.action === "build" || out.action === "change" || out.action === "explainer" || out.action === "edit" ? out.action : "chat";
      const editingVideo = body.video?.kind === "edit";
      if (action === "edit" && (!editorOn() || explainerMode)) action = explainerMode ? "explainer" : "build";
      let reply = str(out.reply, 2000);
      // The agent is used strictly in explainer mode: outside it, an explainer
      // never starts; inside it, a template is never built.
      if (action === "explainer" && !explainerMode) {
        action = "chat";
        reply = explainersOn() ? "To make an explainer video, click the Explainer button next to the message box, then tell me what it should explain." : "Explainer videos aren't switched on yet.";
      }
      if (action === "change" && body.video && !explainerMode && !editingVideo) {
        action = "chat";
        reply = "To change this explainer, turn on Explainer with the button next to the message box, then tell me what to change.";
      }
      if (action === "change" && !template && !body.video) action = "build";
      if (action === "build" && explainerMode) action = "explainer";
      const brief = action === "chat" ? "" : str(out.brief, action === "explainer" || action === "edit" ? 4000 : 1200);
      if (action !== "chat" && brief.length < 8) action = "chat";
      // A build counts toward the daily generation limit; say so before starting.
      // (Explainers have their own limit, checked when one starts.)
      if (action === "build" || (action === "change" && !body.video)) {
        const limit = Number(process.env.STUDIO_DAILY_LIMIT || 20);
        if ((await usedToday(userId)) >= limit) {
          return res.status(200).json({ reply: `I'd love to, but you've used all ${limit} builds for today. We can keep planning it, and I'll build it tomorrow.`, action: "chat", brief: "", aspect });
        }
      }
      const music = (action === "build" || action === "change") && MOODS.includes(out.music as never) ? out.music : "none";
      return res.status(200).json({
        reply,
        action,
        brief,
        title: action === "build" || action === "explainer" || action === "edit" ? str(out.title, 80) : "",
        aspect: out.aspect === "none" || !ASPECTS.includes(out.aspect as never) ? aspect : out.aspect,
        music,
        photos: action === "build" || action === "change" || action === "edit" ? (stockOn() ? cleanQueries(out.photos) : []) : [],
        // What the links said, for the page to keep with the message.
        links: links.map((l) => ({ url: l.url, title: l.title, ok: l.ok, text: l.text.slice(0, 3000) })),
      });
    } catch (e) {
      console.error("studio chat failed", (e as Error).message);
      if (!res.headersSent) res.status(500).json({ error: "Something went wrong. Try again in a moment." });
    }
  };
}
