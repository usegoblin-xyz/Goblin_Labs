import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Phone, Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { ticker: string; points: string; tagline: string };

// A stock-analysis app promo: a phone opens a ticker page, the chart draws,
// an AI summary writes three bullets, a bull/bear dial swings and settles,
// and a fair-value bar slides a marker against the current price.
export default function StockAnalysis({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const ticker = c.ticker || "ACME";
  const points = [...list(c.points || "Revenue up 18% year over year, Margins expanding for 4 quarters, Valuation above sector average"), "Point", "Point", "Point"].slice(0, 3);
  const green = "#2fbf71";
  const red = "#e5484d";
  const chart = c01((t - 0.8) / 1.2);
  const dial = spring(t - 4.0, 6, 0.35);
  const fair = cubicInOut(c01((t - 5.6) / 0.9));
  const outro = expInOut(seg(t, 8.2, 0.5));
  const endP = c01((t - 8.6) / 0.8);
  const N = 40;
  const ys = Array.from({ length: N }, (_, i) => 0.3 + i * 0.012 + Math.sin(i * 0.5) * 0.06 + (hash(i) - 0.5) * 0.05);
  const W = 400;
  const H = 180;
  const line = ys.slice(0, Math.max(2, Math.floor(chart * N))).map((v, i) => `${i ? "L" : "M"}${(i / (N - 1)) * W},${H - v * H}`).join(" ");
  const needle = lerp(-80, 35, dial);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          <Txt text="Know what you own." x={500} y={430} size={86} weight={800} color={pal.fg} font={ff} p={c01((t - 0.2) / 0.6)} tracking={-0.03} />
          <Txt text="Plain-English analysis for any stock." x={500} y={510} size={38} weight={500} color={pal.muted} font={ff} p={c01((t - 0.6) / 0.6)} mode="fade" />
        </Svg>
        <Phone x={1340} y={540 + (1 - spring(t - 0.1, 12, 0.75)) * 1100} h={940} pal={pal}>
          <div style={{ position: "absolute", inset: 0, padding: "74px 26px", boxSizing: "border-box", fontFamily: ff }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <span style={{ fontSize: 40, fontWeight: 900, color: pal.fg }}>{ticker}</span>
              <span style={{ fontSize: 28, color: green, fontWeight: 700 }}>▲ 1.8%</span>
            </div>
            <svg width={W} height={H} style={{ marginTop: 10 }}>
              <path d={line} fill="none" stroke={green} strokeWidth={4} />
            </svg>
            <div style={{ fontSize: 22, fontWeight: 800, color: pal.v, marginTop: 10, letterSpacing: "0.1em" }}>AI SUMMARY</div>
            {points.map((p, i) => {
              const at = 2.0 + i * 0.6;
              const n = Math.floor(c01((t - at) / 0.5) * p.length);
              return (
                <div key={i} style={{ display: "flex", gap: 10, marginTop: 10, fontSize: 23, color: pal.fg, minHeight: 30 }}>
                  <span style={{ color: i === 2 ? "#f2b64a" : green }}>{t > at ? (i === 2 ? "!" : "+") : ""}</span>
                  <span>{p.slice(0, n)}</span>
                </div>
              );
            })}
            {/* dial */}
            <svg width={W} height={170} style={{ marginTop: 14 }}>
              <path d={`M60,150 A140,140 0 0 1 340,150`} fill="none" stroke={pal.card2} strokeWidth={26} />
              <path d={`M60,150 A140,140 0 0 1 200,10`} fill="none" stroke={red} strokeWidth={26} opacity={0.5} />
              <path d={`M200,10 A140,140 0 0 1 340,150`} fill="none" stroke={green} strokeWidth={26} opacity={0.5} />
              <line x1={200} y1={150} x2={200} y2={40} stroke={pal.fg} strokeWidth={8} strokeLinecap="round" transform={`rotate(${t > 4.0 ? needle : -80} 200 150)`} />
              <circle cx={200} cy={150} r={14} fill={pal.fg} />
              <text x={40} y={168} fontFamily={ff} fontSize={20} fill={red}>Bear</text>
              <text x={360} y={168} textAnchor="end" fontFamily={ff} fontSize={20} fill={green}>Bull</text>
            </svg>
            {/* fair value */}
            <div style={{ marginTop: 10, fontSize: 22, color: pal.muted }}>Fair value vs price</div>
            <div style={{ position: "relative", height: 26, borderRadius: 13, background: `linear-gradient(90deg, ${green}, #f2b64a, ${red})`, marginTop: 10, opacity: c01((t - 5.4) * 3) }}>
              <div style={{ position: "absolute", top: -8, left: `${lerp(10, 58, fair)}%`, width: 8, height: 42, borderRadius: 4, background: pal.fg }} />
            </div>
            <div style={{ fontSize: 22, color: pal.fg, marginTop: 8, opacity: c01((t - 6.4) * 3) }}>Trading ~8% above fair value</div>
          </div>
        </Phone>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={520} size={150} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Research in seconds, not hours."} x={960} y={630} size={48} weight={600} color={pal.v} font={ff} p={c01((t - 9.0) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/stock-analysis.wav" on={audio} />
    </AbsoluteFill>
  );
}
