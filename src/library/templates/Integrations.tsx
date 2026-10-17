import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { alpha, onColor } from "../brand";
import { enter, font, list, outro, ramp, type Template, type TemplateProps } from "../kit";

type C = { title: string; tools: string };

// Hub-and-spoke: your mark in the center, the tools you connect to orbiting it.
function Integrations({ brand, content }: TemplateProps<C>) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = outro(frame, durationInFrames);
  const tools = list(content.tools).slice(0, 8);
  const hub = enter(frame, fps, brand, 4);
  const cx = 1260;
  const cy = 560;
  const r = 340;
  const spin = interpolate(frame, [0, durationInFrames], [0, 18]);
  const initial = (brand.name.trim()[0] ?? "G").toUpperCase();

  return (
    <AbsoluteFill style={{ background: brand.background, color: brand.foreground, fontFamily: font(brand), fontSynthesis: "none", opacity: out }}>
      <div style={{ position: "absolute", left: 140, top: 0, bottom: 0, width: 560, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: 30, letterSpacing: "0.16em", textTransform: "uppercase", color: brand.primary, opacity: ramp(frame, 2, 16) }}>
          Integrations
        </div>
        <div
          style={{
            marginTop: 22,
            fontSize: 92,
            fontWeight: 600,
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
            opacity: ramp(frame, 6, 24),
            transform: `translateY(${ramp(frame, 6, 24, [26, 0])}px)`,
          }}
        >
          {content.title}
        </div>
      </div>

      <svg style={{ position: "absolute", inset: 0 }} width={1920} height={1080}>
        {tools.map((_, i) => {
          const a = ((i / tools.length) * 360 + spin - 90) * (Math.PI / 180);
          const s = enter(frame, fps, brand, 22 + i * 5);
          const x = cx + Math.cos(a) * r * s;
          const y = cy + Math.sin(a) * r * s;
          return (
            <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={alpha(brand.primary, 0.45)} strokeWidth={3} strokeDasharray="10 12" strokeDashoffset={-frame * 1.5} />
          );
        })}
      </svg>

      {tools.map((t, i) => {
        const a = ((i / tools.length) * 360 + spin - 90) * (Math.PI / 180);
        const s = enter(frame, fps, brand, 22 + i * 5);
        const x = cx + Math.cos(a) * r * s;
        const y = cy + Math.sin(a) * r * s;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `translate(-50%, -50%) scale(${s})`,
              padding: "20px 30px",
              borderRadius: 24,
              background: brand.background,
              border: `2px solid ${alpha(brand.foreground, 0.16)}`,
              fontSize: 34,
              fontWeight: 600,
              whiteSpace: "nowrap",
              boxShadow: `0 20px 50px ${alpha("#000000", 0.25)}`,
            }}
          >
            {t}
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: cx,
          top: cy,
          width: 200,
          height: 200,
          borderRadius: 52,
          background: brand.primary,
          color: onColor(brand.primary),
          transform: `translate(-50%, -50%) scale(${hub})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 110,
          fontWeight: 700,
          boxShadow: `0 0 0 ${18 + Math.sin(frame / 8) * 6}px ${alpha(brand.primary, 0.18)}`,
        }}
      >
        {initial}
      </div>
    </AbsoluteFill>
  );
}

export const integrations: Template<C> = {
  id: "integrations",
  title: "Integrations Hub",
  outcome: "Show the tools your product connects to, orbiting your logo",
  category: "Product",
  tags: ["integrations", "works with", "ecosystem", "api", "partners"],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 150,
  component: Integrations,
  defaults: {
    title: "Works with your stack",
    tools: "Slack, Notion, Figma, Linear, GitHub, Stripe",
  },
  fields: [
    { key: "title", label: "Title", type: "text" },
    { key: "tools", label: "Tools", type: "text", hint: "Comma separated, up to 8" },
  ],
};
