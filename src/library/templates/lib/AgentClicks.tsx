import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Browser, Cursor, MONO, Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, kf, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { site: string; goal: string; tagline: string };

// A browser agent at work: the goal types into a terminal, then a ghost
// cursor drives a shop site on its own (search, pick a result, fill the
// form, confirm) while the terminal logs each step with a tick.
export default function AgentClicks({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const site = c.site || "shop.example";
  const goal = c.goal || "Order a blue notebook under $20";
  const goalTyped = goal.slice(0, Math.floor(c01((t - 0.3) / 1.0) * goal.length));
  // cursor waypoints in screen space
  const cx = kf(t, [[1.6, 1200], [2.2, 760], [3.4, 760], [3.9, 520], [5.0, 520], [5.5, 700], [6.6, 700], [7.1, 1020]], cubicInOut);
  const cy = kf(t, [[1.6, 900], [2.2, 300], [3.4, 300], [3.9, 520], [5.0, 520], [5.5, 700], [6.6, 700], [7.1, 860]], cubicInOut);
  const clicks = [2.3, 3.95, 5.55, 7.15];
  const press = Math.max(...clicks.map((k) => Math.max(0, 1 - Math.abs(t - k) * 8)));
  const page = t < 3.95 ? 0 : t < 7.15 ? 1 : 2;
  const query = "blue notebook".slice(0, Math.floor(c01((t - 2.4) / 0.8) * 13));
  const steps = ["open " + site, "search “blue notebook”", "pick result under $20", "fill shipping form", "confirm order"];
  const stepAt = [1.4, 3.2, 3.95, 6.2, 7.15];
  const outro = expInOut(seg(t, 8.6, 0.5));
  const endP = c01((t - 9.0) / 0.8);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Browser x={720} y={560} w={1160} h={860} pal={pal} url={site}>
          {page === 0 && (
            <div style={{ padding: 50 }}>
              <div style={{ fontSize: 50, fontWeight: 800, color: pal.fg }}>Find anything</div>
              <div style={{ marginTop: 30, width: 760, height: 80, borderRadius: 40, background: pal.card2, display: "flex", alignItems: "center", padding: "0 30px", fontSize: 30, color: pal.fg, boxShadow: t > 2.3 ? `0 0 0 4px ${pal.v}` : undefined }}>{query || <span style={{ color: pal.muted }}>Search</span>}</div>
              <div style={{ marginTop: 40, display: "flex", gap: 24 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ width: 300, height: 360, borderRadius: 20, background: pal.card2, opacity: t > 3.2 ? 1 : 0.4 }}>
                    <div style={{ height: 200, borderRadius: "20px 20px 0 0", background: ["#3b82f6", pal.a, pal.faint][i] }} />
                    <div style={{ margin: 20, height: 18, width: "70%", borderRadius: 9, background: pal.fg, opacity: 0.8 }} />
                    <div style={{ margin: "0 20px", fontSize: 28, fontWeight: 800, color: pal.fg }}>${[14, 32, 26][i]}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {page === 1 && (
            <div style={{ padding: 50 }}>
              <div style={{ fontSize: 44, fontWeight: 800, color: pal.fg }}>Shipping</div>
              {["Name", "Address", "City"].map((f, i) => {
                const fill = c01((t - 5.6 - i * 0.3) / 0.3);
                const val = ["Ava Chen", "12 Harbor St", "Lisbon"][i];
                return (
                  <div key={f} style={{ marginTop: 26 }}>
                    <div style={{ fontSize: 22, color: pal.muted }}>{f}</div>
                    <div style={{ marginTop: 8, width: 760, height: 70, borderRadius: 16, background: pal.card2, display: "flex", alignItems: "center", padding: "0 24px", fontSize: 28, color: pal.fg }}>{val.slice(0, Math.floor(fill * val.length))}</div>
                  </div>
                );
              })}
              <div style={{ position: "absolute", left: 300, top: 620, padding: "20px 50px", borderRadius: 40, background: pal.v, color: pal.onV, fontSize: 30, fontWeight: 800 }}>Place order</div>
            </div>
          )}
          {page === 2 && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 160, height: 160, borderRadius: 80, background: pal.v, color: pal.onV, fontSize: 90, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${spring(t - 7.2, 14, 0.5)})` }}>✓</div>
              <div style={{ marginTop: 30, fontSize: 50, fontWeight: 800, color: pal.fg }}>Order placed</div>
            </div>
          )}
        </Browser>
        {t > 1.6 && t < 8.6 && <Cursor x={cx} y={cy} press={press} color={pal.v} size={48} />}
        {/* terminal */}
        <div style={{ position: "absolute", left: 1350, top: 130, width: 500, height: 860, borderRadius: 24, background: pal.dark ? "#0f1013" : "#17181c", padding: 30, boxSizing: "border-box", fontFamily: MONO, fontSize: 24, color: "#e6e6e8", lineHeight: 1.5 }}>
          <div style={{ color: "#8b8b90" }}>goal</div>
          <div style={{ color: pal.a, minHeight: 72 }}>
            {goalTyped}
            {t < 1.4 && "▍"}
          </div>
          <div style={{ marginTop: 20, color: "#8b8b90" }}>steps</div>
          {steps.map((s, i) =>
            t > stepAt[i] ? (
              <div key={i} style={{ marginTop: 10, display: "flex", gap: 12, opacity: c01((t - stepAt[i]) * 4) }}>
                <span style={{ color: t > stepAt[i] + 0.4 ? "#2fbf71" : "#f5a524" }}>{t > stepAt[i] + 0.4 ? "✓" : "…"}</span>
                <span>{s}</span>
              </div>
            ) : null,
          )}
          {t > 7.6 && <div style={{ marginTop: 30, color: "#2fbf71" }}>done in 6.1s</div>}
        </div>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="Give a site. Write a goal." x={960} y={500} size={100} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={`${nameOf(b)} clicks the rest.`} x={960} y={620} size={56} weight={600} color={pal.v} font={ff} p={c01((t - 9.4) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/agent-clicks.wav" on={audio} />
    </AbsoluteFill>
  );
}
