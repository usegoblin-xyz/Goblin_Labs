import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Mark, Svg, Track, Txt, txtW, c01, expOut, fit, fontOf, hash, lerp, nameOf, palette, spring, useT } from "../../motion";

type C = { lines: string; tagline: string };

// A product intro locked to a 120 BPM track: a field of particles flashes on
// every kick, a beat counter ticks 1-2-3-4, and each line of copy stamps in
// exactly on the downbeat, word by word on the eighths.
const BPM = 120;
const BEAT = 60 / BPM;

export default function BeatSync({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const lines = [...list(c.lines || "Your ideas., On beat., On brand., Every time."), "Line.", "Line.", "Line.", "Line."].slice(0, 4);
  const beat = t / BEAT;
  const bi = Math.floor(beat);
  const phase = beat - bi;
  const kick = Math.exp(-phase * 6);
  const bar = Math.floor(bi / 4);
  const inBar = (bi % 4) + 1;
  const endBar = 4;
  const lineIdx = Math.min(3, bar);
  const words = lines[lineIdx].split(" ");
  const barT = t - bar * 4 * BEAT;
  const endP = c01((t - endBar * 4 * BEAT) / 0.6);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        {/* particle field pulsing with the kick */}
        {Array.from({ length: 180 }, (_, i) => {
          const gx = (i % 18) * 112 + 16;
          const gy = Math.floor(i / 18) * 112 + 36;
          const d = Math.hypot(gx - 960, gy - 540) / 1100;
          const wave = Math.exp(-Math.pow((phase - d * 0.6) * 5, 2));
          const lit = hash(i, bi) > 0.86;
          return <circle key={i} cx={gx} cy={gy} r={3 + wave * 5 + (lit ? kick * 6 : 0)} fill={lit ? pal.v : pal.faint} opacity={0.35 + wave * 0.6} />;
        })}
        {t < endBar * 4 * BEAT &&
          words.map((w, i) => {
            const at = i * BEAT * 0.5;
            const p = c01((barT - at) / 0.12);
            const size = fit(lines[lineIdx], 1500, 190, 900, -0.04, ff);
            const full = txtW(lines[lineIdx], size, 900, -0.04, ff);
            const x = 960 - full / 2 + (i ? txtW(words.slice(0, i).join(" ") + " ", size, 900, -0.04, ff) : 0);
            return <Txt key={`${lineIdx}-${i}`} text={w} x={x} y={560} size={size} weight={900} color={i === words.length - 1 ? pal.v : pal.fg} font={ff} anchor="start" p={p} mode="scale" stagger={0} tracking={-0.04} />;
          })}
        {/* beat counter */}
        {t < endBar * 4 * BEAT &&
          [1, 2, 3, 4].map((n) => (
            <g key={n} transform={`translate(${840 + (n - 1) * 80} 880)`}>
              <circle r={n === inBar ? 22 + kick * 8 : 14} fill={n === inBar ? pal.v : pal.card2} />
              <text y={n === inBar ? 9 : 6} textAnchor="middle" fontFamily={ff} fontSize={n === inBar ? 24 : 16} fontWeight={800} fill={n === inBar ? pal.onV : pal.muted}>
                {n}
              </text>
            </g>
          ))}
        {endP > 0 && (
          <>
            <Txt text={nameOf(b)} x={960} y={620} size={160} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} mode="scale" />
            <Txt text={c.tagline || "Made to the beat."} x={960} y={730} size={48} weight={600} color={pal.v} font={ff} p={c01((t - endBar * 4 * BEAT - 0.4) / 0.5)} mode="fade" />
          </>
        )}
      </Svg>
      {endP > 0 && <Mark x={960} y={360} size={150} b={b} pal={pal} s={spring(t - endBar * 4 * BEAT, 18, 0.5) * (1 + kick * 0.08)} />}
      <Track src="tracks/beat-sync.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = [expOut, lerp];
