import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, nameOf, palette, seg, useT } from "../../motion";

type C = { facts: string; outro: string };

// What happens in one second: a stopwatch hand sweeps a single second in
// extreme slow motion while four facts each get their own illustrated
// counter (a heartbeat line, a light beam crossing a scale, wing strokes,
// Earth sliding along its orbit), then the hand clicks to 1.00 s.
export default function OneSecond({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const facts = [...list(c.facts || "Your heart beats about once, Light travels 300000 km, A hummingbird flaps about 50 times, Earth moves 30 km along its orbit"), "Something happens", "Something happens", "Something happens", "Something happens"].slice(0, 4);
  const T0 = 0.6;
  const DUR = 7.6; // the one second, slowed down
  const sec = c01((t - T0) / DUR);
  const k = Math.min(3, Math.floor(sec * 4));
  const u = sec * 4 - k;
  const outro = expInOut(seg(t, T0 + DUR + 0.8, 0.5));
  const endP = c01((t - T0 - DUR - 1.2) / 0.8);
  const scene = () => {
    if (k === 0) {
      // ECG line
      const pts = Array.from({ length: 120 }, (_, i) => {
        const x = i / 119;
        const ph = (x - 0.5) * 20;
        const y = Math.abs(ph) < 0.6 ? (ph < 0 ? -200 * (0.6 + ph) : 140 * (0.6 - ph) - 40) : Math.sin(x * 30) * 6;
        return `${i ? "L" : "M"}${200 + x * 900},${560 + y}`;
      });
      return (
        <g>
          <path d={pts.join(" ")} fill="none" stroke={pal.v} strokeWidth={8} strokeLinejoin="round" pathLength={1} strokeDasharray={`${cubicInOut(u)} 2`} />
          <text x={650} y={780} textAnchor="middle" fontFamily={ff} fontSize={140} fill={pal.v} opacity={u > 0.5 ? 1 : 0.2} transform={`scale(1)`}>
            ♥
          </text>
        </g>
      );
    }
    if (k === 1) {
      const x = 200 + cubicInOut(u) * 900;
      return (
        <g>
          <line x1={200} x2={1100} y1={600} y2={600} stroke={pal.line} strokeWidth={4} />
          {Array.from({ length: 7 }, (_, i) => (
            <g key={i}>
              <line x1={200 + i * 150} x2={200 + i * 150} y1={585} y2={615} stroke={pal.muted} strokeWidth={3} />
              <text x={200 + i * 150} y={660} textAnchor="middle" fontFamily={MONO} fontSize={24} fill={pal.muted}>
                {i * 50}k
              </text>
            </g>
          ))}
          <line x1={200} x2={x} y1={540} y2={540} stroke="#fff6c4" strokeWidth={14} strokeLinecap="round" />
          <circle cx={x} cy={540} r={22} fill="#fff6c4" />
          <circle cx={x} cy={540} r={60} fill="#fff6c4" opacity={0.2} />
        </g>
      );
    }
    if (k === 2) {
      const flap = Math.sin(u * Math.PI * 2 * 12.5);
      const n = Math.floor(u * 50);
      return (
        <g transform="translate(650 520)">
          <ellipse rx={70} ry={32} fill={pal.a} />
          <circle cx={70} cy={-14} r={26} fill={pal.a} />
          <path d="M92,-14 L170,-6" stroke={pal.fg} strokeWidth={6} />
          <path d={`M-10,-10 Q-60,${-160 * flap} -160,${-120 * flap}`} fill="none" stroke={pal.v} strokeWidth={22} strokeLinecap="round" opacity={0.85} />
          <path d={`M-10,-10 Q-60,${-160 * -flap} -160,${-120 * -flap}`} fill="none" stroke={pal.v} strokeWidth={22} strokeLinecap="round" opacity={0.25} />
          <text y={240} textAnchor="middle" fontFamily={MONO} fontSize={60} fill={pal.fg}>
            × {n}
          </text>
        </g>
      );
    }
    const a = -0.14 + u * 0.28;
    return (
      <g>
        <circle cx={650} cy={1500} r={1100} fill="none" stroke={pal.line} strokeWidth={3} strokeDasharray="10 14" />
        <circle cx={650 + Math.sin(a) * 1100} cy={1500 - Math.cos(a) * 1100} r={70} fill="#38a3ff" />
        <path d={`M${650 + Math.sin(a - 0.12) * 1100},${1500 - Math.cos(a - 0.12) * 1100} A1100,1100 0 0 1 ${650 + Math.sin(a) * 1100},${1500 - Math.cos(a) * 1100}`} stroke="#38a3ff" strokeWidth={10} fill="none" opacity={0.5} />
        <text x={650} y={760} textAnchor="middle" fontFamily={MONO} fontSize={60} fill={pal.fg}>
          {(u * 30).toFixed(1)} km
        </text>
      </g>
    );
  };

  return (
    <AbsoluteFill style={{ background: pal.dark ? "#07080c" : "#101218", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          <Txt text="In one second" x={650} y={160} size={64} weight={800} color="#fff" font={ff} p={c01((t - 0.1) / 0.5)} />
          {t > T0 && scene()}
          {/* stopwatch */}
          <g transform="translate(1500 540)">
            <rect x={-30} y={-330} width={60} height={50} rx={10} fill="#fff" />
            <circle r={270} fill="none" stroke="#fff" strokeWidth={12} />
            {Array.from({ length: 100 }, (_, i) => (
              <line key={i} x1={0} y1={-250} x2={0} y2={i % 10 ? -235 : -215} stroke="#fff" strokeWidth={i % 10 ? 2 : 5} transform={`rotate(${i * 3.6})`} opacity={0.7} />
            ))}
            <path d={`M0,0 L0,-250 A250,250 0 ${sec > 0.5 ? 1 : 0} 1 ${Math.sin(sec * Math.PI * 2) * 250},${-Math.cos(sec * Math.PI * 2) * 250} Z`} fill={pal.v} opacity={0.25} />
            <line x1={0} y1={30} x2={0} y2={-240} stroke={pal.v} strokeWidth={8} strokeLinecap="round" transform={`rotate(${sec * 360})`} />
            <circle r={16} fill={pal.v} />
            <text y={140} textAnchor="middle" fontFamily={MONO} fontSize={64} fill="#fff">
              {sec.toFixed(2)} s
            </text>
          </g>
        </Svg>
        {t > T0 && (
          <div key={k} style={{ position: "absolute", left: 120, right: 1000, top: 860, textAlign: "center", fontSize: 50, fontWeight: 700, color: "#fff", opacity: c01(u * 6) * (1 - c01((u - 0.9) * 10)) }}>
            {facts[k]}
          </div>
        )}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={c.outro || "Make your next second count."} x={960} y={500} size={96} weight={800} color="#fff" font={ff} p={endP} tracking={-0.03} />
          <Txt text={nameOf(b)} x={960} y={620} size={50} weight={600} color={pal.v} font={ff} p={c01((t - T0 - DUR - 1.6) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/one-second.wav" on={audio} />
    </AbsoluteFill>
  );
}
