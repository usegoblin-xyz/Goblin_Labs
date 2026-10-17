import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { alpha, onColor } from "../brand";
import { font, outro, ramp, type Template, type TemplateProps } from "../kit";

type C = { label: string; date: string; reveal: string };

function LaunchCountdown({ brand, content }: TemplateProps<C>) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const out = outro(frame, durationInFrames);
  const beat = 26; // frames per number
  const start = 12;
  const nums = [3, 2, 1];
  const revealAt = start + nums.length * beat;
  const reveal = interpolate(frame, [revealAt, revealAt + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: brand.background,
        color: brand.foreground,
        fontFamily: font(brand),
        fontSynthesis: "none",
        justifyContent: "center",
        alignItems: "center",
        opacity: out,
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 110, fontSize: 34, letterSpacing: "0.16em", textTransform: "uppercase", color: alpha(brand.foreground, 0.6), opacity: ramp(frame, 0, 12) }}>
        {content.label}
      </div>

      {nums.map((n, i) => {
        const t0 = start + i * beat;
        const local = frame - t0;
        if (local < 0 || local > beat) return null;
        const s = interpolate(local, [0, 8, beat - 6, beat], [1.6, 1, 1, 0.6], { extrapolateRight: "clamp" });
        const o = interpolate(local, [0, 5, beat - 6, beat], [0, 1, 1, 0], { extrapolateRight: "clamp" });
        const ring = interpolate(local, [0, beat], [0, 1]);
        return (
          <div key={n} style={{ position: "absolute", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div
              style={{
                position: "absolute",
                width: 560,
                height: 560,
                borderRadius: 999,
                border: `6px solid ${alpha(brand.primary, 0.6 * (1 - ring))}`,
                transform: `scale(${0.6 + ring * 0.6})`,
              }}
            />
            <div style={{ fontSize: 460, fontWeight: 700, lineHeight: 1, color: brand.primary, transform: `scale(${s})`, opacity: o, fontVariantNumeric: "tabular-nums" }}>
              {n}
            </div>
          </div>
        );
      })}

      <div style={{ textAlign: "center", opacity: reveal, transform: `scale(${0.85 + reveal * 0.15})` }}>
        <div style={{ fontSize: 120, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1 }}>{content.reveal}</div>
        <div
          style={{
            display: "inline-block",
            marginTop: 50,
            padding: "18px 40px",
            borderRadius: 99,
            background: brand.primary,
            color: onColor(brand.primary),
            fontSize: 44,
            fontWeight: 600,
          }}
        >
          {content.date}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 110, fontSize: 36, fontWeight: 600, opacity: ramp(frame, 4, 16) }}>{brand.name}</div>
    </AbsoluteFill>
  );
}

export const launchCountdown: Template<C> = {
  id: "launch-countdown",
  title: "Launch Countdown",
  outcome: "Build hype with a 3-2-1 countdown to your launch date",
  category: "Launch",
  tags: ["countdown", "teaser", "product hunt", "hype", "square"],
  width: 1080,
  height: 1080,
  fps: 30,
  durationInFrames: 150,
  component: LaunchCountdown,
  defaults: { label: "Something new is coming", reveal: "We launch", date: "Tuesday · 9am PT" },
  fields: [
    { key: "label", label: "Top label", type: "text" },
    { key: "reveal", label: "Reveal line", type: "text" },
    { key: "date", label: "Date", type: "text" },
  ],
};
