import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, fontOf, mix, nameOf, palette, seg, useT } from "../../motion";

type C = { line: string };

// A psychedelic hypnotic eye: concentric rings breathe in shifting brand
// hues while a spiral turns behind them; an almond eye slowly opens in the
// centre, its iris a rotating colour spiral, the pupil dilating on the
// beat; the rings tunnel toward camera and the line fades in.
export default function HypnoEye({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const open = expInOut(seg(t, 1.2, 1.4)) * (1 - (t > 3.6 && t < 3.85 ? Math.sin(((t - 3.6) / 0.25) * Math.PI) : 0));
  const beat = Math.pow(Math.max(0, Math.sin(t * Math.PI * 2)), 6);
  const pupil = 40 + beat * 26 + Math.sin(t) * 6;
  const tunnel = (t * 120) % 90;
  const hues = [pal.v, pal.a, "#ff4fd8", "#4ff0ff", "#ffe14f"];
  const outro = expInOut(seg(t, 8.6, 0.5));
  const rings = 22;
  const eyeW = 520;
  const eyeH = 260;
  const eye = `M${960 - eyeW},540 Q960,${540 - eyeH * 1.6} ${960 + eyeW},540 Q960,${540 + eyeH * 1.6} ${960 - eyeW},540 Z`;
  // spiral path
  const spiral = Array.from({ length: 400 }, (_, i) => {
    const a = i * 0.12 + t * 2.4;
    const r = i * 3.2;
    return `${i ? "L" : "M"}${(960 + Math.cos(a) * r).toFixed(1)},${(540 + Math.sin(a) * r).toFixed(1)}`;
  }).join(" ");
  const iris = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2 + t * 1.5;
    return { a, col: hues[i % hues.length] };
  });

  return (
    <AbsoluteFill style={{ background: "#0a0012", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          <defs>
            <clipPath id="he-eye">
              <path d={eye} />
            </clipPath>
          </defs>
          {/* rings tunnel */}
          {Array.from({ length: rings }, (_, i) => {
            const r = i * 90 + tunnel;
            const col = mix(hues[i % hues.length], "#0a0012", 0.2 + 0.2 * Math.sin(t * 2 + i));
            return <circle key={i} cx={960} cy={540} r={r * (1 + beat * 0.04)} fill="none" stroke={col} strokeWidth={22 + Math.sin(t * 3 + i * 0.5) * 10} opacity={0.75} />;
          })}
          <path d={spiral} fill="none" stroke="#0a0012" strokeWidth={30} opacity={0.55} />
          {/* eye: fixed clip shape, opened by scaling the whole eye vertically */}
          <g transform={`translate(0 540) scale(1 ${Math.max(0.001, open)}) translate(0 -540)`}>
          <path d={eye} fill="#f7f0ff" stroke="#0a0012" strokeWidth={16} />
          <g clipPath="url(#he-eye)">
            <circle cx={960} cy={540} r={190} fill={hues[0]} />
            {iris.map(({ a, col }, i) => (
              <path key={i} d={`M960,540 L${960 + Math.cos(a) * 190},${540 + Math.sin(a) * 190} A190,190 0 0 1 ${960 + Math.cos(a + 0.35) * 190},${540 + Math.sin(a + 0.35) * 190} Z`} fill={col} opacity={0.85} />
            ))}
            <circle cx={960} cy={540} r={190} fill="none" stroke="#0a0012" strokeWidth={10} />
            <circle cx={960} cy={540} r={pupil} fill="#0a0012" />
            <circle cx={930} cy={505} r={22} fill="#fff" opacity={0.9} />
          </g>
          </g>
          <Txt text={c.line || "Look closer."} x={960} y={970} size={70} weight={800} color="#fff" font={ff} p={c01((t - 5.0) / 0.8)} tracking={0.1} mode="blur" />
          <Txt text={nameOf(b)} x={960} y={110} size={40} weight={700} color="#fff" font={ff} p={c01((t - 5.6) / 0.6)} tracking={0.3} mode="fade" />
        </Svg>
      </div>
      <Track src="tracks/hypno-eye.wav" on={audio} />
    </AbsoluteFill>
  );
}
