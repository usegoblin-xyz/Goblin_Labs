import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, backOut, c01, expInOut, expOut, fit, fontOf, hash, kf, lerp, mix, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { episode: string; title: string };

// A Saturday-morning space cartoon in ten seconds: a starburst title card,
// a little rocket and its bubble-helmet pilot dodging asteroids at warp,
// a bumpy landing on a candy planet, a friendly blob pops up to say hi, and
// an iris-out to "to be continued".
const INK = "#1b1530";

function Rocket({ x, y, rot, s, flame, pal }: { x: number; y: number; rot: number; s: number; flame: number; pal: ReturnType<typeof palette> }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} stroke={INK} strokeWidth={8} strokeLinejoin="round">
      <path d={`M-150,0 L${-190 - flame * 70},-26 L${-170 - flame * 40},0 L${-190 - flame * 70},26 Z`} fill="#ffb02e" />
      <path d={`M-150,0 L${-160 - flame * 30},-12 L${-155 - flame * 20},0 L${-160 - flame * 30},12 Z`} fill="#fff3a8" stroke="none" />
      <path d="M-120,-40 L-170,-90 L-90,-46 Z" fill={pal.a} />
      <path d="M-120,40 L-170,90 L-90,46 Z" fill={pal.a} />
      <path d="M-150,-48 C-40,-70 90,-60 160,0 C90,60 -40,70 -150,48 Z" fill="#f5f5f7" />
      <path d="M90,-34 C130,-24 150,-12 160,0 C150,12 130,24 90,34 Z" fill={pal.p} />
      <circle cx={10} cy={-4} r={34} fill="#9fe0ff" />
      {/* pilot in bubble helmet */}
      <circle cx={10} cy={2} r={18} fill="#7ddc6f" />
      <circle cx={4} cy={-2} r={5} fill={INK} stroke="none" />
      <circle cx={18} cy={-2} r={5} fill={INK} stroke="none" />
      <path d="M4,10 Q11,16 18,10" fill="none" strokeWidth={4} />
      <path d="M10,-16 L10,-30" strokeWidth={4} />
      <circle cx={10} cy={-32} r={5} fill="#ff6fa9" strokeWidth={3} />
      <circle cx={-8} cy={-20} r={7} fill="#ffffff" stroke="none" opacity={0.7} />
    </g>
  );
}

export default function SpaceCartoon({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const ep = c.episode || "Episode 1";
  const title = c.title || "The Lost Star";

  const titleCard = t < 1.5;
  const tcIn = backOut(c01(t / 0.45), 2);
  const fly = t >= 1.5 && t < 4.0;
  const land = t >= 4.0;
  const iris = expInOut(seg(t, 7.6, 0.8));
  const endP = c01((t - 8.5) / 0.5);

  // rocket path
  const dodge = kf(t, [[1.5, 0], [2.0, -140], [2.6, 120], [3.2, -60], [3.8, 0]]);
  const rx = land ? lerp(960, 1000, expOut(seg(t, 4.0, 1.2))) : 760 + Math.sin(t * 3) * 20;
  const descend = expInOut(seg(t, 4.2, 1.1));
  const ry = land ? lerp(420, 700, descend) + (t > 5.3 && t < 5.6 ? Math.sin((t - 5.3) * 30) * 8 : 0) : 540 + dodge;
  const rrot = land ? lerp(0, -80, descend) : dodge * -0.06;
  const planet = expOut(seg(t, 3.7, 1.0));
  const pilotOut = spring(t - 5.8, 12, 0.6);
  const blob = spring(t - 6.2, 12, 0.5);
  const heart = c01((t - 6.9) / 0.5);

  return (
    <AbsoluteFill style={{ background: "#120c2e", overflow: "hidden", fontFamily: ff }}>
      <Svg>
        {/* stars (streaking during flight) */}
        {Array.from({ length: 90 }).map((_, i) => {
          const sp = fly ? 1600 : land ? 30 : 60;
          const x = (((hash(i, 1) * 2200 - t * sp * (0.4 + hash(i, 2))) % 2200) + 2200) % 2200 - 140;
          const y = hash(i, 3) * 1080;
          const len = fly ? 40 + hash(i, 4) * 120 : 0;
          return <line key={i} x1={x} y1={y} x2={x + len + 3} y2={y} stroke="#ffffff" strokeWidth={3 + hash(i, 5) * 3} strokeLinecap="round" opacity={0.6 + hash(i, 6) * 0.4} />;
        })}
        {/* title card */}
        {titleCard && (
          <g opacity={1 - c01((t - 1.3) / 0.2)}>
            {Array.from({ length: 16 }).map((_, i) => {
              const a = (i / 16) * Math.PI * 2 + t * 0.6;
              return <path key={i} d={`M960,540 L${960 + Math.cos(a) * 1400},${540 + Math.sin(a) * 1400} L${960 + Math.cos(a + 0.18) * 1400},${540 + Math.sin(a + 0.18) * 1400} Z`} fill={i % 2 ? pal.p : mix(pal.p, "#ffffff", 0.3)} />;
            })}
            <g transform={`translate(960 540) scale(${tcIn}) rotate(${(1 - tcIn) * -20}) translate(-960 -540)`}>
              <Txt text={ep.toUpperCase()} x={960} y={420} size={70} weight={900} color="#ffe14d" font={ff} tracking={0.08} />
              <text x={960} y={600} textAnchor="middle" fontFamily={ff} fontSize={fit(title, 1500, 170, 900)} fontWeight={900} fill="#ffffff" stroke={INK} strokeWidth={14} paintOrder="stroke" letterSpacing="-0.02em">
                {title}
              </text>
            </g>
          </g>
        )}
        {/* asteroids */}
        {fly &&
          [0, 1, 2, 3].map((i) => {
            const k = (t - 1.6 - i * 0.55) / 0.9;
            if (k < 0 || k > 1) return null;
            const x = lerp(2100, -200, k);
            const y = [380, 720, 460, 640][i];
            const r = [70, 90, 60, 80][i];
            return (
              <g key={i} transform={`translate(${x} ${y}) rotate(${t * 90 * (i % 2 ? 1 : -1)})`}>
                <path d={`M${-r},0 C${-r},${-r * 0.8} ${-r * 0.3},${-r} 0,${-r} C${r * 0.8},${-r} ${r},${-r * 0.4} ${r},0 C${r},${r * 0.7} ${r * 0.4},${r} 0,${r} C${-r * 0.6},${r} ${-r},${r * 0.6} ${-r},0 Z`} fill="#8a7a9c" stroke={INK} strokeWidth={8} />
                <circle cx={-r * 0.3} cy={-r * 0.2} r={r * 0.2} fill="#6d5f80" />
                <circle cx={r * 0.35} cy={r * 0.3} r={r * 0.14} fill="#6d5f80" />
              </g>
            );
          })}
        {/* planet surface */}
        {planet > 0 && (
          <g transform={`translate(0 ${(1 - planet) * 600})`}>
            <ellipse cx={960} cy={1460} rx={1500} ry={720} fill="#ff8fc8" stroke={INK} strokeWidth={10} />
            {Array.from({ length: 9 }).map((_, i) => (
              <circle key={i} cx={260 + i * 180} cy={830 + Math.abs(i - 4) * 18} r={22 + (i % 3) * 8} fill={["#ffe14d", "#7de0ff", "#b6ff7a"][i % 3]} stroke={INK} strokeWidth={6} />
            ))}
            <circle cx={360} cy={260} r={70} fill="#ffd36e" stroke={INK} strokeWidth={8} />
            <ellipse cx={360} cy={260} rx={130} ry={24} fill="none" stroke={INK} strokeWidth={8} />
          </g>
        )}
        {(fly || land) && <Rocket x={rx} y={ry} rot={rrot} s={land ? lerp(1, 0.9, descend) : 1} flame={0.6 + 0.4 * Math.sin(t * 40) * (land && descend > 0.98 ? 0 : 1)} pal={pal} />}
        {/* dust puff on landing */}
        {t > 5.25 && t < 6.2 &&
          [0, 1, 2, 3, 4].map((i) => {
            const k = c01((t - 5.25) / 0.9);
            return <circle key={i} cx={1000 + (i - 2) * 70 * (1 + k)} cy={800 - k * 30} r={30 + k * 30} fill="#ffffff" opacity={0.7 * (1 - k)} />;
          })}
        {/* pilot pops out and waves; blob says hi */}
        {pilotOut > 0.01 && (
          <g transform={`translate(1110 ${lerp(760, 640, pilotOut)})`} stroke={INK} strokeWidth={6}>
            <circle r={36} fill="#7ddc6f" />
            <circle cx={-12} cy={-6} r={7} fill={INK} stroke="none" />
            <circle cx={14} cy={-6} r={7} fill={INK} stroke="none" />
            <path d="M-12,14 Q2,26 16,14" fill="none" />
            <path d={`M30,10 L${60 + Math.sin(t * 14) * 10},${-30}`} strokeWidth={10} strokeLinecap="round" />
          </g>
        )}
        {blob > 0.01 && (
          <g transform={`translate(700 ${lerp(900, 770, blob)}) scale(${1 + Math.sin(t * 6) * 0.04} ${1 - Math.sin(t * 6) * 0.04})`} stroke={INK} strokeWidth={8}>
            <path d="M-90,60 C-100,-60 -40,-110 0,-110 C40,-110 100,-60 90,60 Z" fill={pal.a} />
            <circle cx={-26} cy={-40} r={16} fill="#fff" />
            <circle cx={26} cy={-40} r={16} fill="#fff" />
            <circle cx={-22} cy={-38} r={7} fill={INK} stroke="none" />
            <circle cx={30} cy={-38} r={7} fill={INK} stroke="none" />
            <path d="M-24,0 Q0,24 24,0" fill="none" />
          </g>
        )}
        {heart > 0 && heart < 1 && <path d="M0,-20 C-30,-60 -70,-10 0,40 C70,-10 30,-60 0,-20 Z" transform={`translate(900 ${560 - heart * 120}) scale(${expOut(heart * 3)})`} fill="#ff4f8b" stroke={INK} strokeWidth={6} opacity={1 - c01((heart - 0.7) / 0.3)} />}
        {/* iris out */}
        {iris > 0 && (
          <path d={`M0,0 H1920 V1080 H0 Z M${960 + lerp(1200, 0, iris)},540 A${lerp(1200, 0, iris)},${lerp(1200, 0, iris)} 0 1 0 ${960 - lerp(1200, 0, iris)},540 A${lerp(1200, 0, iris)},${lerp(1200, 0, iris)} 0 1 0 ${960 + lerp(1200, 0, iris)},540 Z`} fill="#000" fillRule="evenodd" />
        )}
        {endP > 0 && (
          <>
            <Txt text="To be continued..." x={960} y={520} size={110} weight={900} color="#ffe14d" font={ff} p={endP} tracking={-0.02} />
            <Txt text={name} x={960} y={620} size={48} weight={700} color="#ffffff" font={ff} p={c01((t - 8.9) / 0.5)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/space-cartoon.wav" on={audio} />
    </AbsoluteFill>
  );
}
