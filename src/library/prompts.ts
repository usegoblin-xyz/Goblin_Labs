// Launch-video prompt kit (original v1).
// Each prompt = BRAND block (from the brand kit) + TEMPLATE block (from the
// template's copy fields) + shared BUILD block, plus optional AUDIO and START.
import { FONTS, MOTIONS, type Brand } from "./brand";
import type { Template } from "./kit";
import { aspectLabel, seconds } from "./registry";

export type AudioMode = "off" | "subtle" | "music";
type Content = Record<string, string | number>;

const MOTION_NOTE =
  "(Snappy = fast ease-out, no overshoot. Smooth = long ease-in-out. Bouncy = one small overshoot per move, then settle.)";

const s = (v: unknown) => String(v ?? "").trim();
const list = (v: unknown) => s(v).split(",").map((x) => x.trim()).filter(Boolean);

function brandBlock(b: Brand) {
  return `<brand>
Product: ${b.name}
Colors: primary ${b.primary}, accent ${b.accent}, background ${b.background}, text ${b.foreground}. Use nothing outside this palette except pure black or white.
Typeface: ${FONTS[b.font].label} only, at most two weights.
Motion feel: ${MOTIONS[b.motion].label}  ${MOTION_NOTE}
Logo: wordmark "${b.name}" set in ${FONTS[b.font].label}
</brand>`;
}

function buildBlock(t: Template) {
  return `<build>
- Deliver a single HTML file sized ${t.width}x${t.height} (${aspectLabel(t)}), ${seconds(t)} seconds, 30 fps.
- Expose window.seek(t). Every visual property is a pure function of t. No CSS animations, timers, or state that survives between frames.
- Write easing as small named functions (easeOutExpo, spring, easeInOut) and reuse them.
- Keep text inside a safe margin of 6% on every side. Minimum text height is 4% of frame height.
- Render with Playwright, one PNG per frame, then encode with ffmpeg to H.264 MP4. Add audio only if the AUDIO block is included.
- Before the final render, export 6 evenly spaced still frames and check them for overlap, clipped text, low contrast and off-brand colors. Fix problems, then render.
</build>`;
}

const AUDIO_CUES: Record<string, string> = {
  "launch-title": "Low hit on first shape fill, tick per word, chime on subline",
  "feature-spotlight": "Whoosh as screen enters, click on toggle, soft tick per benefit",
  "changelog-drop": "Tick per entry, different pitch per tag (New high, Improved mid, Fixed low)",
  "stat-counter": "Rising pitch while each number counts, small hit when it lands",
  "bar-chart": "Soft thud per bar, brighter hit on the final bar",
  "logo-reveal": "Shapes snap with short clicks, one warm chime on the name",
  testimonial: "Gentle tick per line, soft pad swell under the name",
  "end-card": "Click as button draws in, chime on URL",
};

function audioBlock(mode: AudioMode, templateId: string) {
  if (mode === "off") return "";
  return `<audio>
Mode: ${mode}  (off | subtle | music)
Tempo: 110 BPM. Align every on-screen event to a beat or half-beat of this grid.
Mood: confident  (clean | confident | warm | energetic)
- Generate all sound in code with the Web Audio API using OfflineAudioContext. No samples, no downloads, no copyrighted material.
- subtle: sound effects only. A soft tick or click on each text reveal, a low whoosh on each large move, a short rising tone into the final hold, and one clean chime on the logo or CTA. Peak level -12 dBFS.
- music: add a simple loop under the effects. Kick on beats 1 and 3, soft hat on off-beats, a plain bass note per bar following the chord progression I-V-vi-IV in C major, and a short pad. Keep it minimal so it never competes with the effects. Music sits at -18 dBFS, effects at -10 dBFS.
- Sound moments for this template: ${AUDIO_CUES[templateId] ?? "tick on each reveal, chime on the final hold"}.
- Sync: compute each sound's start time from the same timeline data used by window.seek(t), so picture and sound cannot drift.
- Ending: fade everything out over the last 0.3s. The video's last frame and last sample end together. Make the first and last 50 ms silent to avoid clicks.
- Loudness: normalize the final mix to about -16 LUFS and prevent clipping (peak below -1 dBFS).
- Output: render to a 48 kHz stereo WAV, then mux into the MP4 with ffmpeg (AAC, 192 kbps).
- Check: before the final render, list every sound with its timestamp and the visual event it matches. Fix any that are more than one frame (about 33 ms) off.
</audio>`;
}

const START = `<start>
Reply with a one-line concept and a shot list with timestamps. Then build it without asking questions and return the MP4 and the HTML source.
</start>`;

// TEMPLATE blocks, filled from each template's copy fields.
const TEMPLATE_BLOCKS: Record<string, (c: Content, b: Brand) => string> = {
  "launch-title": (c) => `Goal: open a launch video with the headline "${s(c.headline)}".
Shot list: 0.0 to 0.6s: brand-colored shape fills the frame. 0.6 to 2.8s: shape cuts into the headline, one word revealing at a time, longest word last. 2.8 to 4.2s: subline "${s(c.subhead)}" slides in under the headline. 4.2 to 5.0s: everything exits in the direction it entered.
Rules: the headline is the only large type. One accent color word at most. No logos until the final half second.`,

  "feature-spotlight": (c) => `Goal: announce "${s(c.title)}" and three benefits: ${s(c.point1)}, ${s(c.point2)}, ${s(c.point3)}.
Shot list: 0 to 1.2s: feature name appears at left. 1.2 to 3.0s: a simplified product screen (built from rectangles and text, not a screenshot) enters at right and one control toggles on. 3.0 to 5.4s: the three benefits appear as check rows, 0.6s apart. 5.4 to 6.0s: hold, then exit.
Rules: UI is flat, drawn from the brand palette, with no more than 8 elements on screen.`,

  "changelog-drop": (c) => {
    const entries = [c.item1, c.item2, c.item3, c.item4].map(s).filter(Boolean).join("; ");
    return `Goal: show release ${s(c.version)} notes as a vertical social clip.
Content: up to 4 entries, each with a tag (New, Improved, Fixed) and one line of text: ${entries}.
Shot list: 0 to 0.8s: version number scales in at top. Then one entry every 1.0s, stacking downward, newest at the bottom. Last 0.8s: product name and URL.
Rules: tags use a consistent shape per type. Text stays in the middle 80% of the frame to avoid platform UI overlap.`;
  },

  "stat-counter": (c) => `Goal: show traction numbers: ${s(c.label1)} ${s(c.value1)}${s(c.suffix1)}, ${s(c.label2)} ${s(c.value2)}${s(c.suffix2)}, ${s(c.label3)} ${s(c.value3)}${s(c.suffix3)}.
Shot list: title in 0 to 0.6s. Each number counts from 0 to its value over 1.0s with an ease-out, staggered 0.4s apart. Last 0.8s: hold all three, then exit.
Rules: numbers use tabular figures so they do not jitter while counting. Use only real values provided by the user. Never invent figures.`,

  "bar-chart": (c) => {
    const labels = list(c.labels);
    const values = list(c.values);
    const unit = s(c.unit);
    const pairs = labels.map((l, i) => `${l}: ${values[i] ?? "?"}${unit}`).join(", ");
    return `Goal: animate a bar chart of ${s(c.caption)} for these periods and values: ${pairs}.
Shot list: axis and title in 0 to 0.8s. Bars rise one by one, 0.5s apart, each with an ease-out. The final bar uses the accent color and its value label appears last. Last 0.8s: callout "${s(c.title)}".
Rules: y-axis starts at zero. Label units. Bars are never taller than 70% of the frame height.`;
  },

  "logo-reveal": (_c, b) => `Goal: reveal the wordmark "${b.name}" and the product name.
Shot list: 0 to 1.5s: the logo mark is built from two or three simple shapes that move into place. 1.5 to 2.8s: product name appears to the right, letter by letter. 2.8 to 4.0s: hold, then a clean exit.
Rules: one motion idea only. No sound effects or glows. End on a frame that works as a still thumbnail.`,

  testimonial: (c) => {
    const [title = "", ...rest] = s(c.role).split(",");
    const company = rest.join(",").trim();
    return `Goal: present this testimonial: "${s(c.quote)}" by ${s(c.author)}, ${title.trim()}${company ? `, ${company}` : ""}.
Shot list: 0 to 0.6s: quotation mark appears. 0.6 to 4.0s: quote text reveals line by line, 0.5s apart. 4.0 to 5.0s: name and title appear. 5.0 to 6.0s: product logo in the corner, hold.
Rules: use only a quote the user has permission to publish. Keep the quote under 25 words, otherwise ask for a shortened version.`;
  },

  "end-card": (c) => `Goal: close any video with the call to action "${s(c.headline)}" and the URL ${s(c.url)}.
Shot list: 0 to 0.8s: CTA headline appears. 0.8 to 1.8s: button shape draws in around ${s(c.button)}. 1.8 to 3.2s: URL fades up below. 3.2 to 4.0s: hold.
Rules: the button is the highest-contrast object in frame. URL text must be readable at 360p.`,
};

export function hasPrompt(t: Template) {
  return t.id in TEMPLATE_BLOCKS;
}

export function buildPrompt(t: Template, brand: Brand, content: Content, audio: AudioMode): string | null {
  const block = TEMPLATE_BLOCKS[t.id];
  if (!block) return null;
  return [
    brandBlock(brand),
    `<template>\n${block(content, brand)}\n</template>`,
    buildBlock(t),
    audioBlock(audio, t.id),
    START,
  ]
    .filter(Boolean)
    .join("\n\n");
}
