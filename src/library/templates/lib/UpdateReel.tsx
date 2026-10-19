import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Phone, Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, lerp, nameOf, palette, seg, spring, useT, type Pal } from "../../motion";

type C = { from: string; to: string; changes: string; tagline: string };

// What's new: the version on a phone flips digit by digit from old to new,
// and each change pops out of the screen as a card with a little face that
// reacts (neutral, happy, delighted).
function Face({ x, y, mood, pal, s = 1 }: { x: number; y: number; mood: number; pal: Pal; s?: number }) {
  const smile = lerp(0, 18, mood);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r={40} fill={pal.v} />
      <ellipse cx={-14} cy={-8} rx={6} ry={mood > 0.9 ? 3 : 8} fill={pal.onV} />
      <ellipse cx={14} cy={-8} rx={6} ry={mood > 0.9 ? 3 : 8} fill={pal.onV} />
      <path d={`M-16,12 Q0,${12 + smile} 16,12`} fill="none" stroke={pal.onV} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
}

export default function UpdateReel({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const from = c.from || "1.3";
  const to = c.to || "1.4";
  const changes = [...list(c.changes || "Faster sync, New widgets, Dark mode for everyone"), "Fixes", "Polish", "Speed"].slice(0, 3);
  const flip = c01((t - 1.0) / 0.8);
  const len = Math.max(from.length, to.length);
  const outro = expInOut(seg(t, 7.4, 0.5));
  const endP = c01((t - 7.8) / 0.8);
  const phoneX = lerp(960, 520, expInOut(seg(t, 2.2, 0.8)));

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Phone x={phoneX} y={lerp(1300, 560, expOut(seg(t, 0, 0.8)))} h={860} pal={pal}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 220, textAlign: "center", fontFamily: ff }}>
            <div style={{ fontSize: 30, color: pal.muted, fontWeight: 600 }}>What's new in</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 20 }}>
              {Array.from({ length: len }, (_, i) => {
                const a = from[i] ?? " ";
                const z = to[i] ?? " ";
                const p = c01(flip * len - (len - 1 - i) * 0.4);
                const show = a === z ? a : p < 0.5 ? a : z;
                const rot = a === z ? 0 : p < 0.5 ? p * 180 : (p - 1) * 180;
                return (
                  <div key={i} style={{ width: 92, height: 140, borderRadius: 16, background: pal.card2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 110, fontWeight: 800, color: a !== z && p >= 0.5 ? pal.v : pal.fg, transform: `perspective(400px) rotateX(${rot}deg)` }}>
                    {show}
                  </div>
                );
              })}
            </div>
          </div>
        </Phone>
        {changes.map((ch, i) => {
          const at = 3.0 + i * 1.1;
          const p = spring(t - at, 15, 0.65);
          if (t < at) return null;
          const mood = c01((t - at - 0.3) / 0.6) * (0.4 + i * 0.3);
          return (
            <div key={i} style={{ position: "absolute", left: 960, top: 260 + i * 200, width: 820, height: 160, borderRadius: 32, background: i === 2 ? pal.v : pal.card2, transform: `translateX(${(1 - p) * -380}px) scale(${lerp(0.5, 1, c01(p))})`, opacity: c01(p * 2), display: "flex", alignItems: "center", padding: "0 40px 0 150px", boxSizing: "border-box", fontSize: fit(ch, 600, 50, 700, -0.02, ff), fontWeight: 700, color: i === 2 ? pal.onV : pal.fg, letterSpacing: "-0.02em" }}>
              <svg width={100} height={100} viewBox="-50 -50 100 100" style={{ position: "absolute", left: 30, top: 30 }}>
                <Face x={0} y={0} mood={mood} pal={i === 2 ? { ...pal, v: pal.onV, onV: pal.v } : pal} />
              </svg>
              {ch}
            </div>
          );
        })}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={`${nameOf(b)} ${to}`} x={960} y={530} size={160} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Update now."} x={960} y={650} size={52} weight={500} color={pal.v} font={ff} p={c01((t - 8.2) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/update-reel.wav" on={audio} />
    </AbsoluteFill>
  );
}
