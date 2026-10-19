import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, fontOf, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { words: string; tagline: string };

// A 6×4 grid of shapes plays the beat: each bar a new wave pattern runs
// through it (diagonal, ripple from the centre, columns, checkerboard), the
// shapes morph circle → square → diamond per bar, and a word sits on top.
const BEAT = 60 / 124;

export default function RhythmGrid({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const words = [...list(c.words || "FORM, RHYTHM, COLOR, MOTION"), "MOVE"].slice(0, 4);
  const beat = t / BEAT;
  const bar = Math.floor(beat / 4);
  const inBar = beat - bar * 4;
  const endAt = BEAT * 16;
  const endP = c01((t - endAt) / 0.8);
  const COLS = 8;
  const ROWS = 5;
  const cell = 200;
  const ox = 960 - ((COLS - 1) * cell) / 2;
  const oy = 540 - ((ROWS - 1) * cell) / 2;

  const delay = (col: number, row: number) => {
    const p = bar % 4;
    if (p === 0) return (col + row) * 0.12;
    if (p === 1) return Math.hypot(col - (COLS - 1) / 2, row - (ROWS - 1) / 2) * 0.18;
    if (p === 2) return col * 0.1;
    return ((col + row) % 2) * 0.5;
  };
  const morph = expInOut(seg(inBar, 3.4, 0.6)); // shape changes near the end of each bar
  const shapeK = bar % 3;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        {t < endAt + 0.5 &&
          Array.from({ length: COLS * ROWS }, (_, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const ph = ((inBar - delay(col, row)) % 1 + 1) % 1;
            const pulse = Math.exp(-ph * 5);
            const s = 0.35 + pulse * 0.55;
            const x = ox + col * cell;
            const y = oy + row * cell;
            const r = [0.5, 0.12, 0.12][shapeK];
            const nextR = [0.12, 0.12, 0.5][shapeK];
            const rr = r + (nextR - r) * morph;
            const rot = (shapeK === 1 ? morph * 45 : shapeK === 2 ? 45 - morph * 45 : 0) + pulse * 20;
            const size = cell * 0.8 * s;
            const col2 = pulse > 0.6 ? pal.v : (col + row) % 3 === 0 ? pal.a : pal.card2;
            return <rect key={i} x={x - size / 2} y={y - size / 2} width={size} height={size} rx={size * rr} fill={col2} transform={`rotate(${rot} ${x} ${y})`} opacity={1 - c01((t - endAt) * 2)} />;
          })}
        {t < endAt && <Txt key={bar} text={words[bar % 4]} x={960} y={600} size={190} weight={900} color={pal.fg} font={ff} p={c01((inBar) / 0.5)} out={c01((inBar - 3.6) / 0.4)} mode="scale" tracking={-0.04} />}
        {endP > 0 && (
          <>
            <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
            <Txt text={c.tagline || "Designed in rhythm."} x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - endAt - 0.4) / 0.6)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/rhythm-grid.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = spring;
