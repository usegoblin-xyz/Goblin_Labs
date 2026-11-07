import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Txt, c01, expInOut, expOut, fit, fontOf, nameOf, palette, seg, spring, useT, alpha } from "../../motion";

type C = { product: string; features: string; cta: string };

// Launch checklist: the product name slams in, three features tick off,
// "Live today" pops, and the brand name resolves.
export default function LaunchChecklist({ brand: b, content: c }: TemplateProps<C>) {
  const { t, W, H } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const product = c.product || "Notewise";
  const features = [...list(c.features || "Records every call, Writes the summary, Sends the follow-ups"), "", ""].slice(0, 3);
  const cta = c.cta || "Live today";
  const intro = expOut(seg(t, 0.1, 0.6));
  const introOut = expInOut(seg(t, 1.8, 0.4));
  const listOut = expInOut(seg(t, 6.2, 0.4));
  const ctaP = spring(t - 6.6, 16, 0.55);
  const endP = c01((t - 8.2) / 0.7);
  const size = fit(product, W - 240, 220, 800, -0.04, ff);

  return (
    <AbsoluteFill style={{ background: "#101010", overflow: "hidden", fontFamily: ff }}>
      <Svg w={W} h={H}>
        {t < 2.3 && <Txt text={product} x={W / 2} y={H / 2 + size * 0.3} size={size} weight={800} color={pal.fg} font={ff} p={intro} out={introOut} mode="scale" tracking={-0.04} />}
        {t > 8.1 && <Txt text={"Goblin"} x={W / 2} y={H / 2 + 50} size={160} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />}
      </Svg>
      {t >= 2.1 && t < 6.7 && (
        <div style={{ position: "absolute", left: W * 0.18, top: H * 0.26, opacity: 1 - listOut }}>
          {features.filter(Boolean).map((f, i) => {
            const at = 2.3 + i * 1.1;
            const p = expOut(seg(t, at, 0.5));
            const tick = spring(t - at - 0.45, 20, 0.5);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 36, marginBottom: 54, opacity: p, transform: `translateX(${(1 - p) * -60}px)` }}>
                <div style={{ width: 84, height: 84, borderRadius: 24, background: tick > 0.05 ? pal.v : pal.card2, color: pal.onV, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, fontWeight: 800, transform: `scale(${0.6 + 0.4 * c01(tick)})` }}>{tick > 0.05 ? "✓" : ""}</div>
                <div style={{ fontSize: 72, fontWeight: 700, color: pal.fg, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>{f}</div>
              </div>
            );
          })}
        </div>
      )}
      {t >= 6.6 && t < 8.2 && (
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%, -50%) scale(${ctaP})`, padding: "36px 80px", borderRadius: 999, background: pal.v, color: pal.onV, fontSize: 110, fontWeight: 800, boxShadow: `0 40px 120px ${alpha(pal.v, 0.4)}`, opacity: 1 - c01((t - 7.9) / 0.3) }}>{cta}</div>
      )}
    </AbsoluteFill>
  );
}
