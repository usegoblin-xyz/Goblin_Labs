import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fit, fontOf, hash, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { headline: string; date: string; cta: string };

// A poster that breaks its frame: a framed poster hangs on a wall; the
// camera pushes in, the big circle on the poster rolls out over the frame
// edge, the headline letters spill out past the border in 3D, the glass
// cracks, and everything settles into a full-bleed version of the poster.
export default function PosterBreakout({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const head = (c.headline || "OUT OF BOUNDS").toUpperCase();
  const push = cubicInOut(c01((t - 0.3) / 1.6));
  const roll = cubicInOut(c01((t - 2.0) / 1.0));
  const spill = c01((t - 2.8) / 1.2);
  const crack = c01((t - 2.2) / 0.15);
  const full = expInOut(seg(t, 5.0, 0.9));
  const outro = expInOut(seg(t, 8.4, 0.5));
  // poster rect (in wall space)
  const PW = 560;
  const PH = 780;
  const cam = 1 + push * 0.55;
  const fx = 960 - PW / 2;
  const fy = 540 - PH / 2;
  const letters = head.split("");
  const size = fit(head, PW - 60, 110, 900, -0.03, ff);

  return (
    <AbsoluteFill style={{ background: "#d8d2c8", overflow: "hidden", fontFamily: ff, perspective: 1600 }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* wall texture */}
        <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0 2px, transparent 2px 120px)" }} />
        <div style={{ position: "absolute", inset: 0, transform: `scale(${cam * (1 - full) + full * 1})`, opacity: 1 - full }}>
          {/* frame */}
          <div style={{ position: "absolute", left: fx - 30, top: fy - 30, width: PW + 60, height: PH + 60, background: "#1b1b1b", boxShadow: "0 30px 60px rgba(0,0,0,0.35)" }} />
          <div style={{ position: "absolute", left: fx, top: fy, width: PW, height: PH, background: pal.bg, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 40, top: 40, fontSize: 26, fontWeight: 800, color: pal.fg, letterSpacing: "0.2em" }}>{nameOf(b).toUpperCase()}</div>
            <div style={{ position: "absolute", left: 40, bottom: 40, fontSize: 26, fontWeight: 700, color: pal.muted }}>{c.date || "Opening 12.11"}</div>
            {/* letters still inside */}
            {letters.map((L, i) => (
              <span key={i} style={{ position: "absolute", left: 40 + (i / letters.length) * (PW - 80), top: 520, fontSize: size, fontWeight: 900, color: pal.fg, opacity: spill > 0 ? 0 : 1 }}>
                {L}
              </span>
            ))}
          </div>
          {/* circle rolls out over the frame */}
          <div style={{ position: "absolute", left: fx + 280 - 170 + roll * 620, top: fy + 120 + roll * 60, width: 340, height: 340, borderRadius: "50%", background: pal.v, transform: `rotate(${roll * 300}deg)`, boxShadow: roll > 0 ? `0 ${20 * roll}px ${40 * roll}px rgba(0,0,0,0.3)` : "none", clipPath: roll > 0 ? "none" : `inset(0 0 0 0)` }}>
            <div style={{ position: "absolute", left: 60, top: 150, width: 220, height: 30, borderRadius: 15, background: pal.onV, opacity: 0.6 }} />
          </div>
          {/* spilled letters */}
          {spill > 0 &&
            letters.map((L, i) => {
              const s = spring(t - 2.8 - i * 0.05, 12, 0.55);
              const x0 = fx + 40 + (i / letters.length) * (PW - 80);
              const x1 = 960 + (i / Math.max(1, letters.length - 1) - 0.5) * 1000;
              const y1 = 700 + (hash(i, 1) - 0.5) * 60;
              return (
                <span key={i} style={{ position: "absolute", left: x0 + (x1 - x0) * s, top: fy + 520 + (y1 - fy - 520) * s, fontSize: size * (1 + s * 0.4), fontWeight: 900, color: pal.fg, transform: `rotateY(${(1 - s) * 70}deg) rotate(${(hash(i, 2) - 0.5) * 20 * s}deg)`, textShadow: "0 12px 20px rgba(0,0,0,0.25)" }}>
                  {L}
                </span>
              );
            })}
          {/* glass crack */}
          {crack > 0 && (
            <Svg>
              <g opacity={0.8} stroke="#fff" strokeWidth={2.5} fill="none">
                {Array.from({ length: 9 }, (_, i) => {
                  const a = (i / 9) * Math.PI * 2 + hash(i) * 0.4;
                  const L = (90 + hash(i, 2) * 200) * crack;
                  const ox = fx + PW - 40;
                  const oy = fy + 300;
                  return <path key={i} d={`M${ox},${oy} L${ox + Math.cos(a) * L * 0.5 + 10},${oy + Math.sin(a) * L * 0.5} L${ox + Math.cos(a) * L},${oy + Math.sin(a) * L}`} />;
                })}
              </g>
            </Svg>
          )}
        </div>
        {/* full-bleed version */}
        {full > 0 && (
          <div style={{ position: "absolute", inset: 0, background: pal.bg, clipPath: `circle(${full * 120}% at 70% 40%)` }}>
            <div style={{ position: "absolute", right: 200, top: 120, width: 520, height: 520, borderRadius: "50%", background: pal.v }} />
            <Svg>
              <Txt text={head} x={100} y={880} size={fit(head, 1700, 260, 900, -0.04, ff)} weight={900} color={pal.fg} font={ff} p={1} anchor="start" tracking={-0.04} />
              <Txt text={nameOf(b).toUpperCase()} x={100} y={130} size={40} weight={800} color={pal.fg} font={ff} p={c01((t - 5.6) * 2)} anchor="start" tracking={0.2} mode="fade" />
              <Txt text={`${c.date || "Opening 12.11"} · ${c.cta || "Get tickets"}`} x={100} y={990} size={40} weight={700} color={pal.v} font={ff} p={c01((t - 6.0) * 2)} anchor="start" mode="fade" />
            </Svg>
          </div>
        )}
      </div>
      <Track src="tracks/poster-breakout.wav" on={audio} />
    </AbsoluteFill>
  );
}
