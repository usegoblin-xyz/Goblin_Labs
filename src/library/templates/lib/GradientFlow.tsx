import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, fontOf, mix, nameOf, palette, seg, useT } from "../../motion";

type C = { words: string; role: string };

// An abstract flow reel: twenty ribbon bands of brand-tinted colour undulate
// like silk, sampled from layered sine fields; a contour-line overlay drifts
// over them, three words fade through the flow in a thin weight, and the
// ribbons converge to a single line under the name.
export default function GradientFlow({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const words = [...list(c.words || "drift, flow, settle"), "flow", "flow", "flow"].slice(0, 3);
  const converge = expInOut(seg(t, 7.2, 1.2));
  const outro = expInOut(seg(t, 9.6, 0.5));
  const bands = 20;
  const ribbon = (j: number) => {
    const pts: string[] = [];
    const amp = (1 - converge) * (80 + j * 6);
    const base = 140 + j * 42 * (1 - converge) + converge * 700;
    for (let x = -40; x <= 1960; x += 40) {
      const y = base + Math.sin(x * 0.004 + t * 0.9 + j * 0.35) * amp + Math.sin(x * 0.0017 - t * 0.6 + j * 0.2) * amp * 0.8;
      pts.push(`${x},${y.toFixed(1)}`);
    }
    return pts;
  };
  const wordAt = (i: number) => 1.2 + i * 2.0;

  return (
    <AbsoluteFill style={{ background: pal.dark ? "#06060a" : mix(pal.bg, pal.v, 0.04), overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          <defs>
            <filter id="gf-soft">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>
          {Array.from({ length: bands }, (_, j) => {
            const top = ribbon(j);
            const bot = ribbon(j + 1).reverse();
            const col = mix(pal.v, pal.a, j / bands);
            return <polygon key={j} points={[...top, ...bot].join(" ")} fill={col} opacity={0.18 + 0.55 * Math.abs(Math.sin(j * 0.7 + t * 0.4)) * (1 - converge * 0.6)} filter="url(#gf-soft)" />;
          })}
          {Array.from({ length: bands }, (_, j) => (
            <polyline key={`l${j}`} points={ribbon(j).join(" ")} fill="none" stroke={pal.fg} strokeWidth={1.2} opacity={0.18} />
          ))}
          {words.map((w, i) => {
            const p = c01((t - wordAt(i)) / 0.8);
            const out = c01((t - wordAt(i) - 1.4) / 0.6);
            return <Txt key={i} text={w} x={960} y={570} size={170} weight={200} color={pal.fg} font={ff} p={p} out={out} tracking={0.2} mode="blur" />;
          })}
          {converge > 0.6 && (
            <>
              <Txt text={nameOf(b)} x={960} y={600} size={150} weight={700} color={pal.fg} font={ff} p={c01((t - 8.0) / 0.8)} tracking={-0.03} mode="blur" />
              <Txt text={c.role || "Abstract motion"} x={960} y={790} size={40} weight={300} color={pal.muted} font={ff} p={c01((t - 8.5) / 0.6)} tracking={0.2} mode="fade" />
            </>
          )}
        </Svg>
      </div>
      <Track src="tracks/gradient-flow.wav" on={audio} />
    </AbsoluteFill>
  );
}
