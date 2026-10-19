import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, hash, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { titles: string; ideas: string; tagline: string };

// A bookshelf reel: a shelf of spines slides in; three books tip out one
// after another, swing open to face camera, pages riffle, and a single key
// idea from each lifts off the page as a highlighted card that stacks on
// the right; then the shelf slides away to the brand.
export default function BookShelfReel({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const titles = [...list(c.titles || "Deep Habits, The Quiet Mind, Small Bets"), "Book", "Book", "Book"].slice(0, 3);
  const ideas = [...list(c.ideas || "Systems beat goals, Boredom is a signal, Start small then double down"), "Idea", "Idea", "Idea"].slice(0, 3);
  const spineCols = ["#c8553d", "#2d4a6b", "#e0a458", "#5b8c5a", "#8e5572", "#3d405b", "#f2cc8f", "#81b29a", "#e07a5f", "#6d597a", "#b56576", "#355070"];
  const pick = [2, 6, 9];
  const per = 1.9;
  const at = (i: number) => 1.0 + i * per;
  const outro = expInOut(seg(t, 8.0, 0.5));
  const endP = c01((t - 8.4) / 0.8);
  const shelfIn = spring(t - 0.1, 13, 0.75);

  return (
    <AbsoluteFill style={{ background: pal.dark ? "#14110e" : "#f5efe6", overflow: "hidden", fontFamily: ff, perspective: 2000 }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* shelf */}
        <div style={{ position: "absolute", left: 100, top: 640, width: 1000, transform: `translateX(${(1 - shelfIn) * -1200}px)` }}>
          <div style={{ display: "flex", alignItems: "flex-end", height: 330 }}>
            {spineCols.map((col, i) => {
              const k = pick.indexOf(i);
              const out = k >= 0 ? cubicInOut(c01((t - at(k)) / 0.4)) : 0;
              const h = 240 + hash(i, 1) * 80;
              return (
                <div key={i} style={{ width: 70 + hash(i, 2) * 20, height: h, marginRight: 6, background: col, borderRadius: 6, transform: `translateY(${-out * 60}px)`, opacity: 1 - c01((t - at(k) - 0.3) * 5) * (k >= 0 ? 1 : 0), display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ transform: "rotate(-90deg)", whiteSpace: "nowrap", fontSize: 22, fontWeight: 700, color: "#fff", opacity: 0.85 }}>{k >= 0 ? titles[k] : ""}</div>
                </div>
              );
            })}
          </div>
          <div style={{ height: 30, background: "#8b5a2b", borderRadius: 4 }} />
        </div>
        {/* active open book */}
        {pick.map((sp, k) => {
          const u = t - at(k) - 0.3;
          if (u < 0 || u > per) return null;
          const open = cubicInOut(c01(u / 0.5));
          const close = c01((u - per + 0.3) / 0.3);
          const riffle = Math.floor(c01((u - 0.4) / 0.5) * 8);
          return (
            <div key={k} style={{ position: "absolute", left: 300, top: 120, width: 760, height: 480, opacity: 1 - close, transform: `scale(${0.5 + 0.5 * open})` }}>
              {/* left page */}
              <div style={{ position: "absolute", left: 0, top: 0, width: 380, height: 480, background: "#fffdf8", borderRadius: "12px 0 0 12px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", padding: 34, boxSizing: "border-box" }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: "#222" }}>{titles[k]}</div>
                {Array.from({ length: 9 }, (_, j) => (
                  <div key={j} style={{ height: 10, borderRadius: 5, background: "#ddd", marginTop: 18, width: `${70 + hash(k, j) * 30}%` }} />
                ))}
              </div>
              {/* right page with highlight */}
              <div style={{ position: "absolute", left: 380, top: 0, width: 380, height: 480, background: "#fffdf8", borderRadius: "0 12px 12px 0", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", padding: 34, boxSizing: "border-box", transformOrigin: "0 50%", transform: `rotateY(${(1 - open) * -170}deg)` }}>
                {Array.from({ length: 10 }, (_, j) => (
                  <div key={j} style={{ height: 10, borderRadius: 5, background: j === 4 && u > 0.9 ? pal.v : "#ddd", marginTop: 18, width: `${60 + hash(k, j + riffle) * 40}%`, opacity: j === 4 ? 1 : 0.9 }} />
                ))}
              </div>
              {/* riffling page */}
              {u > 0.4 && u < 0.9 && <div style={{ position: "absolute", left: 380, top: 0, width: 380, height: 480, background: "#f3eee4", transformOrigin: "0 50%", transform: `rotateY(${-((u * 1600) % 180)}deg)` }} />}
            </div>
          );
        })}
        {/* idea cards stack */}
        {ideas.map((idea, k) => {
          const s = spring(t - at(k) - 1.2, 14, 0.6);
          return (
            <div key={k} style={{ position: "absolute", left: 1200, top: 200 + k * 220, width: 620, height: 190, borderRadius: 26, background: k === 0 ? pal.v : pal.card, padding: "30px 36px", boxSizing: "border-box", transform: `translateX(${(1 - s) * -700}px) rotate(${(1 - s) * -6}deg)`, opacity: c01(s * 3) }}>
              <div style={{ fontSize: 24, color: k === 0 ? pal.onV : pal.muted, opacity: 0.8 }}>{titles[k]}</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: k === 0 ? pal.onV : pal.fg, lineHeight: 1.15, marginTop: 8 }}>{idea}</div>
            </div>
          );
        })}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="Read less. Remember more." x={960} y={500} size={110} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={`${nameOf(b)} · ${c.tagline || "key ideas from great books"}`} x={960} y={620} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 8.8) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/book-shelf-reel.wav" on={audio} />
    </AbsoluteFill>
  );
}
