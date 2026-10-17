import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { alpha, onColor } from "../brand";
import { enter, font, outro, ramp, type Template, type TemplateProps } from "../kit";

type C = { title: string; them: string; row1: string; row2: string; row3: string; row4: string };

// Rows prefixed with "=" are shown as features both sides have.
function parse(s: string) {
  const both = s.trim().startsWith("=");
  return { text: s.replace(/^\s*=\s*/, ""), both };
}

function Mark({ ok, color, on, size = 56 }: { ok: boolean; color: string; on: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 99,
        background: ok ? color : "transparent",
        border: ok ? "none" : `3px solid ${on}`,
        color: ok ? onColor(color) : on,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.5,
        fontWeight: 700,
      }}
    >
      {ok ? "✓" : "✕"}
    </div>
  );
}

function Comparison({ brand, content }: TemplateProps<C>) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = outro(frame, durationInFrames);
  const fg = brand.foreground;
  const rows = [content.row1, content.row2, content.row3, content.row4].filter(Boolean).map(parse);
  const col = 300;

  return (
    <AbsoluteFill style={{ background: brand.background, color: fg, fontFamily: font(brand), fontSynthesis: "none", padding: "100px 200px", opacity: out }}>
      <div style={{ fontSize: 84, fontWeight: 600, letterSpacing: "-0.03em", opacity: ramp(frame, 0, 16), transform: `translateY(${ramp(frame, 0, 16, [24, 0])}px)` }}>
        {content.title}
      </div>
      <div style={{ position: "relative", marginTop: 70 }}>
        {/* highlight column behind "us" */}
        <div
          style={{
            position: "absolute",
            right: col,
            width: col,
            top: -30,
            bottom: -30,
            borderRadius: 32,
            background: alpha(brand.primary, 0.12),
            border: `2px solid ${alpha(brand.primary, 0.4)}`,
            transform: `scaleY(${enter(frame, fps, brand, 10)})`,
            transformOrigin: "top",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", height: 90, fontSize: 38, fontWeight: 600, position: "relative", opacity: ramp(frame, 8, 22) }}>
          <div style={{ flex: 1 }} />
          <div style={{ width: col, textAlign: "center", color: brand.primary }}>{brand.name}</div>
          <div style={{ width: col, textAlign: "center", color: alpha(fg, 0.55) }}>{content.them}</div>
        </div>
        {rows.map((r, i) => {
          const s = enter(frame, fps, brand, 22 + i * 10);
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                height: 130,
                borderTop: `2px solid ${alpha(fg, 0.1)}`,
                position: "relative",
                opacity: s,
                transform: `translateY(${(1 - s) * 30}px)`,
              }}
            >
              <div style={{ flex: 1, fontSize: 46, fontWeight: 500 }}>{r.text}</div>
              <div style={{ width: col, display: "flex", justifyContent: "center", transform: `scale(${enter(frame, fps, brand, 32 + i * 10)})` }}>
                <Mark ok color={brand.primary} on={fg} />
              </div>
              <div style={{ width: col, display: "flex", justifyContent: "center" }}>
                <Mark ok={r.both} color={alpha(fg, 0.25)} on={alpha(fg, 0.35)} />
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

export const comparison: Template<C> = {
  id: "comparison",
  title: "Us vs Them",
  outcome: "Compare your product against the alternative in a checklist table",
  category: "Product",
  tags: ["comparison", "competitor", "vs", "table", "positioning"],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 165,
  component: Comparison,
  defaults: {
    title: "Why teams switch",
    them: "Hiring a freelancer",
    row1: "Matches your brand every time",
    row2: "Ready in minutes",
    row3: "Edit the copy yourself",
    row4: "= Polished motion",
  },
  fields: [
    { key: "title", label: "Title", type: "text" },
    { key: "them", label: "Alternative", type: "text" },
    { key: "row1", label: "Row 1", type: "text", hint: 'Start a row with "=" if both sides have it' },
    { key: "row2", label: "Row 2", type: "text" },
    { key: "row3", label: "Row 3", type: "text" },
    { key: "row4", label: "Row 4", type: "text" },
  ],
};
