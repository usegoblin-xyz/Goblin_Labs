import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { alpha, onColor } from "../brand";
import { enter, font, outro, ramp, type Template, type TemplateProps } from "../kit";

type C = { title: string; step1: string; detail1: string; step2: string; detail2: string; step3: string; detail3: string };

function HowItWorks({ brand, content }: TemplateProps<C>) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = outro(frame, durationInFrames);
  const fg = brand.foreground;
  const steps = [
    { t: content.step1, d: content.detail1 },
    { t: content.step2, d: content.detail2 },
    { t: content.step3, d: content.detail3 },
  ];
  const gap = 34; // frames between steps
  const first = 30;
  const line = interpolate(frame, [first, first + gap * 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: brand.background, color: fg, fontFamily: font(brand), fontSynthesis: "none", padding: "120px 150px", opacity: out }}>
      <div style={{ fontSize: 30, letterSpacing: "0.16em", textTransform: "uppercase", color: brand.primary, opacity: ramp(frame, 0, 14) }}>{brand.name}</div>
      <div style={{ marginTop: 16, fontSize: 88, fontWeight: 600, letterSpacing: "-0.03em", opacity: ramp(frame, 4, 22), transform: `translateY(${ramp(frame, 4, 22, [24, 0])}px)` }}>
        {content.title}
      </div>

      <div style={{ position: "relative", marginTop: 110 }}>
        <div style={{ position: "absolute", left: 50, right: 50, top: 48, height: 6, borderRadius: 99, background: alpha(fg, 0.12) }}>
          <div style={{ height: "100%", width: `${line * 100}%`, borderRadius: 99, background: brand.primary }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
          {steps.map((s, i) => {
            const at = first + i * gap;
            const pop = enter(frame, fps, brand, at);
            const done = frame >= at;
            return (
              <div key={i} style={{ width: 460 }}>
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 99,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 44,
                    fontWeight: 700,
                    background: done ? brand.primary : brand.background,
                    color: done ? onColor(brand.primary) : alpha(fg, 0.5),
                    border: `4px solid ${done ? brand.primary : alpha(fg, 0.2)}`,
                    transform: `scale(${0.7 + pop * 0.3})`,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ marginTop: 44, fontSize: 52, fontWeight: 600, opacity: pop, transform: `translateY(${(1 - pop) * 24}px)` }}>{s.t}</div>
                <div style={{ marginTop: 16, fontSize: 34, lineHeight: 1.4, color: alpha(fg, 0.65), opacity: ramp(frame, at + 8, at + 24) }}>{s.d}</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}

export const howItWorks: Template<C> = {
  id: "how-it-works",
  title: "How It Works",
  outcome: "Explain your product in three steps with a progress line",
  category: "Product",
  tags: ["steps", "onboarding", "explainer", "process", "tutorial"],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 180,
  component: HowItWorks,
  defaults: {
    title: "How it works",
    step1: "Set your brand", detail1: "Colors, font and motion feel, once.",
    step2: "Pick a template", detail2: "Search by what you're making.",
    step3: "Render and post", detail3: "16:9, square or vertical.",
  },
  fields: [
    { key: "title", label: "Title", type: "text" },
    { key: "step1", label: "Step 1", type: "text" },
    { key: "detail1", label: "Step 1 detail", type: "text" },
    { key: "step2", label: "Step 2", type: "text" },
    { key: "detail2", label: "Step 2 detail", type: "text" },
    { key: "step3", label: "Step 3", type: "text" },
    { key: "detail3", label: "Step 3 detail", type: "text" },
  ],
};
