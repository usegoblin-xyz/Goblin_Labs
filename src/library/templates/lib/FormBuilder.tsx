import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { title: string; questions: string; tagline: string };

// A form that writes itself like a doc: the title types, a slash menu pops,
// each question drops in with its field type, the Publish button flips to a
// live link, and responses stream into a table below with a counter.
export default function FormBuilder({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const title = c.title || "Beta waitlist";
  const qs = [...list(c.questions || "Your name, Work email, What would you build?"), "Question", "Question", "Question"].slice(0, 3);
  const kinds = ["Short answer", "Email", "Long answer"];
  const titleT = title.slice(0, Math.floor(c01((t - 0.3) / 0.6) * title.length));
  const qAt = (i: number) => 1.4 + i * 1.0;
  const menu = (i: number) => t > qAt(i) - 0.45 && t < qAt(i);
  const pub = t > 4.6;
  const resp = c01((t - 5.2) / 2.0);
  const outro = expInOut(seg(t, 7.8, 0.5));
  const endP = c01((t - 8.2) / 0.8);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro, transform: `translateY(${-cubicInOut(seg(t, 5.0, 0.8)) * 220}px)` }}>
        <div style={{ position: "absolute", left: 360, top: 90, width: 1200, minHeight: 900, borderRadius: 30, background: pal.card, padding: "60px 80px", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ fontSize: 76, fontWeight: 800, color: pal.fg, letterSpacing: "-0.03em", minHeight: 92 }}>
              {titleT}
              {t < 1.0 && <span style={{ color: pal.v }}>▍</span>}
            </div>
            <div style={{ marginLeft: "auto", padding: "16px 34px", borderRadius: 40, background: pub ? pal.v : pal.fg, color: pub ? pal.onV : pal.bg, fontSize: 28, fontWeight: 700, transform: `scale(${pub ? 1 + 0.1 * Math.exp(-(t - 4.6) * 6) : 1})` }}>{pub ? "Live ✓" : "Publish"}</div>
          </div>
          {pub && <div style={{ marginTop: 10, fontFamily: MONO, fontSize: 26, color: pal.v, opacity: c01((t - 4.7) * 3) }}>forms.link/{title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}</div>}
          {qs.map((q, i) => {
            const p = spring(t - qAt(i), 16, 0.7);
            return (
              <div key={i} style={{ marginTop: i ? 34 : 50, position: "relative" }}>
                {menu(i) && (
                  <div style={{ position: "absolute", left: 0, top: -10, width: 360, borderRadius: 18, background: pal.card2, padding: 14, boxShadow: "0 20px 40px rgba(0,0,0,0.3)", zIndex: 3 }}>
                    <div style={{ fontFamily: MONO, color: pal.muted, fontSize: 22, marginBottom: 8 }}>/{kinds[i].split(" ")[0].toLowerCase()}</div>
                    {kinds.map((k, j) => (
                      <div key={k} style={{ padding: "10px 14px", borderRadius: 10, background: j === i ? pal.v : "transparent", color: j === i ? pal.onV : pal.fg, fontSize: 26 }}>{k}</div>
                    ))}
                  </div>
                )}
                {t > qAt(i) && (
                  <div style={{ opacity: c01(p * 2), transform: `translateY(${(1 - p) * 30}px)` }}>
                    <div style={{ fontSize: 38, fontWeight: 700, color: pal.fg }}>{q}</div>
                    <div style={{ marginTop: 14, height: i === 2 ? 130 : 70, borderRadius: 16, boxShadow: `inset 0 0 0 2px ${pal.line}`, display: "flex", alignItems: "flex-start", padding: "20px 22px", boxSizing: "border-box", color: pal.faint, fontSize: 26 }}>{kinds[i]}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* responses table */}
        <div style={{ position: "absolute", left: 360, top: 1020, width: 1200, borderRadius: 30, background: pal.card, padding: "34px 50px", boxSizing: "border-box", opacity: c01((t - 5.0) * 3) }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: pal.fg }}>Responses</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: pal.v, fontVariantNumeric: "tabular-nums" }}>{Math.round(resp * 1284).toLocaleString("en-US")}</div>
          </div>
          {Array.from({ length: 3 }, (_, r) => (
            <div key={r} style={{ display: "flex", gap: 30, marginTop: 18, fontSize: 26, color: pal.fg, opacity: c01(resp * 6 - r) }}>
              <span style={{ width: 240 }}>{["Maya R.", "Leo P.", "Sana K."][r]}</span>
              <span style={{ width: 360, fontFamily: MONO, color: pal.muted }}>{["maya@studio.co", "leo@hey.dev", "sana@lab.io"][r]}</span>
              <span>{["A habit tracker", "A recipe app", "A portfolio"][r]}</span>
            </div>
          ))}
        </div>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Forms as easy as writing."} x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - 8.6) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/form-builder.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = [expOut, hash, lerp];
