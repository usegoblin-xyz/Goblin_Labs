import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, fit, fontOf, hash, lerp, nameOf, palette, seg, useT } from "../../motion";

type C = { years: string; since: string; line: string };

// An anniversary in particles: a few hundred colored specks swirl in and
// settle into a giant dot-matrix number, the years tick from then to now,
// confetti bursts, and the line lands underneath.
const GLYPHS: Record<string, string[]> = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
};

export default function AnniversaryDots({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const years = String(c.years || "20").replace(/[^0-9]/g, "").slice(0, 3) || "20";
  const since = Number(c.since || 2006);
  const cell = Math.min(46, 1100 / (years.length * 6));
  // target dots from the dot-matrix digits
  const targets: [number, number][] = [];
  const totalW = years.length * 6 * cell - cell;
  years.split("").forEach((d, k) => {
    const g = GLYPHS[d] ?? GLYPHS["0"];
    g.forEach((row, r) =>
      row.split("").forEach((on, col) => {
        if (on === "1") targets.push([960 - totalW / 2 + (k * 6 + col) * cell + cell / 2, 430 - 3.5 * cell + r * cell + cell / 2]);
      }),
    );
  });
  const N = 260;
  const cols = [pal.v, pal.a, pal.fg, pal.p];
  const gather = (i: number) => expInOut(seg(t, 0.4 + hash(i, 9) * 1.0, 1.4));
  const yearNow = Math.round(lerp(since, since + Number(years), expInOut(seg(t, 1.2, 2.2))));
  const burst = seg(t, 3.6, 1.6);
  const outro = expInOut(seg(t, 7.2, 0.6));

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        <g opacity={1 - outro}>
          {Array.from({ length: N }, (_, i) => {
            const a = hash(i, 1) * Math.PI * 2;
            const R = 700 + hash(i, 2) * 500;
            const sx = 960 + Math.cos(a + t * 0.4) * R;
            const sy = 540 + Math.sin(a + t * 0.4) * R * 0.7;
            const target = i < targets.length ? targets[i] : null;
            const g = gather(i);
            let x: number;
            let y: number;
            let r = 7 + hash(i, 3) * 6;
            if (target) {
              const jitter = i >= targets.length ? 10 : 0;
              x = lerp(sx, target[0] + (hash(i, 4) - 0.5) * jitter, g);
              y = lerp(sy, target[1] + (hash(i, 5) - 0.5) * jitter, g);
              r = lerp(r, i >= targets.length ? cell * 0.18 : cell * 0.42, g);
            } else {
              // leftovers become an orbiting ring and then confetti
              const ang = a + t * 0.8;
              x = lerp(sx, 960 + Math.cos(ang) * 720, g);
              y = lerp(sy, 430 + Math.sin(ang) * 330, g);
              r *= 0.7;
            }
            // confetti burst
            if (burst > 0 && !target) {
              const v = 900 + hash(i, 6) * 900;
              x += Math.cos(a * 3) * v * burst;
              y += Math.sin(a * 3) * v * burst * 0.6 + 900 * burst * burst;
            }
            const sq = hash(i, 7) > 0.6;
            return sq ? <rect key={i} x={x - r} y={y - r} width={r * 2} height={r * 2} rx={r * 0.3} fill={cols[i % 4]} transform={`rotate(${hash(i, 8) * 90 + t * 60 * (target ? 1 - g : 1)} ${x} ${y})`} /> : <circle key={i} cx={x} cy={y} r={r} fill={cols[i % 4]} />;
          })}
          <Txt text={`${since} — ${yearNow}`} x={960} y={790} size={64} weight={700} color={pal.muted} font={ff} p={c01((t - 1.2) / 0.6)} tracking={0.02} />
          <Txt text={c.line || "years of good things"} x={960} y={890} size={fit(c.line || "years of good things", 1500, 76, 800, -0.03, ff)} weight={800} color={pal.fg} font={ff} p={c01((t - 3.8) / 0.8)} />
        </g>
        <Txt text={nameOf(b)} x={960} y={560} size={170} weight={800} color={pal.fg} font={ff} p={c01((t - 7.6) / 0.8)} tracking={-0.04} />
        <Txt text={`Thank you for ${years} years`} x={960} y={670} size={50} weight={500} color={pal.v} font={ff} p={c01((t - 8.0) / 0.6)} mode="fade" />
      </Svg>
      <Track src="tracks/anniversary-dots.wav" on={audio} />
    </AbsoluteFill>
  );
}

