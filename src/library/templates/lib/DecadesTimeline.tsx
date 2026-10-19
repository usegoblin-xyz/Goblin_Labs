import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fit, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { title: string; years: string; headlines: string; outro: string };

// A decade-by-decade summary: a big year counter on the left rolls from
// decade to decade while headline cards scroll up on the right, and a strip
// at the bottom fills in with one color block per era.
export default function DecadesTimeline({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const years = [...list(c.years || "1960, 1970, 1980, 1990, 2000, 2010, 2020").map(Number)].slice(0, 7);
  const heads = [...list(c.headlines || "A new beginning, Building institutions, Years of change, Opening up, A new century, Reform and growth, Looking ahead"), "", "", "", "", "", "", ""].slice(0, years.length);
  const n = years.length;
  const per = 1.2;
  const start = 1.4;
  const pos = c01((t - start) / (per * (n - 1)));
  const fIdx = pos * (n - 1);
  const eased = Math.min(n - 1, Math.floor(fIdx) + cubicInOut(c01(((fIdx % 1) - 0.6) / 0.4)));
  const k = Math.min(n - 1, Math.round(eased));
  const yearNow = Math.round(lerp(years[0], years[n - 1], pos));
  const titleOut = expInOut(seg(t, 1.0, 0.4));
  const outro = expInOut(seg(t, start + per * (n - 1) + 1.0, 0.5));
  const endP = c01((t - (start + per * (n - 1) + 1.4)) / 0.8);
  const ts = fit(c.title || "Seven decades in a minute", 1600, 110, 800, -0.04, ff);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        <Txt text={c.title || "Seven decades in a minute"} x={960} y={560} size={ts} weight={800} color={pal.fg} font={ff} p={c01((t - 0.1) / 0.6)} out={titleOut} tracking={-0.04} />
      </Svg>
      {t > 1.2 && (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
          <div style={{ position: "absolute", left: 120, top: 300, fontSize: 260, fontWeight: 900, letterSpacing: "-0.05em", color: pal.fg, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{yearNow}</div>
          <div style={{ position: "absolute", left: 130, top: 590, fontSize: 40, color: pal.v, fontWeight: 700 }}>{years[k]}s</div>
          <div style={{ position: "absolute", left: 1000, top: 0, width: 820, height: 1080, overflow: "hidden", maskImage: "linear-gradient(transparent, #000 25%, #000 75%, transparent)", WebkitMaskImage: "linear-gradient(transparent, #000 25%, #000 75%, transparent)" }}>
            {heads.map((h, i) => {
              const y = 540 + (i - eased) * 230 - 90;
              const on = i === k;
              return (
                <div key={i} style={{ position: "absolute", left: 0, top: y, width: 820, height: 180, borderRadius: 28, background: on ? pal.v : pal.card2, padding: "30px 40px", boxSizing: "border-box", transform: `scale(${on ? 1 : 0.92})`, transformOrigin: "0 50%" }}>
                  <div style={{ fontSize: 26, color: on ? pal.onV : pal.muted, fontWeight: 700 }}>{years[i]}s</div>
                  <div style={{ fontSize: fit(h, 740, 54, 800, -0.02, ff), fontWeight: 800, color: on ? pal.onV : pal.fg, marginTop: 8, whiteSpace: "nowrap" }}>{h}</div>
                </div>
              );
            })}
          </div>
          <div style={{ position: "absolute", left: 120, top: 940, width: 780, height: 40, display: "flex", gap: 6 }}>
            {years.map((_, i) => (
              <div key={i} style={{ flex: 1, borderRadius: 8, background: i <= fIdx + 0.01 ? [pal.v, pal.a, pal.fg][i % 3] : pal.card2, transform: `scaleY(${i === k ? 1.3 : 1})` }} />
            ))}
          </div>
        </div>
      )}
      {endP > 0 && (
        <Svg>
          <Txt text={c.outro || "History keeps moving."} x={960} y={520} size={110} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={nameOf(b)} x={960} y={640} size={48} weight={600} color={pal.v} font={ff} p={c01((t - (start + per * (n - 1) + 1.8)) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/decades-timeline.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = spring;
