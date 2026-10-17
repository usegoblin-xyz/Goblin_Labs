import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { alpha, onColor } from "../brand";
import { enter, font, outro, ramp, type Template, type TemplateProps } from "../kit";

type C = {
  title: string;
  plan1: string; price1: number; note1: string;
  plan2: string; price2: number; note2: string;
  plan3: string; price3: number; note3: string;
  period: string;
};

function PricingReveal({ brand, content }: TemplateProps<C>) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = outro(frame, durationInFrames);
  const fg = brand.foreground;
  const plans = [
    { name: content.plan1, price: Number(content.price1) || 0, note: content.note1 },
    { name: content.plan2, price: Number(content.price2) || 0, note: content.note2 },
    { name: content.plan3, price: Number(content.price3) || 0, note: content.note3 },
  ];

  return (
    <AbsoluteFill
      style={{
        background: brand.background,
        color: fg,
        fontFamily: font(brand),
        fontSynthesis: "none",
        alignItems: "center",
        padding: "110px 120px",
        opacity: out,
      }}
    >
      <div
        style={{
          fontSize: 80,
          fontWeight: 600,
          letterSpacing: "-0.03em",
          opacity: ramp(frame, 2, 18),
          transform: `translateY(${ramp(frame, 2, 18, [24, 0])}px)`,
        }}
      >
        {content.title}
      </div>
      <div style={{ display: "flex", gap: 44, marginTop: 90, alignItems: "flex-end" }}>
        {plans.map((p, i) => {
          const hot = i === 1;
          const start = 16 + i * 8;
          const s = enter(frame, fps, brand, start);
          const n = interpolate(frame, [start + 6, start + 40], [0, p.price], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.exp),
          });
          return (
            <div
              key={i}
              style={{
                width: 470,
                height: hot ? 600 : 530,
                borderRadius: 36,
                padding: "52px 48px",
                position: "relative",
                background: hot ? brand.primary : alpha(fg, 0.05),
                color: hot ? onColor(brand.primary) : fg,
                border: hot ? "none" : `2px solid ${alpha(fg, 0.12)}`,
                opacity: s,
                transform: `translateY(${(1 - s) * 160}px)`,
                boxShadow: hot ? `0 50px 120px ${alpha(brand.primary, 0.35)}` : "none",
              }}
            >
              {hot && (
                <div
                  style={{
                    position: "absolute",
                    top: -26,
                    left: 48,
                    padding: "10px 22px",
                    borderRadius: 99,
                    background: brand.accent,
                    color: onColor(brand.accent),
                    fontSize: 24,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    transform: `scale(${enter(frame, fps, brand, 60)})`,
                    transformOrigin: "left center",
                  }}
                >
                  Most popular
                </div>
              )}
              <div style={{ fontSize: 40, fontWeight: 600 }}>{p.name}</div>
              <div style={{ marginTop: 40, display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontSize: 132, fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                  ${Math.round(n)}
                </span>
                <span style={{ fontSize: 32, opacity: 0.65 }}>{content.period}</span>
              </div>
              <div style={{ marginTop: 44, fontSize: 32, lineHeight: 1.35, opacity: 0.75 }}>{p.note}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

export const pricingReveal: Template<C> = {
  id: "pricing-reveal",
  title: "Pricing Reveal",
  outcome: "Reveal your plans and prices with the popular tier highlighted",
  category: "Product",
  tags: ["pricing", "plans", "launch", "tiers"],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 150,
  component: PricingReveal,
  defaults: {
    title: "Simple pricing",
    plan1: "Starter", price1: 0, note1: "Five templates and one brand kit",
    plan2: "Pro", price2: 19, note2: "Every template, unlimited renders",
    plan3: "Team", price3: 49, note3: "Shared kits and five seats",
    period: "/mo",
  },
  fields: [
    { key: "title", label: "Title", type: "text" },
    { key: "plan1", label: "Plan 1 name", type: "text" },
    { key: "price1", label: "Plan 1 price", type: "number" },
    { key: "note1", label: "Plan 1 note", type: "text" },
    { key: "plan2", label: "Plan 2 name (highlighted)", type: "text" },
    { key: "price2", label: "Plan 2 price", type: "number" },
    { key: "note2", label: "Plan 2 note", type: "text" },
    { key: "plan3", label: "Plan 3 name", type: "text" },
    { key: "price3", label: "Plan 3 price", type: "number" },
    { key: "note3", label: "Plan 3 note", type: "text" },
    { key: "period", label: "Billing period", type: "text", hint: "e.g. /mo or /yr" },
  ],
};
