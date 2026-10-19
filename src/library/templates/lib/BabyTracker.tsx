import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Phone, Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, hash, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { baby: string; events: string; tagline: string };

// A gentle baby-app promo in pastels: night falls over a cot mobile that
// sways, stars twinkle in, then a phone rises showing the day's log: sleep,
// feed and nappy events drop onto a soft timeline with a sleep-hours ring,
// and a calm "you're doing great" note closes.
export default function BabyTracker({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const baby = c.baby || "Ada";
  const events = [...list(c.events || "Slept 2h 40m, Fed 120 ml, Nappy change, Slept 3h 10m"), "Logged", "Logged", "Logged", "Logged"].slice(0, 4);
  const icons = ["☾", "◍", "✿", "☾"];
  const pastel = ["#c9d7ff", "#ffd6c9", "#d6f2d9", "#e6d6ff"];
  const night = c01((t - 0.2) / 1.6);
  const sky = `linear-gradient(180deg, ${night > 0.5 ? "#2b3166" : "#ffd9c4"} 0%, ${night > 0.5 ? "#5a5f9e" : "#ffeede"} 100%)`;
  const phoneIn = spring(t - 3.0, 12, 0.75);
  const outro = expInOut(seg(t, 8.6, 0.5));
  const endP = c01((t - 9.0) / 0.8);
  const ring = cubicInOut(c01((t - 5.6) / 1.2));
  const sway = Math.sin(t * 1.4) * 8;

  return (
    <AbsoluteFill style={{ background: "#fbf6f1", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <AbsoluteFill style={{ background: sky, opacity: 0.25 + night * 0.75 }} />
        <Svg>
          {Array.from({ length: 40 }, (_, i) => (
            <text key={i} x={hash(i, 1) * 1920} y={hash(i, 2) * 600} fontSize={14 + hash(i, 3) * 20} fill="#fff7c9" opacity={night * (0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i)))} textAnchor="middle">
              ✦
            </text>
          ))}
          {/* moon */}
          <circle cx={1650} cy={200} r={80 * night} fill="#fff7c9" />
          <circle cx={1690} cy={180} r={70 * night} fill="#3a3f7c" opacity={0.95} />
          {/* mobile */}
          <g transform={`translate(560 0) rotate(${sway} 0 120)`}>
            <line x1={0} y1={0} x2={0} y2={120} stroke="#f4e3d3" strokeWidth={4} />
            <path d="M-260,120 Q0,90 260,120" stroke="#f4e3d3" strokeWidth={6} fill="none" />
            {[-220, -80, 80, 220].map((x, i) => (
              <g key={i} transform={`translate(${x} ${130}) rotate(${Math.sin(t * 2 + i) * 10})`}>
                <line x1={0} y1={0} x2={0} y2={90 + (i % 2) * 50} stroke="#f4e3d3" strokeWidth={3} />
                {i % 2 ? (
                  <text x={0} y={190} textAnchor="middle" fontSize={80} fill={pastel[i]}>
                    ★
                  </text>
                ) : (
                  <ellipse cx={0} cy={130} rx={40} ry={34} fill={pastel[i]} />
                )}
              </g>
            ))}
          </g>
          <Txt text={`Goodnight, ${baby}.`} x={560} y={620} size={80} weight={700} color="#fff" font={ff} p={c01((t - 1.2) / 0.8)} mode="blur" />
          <Txt text="We'll keep track. You get some rest." x={560} y={700} size={40} weight={500} color="#e8e6ff" font={ff} p={c01((t - 1.8) / 0.8)} mode="fade" />
        </Svg>
        <Phone x={1300} y={560 + (1 - phoneIn) * 1100} h={900} pal={pal} screen="#fffaf5">
          <div style={{ position: "absolute", inset: 0, padding: "70px 32px", boxSizing: "border-box", fontFamily: ff }}>
            <div style={{ fontSize: 26, color: "#9a8f86" }}>Today</div>
            <div style={{ fontSize: 46, fontWeight: 800, color: "#3b332d" }}>{baby}'s day</div>
            <svg width={380} height={220} style={{ display: "block", margin: "20px auto" }}>
              <circle cx={190} cy={110} r={90} fill="none" stroke="#efe6dc" strokeWidth={24} />
              <circle cx={190} cy={110} r={90} fill="none" stroke="#9aa9ff" strokeWidth={24} strokeLinecap="round" pathLength={1} strokeDasharray={`${ring * 0.58} 2`} transform="rotate(-90 190 110)" />
              <text x={190} y={115} textAnchor="middle" fontFamily={ff} fontSize={44} fontWeight={800} fill="#3b332d">
                {(ring * 13.9).toFixed(1)}h
              </text>
              <text x={190} y={150} textAnchor="middle" fontFamily={ff} fontSize={20} fill="#9a8f86">
                sleep
              </text>
            </svg>
            {events.map((e, i) => {
              const s = spring(t - 3.8 - i * 0.4, 15, 0.6);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, height: 76, marginBottom: 10, padding: "0 18px", borderRadius: 22, background: pastel[i], transform: `translateY(${(1 - s) * -60}px)`, opacity: c01(s * 2) }}>
                  <div style={{ fontSize: 30, width: 34, textAlign: "center", color: "#3b332d" }}>{icons[i]}</div>
                  <div style={{ fontSize: 26, fontWeight: 600, color: "#3b332d" }}>{e}</div>
                  <div style={{ marginLeft: "auto", fontSize: 20, color: "#7d726a" }}>{["1:10", "4:30", "5:05", "5:40"][i]}</div>
                </div>
              );
            })}
          </div>
        </Phone>
        {t > 7.0 && (
          <div style={{ position: "absolute", left: 200, top: 820, padding: "24px 36px", borderRadius: 30, background: "#fffaf5", fontSize: 38, fontWeight: 700, color: "#3b332d", transform: `scale(${spring(t - 7.0, 14, 0.6)})`, transformOrigin: "0 50%" }}>
            You're doing great. 💛
          </div>
        )}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={520} size={150} weight={800} color="#3b332d" font={ff} p={endP} tracking={-0.03} />
          <Txt text={c.tagline || "Calmer days and nights."} x={960} y={630} size={48} weight={500} color="#9a8f86" font={ff} p={c01((t - 9.4) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/baby-tracker.wav" on={audio} />
    </AbsoluteFill>
  );
}
