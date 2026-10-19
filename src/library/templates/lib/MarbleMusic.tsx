import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expOut, fit, fontOf, mix, nameOf, palette, useT } from "../../motion";

type C = { title: string };

// A marble music machine where every note comes from a visible collision.
// Marbles drop from a feeder and bounce along tuned bars on ballistic arcs;
// each strike lights the bar, sends a ripple, and prints a dot on the
// piano roll below. The soundtrack is generated from the same score, so the
// notes land exactly on the hits.
const BARS: [number, number][] = [
  [330, 600], [540, 500], [750, 640], [960, 470], [1170, 640], [1380, 500], [1590, 600], [960, 780],
];
const NOTE = ["C", "D", "E", "G", "A", "C", "D", "E"];
// chains: [start time, bar sequence]; hits are 0.5 s apart
const CHAINS: [number, number[]][] = [
  [1.0, [0, 2, 4, 2, 1, 3]],
  [1.25, [4, 5, 7, 5, 3, 1]],
  [4.0, [0, 4, 2, 6, 3, 5]],
  [4.25, [7, 3, 5, 1, 4, 2]],
  [7.0, [1, 3, 0]],
  [7.0, [5, 6, 2]],
  [7.0, [3, 7, 4]],
];
const G = 2600;
const R = 16;
const FEED: [number, number] = [960, 40];

type Hit = { t: number; bar: number };
const HITS: Hit[] = CHAINS.flatMap(([s, seq]) => seq.map((bar, i) => ({ t: s + i * 0.5, bar })));

function arc(p0: [number, number], p1: [number, number], dt: number, u: number): [number, number] {
  const vx = (p1[0] - p0[0]) / dt;
  const vy = (p1[1] - p0[1] - 0.5 * G * dt * dt) / dt;
  return [p0[0] + vx * u, p0[1] + vy * u + 0.5 * G * u * u];
}
const top = (bar: number): [number, number] => [BARS[bar][0], BARS[bar][1] - 12 - R];

function marbleAt(chain: [number, number[]], t: number): [number, number] | null {
  const [s, seq] = chain;
  const t0 = s - 0.6;
  if (t < t0) return null;
  if (t < s) return arc(FEED, top(seq[0]), 0.6, t - t0);
  const k = Math.floor((t - s) / 0.5);
  if (k < seq.length - 1) return arc(top(seq[k]), top(seq[k + 1]), 0.5, t - s - k * 0.5);
  const last = top(seq[seq.length - 1]);
  const u = t - s - (seq.length - 1) * 0.5;
  if (u > 0.9) return null;
  const drift = last[0] < 960 ? -260 : 260;
  return [last[0] + drift * u, last[1] - 420 * u + 0.5 * G * u * u];
}

export default function MarbleMusic({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const endP = c01((t - 8.6) / 0.6);
  const cols = BARS.map((_, i) => mix(pal.p, pal.a, i / 7));

  return (
    <AbsoluteFill style={{ background: pal.dark ? pal.bg : "#0f1115", overflow: "hidden", fontFamily: ff }}>
      <Svg>
        <g opacity={1 - endP * 0.8}>
          {/* feeder */}
          <path d={`M${FEED[0] - 60},0 L${FEED[0] - 24},${FEED[1] + 10} M${FEED[0] + 60},0 L${FEED[0] + 24},${FEED[1] + 10}`} stroke="#5b6170" strokeWidth={6} strokeLinecap="round" />
          {/* bars */}
          {BARS.map(([x, y], i) => {
            const last = HITS.filter((h) => h.bar === i && h.t <= t).reduce((m, h) => Math.max(m, h.t), -9);
            const d = t - last;
            const glow = Math.exp(-d * 6);
            const wob = Math.sin(d * 60) * Math.exp(-d * 10) * 6;
            return (
              <g key={i}>
                {d < 0.6 && <ellipse cx={x} cy={y} rx={60 + d * 260} ry={(60 + d * 260) * 0.35} fill="none" stroke={cols[i]} strokeWidth={3} opacity={1 - d / 0.6} />}
                <line x1={x - 50} y1={y + 12} x2={x - 50} y2={y + 70} stroke="#3a3f4b" strokeWidth={4} />
                <line x1={x + 50} y1={y + 12} x2={x + 50} y2={y + 70} stroke="#3a3f4b" strokeWidth={4} />
                <rect x={x - 80} y={y - 12 + wob} width={160} height={24} rx={12} fill={mix("#2a2e38", cols[i], 0.35 + glow * 0.65)} />
                <text x={x} y={y + 100} textAnchor="middle" fontFamily={ff} fontSize={22} fill="#7c8394" opacity={0.8}>
                  {NOTE[i]}
                </text>
              </g>
            );
          })}
          {/* marbles with short trails */}
          {CHAINS.map((ch, i) => {
            const p = marbleAt(ch, t);
            if (!p) return null;
            return (
              <g key={i}>
                {[1, 2, 3, 4].map((k) => {
                  const q = marbleAt(ch, t - k * 0.02);
                  return q ? <circle key={k} cx={q[0]} cy={q[1]} r={R * (1 - k * 0.15)} fill="#ffffff" opacity={0.12} /> : null;
                })}
                <circle cx={p[0]} cy={p[1]} r={R} fill="#f4f5f7" />
                <circle cx={p[0] - 5} cy={p[1] - 5} r={5} fill="#ffffff" />
              </g>
            );
          })}
          {/* piano roll */}
          <g transform="translate(160 930)">
            <rect width={1600} height={120} rx={16} fill="#171a21" />
            {HITS.filter((h) => h.t <= t).map((h, i) => {
              const x = 20 + (h.t / 9) * 1560;
              const y = 104 - h.bar * 12;
              const pop = expOut(c01((t - h.t) / 0.15));
              return <rect key={i} x={x} y={y - 6} width={40 * pop} height={10} rx={5} fill={cols[h.bar]} />;
            })}
            <line x1={20 + (Math.min(t, 9) / 9) * 1560} y1={8} x2={20 + (Math.min(t, 9) / 9) * 1560} y2={112} stroke="#ffffff" strokeWidth={2} opacity={0.5} />
          </g>
          <text x={120} y={110} fontFamily={ff} fontSize={26} fill="#7c8394">{`${HITS.filter((h) => h.t <= t).length} notes · ${HITS.filter((h) => h.t <= t).length} collisions`}</text>
        </g>
        {endP > 0 && (
          <>
            <Txt text={c.title || "Every note, a collision"} x={960} y={400} size={fit(c.title || "Every note, a collision", 1500, 120, 900)} weight={900} color="#ffffff" font={ff} p={endP} tracking={-0.04} />
            <Txt text={name} x={960} y={500} size={48} weight={700} color={pal.p} font={ff} p={c01((t - 9.0) / 0.5)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/marble-music.wav" on={audio} />
    </AbsoluteFill>
  );
}
