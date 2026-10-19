import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, expInOut, expOut, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { heading: string; body: string; url: string; tagline: string };

// Markdown, live: a split editor where each line typed on the left renders
// instantly on the right (heading, bold, list, code), then a share link is
// copied and the preview lifts out as a page.
export default function MarkdownLive({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const heading = c.heading || "Launch notes";
  const body = c.body || "Ship small, ship often.";
  const url = c.url || "md.link/launch";
  const lines = [`# ${heading}`, "", `**${body}**`, "", "- Write in markdown", "- See it instantly", "- Share one link", "", "```", "npm run ship", "```"];
  const CPS = 30;
  const starts: number[] = [];
  let acc = 0.4;
  lines.forEach((l) => {
    starts.push(acc);
    acc += Math.max(0.12, l.length / CPS) + 0.08;
  });
  const typedLen = (i: number) => Math.max(0, Math.floor((t - starts[i]) * CPS));
  const done = (i: number) => typedLen(i) >= lines[i].length;
  const share = c01((t - 6.6) / 0.3);
  const lift = expInOut(seg(t, 7.4, 0.9));
  const endP = c01((t - 8.6) / 0.8);
  const red = (i: number) => done(i) && t > starts[i];

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - c01((t - 8.4) * 3) }}>
        {/* editor */}
        <div style={{ position: "absolute", left: 100, top: 120, width: 820, height: 840, borderRadius: 26, background: pal.dark ? "#0f1013" : "#17181c", padding: 40, boxSizing: "border-box", fontFamily: MONO, fontSize: 32, lineHeight: 1.6, color: "#e6e6e8", opacity: 1 - lift, transform: `translateX(${-lift * 300}px)` }}>
          {lines.map((l, i) => {
            const s = l.slice(0, typedLen(i));
            const col = l.startsWith("#") ? pal.a : l.startsWith("**") ? "#ffd479" : l.startsWith("-") ? "#8fb4ff" : l.startsWith("```") || i === 9 ? "#9be19b" : "#e6e6e8";
            return (
              <div key={i} style={{ minHeight: 51, color: col, whiteSpace: "pre" }}>
                {t >= starts[i] ? s : ""}
                {t >= starts[i] && !done(i) && Math.floor(t * 4) % 2 === 0 && <span style={{ background: "#e6e6e8", color: "transparent" }}>_</span>}
              </div>
            );
          })}
        </div>
        {/* preview */}
        <div style={{ position: "absolute", left: lerp(1000, 460, lift), top: lerp(120, 80, lift), width: lerp(820, 1000, lift), height: lerp(840, 920, lift), borderRadius: 26, background: pal.dark ? "#f7f7f5" : "#ffffff", padding: 56, boxSizing: "border-box", color: "#141416", boxShadow: "0 30px 80px rgba(0,0,0,0.35)" }}>
          {red(0) && <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: "-0.03em", transform: `scale(${lerp(0.9, 1, spring(t - starts[1], 20, 0.7))})`, transformOrigin: "0 50%" }}>{heading}</div>}
          {red(2) && <div style={{ marginTop: 26, fontSize: 40, fontWeight: 800 }}>{body}</div>}
          {[4, 5, 6].map((i) =>
            red(i) ? (
              <div key={i} style={{ marginTop: i === 4 ? 30 : 12, fontSize: 36, display: "flex", gap: 18, alignItems: "center" }}>
                <span style={{ width: 12, height: 12, borderRadius: 6, background: pal.v }} />
                {lines[i].slice(2)}
              </div>
            ) : null,
          )}
          {red(10) && <div style={{ marginTop: 34, padding: "22px 30px", borderRadius: 16, background: "#141416", color: "#9be19b", fontFamily: MONO, fontSize: 32 }}>$ npm run ship</div>}
        </div>
        {/* share bar */}
        {share > 0 && (
          <div style={{ position: "absolute", left: 960, top: 990, transform: `translateX(-50%) scale(${spring(t - 6.6, 16, 0.6)})`, display: "flex", alignItems: "center", gap: 20, padding: "18px 26px", borderRadius: 40, background: pal.card2, fontFamily: MONO, fontSize: 30, color: pal.fg, whiteSpace: "nowrap" }}>
            {url}
            <span style={{ padding: "10px 22px", borderRadius: 26, background: t > 7.0 ? pal.v : pal.fg, color: t > 7.0 ? pal.onV : pal.bg, fontFamily: ff, fontWeight: 700, fontSize: 24 }}>{t > 7.0 ? "Copied" : "Copy link"}</span>
          </div>
        )}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Markdown in. Page out."} x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - 9.0) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/markdown-live.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = expOut;
