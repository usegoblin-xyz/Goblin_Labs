import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, lerp, nameOf, palette, seg, useT } from "../../motion";

type C = { words: string; role: string };

// A one-line showreel: a single continuous stroke never lifts off the page.
// It draws a circle, unwinds into a wave, folds into a square, loops into a
// star and finally straightens into an underline beneath the name. The pen
// tip glows and each shape gets a small caption.
const N = 240;
function shape(k: number, i: number): [number, number] {
  const u = i / (N - 1);
  const a = u * Math.PI * 2;
  switch (k) {
    case 0:
      return [960 + Math.cos(a - Math.PI / 2) * 280, 520 + Math.sin(a - Math.PI / 2) * 280];
    case 1:
      return [260 + u * 1400, 520 + Math.sin(u * Math.PI * 6) * 180];
    case 2: {
      const s = u * 4;
      const e = Math.floor(s) % 4;
      const f = s - Math.floor(s);
      const P = [
        [700, 260],
        [1220, 260],
        [1220, 780],
        [700, 780],
        [700, 260],
      ];
      return [lerp(P[e][0], P[e + 1][0], f), lerp(P[e][1], P[e + 1][1], f)];
    }
    case 3: {
      const r = 300 * (0.55 + 0.45 * Math.cos(5 * a));
      return [960 + Math.cos(a - Math.PI / 2) * r, 520 + Math.sin(a - Math.PI / 2) * r];
    }
    default:
      return [560 + u * 800, 660];
  }
}

export default function OneLineReel({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const words = [...list(c.words || "Circle, Wave, Square, Star"), "Shape", "Shape", "Shape", "Shape"].slice(0, 4);
  const draw = cubicInOut(c01((t - 0.3) / 1.2));
  const per = 1.7;
  const morphAt = (k: number) => 1.6 + k * per;
  // current shape blend
  let k = 0;
  let m = 0;
  for (let i = 0; i < 4; i++) {
    const p = cubicInOut(c01((t - morphAt(i)) / 0.8));
    if (p > 0) {
      k = i;
      m = p;
    }
  }
  const pts = Array.from({ length: N }, (_, i) => {
    const [x0, y0] = shape(k, i);
    const [x1, y1] = shape(k + 1, i);
    return [lerp(x0, x1, m), lerp(y0, y1, m)] as const;
  });
  const vis = Math.max(2, Math.floor(draw * N));
  const d = pts.slice(0, vis).map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const tip = pts[vis - 1];
  const capIdx = m > 0.5 ? k + 1 : k;
  const outro = expInOut(seg(t, 9.0, 0.5));
  const nameP = c01((t - morphAt(3) - 0.6) / 0.6);

  return (
    <AbsoluteFill style={{ background: pal.dark ? "#0c0c0e" : "#faf8f3", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          <path d={d} fill="none" stroke={pal.fg} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={tip[0]} cy={tip[1]} r={22} fill={pal.v} opacity={0.35} />
          <circle cx={tip[0]} cy={tip[1]} r={10} fill={pal.v} />
          {capIdx < 4 && t > 0.8 && <Txt key={capIdx} text={words[capIdx]} x={960} y={960} size={44} weight={700} color={pal.muted} font={ff} p={c01((t - (capIdx ? morphAt(capIdx - 1) + 0.4 : 0.8)) / 0.4)} mode="fade" tracking={0.12} />}
          {nameP > 0 && (
            <>
              <Txt text={nameOf(b)} x={960} y={600} size={170} weight={900} color={pal.fg} font={ff} p={nameP} tracking={-0.04} />
              <Txt text={c.role || "One line at a time"} x={960} y={760} size={44} weight={600} color={pal.v} font={ff} p={c01((t - morphAt(3) - 1.0) / 0.6)} mode="fade" />
            </>
          )}
        </Svg>
      </div>
      <Track src="tracks/one-line-reel.wav" on={audio} />
    </AbsoluteFill>
  );
}
