import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, fontOf, mix, nameOf, palette, seg, useT } from "../../motion";

type C = { lyrics: string; artist: string };

// A clay-style music video: soft, shaded clay characters (blob bodies with
// dot eyes) bounce on a pastel stage in time with the beat, squashing on
// each landing; a clay sun pulses, lyric lines pop in clay lettering, and
// the crew lines up for a final pose.
export default function ClayBounce({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const lyrics = [...(c.lyrics || "we keep on moving | up and down and round | feel the beat | say it loud").split("|").map((s) => s.trim()), "la la", "la la", "la la", "la la"].slice(0, 4);
  const beat = 60 / 112;
  const ph = (t % beat) / beat;
  const bounce = Math.sin(ph * Math.PI); // 0 at landings
  const squash = ph < 0.12 ? 1 - ph / 0.12 : ph > 0.92 ? (ph - 0.92) / 0.08 : 0;
  const line = Math.min(3, Math.floor(t / 2.0));
  const lineU = t - line * 2.0;
  const pose = expInOut(seg(t, 8.0, 0.8));
  const outro = expInOut(seg(t, 9.6, 0.5));
  const chars = [pal.v, pal.a, "#ff9fb5", "#8fd3ff"];
  const clay = (col: string, id: string) => (
    <radialGradient id={id} cx="35%" cy="30%" r="75%">
      <stop offset="0" stopColor={mix(col, "#ffffff", 0.45)} />
      <stop offset="0.6" stopColor={col} />
      <stop offset="1" stopColor={mix(col, "#000000", 0.25)} />
    </radialGradient>
  );

  return (
    <AbsoluteFill style={{ background: "#ffe9d6", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          <defs>
            {chars.map((col, i) => clay(col, `cb-c${i}`))}
            {clay("#ffcf5a", "cb-sun")}
            {clay("#c7e6b8", "cb-floor")}
          </defs>
          {/* sun */}
          <circle cx={1600} cy={220} r={110 * (1 + (1 - bounce) * 0.06)} fill="url(#cb-sun)" />
          {/* clay hills / floor */}
          <ellipse cx={960} cy={1120} rx={1300} ry={340} fill="url(#cb-floor)" />
          {/* characters */}
          {chars.map((col, i) => {
            const delay = i * 0.12;
            const myPh = ((t - delay) % beat) / beat;
            const myB = Math.sin(Math.max(0, myPh) * Math.PI);
            const mySq = myPh < 0.12 ? 1 - myPh / 0.12 : 0;
            const xBase = 420 + i * 360;
            const x = xBase + (pose > 0 ? (960 - 540 + i * 360 - xBase) * pose : Math.sin(t * 0.8 + i) * 40);
            const y = 820 - myB * (160 + (i % 2) * 40) * (1 - pose * 0.7);
            const sx = 1 + mySq * 0.25;
            const sy = 1 - mySq * 0.22;
            return (
              <g key={i} transform={`translate(${x} ${y}) scale(${sx} ${sy})`}>
                <ellipse cx={0} cy={60 + myB * 140} rx={90 - myB * 30} ry={16} fill="#000" opacity={0.12} transform={`translate(0 ${myB * 0})`} />
                <path d="M-95,40 C-110,-80 -50,-150 0,-150 C50,-150 110,-80 95,40 C80,70 -80,70 -95,40 Z" fill={`url(#cb-c${i})`} />
                <circle cx={-30} cy={-60} r={13} fill="#2b1d14" />
                <circle cx={30} cy={-60} r={13} fill="#2b1d14" />
                <circle cx={-26} cy={-64} r={4} fill="#fff" />
                <circle cx={34} cy={-64} r={4} fill="#fff" />
                <path d={pose > 0.5 || i % 2 ? "M-22,-20 Q0,6 22,-20" : "M-14,-18 Q0,-8 14,-18"} fill="none" stroke="#2b1d14" strokeWidth={7} strokeLinecap="round" />
                <ellipse cx={-55} cy={-30} rx={14} ry={9} fill="#ff6b8a" opacity={0.4} />
                <ellipse cx={55} cy={-30} rx={14} ry={9} fill="#ff6b8a" opacity={0.4} />
              </g>
            );
          })}
          {/* lyric */}
          {pose < 0.5 && (
            <g transform={`translate(960 260) scale(${1 + (1 - c01(lineU / 0.15)) * 0.3})`} opacity={c01(lineU * 6) * (1 - c01((lineU - 1.8) * 5))}>
              <text textAnchor="middle" fontFamily={ff} fontSize={96} fontWeight={900} fill="#fff" stroke="#e07a5f" strokeWidth={18} paintOrder="stroke" strokeLinejoin="round">
                {lyrics[line]}
              </text>
            </g>
          )}
          {pose > 0.5 && (
            <>
              <Txt text={c.artist || nameOf(b)} x={960} y={260} size={120} weight={900} color="#e07a5f" font={ff} p={c01((t - 8.4) / 0.5)} mode="scale" />
              <Txt text="new single · out now" x={960} y={350} size={44} weight={700} color="#8a5a44" font={ff} p={c01((t - 8.7) / 0.5)} mode="fade" />
            </>
          )}
        </Svg>
      </div>
      <Track src="tracks/clay-bounce.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = [list];
