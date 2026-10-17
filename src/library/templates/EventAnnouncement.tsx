import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { alpha, onColor } from "../brand";
import { enter, font, list, outro, ramp, type Template, type TemplateProps } from "../kit";

type C = { kind: string; title: string; date: string; time: string; speakers: string; cta: string };

function EventAnnouncement({ brand, content }: TemplateProps<C>) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = outro(frame, durationInFrames);
  const fg = brand.foreground;
  const speakers = list(content.speakers).slice(0, 3);
  const [month = "", day = ""] = content.date.split(/\s+/);
  const cal = enter(frame, fps, brand, 8);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(115deg, ${brand.background} 45%, ${alpha(brand.primary, 0.2)})`,
        backgroundColor: brand.background,
        color: fg,
        fontFamily: font(brand),
        fontSynthesis: "none",
        flexDirection: "row",
        alignItems: "center",
        padding: "0 150px",
        gap: 110,
        opacity: out,
      }}
    >
      <div
        style={{
          flex: "0 0 380px",
          height: 420,
          borderRadius: 40,
          overflow: "hidden",
          background: brand.background,
          border: `2px solid ${alpha(fg, 0.14)}`,
          boxShadow: `0 50px 120px ${alpha(brand.primary, 0.25)}`,
          transform: `rotate(${(1 - cal) * -12}deg) scale(${cal})`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ background: brand.primary, color: onColor(brand.primary), fontSize: 44, fontWeight: 700, textAlign: "center", padding: "26px 0", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          {month}
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 220, fontWeight: 700, letterSpacing: "-0.05em" }}>{day}</div>
      </div>

      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "inline-block",
            padding: "10px 24px",
            borderRadius: 99,
            border: `2px solid ${brand.primary}`,
            color: brand.primary,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            opacity: ramp(frame, 14, 28),
          }}
        >
          {content.kind}
        </div>
        <div style={{ marginTop: 30, fontSize: 96, fontWeight: 600, lineHeight: 1.04, letterSpacing: "-0.035em", opacity: ramp(frame, 18, 36), transform: `translateY(${ramp(frame, 18, 36, [28, 0])}px)` }}>
          {content.title}
        </div>
        <div style={{ marginTop: 28, fontSize: 40, color: alpha(fg, 0.7), opacity: ramp(frame, 30, 46) }}>
          {content.time} · {brand.name}
        </div>
        <div style={{ display: "flex", gap: 30, marginTop: 56 }}>
          {speakers.map((s, i) => {
            const p = enter(frame, fps, brand, 46 + i * 8);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, opacity: p, transform: `translateY(${(1 - p) * 24}px)` }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 99,
                    background: i % 2 ? brand.accent : brand.primary,
                    color: onColor(i % 2 ? brand.accent : brand.primary),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 30,
                    fontWeight: 700,
                  }}
                >
                  {s
                    .split(/\s+/)
                    .map((w) => w[0] ?? "")
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <span style={{ fontSize: 32, fontWeight: 500 }}>{s}</span>
              </div>
            );
          })}
        </div>
        <div
          style={{
            display: "inline-block",
            marginTop: 60,
            padding: "22px 44px",
            borderRadius: 99,
            background: brand.primary,
            color: onColor(brand.primary),
            fontSize: 38,
            fontWeight: 600,
            transform: `scale(${enter(frame, fps, brand, 76)})`,
            transformOrigin: "left center",
          }}
        >
          {content.cta}
        </div>
      </div>
    </AbsoluteFill>
  );
}

export const eventAnnouncement: Template<C> = {
  id: "event-announcement",
  title: "Event Announcement",
  outcome: "Promote a webinar, live demo or AMA with date and speakers",
  category: "Launch",
  tags: ["webinar", "event", "live demo", "ama", "invite", "speakers"],
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 165,
  component: EventAnnouncement,
  defaults: {
    kind: "Live demo",
    title: "Build a launch video in 10 minutes",
    date: "Nov 12",
    time: "Thursday, 11am CT",
    speakers: "Alex Rivera, Maya Chen",
    cta: "Save your seat",
  },
  fields: [
    { key: "kind", label: "Event type", type: "text" },
    { key: "title", label: "Title", type: "text" },
    { key: "date", label: "Date", type: "text", hint: 'Month and day, e.g. "Nov 12"' },
    { key: "time", label: "Time", type: "text" },
    { key: "speakers", label: "Speakers", type: "text", hint: "Comma separated, up to 3" },
    { key: "cta", label: "Call to action", type: "text" },
  ],
};
