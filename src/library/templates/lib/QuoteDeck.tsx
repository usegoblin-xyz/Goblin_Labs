import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { quotes: string; sources: string; tagline: string };

// A quote-card showreel: a deck of cards is shuffled with a riffle, then
// dealt one at a time to centre; on each, a marker highlight sweeps the key
// phrase and the source slides up; the cards fan out into a hand at the end.
export default function QuoteDeck({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const quotes = [...(c.quotes || "Small *daily* improvements compound. | Clarity comes from *action*, not thought. | Protect your *attention* like money. | Write to *think*, not to impress.").split("|").map((s) => s.trim()), "A *quote*", "A *quote*", "A *quote*", "A *quote*"].slice(0, 4);
  const sources = [...list(c.sources || "Chapter 2, Chapter 5, Chapter 7, Chapter 11"), "", "", "", ""].slice(0, 4);
  const cols = [pal.v, pal.card, pal.a, pal.fg];
  const fgs = [pal.onV, pal.fg, pal.onA, pal.bg];
  const shuffle = c01(t / 1.2);
  const per = 1.6;
  const dealAt = (i: number) => 1.4 + i * per;
  const fan = expInOut(seg(t, 1.4 + per * 4, 0.8));
  const outro = expInOut(seg(t, 8.8, 0.5));
  const endP = c01((t - 9.2) / 0.8);
  const render = (q: string, i: number, hl: number) => {
    const parts = q.split("*");
    return parts.map((p, j) =>
      j % 2 ? (
        <span key={j} style={{ position: "relative", whiteSpace: "nowrap" }}>
          <span style={{ position: "absolute", left: -6, right: -6, top: "15%", bottom: "5%", background: i === 0 ? pal.a : pal.v, opacity: 0.55, transformOrigin: "0 50%", transform: `scaleX(${hl})`, borderRadius: 6 }} />
          <span style={{ position: "relative" }}>{p}</span>
        </span>
      ) : (
        <span key={j}>{p}</span>
      ),
    );
  };

  return (
    <AbsoluteFill style={{ background: pal.dark ? "#0d0d10" : "#efece6", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {quotes.map((q, i) => {
          const deal = cubicInOut(c01((t - dealAt(i)) / 0.5));
          const next = i < 3 ? cubicInOut(c01((t - dealAt(i + 1)) / 0.5)) : 0;
          // riffle offset during shuffle
          const rif = Math.sin(shuffle * Math.PI * 3 + i) * 140 * (1 - shuffle) * (i % 2 ? 1 : -1);
          const deckX = 1500 + rif + i * 4;
          const deckY = 760 - i * 6;
          const centerX = 960;
          const centerY = 520;
          const pileX = 360 + i * 10;
          const pileY = 720;
          let x = lerp(deckX, centerX, deal);
          let y = lerp(deckY, centerY, deal);
          let sc = lerp(0.45, 1, deal);
          let rot = lerp(-8 + hash(i, 1) * 6, 0, deal);
          x = lerp(x, pileX, next);
          y = lerp(y, pileY, next);
          sc = lerp(sc, 0.4, next);
          rot = lerp(rot, -10 + i * 5, next);
          // final fan
          const fx = 960 + (i - 1.5) * 300;
          const fy = 560 + Math.abs(i - 1.5) * 40;
          x = lerp(x, fx, fan);
          y = lerp(y, fy, fan);
          sc = lerp(sc, 0.5, fan);
          rot = lerp(rot, (i - 1.5) * 9, fan);
          const hl = cubicInOut(c01((t - dealAt(i) - 0.6) / 0.4));
          const src = spring(t - dealAt(i) - 0.9, 16, 0.7);
          const z = deal > 0 && next < 0.5 ? 10 + i : i;
          return (
            <div key={i} style={{ position: "absolute", left: x - 520, top: y - 330, width: 1040, height: 660, borderRadius: 36, background: cols[i], boxShadow: "0 30px 70px rgba(0,0,0,0.3)", transform: `rotate(${rot}deg) scale(${sc})`, zIndex: z, padding: 80, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ fontSize: 120, lineHeight: 0.5, color: fgs[i], opacity: 0.5, fontWeight: 900 }}>“</div>
              <div style={{ fontSize: 70, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15, color: fgs[i] }}>{render(q, i, hl)}</div>
              <div style={{ fontSize: 30, color: fgs[i], opacity: 0.7 * c01(src * 2), transform: `translateY(${(1 - src) * 30}px)` }}>— {sources[i]}</div>
            </div>
          );
        })}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={500} size={150} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Every book, its best lines."} x={960} y={610} size={48} weight={600} color={pal.v} font={ff} p={c01((t - 9.6) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/quote-deck.wav" on={audio} />
    </AbsoluteFill>
  );
}
