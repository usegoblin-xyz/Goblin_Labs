import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, countStat, cubicInOut, expInOut, fontOf, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { services: string; stat: string; statLabel: string; city: string };

// A studio intro: a construction grid draws and the studio's initial is
// built from it with geometric primitives (a square, a quarter circle, a
// bar) that slide and snap; then a services list ticks through in a big
// rolling counter style, a client counter climbs, and the studio signs off.
export default function StudioIntro({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const services = [...list(c.services || "Brand identity, Websites, Motion, Product design"), "Design", "Design", "Design", "Design"].slice(0, 4);
  const grid = cubicInOut(c01(t / 0.9));
  const prim = (i: number) => spring(t - 0.8 - i * 0.25, 14, 0.6);
  const markOut = expInOut(seg(t, 2.8, 0.6));
  const roll = c01((t - 3.4) / 3.0) * 3;
  const ri = Math.min(3, Math.floor(roll));
  const rf = cubicInOut(c01((roll - ri - 0.6) / 0.4));
  const statP = c01((t - 6.6) / 1.0);
  const outro = expInOut(seg(t, 8.4, 0.5));
  const endP = c01((t - 8.8) / 0.8);
  const G = 120;
  const OX = 960 - G * 2;
  const OY = 540 - G * 2;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          <g opacity={1 - markOut} transform={`translate(960 540) scale(${1 - markOut * 0.5}) translate(-960 -540) translate(${-markOut * 600} 0)`}>
            {Array.from({ length: 5 }, (_, i) => (
              <g key={i}>
                <line x1={OX + i * G} x2={OX + i * G} y1={OY} y2={OY + 4 * G * grid} stroke={pal.line} strokeWidth={2} />
                <line y1={OY + i * G} y2={OY + i * G} x1={OX} x2={OX + 4 * G * grid} stroke={pal.line} strokeWidth={2} />
              </g>
            ))}
            <circle cx={OX + 2 * G} cy={OY + 2 * G} r={2 * G * grid} fill="none" stroke={pal.line} strokeWidth={2} />
            {/* primitives forming an abstract mark */}
            <rect x={OX} y={OY + (1 - prim(0)) * -600} width={G * 2} height={G * 4} fill={pal.fg} />
            <path d={`M${OX + 2 * G},${OY} A${2 * G},${2 * G} 0 0 1 ${OX + 4 * G},${OY + 2 * G} L${OX + 2 * G},${OY + 2 * G} Z`} fill={pal.v} transform={`translate(${(1 - prim(1)) * 700} 0)`} />
            <rect x={OX + 2 * G} y={OY + 3 * G} width={G * 2} height={G} fill={pal.a} transform={`translate(0 ${(1 - prim(2)) * 600})`} />
            <circle cx={OX + 3 * G} cy={OY + 2.5 * G} r={G * 0.3 * prim(3)} fill={pal.fg} />
          </g>
        </Svg>
        {/* services roller */}
        {t > 3.2 && (
          <div style={{ position: "absolute", left: 160, top: 300, width: 1600 }}>
            <div style={{ fontSize: 34, fontWeight: 700, color: pal.muted, letterSpacing: "0.12em", opacity: c01((t - 3.2) * 3) }}>WE DO</div>
            <div style={{ position: "relative", height: 220, overflow: "hidden", marginTop: 10 }}>
              {services.map((s, i) => {
                const y = (i - ri - rf) * 220;
                return (
                  <div key={i} style={{ position: "absolute", left: 0, top: y, height: 220, display: "flex", alignItems: "center", fontSize: 170, fontWeight: 900, letterSpacing: "-0.04em", color: i === ri ? pal.fg : pal.faint, whiteSpace: "nowrap" }}>
                    {s}
                  </div>
                );
              })}
            </div>
            {statP > 0 && (
              <div style={{ marginTop: 60, display: "flex", alignItems: "baseline", gap: 24, opacity: c01(statP * 4) }}>
                <span style={{ fontSize: 120, fontWeight: 900, color: pal.v, fontVariantNumeric: "tabular-nums" }}>{countStat(c.stat || "120+", statP)}</span>
                <span style={{ fontSize: 44, color: pal.muted }}>{c.statLabel || "brands launched"}</span>
              </div>
            )}
          </div>
        )}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={520} size={170} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={`Independent studio · ${c.city || "Berlin"}`} x={960} y={630} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 9.2) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/studio-intro.wav" on={audio} />
    </AbsoluteFill>
  );
}
