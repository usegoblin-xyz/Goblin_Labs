import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Browser, MONO, Svg, Track, Txt, c01, countStat, cubicInOut, expInOut, fit, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { query: string; site: string; traffic: string; tagline: string };

// An SEO promo: a search results page where your result climbs from the
// bottom to #1, one place per beat, while a traffic chart beside it rises.
const OTHERS = ["The complete guide", "10 tips that work", "Forum: any advice?", "Top picks this year", "What experts say", "A beginner's take", "Reviews and ratings", "Everything to know"];

export default function RankClimb({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const query = c.query || "best project tool";
  const site = c.site || "goblin.app";
  const typed = query.slice(0, Math.floor(c01((t - 0.4) / 0.9) * query.length));
  const N = 9;
  // your rank goes 9 → 1 between 2.0 and 6.0, one eased step every 0.5s
  const prog = c01((t - 2.0) / 4.0) * (N - 1);
  const whole = Math.floor(prog);
  const rankF = N - 1 - Math.min(N - 1, whole + cubicInOut(c01((prog - whole) / 0.5)));
  const pos = (i: number) => i + c01(i + 1 - rankF);
  const rowH = 82;
  const top = 200;
  const yourY = top + rankF * rowH;
  const outro = expInOut(seg(t, 7.4, 0.6));
  const endP = c01((t - 7.8) / 0.8);
  const traffic = expInOut(seg(t, 2.0, 4.4));
  const pts = Array.from({ length: 30 }, (_, i) => {
    const f = i / 29;
    return [1250 + f * 520, 820 - Math.pow(f, 2.4) * 420 * traffic - Math.sin(f * 17) * 10] as [number, number];
  });

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Browser x={590} y={540} w={1020} h={960} pal={pal} url="search" s={lerp(0.95, 1, spring(t, 14, 0.8))}>
          <div style={{ position: "absolute", left: 40, top: 30, width: 860, height: 76, borderRadius: 38, background: pal.card2, display: "flex", alignItems: "center", padding: "0 30px", fontSize: 30, color: pal.fg, boxSizing: "border-box" }}>
            {typed}
            {t < 1.6 && Math.floor(t * 3) % 2 === 0 && <span style={{ color: pal.v }}>▍</span>}
          </div>
          {OTHERS.slice(0, N - 1).map((o, i) => {
            const y = top - 70 + pos(i) * rowH;
            const show = c01((t - 1.4 - i * 0.05) * 4);
            return (
              <div key={o} style={{ position: "absolute", left: 40, top: y, width: 900, opacity: show * 0.75 }}>
                <div style={{ fontSize: 20, color: pal.muted, fontFamily: MONO }}>{["wiki", "blog", "forum", "news", "mag", "site", "store", "docs"][i]}.example</div>
                <div style={{ fontSize: 30, color: pal.fg, fontWeight: 600, marginTop: 4 }}>{o}</div>
              </div>
            );
          })}
          {/* your result */}
          <div style={{ position: "absolute", left: 24, top: yourY - 70 - 10, width: 930, height: 76, padding: "6px 16px", borderRadius: 16, background: pal.v, opacity: c01((t - 1.6) * 4), boxShadow: `0 16px 40px rgba(0,0,0,0.3)` }}>
            <div style={{ fontSize: 20, color: pal.onV, fontFamily: MONO, opacity: 0.8 }}>{site}</div>
            <div style={{ fontSize: 30, color: pal.onV, fontWeight: 800, marginTop: 2 }}>{nameOf(b)} — {query}</div>
          </div>
        </Browser>
        <Svg>
          <text x={1250} y={300} fontFamily={ff} fontSize={190} fontWeight={800} fill={pal.fg} letterSpacing="-0.05em">
            #{Math.round(rankF) + 1}
          </text>
          <Txt text="Ranking" x={1255} y={350} size={36} weight={600} color={pal.muted} font={ff} anchor="start" p={c01((t - 1.8) * 2)} mode="fade" />
          <line x1={1250} x2={1770} y1={820} y2={820} stroke={pal.line} strokeWidth={3} />
          <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={pal.v} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
          <Txt text={`+${countStat(c.traffic || "312%", traffic)} traffic`} x={1250} y={900} size={44} weight={800} color={pal.v} font={ff} anchor="start" p={c01((t - 2.2) * 2)} mode="fade" />
        </Svg>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={c.tagline || "Climb to the top."} x={960} y={520} size={fit(c.tagline || "Climb to the top.", 1500, 140, 800, -0.04, ff)} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={nameOf(b)} x={960} y={640} size={52} weight={600} color={pal.v} font={ff} p={c01((t - 8.2) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/rank-climb.wav" on={audio} />
    </AbsoluteFill>
  );
}
