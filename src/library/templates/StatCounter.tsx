import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { alpha } from "../brand";
import { enter, font, outro, ramp, type Template, type TemplateProps } from "../kit";

type C = {
  title: string;
  value1: number; suffix1: string; label1: string;
  value2: number; suffix2: string; label2: string;
  value3: number; suffix3: string; label3: string;
};

function StatCounter({ brand, content }: TemplateProps<C>) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = outro(frame, durationInFrames);
  const stats = [
    { v: Number(content.value1) || 0, s: content.suffix1, l: content.label1 },
    { v: Number(content.value2) || 0, s: content.suffix2, l: content.label2 },
    { v: Number(content.value3) || 0, s: content.suffix3, l: content.label3 },
  ];

  return (
    <AbsoluteFill
      style={{
        background: brand.background,
        color: brand.foreground,
        fontFamily: font(brand),
        fontSynthesis: "none",
        padding: "110px 100px",
        opacity: out,
      }}
    >
      <div
        style={{
          fontSize: 34,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: alpha(brand.foreground, 0.6),
          opacity: ramp(frame, 2, 16),
        }}
      >
        {brand.name}
      </div>
      <div
        style={{
          fontSize: 64,
          fontWeight: 600,
          letterSpacing: "-0.03em",
          margin: "14px 0 70px",
          opacity: ramp(frame, 6, 22),
          transform: `translateY(${ramp(frame, 6, 22, [20, 0])}px)`,
        }}
      >
        {content.title}
      </div>
      {stats.map((st, i) => {
        const start = 20 + i * 16;
        const s = enter(frame, fps, brand, start);
        const n = interpolate(frame, [start, start + 50], [0, st.v], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.exp),
        });
        const shown = st.v % 1 === 0 ? Math.round(n).toLocaleString("en-US") : n.toFixed(1);
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "stretch",
              gap: 34,
              marginBottom: 54,
              opacity: s,
              transform: `translateY(${(1 - s) * 30}px)`,
            }}
          >
            <div
              style={{
                width: 12,
                borderRadius: 99,
                background: i === 0 ? brand.primary : i === 1 ? brand.accent : alpha(brand.foreground, 0.3),
                transform: `scaleY(${s})`,
                transformOrigin: "top",
              }}
            />
            <div>
              <div style={{ fontSize: 132, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums" }}>
                {shown}
                <span style={{ color: brand.primary }}>{st.s}</span>
              </div>
              <div style={{ fontSize: 36, marginTop: 10, color: alpha(brand.foreground, 0.65) }}>{st.l}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

export const statCounter: Template<C> = {
  id: "stat-counter",
  title: "Stat Counter",
  outcome: "Show traction numbers counting up for a social post",
  category: "Data",
  tags: ["metrics", "traction", "numbers", "square", "social"],
  width: 1080,
  height: 1080,
  fps: 30,
  durationInFrames: 150,
  component: StatCounter,
  defaults: {
    title: "Year one in numbers",
    value1: 12400, suffix1: "+", label1: "teams onboarded",
    value2: 98, suffix2: "%", label2: "renders under a minute",
    value3: 4.9, suffix3: "/5", label3: "average rating",
  },
  fields: [
    { key: "title", label: "Title", type: "text" },
    { key: "value1", label: "Stat 1 value", type: "number" },
    { key: "suffix1", label: "Stat 1 suffix", type: "text" },
    { key: "label1", label: "Stat 1 label", type: "text" },
    { key: "value2", label: "Stat 2 value", type: "number" },
    { key: "suffix2", label: "Stat 2 suffix", type: "text" },
    { key: "label2", label: "Stat 2 label", type: "text" },
    { key: "value3", label: "Stat 3 value", type: "number" },
    { key: "suffix3", label: "Stat 3 suffix", type: "text" },
    { key: "label3", label: "Stat 3 label", type: "text" },
  ],
};
