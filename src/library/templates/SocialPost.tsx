import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { alpha, onColor } from "../brand";
import { enter, font, outro, ramp, type Template, type TemplateProps } from "../kit";

type C = { name: string; handle: string; post: string; likes: number; reposts: number };

function Heart({ color, filled }: { color: string; filled: boolean }) {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24">
      <path
        d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"
        fill={filled ? color : "none"}
        stroke={color}
        strokeWidth={1.8}
      />
    </svg>
  );
}

// A generic social post card (no platform branding) with counts ticking up.
function SocialPost({ brand, content }: TemplateProps<C>) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = outro(frame, durationInFrames);
  const card = enter(frame, fps, brand, 4);
  const fg = brand.foreground;
  const count = (v: number, start: number) =>
    Math.round(
      interpolate(frame, [start, start + 60], [0, Number(v) || 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      }),
    ).toLocaleString("en-US");
  const liked = frame > 70;
  const pop = enter(frame, fps, brand, 70);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(80% 70% at 50% 40%, ${alpha(brand.primary, 0.22)}, ${brand.background} 70%)`,
        backgroundColor: brand.background,
        color: fg,
        fontFamily: font(brand),
        fontSynthesis: "none",
        justifyContent: "center",
        alignItems: "center",
        opacity: out,
      }}
    >
      <div
        style={{
          width: 880,
          padding: 64,
          borderRadius: 44,
          background: brand.background,
          border: `2px solid ${alpha(fg, 0.14)}`,
          boxShadow: `0 60px 140px ${alpha("#000000", 0.35)}`,
          opacity: card,
          transform: `translateY(${(1 - card) * 120}px) rotate(${(1 - card) * -4}deg)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 99,
              background: brand.primary,
              color: onColor(brand.primary),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
              fontWeight: 700,
            }}
          >
            {(content.name.trim()[0] ?? "?").toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 40, fontWeight: 600 }}>{content.name}</div>
            <div style={{ fontSize: 32, color: alpha(fg, 0.55) }}>{content.handle}</div>
          </div>
        </div>
        <div style={{ marginTop: 44, fontSize: 52, lineHeight: 1.3, opacity: ramp(frame, 16, 34), transform: `translateY(${ramp(frame, 16, 34, [16, 0])}px)` }}>
          {content.post}
        </div>
        <div style={{ marginTop: 50, paddingTop: 34, borderTop: `2px solid ${alpha(fg, 0.1)}`, display: "flex", gap: 70, fontSize: 34, color: alpha(fg, 0.7) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ transform: `scale(${liked ? 1 + (1 - pop) * 0.6 : 1})`, display: "flex" }}>
              <Heart color={liked ? brand.primary : alpha(fg, 0.6)} filled={liked} />
            </span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{count(content.likes, 40)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 40 }}>⟲</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{count(content.reposts, 46)}</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export const socialPost: Template<C> = {
  id: "social-post",
  title: "Social Post Card",
  outcome: "Animate a post or shout-out with likes and reposts ticking up",
  category: "Social",
  tags: ["post", "tweet", "shout-out", "social proof", "square"],
  width: 1080,
  height: 1080,
  fps: 30,
  durationInFrames: 150,
  component: SocialPost,
  defaults: {
    name: "Priya Raman",
    handle: "@priyabuilds",
    post: "Made our launch video in 10 minutes and it actually matches our brand. Wild.",
    likes: 2480,
    reposts: 312,
  },
  fields: [
    { key: "name", label: "Name", type: "text" },
    { key: "handle", label: "Handle", type: "text" },
    { key: "post", label: "Post text", type: "textarea" },
    { key: "likes", label: "Likes", type: "number" },
    { key: "reposts", label: "Reposts", type: "number" },
  ],
};
