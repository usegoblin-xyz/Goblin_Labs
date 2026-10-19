import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Mark, Svg, Track, Txt, c01, expOut, fontOf, lerp, mix, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { tagline: string };

// A ball drops onto an isometric staircase and lands on every beat (120 BPM),
// lighting each block it touches; one block is a trapdoor gag, and the last
// leap lands on the brand mark.
const BEAT = 0.5;
const N = 9;
const T0 = 1.0; // first landing
const ISO = 64; // half-width of a block's top face

function blockPos(i: number) {
  return { x: 330 + i * 150, y: 300 + i * 66 };
}

export default function BeatBounce({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const markX = 1580;
  const markY = 880;
  const lastLand = T0 + (N - 1) * BEAT;
  const leapEnd = lastLand + 1.0;

  // ball position: drop, then hops block to block, then a big leap onto the mark
  let bx = blockPos(0).x;
  let by = -120;
  let squash = 0;
  if (t < T0) {
    const u = c01((t - 0.2) / (T0 - 0.2));
    by = lerp(-120, blockPos(0).y - 34, u * u);
  } else if (t < lastLand) {
    const k = Math.floor((t - T0) / BEAT);
    const u = (t - T0 - k * BEAT) / BEAT;
    const A = blockPos(k);
    const B = blockPos(k + 1);
    const hop = k === 4 ? 260 : 150; // one oversized bounce
    bx = lerp(A.x, B.x, u);
    by = lerp(A.y, B.y, u) - 34 - hop * 4 * u * (1 - u);
    squash = Math.max(0, 1 - u / 0.12) + Math.max(0, (u - 0.9) / 0.1);
  } else if (t < leapEnd) {
    const u = (t - lastLand) / (leapEnd - lastLand);
    const A = blockPos(N - 1);
    bx = lerp(A.x, markX, u);
    by = lerp(A.y - 34, markY - 150, u) - 380 * 4 * u * (1 - u);
    squash = Math.max(0, 1 - u / 0.1);
  } else {
    bx = markX;
    by = markY - 150 + 14 * Math.sin((t - leapEnd) * 10) * Math.exp(-(t - leapEnd) * 5);
    squash = Math.max(0, 1 - (t - leapEnd) / 0.15);
  }
  const ballR = 34;
  const markPop = spring(t - leapEnd + 0.02, 14, 0.45);
  const endP = c01((t - leapEnd - 0.3) / 0.8);
  const lift = expOut(seg(t, leapEnd + 0.2, 0.8));

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${-lift * 520}px, ${-lift * 380}px) scale(${1 + lift * 0.4})`, transformOrigin: `${markX}px ${markY}px` }}>
        <Svg>
          {Array.from({ length: N }, (_, i) => {
            const { x, y } = blockPos(i);
            const land = T0 + i * BEAT;
            const lit = t >= land;
            const hit = lit ? Math.exp(-(t - land) * 7) : 0;
            const pulse = lit ? 0.12 * Math.max(0, Math.cos(((t - land) / BEAT) * Math.PI * 2)) * 0 : 0;
            const appear = spring(t - i * 0.05, 16, 0.7);
            const top = lit ? mix(pal.v, "#ffffff", hit * 0.4 + pulse) : pal.card2;
            const left = lit ? mix(pal.v, "#000000", 0.35) : pal.card;
            const right = lit ? mix(pal.v, "#000000", 0.55) : mix(pal.card, "#000000", 0.2);
            const dy = hit * 14 + (1 - appear) * 300;
            const H = 90;
            return (
              <g key={i} transform={`translate(0 ${dy})`} opacity={c01(appear * 2)}>
                <path d={`M${x - ISO},${y} L${x},${y + ISO / 2} L${x},${y + ISO / 2 + H} L${x - ISO},${y + H} Z`} fill={left} />
                <path d={`M${x + ISO},${y} L${x},${y + ISO / 2} L${x},${y + ISO / 2 + H} L${x + ISO},${y + H} Z`} fill={right} />
                <path d={`M${x},${y - ISO / 2} L${x + ISO},${y} L${x},${y + ISO / 2} L${x - ISO},${y} Z`} fill={top} />
              </g>
            );
          })}
          {/* shadow and ball */}
          <ellipse cx={bx} cy={t < leapEnd ? blockPos(Math.min(N - 1, Math.max(0, Math.round((t - T0) / BEAT)))).y : markY - 116} rx={30} ry={10} fill="#000" opacity={0.18} />
          <ellipse cx={bx} cy={by + squash * 10} rx={ballR * (1 + squash * 0.3)} ry={ballR * (1 - squash * 0.3)} fill={pal.fg} />
          <ellipse cx={bx - 10} cy={by - 12 + squash * 10} rx={9} ry={6} fill={pal.bg} opacity={0.35} />
        </Svg>
        <Mark x={markX} y={markY} size={200} b={b} pal={pal} s={t < leapEnd - 0.4 ? spring(t - (leapEnd - 1.2), 14, 0.7) : 1 + 0.18 * (1 - c01(markPop)) * Math.sign(t - leapEnd)} />
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={860} size={140} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Right on the beat."} x={960} y={950} size={44} weight={500} color={pal.muted} font={ff} p={c01((t - leapEnd - 0.6) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/beat-bounce.wav" on={audio} />
    </AbsoluteFill>
  );
}
