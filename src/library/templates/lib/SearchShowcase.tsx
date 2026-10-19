import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { queries: string; results: string; tagline: string };

// A search showcase: a centred search bar types three different queries in
// turn; for each one results cascade in under it with a match highlight and
// a timing badge, filter chips toggle, and the bar flies up into a header.
export default function SearchShowcase({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const queries = [...list(c.queries || "pricing deck, bug in checkout, who owns onboarding"), "query", "query", "query"].slice(0, 3);
  const results = [
    ["Q3 pricing deck.pdf", "Pricing deck v2 (draft)", "Notes: pricing review"],
    ["#412 Checkout fails on Safari", "PR: fix checkout race", "Slack: checkout bug?"],
    ["Onboarding owner: Priya", "Team page: Growth", "Doc: onboarding playbook"],
  ];
  const custom = list(c.results || "");
  if (custom.length >= 3) results[0] = custom.slice(0, 3);
  const per = 2.4;
  const start = 0.8;
  const k = Math.min(2, Math.max(0, Math.floor((t - start) / per)));
  const u = t - start - k * per;
  const q = queries[k];
  const typed = q.slice(0, Math.floor(c01(u / 0.7) * q.length));
  const up = expInOut(seg(t, 0.6, 0.5));
  const barY = 540 - up * 280;
  const outro = expInOut(seg(t, start + per * 3 + 0.2, 0.5));
  const endP = c01((t - start - per * 3 - 0.6) / 0.8);
  const chips = ["All", "Docs", "Code", "Chat", "People"];
  const chipOn = [1, 2, 4][k];
  const hl = (s: string) => {
    const word = q.split(" ")[0].toLowerCase();
    const i = s.toLowerCase().indexOf(word);
    if (i < 0) return s;
    return (
      <>
        {s.slice(0, i)}
        <mark style={{ background: `${pal.v}55`, color: pal.fg, borderRadius: 6, padding: "0 4px" }}>{s.slice(i, i + word.length)}</mark>
        {s.slice(i + word.length)}
      </>
    );
  };

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <div style={{ position: "absolute", left: 360, width: 1200, top: barY - 60, height: 120, borderRadius: 60, background: pal.card, display: "flex", alignItems: "center", padding: "0 44px", gap: 24, boxShadow: `0 0 0 ${3 + Math.sin(t * 4) * 1}px ${pal.v}55`, transform: `scale(${spring(t - 0.1, 14, 0.6)})` }}>
          <svg width={44} height={44}>
            <circle cx={18} cy={18} r={14} fill="none" stroke={pal.fg} strokeWidth={5} />
            <line x1={29} y1={29} x2={41} y2={41} stroke={pal.fg} strokeWidth={5} strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 46, color: typed ? pal.fg : pal.muted, flex: 1 }}>
            {typed || "Search everything"}
            <span style={{ opacity: Math.floor(t * 3) % 2, color: pal.v }}>|</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 24, color: pal.muted, padding: "8px 16px", borderRadius: 10, border: `2px solid ${pal.line}` }}>⌘K</div>
        </div>
        {/* chips */}
        <div style={{ position: "absolute", left: 400, top: barY + 90, display: "flex", gap: 14, opacity: up }}>
          {chips.map((ch, i) => (
            <div key={i} style={{ padding: "12px 26px", borderRadius: 30, background: i === chipOn && u > 0.8 ? pal.fg : pal.card, color: i === chipOn && u > 0.8 ? pal.bg : pal.muted, fontSize: 28, fontWeight: 700 }}>
              {ch}
            </div>
          ))}
        </div>
        {/* results */}
        {t > start && (
          <div style={{ position: "absolute", left: 360, width: 1200, top: barY + 190 }}>
            {results[k].map((r, i) => {
              const s = spring(u - 0.8 - i * 0.12, 16, 0.65);
              const gone = c01((u - per + 0.3) / 0.2);
              return (
                <div key={`${k}-${i}`} style={{ display: "flex", alignItems: "center", gap: 24, height: 110, marginBottom: 14, padding: "0 34px", borderRadius: 26, background: i === 0 ? pal.card2 : pal.card, transform: `translateY(${(1 - s) * 80}px)`, opacity: c01(s * 2) * (1 - gone) }}>
                  <div style={{ width: 54, height: 54, borderRadius: 14, background: [pal.v, pal.a, "#38a3ff"][i], flexShrink: 0 }} />
                  <div style={{ fontSize: 38, fontWeight: 600, color: pal.fg }}>{hl(r)}</div>
                  {i === 0 && <div style={{ marginLeft: "auto", fontSize: 26, color: pal.muted }}>↵ open</div>}
                </div>
              );
            })}
            {u > 0.9 && <div style={{ fontFamily: MONO, fontSize: 24, color: pal.v, marginTop: 10, opacity: c01((u - 0.9) * 4) }}>3 results · {[38, 41, 29][k]} ms</div>}
          </div>
        )}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="Find it before you finish typing." x={960} y={500} size={96} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={`${nameOf(b)} · ${c.tagline || "search across every tool"}`} x={960} y={620} size={46} weight={600} color={pal.v} font={ff} p={c01((t - start - per * 3 - 1.0) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/search-showcase.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = [cubicInOut];
