import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { alpha, onColor, type Brand } from "../brand";
import { enter, font, outro, ramp, type Template, type TemplateProps } from "../kit";

type C = { version: string; item1: string; item2: string; item3: string; item4: string };

// "New: Faster exports" → tag "New", text "Faster exports"
function parse(s: string) {
  const m = s.match(/^\s*([A-Za-z]+)\s*:\s*(.*)$/);
  return m ? { tag: m[1], text: m[2] } : { tag: "New", text: s };
}

function tagColors(tag: string, b: Brand) {
  const t = tag.toLowerCase();
  if (t === "new") return { bg: b.primary, fg: onColor(b.primary) };
  if (t === "improved") return { bg: b.accent, fg: onColor(b.accent) };
  return { bg: alpha(b.foreground, 0.14), fg: b.foreground };
}

function ChangelogDrop({ brand, content }: TemplateProps<C>) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = outro(frame, durationInFrames);
  const items = [content.item1, content.item2, content.item3, content.item4].filter(Boolean).map(parse);
  const pill = enter(frame, fps, brand, 14);

  return (
    <AbsoluteFill
      style={{
        background: brand.background,
        color: brand.foreground,
        fontFamily: font(brand),
        fontSynthesis: "none",
        padding: "190px 90px 150px",
        opacity: out,
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(70% 40% at 50% 0%, ${alpha(brand.primary, 0.22)}, transparent 70%)`,
          opacity: ramp(frame, 0, 30),
        }}
      />
      <div style={{ position: "relative" }}>
        <div style={{ fontSize: 40, color: alpha(brand.foreground, 0.6), opacity: ramp(frame, 2, 16) }}>{brand.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 14 }}>
          <div
            style={{
              fontSize: 120,
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              opacity: ramp(frame, 6, 22),
              transform: `translateY(${ramp(frame, 6, 22, [30, 0])}px)`,
            }}
          >
            What's new
          </div>
        </div>
        <div
          style={{
            display: "inline-block",
            marginTop: 34,
            padding: "12px 28px",
            borderRadius: 99,
            border: `3px solid ${brand.primary}`,
            color: brand.primary,
            fontSize: 38,
            fontWeight: 600,
            transform: `scale(${pill})`,
            transformOrigin: "left center",
          }}
        >
          v{content.version}
        </div>

        <div style={{ marginTop: 90 }}>
          {items.map((it, i) => {
            const s = enter(frame, fps, brand, 34 + i * 16);
            const c = tagColors(it.tag, brand);
            return (
              <div
                key={i}
                style={{
                  marginBottom: 34,
                  padding: "40px 40px",
                  borderRadius: 34,
                  background: alpha(brand.foreground, 0.05),
                  border: `2px solid ${alpha(brand.foreground, 0.1)}`,
                  opacity: s,
                  transform: `translateY(${(1 - s) * 120}px)`,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "8px 20px",
                    borderRadius: 99,
                    background: c.bg,
                    color: c.fg,
                    fontSize: 28,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {it.tag}
                </span>
                <div style={{ fontSize: 52, fontWeight: 500, lineHeight: 1.2, marginTop: 20 }}>{it.text}</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}

export const changelogDrop: Template<C> = {
  id: "changelog-drop",
  title: "Changelog Drop",
  outcome: "Post a vertical release-notes video for Reels, Shorts and TikTok",
  category: "Social",
  tags: ["changelog", "release notes", "vertical", "shorts", "update"],
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 180,
  component: ChangelogDrop,
  defaults: {
    version: "2.4",
    item1: "New: Brand kits for every template",
    item2: "Improved: Renders are 3x faster",
    item3: "New: Vertical and square exports",
    item4: "Fixed: Font fallback on Safari",
  },
  fields: [
    { key: "version", label: "Version", type: "text" },
    { key: "item1", label: "Item 1", type: "text", hint: 'Start with "New:", "Improved:" or "Fixed:"' },
    { key: "item2", label: "Item 2", type: "text" },
    { key: "item3", label: "Item 3", type: "text" },
    { key: "item4", label: "Item 4", type: "text" },
  ],
};
