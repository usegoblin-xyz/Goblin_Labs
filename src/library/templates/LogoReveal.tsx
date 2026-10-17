import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { alpha, onColor } from "../brand";
import { enter, font, outro, ramp, type Template, type TemplateProps } from "../kit";

type C = { tagline: string };

function LogoReveal({ brand, content }: TemplateProps<C>) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = outro(frame, durationInFrames, 16);
  const dot = enter(frame, fps, brand, 4);
  const morph = enter(frame, fps, brand, 22); // circle → rounded square
  const slide = enter(frame, fps, brand, 42); // mark moves left, name wipes in
  const wipe = ramp(frame, 46, 70);
  const ring = interpolate(frame, [22, 52], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const initial = (brand.name.trim()[0] ?? "G").toUpperCase();
  const size = 220;

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
      }}
    >
      <div style={{ display: "flex", alignItems: "center"}}>
        <div style={{ position: "relative", width: size, height: size }}>
          <div
            style={{
              position: "absolute",
              inset: -40 * ring,
              borderRadius: 999,
              border: `4px solid ${alpha(brand.primary, 0.5 * (1 - ring))}`,
            }}
          />
          <div
            style={{
              width: size,
              height: size,
              borderRadius: interpolate(morph, [0, 1], [size / 2, 56]),
              background: brand.primary,
              transform: `scale(${dot * (0.35 + morph * 0.65)}) rotate(${(1 - morph) * -90}deg)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: onColor(brand.primary),
              fontSize: 140,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            <span style={{ opacity: morph, transform: `scale(${morph})` }}>{initial}</span>
          </div>
        </div>
        <div
          style={{
            overflow: "hidden",
            maxWidth: slide * 1100,
            marginLeft: slide * 56,
          }}
        >
          <div
            style={{
              fontSize: 180,
              fontWeight: 600,
              letterSpacing: "-0.045em",
              whiteSpace: "nowrap",
              clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
            }}
          >
            {brand.name}
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: 50,
          fontSize: 44,
          color: alpha(brand.foreground, 0.65),
          letterSpacing: "0.02em",
          opacity: ramp(frame, 66, 84),
          transform: `translateY(${ramp(frame, 66, 84, [18, 0])}px)`,
        }}
      >
        {content.tagline}
      </div>
    </AbsoluteFill>
  );
}

export const logoReveal: Template<C> = {
  id: "logo-reveal",
  title: "Logo Reveal",
  outcome: "Reveal your logo and name at the start or end of any video",
  category: "Brand",
  tags: ["logo", "sting", "intro", "outro", "wordmark"],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 120,
  component: LogoReveal,
  defaults: { tagline: "Motion that matches your brand" },
  fields: [{ key: "tagline", label: "Tagline", type: "text" }],
};
