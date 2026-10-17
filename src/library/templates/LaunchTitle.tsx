import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { alpha } from "../brand";
import { enter, font, outro, ramp, type Template, type TemplateProps } from "../kit";

type C = { eyebrow: string; headline: string; subhead: string };

function LaunchTitle({ brand, content }: TemplateProps<C>) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const words = content.headline.split(/\s+/).filter(Boolean);
  const out = outro(frame, durationInFrames);
  const glowX = interpolate(frame, [0, durationInFrames], [35, 65]);
  const bar = enter(frame, fps, brand, 18 + words.length * 4);
  const pill = enter(frame, fps, brand, 4);

  return (
    <AbsoluteFill
      style={{
        background: brand.background,
        color: brand.foreground,
        fontFamily: font(brand),
        fontSynthesis: "none",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 55% at ${glowX}% 60%, ${alpha(brand.primary, 0.28)}, transparent 70%)`,
          opacity: ramp(frame, 0, 30) * out,
        }}
      />
      <div style={{ opacity: out, transform: `scale(${1 + (1 - out) * 0.04})`, textAlign: "center", padding: "0 160px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            padding: "12px 26px",
            borderRadius: 999,
            border: `2px solid ${alpha(brand.foreground, 0.16)}`,
            fontSize: 30,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            opacity: pill,
            transform: `translateY(${(1 - pill) * 20}px)`,
          }}
        >
          <span style={{ width: 14, height: 14, borderRadius: 99, background: brand.primary }} />
          {content.eyebrow} {brand.name}
        </div>
        <h1
          style={{
            margin: "44px 0 0",
            fontSize: 124,
            lineHeight: 1.04,
            fontWeight: 600,
            letterSpacing: "-0.035em",
          }}
        >
          {words.map((w, i) => {
            const p = enter(frame, fps, brand, 14 + i * 4);
            const last = i === words.length - 1;
            return (
              <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: 12 }}>
                <span
                  style={{
                    display: "inline-block",
                    transform: `translateY(${(1 - p) * 110}%)`,
                    color: last ? brand.primary : undefined,
                    marginRight: last ? 0 : "0.25em",
                  }}
                >
                  {w}
                </span>
              </span>
            );
          })}
        </h1>
        <div
          style={{
            height: 8,
            width: 260,
            margin: "18px auto 0",
            borderRadius: 99,
            background: brand.primary,
            transform: `scaleX(${bar})`,
          }}
        />
        <p
          style={{
            margin: "40px auto 0",
            maxWidth: 1200,
            fontSize: 44,
            lineHeight: 1.35,
            color: alpha(brand.foreground, 0.7),
            opacity: ramp(frame, 48, 66),
            transform: `translateY(${ramp(frame, 48, 66, [24, 0])}px)`,
          }}
        >
          {content.subhead}
        </p>
      </div>
    </AbsoluteFill>
  );
}

export const launchTitle: Template<C> = {
  id: "launch-title",
  title: "Launch Title",
  outcome: "Open a launch video with a punchy headline reveal",
  category: "Launch",
  tags: ["intro", "headline", "kinetic type", "product hunt"],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 150,
  component: LaunchTitle,
  defaults: {
    eyebrow: "Introducing",
    headline: "Launch videos in minutes",
    subhead: "On-brand motion for every release, without a designer.",
  },
  fields: [
    { key: "eyebrow", label: "Eyebrow", type: "text", hint: "Shown before your product name" },
    { key: "headline", label: "Headline", type: "text", hint: "Last word gets your primary color" },
    { key: "subhead", label: "Subhead", type: "textarea" },
  ],
};
