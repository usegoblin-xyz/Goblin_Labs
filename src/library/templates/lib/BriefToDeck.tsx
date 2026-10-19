import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { project: string; answers: string; tagline: string };

// From brief to presentation: a short brief form fills in (project, goal,
// audience, tone); each answer lifts out of its field, flies across and
// lands as the headline of a slide, and the slides fan into a deck.
export default function BriefToDeck({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const qs = ["Project", "Goal", "Audience", "Tone"];
  const answers = [...list(c.answers || `${c.project || "Spring campaign"}, Double sign-ups, Busy founders, Bold and warm`), "—", "—", "—", "—"].slice(0, 4);
  const fillAt = (i: number) => 0.6 + i * 0.75;
  const fly = (i: number) => cubicInOut(c01((t - 3.8 - i * 0.35) / 0.7));
  const fan = expInOut(seg(t, 6.0, 0.8));
  const outro = expInOut(seg(t, 8.4, 0.5));
  const endP = c01((t - 8.8) / 0.8);
  const slideCols = [pal.v, pal.card, pal.a, pal.fg];
  const slideFg = [pal.onV, pal.fg, pal.onA, pal.bg];

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* brief card */}
        <div style={{ position: "absolute", left: 120, top: 150, width: 640, padding: 44, borderRadius: 32, background: pal.card, boxSizing: "border-box", transform: `translateX(${(1 - spring(t - 0.1, 14, 0.7)) * -800 - fan * 900}px)` }}>
          <div style={{ fontSize: 44, fontWeight: 800, color: pal.fg, marginBottom: 30 }}>Brief</div>
          {qs.map((q, i) => {
            const a = answers[i];
            const typed = a.slice(0, Math.floor(c01((t - fillAt(i)) / 0.5) * a.length));
            return (
              <div key={i} style={{ marginBottom: 26 }}>
                <div style={{ fontSize: 24, color: pal.muted, marginBottom: 8 }}>{q}</div>
                <div style={{ height: 76, borderRadius: 16, background: pal.bg, border: `3px solid ${t > fillAt(i) && t < fillAt(i) + 0.7 ? pal.v : pal.line}`, display: "flex", alignItems: "center", padding: "0 24px", fontSize: 34, color: pal.fg, opacity: 1 - fly(i) * 0.6 }}>
                  {typed}
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 10, height: 80, borderRadius: 40, background: t > 3.4 ? pal.v : pal.card2, color: t > 3.4 ? pal.onV : pal.muted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800, transform: `scale(${t > 3.4 && t < 3.6 ? 0.95 : 1})` }}>
            Generate deck →
          </div>
        </div>
        {/* slides */}
        {qs.map((q, i) => {
          const f = fly(i);
          if (f <= 0) return null;
          const sx = lerp(1000, 1000, 0) + 0;
          const baseX = lerp(1000, 300 + i * 340, fan);
          const baseY = lerp(180 + i * 40, 330, fan);
          const rot = lerp(i * 3 - 4, (i - 1.5) * 6, fan);
          return (
            <div key={i} style={{ position: "absolute", left: baseX + sx * 0, top: baseY, width: 760, height: 428, borderRadius: 22, background: slideCols[i], boxShadow: "0 30px 60px rgba(0,0,0,0.3)", transform: `translateX(${(1 - f) * -500}px) rotate(${rot}deg) scale(${lerp(0.5, 1, f) * lerp(1, 0.6, fan)})`, transformOrigin: "50% 50%", opacity: c01(f * 3), padding: 50, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between", zIndex: 10 + i }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: slideFg[i], opacity: 0.7 }}>
                {String(i + 1).padStart(2, "0")} · {q}
              </div>
              <div style={{ fontSize: 72, fontWeight: 900, letterSpacing: "-0.03em", color: slideFg[i], lineHeight: 1 }}>{answers[i]}</div>
              <div style={{ height: 8, width: 120, borderRadius: 4, background: slideFg[i], opacity: 0.5 }} />
            </div>
          );
        })}
        {fan > 0.5 && (
          <Svg>
            <Txt text="4 slides · ready to present" x={960} y={900} size={44} weight={700} color={pal.muted} font={ff} p={c01((t - 6.6) / 0.5)} mode="fade" />
          </Svg>
        )}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="Brief in. Deck out." x={960} y={500} size={130} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={`${nameOf(b)} · ${c.tagline || "presentations from a brief"}`} x={960} y={620} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 9.2) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/brief-to-deck.wav" on={audio} />
    </AbsoluteFill>
  );
}
