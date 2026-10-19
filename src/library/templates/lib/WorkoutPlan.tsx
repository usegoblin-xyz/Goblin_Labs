import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Phone, Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { exercises: string; reps: string; tagline: string };

// A workout-app promo with punch: hard cuts on the beat between a big rep
// counter slamming numbers, a stick figure doing squats in sync, the phone
// plan with sets ticking off, and a weekly volume chart bar shooting up.
export default function WorkoutPlan({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const ex = [...list(c.exercises || "Back squat, Bench press, Deadlift, Pull-ups"), "Lift", "Lift", "Lift", "Lift"].slice(0, 4);
  const reps = [...list(c.reps || "5×5, 4×8, 3×5, 3×10"), "3×10", "3×10", "3×10", "3×10"].slice(0, 4);
  const beat = 0.5;
  const sq = (Math.sin((t / beat) * Math.PI - Math.PI / 2) + 1) / 2; // 0 up → 1 down
  const rep = Math.min(12, Math.floor(t / (beat * 2)));
  const scene = t < 2.6 ? 0 : t < 5.2 ? 1 : t < 7.2 ? 2 : 3;
  const outro = expInOut(seg(t, 8.8, 0.5));
  const figure = (x: number, y: number, s: number) => {
    const hip = lerp(0, 90, sq);
    const knee = lerp(0, 60, sq);
    return (
      <g transform={`translate(${x} ${y}) scale(${s})`} stroke={pal.fg} strokeWidth={14} strokeLinecap="round" fill="none">
        <circle cx={0} cy={-300 + hip} r={36} fill={pal.fg} />
        <line x1={0} y1={-260 + hip} x2={0} y2={-130 + hip} />
        <line x1={-120} y1={-240 + hip} x2={120} y2={-240 + hip} stroke={pal.v} strokeWidth={18} />
        <line x1={0} y1={-130 + hip} x2={-50 - knee} y2={-60 + hip * 0.4} />
        <line x1={-50 - knee} y1={-60 + hip * 0.4} x2={-40} y2={0} />
        <line x1={0} y1={-130 + hip} x2={50 + knee} y2={-60 + hip * 0.4} />
        <line x1={50 + knee} y1={-60 + hip * 0.4} x2={40} y2={0} />
        <circle cx={-130} cy={-240 + hip} r={34} fill={pal.v} stroke="none" />
        <circle cx={130} cy={-240 + hip} r={34} fill={pal.v} stroke="none" />
      </g>
    );
  };

  return (
    <AbsoluteFill style={{ background: scene === 0 ? pal.v : pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {scene === 0 && (
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 520, fontWeight: 900, color: pal.onV, letterSpacing: "-0.05em", lineHeight: 1, transform: `scale(${1 + (1 - c01((t % (beat * 2)) / 0.15)) * 0.12})`, fontVariantNumeric: "tabular-nums" }}>{rep + 1}</div>
            <div style={{ fontSize: 50, fontWeight: 800, color: pal.onV, letterSpacing: "0.3em", opacity: 0.8 }}>REPS</div>
          </AbsoluteFill>
        )}
        {scene === 1 && (
          <Svg>
            <line x1={0} x2={1920} y1={900} y2={900} stroke={pal.line} strokeWidth={6} />
            {figure(700, 900, 1.6)}
            <Txt text={ex[0].toUpperCase()} x={1400} y={500} size={90} weight={900} color={pal.fg} font={ff} p={c01((t - 2.6) / 0.3)} tracking={-0.02} />
            <Txt text={reps[0]} x={1400} y={610} size={70} weight={700} color={pal.v} font={ff} p={c01((t - 2.8) / 0.3)} />
          </Svg>
        )}
        {scene === 2 && (
          <Phone x={960} y={540} h={940} pal={pal}>
            <div style={{ position: "absolute", inset: 0, padding: "80px 28px", boxSizing: "border-box", fontFamily: ff }}>
              <div style={{ fontSize: 24, color: pal.muted }}>Today · Lower + Push</div>
              <div style={{ fontSize: 42, fontWeight: 900, color: pal.fg, marginBottom: 20 }}>Week 3, Day 2</div>
              {ex.map((e, i) => {
                const done = t > 5.4 + i * 0.4;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, height: 110, marginBottom: 12, padding: "0 20px", borderRadius: 22, background: done ? pal.v : pal.card, color: done ? pal.onV : pal.fg, transform: `scale(${done && t < 5.6 + i * 0.4 ? 1.04 : 1})` }}>
                    <div style={{ width: 44, height: 44, borderRadius: 22, border: `4px solid ${done ? pal.onV : pal.faint}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>{done ? "✓" : ""}</div>
                    <div>
                      <div style={{ fontSize: 28, fontWeight: 800 }}>{e}</div>
                      <div style={{ fontSize: 22, opacity: 0.75 }}>{reps[i]}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Phone>
        )}
        {scene === 3 && (
          <Svg>
            <Txt text="Weekly volume" x={960} y={180} size={56} weight={800} color={pal.fg} font={ff} p={1} />
            {[0.4, 0.5, 0.55, 0.62, 0.7, 0.78, 1].map((v, i) => {
              const h = 520 * v * (i === 6 ? spring(t - 7.5, 10, 0.5) : cubicInOut(c01((t - 7.2 - i * 0.04) / 0.3)));
              return <rect key={i} x={460 + i * 150} y={880 - h} width={110} height={h} rx={14} fill={i === 6 ? pal.v : pal.card2} />;
            })}
            <Txt text="+18%" x={1430} y={330} size={70} weight={900} color={pal.v} font={ff} p={c01((t - 7.8) / 0.3)} mode="scale" />
          </Svg>
        )}
      </div>
      {outro > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={520} size={170} weight={900} color={pal.fg} font={ff} p={c01((t - 9.0) / 0.5)} tracking={-0.04} mode="scale" />
          <Txt text={c.tagline || "Train with a plan."} x={960} y={630} size={48} weight={700} color={pal.v} font={ff} p={c01((t - 9.3) / 0.5)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/workout-plan.wav" on={audio} />
    </AbsoluteFill>
  );
}
