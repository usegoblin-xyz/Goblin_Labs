import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Box, Svg, Track, Txt, c01, countStat, cubicInOut, expInOut, expOut, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { from: string; to: string; plan: string; price: string; period: string };

// A résumé tool's Pro promo: a messy CV straightens itself line by line,
// weak phrases get struck and rewritten, a score gauge climbs, and the Pro
// plan card flips in with its price.
export default function ResumePro({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const from = Number(c.from || 54);
  const to = Number(c.to || 96);
  const fix = (i: number) => expInOut(seg(t, 1.2 + i * 0.22, 0.5));
  const score = lerp(from, to, cubicInOut(seg(t, 1.4, 3.2)));
  const out = expInOut(seg(t, 5.2, 0.6));
  const plan = expOut(seg(t, 5.6, 0.7));
  const endP = c01((t - 8.6) / 0.6);
  const LINES = 11;
  const gaugeA = Math.PI * (1 - (score - 0) / 100);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - out, transform: `translateX(${-out * 200}px)` }}>
        {/* the document */}
        <Box x={640} y={540} w={680} h={880} r={18} bg={pal.dark ? "#f3f3f1" : "#ffffff"} style={{ boxShadow: "0 40px 90px rgba(0,0,0,0.35)", transform: `rotate(${lerp(-4, 0, fix(0))}deg) translateY(${(1 - expOut(seg(t, 0, 0.7))) * 200}px)` }}>
          <div style={{ position: "absolute", left: 60, top: 60, width: 120, height: 120, borderRadius: 60, background: "#d9d9d6" }} />
          <div style={{ position: "absolute", left: 210, top: 80, width: lerp(260, 300, fix(0)), height: 30, borderRadius: 8, background: "#1b1b1d" }} />
          <div style={{ position: "absolute", left: 210, top: 130, width: 200, height: 18, borderRadius: 6, background: pal.v }} />
          {Array.from({ length: LINES }, (_, i) => {
            const f = fix(i + 1);
            const messyX = (hash(i, 1) - 0.5) * 60;
            const messyR = (hash(i, 2) - 0.5) * 6;
            const weak = i % 3 === 1;
            const w = lerp(280 + hash(i, 3) * 260, i % 4 === 3 ? 360 : 520, f);
            return (
              <div key={i} style={{ position: "absolute", left: 60 + messyX * (1 - f), top: 240 + i * 52, width: w, height: 16, borderRadius: 6, background: weak && f < 0.5 ? "#c9c9c4" : "#2a2a2d", transform: `rotate(${messyR * (1 - f)}deg)`, opacity: 0.9 }}>
                {weak && <div style={{ position: "absolute", left: -6, right: -6, top: 6, height: 4, background: "#e5484d", transform: `scaleX(${c01(f * 2.2)})`, transformOrigin: "0 50%", opacity: 1 - c01((f - 0.5) * 2) }} />}
                {weak && f > 0.5 && <div style={{ position: "absolute", inset: 0, borderRadius: 6, background: pal.v, opacity: 0.85 }} />}
              </div>
            );
          })}
        </Box>
        {/* the gauge */}
        <Svg>
          <path d="M1180,640 A300,300 0 0 1 1780,640" fill="none" stroke={pal.card2} strokeWidth={40} strokeLinecap="round" />
          <path d="M1180,640 A300,300 0 0 1 1780,640" fill="none" stroke={pal.v} strokeWidth={40} strokeLinecap="round" pathLength={1} strokeDasharray={`${score / 100} 2`} />
          <line x1={1480} y1={640} x2={1480 + Math.cos(gaugeA) * 230} y2={640 - Math.sin(gaugeA) * 230} stroke={pal.fg} strokeWidth={8} strokeLinecap="round" />
          <circle cx={1480} cy={640} r={20} fill={pal.fg} />
          <text x={1480} y={790} textAnchor="middle" fontFamily={ff} fontSize={130} fontWeight={800} fill={pal.fg} letterSpacing="-0.04em">
            {Math.round(score)}
          </text>
          <Txt text="Résumé score" x={1480} y={860} size={36} weight={600} color={pal.muted} font={ff} p={c01((t - 0.8) * 2)} mode="fade" />
        </Svg>
      </div>
      {/* the plan */}
      {plan > 0 && (
        <Box x={960} y={540} w={620} h={700} r={44} bg={pal.v} style={{ transform: `perspective(1600px) rotateY(${(1 - plan) * 90}deg) scale(${1 - endP * 0.08})`, opacity: c01(plan * 2) * (1 - c01((t - 8.4) * 3)), padding: 60, boxSizing: "border-box", color: pal.onV }}>
          <div style={{ fontSize: 44, fontWeight: 700 }}>{c.plan || "Pro"}</div>
          <div style={{ marginTop: 30, display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 150, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1 }}>{countStat(c.price || "$9", c01((t - 6.0) / 0.8))}</span>
            <span style={{ fontSize: 36, opacity: 0.8 }}>{c.period || "/month"}</span>
          </div>
          {["Unlimited rewrites", "Score every version", "Every template"].map((f, i) => (
            <div key={f} style={{ marginTop: i ? 20 : 50, fontSize: 34, display: "flex", gap: 16, alignItems: "center", opacity: c01((t - 6.5 - i * 0.2) * 3), transform: `translateX(${(1 - c01((t - 6.5 - i * 0.2) * 3)) * 30}px)` }}>
              <span style={{ width: 34, height: 34, borderRadius: 17, background: pal.onV, color: pal.v, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800 }}>✓</span>
              {f}
            </div>
          ))}
        </Box>
      )}
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={`From ${from} to ${to}. Go Pro.`} x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - 9.0) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/resume-pro.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _s = spring;
