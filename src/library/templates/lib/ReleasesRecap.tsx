import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fit, fontOf, hash, lerp, mix, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { title: string; items: string; tags: string; pick: string };

// A news-style weekly recap: a bold header bar, then five entries counting
// down, each a card with a generated cover, genre tags and a rating meter;
// the top entry gets a "Top pick" stamp.
export default function ReleasesRecap({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const items = [...list(c.items || "Star Harbor, Mossbound, Neon Courier, Quiet Peaks, Ironleaf"), "Entry", "Entry", "Entry", "Entry", "Entry"].slice(0, 5);
  const tags = [...list(c.tags || "Space sim, Cozy, Racing, Puzzle, Strategy"), "New", "New", "New", "New", "New"].slice(0, 5);
  const header = expOut(seg(t, 0, 0.5));
  const per = 1.3;
  const start = 1.0;
  const cur = Math.min(4, Math.max(0, Math.floor((t - start) / per)));
  const local = t - start - cur * per;
  const slide = cubicInOut(c01(local / 0.45));
  const outro = expInOut(seg(t, start + 5 * per + 0.2, 0.5));
  const endP = c01((t - (start + 5 * per + 0.6)) / 0.8);
  const order = [4, 3, 2, 1, 0]; // count down 5 → 1

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <div style={{ position: "absolute", left: 0, top: 70, height: 110, width: `${header * 100}%`, background: pal.v, display: "flex", alignItems: "center", paddingLeft: 120, boxSizing: "border-box", fontSize: 54, fontWeight: 800, color: pal.onV, letterSpacing: "-0.02em", whiteSpace: "nowrap", overflow: "hidden" }}>
          {c.title || "New this week"}
          <span style={{ marginLeft: 30, fontSize: 30, fontWeight: 600, opacity: 0.75 }}>{nameOf(b)} recap</span>
        </div>
        {/* progress pips */}
        <div style={{ position: "absolute", right: 120, top: 112, display: "flex", gap: 12 }}>
          {order.map((_, i) => (
            <div key={i} style={{ width: 46, height: 10, borderRadius: 5, background: i <= cur && t > start ? pal.onV : mix(pal.v, pal.onV, 0.4), opacity: header }} />
          ))}
        </div>
        {t > start &&
          [cur - 1, cur].map((k) => {
            if (k < 0) return null;
            const idx = order[k];
            const isCur = k === cur;
            const x = isCur ? lerp(1920 + 200, 960, slide) : lerp(960, -900, slide);
            const rank = 5 - k;
            const score = 0.62 + hash(idx, 4) * 0.33 + (rank === 1 ? 0.1 : 0);
            const meter = isCur ? expOut(c01((local - 0.35) / 0.6)) : 1;
            return (
              <div key={k} style={{ position: "absolute", left: x - 760, top: 270, width: 1520, height: 680, display: "flex", gap: 60, alignItems: "center" }}>
                <div style={{ position: "relative", width: 640, height: 640, borderRadius: 36, overflow: "hidden", background: [pal.v, pal.a, pal.card2, pal.fg, pal.p][idx % 5], flexShrink: 0 }}>
                  <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
                    <circle cx={30 + hash(idx, 1) * 40} cy={35} r={14 + hash(idx, 2) * 10} fill={pal.bg} opacity={0.85} />
                    <path d={`M0,${70 + hash(idx, 3) * 10} L${30 + hash(idx, 5) * 20},50 L60,66 L100,46 L100,100 L0,100Z`} fill={pal.bg} />
                  </svg>
                  <div style={{ position: "absolute", left: 30, top: 24, fontSize: 150, fontWeight: 900, color: pal.bg, opacity: 0.9, letterSpacing: "-0.06em", lineHeight: 1 }}>#{rank}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "inline-block", padding: "10px 22px", borderRadius: 99, background: pal.card2, color: pal.fg, fontSize: 28, fontWeight: 600 }}>{tags[idx]}</div>
                  <div style={{ marginTop: 26, fontSize: fit(items[idx], 780, 110, 800, -0.04, ff), fontWeight: 800, color: pal.fg, letterSpacing: "-0.04em", lineHeight: 1 }}>{items[idx]}</div>
                  <div style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 24 }}>
                    <div style={{ width: 460, height: 22, borderRadius: 11, background: pal.card2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${score * meter * 100}%`, background: pal.v, borderRadius: 11 }} />
                    </div>
                    <div style={{ fontSize: 50, fontWeight: 800, color: pal.fg, fontVariantNumeric: "tabular-nums" }}>{(score * 10 * meter).toFixed(1)}</div>
                  </div>
                  {rank === 1 && isCur && (
                    <div style={{ marginTop: 40, display: "inline-block", padding: "16px 34px", border: `6px solid ${pal.v}`, borderRadius: 18, color: pal.v, fontSize: 46, fontWeight: 900, letterSpacing: "0.04em", transform: `rotate(-6deg) scale(${lerp(2.2, 1, spring(local - 0.6, 18, 0.55))})`, opacity: c01((local - 0.6) * 5) }}>
                      {(c.pick || "Top pick").toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text="See you next week." x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - (start + 5 * per + 1.0)) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/releases-recap.wav" on={audio} />
    </AbsoluteFill>
  );
}
