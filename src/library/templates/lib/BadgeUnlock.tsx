import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Phone, Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fontOf, hash, lerp, mix, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { badge: string; detail: string; tagline: string };

// A premium badge unlock on a phone: a dim, locked medallion charges with a
// progress ring, cracks its lock, flips like a coin to reveal the gold face,
// and bursts gold particles and rays before the badge title lands.
export default function BadgeUnlock({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const gold = "#f5c451";
  const gold2 = "#c98a1b";
  const charge = cubicInOut(seg(t, 0.8, 1.8));
  const lockPop = c01((t - 2.7) / 0.3);
  const flip = expInOut(seg(t, 3.0, 1.0));
  const burst = c01((t - 3.8) / 1.6);
  const title = spring(t - 4.2, 15, 0.6);
  const outro = expInOut(seg(t, 7.4, 0.5));
  const endP = c01((t - 7.8) / 0.8);
  const R = 170;
  const scaleX = Math.cos(flip * Math.PI * 2);
  const revealed = flip > 0.25;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Phone x={960} y={560} h={940} pal={pal} screen={mix(pal.bg, "#000", 0.3)}>
          <svg viewBox="0 0 460 920" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
            {/* rays */}
            {revealed &&
              Array.from({ length: 16 }, (_, i) => {
                const a = (i / 16) * Math.PI * 2 + t * 0.4;
                return <path key={i} d={`M230,380 L${230 + Math.cos(a - 0.08) * 600},${380 + Math.sin(a - 0.08) * 600} L${230 + Math.cos(a + 0.08) * 600},${380 + Math.sin(a + 0.08) * 600}Z`} fill={gold} opacity={0.08 * c01((t - 3.6) * 2)} />;
              })}
            {/* charge ring */}
            <circle cx={230} cy={380} r={R + 26} fill="none" stroke={pal.card2} strokeWidth={10} opacity={1 - c01((t - 3.0) * 3)} />
            <circle cx={230} cy={380} r={R + 26} fill="none" stroke={gold} strokeWidth={10} strokeLinecap="round" transform="rotate(-90 230 380)" pathLength={1} strokeDasharray={`${charge} 2`} opacity={1 - c01((t - 3.0) * 3)} />
            {/* medallion */}
            <g transform={`translate(230 380) scale(${scaleX * (1 + 0.08 * Math.sin(flip * Math.PI))} 1)`}>
              <circle r={R} fill={revealed ? gold : "#3a3a40"} />
              <circle r={R - 18} fill={revealed ? gold2 : "#2c2c31"} />
              <circle r={R - 30} fill={revealed ? gold : "#34343a"} />
              {revealed ? (
                <path d="M0,-80 L22,-26 L80,-22 L36,14 L50,72 L0,40 L-50,72 L-36,14 L-80,-22 L-22,-26Z" fill={gold2} />
              ) : (
                <g opacity={1 - lockPop}>
                  <rect x={-40} y={-10} width={80} height={64} rx={10} fill="#55555c" />
                  <path d={`M-26,-10 V-34 A26,26 0 0 1 26,-34 V${-10 - lockPop * 30}`} fill="none" stroke="#55555c" strokeWidth={12} />
                </g>
              )}
              {revealed && <ellipse cx={-50} cy={-70} rx={40} ry={18} fill="#fff" opacity={0.35} transform="rotate(-30)" />}
            </g>
            {/* particles */}
            {burst > 0 &&
              Array.from({ length: 60 }, (_, i) => {
                const a = hash(i, 1) * Math.PI * 2;
                const v = 200 + hash(i, 2) * 380;
                const x = 230 + Math.cos(a) * v * expOut(burst);
                const y = 380 + Math.sin(a) * v * expOut(burst) + burst * burst * 200;
                return <rect key={i} x={x} y={y} width={8} height={14} rx={2} fill={i % 3 ? gold : "#fff"} opacity={1 - burst} transform={`rotate(${hash(i, 3) * 360 + burst * 400} ${x} ${y})`} />;
              })}
            <text x={230} y={660} textAnchor="middle" fontFamily={ff} fontSize={22} fill={gold} letterSpacing="0.2em" opacity={c01(title * 2)}>
              BADGE UNLOCKED
            </text>
            <text x={230} y={720} textAnchor="middle" fontFamily={ff} fontSize={46} fontWeight={800} fill="#fff" opacity={c01(title * 2)} transform={`translate(0 ${(1 - c01(title)) * 30})`}>
              {c.badge || "Early Bird"}
            </text>
            <text x={230} y={765} textAnchor="middle" fontFamily={ff} fontSize={22} fill="rgba(255,255,255,0.6)" opacity={c01((t - 4.6) * 3)}>
              {c.detail || "Joined in the first week"}
            </text>
            {t < 2.7 && (
              <text x={230} y={660} textAnchor="middle" fontFamily={ff} fontSize={26} fill="rgba(255,255,255,0.6)">
                {Math.round(charge * 100)}%
              </text>
            )}
          </svg>
        </Phone>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Progress worth celebrating."} x={960} y={650} size={50} weight={500} color={gold} font={ff} p={c01((t - 8.2) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/badge-unlock.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = lerp;
