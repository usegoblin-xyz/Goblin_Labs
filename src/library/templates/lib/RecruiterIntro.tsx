import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, countStat, expInOut, fontOf, initialOf, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { name: string; title: string; stats: string; labels: string; sectors: string; contact: string };

// A recruiter's self-intro: a profile card builds (avatar ring, name, title),
// three stat tiles count up, sector chips rain onto a shelf, a row of
// candidate cards flips to "Hired", and a contact card closes.
export default function RecruiterIntro({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = c.name || "Alex Morgan";
  const title = c.title || "Tech recruiter · 8 years";
  const stats = [...list(c.stats || "340+, 21 days, 94%"), "0", "0", "0"].slice(0, 3);
  const labels = [...list(c.labels || "placements, avg. time to hire, offer acceptance"), "", "", ""].slice(0, 3);
  const sectors = list(c.sectors || "Engineering, Design, Product, Data, Security, Leadership");
  const ring = c01((t - 0.3) / 1.0);
  const outro = expInOut(seg(t, 8.6, 0.5));
  const endP = c01((t - 9.0) / 0.8);
  const cands = ["#38a3ff", "#f28ab2", "#f2b64a", "#2fbf71", pal.a];

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* profile */}
        <div style={{ position: "absolute", left: 120, top: 120, display: "flex", alignItems: "center", gap: 40 }}>
          <svg width={220} height={220}>
            <circle cx={110} cy={110} r={100} fill="none" stroke={pal.v} strokeWidth={10} pathLength={1} strokeDasharray={`${ring} 2`} transform="rotate(-90 110 110)" />
            <circle cx={110} cy={110} r={84 * spring(t - 0.3, 14, 0.6)} fill={pal.card2} />
            <text x={110} y={140} textAnchor="middle" fontFamily={ff} fontSize={86} fontWeight={800} fill={pal.fg} opacity={c01((t - 0.6) * 3)}>
              {(name.trim()[0] ?? "A").toUpperCase()}
            </text>
          </svg>
          <div>
            <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: "-0.04em", color: pal.fg, clipPath: `inset(0 ${(1 - c01((t - 0.6) / 0.6)) * 100}% 0 0)` }}>{name}</div>
            <div style={{ fontSize: 42, color: pal.muted, opacity: c01((t - 1.1) * 3) }}>{title}</div>
          </div>
        </div>
        {/* stats */}
        <div style={{ position: "absolute", left: 120, top: 420, display: "flex", gap: 30 }}>
          {stats.map((s, i) => {
            const p = c01((t - 1.6 - i * 0.25) / 1.2);
            return (
              <div key={i} style={{ width: 400, height: 220, borderRadius: 30, background: i === 0 ? pal.v : pal.card, padding: 36, boxSizing: "border-box", transform: `translateY(${(1 - spring(t - 1.5 - i * 0.2, 14, 0.65)) * 300}px)` }}>
                <div style={{ fontSize: 90, fontWeight: 900, letterSpacing: "-0.04em", color: i === 0 ? pal.onV : pal.fg }}>{countStat(s, p)}</div>
                <div style={{ fontSize: 30, color: i === 0 ? pal.onV : pal.muted, opacity: 0.85 }}>{labels[i]}</div>
              </div>
            );
          })}
        </div>
        {/* sector chips */}
        <div style={{ position: "absolute", left: 120, top: 700, width: 1260, display: "flex", flexWrap: "wrap", gap: 18 }}>
          {sectors.map((s, i) => (
            <div key={i} style={{ padding: "16px 30px", borderRadius: 40, border: `3px solid ${pal.fg}`, fontSize: 32, fontWeight: 700, color: pal.fg, transform: `translateY(${(1 - spring(t - 3.4 - i * 0.12, 15, 0.5)) * -700}px)`, opacity: c01((t - 3.4 - i * 0.12) * 6) }}>
              {s}
            </div>
          ))}
        </div>
        {/* candidate cards */}
        <div style={{ position: "absolute", right: 120, top: 120, width: 380 }}>
          {cands.map((col, i) => {
            const fl = c01((t - 4.8 - i * 0.3) / 0.3);
            const hired = fl > 0.5;
            return (
              <div key={i} style={{ height: 130, marginBottom: 20, borderRadius: 24, background: hired ? pal.card2 : pal.card, display: "flex", alignItems: "center", gap: 20, padding: "0 26px", transform: `rotateX(${Math.sin(fl * Math.PI) * 80}deg) translateX(${(1 - spring(t - 2.6 - i * 0.1, 15, 0.7)) * 600}px)`, opacity: c01((t - 2.6 - i * 0.1) * 6) }}>
                <div style={{ width: 70, height: 70, borderRadius: 35, background: col }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 14, width: 150, borderRadius: 7, background: pal.faint }} />
                  <div style={{ height: 12, width: 100, borderRadius: 6, background: pal.line, marginTop: 12 }} />
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: hired ? "#2fbf71" : pal.muted }}>{hired ? "Hired ✓" : "…"}</div>
              </div>
            );
          })}
        </div>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="Let's find your next hire." x={960} y={480} size={100} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={`${name} · ${c.contact || nameOf(b)}`} x={960} y={600} size={48} weight={600} color={pal.v} font={ff} p={c01((t - 9.4) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/recruiter-intro.wav" on={audio} />
    </AbsoluteFill>
  );
}
