import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Mark, Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { role: string };

// A pendulum wave: fifteen dots on fifteen rails, each swinging a little
// faster than the one above. Out of phase they make a snake, then two groups,
// three groups, chaos, and at the end of the cycle they all line up again,
// slide together and become your mark.
const N = 15;
const T0 = 0.8;
const CYCLE = 7.2;
const AMP = 560;

export default function PendulumWave({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);

  const ys = Array.from({ length: N }, (_, k) => 190 + (k * 700) / (N - 1));
  const xAt = (k: number, tt: number) => {
    if (tt < T0) return lerp(1920 + 100, 960 + AMP, expOut(seg(tt, k * 0.03, 0.6)));
    const f = (6 + k) / CYCLE;
    return 960 + AMP * Math.cos(2 * Math.PI * f * Math.min(tt - T0, CYCLE));
  };
  const gather = expInOut(seg(t, 8.05, 0.5));
  const mark = spring(t - 8.35, 14, 0.7);
  const lock = expInOut(seg(t, 8.8, 0.5));
  const nameW = Math.min(980, name.length * 105);
  const markX = lerp(960, 960 - nameW / 2 - 40, lock);
  const nameP = c01((t - 8.9) / 0.6);
  const roleP = c01((t - 9.2) / 0.5);

  const pts = ys.map((y, k) => {
    const x = xAt(k, t);
    return [lerp(x, 960, gather), lerp(y, 540, gather)] as const;
  });
  const curve = pts.reduce((d, p, i) => {
    if (i === 0) return `M${p[0]},${p[1]}`;
    const q = pts[i - 1];
    const my = (q[1] + p[1]) / 2;
    return `${d} C${q[0]},${my} ${p[0]},${my} ${p[0]},${p[1]}`;
  }, "");

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        {ys.map((y, k) => (
          <line key={k} x1={960 - AMP} x2={960 + AMP} y1={y} y2={y} stroke={pal.line} strokeWidth={2} opacity={1 - gather} />
        ))}
        <line x1={960} x2={960} y1={150} y2={930} stroke={pal.line} strokeWidth={2} strokeDasharray="4 10" opacity={1 - gather} />
        {mark < 0.5 && <path d={curve} fill="none" stroke={pal.p} strokeWidth={5} opacity={c01((t - T0) * 2) * (1 - gather)} />}
        {mark < 0.5 &&
          ys.map((y, k) => (
            <g key={k}>
              {[0.06, 0.12, 0.18, 0.24].map((dt, j) => {
                const x = xAt(k, t - dt);
                return <circle key={j} cx={lerp(x, 960, gather)} cy={lerp(y, 540, gather)} r={16 - j * 3} fill={k % 2 ? pal.a : pal.p} opacity={(0.32 - j * 0.07) * (1 - gather)} />;
              })}
              <circle cx={pts[k][0]} cy={pts[k][1]} r={18} fill={k % 2 ? pal.a : pal.p} />
            </g>
          ))}
      </Svg>
      {mark > 0.01 && <Mark x={markX} y={540} size={190} b={b} pal={pal} s={mark} />}
      <Svg>
        {nameP > 0 && <Txt text={name} x={markX + 135} y={578} size={fit(name, nameW + 200, 140, 800)} weight={800} color={pal.fg} font={ff} p={nameP} anchor="start" tracking={-0.04} />}
        {roleP > 0 && <Txt text={c.role || "Timing is everything"} x={960} y={760} size={40} weight={500} color={pal.muted} font={ff} p={roleP} mode="fade" />}
      </Svg>
      <Track src="tracks/pendulum-wave.wav" on={audio} />
    </AbsoluteFill>
  );
}
