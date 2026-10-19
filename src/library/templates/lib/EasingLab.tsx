import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, backOut, c01, cubicInOut, expInOut, expOut, fontOf, lerp, nameOf, palette, seg, sineInOut, useT } from "../../motion";

type C = { line: string };

// An easing lab: six balls race the same distance in the same time, each on
// a different curve, then one shape morphs through circle, square, triangle
// and star using those same curves. Ends on the line.
const elastic = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1);
const bounce = (x: number) => {
  const n = 7.5625;
  const d = 2.75;
  let v = x;
  if (v < 1 / d) return n * v * v;
  if (v < 2 / d) return n * (v -= 1.5 / d) * v + 0.75;
  if (v < 2.5 / d) return n * (v -= 2.25 / d) * v + 0.9375;
  return n * (v -= 2.625 / d) * v + 0.984375;
};
const CURVES: [string, (x: number) => number][] = [
  ["linear", (x) => x],
  ["ease-in-out", sineInOut],
  ["expo-out", expOut],
  ["back-out", (x) => backOut(x, 2.2)],
  ["elastic", elastic],
  ["bounce", bounce],
];

function shapePts(k: number, n: number, r: number): [number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    if (k === 0) return [Math.cos(a) * r, Math.sin(a) * r];
    if (k === 1) {
      const m = Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
      return [(Math.cos(a) / m) * r * 0.85, (Math.sin(a) / m) * r * 0.85];
    }
    if (k === 2) {
      const sides = 3;
      const sa = (Math.PI * 2) / sides;
      const off = ((a + Math.PI / 2) % sa + sa) % sa - sa / 2;
      const d = (r * Math.cos(Math.PI / sides)) / Math.cos(off);
      return [Math.cos(a) * d, Math.sin(a) * d];
    }
    const spikes = 5;
    const u = ((i / n) * spikes * 2) % 2;
    const rr = u < 1 ? lerp(r, r * 0.45, u) : lerp(r * 0.45, r, u - 1);
    return [Math.cos(a) * rr, Math.sin(a) * rr];
  });
}

export default function EasingLab({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const raceP = c01((t - 0.8) / 1.8);
  const race2 = c01((t - 3.0) / 1.6);
  const raceOut = expInOut(seg(t, 4.8, 0.5));
  const morphT = t - 5.4;
  const endP = c01((t - 9.2) / 0.8);
  const X0 = 520;
  const X1 = 1700;
  const N = 96;
  // morph sequence: circle → square → triangle → star → circle, each with a different curve
  const stage = Math.max(0, Math.min(4, Math.floor(morphT / 0.9)));
  const local = c01((morphT - stage * 0.9) / 0.6);
  const curve = CURVES[(stage + 2) % CURVES.length];
  const k = curve[1](local);
  const A = shapePts(stage % 4, N, 260);
  const B = shapePts((stage + 1) % 4, N, 260);
  const pts = A.map((p, i) => [lerp(p[0], B[i][0], k), lerp(p[1], B[i][1], k)]);
  const morphIn = expOut(seg(t, 5.2, 0.4)) * (1 - expInOut(seg(t, 8.9, 0.4)));

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        <g opacity={1 - raceOut}>
          {CURVES.map(([name, f], i) => {
            const y = 180 + i * 140;
            const there = f(raceP);
            const back = race2 > 0 ? f(race2) : 0;
            const x = lerp(X0, X1, there - back);
            const appear = expOut(seg(t, 0.1 + i * 0.06, 0.5));
            return (
              <g key={name} opacity={appear}>
                <text x={120} y={y + 12} fontFamily={MONO} fontSize={32} fill={pal.muted}>
                  {name}
                </text>
                <line x1={X0} x2={X1} y1={y} y2={y} stroke={pal.line} strokeWidth={3} />
                <circle cx={X0} cy={y} r={6} fill={pal.faint} />
                <circle cx={X1} cy={y} r={6} fill={pal.faint} />
                <circle cx={x} cy={y} r={30} fill={i === 3 ? pal.v : pal.fg} />
              </g>
            );
          })}
        </g>
        {morphIn > 0 && (
          <g opacity={morphIn} transform={`translate(960 520) rotate(${morphT * 20})`}>
            <path d={"M" + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" L") + " Z"} fill={pal.v} />
          </g>
        )}
        {morphIn > 0 && (
          <text x={960} y={940} textAnchor="middle" fontFamily={MONO} fontSize={40} fill={pal.muted} opacity={morphIn}>
            {curve[0]}
          </text>
        )}
        {endP > 0 && (
          <>
            <Txt text={c.line || "Feel the curve."} x={960} y={540} size={150} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} mode="scale" />
            <Txt text={nameOf(b)} x={960} y={660} size={50} weight={600} color={pal.v} font={ff} p={c01((t - 9.6) / 0.6)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/easing-lab.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = cubicInOut;
