import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, fit, fontOf, lerp, nameOf, palette, useT, type Pal } from "../../motion";

type C = { words: string; tagline: string };

// An original character dances to 128 BPM: a round-headed figure built from
// capsules hits a new pose on every beat (pose to pose with a quick ease),
// while the beat's word flashes behind it and the floor tiles light up.
const BEAT = 60 / 128;
type Pose = { hip: number; body: number; lA: [number, number]; rA: [number, number]; lL: [number, number]; rL: [number, number]; head: number };
// angles in degrees: [upper, lower] for each limb
const POSES: Pose[] = [
  { hip: 0, body: 0, lA: [200, 30], rA: [-20, -30], lL: [175, 0], rL: [185, 0], head: 0 },
  { hip: -30, body: -8, lA: [230, 60], rA: [-60, -70], lL: [160, 20], rL: [200, -10], head: -10 },
  { hip: 20, body: 10, lA: [150, 100], rA: [20, -100], lL: [190, 30], rL: [150, 40], head: 12 },
  { hip: -10, body: -4, lA: [270, 0], rA: [-90, 0], lL: [170, 0], rL: [190, 0], head: 0 },
  { hip: 40, body: 12, lA: [120, 40], rA: [-120, -60], lL: [200, -40], rL: [130, 90], head: 18 },
  { hip: -40, body: -14, lA: [260, -40], rA: [40, 90], lL: [230, -90], rL: [160, 20], head: -16 },
  { hip: 0, body: 0, lA: [300, 20], rA: [-120, -20], lL: [165, 10], rL: [195, -10], head: 0 },
  { hip: 0, body: -6, lA: [270, -60], rA: [-90, 60], lL: [175, 0], rL: [185, 0], head: -6 },
];

function lerpPose(a: Pose, b: Pose, k: number): Pose {
  const L = (x: [number, number], y: [number, number]): [number, number] => [lerp(x[0], y[0], k), lerp(x[1], y[1], k)];
  return { hip: lerp(a.hip, b.hip, k), body: lerp(a.body, b.body, k), lA: L(a.lA, b.lA), rA: L(a.rA, b.rA), lL: L(a.lL, b.lL), rL: L(a.rL, b.rL), head: lerp(a.head, b.head, k) };
}

function Figure({ x, y, p, pal, s = 1 }: { x: number; y: number; p: Pose; pal: Pal; s?: number }) {
  const limb = (ang: [number, number], len: number, w: number, col: string, off = 180) => (
    <g transform={`rotate(${ang[0] - off})`}>
      <rect x={-w / 2} y={0} width={w} height={len} rx={w / 2} fill={col} />
      <g transform={`translate(0 ${len - w / 3}) rotate(${ang[1]})`}>
        <rect x={-w / 2} y={0} width={w} height={len} rx={w / 2} fill={col} />
      </g>
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={330} rx={150} ry={20} fill="#000" opacity={0.2} />
      <g transform={`translate(${p.hip * 1.2} ${Math.abs(p.hip) * 0.6}) rotate(${p.body})`}>
        <g transform="translate(-30 40)">{limb(p.lL, 150, 50, pal.fg)}</g>
        <g transform="translate(30 40)">{limb(p.rL, 150, 50, pal.fg)}</g>
        <rect x={-70} y={-160} width={140} height={220} rx={60} fill={pal.v} />
        <g transform="translate(-60 -130)">{limb(p.lA, 110, 40, pal.fg)}</g>
        <g transform="translate(60 -130)">{limb(p.rA, 110, 40, pal.fg, 0)}</g>
        <g transform={`translate(0 -230) rotate(${p.head})`}>
          <circle r={70} fill={pal.fg} />
          <rect x={-40} y={-14} width={80} height={24} rx={12} fill={pal.v} />
        </g>
      </g>
    </g>
  );
}

export default function DanceFigure({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const words = [...list(c.words || "MOVE, GROOVE, SPIN, POP, LOCK, DROP, JUMP, BOW"), "MOVE"];
  const beat = Math.max(0, t - 0.5) / BEAT;
  const bi = Math.floor(beat);
  const ph = beat - bi;
  const total = 16;
  const done = bi >= total;
  const A = POSES[bi % POSES.length];
  const B = POSES[(bi + 1) % POSES.length];
  const pose = done ? POSES[7] : lerpPose(A, B, cubicInOut(c01((ph - 0.55) / 0.45)));
  const bounce = Math.abs(Math.sin(ph * Math.PI)) * 22;
  const word = words[bi % words.length].toUpperCase();
  const flash = Math.exp(-ph * 5);
  const endT = 0.5 + total * BEAT;
  const endP = c01((t - endT) / 0.8);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        {/* floor */}
        {Array.from({ length: 7 }, (_, i) => {
          const lit = !done && (i === bi % 7 || i === (bi + 3) % 7);
          return <path key={i} d={`M${200 + i * 220},880 L${420 + i * 220},880 L${480 + i * 240 - 60},1080 L${180 + i * 240 - 60},1080Z`} fill={lit ? pal.v : pal.card} opacity={lit ? 0.4 + flash * 0.6 : 1} />;
        })}
        {!done && <Txt text={word} x={960} y={520} size={fit(word, 1800, 420, 900, -0.04, ff)} weight={900} color={pal.card2} font={ff} p={1} opacity={0.5 + flash * 0.5} tracking={-0.04} />}
        <Figure x={960} y={560 - bounce * (done ? 0 : 1)} p={pose} pal={pal} s={1} />
        {endP > 0 && (
          <>
            <Txt text={nameOf(b)} x={960} y={170} size={130} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
            <Txt text={c.tagline || "Find your rhythm."} x={960} y={250} size={44} weight={500} color={pal.v} font={ff} p={c01((t - endT - 0.4) / 0.6)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/dance-figure.wav" on={audio} />
    </AbsoluteFill>
  );
}
