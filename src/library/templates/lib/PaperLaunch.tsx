import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Mark, Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, hash, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { headline: string; features: string; cta: string };

// A cut-paper launch film: layered paper hills slide up with soft drop
// shadows, a folded card unfolds to reveal the mark, three paper tags pop
// up for features, and a paper banner unrolls with the call to action.
export default function PaperLaunch({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const feats = [...list(c.features || "Hand-crafted, Made to last, Ready today"), "New", "New", "New"].slice(0, 3);
  const paper = "#f4efe6";
  const shadow = "drop-shadow(0 14px 10px rgba(60,40,20,0.28))";
  const hills = [pal.a, pal.v, "#e6d9c3", paper];
  const unfold = expInOut(seg(t, 2.0, 1.0));
  const bob = Math.sin(t * 2) * 6;
  const camOut = expInOut(seg(t, 8.0, 0.8));
  const endP = c01((t - 8.6) / 0.8);
  const hillPath = (i: number) => {
    const y0 = 640 + i * 110;
    let d = `M-50,1180 L-50,${y0}`;
    for (let x = 0; x <= 2000; x += 200) d += ` Q${x + 100},${y0 - 80 - hash(i, x) * 90} ${x + 200},${y0}`;
    return d + " L2000,1180 Z";
  };

  return (
    <AbsoluteFill style={{ background: "#d9cdb8", overflow: "hidden", fontFamily: ff }}>
      {/* paper grain */}
      <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)", backgroundSize: "6px 6px" }} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${1 + camOut * 0.2})`, opacity: 1 - camOut }}>
        {/* sun */}
        <div style={{ position: "absolute", left: 1420, top: 140 + (1 - spring(t - 0.2, 10, 0.7)) * 500, width: 220, height: 220, borderRadius: 110, background: "#f2b64a", filter: shadow }} />
        {hills.map((col, i) => (
          <svg key={i} viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: "absolute", inset: 0, filter: shadow, transform: `translateY(${(1 - spring(t - 0.1 - i * 0.18, 12, 0.7)) * 700}px)` }}>
            <path d={hillPath(i)} fill={col} />
          </svg>
        ))}
        {/* folded card */}
        <div style={{ position: "absolute", left: 660, top: 220 + bob, width: 600, height: 420, perspective: 1600, transform: `translateY(${(1 - spring(t - 1.2, 13, 0.7)) * -900}px)` }}>
          <div style={{ position: "absolute", inset: 0, background: paper, borderRadius: 10, filter: shadow, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <div style={{ opacity: unfold, transform: `scale(${0.6 + 0.4 * unfold})` }}>
              <div style={{ position: "relative", width: 200, height: 190 }}>
                <Mark x={100} y={90} size={160} b={b} pal={pal} s={1} />
              </div>
            </div>
            <div style={{ fontSize: 56, fontWeight: 800, color: "#2b2118", opacity: c01((t - 2.8) * 3), letterSpacing: "-0.02em" }}>{nameOf(b)}</div>
          </div>
          {/* the flap folds open from the top */}
          <div style={{ position: "absolute", left: 0, top: 0, width: 600, height: 420, background: "#e9e0d0", borderRadius: 10, transformOrigin: "50% 0%", transform: `rotateX(${unfold * 178}deg)`, backfaceVisibility: "hidden", boxShadow: "inset 0 -10px 20px rgba(0,0,0,0.08)" }} />
        </div>
        {/* feature tags */}
        {feats.map((f, i) => {
          const p = spring(t - 3.6 - i * 0.45, 14, 0.55);
          const x = 330 + i * 520;
          return (
            <div key={i} style={{ position: "absolute", left: x, top: 720, width: 420, height: 130, transformOrigin: "50% 100%", transform: `translateY(${(1 - p) * 400}px) rotate(${(hash(i, 3) - 0.5) * 8}deg)` }}>
              <div style={{ position: "absolute", inset: 0, background: paper, borderRadius: 14, filter: shadow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, fontWeight: 800, color: "#2b2118" }}>{f}</div>
              <div style={{ position: "absolute", left: 30, top: 50, width: 26, height: 26, borderRadius: 13, background: "#d9cdb8" }} />
            </div>
          );
        })}
        {/* banner unroll */}
        <div style={{ position: "absolute", left: 960 - 500, top: 920, width: 1000, height: 110, overflow: "hidden", clipPath: `inset(0 ${(1 - cubicInOut(seg(t, 5.4, 0.9))) * 50}% 0 ${(1 - cubicInOut(seg(t, 5.4, 0.9))) * 50}%)` }}>
          <div style={{ width: "100%", height: "100%", background: pal.v, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, fontWeight: 900, color: pal.onV, letterSpacing: "-0.02em" }}>{c.headline || "Out now, folded with care."}</div>
        </div>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={520} size={150} weight={900} color="#2b2118" font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.cta || "Available today"} x={960} y={640} size={50} weight={700} color={pal.v} font={ff} p={c01((t - 9.0) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/paper-launch.wav" on={audio} />
    </AbsoluteFill>
  );
}
