import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fontOf, hash, initialOf, lerp, nameOf, palette, seg, useT } from "../../motion";

type C = { tagline: string };

// A slow logo reveal: the mark is cut into a grid of triangular shards that
// start scattered through space, drift and tumble, and only in the last
// seconds lock into place one ring at a time; then the letter is lit.
const GRID = 8;
const M = 520;

export default function ShardReveal({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const cell = M / GRID;
  const x0 = 960 - M / 2;
  const y0 = 500 - M / 2;
  const r = M * 0.24;
  const shards: { pts: [number, number][]; cx: number; cy: number; ring: number; k: number }[] = [];
  for (let gy = 0; gy < GRID; gy++)
    for (let gx = 0; gx < GRID; gx++) {
      const a: [number, number] = [x0 + gx * cell, y0 + gy * cell];
      const bb: [number, number] = [a[0] + cell, a[1]];
      const cc: [number, number] = [a[0] + cell, a[1] + cell];
      const d: [number, number] = [a[0], a[1] + cell];
      const flip = (gx + gy) % 2 === 0;
      const tris: [number, number][][] = flip ? [[a, bb, cc], [a, cc, d]] : [[a, bb, d], [bb, cc, d]];
      tris.forEach((pts, j) => {
        const cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3;
        const cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;
        // skip shards in the rounded corners
        const dx = Math.max(0, Math.abs(cx - 960) - (M / 2 - r));
        const dy = Math.max(0, Math.abs(cy - 500) - (M / 2 - r));
        if (Math.hypot(dx, dy) > r) return;
        const ring = Math.max(Math.abs(gx - 3.5), Math.abs(gy - 3.5));
        shards.push({ pts, cx, cy, ring, k: gy * GRID * 2 + gx * 2 + j });
      });
    }
  const lockStart = 3.6;
  const letter = c01((t - 7.4) / 0.6);
  const endP = c01((t - 8.0) / 0.8);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        <defs>
          <clipPath id="sr-mark">
            <rect x={x0} y={y0} width={M} height={M} rx={r} />
          </clipPath>
        </defs>
        {shards.map((s) => {
          const lockAt = lockStart + (3.5 - s.ring) * 0.0 + s.ring * 0.42 + hash(s.k, 7) * 0.3;
          const lock = cubicInOut(c01((t - lockAt) / 1.4));
          // drifting position far from home
          const ang = hash(s.k, 1) * Math.PI * 2;
          const dist = 500 + hash(s.k, 2) * 900;
          const drift = t * (20 + hash(s.k, 3) * 40);
          const fx = s.cx + Math.cos(ang) * dist + Math.cos(ang + 1.6) * drift;
          const fy = s.cy + Math.sin(ang) * dist * 0.6 + Math.sin(ang + 1.6) * drift;
          const spin = (hash(s.k, 4) - 0.5) * 720 + t * (hash(s.k, 5) - 0.5) * 90;
          const x = lerp(fx, s.cx, lock);
          const y = lerp(fy, s.cy, lock);
          const rot = lerp(spin, 0, lock);
          const sc = lerp(0.6 + hash(s.k, 6) * 0.8, 1, lock);
          const d = s.pts.map(([px, py]) => `${(px - s.cx).toFixed(1)},${(py - s.cy).toFixed(1)}`).join(" L");
          return (
            <g key={s.k} transform={`translate(${x} ${y}) rotate(${rot}) scale(${sc})`} opacity={c01(t * 1.2) * lerp(0.55, 1, lock)}>
              <path d={`M${d} Z`} fill={lock > 0.98 ? pal.v : s.k % 3 ? pal.v : pal.a} stroke={pal.bg} strokeWidth={lerp(2, 0.5, lock)} />
            </g>
          );
        })}
        {letter > 0 && (
          <>
            <rect x={x0} y={y0} width={M} height={M} rx={r} fill={pal.v} opacity={letter} />
            <text x={960} y={500 + M * 0.6 * 0.36} textAnchor="middle" fontFamily={ff} fontSize={M * 0.6} fontWeight={800} fill={pal.onV} opacity={letter}>
              {initialOf(b)}
            </text>
          </>
        )}
        {endP > 0 && (
          <>
            <Txt text={nameOf(b)} x={960} y={900} size={110} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
            {c.tagline && <Txt text={c.tagline} x={960} y={980} size={40} weight={500} color={pal.muted} font={ff} p={c01((t - 8.4) / 0.6)} mode="fade" />}
          </>
        )}
      </Svg>
      <Track src="tracks/shard-reveal.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = [expInOut, expOut, seg];
