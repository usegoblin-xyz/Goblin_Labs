import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { alpha, onColor } from "../brand";
import { enter, font, outro, ramp, type Template, type TemplateProps } from "../kit";

type C = { speaker: string; transcript: string };

const WORDS_PER_LINE = 3;

// Captions shown a few words at a time, with the spoken word highlighted —
// the style used on podcast and talking-head clips.
function KineticCaptions({ brand, content }: TemplateProps<C>) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = outro(frame, durationInFrames, 10);
  const words = content.transcript.split(/\s+/).filter(Boolean);
  const start = 14;
  const span = durationInFrames - start - 20;
  const per = Math.max(4, span / Math.max(1, words.length));
  const idx = Math.min(words.length - 1, Math.max(0, Math.floor((frame - start) / per)));
  const lineStart = Math.floor(idx / WORDS_PER_LINE) * WORDS_PER_LINE;
  const line = words.slice(lineStart, lineStart + WORDS_PER_LINE);
  const lineAppear = enter(frame, fps, brand, start + lineStart * per);
  const progress = ramp(frame, start, start + span);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${brand.background}, ${alpha(brand.primary, 0.18)})`,
        backgroundColor: brand.background,
        color: brand.foreground,
        fontFamily: font(brand),
        fontSynthesis: "none",
        opacity: out,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 160,
          left: 90,
          right: 90,
          display: "flex",
          alignItems: "center",
          gap: 28,
          opacity: ramp(frame, 0, 14),
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 99,
            background: brand.primary,
            color: onColor(brand.primary),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 42,
            fontWeight: 700,
          }}
        >
          {(content.speaker.trim()[0] ?? "?").toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 40, fontWeight: 600 }}>{content.speaker}</div>
          <div style={{ fontSize: 30, color: alpha(brand.foreground, 0.6) }}>{brand.name}</div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: "50%",
          transform: `translateY(-50%) scale(${0.92 + lineAppear * 0.08})`,
          textAlign: "center",
          fontSize: 124,
          fontWeight: 700,
          lineHeight: 1.08,
          letterSpacing: "-0.02em",
          textTransform: "uppercase",
        }}
      >
        {line.map((w, i) => {
          const active = lineStart + i === idx && frame >= start;
          const spoken = lineStart + i <= idx && frame >= start;
          return (
            <span
              key={`${lineStart}-${i}`}
              style={{
                display: "inline-block",
                margin: "0 14px 18px",
                padding: active ? "4px 22px" : "4px 0",
                borderRadius: 22,
                background: active ? brand.primary : "transparent",
                color: active ? onColor(brand.primary) : spoken ? brand.foreground : alpha(brand.foreground, 0.35),
                transform: `rotate(${active ? -2 : 0}deg)`,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>

      <div style={{ position: "absolute", left: 90, right: 90, bottom: 180, height: 10, borderRadius: 99, background: alpha(brand.foreground, 0.12) }}>
        <div style={{ height: "100%", width: `${progress * 100}%`, borderRadius: 99, background: brand.accent }} />
      </div>
    </AbsoluteFill>
  );
}

export const kineticCaptions: Template<C> = {
  id: "kinetic-captions",
  title: "Kinetic Captions",
  outcome: "Add bold word-by-word captions to a podcast or talking-head clip",
  category: "Social",
  tags: ["captions", "subtitles", "podcast", "shorts", "vertical", "tiktok"],
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 210,
  component: KineticCaptions,
  defaults: {
    speaker: "Jordan Park",
    transcript: "We stopped hiring designers for every launch video and started shipping twice as often",
  },
  fields: [
    { key: "speaker", label: "Speaker", type: "text" },
    { key: "transcript", label: "Transcript", type: "textarea", hint: "Words are paced evenly across the clip" },
  ],
};
