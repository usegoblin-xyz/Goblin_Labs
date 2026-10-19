import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, countStat, expInOut, expOut, fit, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";
import { Blob } from "./MascotReel";

type C = { reward: string; link: string; headline: string; cta: string };

// A referral promo starring two original blob characters: one copies an
// invite link, throws it like a paper plane, the friend catches it, both
// light up and a credit counter rains coins for each of them.
export default function ReferralPromo({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const reward = c.reward || "$20";
  const link = c.link || "goblin.app/r/ava";
  const headline = c.headline || "Invite a friend. You both get";
  const throwP = c01((t - 3.0) / 1.2);
  const caught = t > 4.2;
  const counter = expInOut(seg(t, 4.6, 1.4));
  const outro = expInOut(seg(t, 7.6, 0.5));
  const endP = c01((t - 8.0) / 0.8);
  const AX = 460;
  const BX = 1460;
  const GY = 820;
  const planeX = lerp(AX + 100, BX - 90, throwP);
  const planeY = lerp(GY - 220, GY - 200, throwP) - 300 * Math.sin(throwP * Math.PI);
  const jumpA = caught ? Math.abs(Math.sin((t - 4.2) * 7)) * 40 * Math.exp(-(t - 4.6) * 1.2) : 0;
  const jumpB = caught ? Math.abs(Math.sin((t - 4.25) * 7)) * 50 * Math.exp(-(t - 4.6) * 1.2) : 0;
  const hs = fit(headline, 1500, 72, 800, -0.03, ff);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          <Txt text={headline} x={960} y={170} size={hs} weight={800} color={pal.fg} font={ff} p={c01((t - 0.3) / 0.8)} tracking={-0.03} />
          <line x1={140} x2={1780} y1={GY + 6} y2={GY + 6} stroke={pal.line} strokeWidth={3} />
          <Blob x={AX} y={GY - jumpA} s={1.4 * lerp(0.6, 1, spring(t - 0.2, 14, 0.6))} squash={t > 2.8 && t < 3.1 ? 0.6 : 0} look={t < 4.2 ? 1 : 0.5} wave={t > 2.6 && t < 3.2 ? 1 : 0} pal={pal} />
          <Blob x={BX} y={GY - jumpB} s={1.4 * lerp(0.6, 1, spring(t - 0.5, 14, 0.6))} look={t < 4.2 ? -1 : -0.5} blink={t > 1.8 && t < 1.9 ? 1 : 0} wave={caught ? 1 : 0} pal={{ ...pal, v: pal.a }} />
          {/* paper plane */}
          {throwP > 0 && !caught && (
            <g transform={`translate(${planeX} ${planeY}) rotate(${lerp(-20, 20, throwP)})`}>
              <path d="M-40,-14 L44,0 L-40,14 L-24,0Z" fill={pal.fg} />
              <path d="M-24,0 L44,0 L-30,22Z" fill={pal.faint} />
            </g>
          )}
          {/* coins */}
          {caught &&
            Array.from({ length: 30 }, (_, i) => {
              const t0 = 4.4 + hash(i, 1) * 1.6;
              const u = (t - t0) / 1.1;
              if (u < 0 || u > 1) return null;
              const side = i % 2 ? AX : BX;
              const x = side + (hash(i, 2) - 0.5) * 300;
              const y = lerp(260, GY - 40, u * u);
              return (
                <g key={i} transform={`translate(${x} ${y}) scale(${Math.abs(Math.cos(t * 8 + i))} 1)`}>
                  <circle r={22} fill={pal.v} />
                  <circle r={14} fill="none" stroke={pal.onV} strokeWidth={3} opacity={0.6} />
                </g>
              );
            })}
        </Svg>
        {/* the link card */}
        <div style={{ position: "absolute", left: AX - 60, top: GY - 520, transform: `translate(-50%, 0) scale(${spring(t - 1.2, 16, 0.6) * (1 - c01((t - 3.0) * 4))})`, padding: "22px 30px", borderRadius: 24, background: pal.card2, display: "flex", alignItems: "center", gap: 22, whiteSpace: "nowrap", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
          <span style={{ fontFamily: MONO, fontSize: 30, color: pal.fg }}>{link}</span>
          <span style={{ padding: "10px 20px", borderRadius: 14, background: t > 2.2 ? pal.v : pal.fg, color: t > 2.2 ? pal.onV : pal.bg, fontSize: 24, fontWeight: 700 }}>{t > 2.2 ? "Copied" : "Copy"}</span>
        </div>
        {/* reward counters */}
        {caught &&
          [AX, BX].map((x, i) => (
            <div key={i} style={{ position: "absolute", left: x, top: 330, transform: `translateX(-50%) scale(${spring(t - 4.5 - i * 0.1, 16, 0.55)})`, fontSize: 110, fontWeight: 800, letterSpacing: "-0.04em", color: pal.fg, fontVariantNumeric: "tabular-nums" }}>
              +{countStat(reward, counter)}
            </div>
          ))}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={`${reward} for you, ${reward} for them`} x={960} y={500} size={fit(`${reward} for you, ${reward} for them`, 1500, 110, 800, -0.04, ff)} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <g transform={`translate(960 640) scale(${spring(t - 8.5, 16, 0.6)})`}>
            <rect x={-230} y={-50} width={460} height={100} rx={50} fill={pal.v} />
            <text x={0} y={16} textAnchor="middle" fontFamily={ff} fontSize={40} fontWeight={700} fill={pal.onV}>
              {c.cta || "Invite friends"}
            </text>
          </g>
          <Txt text={nameOf(b)} x={960} y={790} size={44} weight={600} color={pal.muted} font={ff} p={c01((t - 8.7) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/referral-promo.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = expOut;
