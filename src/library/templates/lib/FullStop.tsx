import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Txt, Track, txtW, c01, cubicInOut, expInOut, expOut, fontOf, hash, lerp, palette, seg, useT } from "../../motion";

type C = { sentence: string; end: string };

// A sentence ends, and its full stop refuses to: the period becomes a run of
// figures (ring, square, triangle, star, swarm), each made of the same 60
// points, before folding back into a period after a new final word.
const N = 60;
type Pt = [number, number];
function ring(r: number): Pt[] {
  return Array.from({ length: N }, (_, i) => [Math.cos((i / N) * Math.PI * 2) * r, Math.sin((i / N) * Math.PI * 2) * r]);
}
function poly(k: number, r: number, rot = -Math.PI / 2): Pt[] {
  return Array.from({ length: N }, (_, i) => {
    const u = (i / N) * k;
    const s = Math.floor(u);
    const f = u - s;
    const a0 = rot + (s / k) * Math.PI * 2;
    const a1 = rot + ((s + 1) / k) * Math.PI * 2;
    return [lerp(Math.cos(a0), Math.cos(a1), f) * r, lerp(Math.sin(a0), Math.sin(a1), f) * r] as Pt;
  });
}
function star(r: number): Pt[] {
  return Array.from({ length: N }, (_, i) => {
    const u = (i / N) * 10;
    const s = Math.floor(u);
    const f = u - s;
    const R = (k: number) => (k % 2 ? r * 0.42 : r);
    const a = (k: number) => -Math.PI / 2 + (k / 10) * Math.PI * 2;
    return [lerp(Math.cos(a(s)) * R(s), Math.cos(a(s + 1)) * R(s + 1), f), lerp(Math.sin(a(s)) * R(s), Math.sin(a(s + 1)) * R(s + 1), f)] as Pt;
  });
}
function swarm(r: number, t: number): Pt[] {
  return Array.from({ length: N }, (_, i) => {
    const a = hash(i, 1) * Math.PI * 2 + t * (0.6 + hash(i, 2));
    const d = r * (0.3 + hash(i, 3) * 0.9);
    return [Math.cos(a) * d * 1.6, Math.sin(a) * d];
  });
}
const dotPts = (): Pt[] => Array.from({ length: N }, () => [0, 0]);

export default function FullStop({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const sentence = c.sentence || "Every story needs an ending";
  const end = c.end || "Or does it";
  const size = 120;

  // keyframes of figures (time, points, scale of dots)
  const figs: [number, Pt[], number][] = [
    [1.6, dotPts(), 26],
    [2.6, ring(220), 9],
    [3.9, poly(4, 260, Math.PI / 4), 9],
    [5.2, poly(3, 270), 9],
    [6.5, star(300), 8],
    [7.9, swarm(320, t), 6],
    [9.4, ring(140), 10],
    [10.6, dotPts(), 26],
  ];
  let pts: Pt[] = figs[0][1];
  let r = figs[0][2];
  for (let i = 0; i < figs.length - 1; i++) {
    const [t0, A, ra] = figs[i];
    const [t1, Bp, rb] = figs[i + 1];
    if (t >= t0 && t < t1) {
      const p = expInOut(c01((t - t0 - (t1 - t0) * 0.45) / ((t1 - t0) * 0.55)));
      pts = A.map((a, k) => {
        const d = hash(k, i) * 0.25;
        const q = c01((p - d) / (1 - d));
        return [lerp(a[0], Bp[k][0], q), lerp(a[1], Bp[k][1], q)] as Pt;
      });
      r = lerp(ra, rb, p);
    }
    if (t >= t1) {
      pts = Bp;
      r = rb;
    }
  }
  const spin = t * 18;
  const textOut = expOut(seg(t, 1.6, 0.6));
  // where the dot lives: after the sentence at first, centre stage during the figures, after the new word at the end
  const sxs = txtW(sentence, size, 700, -0.02, ff);
  const startX = 960 + sxs / 2 + 22;
  const endX = 960 - 20 + txtW(end, size, 700, -0.02, ff) / 2 + 22;
  const center = t < 1.6 ? { x: startX, y: 615 } : t < 2.6 ? { x: lerp(startX, 960, cubicInOut(seg(t, 1.6, 1.0))), y: lerp(615, 520, cubicInOut(seg(t, 1.6, 1.0))) } : t < 10.6 ? { x: 960, y: 520 } : { x: lerp(960, endX, cubicInOut(seg(t, 10.6, 0.8))), y: lerp(520, 615, cubicInOut(seg(t, 10.6, 0.8))) };
  const endIn = c01((t - 10.9) / 0.9);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}>
      <Svg>
        <g opacity={1 - textOut}>
          <Txt text={sentence} x={960} y={630} size={size} weight={700} color={pal.fg} font={ff} p={c01((t - 0.1) / 1.0)} mode="rise" stagger={0.03} />
        </g>
        {t > 10.6 && <Txt text={end} x={960 - 20} y={630} size={size} weight={700} color={pal.fg} font={ff} p={endIn} mode="rise" stagger={0.06} />}
        <g transform={`translate(${center.x} ${center.y}) rotate(${t > 2.6 && t < 10.6 ? spin : 0})`}>
          {t > 2.4 && t < 10.8 && (
            <path d={"M" + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" L") + " Z"} fill="none" stroke={pal.line} strokeWidth={2} />
          )}
          {pts.map((p, k) => (
            <circle key={k} cx={p[0]} cy={p[1]} r={t < 1.6 || t >= 10.6 ? (k === 0 ? r * 0.55 : 0) : r} fill={k % 7 === 0 ? pal.v : pal.fg} opacity={t < 1.6 ? c01((t - 0.9) / 0.3) : 1} />
          ))}
        </g>
      </Svg>
      <Track src="tracks/full-stop.wav" on={audio} />
    </AbsoluteFill>
  );
}
