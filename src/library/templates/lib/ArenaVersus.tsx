import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { prompt: string; models: string; tagline: string };

// A model-arena promo: one prompt is typed, two anonymous model cards
// stream answers side by side, a vote is cast with a click, the names are
// revealed, and a leaderboard reorders as the rating ticks up.
export default function ArenaVersus({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const prompt = c.prompt || "Explain recursion to a 10-year-old.";
  const models = [...list(c.models || "Model Orion, Model Vega, Model Lyra, Model Nova, Model Atlas"), "Model", "Model", "Model", "Model", "Model"].slice(0, 5);
  const ansA = "It's like standing between two mirrors: each picture holds a smaller picture, until it's too small to see.";
  const ansB = "Recursion is when a function calls itself to solve smaller parts of a problem until a base case.";
  const typed = prompt.slice(0, Math.floor(c01((t - 0.3) / 0.8) * prompt.length));
  const stream = (s: string, at: number, sp: number) => s.slice(0, Math.floor(c01((t - at) / sp) * s.length));
  const vote = t > 4.0;
  const reveal = c01((t - 4.4) / 0.4);
  const board = expInOut(seg(t, 5.4, 0.6));
  const reorder = cubicInOut(c01((t - 6.2) / 0.8));
  const outro = expInOut(seg(t, 8.4, 0.5));
  const endP = c01((t - 8.8) / 0.8);
  const ratings = [1288, 1301, 1276, 1265, 1250];
  const r0 = Math.round(1288 + reorder * 21);
  const card = (side: number) => {
    const isA = side === 0;
    const sel = vote && isA;
    return (
      <div style={{ position: "absolute", left: isA ? 120 : 990, top: 300, width: 810, height: 520, borderRadius: 30, background: pal.card, padding: 40, boxSizing: "border-box", boxShadow: sel ? `0 0 0 6px ${pal.v}` : "none", transform: `translateY(${(1 - spring(t - 1.0 - side * 0.1, 14, 0.7)) * 400}px) scale(${sel ? 1 + 0.03 * Math.sin(c01((t - 4.0) / 0.3) * Math.PI) : 1})`, opacity: 1 - board }}>
        <div style={{ display: "flex", alignItems: "center", fontFamily: MONO, fontSize: 26, color: pal.muted }}>
          <span style={{ color: reveal > 0.5 ? pal.fg : pal.muted, fontWeight: 700 }}>{reveal > 0.5 ? models[isA ? 0 : 1] : `Model ${isA ? "A" : "B"}`}</span>
          {sel && <span style={{ marginLeft: "auto", color: pal.v, fontWeight: 800 }}>✓ Your pick</span>}
        </div>
        <div style={{ marginTop: 30, fontSize: 38, lineHeight: 1.4, color: pal.fg }}>
          {stream(isA ? ansA : ansB, 1.4 + side * 0.15, 2.0 + side * 0.4)}
          {t < 3.8 && <span style={{ color: pal.v }}>▍</span>}
        </div>
      </div>
    );
  };
  const order = [0, 1, 2, 3, 4];
  const rank = (i: number) => (i === 0 ? 1 - reorder : i === 1 ? reorder : i);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <div style={{ position: "absolute", left: 120, right: 120, top: 120, height: 110, borderRadius: 55, background: pal.card2, display: "flex", alignItems: "center", padding: "0 44px", fontSize: 40, color: pal.fg, opacity: 1 - board }}>
          {typed}
          {t < 1.2 && <span style={{ color: pal.v }}>|</span>}
          <span style={{ marginLeft: "auto", fontSize: 28, color: pal.muted }}>Same prompt, two models</span>
        </div>
        {card(0)}
        {card(1)}
        {t > 3.6 && t < 5.4 && (
          <div style={{ position: "absolute", left: 0, right: 0, top: 880, display: "flex", justifyContent: "center", gap: 24, opacity: 1 - board }}>
            {["◀ A is better", "Tie", "B is better ▶"].map((l, i) => (
              <div key={i} style={{ padding: "18px 34px", borderRadius: 30, background: i === 0 && vote ? pal.v : pal.card, color: i === 0 && vote ? pal.onV : pal.fg, fontSize: 30, fontWeight: 700 }}>
                {l}
              </div>
            ))}
          </div>
        )}
        {board > 0 && (
          <div style={{ position: "absolute", left: 460, top: 160, width: 1000, opacity: board, transform: `translateY(${(1 - board) * 100}px)` }}>
            <div style={{ fontSize: 50, fontWeight: 800, color: pal.fg, marginBottom: 30 }}>Leaderboard</div>
            {order.map((i) => (
              <div key={i} style={{ position: "absolute", top: 100 + rank(i) * 120, left: 0, right: 0, height: 100, borderRadius: 24, background: i === 0 ? pal.v : pal.card, display: "flex", alignItems: "center", padding: "0 36px", gap: 30, color: i === 0 ? pal.onV : pal.fg }}>
                <span style={{ fontFamily: MONO, fontSize: 30, width: 40 }}>{Math.round(rank(i)) + 1}</span>
                <span style={{ fontSize: 36, fontWeight: 800 }}>{models[i]}</span>
                <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 32, fontVariantNumeric: "tabular-nums" }}>{i === 0 ? r0 : ratings[i]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="Let the answers compete." x={960} y={500} size={110} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={`${nameOf(b)} · ${c.tagline || "vote blind, rank fairly"}`} x={960} y={620} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 9.2) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/arena-versus.wav" on={audio} />
    </AbsoluteFill>
  );
}
