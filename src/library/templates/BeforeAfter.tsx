import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { alpha, onColor } from "../brand";
import { font, outro, ramp, type Template, type TemplateProps } from "../kit";

type C = {
  beforeLabel: string; before1: string; before2: string; before3: string;
  afterLabel: string; after1: string; after2: string; after3: string;
};

function Panel({
  label, items, mark, markColor, tint, fg,
}: { label: string; items: string[]; mark: string; markColor: string; tint: string; fg: string }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: tint, padding: "0 170px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ fontSize: 34, letterSpacing: "0.16em", textTransform: "uppercase", color: markColor }}>{label}</div>
      <div style={{ marginTop: 60 }}>
        {items.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 30, marginBottom: 44, fontSize: 64, fontWeight: 500, color: fg }}>
            <span style={{ width: 64, color: markColor, fontWeight: 700 }}>{mark}</span>
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}

function BeforeAfter({ brand, content }: TemplateProps<C>) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const out = outro(frame, durationInFrames);
  const fg = brand.foreground;
  // Wipe position: holds on "before", sweeps across to reveal "after".
  const x = interpolate(frame, [50, 95], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ background: brand.background, fontFamily: font(brand), fontSynthesis: "none", opacity: out, overflow: "hidden" }}>
      <div style={{ opacity: ramp(frame, 0, 14) }}>
        <Panel
          label={content.beforeLabel}
          items={[content.before1, content.before2, content.before3]}
          mark="✕"
          markColor={alpha(fg, 0.45)}
          tint={brand.background}
          fg={alpha(fg, 0.55)}
        />
      </div>
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 0 ${x}%)` }}>
        <Panel
          label={content.afterLabel}
          items={[content.after1, content.after2, content.after3]}
          mark="✓"
          markColor={brand.primary}
          tint={`linear-gradient(120deg, ${alpha(brand.primary, 0.16)}, transparent 60%), ${brand.background}`}
          fg={fg}
        />
      </div>
      <div style={{ position: "absolute", top: 0, bottom: 0, left: `${x}%`, width: 6, marginLeft: -3, background: brand.primary, opacity: x > 0 && x < 100 ? 1 : 0 }}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 84,
            height: 84,
            marginLeft: -42,
            marginTop: -42,
            borderRadius: 99,
            background: brand.primary,
            color: onColor(brand.primary),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 38,
            fontWeight: 700,
          }}
        >
          ⇆
        </div>
      </div>
      <div style={{ position: "absolute", right: 90, top: 80, fontSize: 32, fontWeight: 600, color: fg, opacity: ramp(frame, 4, 18) }}>{brand.name}</div>
    </AbsoluteFill>
  );
}

export const beforeAfter: Template<C> = {
  id: "before-after",
  title: "Before / After",
  outcome: "Contrast the old way with your product in a wipe transition",
  category: "Product",
  tags: ["comparison", "before after", "old way new way", "wipe", "positioning"],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 150,
  component: BeforeAfter,
  defaults: {
    beforeLabel: "Before",
    before1: "A week per launch video",
    before2: "Fonts and colors drift",
    before3: "A designer for every edit",
    afterLabel: "With us",
    after1: "Launch videos in minutes",
    after2: "Always on brand",
    after3: "Edit the copy yourself",
  },
  fields: [
    { key: "beforeLabel", label: "Before label", type: "text" },
    { key: "before1", label: "Before 1", type: "text" },
    { key: "before2", label: "Before 2", type: "text" },
    { key: "before3", label: "Before 3", type: "text" },
    { key: "afterLabel", label: "After label", type: "text" },
    { key: "after1", label: "After 1", type: "text" },
    { key: "after2", label: "After 2", type: "text" },
    { key: "after3", label: "After 3", type: "text" },
  ],
};
