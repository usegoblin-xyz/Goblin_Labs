import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Phone, Svg, Track, Txt, c01, expInOut, fontOf, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { cards: string; streak: string; tagline: string };

// A spaced-repetition product video: a phone shows a flashcard from a book,
// it flips to reveal the answer, a thumb swipes it right ("Got it"), the next
// card flips and swipes left ("Again"), then the streak calendar fills and
// a flame counter ticks up.
export default function FlashcardReview({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const cards = [...(c.cards || "What beats goals? = Systems | Why keep a reading log? = So ideas compound | First step of a habit? = Make it obvious").split("|").map((s) => s.split("=").map((x) => x.trim())), ["Q", "A"], ["Q", "A"], ["Q", "A"]].slice(0, 3);
  const streak = Number(c.streak || 21) || 21;
  const per = 2.0;
  const start = 0.8;
  const k = Math.min(2, Math.max(0, Math.floor((t - start) / per)));
  const u = t - start - k * per;
  const flip = c01((u - 0.5) / 0.4);
  const dir = k === 1 ? -1 : 1;
  const swipe = expInOut(c01((u - 1.4) / 0.5));
  const cal = c01((t - 7.0) / 1.0);
  const outro = expInOut(seg(t, 9.0, 0.5));
  const endP = c01((t - 9.4) / 0.8);
  const PH = 920;
  const PW = PH * 0.49;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          <Txt text="Remember what you read." x={520} y={420} size={78} weight={800} color={pal.fg} font={ff} p={c01((t - 0.2) / 0.6)} tracking={-0.03} />
          <Txt text="Two minutes a day. Cards from every book." x={520} y={500} size={36} weight={500} color={pal.muted} font={ff} p={c01((t - 0.5) / 0.6)} mode="fade" />
        </Svg>
        {t > start + per * 0 + 1.6 && (
          <div style={{ position: "absolute", left: 220, top: 600, display: "flex", gap: 16 }}>
            {["Got it", "Again", "Got it"].slice(0, Math.min(3, Math.floor((t - start - 1.6) / per) + 1)).map((r, i) => (
              <div key={i} style={{ padding: "12px 24px", borderRadius: 24, background: r === "Again" ? "#f2b64a33" : "#2fbf7133", color: r === "Again" ? "#c98a12" : "#1f9a5a", fontSize: 28, fontWeight: 700 }}>
                {r === "Again" ? "↺" : "✓"} {r}
              </div>
            ))}
          </div>
        )}
        <Phone x={1360} y={540 + (1 - spring(t - 0.2, 12, 0.75)) * 1100} h={PH} pal={pal}>
          <div style={{ position: "absolute", inset: 0, padding: "80px 28px", boxSizing: "border-box", fontFamily: ff, perspective: 1200 }}>
            <div style={{ display: "flex", alignItems: "center", fontSize: 24, color: pal.muted }}>
              <span>Review</span>
              <span style={{ marginLeft: "auto", fontWeight: 800, color: "#ff7a2f" }}>🔥 {t > 7.0 ? Math.round(streak - 1 + cal) : streak - 1}</span>
            </div>
            {t < start + per * 3 && (
              <div style={{ position: "relative", height: 520, marginTop: 40 }}>
                {/* next card behind */}
                <div style={{ position: "absolute", inset: 0, borderRadius: 30, background: pal.card2, transform: "scale(0.94) translateY(24px)" }} />
                <div style={{ position: "absolute", inset: 0, transform: `translateX(${swipe * dir * 600}px) rotate(${swipe * dir * 18}deg)`, opacity: 1 - c01((swipe - 0.7) * 3) }}>
                  <div style={{ position: "absolute", inset: 0, borderRadius: 30, background: flip > 0.5 ? pal.v : pal.card, display: "flex", alignItems: "center", justifyContent: "center", padding: 30, boxSizing: "border-box", textAlign: "center", transform: `rotateY(${flip * 180 - (flip > 0.5 ? 180 : 0)}deg)`, transformOrigin: "50% 50%" }}>
                    <div>
                      <div style={{ fontSize: 22, color: flip > 0.5 ? pal.onV : pal.muted, opacity: 0.8, marginBottom: 16 }}>{flip > 0.5 ? "Answer" : `Card ${k + 1} of 3`}</div>
                      <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.15, color: flip > 0.5 ? pal.onV : pal.fg }}>{flip > 0.5 ? cards[k][1] : cards[k][0]}</div>
                    </div>
                  </div>
                  {swipe > 0.05 && (
                    <div style={{ position: "absolute", left: 30, top: 30, padding: "8px 18px", borderRadius: 12, border: `4px solid ${dir > 0 ? "#2fbf71" : "#f2b64a"}`, color: dir > 0 ? "#2fbf71" : "#f2b64a", fontSize: 30, fontWeight: 900, transform: "rotate(-12deg)" }}>{dir > 0 ? "GOT IT" : "AGAIN"}</div>
                  )}
                </div>
              </div>
            )}
            {t >= start + per * 3 && (
              <div style={{ marginTop: 40 }}>
                <div style={{ fontSize: 34, fontWeight: 800, color: pal.fg, marginBottom: 20 }}>Done for today ✓</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
                  {Array.from({ length: 28 }, (_, i) => {
                    const on = i < streak - 1 || (i === streak - 1 && cal > 0.5);
                    return <div key={i} style={{ aspectRatio: "1", borderRadius: 10, background: on ? (i === streak - 1 ? "#ff7a2f" : pal.v) : pal.card2, transform: `scale(${i === streak - 1 ? 1 + 0.3 * Math.sin(c01((cal - 0.5) * 2) * Math.PI) : 1})` }} />;
                  })}
                </div>
              </div>
            )}
          </div>
        </Phone>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={520} size={150} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Read it once. Keep it forever."} x={960} y={630} size={48} weight={600} color={pal.v} font={ff} p={c01((t - 9.8) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/flashcard-review.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = [0];
