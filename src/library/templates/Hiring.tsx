import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { alpha, onColor } from "../brand";
import { enter, font, list, outro, ramp, type Template, type TemplateProps } from "../kit";

type C = { headline: string; roles: string; location: string; cta: string };

function Hiring({ brand, content }: TemplateProps<C>) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = outro(frame, durationInFrames);
  const roles = list(content.roles).slice(0, 4);
  const fg = brand.foreground;
  const words = content.headline.split(/\s+/).filter(Boolean);

  return (
    <AbsoluteFill style={{ background: brand.background, color: fg, fontFamily: font(brand), fontSynthesis: "none", padding: "100px 100px", opacity: out }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", opacity: ramp(frame, 0, 14) }}>
        <div style={{ fontSize: 36, fontWeight: 600 }}>{brand.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 28, color: alpha(fg, 0.65) }}>
          <span style={{ width: 14, height: 14, borderRadius: 99, background: brand.primary, opacity: 0.5 + 0.5 * Math.sin(frame / 5) }} />
          {content.location}
        </div>
      </div>
      <div style={{ marginTop: 70, fontSize: 132, fontWeight: 700, lineHeight: 0.98, letterSpacing: "-0.045em" }}>
        {words.map((w, i) => {
          const s = enter(frame, fps, brand, 6 + i * 4);
          return (
            <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: 8 }}>
              <span style={{ display: "inline-block", transform: `translateY(${(1 - s) * 105}%)`, marginRight: "0.22em", color: i === words.length - 1 ? brand.primary : undefined }}>
                {w}
              </span>
            </span>
          );
        })}
      </div>
      <div style={{ marginTop: 60 }}>
        {roles.map((r, i) => {
          const s = enter(frame, fps, brand, 32 + i * 9);
          return (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "28px 0",
                borderTop: `2px solid ${alpha(fg, 0.12)}`,
                fontSize: 46,
                fontWeight: 500,
                opacity: s,
                transform: `translateX(${(1 - s) * 60}px)`,
              }}
            >
              {r}
              <span style={{ color: brand.primary, fontSize: 44 }}>→</span>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          left: 100,
          bottom: 100,
          padding: "20px 40px",
          borderRadius: 99,
          background: brand.primary,
          color: onColor(brand.primary),
          fontSize: 38,
          fontWeight: 600,
          transform: `scale(${enter(frame, fps, brand, 74)})`,
          transformOrigin: "left center",
        }}
      >
        {content.cta}
      </div>
    </AbsoluteFill>
  );
}

export const hiring: Template<C> = {
  id: "hiring",
  title: "We're Hiring",
  outcome: "Announce open roles in a square post for LinkedIn and X",
  category: "Brand",
  tags: ["hiring", "jobs", "careers", "recruiting", "linkedin", "square"],
  width: 1080,
  height: 1080,
  fps: 30,
  durationInFrames: 150,
  component: Hiring,
  defaults: {
    headline: "We're hiring builders",
    roles: "Founding Engineer, Product Designer, Growth Lead",
    location: "Remote · US",
    cta: "Apply at usegoblin.xyz/jobs",
  },
  fields: [
    { key: "headline", label: "Headline", type: "text", hint: "Last word gets your primary color" },
    { key: "roles", label: "Roles", type: "text", hint: "Comma separated, up to 4" },
    { key: "location", label: "Location", type: "text" },
    { key: "cta", label: "Call to action", type: "text" },
  ],
};
