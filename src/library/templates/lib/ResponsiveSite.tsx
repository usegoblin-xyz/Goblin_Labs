import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, kf, lerp, nameOf, palette, seg, useT } from "../../motion";

type C = { headline: string; work: string; clients: string };

// A studio website showreel: one device frame morphs desktop → tablet →
// phone while the site inside reflows live (hero, work grid, client
// marquee) and scrolls; the grid goes 3 → 2 → 1 columns, and the frame
// widens back out to land on the studio name.
export default function ResponsiveSite({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const headline = c.headline || "We make brands move.";
  const work = [...list(c.work || "Northwind, Orbit, Field Notes, Tidal, Loop, Ember"), "Work", "Work", "Work", "Work", "Work", "Work"].slice(0, 6);
  const clients = list(c.clients || "ACME · NOVA · ORBIT · LUMA · KITE · ZEST · ATLAS");
  const W = kf(t, [[0, 1500], [2.6, 1500], [3.4, 900], [5.2, 900], [6.0, 440], [7.6, 440], [8.3, 1500]], cubicInOut);
  const H = kf(t, [[0, 860], [2.6, 860], [3.4, 880], [5.2, 880], [6.0, 900], [7.6, 900], [8.3, 860]], cubicInOut);
  const R = lerp(18, 56, c01((1500 - W) / 1060));
  const cols = W > 1200 ? 3 : W > 700 ? 2 : 1;
  const scroll = kf(t, [[0.8, 0], [2.0, 380], [3.6, 380], [4.6, 800], [6.2, 600], [7.2, 1300], [8.0, 0]], cubicInOut);
  const pad = W * 0.05;
  const tileW = (W - pad * 2 - (cols - 1) * 20) / cols;
  const outro = expInOut(seg(t, 8.6, 0.5));
  const endP = c01((t - 8.4) / 0.8);
  const workCols = [pal.v, pal.a, "#38a3ff", "#f28ab2", "#f2b64a", "#2fbf71"];
  const label = W > 1200 ? "Desktop" : W > 700 ? "Tablet" : "Phone";

  return (
    <AbsoluteFill style={{ background: pal.dark ? "#0b0b0e" : "#ecebe7", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <div style={{ position: "absolute", left: 960 - W / 2, top: 540 - H / 2, width: W, height: H, borderRadius: R, background: "#111", padding: 14, boxSizing: "border-box", boxShadow: "0 40px 80px rgba(0,0,0,0.3)" }}>
          <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: R - 10, overflow: "hidden", background: pal.bg }}>
            <div style={{ transform: `translateY(${-scroll}px)` }}>
              {/* nav */}
              <div style={{ display: "flex", alignItems: "center", padding: `24px ${pad}px`, fontSize: 22, color: pal.fg, fontWeight: 800 }}>
                {nameOf(b)}
                {cols > 1 && <span style={{ marginLeft: "auto", fontWeight: 500, color: pal.muted, fontSize: 18 }}>Work · Studio · Contact</span>}
                {cols === 1 && <span style={{ marginLeft: "auto", fontSize: 26 }}>☰</span>}
              </div>
              {/* hero */}
              <div style={{ padding: `${cols === 1 ? 50 : 80}px ${pad}px`, fontSize: cols === 3 ? 110 : cols === 2 ? 84 : 58, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.95, color: pal.fg }}>{headline}</div>
              {/* work grid */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 20, padding: `0 ${pad}px` }}>
                {work.map((w, i) => (
                  <div key={i} style={{ width: tileW, height: tileW * 0.66, borderRadius: 16, background: workCols[i], position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", left: "15%", top: "20%", width: "40%", height: "40%", borderRadius: i % 2 ? "50%" : 12, background: "rgba(255,255,255,0.35)", transform: `rotate(${t * 20 * (i % 2 ? 1 : -1)}deg)` }} />
                    <div style={{ position: "absolute", left: 16, bottom: 12, fontSize: 22, fontWeight: 800, color: "#fff" }}>{w}</div>
                  </div>
                ))}
              </div>
              {/* clients marquee */}
              <div style={{ marginTop: 60, padding: "30px 0", borderTop: `1px solid ${pal.line}`, borderBottom: `1px solid ${pal.line}`, whiteSpace: "nowrap", overflow: "hidden" }}>
                <div style={{ transform: `translateX(${-(t * 160) % 900}px)`, fontSize: 40, fontWeight: 800, color: pal.muted, letterSpacing: "0.1em" }}>
                  {clients.join(" · ")} · {clients.join(" · ")} · {clients.join(" · ")}
                </div>
              </div>
              <div style={{ padding: `80px ${pad}px 200px`, fontSize: cols === 1 ? 44 : 70, fontWeight: 900, color: pal.v }}>Let's talk →</div>
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 30, textAlign: "center", fontSize: 26, fontWeight: 700, color: pal.muted, letterSpacing: "0.15em" }}>{label.toUpperCase()} · {Math.round(W)}PX</div>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={520} size={160} weight={900} color={pal.fg} font={ff} p={c01((t - 8.8) / 0.6)} tracking={-0.04} />
          <Txt text={headline} x={960} y={630} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 9.1) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/responsive-site.wav" on={audio} />
    </AbsoluteFill>
  );
}
