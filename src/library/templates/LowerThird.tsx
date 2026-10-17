import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { alpha, onColor } from "../brand";
import { font, ramp, type Template, type TemplateProps } from "../kit";

type C = { name: string; title: string };

// A name/title bar for interviews and demos. The backdrop stands in for
// footage; on export the bar would sit over the user's own video.
function LowerThird({ brand, content }: TemplateProps<C>) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const ease = Easing.bezier(0.2, 0.8, 0.2, 1);
  const inT = interpolate(frame, [10, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const outT = interpolate(frame, [durationInFrames - 26, durationInFrames - 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const bar = inT * (1 - outT);
  const textIn = ramp(frame, 22, 38) * (1 - outT);

  return (
    <AbsoluteFill style={{ fontFamily: font(brand), fontSynthesis: "none", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 70% at 62% 40%, ${alpha(brand.foreground, 0.16)}, transparent 70%), linear-gradient(135deg, ${alpha(brand.primary, 0.25)}, ${brand.background} 55%)`,
          backgroundColor: brand.background,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "56%",
          top: 170,
          width: 420,
          height: 420,
          borderRadius: 999,
          background: alpha(brand.foreground, 0.08),
          transform: "translateX(-50%)",
        }}
      />
      <div style={{ position: "absolute", left: 120, bottom: 130, display: "flex", alignItems: "stretch" }}>
        <div style={{ width: 14, borderRadius: 4, background: brand.primary, transform: `scaleY(${bar})`, transformOrigin: "bottom" }} />
        <div style={{ overflow: "hidden", marginLeft: 0 }}>
          <div
            style={{
              background: alpha(brand.background, 0.92),
              padding: "30px 48px 32px 40px",
              transform: `translateX(${(bar - 1) * 105}%)`,
              borderRadius: "0 18px 18px 0",
            }}
          >
            <div style={{ fontSize: 64, fontWeight: 700, color: brand.foreground, opacity: textIn, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>{content.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 8, opacity: textIn }}>
              <span style={{ fontSize: 34, color: alpha(brand.foreground, 0.7), whiteSpace: "nowrap" }}>{content.title}</span>
              <span
                style={{
                  padding: "4px 16px",
                  borderRadius: 99,
                  background: brand.primary,
                  color: onColor(brand.primary),
                  fontSize: 24,
                  fontWeight: 600,
                }}
              >
                {brand.name}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export const lowerThird: Template<C> = {
  id: "lower-third",
  title: "Lower Third",
  outcome: "Introduce a speaker with a name and title bar in demos and interviews",
  category: "Brand",
  tags: ["lower third", "name tag", "interview", "speaker", "overlay"],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 120,
  component: LowerThird,
  defaults: { name: "Alex Rivera", title: "Founder & CEO" },
  fields: [
    { key: "name", label: "Name", type: "text" },
    { key: "title", label: "Title", type: "text" },
  ],
};
