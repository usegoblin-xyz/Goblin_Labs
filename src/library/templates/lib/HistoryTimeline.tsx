import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fit, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { title: string; eras: string; years: string; outro: string };

// A history film on one long timeline: the camera glides from era to era,
// each era raises an emblem drawn in line (pillar, scroll, wheel, ship, gear,
// chip), its years stamp in, and the line behind turns brand color.
const EMBLEMS: string[] = [
  "M-60,70 L60,70 M-50,60 L50,60 M-40,60 L-40,-50 M-15,60 L-15,-50 M15,60 L15,-50 M40,60 L40,-50 M-60,-50 L60,-50 L0,-80 Z", // temple
  "M-60,-50 L50,-50 Q70,-50 70,-30 L70,60 L-40,60 Q-60,60 -60,40 Z M-40,-20 L50,-20 M-40,5 L50,5 M-40,30 L30,30", // scroll
  "M0,-70 A70,70 0 1,1 -0.1,-70 M0,-70 L0,70 M-70,0 L70,0 M-50,-50 L50,50 M50,-50 L-50,50 M0,-14 A14,14 0 1,1 -0.1,-14", // wheel
  "M-80,30 L80,30 L50,70 L-50,70 Z M0,30 L0,-80 M0,-80 L60,10 L0,10 M0,-60 L-45,10 L0,10", // ship
  "M0,-40 A40,40 0 1,1 -0.1,-40 M0,-75 L0,-55 M0,55 L0,75 M-75,0 L-55,0 M55,0 L75,0 M-53,-53 L-39,-39 M39,39 L53,53 M-53,53 L-39,39 M39,-39 L53,-53", // gear
  "M-55,-55 L55,-55 L55,55 L-55,55 Z M-25,-25 L25,-25 L25,25 L-25,25 Z M-35,-55 L-35,-75 M0,-55 L0,-75 M35,-55 L35,-75 M-35,55 L-35,75 M0,55 L0,75 M35,55 L35,75", // chip
];

export default function HistoryTimeline({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const eras = [...list(c.eras || "First cities, Written word, The wheel turns, Across the seas, Machines, The digital age"), "Era", "Era", "Era", "Era", "Era", "Era"].slice(0, 6);
  const years = [...list(c.years || "3000 BC, 1200 BC, 500 BC, 1400, 1800, 1970"), "", "", "", "", "", ""].slice(0, 6);
  const title = c.title || "A short history of us";
  const GAP = 760;
  const titleOut = expInOut(seg(t, 1.6, 0.5));
  // camera visits era i at 2.0 + i * 1.5
  const cam = kf2(t);
  const outro = expInOut(seg(t, 11.4, 0.6));
  const endP = c01((t - 11.8) / 0.8);
  const ts = fit(title, 1500, 120, 800, -0.04, ff);

  function kf2(time: number) {
    const stops = eras.map((_, i) => 2.0 + i * 1.5);
    if (time <= stops[0]) return -GAP * 0.9 + (time / stops[0]) * GAP * 0.9 * cubicInOut(c01(time / stops[0]));
    for (let i = 0; i < stops.length - 1; i++) {
      if (time < stops[i + 1]) {
        const u = c01((time - stops[i] - 0.5) / 1.0);
        return lerp(i * GAP, (i + 1) * GAP, cubicInOut(u));
      }
    }
    return (eras.length - 1) * GAP;
  }

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        <Txt text={title} x={960} y={520} size={ts} weight={800} color={pal.fg} font={ff} p={c01((t - 0.2) / 0.8)} out={titleOut} tracking={-0.04} />
        <g opacity={1 - outro} transform={`translate(${960 - cam} 0)`}>
          <line x1={-2000} x2={eras.length * GAP + 2000} y1={700} y2={700} stroke={pal.line} strokeWidth={4} />
          <line x1={-2000} x2={cam} y1={700} y2={700} stroke={pal.v} strokeWidth={6} />
          {eras.map((e, i) => {
            const x = i * GAP;
            const at = 2.0 + i * 1.5;
            const rise = expOut(seg(t, at - 0.3, 0.7));
            const draw = c01((t - at + 0.2) / 0.8);
            const near = Math.max(0, 1 - Math.abs(cam - x) / GAP);
            return (
              <g key={i} opacity={lerp(0.25, 1, near)}>
                <circle cx={x} cy={700} r={18 * spring(t - at + 0.3, 16, 0.5)} fill={pal.v} />
                <g transform={`translate(${x} ${lerp(520, 420, rise)}) scale(1.6)`}>
                  <path d={EMBLEMS[i % EMBLEMS.length]} fill="none" stroke={pal.fg} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${draw} 2`} />
                </g>
                <Txt text={years[i]} x={x} y={790} size={48} weight={800} color={pal.v} font={ff} p={c01((t - at) / 0.5)} mode="drop" />
                <Txt text={e} x={x} y={870} size={fit(e, 640, 60, 700, -0.02, ff)} weight={700} color={pal.fg} font={ff} p={c01((t - at - 0.1) / 0.6)} />
              </g>
            );
          })}
        </g>
        {endP > 0 && (
          <>
            <Txt text={c.outro || "And the next chapter is yours."} x={960} y={520} size={fit(c.outro || "And the next chapter is yours.", 1500, 100, 800, -0.03, ff)} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.03} />
            <Txt text={nameOf(b)} x={960} y={640} size={48} weight={600} color={pal.v} font={ff} p={c01((t - 12.2) / 0.6)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/history-timeline.wav" on={audio} />
    </AbsoluteFill>
  );
}
