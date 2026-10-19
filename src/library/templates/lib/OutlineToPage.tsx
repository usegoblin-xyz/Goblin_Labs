import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { title: string; sections: string; tagline: string };

// Plain-text outline to web page: on the left a monospace outline types
// out (* headings, ** subheadings, - bullets, a TODO); on the right each
// line renders as styled HTML the moment it's typed, with a little
// connecting arc per line; a theme switch then re-skins the page.
export default function OutlineToPage({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const title = c.title || "Field Notes";
  const sections = [...list(c.sections || "Why plain text, How it renders, What's next"), "Section", "Section", "Section"].slice(0, 3);
  const src: [string, string][] = [
    ["#+TITLE: " + title, "title"],
    ["* " + sections[0], "h1"],
    ["- Notes last forever", "li"],
    ["- Any editor works", "li"],
    ["* " + sections[1], "h1"],
    ["** One file, one page", "h2"],
    ["- Headings become sections", "li"],
    ["* TODO " + sections[2], "todo"],
  ];
  const at = (i: number) => 0.4 + i * 0.6;
  const theme = t > 5.8;
  const themeP = cubicInOut(c01((t - 5.8) / 0.5));
  const outro = expInOut(seg(t, 8.4, 0.5));
  const endP = c01((t - 8.8) / 0.8);
  const pageBg = theme ? "#14161c" : "#ffffff";
  const pageFg = theme ? "#f2f2f2" : "#16181d";
  const accent = theme ? pal.a : pal.v;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* source */}
        <div style={{ position: "absolute", left: 80, top: 120, width: 760, height: 840, borderRadius: 24, background: "#0f1013", padding: 40, boxSizing: "border-box", fontFamily: MONO, fontSize: 30, lineHeight: 1.9, color: "#d8d8de" }}>
          <div style={{ fontSize: 22, color: "#6b6b75", marginBottom: 16 }}>notes.org</div>
          {src.map(([line, kind], i) => {
            const n = Math.floor(c01((t - at(i)) / 0.4) * line.length);
            if (t < at(i)) return null;
            const col = kind === "title" ? "#9da5b4" : kind === "h1" ? "#8fb4ff" : kind === "h2" ? "#7fd1b9" : kind === "todo" ? "#f2b64a" : "#d8d8de";
            return (
              <div key={i} style={{ color: col, whiteSpace: "pre" }}>
                {line.slice(0, n)}
                {n < line.length && <span style={{ color: pal.v }}>▍</span>}
              </div>
            );
          })}
        </div>
        {/* arrow */}
        <Svg>
          <path d="M880,540 L1020,540" stroke={pal.muted} strokeWidth={6} strokeLinecap="round" />
          <path d="M1000,520 L1024,540 L1000,560" stroke={pal.muted} strokeWidth={6} fill="none" strokeLinecap="round" />
        </Svg>
        {/* rendered page */}
        <div style={{ position: "absolute", left: 1080, top: 120, width: 760, height: 840, borderRadius: 24, background: pageBg, overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,0.25)", transition: "none" }}>
          <div style={{ height: 50, background: theme ? "#1d2027" : "#eef0f3", display: "flex", alignItems: "center", gap: 10, padding: "0 20px" }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((col) => (
              <span key={col} style={{ width: 14, height: 14, borderRadius: 7, background: col }} />
            ))}
            <span style={{ marginLeft: 20, fontSize: 18, color: "#888" }}>notes.html</span>
          </div>
          <div style={{ padding: "30px 50px", color: pageFg, fontFamily: theme ? "Georgia, serif" : ff }}>
            {src.map(([line, kind], i) => {
              const p = spring(t - at(i) - 0.4, 16, 0.65);
              if (t < at(i) + 0.4) return null;
              const text = line.replace(/^#\+TITLE: |^\*\* |^\* TODO |^\* |^- /, "");
              const st = { transform: `translateX(${(1 - p) * 40}px)`, opacity: c01(p * 2) };
              if (kind === "title") return <div key={i} style={{ ...st, fontSize: 64, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 10 }}>{text}</div>;
              if (kind === "h1") return <div key={i} style={{ ...st, fontSize: 38, fontWeight: 800, marginTop: 24, color: accent }}>{text}</div>;
              if (kind === "h2") return <div key={i} style={{ ...st, fontSize: 30, fontWeight: 700, marginTop: 10 }}>{text}</div>;
              if (kind === "todo")
                return (
                  <div key={i} style={{ ...st, fontSize: 36, fontWeight: 800, marginTop: 24, display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontSize: 20, padding: "6px 12px", borderRadius: 8, background: "#f2b64a", color: "#2b1d00" }}>TODO</span>
                    {text}
                  </div>
                );
              return (
                <div key={i} style={{ ...st, fontSize: 28, marginTop: 8, display: "flex", gap: 12 }}>
                  <span style={{ color: accent }}>•</span>
                  {text}
                </div>
              );
            })}
          </div>
          {themeP > 0 && themeP < 1 && <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: (1 - Math.abs(themeP - 0.5) * 2) * 0.4 }} />}
        </div>
        {t > 5.6 && (
          <div style={{ position: "absolute", left: 1080, top: 990, display: "flex", gap: 14, fontSize: 26, fontWeight: 700 }}>
            {["Light", "Dark serif"].map((th, i) => (
              <span key={i} style={{ padding: "10px 22px", borderRadius: 24, background: (i === 1) === theme ? pal.fg : pal.card, color: (i === 1) === theme ? pal.bg : pal.muted }}>
                {th}
              </span>
            ))}
          </div>
        )}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="Write plain text. Publish a page." x={960} y={500} size={96} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.03} />
          <Txt text={`${nameOf(b)} · ${c.tagline || "outlines to HTML"}`} x={960} y={620} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 9.2) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/outline-to-page.wav" on={audio} />
    </AbsoluteFill>
  );
}
