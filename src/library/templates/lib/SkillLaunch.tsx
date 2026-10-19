import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { MONO, Svg, Txt, Track, alpha, c01, cubicInOut, expInOut, expOut, fontOf, kf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { command: string; skill: string; ask: string; result: string; tagline: string };

// Developer launch: a terminal installs a skill, the agent is asked for
// something, code streams, and the terminal folds open into the rendered
// result, ending on the name and one line.
export default function SkillLaunch({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const term = pal.dark ? "#0c0c0e" : "#111114";
  const tfg = "#e8e8e3";
  const cmd = c.command || "npx skills add motion";
  const ask = c.ask || "> make a launch video for my app";
  const skill = c.skill || "motion";
  const typed = (s: string, a: number, cps = 26) => s.slice(0, Math.max(0, Math.floor((t - a) * cps)));
  const lines: [number, string, string][] = [
    [0.4, "$ " + typed(cmd, 0.4), tfg],
    [1.7, "  ✓ fetched skill " + skill, "#7ee787"],
    [1.95, "  ✓ 12 templates, 4 fonts, 1 brand kit", "#7ee787"],
    [2.2, "  ✓ ready in 1.2s", "#7ee787"],
    [2.9, typed(ask, 2.9, 30), tfg],
  ];
  const code = ["const film = scene(brand)", "  .title(name, { rise: 0.4 })", "  .cards(features, { stagger: 0.08 })", "  .camera({ push: 1.04 })", "  .end(logo)", "render(film, { fps: 60 })"];
  const codeStart = 4.4;
  const unfold = expInOut(seg(t, 7.2, 0.9));
  const termW = lerp(1440, 1700, unfold);
  const termH = lerp(820, 900, unfold);
  const result = unfold > 0.5;
  const endT = 11.0;
  const endIn = expOut(seg(t, endT, 0.6));
  const camZ = kf(t, [[0, 1.12], [4.4, 1.0], [7.0, 1.0], [8.2, 1.0]], cubicInOut);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${camZ})`, opacity: 1 - expInOut(seg(t, endT - 0.4, 0.5)) }}>
        <div style={{ position: "absolute", left: 960 - termW / 2, top: 540 - termH / 2, width: termW, height: termH, borderRadius: 22, background: result ? pal.card : term, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.3)" }}>
          <div style={{ height: 46, display: "flex", alignItems: "center", gap: 9, padding: "0 18px", background: result ? pal.card2 : "#1a1a1d" }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((col) => <div key={col} style={{ width: 13, height: 13, borderRadius: 7, background: col }} />)}
            <div style={{ marginLeft: 16, fontFamily: MONO, fontSize: 16, color: result ? pal.muted : "#8b8b90" }}>{result ? "preview — " + nameOf(b) : "~/app — zsh"}</div>
          </div>
          {!result && (
            <div style={{ padding: "34px 44px", fontFamily: MONO, fontSize: 34, lineHeight: 1.6, opacity: 1 - unfold * 2 }}>
              {lines.map(([a, s, col], i) => (t >= a ? <div key={i} style={{ color: col, whiteSpace: "pre" }}>{s}</div> : null))}
              {t >= codeStart && (
                <div style={{ marginTop: 18, padding: "18px 22px", borderRadius: 14, background: "#18181b" }}>
                  {code.map((l, i) => {
                    const a = codeStart + i * 0.35;
                    if (t < a) return null;
                    const shown = l.slice(0, Math.floor((t - a) * 60));
                    return (
                      <div key={i} style={{ whiteSpace: "pre", color: "#d2d2cc" }}>
                        {shown.split(/(\b(?:const|render|scene)\b|"[^"]*"|\d+(?:\.\d+)?)/).map((tok, k) => (
                          <span key={k} style={{ color: /^(const|render|scene)$/.test(tok) ? pal.v : /^\d/.test(tok) ? "#f2cc60" : undefined }}>{tok}</span>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
              {Math.floor(t * 2.5) % 2 === 0 && t < codeStart && <span style={{ display: "inline-block", width: 14, height: 30, background: tfg, verticalAlign: "-6px" }} />}
            </div>
          )}
          {result && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 46, bottom: 0, opacity: (unfold - 0.5) * 2 }}>
              {/* the rendered result: a title card building itself */}
              <div style={{ position: "absolute", left: 80, top: 80, right: 80, bottom: 80, borderRadius: 20, background: pal.bg, overflow: "hidden" }}>
                <Svg w={1540} h={694}>
                  <Txt text={c.result || "Launch day, on brand"} x={770} y={330} size={96} weight={800} color={pal.fg} font={ff} p={c01((t - 7.8) / 0.9)} />
                </Svg>
                {[0, 1, 2].map((i) => {
                  const e = spring(t - 8.6 - i * 0.12, 16, 0.75);
                  return <div key={i} style={{ position: "absolute", left: 260 + i * 360, top: 420, width: 320, height: 150, borderRadius: 20, background: [pal.v, pal.card2, pal.a][i], transform: `translateY(${(1 - e) * 80}px)`, opacity: c01(e * 2) }} />;
                })}
                <div style={{ position: "absolute", left: 0, bottom: 0, height: 6, width: `${c01((t - 7.8) / 3) * 100}%`, background: pal.v }} />
              </div>
            </div>
          )}
        </div>
      </div>
      {t > endT - 0.2 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: endIn }}>
          <div style={{ fontFamily: MONO, fontSize: 30, color: pal.v, marginBottom: 18 }}>skills add {skill}</div>
          <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: "-0.045em", color: pal.fg, transform: `translateY(${(1 - endIn) * 30}px)` }}>{nameOf(b)}</div>
          <div style={{ fontSize: 38, color: pal.muted, marginTop: 10 }}>{c.tagline || "Your agent, now a motion designer."}</div>
          <div style={{ marginTop: 34, height: 4, width: 240, borderRadius: 2, background: alpha(pal.fg, 0.1) }}>
            <div style={{ height: 4, width: `${c01((t - endT) / 1.6) * 100}%`, background: pal.v, borderRadius: 2 }} />
          </div>
        </div>
      )}
      <Track src="tracks/skill-launch.wav" on={audio} />
    </AbsoluteFill>
  );
}
