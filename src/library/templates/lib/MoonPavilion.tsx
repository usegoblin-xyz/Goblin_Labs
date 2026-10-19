import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, fontOf, hash, nameOf, seg, useT } from "../../motion";

type C = { line: string };

// A moonlit pavilion by a river: a slow, calm loop. A pavilion with upturned
// eaves stands on the far bank under a full moon; the moon's reflection
// ripples in broken strips on the water, a small boat drifts across, willow
// strands sway, and mist bands slide; a quiet line fades in.
export default function MoonPavilion({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const ff = fontOf(b);
  const moon = "#f6f0d8";
  const ink = "#0a1020";
  const water = 700;
  const boatX = -200 + t * 190;
  const outro = expInOut(seg(t, 10.4, 0.5));
  const fadeIn = c01(t / 1.2);
  const P = { x: 1240, y: water };

  return (
    <AbsoluteFill style={{ background: "#0f1a33", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: (1 - outro) * fadeIn }}>
        <Svg>
          <defs>
            <linearGradient id="mp-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0b1328" />
              <stop offset="1" stopColor="#24375e" />
            </linearGradient>
            <radialGradient id="mp-glow">
              <stop offset="0" stopColor={moon} stopOpacity={0.45} />
              <stop offset="1" stopColor={moon} stopOpacity={0} />
            </radialGradient>
          </defs>
          <rect width={1920} height={water} fill="url(#mp-sky)" />
          {Array.from({ length: 50 }, (_, i) => (
            <circle key={i} cx={hash(i, 1) * 1920} cy={hash(i, 2) * 420} r={1.5 + hash(i, 3)} fill="#fff" opacity={0.3 + 0.5 * Math.abs(Math.sin(t + i))} />
          ))}
          <circle cx={560} cy={230} r={300} fill="url(#mp-glow)" />
          <circle cx={560} cy={230} r={110} fill={moon} />
          {/* far hills */}
          <path d={`M0,${water} C300,560 600,600 900,${water - 60} C1200,520 1600,600 1920,${water - 40} L1920,${water} Z`} fill="#16223f" />
          {/* pavilion */}
          <g transform={`translate(${P.x} ${P.y})`} fill={ink}>
            <rect x={-170} y={-24} width={340} height={24} />
            {[-130, -45, 45, 130].map((x) => (
              <rect key={x} x={x - 8} y={-170} width={16} height={150} />
            ))}
            <path d="M-240,-170 Q-200,-180 -160,-200 L160,-200 Q200,-180 240,-170 Q240,-150 200,-160 L-200,-160 Q-240,-150 -240,-170 Z" />
            <path d="M-170,-200 Q0,-300 170,-200 Z" />
            <path d="M-120,-245 Q-90,-252 -70,-268 L70,-268 Q90,-252 120,-245 Q118,-232 90,-238 L-90,-238 Q-118,-232 -120,-245 Z" />
            <rect x={-3} y={-310} width={6} height={50} />
            {[-90, 0, 90].map((x) => (
              <circle key={x} cx={x} cy={-130} r={10} fill="#ffb347" opacity={0.75 + Math.sin(t * 3 + x) * 0.15} />
            ))}
          </g>
          {/* water */}
          <rect y={water} width={1920} height={1080 - water} fill="#0a1328" />
          {/* moon reflection: broken strips */}
          {Array.from({ length: 16 }, (_, i) => {
            const y = water + 14 + i * 22;
            const w = (140 - i * 4) * (0.6 + 0.4 * Math.sin(t * 1.4 + i * 1.3));
            const x = 560 + Math.sin(t * 1.1 + i * 0.7) * (8 + i * 2);
            return <rect key={i} x={x - w / 2} y={y} width={w} height={6} rx={3} fill={moon} opacity={0.7 - i * 0.035} />;
          })}
          {/* pavilion reflection */}
          <g transform={`translate(${P.x} ${water}) scale(1 -0.6)`} opacity={0.25}>
            <rect x={-170} y={-24} width={340} height={24} fill="#2a3a66" />
            <path d="M-240,-170 L240,-170 L170,-200 L-170,-200 Z" fill="#2a3a66" />
          </g>
          {/* ripples */}
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1={hash(i, 7) * 1920 + Math.sin(t + i) * 20} x2={hash(i, 7) * 1920 + 60 + Math.sin(t + i) * 20} y1={water + 40 + hash(i, 8) * 300} y2={water + 40 + hash(i, 8) * 300} stroke="#3a4f80" strokeWidth={2} opacity={0.6} />
          ))}
          {/* boat */}
          <g transform={`translate(${boatX} ${water + 120 + Math.sin(t * 1.6) * 4}) rotate(${Math.sin(t * 1.3) * 2})`}>
            <path d="M-90,0 Q0,30 90,0 L70,-10 L-70,-10 Z" fill={ink} />
            <rect x={-6} y={-70} width={4} height={60} fill={ink} />
            <circle cx={-2} cy={-74} r={7} fill="#ffb347" />
            <circle cx={-2} cy={-74} r={24} fill="#ffb347" opacity={0.2} />
          </g>
          {/* mist */}
          {[0, 1].map((k) => (
            <rect key={k} x={((t * (30 + k * 20)) % 2400) - 1200 + k * 600} y={water - 60 + k * 30} width={1600} height={50} rx={25} fill="#c9d6f0" opacity={0.08} />
          ))}
          {/* willow */}
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d={`M${1700 + i * 20},0 Q${1690 + i * 20 + Math.sin(t * 0.9 + i) * 30},${200 + i * 10} ${1680 + i * 18 + Math.sin(t * 0.9 + i * 0.7) * 50},${380 + (i % 4) * 40}`} stroke="#07101f" strokeWidth={4} fill="none" />
          ))}
          <Txt text={c.line || "Still water, quiet mind."} x={960} y={1010} size={44} weight={300} color="#dfe6f6" font={ff} p={c01((t - 3.0) / 1.5)} tracking={0.2} mode="blur" />
          <Txt text={nameOf(b)} x={960} y={90} size={30} weight={600} color="#b8c3dd" font={ff} p={c01((t - 4.0) / 1.2)} tracking={0.4} mode="fade" />
        </Svg>
      </div>
      <Track src="tracks/moon-pavilion.wav" on={audio} />
    </AbsoluteFill>
  );
}
