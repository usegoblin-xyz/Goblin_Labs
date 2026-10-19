import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Phone, Svg, Track, Txt, c01, countStat, cubicInOut, expInOut, expOut, fit, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { words: string; goal: string; tagline: string };

// Big words cut with app moments: each verb slams in full-screen, then
// shrinks into a phone that shows it happening (a list filling, a goal ring
// closing, a chart rising). Ends on the three verbs together.
export default function WordAppReel({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const words = [...list(c.words || "Track., Save., Grow."), "Track.", "Save.", "Grow."].slice(0, 3);
  const per = 2.4;
  const k = Math.min(2, Math.floor(t / per));
  const u = t - k * per;
  const slam = spring(u, 20, 0.55);
  const toPhone = expInOut(seg(u, 0.7, 0.5));
  const endAt = per * 3;
  const endP = c01((t - endAt) / 0.8);
  const word = words[k];
  const ws = fit(word, 1700, 380, 900, -0.05, ff);
  const app = c01((u - 1.0) / 1.2);

  const Screen = () => {
    if (k === 0)
      return (
        <div style={{ padding: "80px 22px 0" }}>
          {["Coffee", "Groceries", "Rent", "Gym", "Books"].map((it, i) => (
            <div key={it} style={{ display: "flex", justifyContent: "space-between", padding: "16px 4px", borderBottom: `1.5px solid ${pal.line}`, fontSize: 26, color: pal.fg, opacity: c01(app * 6 - i), transform: `translateY(${(1 - c01(app * 6 - i)) * 30}px)` }}>
              <span>{it}</span>
              <span style={{ fontWeight: 700 }}>${[4, 82, 1200, 30, 18][i]}</span>
            </div>
          ))}
        </div>
      );
    if (k === 1)
      return (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={300} height={300} viewBox="-150 -150 300 300">
            <circle r={110} fill="none" stroke={pal.card2} strokeWidth={30} />
            <circle r={110} fill="none" stroke={pal.v} strokeWidth={30} strokeLinecap="round" transform="rotate(-90)" pathLength={1} strokeDasharray={`${cubicInOut(app) * 0.86} 2`} />
            <text y={14} textAnchor="middle" fontFamily={ff} fontSize={50} fontWeight={800} fill={pal.fg}>
              {Math.round(cubicInOut(app) * 86)}%
            </text>
          </svg>
          <div style={{ position: "absolute", bottom: 150, fontSize: 26, color: pal.muted }}>{countStat(c.goal || "$2,400", cubicInOut(app) * 0.86)} saved</div>
        </div>
      );
    return (
      <div style={{ position: "absolute", left: 22, right: 22, bottom: 140, height: 360, display: "flex", alignItems: "flex-end", gap: 12 }}>
        {[0.3, 0.45, 0.4, 0.6, 0.7, 0.85, 1].map((h, i) => (
          <div key={i} style={{ flex: 1, height: `${h * 100 * c01(app * 3 - i * 0.25)}%`, background: i === 6 ? pal.v : pal.card2, borderRadius: 10 }} />
        ))}
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: k % 2 ? pal.v : pal.bg, overflow: "hidden", fontFamily: ff }}>
      {t < endAt && (
        <>
          <div style={{ position: "absolute", left: lerp(960, 560, toPhone), top: lerp(540, 540, toPhone), transform: `translate(-50%, -50%) scale(${lerp(lerp(1.6, 1, slam), 0.42, toPhone)})`, fontSize: ws, fontWeight: 900, letterSpacing: "-0.05em", color: k % 2 ? pal.onV : pal.fg, whiteSpace: "nowrap", lineHeight: 1 }}>{word}</div>
          {toPhone > 0 && (
            <Phone x={lerp(1900, 1260, toPhone)} y={560} h={860} pal={pal} tilt={lerp(-30, -8, toPhone)}>
              <Screen />
            </Phone>
          )}
        </>
      )}
      {endP > 0 && (
        <Svg>
          {words.map((w, i) => (
            <Txt key={i} text={w} x={960} y={300 + i * 170} size={150} weight={900} color={i === 2 ? pal.v : pal.fg} font={ff} p={c01((t - endAt - i * 0.15) / 0.5)} tracking={-0.05} mode="scale" />
          ))}
          <Txt text={`${nameOf(b)} · ${c.tagline || "Money, made simple."}`} x={960} y={900} size={44} weight={600} color={pal.muted} font={ff} p={c01((t - endAt - 0.7) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/word-app-reel.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = expOut;
