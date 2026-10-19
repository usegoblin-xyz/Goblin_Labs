import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Mark, Svg, Track, Txt, c01, expInOut, fit, fontOf, lerp, nameOf, onColor, palette, seg, spring, useT } from "../../motion";

type C = { words: string; role: string };

// A folded card drops in and opens like a map, panel by panel, each panel a
// word and a shape. While it lies flat the panels flip their faces on the
// beat in a travelling wave, then the whole thing folds back up and the last
// panel turns into your mark beside your name.
const PW = 300;
const PH = 520;
const N = 5;

export default function FoldReel({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const words = [...list(c.words || "Fold, Turn, Flip, Open, Play"), "Move", "Move", "Move", "Move", "Move"].slice(0, N);

  const drop = spring(t - 0.05, 14, 0.8);
  const open = expInOut(seg(t, 0.55, 1.6));
  const close = expInOut(seg(t, 6.5, 1.3));
  const f = open * (1 - close);
  const theta = 178 * (1 - f);
  const cos = Math.cos((theta * Math.PI) / 180);
  const span = PW * (3 + 2 * cos);
  const toMark = expInOut(seg(t, 7.9, 0.45));
  const lock = expInOut(seg(t, 8.5, 0.5));
  const nameW = Math.min(960, name.length * 105);
  const markX = lerp(960, 960 - nameW / 2 - 40, lock);
  const nameP = c01((t - 8.6) / 0.6);
  const roleP = c01((t - 9.0) / 0.6);

  // Face flips while flat: beat k flips panel k % N.
  const flips = (i: number) => {
    let n = 0;
    for (let k = 0; k < 8; k++) if (k % N === i || (k >= 5 && (k + i) % 2 === 0)) n += expInOut(seg(t, 2.6 + k * 0.45 + (k >= 5 ? i * 0.05 : 0), 0.32));
    return n;
  };
  const shapes = ["circle", "tri", "square", "ring", "half"];

  const face = (i: number) => {
    const fl = flips(i);
    const whole = Math.floor(fl);
    const frac = fl - whole;
    const scaleY = Math.abs(Math.cos(frac * Math.PI));
    const side = (whole + (frac > 0.5 ? 1 : 0)) % 2;
    const bg = side ? pal.p : i % 2 ? pal.card2 : pal.card;
    const fg = side ? onColor(pal.p) : pal.fg;
    const shade = (1 - cos) * 0.22 * (i % 2 ? 1 : 0.6);
    const size = fit(words[i], PW - 50, 96, 800);
    return (
      <div style={{ position: "absolute", inset: 0, background: bg, backfaceVisibility: "hidden", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, transform: `scaleY(${scaleY})` }}>
          <Svg w={PW} h={PH}>
            <ShapeMark kind={shapes[(i + whole) % shapes.length]} x={PW / 2} y={170} color={side ? fg : pal.a} />
            <Txt text={words[i]} x={PW / 2} y={400} size={size} weight={800} color={fg} font={ff} tracking={-0.04} />
          </Svg>
        </div>
        <div style={{ position: "absolute", inset: 0, background: "#000", opacity: shade }} />
      </div>
    );
  };

  // Nested accordion: each panel hangs off the right edge of the previous one.
  const panel = (i: number): ReactNode => {
    if (i >= N) return null;
    const ang = i === 0 ? 0 : (i % 2 ? 1 : -1) * theta;
    return (
      <div style={{ position: "absolute", left: i === 0 ? 0 : PW, top: 0, width: PW, height: PH, transformStyle: "preserve-3d", transformOrigin: "0 50%", transform: `rotateY(${ang}deg)` }}>
        {face(i)}
        <div style={{ position: "absolute", inset: 0, background: pal.card2, transform: "rotateY(180deg)", backfaceVisibility: "hidden" }} />
        {panel(i + 1)}
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      {toMark < 1 && (
        <div style={{ position: "absolute", inset: 0, perspective: 2400 }}>
          <div
            style={{
              position: "absolute",
              left: 960 - span / 2,
              top: 540 - PH / 2,
              width: PW,
              height: PH,
              transformStyle: "preserve-3d",
              transform: `translateY(${(1 - drop) * -700}px) rotateX(${(1 - f) * 8}deg) scale(${lerp(1, 0.4, toMark)}) rotateY(${toMark * 90}deg)`,
              transformOrigin: `${span / 2}px 50%`,
            }}
          >
            {panel(0)}
          </div>
        </div>
      )}
      {toMark >= 0.5 && <Mark x={markX} y={540} size={190} b={b} pal={pal} s={c01((toMark - 0.5) * 2)} />}
      <Svg>
        {nameP > 0 && <Txt text={name} x={markX + 135} y={578} size={fit(name, nameW + 200, 140, 800)} weight={800} color={pal.fg} font={ff} p={nameP} anchor="start" tracking={-0.04} />}
        {roleP > 0 && <Txt text={c.role || "Paper, folded in motion"} x={960} y={760} size={40} weight={500} color={pal.muted} font={ff} p={roleP} mode="fade" />}
      </Svg>
      <Track src="tracks/fold-reel.wav" on={audio} />
    </AbsoluteFill>
  );
}

function ShapeMark({ kind, x, y, color }: { kind: string; x: number; y: number; color: string }) {
  const s = 120;
  if (kind === "circle") return <circle cx={x} cy={y} r={s / 2} fill={color} />;
  if (kind === "ring") return <circle cx={x} cy={y} r={s / 2 - 12} fill="none" stroke={color} strokeWidth={24} />;
  if (kind === "square") return <rect x={x - s / 2} y={y - s / 2} width={s} height={s} rx={14} fill={color} />;
  if (kind === "half") return <path d={`M${x - s / 2},${y + s / 4} A${s / 2},${s / 2} 0 0 1 ${x + s / 2},${y + s / 4} Z`} fill={color} />;
  return <path d={`M${x},${y - s / 2} L${x + s / 2},${y + s / 2.4} L${x - s / 2},${y + s / 2.4} Z`} fill={color} />;
}

