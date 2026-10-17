import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { alpha, onColor } from "../brand";
import { enter, font, outro, ramp, type Template, type TemplateProps } from "../kit";

type C = { headline: string; button: string; url: string };

function EndCard({ brand, content }: TemplateProps<C>) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = outro(frame, durationInFrames, 10);
  const btn = enter(frame, fps, brand, 26);
  const pulse = ((frame - 40) % 36) / 36; // repeating ring after the button lands
  const showPulse = frame > 40;
  const words = content.headline.split(/\s+/).filter(Boolean);

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
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${alpha(brand.foreground, 0.13)} 2px, transparent 2px)`,
          backgroundSize: "48px 48px",
          backgroundPosition: `0 ${-frame * 0.6}px`,
          maskImage: "radial-gradient(60% 60% at 50% 50%, black, transparent)",
          WebkitMaskImage: "radial-gradient(60% 60% at 50% 50%, black, transparent)",
          opacity: ramp(frame, 0, 20),
        }}
      />
      <div style={{ position: "absolute", top: 70, left: 90, fontSize: 34, fontWeight: 600, opacity: ramp(frame, 2, 16) }}>
        {brand.name}
      </div>
      <h2 style={{ margin: 0, fontSize: 132, fontWeight: 600, letterSpacing: "-0.04em", textAlign: "center" }}>
        {words.map((w, i) => {
          const s = enter(frame, fps, brand, 4 + i * 4);
          return (
            <span key={i} style={{ display: "inline-block", opacity: s, transform: `translateY(${(1 - s) * 40}px)`, marginRight: "0.24em" }}>
              {w}
            </span>
          );
        })}
      </h2>
      <div style={{ position: "relative", marginTop: 70 }}>
        {showPulse && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 999,
              border: `4px solid ${brand.primary}`,
              transform: `scale(${1 + pulse * 0.35})`,
              opacity: 1 - pulse,
            }}
          />
        )}
        <div
          style={{
            padding: "34px 74px",
            borderRadius: 999,
            background: brand.primary,
            color: onColor(brand.primary),
            fontSize: 52,
            fontWeight: 600,
            transform: `scale(${btn})`,
          }}
        >
          {content.button} →
        </div>
      </div>
      <div
        style={{
          marginTop: 46,
          fontSize: 38,
          color: alpha(brand.foreground, 0.6),
          letterSpacing: "0.02em",
          opacity: ramp(frame, 40, 56),
        }}
      >
        {content.url}
      </div>
    </AbsoluteFill>
  );
}

export const endCard: Template<C> = {
  id: "end-card",
  title: "End Card CTA",
  outcome: "Close any video with a call to action and your URL",
  category: "Launch",
  tags: ["cta", "outro", "end screen", "sign up"],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 120,
  component: EndCard,
  defaults: { headline: "Start free today", button: "Get started", url: "usegoblin.xyz" },
  fields: [
    { key: "headline", label: "Headline", type: "text" },
    { key: "button", label: "Button", type: "text" },
    { key: "url", label: "URL", type: "text" },
  ],
};
