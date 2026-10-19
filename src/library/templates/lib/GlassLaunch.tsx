import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Mark, Svg, Track, Txt, c01, expInOut, fontOf, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { headline: string; features: string; cta: string };

// A soft, minimal launch: two coloured orbs drift and blur behind a frosted
// glass card; the card tilts gently with parallax, the logo resolves on it,
// frosted feature chips float up one at a time, and a pill CTA glows.
export default function GlassLaunch({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const feats = [...list(c.features || "Private by default, Works offline, Syncs everywhere"), "Feature", "Feature", "Feature"].slice(0, 3);
  const tiltX = Math.sin(t * 0.8) * 6;
  const tiltY = Math.cos(t * 0.6) * 8;
  const cardIn = spring(t - 0.6, 11, 0.8);
  const outro = expInOut(seg(t, 8.6, 0.5));
  const orb = (cx: number, cy: number, r: number, col: string, ph: number) => (
    <div style={{ position: "absolute", left: cx + Math.sin(t * 0.5 + ph) * 120 - r, top: cy + Math.cos(t * 0.4 + ph) * 80 - r, width: r * 2, height: r * 2, borderRadius: "50%", background: col, filter: "blur(60px)", opacity: 0.85 }} />
  );

  return (
    <AbsoluteFill style={{ background: pal.dark ? "#08080c" : "#f3f3f6", overflow: "hidden", fontFamily: ff, perspective: 1800 }}>
      {orb(700, 420, 300, pal.v, 0)}
      {orb(1250, 640, 260, pal.a, 2)}
      {orb(960, 200, 180, "#38a3ff", 4)}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <div style={{ position: "absolute", left: 960 - 420, top: 540 - 280, width: 840, height: 560, borderRadius: 44, background: pal.dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.45)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", border: "1.5px solid rgba(255,255,255,0.35)", boxShadow: "0 40px 80px rgba(0,0,0,0.2)", transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(${(1 - cardIn) * 300}px) scale(${0.9 + 0.1 * cardIn})`, opacity: c01(cardIn * 2), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "relative", width: 160, height: 160, filter: `blur(${(1 - c01((t - 1.2) / 0.8)) * 20}px)`, opacity: c01((t - 1.2) / 0.5) }}>
            <Mark x={80} y={80} size={140} b={b} pal={pal} />
          </div>
          <div style={{ fontSize: 90, fontWeight: 800, letterSpacing: "-0.04em", color: pal.fg, marginTop: 20, opacity: c01((t - 1.8) / 0.5), filter: `blur(${(1 - c01((t - 1.8) / 0.6)) * 12}px)` }}>{nameOf(b)}</div>
          <div style={{ fontSize: 36, color: pal.muted, marginTop: 8, opacity: c01((t - 2.4) / 0.5) }}>{c.headline || "Quietly powerful."}</div>
        </div>
        {feats.map((f, i) => {
          const s = spring(t - 3.4 - i * 0.5, 13, 0.7);
          const pos = [
            [360, 820],
            [960, 900],
            [1560, 820],
          ][i];
          return (
            <div key={i} style={{ position: "absolute", left: pos[0], top: pos[1] + Math.sin(t * 1.2 + i) * 8, transform: `translate(-50%, ${(1 - s) * 200}px)`, opacity: c01(s * 2), padding: "20px 36px", borderRadius: 40, background: pal.dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.55)", backdropFilter: "blur(20px)", border: "1.5px solid rgba(255,255,255,0.35)", fontSize: 32, fontWeight: 700, color: pal.fg, whiteSpace: "nowrap" }}>
              {f}
            </div>
          );
        })}
        {t > 5.6 && (
          <div style={{ position: "absolute", left: 960, top: 140, transform: `translateX(-50%) scale(${spring(t - 5.6, 14, 0.6)})`, padding: "20px 44px", borderRadius: 40, background: pal.v, color: pal.onV, fontSize: 34, fontWeight: 800, boxShadow: `0 0 ${30 + Math.sin(t * 4) * 12}px ${pal.v}` }}>
            {c.cta || "Available now"}
          </div>
        )}
      </div>
      {outro > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={560} size={150} weight={800} color={pal.fg} font={ff} p={c01((t - 8.9) / 0.6)} tracking={-0.04} mode="blur" />
        </Svg>
      )}
      <Track src="tracks/glass-launch.wav" on={audio} />
    </AbsoluteFill>
  );
}
