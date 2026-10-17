import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing, random } from "remotion";
import { alpha } from "../brand";
import { font, outro, ramp, type Template, type TemplateProps } from "../kit";

type C = { value: number; suffix: string; label: string; thanks: string };

const PIECES = 70;

function Milestone({ brand, content }: TemplateProps<C>) {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const out = outro(frame, durationInFrames);
  const v = Number(content.value) || 0;
  const n = interpolate(frame, [8, 58], [0, v], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.exp) });
  const burst = 58;
  const pulse = interpolate(frame, [burst - 2, burst + 5, burst + 18], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const colors = [brand.primary, brand.accent, brand.foreground];

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
      {/* Deterministic confetti: same seed, same burst, every render. */}
      {Array.from({ length: PIECES }).map((_, i) => {
        const t = frame - burst;
        if (t < 0) return null;
        const angle = random(`a${i}`) * Math.PI * 2;
        const speed = 14 + random(`s${i}`) * 22;
        const x = width / 2 + Math.cos(angle) * speed * t;
        const y = height / 2 + Math.sin(angle) * speed * t + 0.9 * t * t;
        const rot = random(`r${i}`) * 360 + t * 12;
        const o = interpolate(t, [0, 40, 70], [1, 1, 0], { extrapolateRight: "clamp" });
        const w = 14 + random(`w${i}`) * 14;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: w,
              height: w * 0.45,
              borderRadius: 3,
              background: colors[i % colors.length],
              transform: `rotate(${rot}deg)`,
              opacity: o,
            }}
          />
        );
      })}

      <div style={{ fontSize: 36, color: alpha(brand.foreground, 0.6), opacity: ramp(frame, 0, 14) }}>{brand.name}</div>
      <div
        style={{
          fontSize: 260,
          fontWeight: 700,
          letterSpacing: "-0.05em",
          lineHeight: 1,
          marginTop: 20,
          fontVariantNumeric: "tabular-nums",
          transform: `scale(${1 + pulse * 0.08})`,
        }}
      >
        {Math.round(n).toLocaleString("en-US")}
        <span style={{ color: brand.primary }}>{content.suffix}</span>
      </div>
      <div style={{ fontSize: 56, fontWeight: 600, marginTop: 24, opacity: ramp(frame, 20, 36) }}>{content.label}</div>
      <div
        style={{
          marginTop: 50,
          fontSize: 38,
          color: alpha(brand.foreground, 0.7),
          opacity: ramp(frame, burst + 6, burst + 22),
          transform: `translateY(${ramp(frame, burst + 6, burst + 22, [20, 0])}px)`,
        }}
      >
        {content.thanks}
      </div>
    </AbsoluteFill>
  );
}

export const milestone: Template<C> = {
  id: "milestone",
  title: "Milestone Celebration",
  outcome: "Celebrate a user or revenue milestone with a count-up and confetti",
  category: "Data",
  tags: ["milestone", "celebration", "users", "confetti", "thank you", "square"],
  width: 1080,
  height: 1080,
  fps: 30,
  durationInFrames: 150,
  component: Milestone,
  defaults: { value: 10000, suffix: "", label: "teams and counting", thanks: "Thank you for building with us" },
  fields: [
    { key: "value", label: "Number", type: "number" },
    { key: "suffix", label: "Suffix", type: "text", hint: "e.g. + or k" },
    { key: "label", label: "Label", type: "text" },
    { key: "thanks", label: "Thank-you line", type: "text" },
  ],
};
