import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fit, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { labels: string; values: string; headline: string; tagline: string };

// A data visualisation launch: a raw spreadsheet appears, its value cells
// lift out and fly into bars, the bars bend into a donut, and the donut
// becomes the hero of a finished infographic card.
export default function DataToVisual({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const labels = [...list(c.labels || "North, South, East, West, Online"), "A", "B", "C", "D", "E"].slice(0, 5);
  const values = [...list(c.values || "42, 28, 35, 19, 61").map(Number), 30, 30, 30, 30, 30].slice(0, 5);
  const maxV = Math.max(...values);
  const sum = values.reduce((a, v) => a + v, 0);
  const tableIn = expOut(seg(t, 0.2, 0.6));
  const lift = expInOut(seg(t, 1.6, 0.9)); // cells → bars
  const grow = expOut(seg(t, 2.4, 0.8));
  const donut = expInOut(seg(t, 4.0, 1.0)); // bars → donut
  const card = expInOut(seg(t, 5.6, 0.8));
  const outro = expInOut(seg(t, 8.0, 0.5));
  const endP = c01((t - 8.4) / 0.8);
  const cols = [pal.v, pal.a, pal.fg, pal.faint, pal.p];
  const hl = c.headline || "Where sales came from";

  // table geometry
  const TX = 420;
  const TY = 300;
  const rowH = 90;
  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* table */}
        <div style={{ position: "absolute", left: TX - 300, top: TY - 70, width: 600, opacity: tableIn * (1 - lift * 0.85), transform: `translateX(${-lift * 120}px)`, fontFamily: MONO, fontSize: 32, color: pal.fg }}>
          <div style={{ display: "flex", padding: "16px 24px", background: pal.card2, borderRadius: "16px 16px 0 0", color: pal.muted }}>
            <span style={{ flex: 1 }}>region</span>
            <span>value</span>
          </div>
          {labels.map((l, i) => (
            <div key={i} style={{ display: "flex", padding: "0 24px", height: rowH, alignItems: "center", background: pal.card, borderTop: `1.5px solid ${pal.line}` }}>
              <span style={{ flex: 1 }}>{l}</span>
              <span style={{ opacity: lift > 0.05 ? 0 : 1 }}>{values[i]}</span>
            </div>
          ))}
        </div>
        <Svg>
          {/* card behind the final visual */}
          <rect x={lerp(960, 300, card)} y={lerp(540, 140, card)} width={lerp(0, 1320, card)} height={lerp(0, 800, card)} rx={40} fill={pal.card} opacity={card} />
          <Txt text={hl} x={420} y={260} size={fit(hl, 900, 64, 800, -0.03, ff)} weight={800} color={pal.fg} font={ff} anchor="start" p={c01((t - 6.1) / 0.7)} tracking={-0.03} />
          {values.map((v, i) => {
            // value cell position in the table
            const cx = TX + 220;
            const cy = TY + 30 + i * rowH + rowH / 2;
            // bar layout
            const bw = 110;
            const bx = 1000 + i * 150;
            const bh = (v / maxV) * 460 * grow;
            const by = 820 - bh;
            // donut slice
            const a0 = (values.slice(0, i).reduce((a, x) => a + x, 0) / sum) * Math.PI * 2 - Math.PI / 2;
            const a1 = a0 + (v / sum) * Math.PI * 2;
            const DCX = lerp(1280, 1260, card);
            const DCY = lerp(540, 560, card);
            const R = 260;
            const r0 = 150;
            const arc = (r: number, a: number) => `${DCX + Math.cos(a) * r},${DCY + Math.sin(a) * r}`;
            const large = a1 - a0 > Math.PI ? 1 : 0;
            const slice = `M${arc(R, a0)} A${R},${R} 0 ${large} 1 ${arc(R, a1)} L${arc(r0, a1)} A${r0},${r0} 0 ${large} 0 ${arc(r0, a0)} Z`;
            if (donut < 0.5) {
              const x = lerp(cx, bx, lift);
              const y = lerp(cy - 20, by, lift);
              const w = lerp(90, bw, lift);
              const h = lerp(40, Math.max(40, bh), lift);
              const sq = 1 - donut * 2;
              return (
                <g key={i} opacity={c01(lift * 8) * sq + (lift < 0.05 ? 0 : 0)} transform={`translate(${x + w / 2} ${y + h}) scale(${lerp(1, 0.3, donut * 2)}) translate(${-(x + w / 2)} ${-(y + h)})`}>
                  <rect x={x} y={y} width={w} height={h} rx={14} fill={cols[i]} />
                  <text x={x + w / 2} y={y - 18} textAnchor="middle" fontFamily={ff} fontSize={34} fontWeight={800} fill={pal.fg} opacity={grow}>
                    {Math.round(v * grow)}
                  </text>
                  <text x={x + w / 2} y={870} textAnchor="middle" fontFamily={ff} fontSize={26} fill={pal.muted} opacity={lift}>
                    {labels[i]}
                  </text>
                </g>
              );
            }
            const p = c01((donut - 0.5) * 2);
            const mid = (a0 + a1) / 2;
            return (
              <g key={i} transform={`translate(${Math.cos(mid) * 30 * (1 - p)} ${Math.sin(mid) * 30 * (1 - p)})`} opacity={p}>
                <path d={slice} fill={cols[i]} />
                {card > 0.5 && (
                  <g opacity={c01((t - 6.2 - i * 0.1) * 3)}>
                    <rect x={420} y={360 + i * 90} width={36} height={36} rx={8} fill={cols[i]} />
                    <text x={476} y={390 + i * 90} fontFamily={ff} fontSize={36} fontWeight={600} fill={pal.fg}>
                      {labels[i]}
                    </text>
                    <text x={860} y={390 + i * 90} textAnchor="end" fontFamily={ff} fontSize={36} fontWeight={800} fill={pal.fg}>
                      {Math.round((v / sum) * 100)}%
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          {donut > 0.6 && (
            <text x={lerp(1280, 1260, card)} y={lerp(540, 560, card) + 22} textAnchor="middle" fontFamily={ff} fontSize={64} fontWeight={800} fill={pal.fg} opacity={c01((donut - 0.6) * 3)}>
              {sum}
            </text>
          )}
        </Svg>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "From rows to stories."} x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - 8.8) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/data-to-visual.wav" on={audio} />
    </AbsoluteFill>
  );
}
