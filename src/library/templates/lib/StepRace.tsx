import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Phone, Svg, Track, Txt, c01, cubicInOut, expInOut, fmtNum, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { line1: string; line2: string; friends: string; goal: string; tagline: string };

// An emotional step-race promo: a quiet line about a slow morning, then a
// dotted route draws across a map while friends' avatars race along it, a
// phone counter climbs to the goal, confetti at the finish, a warm close.
export default function StepRace({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const friends = [...list(c.friends || "You, Maya, Leo, Sam"), "Friend", "Friend", "Friend", "Friend"].slice(0, 4);
  const goal = Number(c.goal || 10000) || 10000;
  const l1 = c.line1 || "Some mornings, getting out the door is the win.";
  const l2 = c.line2 || "So we made every step count.";
  const intro = expInOut(seg(t, 2.6, 0.6));
  const route = cubicInOut(c01((t - 3.0) / 1.2));
  const race = c01((t - 3.8) / 4.2);
  const endP = c01((t - 9.6) / 0.8);
  const outro = expInOut(seg(t, 9.2, 0.5));
  // route: a gentle S across the map
  const P = (u: number) => ({ x: 140 + u * 1040, y: 560 + Math.sin(u * Math.PI * 2) * 230 - u * 120 });
  const routeD = Array.from({ length: 61 }, (_, i) => {
    const p = P(i / 60);
    return `${i ? "L" : "M"}${p.x},${p.y}`;
  }).join(" ");
  const speeds = [1, 0.92, 0.86, 0.8];
  const colors = [pal.v, pal.a, "#38a3ff", "#f28ab2"];
  const steps = Math.round(goal * cubicInOut(race));

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      {/* quiet intro */}
      {intro < 1 && (
        <Svg style={{ opacity: 1 - intro }}>
          <Txt text={l1} x={960} y={520} size={64} weight={500} color={pal.fg} font={ff} p={c01((t - 0.3) / 1.2)} mode="blur" />
          <Txt text={l2} x={960} y={620} size={64} weight={800} color={pal.v} font={ff} p={c01((t - 1.5) / 0.8)} mode="blur" />
        </Svg>
      )}
      {intro > 0 && (
        <div style={{ position: "absolute", inset: 0, opacity: intro * (1 - outro) }}>
          {/* map */}
          <Svg>
            <rect x={60} y={120} width={1200} height={840} rx={40} fill={pal.card} />
            {Array.from({ length: 9 }, (_, i) => (
              <path key={i} d={`M60,${200 + i * 90} C400,${170 + i * 95} 800,${240 + i * 80} 1260,${190 + i * 92}`} stroke={pal.line} strokeWidth={2} fill="none" />
            ))}
            <path d="M200,960 C320,760 520,820 640,960 Z" fill={pal.card2} />
            <path d={routeD} fill="none" stroke={pal.faint} strokeWidth={10} strokeLinecap="round" strokeDasharray="2 22" pathLength={1000} strokeDashoffset={0} opacity={route} />
            <path d={routeD} fill="none" stroke={pal.v} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={`${cubicInOut(race) * speeds[0]} 2`} />
            {/* finish flag */}
            <g transform={`translate(${P(1).x} ${P(1).y}) scale(${spring(t - 3.6, 14, 0.6)})`}>
              <line x1={0} y1={0} x2={0} y2={-90} stroke={pal.fg} strokeWidth={6} />
              <rect x={0} y={-90} width={60} height={40} fill={pal.fg} />
              <rect x={0} y={-90} width={20} height={20} fill={pal.bg} />
              <rect x={40} y={-90} width={20} height={20} fill={pal.bg} />
              <rect x={20} y={-70} width={20} height={20} fill={pal.bg} />
            </g>
            {friends.map((f, i) => {
              const u = Math.min(1, cubicInOut(race) * speeds[i] + Math.sin(t * 3 + i) * 0.01 * race * (1 - race));
              const p = P(u);
              const s = spring(t - 3.4 - i * 0.12, 14, 0.6);
              return (
                <g key={i} transform={`translate(${p.x} ${p.y - 6 * Math.abs(Math.sin(t * 8 + i))}) scale(${s})`}>
                  <circle r={34} fill={colors[i]} stroke={pal.bg} strokeWidth={6} />
                  <text y={12} textAnchor="middle" fontFamily={ff} fontSize={32} fontWeight={800} fill={pal.bg}>
                    {f[0]}
                  </text>
                </g>
              );
            })}
            {/* confetti at finish */}
            {race >= 1 &&
              Array.from({ length: 40 }, (_, i) => {
                const a = hash(i, 1) * Math.PI * 2;
                const v = 200 + hash(i, 2) * 300;
                const tt = t - 8.0;
                return <rect key={i} x={P(1).x + Math.cos(a) * v * tt} y={P(1).y - 60 + Math.sin(a) * v * tt + 500 * tt * tt} width={14} height={8} fill={colors[i % 4]} transform={`rotate(${i * 40 + tt * 300} ${P(1).x} ${P(1).y})`} opacity={c01(1.6 - tt)} />;
              })}
          </Svg>
          {/* phone with counter */}
          <Phone x={1580} y={540} h={820} pal={pal} s={spring(t - 3.0, 14, 0.7)}>
            <div style={{ position: "absolute", inset: 0, padding: "70px 30px", boxSizing: "border-box", fontFamily: ff }}>
              <div style={{ textAlign: "center", fontSize: 28, fontWeight: 600, color: pal.muted }}>Today</div>
              <svg width={340} height={340} viewBox="0 0 340 340" style={{ display: "block", margin: "20px auto 0" }}>
                <circle cx={170} cy={170} r={140} fill="none" stroke={pal.card2} strokeWidth={26} />
                <circle cx={170} cy={170} r={140} fill="none" stroke={pal.v} strokeWidth={26} strokeLinecap="round" pathLength={1} strokeDasharray={`${steps / goal} 2`} transform="rotate(-90 170 170)" />
                <text x={170} y={182} textAnchor="middle" fontFamily={ff} fontSize={60} fontWeight={900} fill={pal.fg}>{fmtNum(steps)}</text>
                <text x={170} y={222} textAnchor="middle" fontFamily={ff} fontSize={22} fill={pal.muted}>of {fmtNum(goal)} steps</text>
              </svg>
              <div style={{ marginTop: 26 }}>
                {friends.map((f, i) => {
                  const v = Math.round(goal * Math.min(1, cubicInOut(race) * speeds[i]));
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, height: 64 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 20, background: colors[i] }} />
                      <div style={{ fontSize: 26, fontWeight: 700, color: pal.fg }}>{f}</div>
                      <div style={{ marginLeft: "auto", fontSize: 26, color: pal.muted, fontVariantNumeric: "tabular-nums" }}>{fmtNum(v)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Phone>
          {race >= 1 && (
            <Svg>
              <Txt text="Together, you made it." x={660} y={110} size={60} weight={800} color={pal.fg} font={ff} p={c01((t - 8.1) / 0.6)} />
            </Svg>
          )}
        </div>
      )}
      {endP > 0 && (
        <Svg>
          <Txt text={c.tagline || "Every step counts."} x={960} y={520} size={120} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} mode="blur" />
          <Txt text={nameOf(b)} x={960} y={640} size={52} weight={700} color={pal.v} font={ff} p={c01((t - 10.0) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/step-race.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = [lerp];
