import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Phone, Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { words: string; styles: string; tagline: string };

// A clean, product-hero caption app promo: a phone floats on white, a clip
// plays with word-by-word captions that highlight in time; the caption style
// swaps three times (bold pop, minimal, karaoke) while the phone turns.
export default function CaptionApp({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const words = (c.words || "this is how your videos finally get watched all the way through").split(/\s+/).filter(Boolean);
  const styles = [...list(c.styles || "Bold, Minimal, Karaoke"), "Style", "Style", "Style"].slice(0, 3);
  const wps = 3.2;
  const start = 1.2;
  const wi = Math.floor((t - start) * wps);
  const style = t < 3.8 ? 0 : t < 6.2 ? 1 : 2;
  const tilt = Math.sin(t * 0.6) * 10 + (style - 1) * 6;
  const head = c01(t / 0.8);
  const outro = expInOut(seg(t, 8.7, 0.5));
  const endP = c01((t - 9.1) / 0.8);
  // show a 3-word window around the current word
  const winStart = Math.max(0, Math.floor(Math.max(0, wi) / 3) * 3);
  const win = words.slice(winStart, winStart + 3);
  const H = 860;

  const caption = () => {
    if (t < start) return null;
    if (style === 0)
      return (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          {win.map((w, i) => {
            const idx = winStart + i;
            const act = idx === wi;
            return (
              <span key={idx} style={{ fontSize: 44, fontWeight: 900, textTransform: "uppercase", color: act ? pal.v : "#fff", transform: `scale(${act ? 1 + 0.15 * spring((t - start) * wps - idx, 3, 0.4) : 1})`, display: "inline-block", WebkitTextStroke: "2px #000", visibility: idx <= wi ? "visible" : "hidden" }}>
                {w}
              </span>
            );
          })}
        </div>
      );
    if (style === 1)
      return (
        <div style={{ fontSize: 38, fontWeight: 600, color: "#fff", textAlign: "center", background: "rgba(0,0,0,0.55)", padding: "8px 16px", borderRadius: 10 }}>
          {words.slice(winStart, wi + 1).join(" ")}
        </div>
      );
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {win.map((w, i) => {
          const idx = winStart + i;
          return (
            <span key={idx} style={{ fontSize: 38, fontWeight: 800, padding: "4px 10px", borderRadius: 10, background: idx === wi ? pal.a : "transparent", color: idx === wi ? pal.onA : idx < wi ? "#fff" : "rgba(255,255,255,0.45)" }}>
              {w}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: pal.dark ? "#0c0c0e" : "#fafafa", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          <Txt text="Captions that keep up." x={460} y={360} size={86} weight={800} color={pal.fg} font={ff} p={head} tracking={-0.04} />
          <Txt text={`Style: ${styles[style]}`} x={460} y={470} size={44} weight={600} color={pal.v} font={ff} p={c01((t - 1.0) / 0.4)} mode="fade" key={style} />
        </Svg>
        {/* style chips */}
        <div style={{ position: "absolute", left: 180, top: 560, display: "flex", gap: 16 }}>
          {styles.map((s, i) => (
            <div key={i} style={{ padding: "14px 28px", borderRadius: 30, background: i === style ? pal.fg : pal.card, color: i === style ? pal.bg : pal.muted, fontSize: 28, fontWeight: 700, transition: "none" }}>
              {s}
            </div>
          ))}
        </div>
        <Phone x={1360} y={540 + (1 - spring(t - 0.2, 12, 0.7)) * 900} h={H} pal={pal} tilt={tilt} screen="#222">
          {/* faux clip: gradient scene with a soft figure */}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg, #3a4a6b, #b77a5f ${60 + Math.sin(t) * 10}%, #f2c48d)` }} />
          <div style={{ position: "absolute", left: "50%", top: 250 + Math.sin(t * 2) * 4, width: 180, height: 180, borderRadius: "50%", background: "#2a2a33", transform: "translateX(-50%)" }} />
          <div style={{ position: "absolute", left: "50%", top: 420, width: 320, height: 400, borderRadius: "160px 160px 0 0", background: "#2a2a33", transform: "translateX(-50%)" }} />
          <div style={{ position: "absolute", left: 20, right: 20, top: 560 }}>{caption()}</div>
          <div style={{ position: "absolute", left: 30, right: 30, bottom: 40, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.3)" }}>
            <div style={{ width: `${c01((t - start) / 7) * 100}%`, height: "100%", background: "#fff", borderRadius: 3 }} />
          </div>
        </Phone>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={520} size={150} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Auto captions, perfectly timed."} x={960} y={630} size={48} weight={500} color={pal.muted} font={ff} p={c01((t - 9.5) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/caption-app.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = [cubicInOut];
