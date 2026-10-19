import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { headline: string; formats: string; tagline: string };

// A fast design-tool promo: a stopwatch starts; elements (image block,
// headline, button, logo) fly in from a sidebar and snap to a poster layout
// with pink snapping guides; the stopwatch stops at 0:30, then the design
// resizes itself into story, post and banner formats side by side.
export default function QuickDesign({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const headline = c.headline || "Summer Sale";
  const formats = [...list(c.formats || "Story, Post, Banner"), "Format", "Format", "Format"].slice(0, 3);
  const pink = "#ff3ea5";
  const els = [1.0, 1.6, 2.2, 2.8];
  const snap = (i: number) => cubicInOut(c01((t - els[i]) / 0.45));
  const stop = t > 3.6;
  const secs = stop ? 30 : Math.floor(c01(t / 3.6) * 30);
  const resize = expInOut(seg(t, 4.4, 1.0));
  const outro = expInOut(seg(t, 8.0, 0.5));
  const endP = c01((t - 8.4) / 0.8);
  // poster frames: single → three formats
  const frames = [
    { x: lerp(760, 220, resize), y: lerp(160, 160, resize), w: lerp(400, 320, resize), h: lerp(560, 570, resize) },
    { x: lerp(760, 640, resize), y: lerp(160, 260, resize), w: lerp(400, 440, resize), h: lerp(560, 440, resize) },
    { x: lerp(760, 1150, resize), y: lerp(160, 360, resize), w: lerp(400, 620, resize), h: lerp(560, 230, resize) },
  ];
  const Poster = ({ w, h, idx }: { w: number; h: number; idx: number }) => {
    const wide = w / h > 1.6;
    return (
      <div style={{ position: "absolute", inset: 0, background: pal.v, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: wide ? w * 0.55 : w * 0.1, top: wide ? h * 0.1 : h * 0.08, width: wide ? w * 0.4 : w * 0.8, height: wide ? h * 0.8 : h * 0.42, borderRadius: 14, background: `linear-gradient(135deg, ${pal.a}, #ffd23f)`, transform: `translateX(${idx === 0 ? (1 - snap(0)) * -900 : 0}px)` }}>
          <div style={{ position: "absolute", left: "30%", top: "25%", width: "40%", height: "50%", borderRadius: "50%", background: "rgba(255,255,255,0.5)" }} />
        </div>
        <div style={{ position: "absolute", left: w * 0.08, top: wide ? h * 0.18 : h * 0.55, fontSize: Math.min(w, h) * (wide ? 0.22 : 0.12), fontWeight: 900, letterSpacing: "-0.03em", color: pal.onV, lineHeight: 0.95, transform: `translateX(${idx === 0 ? (1 - snap(1)) * -900 : 0}px)` }}>{headline}</div>
        <div style={{ position: "absolute", left: w * 0.08, top: wide ? h * 0.66 : h * 0.8, padding: `${Math.min(w, h) * 0.025}px ${Math.min(w, h) * 0.06}px`, borderRadius: 40, background: pal.onV, color: pal.v, fontSize: Math.min(w, h) * 0.05, fontWeight: 800, transform: `translateX(${idx === 0 ? (1 - snap(2)) * -900 : 0}px)` }}>Shop now</div>
        <div style={{ position: "absolute", right: w * 0.06, top: h * 0.04, width: Math.min(w, h) * 0.1, height: Math.min(w, h) * 0.1, borderRadius: 8, background: pal.onV, transform: `scale(${idx === 0 ? spring(t - els[3], 16, 0.5) : 1})` }} />
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: pal.dark ? "#121216" : "#e9e9ee", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* sidebar */}
        <div style={{ position: "absolute", left: 60, top: 120, width: 220, padding: 24, borderRadius: 24, background: pal.card, opacity: 1 - resize }}>
          {["Image", "Text", "Button", "Logo"].map((l, i) => (
            <div key={i} style={{ height: 80, marginBottom: 14, borderRadius: 14, background: t > els[i] ? pal.card2 : pal.bg, display: "flex", alignItems: "center", padding: "0 18px", fontSize: 24, fontWeight: 700, color: pal.fg }}>
              {l}
            </div>
          ))}
        </div>
        {/* stopwatch */}
        <div style={{ position: "absolute", right: 80, top: 80, fontFamily: MONO, fontSize: 60, fontWeight: 700, color: stop ? pal.v : pal.fg, transform: `scale(${stop && t < 3.9 ? 1.15 : 1})` }}>⏱ 0:{String(secs).padStart(2, "0")}</div>
        {frames.map((f, i) =>
          i === 0 || resize > 0 ? (
            <div key={i} style={{ position: "absolute", left: f.x, top: f.y, width: f.w, height: f.h, borderRadius: 18, overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,0.25)", opacity: i === 0 ? 1 : c01(resize * 3) }}>
              <Poster w={f.w} h={f.h} idx={i} />
            </div>
          ) : null,
        )}
        {resize > 0.8 &&
          formats.map((fm, i) => (
            <div key={i} style={{ position: "absolute", left: frames[i].x, top: frames[i].y + frames[i].h + 16, fontSize: 28, fontWeight: 700, color: pal.fg, opacity: c01((resize - 0.8) * 5) }}>
              {fm}
            </div>
          ))}
        {/* snapping guides */}
        <Svg>
          {[0, 1, 2].map((i) => {
            const at = els[i] + 0.35;
            const on = t > at && t < at + 0.35;
            if (!on) return null;
            const y = [160 + 560 * 0.08, 160 + 560 * 0.55, 160 + 560 * 0.8][i];
            return (
              <g key={i}>
                <line x1={600} x2={1320} y1={y} y2={y} stroke={pink} strokeWidth={2} />
                <line x1={760 + 40} x2={760 + 40} y1={120} y2={760} stroke={pink} strokeWidth={2} />
              </g>
            );
          })}
        </Svg>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="Designed in 30 seconds." x={960} y={500} size={110} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={`${nameOf(b)} · ${c.tagline || "every size, one click"}`} x={960} y={620} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 8.8) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/quick-design.wav" on={audio} />
    </AbsoluteFill>
  );
}
