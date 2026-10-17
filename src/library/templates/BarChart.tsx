import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { alpha } from "../brand";
import { enter, font, list, outro, ramp, type Template, type TemplateProps } from "../kit";

type C = { title: string; caption: string; labels: string; values: string; unit: string };

function BarChart({ brand, content }: TemplateProps<C>) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = outro(frame, durationInFrames);
  const labels = list(content.labels);
  const values = list(content.values).map((v) => Number(v) || 0);
  const n = Math.min(labels.length, values.length) || 1;
  const max = Math.max(1, ...values.slice(0, n));
  const peak = values.indexOf(max);
  const chartH = 560;
  const fg = brand.foreground;

  return (
    <AbsoluteFill
      style={{
        background: brand.background,
        color: fg,
        fontFamily: font(brand),
        fontSynthesis: "none",
        padding: "100px 150px 90px",
        opacity: out,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 30, color: alpha(fg, 0.6), opacity: ramp(frame, 2, 16) }}>{content.caption}</div>
          <div
            style={{
              fontSize: 76,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              marginTop: 8,
              opacity: ramp(frame, 6, 22),
              transform: `translateY(${ramp(frame, 6, 22, [24, 0])}px)`,
            }}
          >
            {content.title}
          </div>
        </div>
        <div style={{ fontSize: 30, color: alpha(fg, 0.55), opacity: ramp(frame, 14, 30) }}>{brand.name}</div>
      </div>

      <div style={{ position: "relative", marginTop: 80, height: chartH, display: "flex", alignItems: "flex-end", gap: 40 }}>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <div
            key={g}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: g * chartH,
              borderTop: `2px dashed ${alpha(fg, 0.1)}`,
              opacity: ramp(frame, 10, 30),
            }}
          />
        ))}
        {labels.slice(0, n).map((l, i) => {
          const s = enter(frame, fps, brand, 24 + i * 7);
          const h = (values[i] / max) * chartH * s;
          const hot = i === peak;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 600,
                  marginBottom: 14,
                  opacity: ramp(frame, 40 + i * 7, 56 + i * 7),
                  color: hot ? brand.primary : alpha(fg, 0.8),
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {Math.round(values[i] * s)}
                {content.unit}
              </div>
              <div
                style={{
                  width: "100%",
                  height: h,
                  borderRadius: "18px 18px 6px 6px",
                  background: hot ? brand.primary : alpha(fg, 0.16),
                  boxShadow: hot ? `0 0 60px ${alpha(brand.primary, 0.45)}` : "none",
                }}
              />
              <div style={{ fontSize: 28, marginTop: 18, color: alpha(fg, 0.6) }}>{l}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

export const barChart: Template<C> = {
  id: "bar-chart",
  title: "Growth Chart",
  outcome: "Animate a bar chart of monthly growth for an update video",
  category: "Data",
  tags: ["chart", "growth", "investor update", "metrics"],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 180,
  component: BarChart,
  defaults: {
    caption: "Monthly active teams",
    title: "Growth since launch",
    labels: "Apr, May, Jun, Jul, Aug, Sep",
    values: "120, 180, 260, 340, 510, 720",
    unit: "",
  },
  fields: [
    { key: "caption", label: "Caption", type: "text" },
    { key: "title", label: "Title", type: "text" },
    { key: "labels", label: "Labels", type: "text", hint: "Comma separated" },
    { key: "values", label: "Values", type: "text", hint: "Comma separated numbers" },
    { key: "unit", label: "Unit", type: "text", hint: "e.g. k or %" },
  ],
};
