import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { MONO, Paint, Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, kf, nameOf, palette, seg, sineInOut, useT } from "../../motion";

type C = { caption: string };

// What a derivative is, in one picture: a secant through two points on a
// curve, the gap h shrinking until the secant becomes the tangent, the slope
// read out as a stacked fraction, then the point slides along the curve while
// its slope draws the derivative's own graph beside it.
const f = (x: number) => 0.25 * x * x * x - x;
const df = (x: number) => 0.75 * x * x - 1;
// main graph
const MX = 520;
const MY = 480;
const SX = 140;
const SY = 120;
const toM = (x: number, y: number) => [MX + x * SX, MY - y * SY] as const;
// derivative graph
const DX = 1420;
const DY = 860;
const DSX = 110;
const DSY = 48;
const toD = (x: number, y: number) => [DX + x * DSX, DY - y * DSY] as const;

function curvePath(fn: (x: number) => number, map: (x: number, y: number) => readonly [number, number], a: number, z: number) {
  const pts: string[] = [];
  const n = 120;
  for (let i = 0; i <= n; i++) {
    const x = a + ((z - a) * i) / n;
    const [px, py] = map(x, fn(x));
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  return `M${pts.join(" L")}`;
}

export default function DerivativeExplainer({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);

  const axes = expOut(seg(t, 0, 0.6));
  const curve = expInOut(seg(t, 0.3, 0.9));
  const pIn = c01((t - 1.2) / 0.3);
  const qIn = c01((t - 1.5) / 0.3);
  const h = kf(t, [[1.8, 2], [4.4, 0.02]]);
  const tangent = c01((t - 4.4) / 0.3);
  const x0 = t < 5.0 ? 1 : kf(t, [[5.0, 1], [5.5, -2.2], [7.6, 2.2]], sineInOut);
  const traced = c01((t - 5.5) / 2.1);
  const endP = expInOut(seg(t, 7.8, 0.6));

  const slope = tangent > 0.5 ? df(x0) : (f(x0 + h) - f(x0)) / h;
  const [px, py] = toM(x0, f(x0));
  const [qx, qy] = toM(x0 + h, f(x0 + h));
  const L = 1.4;
  const [l1x, l1y] = toM(x0 - L, f(x0) - slope * L);
  const [l2x, l2y] = toM(x0 + L, f(x0) + slope * L);
  const lineCol = tangent > 0.5 ? pal.p : pal.a;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        <g opacity={1 - endP * 0.85}>
          {/* main axes */}
          <Paint d={`M${MX - 2.8 * SX},${MY} L${MX + 2.8 * SX},${MY}`} color={pal.faint} width={3} p={axes} />
          <Paint d={`M${MX},${MY + 2 * SY} L${MX},${MY - 2.4 * SY}`} color={pal.faint} width={3} p={axes} />
          <text x={MX + 2.8 * SX} y={MY + 40} fontFamily={MONO} fontSize={26} fill={pal.muted} textAnchor="end">x</text>
          <text x={MX - 2.7 * SX} y={MY - 2.2 * SY} fontFamily={MONO} fontSize={30} fill={pal.fg} opacity={curve}>
            f(x)
          </text>
          <Paint d={curvePath(f, toM, -2.6, 2.6)} color={pal.fg} width={6} p={curve} />
          {/* secant / tangent */}
          {qIn > 0 && <line x1={l1x} y1={l1y} x2={l2x} y2={l2y} stroke={lineCol} strokeWidth={5} opacity={qIn} />}
          {qIn > 0 && tangent < 1 && (
            <>
              <circle cx={qx} cy={qy} r={12} fill={pal.a} opacity={qIn * (1 - tangent)} />
              <text x={qx + 18} y={qy - 14} fontFamily={ff} fontSize={30} fontWeight={700} fill={pal.a} opacity={1 - tangent}>
                Q
              </text>
              <line x1={px} y1={MY + 2 * SY - 30} x2={qx} y2={MY + 2 * SY - 30} stroke={pal.a} strokeWidth={3} opacity={1 - tangent} />
              <text x={(px + qx) / 2} y={MY + 2 * SY - 42} textAnchor="middle" fontFamily={ff} fontSize={28} fill={pal.a} opacity={1 - tangent}>
                h
              </text>
            </>
          )}
          {pIn > 0 && (
            <>
              <circle cx={px} cy={py} r={14 * pIn} fill={pal.p} />
              <text x={px - 34} y={py - 18} fontFamily={ff} fontSize={30} fontWeight={700} fill={pal.p}>
                P
              </text>
            </>
          )}
          {tangent > 0 && t < 5.0 && (
            <text x={l2x - 10} y={l2y - 18} textAnchor="end" fontFamily={ff} fontSize={30} fontWeight={700} fill={pal.p} opacity={tangent}>
              tangent
            </text>
          )}

          {/* formula panel with a stacked fraction */}
          <g opacity={c01((t - 1.6) / 0.4)}>
            <rect x={1060} y={130} width={740} height={380} rx={26} fill={pal.card} />
            <text x={1110} y={250} fontFamily={ff} fontSize={46} fontWeight={700} fill={pal.fg}>
              slope =
            </text>
            <text x={1495} y={220} textAnchor="middle" fontFamily={MONO} fontSize={38} fill={pal.fg}>
              f(x + h) − f(x)
            </text>
            <line x1={1320} x2={1670} y1={240} y2={240} stroke={pal.fg} strokeWidth={4} />
            <text x={1495} y={290} textAnchor="middle" fontFamily={MONO} fontSize={38} fill={pal.a}>
              h
            </text>
            <text x={1110} y={390} fontFamily={MONO} fontSize={34} fill={pal.muted}>
              {tangent > 0.5 ? "h → 0" : `h = ${h.toFixed(2)}`}
            </text>
            <text x={1110} y={455} fontFamily={MONO} fontSize={40} fontWeight={700} fill={tangent > 0.5 ? pal.p : pal.fg}>
              {tangent > 0.5 ? `f'(${x0.toFixed(2)}) = ${slope.toFixed(2)}` : `slope = ${slope.toFixed(3)}`}
            </text>
          </g>

          {/* derivative graph */}
          {t > 5.0 && (
            <g opacity={c01((t - 5.0) / 0.4)}>
              <line x1={DX - 2.6 * DSX} x2={DX + 2.6 * DSX} y1={DY} y2={DY} stroke={pal.faint} strokeWidth={3} />
              <line x1={DX} x2={DX} y1={DY + 1.4 * DSY} y2={DY - 4 * DSY} stroke={pal.faint} strokeWidth={3} />
              <text x={DX - 2.5 * DSX} y={DY - 3.6 * DSY} fontFamily={MONO} fontSize={30} fill={pal.p}>
                f'(x)
              </text>
              {traced > 0 && <path d={curvePath(df, toD, -2.2, -2.2 + 4.4 * traced)} fill="none" stroke={pal.p} strokeWidth={6} />}
              {traced > 0 && <circle cx={toD(x0, df(x0))[0]} cy={toD(x0, df(x0))[1]} r={12} fill={pal.p} />}
              {traced > 0 && <line x1={toD(x0, 0)[0]} x2={toD(x0, df(x0))[0]} y1={DY} y2={toD(x0, df(x0))[1]} stroke={pal.p} strokeWidth={2} strokeDasharray="6 8" />}
            </g>
          )}
        </g>
        {endP > 0 && (
          <>
            <Txt text={c.caption || "The derivative is the slope at every point"} x={960} y={500} size={fit(c.caption || "The derivative is the slope at every point", 1700, 80, 800)} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.03} />
            <Txt text={name} x={960} y={600} size={44} weight={600} color={pal.p} font={ff} p={c01((t - 8.3) / 0.5)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/derivative-explainer.wav" on={audio} />
    </AbsoluteFill>
  );
}
