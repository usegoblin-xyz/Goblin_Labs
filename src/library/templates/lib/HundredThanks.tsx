import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { count: string; message: string; sign: string };

// A thank-you for the first hundred users: avatar dots pop in one by one on a
// scattered field as a counter climbs, then glide into a heart; the heart
// beats once and a handwritten-style note types underneath.
export default function HundredThanks({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const N = 100;
  const label = c.count || "100";
  const fill = c01((t - 0.4) / 3.0);
  const shown = Math.floor(expOut(fill) * N);
  const form = expInOut(seg(t, 3.8, 1.4));
  const beat = 1 + 0.08 * Math.max(0, Math.sin(c01((t - 5.4) / 0.5) * Math.PI)) + 0.05 * Math.max(0, Math.sin(c01((t - 5.9) / 0.4) * Math.PI));
  const msg = c.message || "Thank you for believing early.";
  const typed = msg.slice(0, Math.floor(c01((t - 6.0) / 1.6) * msg.length));
  const outro = expInOut(seg(t, 9.0, 0.5));
  const endP = c01((t - 9.4) / 0.8);
  const cols = [pal.v, pal.a, "#38a3ff", "#f28ab2", "#f2b64a", "#2fbf71"];
  // heart parametric points
  const heart = (i: number) => {
    const a = (i / N) * Math.PI * 2;
    const ring = i % 3; // three concentric outlines for fill
    const k = 1 - ring * 0.28;
    const x = 16 * Math.pow(Math.sin(a), 3);
    const y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
    return { x: 960 + x * 19 * k, y: 430 + y * 19 * k };
  };

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          <g transform={`translate(960 430) scale(${beat}) translate(-960 -430)`}>
            {Array.from({ length: N }, (_, i) => {
              const sx = 120 + hash(i, 1) * 1680;
              const sy = 120 + hash(i, 2) * 760;
              const h = heart(i);
              const d = c01(form * 1.3 - hash(i, 3) * 0.3);
              const x = lerp(sx, h.x, cubicInOut(d));
              const y = lerp(sy, h.y, cubicInOut(d));
              const s = i < shown ? spring(t - 0.4 - (i / N) * 3 * 0.6, 18, 0.5) : 0;
              const r = lerp(24, 16, d);
              return (
                <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
                  <circle r={r} fill={cols[i % 6]} />
                  <circle r={r * 0.36} cy={-r * 0.2} fill="#fff" opacity={0.85} />
                  <path d={`M${-r * 0.55},${r * 0.62} Q0,${r * 0.05} ${r * 0.55},${r * 0.62}`} fill="#fff" opacity={0.85} />
                </g>
              );
            })}
          </g>
        </Svg>
        <div style={{ position: "absolute", left: 0, right: 0, top: lerp(380, 820, form), textAlign: "center", fontSize: lerp(260, 90, form), fontWeight: 900, letterSpacing: "-0.05em", color: pal.fg, fontVariantNumeric: "tabular-nums", opacity: t > 0.3 ? 1 : 0, }}>
          <span style={{ display: "inline-block", padding: "0 50px", borderRadius: 60, background: form < 0.6 ? `${pal.bg}e6` : "transparent" }}>
          {form > 0.3 ? label : Math.min(Number(label) || N, Math.round(expOut(fill) * (Number(label) || N)))}
          <span style={{ fontSize: lerp(90, 40, form), fontWeight: 700, color: pal.muted, letterSpacing: 0, marginLeft: 16 }}>users</span>
          </span>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 960, textAlign: "center", fontFamily: "'Caveat', 'Segoe Script', cursive", fontStyle: "italic", fontSize: 54, color: pal.v }}>
          {typed}
          {t > 6 && t < 7.8 && <span style={{ opacity: Math.floor(t * 3) % 2 }}>|</span>}
        </div>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="Here's to the next thousand." x={960} y={520} size={100} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.sign || `The ${nameOf(b)} team`} x={960} y={630} size={48} weight={600} color={pal.v} font={ff} p={c01((t - 9.8) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/hundred-thanks.wav" on={audio} />
    </AbsoluteFill>
  );
}
