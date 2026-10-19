import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, hash, kf, nameOf, palette, seg, useT } from "../../motion";

type C = { labels: string; role: string };

// A split-screen motion reel: the frame divides into 2, then 4, then 6
// panels along animated gutters; every panel plays its own loop (bouncing
// ball, spinning squares, wave bars, orbiting dots, a typing word, a pulsing
// ring), all locked to one beat; then the gutters close back to one frame.
export default function SplitPanels({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const labels = [...list(c.labels || "Bounce, Spin, Wave, Orbit, Type, Pulse"), "Loop", "Loop", "Loop", "Loop", "Loop", "Loop"].slice(0, 6);
  const beat = 0.5;
  const ph = (t % beat) / beat;
  const G = 14;
  // column split x positions (fractions) and row split
  const xs = [kf(t, [[0.6, 1], [1.2, 0.5], [6.4, 0.5], [7.0, 1]], cubicInOut), kf(t, [[3.6, 1], [4.2, 0.6667], [6.4, 0.6667], [7.0, 1]], cubicInOut)];
  const x1 = Math.min(xs[0], 1);
  const x0 = kf(t, [[3.6, 0.5], [4.2, 0.3333], [6.4, 0.3333], [7.0, 0.5]], cubicInOut);
  const yS = kf(t, [[2.0, 1], [2.6, 0.5], [6.4, 0.5], [7.0, 1]], cubicInOut);
  const cols = t < 3.6 ? [0, x1, 1] : [0, x0, xs[1], 1];
  const rows = [0, yS, 1];
  const panels: [number, number, number, number][] = [];
  for (let r = 0; r < 2; r++)
    for (let q = 0; q < cols.length - 1; q++) {
      const a = cols[q];
      const bb = cols[q + 1];
      const y0 = rows[r];
      const y1 = rows[r + 1];
      if (bb - a < 0.001 || y1 - y0 < 0.001) continue;
      panels.push([a * 1920, y0 * 1080, (bb - a) * 1920, (y1 - y0) * 1080]);
    }
  const bgs = [pal.v, pal.card, pal.a, pal.fg, pal.card2, pal.bg];
  const fgs = [pal.onV, pal.fg, pal.onA, pal.bg, pal.fg, pal.v];
  const outro = expInOut(seg(t, 7.6, 0.5));
  const endP = c01((t - 7.9) / 0.8);
  const loop = (i: number, w: number, h: number, fg: string) => {
    const cx = w / 2;
    const cy = h / 2;
    const s = Math.min(w, h);
    switch (i % 6) {
      case 0: {
        const y = cy + s * 0.25 - Math.abs(Math.sin(ph * Math.PI)) * s * 0.45;
        return <ellipse cx={cx} cy={y} rx={s * 0.08 * (ph < 0.08 || ph > 0.92 ? 1.25 : 1)} ry={s * 0.08 * (ph < 0.08 || ph > 0.92 ? 0.8 : 1)} fill={fg} />;
      }
      case 1:
        return (
          <g transform={`translate(${cx} ${cy}) rotate(${cubicInOut(ph) * 90 + Math.floor(t / beat) * 90})`}>
            <rect x={-s * 0.15} y={-s * 0.15} width={s * 0.3} height={s * 0.3} fill={fg} />
          </g>
        );
      case 2:
        return (
          <g>
            {Array.from({ length: 9 }, (_, j) => {
              const hh = s * (0.1 + 0.4 * Math.abs(Math.sin(t * 6 + j * 0.6)));
              return <rect key={j} x={cx - s * 0.36 + j * s * 0.09} y={cy - hh / 2} width={s * 0.06} height={hh} rx={s * 0.03} fill={fg} />;
            })}
          </g>
        );
      case 3:
        return (
          <g>
            {Array.from({ length: 6 }, (_, j) => {
              const a = (j / 6) * Math.PI * 2 + t * 2.5;
              return <circle key={j} cx={cx + Math.cos(a) * s * 0.25} cy={cy + Math.sin(a) * s * 0.25} r={s * 0.04} fill={fg} />;
            })}
          </g>
        );
      case 4: {
        const word = "LOOP";
        const n = Math.floor(((t * 4) % 6));
        return (
          <text x={cx} y={cy + s * 0.08} textAnchor="middle" fontFamily={ff} fontSize={s * 0.25} fontWeight={900} fill={fg}>
            {word.slice(0, Math.min(4, n))}
          </text>
        );
      }
      default:
        return (
          <g>
            <circle cx={cx} cy={cy} r={s * (0.1 + ph * 0.3)} fill="none" stroke={fg} strokeWidth={s * 0.03} opacity={1 - ph} />
            <circle cx={cx} cy={cy} r={s * 0.08} fill={fg} />
          </g>
        );
    }
  };

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {panels.map(([x, y, w, h], i) => {
          const idx = panels.length === 1 ? 0 : i;
          return (
            <div key={i} style={{ position: "absolute", left: x + (x > 0 ? G / 2 : 0), top: y + (y > 0 ? G / 2 : 0), width: w - (x > 0 ? G / 2 : 0) - (x + w < 1919 ? G / 2 : 0), height: h - (y > 0 ? G / 2 : 0) - (y + h < 1079 ? G / 2 : 0), background: bgs[idx], overflow: "hidden" }}>
              <Svg w={w} h={h}>
                {loop(idx, w, h, fgs[idx])}
              </Svg>
              <div style={{ position: "absolute", left: 24, bottom: 18, fontSize: 24, fontWeight: 700, color: fgs[idx], opacity: 0.7 }}>{labels[idx]}</div>
            </div>
          );
        })}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={540} size={170} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.role || "Loops, on beat"} x={960} y={650} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 8.3) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/split-panels.wav" on={audio} />
    </AbsoluteFill>
  );
}
