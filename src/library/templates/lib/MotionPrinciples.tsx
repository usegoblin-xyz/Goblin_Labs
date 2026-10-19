import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { tagline: string };

// Six animation principles, each demonstrated by the same ball in two
// seconds: squash & stretch, anticipation, slow in & slow out, arcs,
// follow-through, and overlap; with ghost frames showing the spacing.
const NAMES = ["Squash & stretch", "Anticipation", "Slow in, slow out", "Arcs", "Follow-through", "Overlapping action"];
const PER = 1.8;

export default function MotionPrinciples({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const k = Math.min(5, Math.floor(t / PER));
  const u = c01((t - k * PER) / PER);
  const endAt = PER * 6;
  const endP = c01((t - endAt) / 0.8);
  const GY = 760;

  // returns ball state for principle k at local time v in [0, 1]
  const ball = (kk: number, v: number) => {
    let x = 960;
    let y = GY - 60;
    let sx = 1;
    let sy = 1;
    let tail = 0;
    if (kk === 0) {
      const h = Math.abs(Math.sin(v * Math.PI * 2));
      y = GY - 60 - h * 420;
      const contact = 1 - Math.min(1, h * 5);
      sx = 1 + contact * 0.4 - (1 - contact) * h * 0.15 * 0;
      sy = 1 - contact * 0.35 + (h > 0.2 && h < 0.9 ? 0.18 : 0);
      x = lerp(560, 1360, v);
    } else if (kk === 1) {
      const crouch = Math.sin(c01(v / 0.35) * Math.PI) * c01(v / 0.35 < 1 ? 1 : 0);
      const go = cubicInOut(c01((v - 0.35) / 0.4));
      x = lerp(560, 1360, go) - crouch * 60;
      sx = 1 + crouch * 0.25;
      sy = 1 - crouch * 0.2;
    } else if (kk === 2) {
      x = lerp(460, 1460, cubicInOut(v));
    } else if (kk === 3) {
      const a = lerp(Math.PI, 0, cubicInOut(v));
      x = 960 + Math.cos(a) * 460;
      y = GY - 60 - Math.sin(a) * 380;
    } else if (kk === 4) {
      const go = cubicInOut(c01(v / 0.55));
      x = lerp(560, 1260, go);
      tail = Math.sin(c01((v - 0.5) / 0.5) * Math.PI * 3) * Math.exp(-c01((v - 0.5) / 0.5) * 3) * 60 + (1 - go) * 0;
    } else {
      x = lerp(560, 1260, cubicInOut(c01(v / 0.6)));
    }
    return { x, y, sx, sy, tail };
  };

  const ghosts = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85].map((g) => ball(k, g));
  const B = ball(k, u);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        {t < endAt && (
          <>
            <line x1={300} x2={1620} y1={GY} y2={GY} stroke={pal.line} strokeWidth={4} />
            {ghosts.map((g, i) => (
              <circle key={i} cx={g.x} cy={g.y} r={60} fill="none" stroke={pal.faint} strokeWidth={2} strokeDasharray="6 8" opacity={c01((t - k * PER - 0.2) * 3) * 0.7} />
            ))}
            {k === 3 && <path d="M500,700 A460,380 0 0 1 1420,700" fill="none" stroke={pal.v} strokeWidth={3} strokeDasharray="10 12" />}
            {k === 4 && <path d={`M${B.x - 60},${B.y} Q${B.x - 140},${B.y - 40 + B.tail} ${B.x - 220},${B.y - 10 + B.tail * 1.5}`} fill="none" stroke={pal.a} strokeWidth={16} strokeLinecap="round" />}
            {k === 5 &&
              [0, 1, 2].map((j) => {
                const lag = ball(5, c01(u - j * 0.08));
                return <circle key={j} cx={lag.x - j * 10} cy={GY - 60 - j * 130 - 70} r={40 - j * 8} fill={j === 0 ? pal.a : pal.fg} opacity={0.9} />;
              })}
            <ellipse cx={B.x} cy={GY + 4} rx={60 * (1 - (GY - 60 - B.y) / 900)} ry={10} fill="#000" opacity={0.2} />
            <ellipse cx={B.x} cy={B.y + (1 - B.sy) * 60} rx={60 * B.sx} ry={60 * B.sy} fill={pal.v} />
            <text x={300} y={200} fontFamily={MONO} fontSize={32} fill={pal.muted}>
              {String(k + 1).padStart(2, "0")} / 06
            </text>
            <Txt key={k} text={NAMES[k]} x={300} y={300} size={90} weight={800} color={pal.fg} font={ff} anchor="start" p={c01((t - k * PER) / 0.4)} out={c01((t - k * PER - PER + 0.2) / 0.2)} tracking={-0.03} />
          </>
        )}
        {endP > 0 && (
          <>
            <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
            <Txt text={c.tagline || "Motion, by the principles."} x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - endAt - 0.4) / 0.6)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/motion-principles.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = [expInOut, seg, spring];
