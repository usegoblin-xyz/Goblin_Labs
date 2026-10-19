import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, expInOut, fontOf, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { name: string; skills: string; slots: string; cta: string };

// A self-promo spot: a status light blinks to green "Available for work";
// a calendar grid shows open weeks with two slots getting booked live
// (urgency), three skills slam in, a response-time badge counts down, and a
// big "Book a call" button presses itself.
export default function AvailableForWork({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = c.name || nameOf(b);
  const skills = [...list(c.skills || "Brand, Web, Motion"), "Design", "Design", "Design"].slice(0, 3);
  const slots = Number(c.slots || 2) || 2;
  const green = "#2fbf71";
  const on = t > 0.6;
  const cal = spring(t - 1.2, 14, 0.7);
  const book = (i: number) => t > 2.6 + i * 0.6;
  const press = t > 6.6 && t < 6.8;
  const outro = expInOut(seg(t, 8.2, 0.5));
  const endP = c01((t - 8.6) / 0.8);
  const left = Math.max(slots, 4 - [0, 1].filter((i) => book(i)).length);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <div style={{ position: "absolute", left: 120, top: 100, display: "flex", alignItems: "center", gap: 22, padding: "20px 34px", borderRadius: 50, background: pal.card }}>
          <span style={{ width: 30, height: 30, borderRadius: 15, background: on ? green : "#e5484d", boxShadow: on ? `0 0 ${16 + Math.sin(t * 5) * 8}px ${green}` : "none" }} />
          <span style={{ fontSize: 40, fontWeight: 800, color: pal.fg }}>{on ? "Available for work" : "Busy"}</span>
        </div>
        <div style={{ position: "absolute", left: 120, top: 250, fontSize: 130, fontWeight: 900, letterSpacing: "-0.05em", color: pal.fg, lineHeight: 1, clipPath: `inset(0 ${(1 - c01((t - 0.8) / 0.6)) * 100}% 0 0)` }}>{name}</div>
        {/* skills */}
        <div style={{ position: "absolute", left: 120, top: 430, display: "flex", gap: 20 }}>
          {skills.map((s, i) => (
            <div key={i} style={{ padding: "18px 34px", borderRadius: 18, background: i === 0 ? pal.v : pal.card2, color: i === 0 ? pal.onV : pal.fg, fontSize: 44, fontWeight: 900, transform: `scale(${spring(t - 3.8 - i * 0.25, 20, 0.45)})` }}>
              {s}
            </div>
          ))}
        </div>
        {/* calendar */}
        <div style={{ position: "absolute", left: 1160, top: 120, width: 640, padding: 36, borderRadius: 32, background: pal.card, transform: `translateX(${(1 - cal) * 900}px)` }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 800, color: pal.fg, marginBottom: 24 }}>
            Next 4 weeks
            <span style={{ marginLeft: "auto", color: left <= 2 ? "#f2b64a" : pal.muted, fontSize: 26 }}>{left} slots left</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {Array.from({ length: 20 }, (_, i) => {
              const open = [3, 7, 12, 16].includes(i);
              const taken = (i === 3 && book(0)) || (i === 12 && book(1));
              return (
                <div key={i} style={{ aspectRatio: "1.3", borderRadius: 12, background: taken ? "#e5484d55" : open ? green : pal.card2, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 22, fontWeight: 800, transform: `scale(${taken && t < 2.9 + (i === 12 ? 0.6 : 0) ? 1.15 : 1})` }}>
                  {taken ? "booked" : open ? "open" : ""}
                </div>
              );
            })}
          </div>
        </div>
        {/* response badge */}
        <div style={{ position: "absolute", left: 1160, top: 700, padding: "24px 34px", borderRadius: 24, background: pal.card2, fontFamily: MONO, fontSize: 32, color: pal.fg, opacity: c01((t - 5.0) * 3) }}>
          replies within <b style={{ color: pal.v }}>{Math.max(2, Math.round(24 - c01((t - 5.0) / 1.0) * 22))}h</b>
        </div>
        {/* CTA */}
        <div style={{ position: "absolute", left: 120, top: 640, padding: "36px 70px", borderRadius: 60, background: pal.fg, color: pal.bg, fontSize: 56, fontWeight: 900, transform: `scale(${spring(t - 5.8, 14, 0.6) * (press ? 0.94 : 1)})`, boxShadow: t > 6.8 ? `0 0 0 ${c01((t - 6.8) / 0.5) * 30}px ${pal.v}00, 0 0 0 ${c01((t - 6.8) / 0.5) * 30}px ${pal.v}33` : "none" }}>
          {c.cta || "Book a call →"}
        </div>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={name} x={960} y={520} size={150} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={`${skills.join(" · ")} · booking now`} x={960} y={630} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 9.0) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/available-for-work.wav" on={audio} />
    </AbsoluteFill>
  );
}
