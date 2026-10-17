import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { alpha, onColor } from "../brand";
import { enter, font, outro, ramp, type Template, type TemplateProps } from "../kit";

type C = { quote: string; author: string; role: string };

function Star({ color, s }: { color: string; s: number }) {
  return (
    <svg width="46" height="46" viewBox="0 0 24 24" style={{ transform: `scale(${s})` }}>
      <path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.3l6.6-.8z" fill={color} />
    </svg>
  );
}

function Testimonial({ brand, content }: TemplateProps<C>) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = outro(frame, durationInFrames);
  const words = content.quote.split(/\s+/).filter(Boolean);
  const mark = enter(frame, fps, brand, 2);
  const typeStart = 22;
  const perWord = Math.max(1.2, Math.min(3, 70 / Math.max(1, words.length)));
  const typedEnd = typeStart + words.length * perWord;
  const who = enter(frame, fps, brand, typedEnd + 4);
  const initials = content.author
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AbsoluteFill
      style={{
        background: brand.background,
        color: brand.foreground,
        fontFamily: font(brand),
        fontSynthesis: "none",
        padding: "100px 100px",
        opacity: out,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} color={brand.primary} s={enter(frame, fps, brand, 6 + i * 4)} />
          ))}
        </div>
        <div style={{ fontSize: 30, color: alpha(brand.foreground, 0.55), opacity: ramp(frame, 4, 20) }}>{brand.name}</div>
      </div>
      <div
        style={{
          fontSize: 260,
          lineHeight: 0.8,
          height: 150,
          marginTop: 50,
          color: brand.primary,
          fontFamily: "Georgia, serif",
          transform: `scale(${mark})`,
          transformOrigin: "left top",
        }}
      >
        “
      </div>
      <p style={{ margin: 0, fontSize: 62, lineHeight: 1.22, fontWeight: 500, letterSpacing: "-0.015em" }}>
        {words.map((w, i) => {
          const o = interpolate(frame, [typeStart + i * perWord, typeStart + i * perWord + 8], [0.12, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <span key={i} style={{ opacity: o }}>
              {w}{" "}
            </span>
          );
        })}
      </p>
      <div
        style={{
          position: "absolute",
          left: 100,
          bottom: 100,
          display: "flex",
          alignItems: "center",
          gap: 28,
          opacity: who,
          transform: `translateY(${(1 - who) * 30}px)`,
        }}
      >
        <div
          style={{
            width: 104,
            height: 104,
            borderRadius: 99,
            background: brand.accent,
            color: onColor(brand.accent),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 40,
            fontWeight: 700,
          }}
        >
          {initials}
        </div>
        <div>
          <div style={{ fontSize: 40, fontWeight: 600 }}>{content.author}</div>
          <div style={{ fontSize: 32, color: alpha(brand.foreground, 0.6), marginTop: 4 }}>{content.role}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export const testimonial: Template<C> = {
  id: "testimonial",
  title: "Customer Quote",
  outcome: "Turn a customer testimonial into a square social clip",
  category: "Social",
  tags: ["testimonial", "review", "social proof", "square"],
  width: 1080,
  height: 1080,
  fps: 30,
  durationInFrames: 180,
  component: Testimonial,
  defaults: {
    quote: "We shipped our launch video the same afternoon, and it finally looked like us.",
    author: "Maya Chen",
    role: "Head of Growth, Relay",
  },
  fields: [
    { key: "quote", label: "Quote", type: "textarea" },
    { key: "author", label: "Name", type: "text" },
    { key: "role", label: "Role and company", type: "text" },
  ],
};
