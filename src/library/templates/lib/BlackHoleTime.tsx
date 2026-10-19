import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, expInOut, fontOf, hash, nameOf, palette, seg, useT } from "../../motion";

type C = { lines: string; outro: string };

// A story about time near a black hole: a spacetime grid sags into a well
// around a black disk with a lensed glowing ring; two clocks tick, one with
// a traveller drifting toward the hole whose clock slows while the far
// clock races; captions narrate, and the gap in years is shown at the end.
export default function BlackHoleTime({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const lines = [...(c.lines || "Near a black hole, time bends. | One hour close to it... | ...is years for everyone far away.").split("|").map((s) => s.trim()), "", "", ""].slice(0, 3);
  const BX = 1100;
  const BY = 560;
  const approach = c01((t - 2.0) / 4.0);
  const shipX = 1700 - approach * 460;
  const shipY = 300 + approach * 180;
  const dist = Math.hypot(shipX - BX, shipY - BY);
  const slow = Math.max(0.05, Math.min(1, (dist - 140) / 600));
  // integrate clocks approximately
  const nearT = t < 2 ? t : 2 + (t - 2) * (0.25 + 0.75 * slow) * 0.6;
  const farT = t * (1 + approach * 40);
  const outro = expInOut(seg(t, 9.4, 0.5));
  const line = t < 2.6 ? 0 : t < 5.4 ? 1 : 2;
  const lineAt = [0.3, 2.6, 5.4][line];
  const clock = (x: number, y: number, tt: number, label: string, col: string) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r={90} fill="#0b0b14" stroke={col} strokeWidth={6} />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1={0} y1={-78} x2={0} y2={-68} stroke={col} strokeWidth={3} transform={`rotate(${i * 30})`} />
      ))}
      <line x1={0} y1={0} x2={0} y2={-70} stroke="#fff" strokeWidth={4} strokeLinecap="round" transform={`rotate(${tt * 120})`} />
      <line x1={0} y1={0} x2={0} y2={-46} stroke="#fff" strokeWidth={6} strokeLinecap="round" transform={`rotate(${tt * 10})`} />
      <text y={130} textAnchor="middle" fontFamily={MONO} fontSize={26} fill={col}>
        {label}
      </text>
    </g>
  );

  return (
    <AbsoluteFill style={{ background: "#02030a", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          {Array.from({ length: 120 }, (_, i) => (
            <circle key={i} cx={hash(i, 1) * 1920} cy={hash(i, 2) * 1080} r={1 + hash(i, 3) * 1.5} fill="#fff" opacity={0.25 + hash(i, 4) * 0.4} />
          ))}
          {/* warped grid */}
          {Array.from({ length: 23 }, (_, j) => {
            const pts = Array.from({ length: 49 }, (_, i) => {
              const x = i * 40;
              const y0 = 40 + j * 46;
              const d = Math.hypot(x - BX, y0 - BY);
              const pull = 9000 / (d + 60);
              const ang = Math.atan2(BY - y0, BX - x);
              return `${(x + Math.cos(ang) * pull).toFixed(1)},${(y0 + Math.sin(ang) * pull).toFixed(1)}`;
            });
            return <polyline key={`h${j}`} points={pts.join(" ")} fill="none" stroke={pal.v} strokeWidth={1.2} opacity={0.25} />;
          })}
          {Array.from({ length: 49 }, (_, i) => {
            const pts = Array.from({ length: 23 }, (_, j) => {
              const x0 = i * 40;
              const y = 40 + j * 46;
              const d = Math.hypot(x0 - BX, y - BY);
              const pull = 9000 / (d + 60);
              const ang = Math.atan2(BY - y, BX - x0);
              return `${(x0 + Math.cos(ang) * pull).toFixed(1)},${(y + Math.sin(ang) * pull).toFixed(1)}`;
            });
            return <polyline key={`v${i}`} points={pts.join(" ")} fill="none" stroke={pal.v} strokeWidth={1.2} opacity={0.25} />;
          })}
          {/* accretion ring + lensing */}
          <ellipse cx={BX} cy={BY} rx={250} ry={60} fill="none" stroke="#ffb35c" strokeWidth={26} opacity={0.75} transform={`rotate(-12 ${BX} ${BY})`} />
          <circle cx={BX} cy={BY} r={150} fill="none" stroke="#ffd7a0" strokeWidth={10} opacity={0.6 + Math.sin(t * 3) * 0.1} />
          <circle cx={BX} cy={BY} r={130} fill="#000" />
          <path d={`M${BX - 250},${BY + 10} A250,60 0 0 0 ${BX + 250},${BY - 40}`} fill="none" stroke="#ffb35c" strokeWidth={26} opacity={0.85} transform={`rotate(-12 ${BX} ${BY})`} />
          {/* traveller */}
          <g transform={`translate(${shipX} ${shipY}) scale(${1 - approach * 0.3}) rotate(${approach * 40})`}>
            <path d="M-26,0 L18,-12 L28,0 L18,12 Z" fill="#fff" />
            <circle cx={-34} cy={0} r={6 + Math.sin(t * 20) * 2} fill="#7fd3ff" />
          </g>
          {clock(260, 300, nearT, "traveller", "#7fd3ff")}
          {clock(260, 640, farT, "home", pal.v)}
          <Txt text={`${(nearT / 4).toFixed(2)} hrs`} x={430} y={310} size={30} weight={600} color="#7fd3ff" font={MONO} p={1} anchor="start" />
          <Txt text={`${Math.floor(farT * 0.6)} yrs`} x={430} y={650} size={30} weight={600} color={pal.v} font={MONO} p={1} anchor="start" />
          {t < 7.6 && <Txt key={line} text={lines[line]} x={960} y={1000} size={46} weight={500} color="#e8e8f2" font={ff} p={c01((t - lineAt) / 0.7)} out={c01((t - lineAt - 2.3) / 0.3)} mode="blur" />}
          {t > 7.6 && (
            <>
              <Txt text={c.outro || "Time is relative. Make yours count."} x={960} y={960} size={56} weight={800} color="#fff" font={ff} p={c01((t - 7.6) / 0.6)} tracking={-0.02} />
              <Txt text={nameOf(b)} x={960} y={1030} size={34} weight={600} color={pal.v} font={ff} p={c01((t - 8.0) / 0.6)} mode="fade" />
            </>
          )}
        </Svg>
      </div>
      <Track src="tracks/black-hole-time.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = [list];
