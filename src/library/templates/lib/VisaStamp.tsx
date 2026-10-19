import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fontOf, hash, lerp, mix, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { places: string; steps: string; tagline: string };

// A travel-visa promo: a passport opens, stamps slam onto the pages one per
// beat (each a destination), a progress tracker moves from Applied to
// Approved, and a route arc flies across the globe line.
export default function VisaStamp({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const places = [...list(c.places || "Tokyo, Lisbon, Nairobi, Lima, Seoul"), "City", "City", "City", "City", "City"].slice(0, 5);
  const steps = [...list(c.steps || "Applied, Reviewed, Approved"), "Step", "Step", "Step"].slice(0, 3);
  const open = expInOut(seg(t, 0.3, 0.8));
  const stampAt = (i: number) => 1.4 + i * 0.55;
  const prog = cubicInOut(seg(t, 1.4, 3.4));
  const outro = expInOut(seg(t, 7.2, 0.5));
  const endP = c01((t - 7.6) / 0.8);
  const ink = [pal.v, pal.a, "#e5484d", "#3b82f6", pal.fg];
  const page = "#f3efe4";

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* passport */}
        <div style={{ position: "absolute", left: 640, top: 540, width: 0, height: 0, perspective: 2000 }}>
          <div style={{ position: "absolute", left: 0, top: -320, width: 460, height: 640, borderRadius: "6px 22px 22px 6px", background: page, boxShadow: "0 30px 70px rgba(0,0,0,0.4)" }} />
          <div style={{ position: "absolute", left: -460, top: -320, width: 460, height: 640, borderRadius: "22px 6px 6px 22px", background: page, opacity: c01(open * 2), boxShadow: "0 30px 70px rgba(0,0,0,0.4)" }} />
          <div style={{ position: "absolute", left: 0, top: -320, width: 460, height: 640, borderRadius: "6px 22px 22px 6px", background: mix(pal.v, "#000", 0.45), transformOrigin: "0 50%", transform: `rotateY(${-open * 180}deg)`, backfaceVisibility: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#e9d9a6" }}>
            <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "0.2em" }}>PASSPORT</div>
            <div style={{ marginTop: 40, width: 120, height: 120, borderRadius: 60, border: "6px solid #e9d9a6" }} />
          </div>
          {/* stamps */}
          {places.map((p, i) => {
            const at = stampAt(i);
            if (t < at - 0.12) return null;
            const slam = c01((t - at + 0.12) / 0.12);
            const sc = lerp(2.4, 1, slam * slam);
            const x = (i % 2 ? 60 : -400) + hash(i, 1) * 180;
            const y = -270 + i * 112 + hash(i, 2) * 30;
            const rot = (hash(i, 3) - 0.5) * 30;
            const round = i % 2 === 0;
            return (
              <div key={i} style={{ position: "absolute", left: x, top: y, width: round ? 190 : 230, height: round ? 190 : 120, borderRadius: round ? 95 : 14, border: `6px solid ${ink[i]}`, color: ink[i], display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: `rotate(${rot}deg) scale(${sc})`, opacity: slam * 0.9, fontWeight: 900, letterSpacing: "0.06em", mixBlendMode: "multiply" }}>
                <div style={{ fontSize: 30 }}>{p.toUpperCase()}</div>
                <div style={{ fontSize: 16, marginTop: 4 }}>{`${10 + i}·0${(i % 9) + 1}·26`} ✈</div>
              </div>
            );
          })}
        </div>
        {/* tracker */}
        <Svg>
          <line x1={1200} x2={1760} y1={360} y2={360} stroke={pal.card2} strokeWidth={10} strokeLinecap="round" />
          <line x1={1200} x2={lerp(1200, 1760, prog)} y1={360} y2={360} stroke={pal.v} strokeWidth={10} strokeLinecap="round" />
          {steps.map((s, i) => {
            const x = 1200 + i * 280;
            const on = prog >= i / 2 - 0.001;
            return (
              <g key={i}>
                <circle cx={x} cy={360} r={on ? 30 : 22} fill={on ? pal.v : pal.card2} />
                {on && <path d={`M${x - 11},${360} l8,8 l15,-16`} fill="none" stroke={pal.onV} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />}
                <text x={x} y={430} textAnchor="middle" fontFamily={ff} fontSize={30} fontWeight={600} fill={on ? pal.fg : pal.muted}>
                  {s}
                </text>
              </g>
            );
          })}
          {/* route arc */}
          <path d="M1200,760 Q1480,520 1760,760" fill="none" stroke={pal.faint} strokeWidth={4} strokeDasharray="12 14" />
          {(() => {
            const u = cubicInOut(seg(t, 4.2, 2.0));
            const x = (1 - u) * (1 - u) * 1200 + 2 * (1 - u) * u * 1480 + u * u * 1760;
            const y = (1 - u) * (1 - u) * 760 + 2 * (1 - u) * u * 520 + u * u * 760;
            const ang = (Math.atan2(2 * (1 - u) * (520 - 760) + 2 * u * (760 - 520), 2 * (1 - u) * 280 + 2 * u * 280) * 180) / Math.PI;
            return t > 4.0 ? (
              <g transform={`translate(${x} ${y}) rotate(${ang})`}>
                <path d="M-26,-6 L20,-4 L30,0 L20,4 L-26,6 L-20,0Z M-4,-4 L-14,-26 L-6,-26 L8,-4Z M-4,4 L-14,26 L-6,26 L8,4Z" fill={pal.fg} />
              </g>
            ) : null;
          })()}
          <circle cx={1200} cy={760} r={12} fill={pal.v} />
          <circle cx={1760} cy={760} r={12} fill={t > 6.2 ? pal.v : pal.faint} />
          <Txt text={`Visa approved${t > 6.2 ? " ✓" : ""}`} x={1480} y={880} size={44} weight={800} color={t > 6.2 ? pal.v : pal.muted} font={ff} p={c01((t - 5.0) * 2)} mode="fade" />
        </Svg>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Your visa, minus the queue."} x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - 8.0) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/visa-stamp.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = [expOut, spring];
