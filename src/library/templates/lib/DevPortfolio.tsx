import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Browser, Cursor, MONO, Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, kf, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { name: string; role: string; projects: string; stack: string };

// A developer portfolio site tour: a terminal runs `deploy`, a browser opens
// the site, the hero types the name, the page scrolls through project cards
// (one is hovered and lifts), a stack strip ticks past, and a contact CTA.
export default function DevPortfolio({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = c.name || nameOf(b);
  const role = c.role || "Full-stack engineer";
  const projects = [...list(c.projects || "Realtime editor, Payments API, Open-source CLI, Mobile app"), "Project", "Project", "Project", "Project"].slice(0, 4);
  const stack = list(c.stack || "TypeScript, React, Go, Postgres, Rust, Kubernetes, Python");
  const cmd = "npm run deploy";
  const typed = cmd.slice(0, Math.floor(c01((t - 0.3) / 0.6) * cmd.length));
  const term = expInOut(seg(t, 1.4, 0.6));
  const bx = 160;
  const by = 90;
  const bw = 1600;
  const bh = 900;
  const scroll = kf(t, [[3.6, 0], [4.6, 620], [6.8, 620], [7.6, 1150]], cubicInOut);
  const heroName = name.slice(0, Math.floor(c01((t - 2.1) / 0.8) * name.length));
  const hover = 2 - 0; // second card hovered
  const hoverP = c01((t - 5.2) / 0.3) * (1 - c01((t - 6.6) / 0.3));
  const cx = kf(t, [[4.6, 1500], [5.2, 1080], [6.6, 1080], [7.8, 960]], cubicInOut);
  const cy = kf(t, [[4.6, 900], [5.2, 640], [6.6, 640], [7.8, 720]], cubicInOut);
  const outro = expInOut(seg(t, 8.8, 0.5));
  const endP = c01((t - 9.2) / 0.8);

  return (
    <AbsoluteFill style={{ background: pal.dark ? pal.bg : "#eceae4", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* terminal */}
        <div style={{ position: "absolute", left: 460, top: 380, width: 1000, padding: 40, borderRadius: 24, background: "#121317", fontFamily: MONO, fontSize: 34, color: "#e6e6e8", transform: `translateY(${term * -700}px) scale(${1 - term * 0.3})`, opacity: 1 - term }}>
          <div>
            <span style={{ color: "#8b8b90" }}>~/site $ </span>
            {typed}
            {t < 1.0 && "▍"}
          </div>
          {t > 1.0 && <div style={{ color: "#2fbf71", marginTop: 10 }}>✓ built in 1.8s · deployed</div>}
        </div>
        {term > 0 && (
          <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - spring(t - 1.5, 14, 0.7)) * 900}px)` }}>
            <Svg>
              <Browser x={bx} y={by} w={bw} h={bh} pal={pal} url={`${name.toLowerCase().replace(/\s+/g, "")}.dev`} />
            </Svg>
            <div style={{ position: "absolute", left: bx, top: by + 70, width: bw, height: bh - 70, overflow: "hidden", borderRadius: "0 0 24px 24px" }}>
              <div style={{ transform: `translateY(${-scroll}px)`, padding: "0 90px" }}>
                {/* hero */}
                <div style={{ height: 600, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontFamily: MONO, fontSize: 30, color: pal.v }}>hello, I'm</div>
                  <div style={{ fontSize: 140, fontWeight: 900, letterSpacing: "-0.04em", color: pal.fg, lineHeight: 1 }}>
                    {heroName}
                    {t < 3.2 && <span style={{ color: pal.v }}>_</span>}
                  </div>
                  <div style={{ fontSize: 44, color: pal.muted, marginTop: 20, opacity: c01((t - 2.9) * 3) }}>{role}</div>
                </div>
                {/* projects */}
                <div style={{ fontSize: 30, fontWeight: 800, color: pal.muted, letterSpacing: "0.15em", marginBottom: 30 }}>SELECTED WORK</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
                  {projects.map((p, i) => {
                    const h = i === hover - 1 ? hoverP : 0;
                    return (
                      <div key={i} style={{ height: 230, borderRadius: 26, background: i === hover - 1 && h > 0.5 ? pal.v : pal.card2, padding: 34, boxSizing: "border-box", transform: `translateY(${-h * 16}px)`, boxShadow: `0 ${h * 30}px ${h * 50}px rgba(0,0,0,${0.25 * h})`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div style={{ fontFamily: MONO, fontSize: 24, color: i === hover - 1 && h > 0.5 ? pal.onV : pal.muted }}>0{i + 1}</div>
                        <div style={{ fontSize: 46, fontWeight: 800, color: i === hover - 1 && h > 0.5 ? pal.onV : pal.fg }}>{p} ↗</div>
                      </div>
                    );
                  })}
                </div>
                {/* stack strip */}
                <div style={{ marginTop: 70, fontSize: 30, fontWeight: 800, color: pal.muted, letterSpacing: "0.15em" }}>STACK</div>
                <div style={{ display: "flex", gap: 20, marginTop: 24, transform: `translateX(${-c01((t - 6.8) / 2) * 300}px)` }}>
                  {[...stack, ...stack].map((s, i) => (
                    <div key={i} style={{ padding: "16px 30px", borderRadius: 40, border: `3px solid ${pal.line}`, fontFamily: MONO, fontSize: 28, color: pal.fg, whiteSpace: "nowrap" }}>
                      {s}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 80, fontSize: 90, fontWeight: 900, letterSpacing: "-0.04em", color: pal.fg }}>
                  Let's build <span style={{ color: pal.v }}>something.</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {t > 4.5 && t < 8.6 && <Cursor x={cx} y={cy} color={pal.fg} size={44} />}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={name} x={960} y={520} size={130} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={role} x={960} y={630} size={48} weight={600} color={pal.v} font={ff} p={c01((t - 9.6) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/dev-portfolio.wav" on={audio} />
    </AbsoluteFill>
  );
}
