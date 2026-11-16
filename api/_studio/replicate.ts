// Remaking a reference video ("make one like this"). Goblin Breakdown (see
// agents/breakdown.md and videos.ts) takes the reference apart frame by frame;
// this turns its breakdown into the spec and pictures the template writer
// builds from. A remake keeps the reference's rhythm (cuts, timing, motion,
// scale) and shows the user's own product, words and brand kit: the brief
// says what each scene shows.
import type Anthropic from "@anthropic-ai/sdk";
import { db } from "./db.js";
import type { AgentApi } from "./agent.js";

export type Breakdown = {
  fps: number;
  width: number;
  height: number;
  duration: number;
  aspect: "16:9" | "9:16" | "1:1";
  summary: string;
  globals: string[];
  cards: { code: string; name?: string; description: string; text?: string[] }[];
  modifiers: { code: string; description: string }[];
  shots: { start: number; end: number; card: string; mods?: string }[];
  end?: string;
  audio?: { bpm?: number | null; beats?: number[]; sfx?: { t: number; kind: string }[]; music?: string; speech?: { t0: number; t1: number; text: string }[]; cutsOnBeat?: boolean };
  compare?: number[];
};

export const MAX_REMAKE_SECONDS = 30;
const s = (v: unknown, n: number) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b-\u001f]/g, " ").trim().slice(0, n) : "");
const num = (v: unknown, lo: number, hi: number, d: number) => (typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi ? v : d);

// The agent's JSON, checked and trimmed: it's written by a model, so nothing is trusted.
export function cleanBreakdown(raw: unknown): Breakdown | null {
  const b = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
  if (!b) return null;
  const fps = num(b.fps, 1, 120, 30);
  const duration = num(b.duration, 0.5, 600, 0);
  const shots = (Array.isArray(b.shots) ? b.shots : [])
    .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : null))
    .filter((x): x is Record<string, unknown> => !!x)
    .map((x) => ({ start: Math.round(num(x.start, 0, 1e6, -1)), end: Math.round(num(x.end, 0, 1e6, -1)), card: s(x.card, 4), mods: s(x.mods, 6) }))
    .filter((x) => x.start >= 0 && x.end > x.start && x.card)
    .sort((a, b) => a.start - b.start)
    .slice(0, 2000);
  const cards = (Array.isArray(b.cards) ? b.cards : []).slice(0, 30).flatMap((x) => {
    const c = x && typeof x === "object" ? (x as Record<string, unknown>) : null;
    if (!c || !s(c.code, 4)) return [];
    return [{ code: s(c.code, 4), name: s(c.name, 40), description: s(c.description, 1200), text: (Array.isArray(c.text) ? c.text : []).map((t) => s(t, 200)).filter(Boolean).slice(0, 12) }];
  });
  if (!duration || !shots.length || !cards.length) return null;
  const a = b.audio && typeof b.audio === "object" ? (b.audio as Record<string, unknown>) : {};
  const times = (v: unknown, n: number) => (Array.isArray(v) ? v : []).map((t) => num(t, 0, 600, -1)).filter((t) => t >= 0).slice(0, n);
  return {
    fps,
    width: Math.round(num(b.width, 16, 8000, 1080)),
    height: Math.round(num(b.height, 16, 8000, 1920)),
    duration,
    aspect: b.aspect === "16:9" || b.aspect === "1:1" ? b.aspect : "9:16",
    summary: s(b.summary, 1500),
    globals: (Array.isArray(b.globals) ? b.globals : []).map((g) => s(g, 300)).filter(Boolean).slice(0, 10),
    cards,
    modifiers: (Array.isArray(b.modifiers) ? b.modifiers : []).slice(0, 12).flatMap((x) => {
      const m = x && typeof x === "object" ? (x as Record<string, unknown>) : null;
      return m && s(m.code, 2) ? [{ code: s(m.code, 2), description: s(m.description, 500) }] : [];
    }),
    shots,
    end: s(b.end, 1200),
    audio: {
      bpm: typeof a.bpm === "number" && a.bpm > 30 && a.bpm < 260 ? +a.bpm.toFixed(1) : null,
      beats: times(a.beats, 400),
      sfx: (Array.isArray(a.sfx) ? a.sfx : []).slice(0, 80).flatMap((x) => {
        const e = x && typeof x === "object" ? (x as Record<string, unknown>) : null;
        return e && typeof e.t === "number" ? [{ t: +num(e.t, 0, 600, 0).toFixed(2), kind: s(e.kind, 30) || "hit" }] : [];
      }),
      music: s(a.music, 300),
      speech: (Array.isArray(a.speech) ? a.speech : []).slice(0, 60).flatMap((x) => {
        const e = x && typeof x === "object" ? (x as Record<string, unknown>) : null;
        return e && s(e.text, 300) ? [{ t0: num(e.t0, 0, 600, 0), t1: num(e.t1, 0, 600, 0), text: s(e.text, 300) }] : [];
      }),
      cutsOnBeat: a.cutsOnBeat === true,
    },
    compare: times(b.compare, 12),
  };
}

const r2 = (x: number) => +x.toFixed(2);

// The spec the template writer gets: every card, and the shot list as
// 30 fps frame numbers, so the remake keeps the reference's exact timing.
export function remakeSpec(b: Breakdown): { text: string; seconds: number } {
  const to30 = (f: number) => Math.round((f / b.fps) * 30);
  const seconds = Math.min(MAX_REMAKE_SECONDS, Math.max(3, Math.round(b.duration)));
  const last = seconds * 30;
  const shots = b.shots.map((x) => ({ ...x, start: to30(x.start), end: to30(x.end) })).filter((x) => x.start < last && x.end > x.start);
  const seq = shots.map((x) => `${x.start}:${x.card}${x.mods ?? ""}`).join(" ");
  const lines = [
    `Remake the FORMAT of the reference video below with the user's own product and message (see the brief). The breakdown decides WHEN things happen and how they move: the cuts, the timing, the transitions, the scale and energy. The brief decides WHAT is shown. Where they disagree about what is on screen, the brief wins; on timing, the breakdown wins. The reference was taken apart frame by frame; follow its timing, not your own guess at its pacing.`,
    `Length: ${seconds} seconds (${last} frames at 30 fps)${b.duration > MAX_REMAKE_SECONDS ? `; the reference is ${r2(b.duration)} s, so remake its first ${MAX_REMAKE_SECONDS} s` : ""}. Format: ${b.aspect}.`,
    `What it is: ${b.summary}`,
    b.globals.length ? `On every frame:\n${b.globals.map((g) => `- ${g}`).join("\n")}` : "",
    `Cards (each a reusable look; build each as its own component):\n${b.cards.map((c) => `- ${c.code}${c.name ? ` (${c.name})` : ""}: ${c.description}${c.text?.length ? ` Words on it in the reference: ${c.text.map((t) => `"${t}"`).join(", ")}.` : ""}`).join("\n")}`,
    b.modifiers.length ? `Modifiers (suffixes on a shot):\n${b.modifiers.map((m) => `- "${m.code}": ${m.description}`).join("\n")}` : "",
    b.end ? `End: ${b.end}` : "",
    `Shot list, as startFrame:card+modifiers at 30 fps (each shot lasts until the next one starts; ${shots.length} shots). Put it in the code as this one string, parsed once at the top of the file, and pick the current shot from the frame, so every cut lands on exactly this frame. Keep the code compact (well under 700 lines): one small component per card, shared helpers for the treatments and modifiers:\n${seq}`,
    b.audio?.bpm || b.audio?.music ? `Sound in the reference: ${[b.audio.music, b.audio.bpm ? `${b.audio.bpm} BPM` : "", b.audio.cutsOnBeat ? "cuts on the beat" : ""].filter(Boolean).join(", ")}.${b.audio.sfx?.length ? ` Sound effects at: ${b.audio.sfx.map((e) => `${e.t}s ${e.kind}`).join(", ")}.` : ""} Use the user's music (or Goblin's) and Goblin's sound effects at these moments; never the reference's audio.` : "",
    `Rules for a remake:\n- Keep the reference's structure: the same scenes in the same order, each starting on its frame, with the same kind of transition, the same motion (what enters from where, how it bounces or settles) and the same type scale.\n- The subject is the user's. A scene that shows the reference's product (its app screen, its interface, its content) is rebuilt as the user's product from the brief, in the same slot with the same motion: draw the user's screen or feature simply and clearly, never the reference's. If the brief doesn't say what a scene becomes, show the thing the brief announces, not the reference's content with new labels.\n- The look is the brand kit's: every colour from palette(b), the font from fontOf(b), on the kit's own background. Never take a colour, a font or a light or dark mood from the reference.\n- Never reproduce the reference's artwork, logos, characters, mascots or brand. Where it has a character, use what the brief gives, or plain shapes and simple icons in the brand's colours that suit the user's product.\n- Photos: the user's photos (or the stock photos attached) take the place of the reference's, given the same treatment. Don't add a photo backdrop only because the reference has one, if the user's scene doesn't need it.\n- Words: the user's words, handle and site replace the reference's. Where the brief gives none, write new ones of the same length that say what the user is announcing.\n- The end: the brand name lands the way the reference's last beat does, then one short line saying what's new and the site, if the brief gives them.\nThe pictures above the brief are the reference's cards (one example frame each, labelled with its code) and its shots (the middle frame of every shot, numbered): use them for timing, layout, scale and motion only.`,
  ];
  return { text: lines.filter(Boolean).join("\n\n"), seconds };
}

// Loads a finished breakdown the user owns, with its sheets as pictures for Claude.
export async function loadRemake(userId: string, id: string, agent: AgentApi): Promise<{ breakdown: Breakdown; blocks: Anthropic.ContentBlockParam[] } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { rows } = await db().query(`select files from studio.videos where id = $1 and user_id = $2 and kind = 'breakdown' and status = 'done'`, [id, userId]);
  const files = rows[0]?.files as { json?: string; cards?: string; shots?: string[] } | undefined;
  if (!files?.json) return null;
  const get = async (fileId: string) => {
    const r = await agent.fileContent(fileId);
    if (!r.ok) throw new Error(`breakdown file ${r.status}`);
    return Buffer.from(await r.arrayBuffer());
  };
  let breakdown: Breakdown | null = null;
  try {
    breakdown = cleanBreakdown(JSON.parse((await get(files.json)).toString("utf8")));
  } catch {
    breakdown = null;
  }
  if (!breakdown) return null;
  const pics: Anthropic.ContentBlockParam[] = [];
  const add = async (fileId: string | undefined, label: string) => {
    if (!fileId) return;
    const b = await get(fileId).catch(() => null);
    if (b && b.length < 4.5 * 1024 * 1024) pics.push({ type: "text", text: label }, { type: "image", source: { type: "base64", media_type: "image/jpeg", data: b.toString("base64") } });
  };
  await add(files.cards, "The reference's cards: one example frame of each, labelled with its code.");
  for (const [i, f] of (files.shots ?? []).slice(0, 3).entries()) await add(f, `The reference's shots, sheet ${i + 1}: the middle frame of every shot, numbered in order.`);
  return { breakdown, blocks: pics };
}

// What the page sends after comparing the remake with the reference.
export const COMPARE_NOTE =
  "The attached sheet compares the remake with the reference at the same moments: each pair is the reference on the left and the current template on the right, with the time above. The remake is meant to differ in subject and look: it shows the user's own product, words and brand colours where the reference shows its own, and none of that is a difference to fix. Fix the biggest differences in rhythm and craft only: what is on screen at each moment (the same scene should be playing), the scale and position of the main elements, how big the type is, how things enter, bounce and settle, and the transitions. Never change the words: every piece of text, the handle, the site, the field labels and every field default stay exactly as they are now. Never move toward the reference's colours, fonts, artwork, characters, logos, product or brand. Keep everything that already matches.";
