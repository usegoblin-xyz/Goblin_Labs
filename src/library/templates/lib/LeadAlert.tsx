import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Paint, Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { sources: string; tagline: string };

// Leads flow in from four sources as dots, get scored at your hub, and split:
// hot ones fire a notification on the sales rep's phone, cold ones drop into
// a nurture list, while the day's counters climb.
const LEADS = [
  { s: 0, score: 92, who: "Maya Chen · Acme" },
  { s: 1, score: 41, who: "Leo Brandt" },
  { s: 2, score: 85, who: "Priya Rao · Northwind" },
  { s: 3, score: 63, who: "Sam Ortiz" },
  { s: 0, score: 97, who: "Ana Silva · Ledgerly" },
  { s: 2, score: 38, who: "Tom Reyes" },
  { s: 1, score: 88, who: "Jo Kim · Fieldwork" },
  { s: 3, score: 72, who: "Nia Obi" },
  { s: 0, score: 94, who: "Ravi Shah · Stackline" },
  { s: 1, score: 55, who: "Eli Moss" },
];
const SY = [300, 460, 620, 780];
const HOT = { x: 1560, y: 360 };
const COLD = { x: 1560, y: 820 };

type Pt = [number, number];
function bez(p0: Pt, p1: Pt, p2: Pt, p3: Pt, u: number): Pt {
  const v = 1 - u;
  return [v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]];
}
const inPath = (s: number): [Pt, Pt, Pt, Pt] => [[420, SY[s]], [640, SY[s]], [700, 540], [850, 540]];
const outPath = (hot: boolean): [Pt, Pt, Pt, Pt] => (hot ? [[1070, 540], [1250, 540], [1250, HOT.y], [1400, HOT.y]] : [[1070, 540], [1250, 540], [1250, COLD.y], [1400, COLD.y]]);
const dOf = (p: [Pt, Pt, Pt, Pt]) => `M${p[0]} C${p[1]} ${p[2]} ${p[3]}`;

export default function LeadAlert({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const sources = [...list(c.sources || "Website form, LinkedIn, Ads, Webinar"), "Source", "Source", "Source", "Source"].slice(0, 4);

  const draw = expOut(seg(t, 0.1, 0.8));
  const fade = expInOut(seg(t, 7.0, 0.6));
  const nameP = c01((t - 7.5) / 0.6);
  const tagP = c01((t - 8.0) / 0.6);

  const timing = LEADS.map((l, i) => {
    const t0 = 1.0 + i * 0.45;
    return { ...l, t0, atNode: t0 + 0.55, leave: t0 + 0.85, arrive: t0 + 1.35, hot: l.score >= 80 };
  });
  const arrivedHot = timing.filter((l) => l.hot && t >= l.arrive);
  const arrivedCold = timing.filter((l) => !l.hot && t >= l.arrive);
  const spawned = timing.filter((l) => t >= l.t0).length;
  const scoring = timing.find((l) => t >= l.atNode && t < l.leave + 0.15);
  const hubPulse = timing.reduce((m, l) => Math.max(m, Math.exp(-Math.pow((t - l.atNode) / 0.12, 2))), 0);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - fade }}>
        <Svg>
          {[0, 1, 2, 3].map((s) => (
            <Paint key={s} d={dOf(inPath(s))} color={pal.line} width={4} p={draw} />
          ))}
          <Paint d={dOf(outPath(true))} color={pal.line} width={4} p={draw} />
          <Paint d={dOf(outPath(false))} color={pal.line} width={4} p={draw} />
          {/* hub */}
          <circle cx={960} cy={540} r={110 * (1 + hubPulse * 0.08) * spring(t - 0.3, 14, 0.7)} fill={pal.card} stroke={pal.p} strokeWidth={6} />
          <text x={960} y={512} textAnchor="middle" fontFamily={ff} fontSize={22} fill={pal.muted}>
            lead score
          </text>
          <text x={960} y={576} textAnchor="middle" fontFamily={ff} fontSize={64} fontWeight={900} fill={scoring ? (scoring.hot ? pal.p : pal.fg) : pal.faint}>
            {scoring ? Math.round(scoring.score * c01((t - scoring.atNode) / 0.25)) : "—"}
          </text>
          {/* lead dots */}
          {timing.map((l, i) => {
            if (t < l.t0 || t > l.arrive + 0.05) return null;
            let p: Pt;
            if (t < l.atNode) p = bez(...inPath(l.s), expInOut((t - l.t0) / 0.55));
            else if (t < l.leave) p = [960 + Math.cos(t * 9 + i) * 40, 540 + Math.sin(t * 9 + i) * 40];
            else p = bez(...outPath(l.hot), expInOut((t - l.leave) / 0.5));
            const col = t >= l.leave ? (l.hot ? pal.p : pal.faint) : pal.fg;
            return <circle key={i} cx={p[0]} cy={p[1]} r={14} fill={col} />;
          })}
        </Svg>
        {/* sources */}
        {sources.map((s, i) => (
          <div key={i} style={{ position: "absolute", left: 120, top: SY[i] - 34, width: 300, height: 68, borderRadius: 99, background: pal.card, border: `1.5px solid ${pal.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, color: pal.fg, transform: `scale(${spring(t - 0.2 - i * 0.1, 15, 0.75)})` }}>
            {s}
          </div>
        ))}
        {/* hot: phone with notifications */}
        <div style={{ position: "absolute", left: HOT.x - 150, top: HOT.y - 250, width: 300, height: 500, borderRadius: 44, background: "#0d0d0f", padding: 10, boxSizing: "border-box", transform: `scale(${spring(t - 0.5, 14, 0.8)})` }}>
          <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 36, background: pal.dark ? "#16171b" : "#f3f3f1", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 18, left: 0, right: 0, textAlign: "center", fontSize: 40, fontWeight: 300, color: pal.fg }}>9:41</div>
            {arrivedHot.slice(-3).reverse().map((l, k) => {
              const s = expOut(seg(t, l.arrive, 0.3));
              return (
                <div key={l.who} style={{ position: "absolute", left: 12, right: 12, top: 90 + k * 112 + (1 - s) * -40, height: 100, borderRadius: 18, background: pal.card2, padding: "12px 14px", boxSizing: "border-box", opacity: s }}>
                  <div style={{ fontSize: 15, color: pal.p, fontWeight: 800 }}>HOT LEAD · {l.score}</div>
                  <div style={{ fontSize: 18, color: pal.fg, fontWeight: 700, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden" }}>{l.who}</div>
                  <div style={{ fontSize: 14, color: pal.muted, marginTop: 2 }}>Reply in under 5 min</div>
                </div>
              );
            })}
          </div>
        </div>
        {/* cold: nurture list */}
        <div style={{ position: "absolute", left: COLD.x - 170, top: COLD.y - 110, width: 340, minHeight: 220, borderRadius: 22, background: pal.card, border: `1.5px solid ${pal.line}`, padding: "16px 20px", boxSizing: "border-box", transform: `scale(${spring(t - 0.6, 14, 0.8)})` }}>
          <div style={{ fontSize: 20, color: pal.muted, fontWeight: 700, marginBottom: 8 }}>Nurture sequence</div>
          {arrivedCold.slice(-4).map((l) => (
            <div key={l.who} style={{ fontSize: 20, color: pal.fg, padding: "6px 0", opacity: expOut(seg(t, l.arrive, 0.3)) }}>
              {l.who} <span style={{ color: pal.faint }}>· {l.score}</span>
            </div>
          ))}
        </div>
        {/* counters */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 70, display: "flex", justifyContent: "center", gap: 60, fontSize: 30, color: pal.muted }}>
          <span>
            Leads today <b style={{ color: pal.fg, fontVariantNumeric: "tabular-nums" }}>{120 + spawned}</b>
          </span>
          <span>
            Hot <b style={{ color: pal.p, fontVariantNumeric: "tabular-nums" }}>{31 + arrivedHot.length}</b>
          </span>
        </div>
      </div>
      <Svg>
        {nameP > 0 && <Txt text={name} x={960} y={540} size={fit(name, 1400, 200, 900)} weight={900} color={pal.fg} font={ff} p={nameP} tracking={-0.05} />}
        {tagP > 0 && <Txt text={c.tagline || "Never miss a hot lead"} x={960} y={650} size={46} weight={500} color={pal.p} font={ff} p={tagP} mode="fade" />}
      </Svg>
      <Track src="tracks/lead-alert.wav" on={audio} />
    </AbsoluteFill>
  );
}

