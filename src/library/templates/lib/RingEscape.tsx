import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expOut, fit, fontOf, hash, lerp, mix, nameOf, palette, useT } from "../../motion";

type C = { caption: string };

// A ball trapped inside twelve spinning rings. Every ring has a gap; each
// time the ball bounces it rings a note, and when the gap swings round to
// meet it the ball escapes and that ring shatters. Twelve escapes, faster
// each time, then the ball flies free.
const N = 12;
const R0 = 70;
const DR = 36;
const GAP = 0.62; // gap width in radians
const BALL = 13;
const escAt = (k: number) => 0.7 + k * 0.62 - k * k * 0.008;

type Seg = { t0: number; t1: number; a: [number, number]; b: [number, number] };

// Precompute the ball path: inside ring k it bounces twice, then exits at
// angle e_k through the gap (the ring's spin phase is solved to line up).
const PATH: Seg[] = [];
const EXIT: number[] = [];
(() => {
  let pos: [number, number] = [0, 0];
  let tPrev = 0.15;
  for (let k = 0; k < N; k++) {
    const r = R0 + k * DR - BALL - 3;
    const tE = escAt(k);
    const pts: [number, number][] = [];
    for (let j = 0; j < 2; j++) {
      const a = hash(k, j, 3) * Math.PI * 2;
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    const e = hash(k, 9) * Math.PI * 2;
    EXIT.push(e);
    pts.push([Math.cos(e) * (r + 2 * BALL + 6), Math.sin(e) * (r + 2 * BALL + 6)]);
    const span = (tE - tPrev) / pts.length;
    pts.forEach((p, j) => {
      PATH.push({ t0: tPrev + j * span, t1: tPrev + (j + 1) * span, a: pos, b: p });
      pos = p;
    });
    tPrev = tE;
  }
  // final flight outward
  const e = EXIT[N - 1];
  PATH.push({ t0: tPrev, t1: tPrev + 0.8, a: pos, b: [Math.cos(e) * 1400, Math.sin(e) * 1400] });
})();

function ballAt(t: number): [number, number] {
  if (t <= PATH[0].t0) return [0, 0];
  for (const s of PATH) if (t <= s.t1) {
    const k = (t - s.t0) / (s.t1 - s.t0);
    return [lerp(s.a[0], s.b[0], k), lerp(s.a[1], s.b[1], k)];
  }
  const last = PATH[PATH.length - 1];
  return last.b;
}

export default function RingEscape({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const CX = 960;
  const CY = 540;
  const escaped = Array.from({ length: N }, (_, k) => t >= escAt(k)).filter(Boolean).length;
  const [bx, by] = ballAt(t);
  const bounce = PATH.reduce((m, s) => Math.max(m, Math.exp(-Math.pow((t - s.t1) / 0.05, 2))), 0);
  const endP = c01((t - (escAt(N - 1) + 0.9)) / 0.6);
  const colors = Array.from({ length: N }, (_, k) => mix(pal.p, pal.a, k / (N - 1)));

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        <g transform={`translate(${CX} ${CY})`} opacity={1 - c01(endP * 3)}>
          {Array.from({ length: N }).map((_, k) => {
            const r = R0 + k * DR;
            const tE = escAt(k);
            const w = (k % 2 ? -1 : 1) * (1.1 + k * 0.06);
            // phase chosen so the gap centre sits on the exit angle at tE
            const phase = EXIT[k] - w * tE;
            const gc = phase + w * t;
            if (t >= tE) {
              // shatter: arcs fly out and fade
              const k2 = c01((t - tE) / 0.7);
              if (k2 >= 1) return null;
              return (
                <g key={k} opacity={1 - k2}>
                  {Array.from({ length: 8 }).map((__, j) => {
                    const a0 = gc + GAP / 2 + (j * (Math.PI * 2 - GAP)) / 8;
                    const a1 = a0 + (Math.PI * 2 - GAP) / 8 - 0.05;
                    const push = expOut(k2) * (60 + hash(k, j) * 80);
                    const am = (a0 + a1) / 2;
                    const ox = Math.cos(am) * push;
                    const oy = Math.sin(am) * push + k2 * k2 * 200;
                    return <path key={j} d={`M${Math.cos(a0) * r + ox},${Math.sin(a0) * r + oy} A${r},${r} 0 0 1 ${Math.cos(a1) * r + ox},${Math.sin(a1) * r + oy}`} fill="none" stroke={colors[k]} strokeWidth={8} strokeLinecap="round" />;
                  })}
                </g>
              );
            }
            const a0 = gc + GAP / 2;
            const a1 = gc - GAP / 2 + Math.PI * 2;
            return <path key={k} d={`M${Math.cos(a0) * r},${Math.sin(a0) * r} A${r},${r} 0 1 1 ${Math.cos(a1) * r},${Math.sin(a1) * r}`} fill="none" stroke={colors[k]} strokeWidth={8} strokeLinecap="round" />;
          })}
          {/* trail */}
          {Array.from({ length: 10 }).map((_, j) => {
            const [x, y] = ballAt(t - (j + 1) * 0.012);
            return <circle key={j} cx={x} cy={y} r={BALL * (1 - j / 12)} fill={pal.fg} opacity={0.25 * (1 - j / 10)} />;
          })}
          <circle cx={bx} cy={by} r={BALL * (1 + bounce * 0.3)} fill={pal.fg} />
        </g>
        <text x={120} y={150} fontFamily={ff} fontSize={72} fontWeight={900} fill={pal.fg} opacity={1 - endP}>
          {N - escaped}
        </text>
        <text x={120} y={196} fontFamily={ff} fontSize={26} fill={pal.muted} opacity={1 - endP}>
          rings left
        </text>
        {endP > 0 && (
          <>
            <Txt text={c.caption || "Nothing can hold it"} x={960} y={520} size={fit(c.caption || "Nothing can hold it", 1500, 140, 900)} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
            <Txt text={name} x={960} y={630} size={50} weight={700} color={pal.p} font={ff} p={c01((t - escAt(N - 1) - 1.3) / 0.5)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/ring-escape.wav" on={audio} />
    </AbsoluteFill>
  );
}
