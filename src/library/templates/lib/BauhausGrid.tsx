import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Mark, Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, hash, lerp, mix, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { role: string };

// A geometric tile wall: quarter circles, half discs, triangles and rings on
// an 8×4 grid turn 90° on every beat in a new pattern (diagonal wave,
// checkerboard, rows, scatter) and swap colours each bar, then the wall
// drains toward the centre and leaves your mark and name.
const COLS = 8;
const ROWS = 4;
const TILE = 190;
const BEAT = 0.5;
const BEATS = Array.from({ length: 14 }, (_, k) => 0.9 + k * BEAT);

function shapePath(kind: number) {
  switch (kind) {
    case 0:
      return "M0,0 L100,0 A100,100 0 0 1 0,100 Z";
    case 1:
      return "M0,100 A50,50 0 0 1 100,100 Z";
    case 2:
      return "M0,0 L100,0 L0,100 Z";
    case 3:
      return "M50,12 A38,38 0 1 1 49.9,12 Z";
    case 4:
      return "M0,100 A100,100 0 0 1 100,0 A100,100 0 0 1 0,100 Z";
    case 5:
      return "M0,0 L50,0 L50,100 L0,100 Z";
    default:
      return "M22,22 L78,22 L78,78 L22,78 Z";
  }
}

function selected(k: number, i: number, j: number) {
  switch (k % 4) {
    case 0:
      return true;
    case 1:
      return (i + j) % 2 === 0;
    case 2:
      return j % 2 === k % 3 % 2;
    default:
      return hash(i, j, k) > 0.5;
  }
}

export default function BauhausGrid({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const colors = [pal.p, pal.a, pal.fg, pal.card2];
  const x0 = 960 - (COLS * TILE) / 2;
  const y0 = 540 - (ROWS * TILE) / 2;

  const markIn = spring(t - 8.0, 16, 0.7);
  const lock = expInOut(seg(t, 8.6, 0.5));
  const nameW = Math.min(980, name.length * 110);
  const markX = lerp(960, 960 - nameW / 2 - 40, lock);
  const nameP = c01((t - 8.7) / 0.6);
  const roleP = c01((t - 9.1) / 0.6);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}>
      <Svg>
        {Array.from({ length: COLS }).map((_, i) =>
          Array.from({ length: ROWS }).map((__, j) => {
            const appear = expOut(seg(t, 0.05 + (i + j) * 0.05, 0.45));
            const dist = Math.hypot(i - (COLS - 1) / 2, j - (ROWS - 1) / 2);
            const drain = expInOut(seg(t, 7.3 + (4.5 - dist) * 0.09, 0.4));
            const s = appear * (1 - drain);
            if (s <= 0.001) return null;
            let rot = Math.floor(hash(i, j, 7) * 4) * 90;
            let ci = Math.floor(hash(i, j, 3) * 4);
            let prev = ci;
            let swapAt = -9;
            BEATS.forEach((tk, k) => {
              if (!selected(k, i, j)) return;
              const delay = k % 4 === 0 ? (i + j) * 0.035 : 0;
              rot += 90 * spring(t - tk - delay, 18, 0.72);
              if (k % 4 === 0 && t >= tk && hash(i, j, k, 11) > 0.45) {
                prev = ci;
                ci = (ci + 1 + Math.floor(hash(i, j, k) * 2)) % 4;
                swapAt = tk + delay;
              }
            });
            const fadeIn = c01((t - swapAt) / 0.18);
            const bg = mix(colors[(prev + 2) % 4], colors[(ci + 2) % 4], fadeIn);
            const fg = mix(colors[prev], colors[ci], fadeIn);
            const kind = Math.floor(hash(i, j, 5) * 7);
            const cx = x0 + i * TILE + TILE / 2;
            const cy = y0 + j * TILE + TILE / 2;
            return (
              <g key={`${i}-${j}`} transform={`translate(${cx} ${cy}) scale(${s}) rotate(${rot})`}>
                <rect x={-TILE / 2} y={-TILE / 2} width={TILE} height={TILE} fill={bg} />
                <path d={shapePath(kind)} transform={`translate(${-TILE / 2} ${-TILE / 2}) scale(${TILE / 100})`} fill={fg} />
              </g>
            );
          }),
        )}
      </Svg>
      {markIn > 0.01 && <Mark x={markX} y={540} size={190} b={b} pal={pal} s={markIn} rot={(1 - markIn) * -90} />}
      <Svg>
        {nameP > 0 && <Txt text={name} x={markX + 135} y={575} size={fit(name, nameW + 200, 140, 800)} weight={800} color={pal.fg} font={ff} p={nameP} anchor="start" tracking={-0.04} />}
        {roleP > 0 && <Txt text={c.role || "Shape, colour, rhythm"} x={960} y={760} size={40} weight={500} color={pal.muted} font={ff} p={roleP} mode="fade" />}
      </Svg>
      <Track src="tracks/bauhaus-grid.wav" on={audio} />
    </AbsoluteFill>
  );
}
