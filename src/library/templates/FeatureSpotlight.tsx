import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { alpha, onColor } from "../brand";
import { enter, font, outro, ramp, type Template, type TemplateProps } from "../kit";

type C = { label: string; title: string; point1: string; point2: string; point3: string };

function Check({ color, on }: { color: string; on: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="12" fill={color} />
      <path d="M7 12.5l3.2 3.2L17 9" stroke={on} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FeatureSpotlight({ brand, content }: TemplateProps<C>) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = outro(frame, durationInFrames);
  const win = enter(frame, fps, brand, 6);
  const toggle = enter(frame, fps, brand, 96);
  const fill = ramp(frame, 104, 150);
  const fg = brand.foreground;
  const points = [content.point1, content.point2, content.point3];

  return (
    <AbsoluteFill
      style={{
        background: brand.background,
        color: fg,
        fontFamily: font(brand),
        fontSynthesis: "none",
        flexDirection: "row",
        alignItems: "center",
        padding: "0 140px",
        gap: 110,
        opacity: out,
      }}
    >
      <div style={{ flex: "0 0 700px" }}>
        <div
          style={{
            fontSize: 28,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: brand.primary,
            opacity: ramp(frame, 4, 18),
          }}
        >
          {content.label}
        </div>
        <h2
          style={{
            margin: "22px 0 54px",
            fontSize: 88,
            lineHeight: 1.05,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            opacity: ramp(frame, 10, 28),
            transform: `translateY(${ramp(frame, 10, 28, [30, 0])}px)`,
          }}
        >
          {content.title}
        </h2>
        {points.map((p, i) => {
          const s = enter(frame, fps, brand, 44 + i * 14);
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                marginBottom: 30,
                fontSize: 40,
                opacity: s,
                transform: `translateX(${(1 - s) * -40}px)`,
              }}
            >
              <div style={{ transform: `scale(${s})` }}>
                <Check color={brand.primary} on={onColor(brand.primary)} />
              </div>
              <span style={{ color: alpha(fg, 0.85) }}>{p}</span>
            </div>
          );
        })}
      </div>

      <div
        style={{
          flex: 1,
          height: 660,
          borderRadius: 32,
          background: alpha(fg, 0.04),
          border: `2px solid ${alpha(fg, 0.12)}`,
          boxShadow: `0 60px 120px ${alpha(brand.primary, 0.18)}`,
          transform: `translateX(${(1 - win) * 260}px) rotate(${(1 - win) * 4}deg)`,
          opacity: win,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", gap: 12, padding: "24px 28px", borderBottom: `2px solid ${alpha(fg, 0.08)}` }}>
          {[0.5, 0.3, 0.2].map((a, i) => (
            <span key={i} style={{ width: 18, height: 18, borderRadius: 99, background: alpha(fg, a) }} />
          ))}
        </div>
        <div style={{ display: "flex", flex: 1 }}>
          <div style={{ width: 200, padding: 28, borderRight: `2px solid ${alpha(fg, 0.08)}` }}>
            {[0.9, 0.6, 0.6, 0.6].map((w, i) => (
              <div
                key={i}
                style={{
                  height: 16,
                  width: `${w * 100}%`,
                  borderRadius: 8,
                  marginBottom: 26,
                  background: i === 0 ? brand.primary : alpha(fg, 0.12),
                }}
              />
            ))}
          </div>
          <div style={{ flex: 1, padding: 44 }}>
            <div style={{ height: 26, width: "55%", borderRadius: 10, background: alpha(fg, 0.22) }} />
            <div style={{ height: 16, width: "80%", borderRadius: 8, marginTop: 22, background: alpha(fg, 0.1) }} />
            <div
              style={{
                marginTop: 54,
                padding: 34,
                borderRadius: 22,
                background: alpha(fg, 0.05),
                border: `2px solid ${alpha(fg, 0.1)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 30, fontWeight: 600 }}>{content.title}</div>
                <div style={{ fontSize: 22, marginTop: 8, color: alpha(fg, 0.55) }}>{brand.name}</div>
              </div>
              <div
                style={{
                  width: 120,
                  height: 64,
                  borderRadius: 99,
                  padding: 7,
                  background: toggle > 0.5 ? brand.primary : alpha(fg, 0.18),
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 99,
                    background: toggle > 0.5 ? onColor(brand.primary) : brand.background,
                    transform: `translateX(${toggle * 56}px)`,
                  }}
                />
              </div>
            </div>
            <div style={{ marginTop: 44, height: 18, borderRadius: 99, background: alpha(fg, 0.08), overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${fill * 100}%`, background: brand.accent, borderRadius: 99 }} />
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export const featureSpotlight: Template<C> = {
  id: "feature-spotlight",
  title: "Feature Spotlight",
  outcome: "Announce a new feature with a product UI and three benefits",
  category: "Product",
  tags: ["feature launch", "ui mockup", "benefits", "announcement"],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 180,
  component: FeatureSpotlight,
  defaults: {
    label: "New feature",
    title: "Auto brand kits",
    point1: "Pull colors from your site",
    point2: "Match fonts automatically",
    point3: "Apply to every template",
  },
  fields: [
    { key: "label", label: "Label", type: "text" },
    { key: "title", label: "Feature name", type: "text" },
    { key: "point1", label: "Benefit 1", type: "text" },
    { key: "point2", label: "Benefit 2", type: "text" },
    { key: "point3", label: "Benefit 3", type: "text" },
  ],
};
