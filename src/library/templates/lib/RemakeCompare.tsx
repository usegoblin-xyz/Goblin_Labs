import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { MONO, Mark, Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { prompt: string; answer: string; phrase: string; feature1: string; feature2: string };

// The same launch told twice, side by side: on the left, the version made
// of plain slides; on the right, the motion version of the exact same beats.
// The divider then sweeps the old one away and the new one finishes alone.
const BEATS = [0.4, 2.6, 4.8]; // name, prompt, answer+features

export default function RemakeCompare({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const prompt = c.prompt || "Plan my launch week";
  const answer = c.answer || "Your launch, day by day, with posts drafted and a video ready to go.";
  const phrase = c.phrase || "a video ready to go";
  const f1 = c.feature1 || "Auto drafts";
  const f2 = c.feature2 || "One-click video";
  const div = lerp(960, 0, expInOut(seg(t, 7.4, 0.9))); // divider x
  const beat = t < BEATS[1] ? 0 : t < BEATS[2] ? 1 : 2;
  const endP = c01((t - 9.6) / 0.8);
  const scaleR = lerp(0.5, 1, expInOut(seg(t, 7.4, 0.9)));
  const fadeR = expInOut(seg(t, 9.2, 0.5));

  // the motion version, drawn in a 1920×1080 frame that we scale into the right half
  const typed = prompt.slice(0, Math.floor(c01((t - BEATS[1] - 0.2) / 1.0) * prompt.length));
  const ans = expOut(seg(t, BEATS[2], 0.6));
  const hi = expInOut(seg(t, BEATS[2] + 0.9, 0.6));
  const i0 = answer.indexOf(phrase);
  const Motion = (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, background: pal.bg, overflow: "hidden" }}>
      <Svg>
        {beat === 0 && (
          <>
            <Txt text={name} x={960} y={600} size={fit(name, 1400, 220, 800, -0.04, ff)} weight={800} color={pal.fg} font={ff} p={c01((t - 0.5) / 0.8)} tracking={-0.04} mode="scale" />
          </>
        )}
      </Svg>
      {beat === 0 && <Mark x={960} y={330} size={130} b={b} pal={pal} s={spring(t - 0.4, 16, 0.55)} />}
      {beat === 1 && (
        <div style={{ position: "absolute", left: 960, top: 540, transform: `translate(-50%, -50%) scale(${lerp(0.7, 1, expOut(seg(t, BEATS[1], 0.5)))})`, width: 1200, height: 140, borderRadius: 70, background: pal.card2, display: "flex", alignItems: "center", padding: "0 56px", boxSizing: "border-box", fontFamily: MONO, fontSize: 52, color: pal.fg, boxShadow: `0 0 0 ${lerp(0, 10, c01((t - BEATS[1] - 1.3) * 3))}px ${pal.v}` }}>
          {typed}
          {Math.floor(t * 3) % 2 === 0 && <span style={{ color: pal.v }}>▍</span>}
          <div style={{ marginLeft: "auto", width: 80, height: 80, borderRadius: 40, background: pal.v }} />
        </div>
      )}
      {beat === 2 && (
        <>
          <div style={{ position: "absolute", left: 220, top: 200, width: 900, fontFamily: ff, opacity: ans, transform: `translateY(${(1 - ans) * 40}px)` }}>
            <div style={{ fontSize: 40, color: pal.muted, fontFamily: MONO }}>{prompt}</div>
            <div style={{ marginTop: 30, fontSize: 64, fontWeight: 700, color: pal.fg, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
              {i0 >= 0 ? (
                <>
                  {answer.slice(0, i0)}
                  <span style={{ backgroundImage: `linear-gradient(${pal.v}, ${pal.v})`, backgroundSize: `${hi * 100}% 100%`, backgroundRepeat: "no-repeat", color: hi > 0.5 ? pal.onV : pal.fg, padding: "0 6px", borderRadius: 8 }}>{phrase}</span>
                  {answer.slice(i0 + phrase.length)}
                </>
              ) : (
                answer
              )}
            </div>
          </div>
          {[f1, f2].map((f, i) => {
            const p = spring(t - BEATS[2] - 1.2 - i * 0.3, 15, 0.65);
            return (
              <div key={i} style={{ position: "absolute", left: 1230, top: 280 + i * 70, width: 520, height: 300, borderRadius: 32, background: i ? pal.v : pal.card2, transform: `translateY(${(1 - p) * 500}px) rotate(${(i ? 4 : -3) * p}deg)`, padding: 40, boxSizing: "border-box", fontSize: 50, fontWeight: 800, color: i ? pal.onV : pal.fg, letterSpacing: "-0.03em", boxShadow: "0 30px 70px rgba(0,0,0,0.3)" }}>
                {f}
              </div>
            );
          })}
        </>
      )}
    </div>
  );

  // the slide version: hard cuts, plain type
  const slide = beat === 0 ? name : beat === 1 ? `“${prompt}”` : answer;
  const Slides = (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, background: "#f4f4f2", display: "flex", alignItems: "center", justifyContent: "center", padding: 160, boxSizing: "border-box", fontFamily: "Arial, sans-serif", fontSize: beat === 2 ? 60 : 96, color: "#222", textAlign: "center" }}>
      {slide}
      {beat === 2 && <div style={{ position: "absolute", bottom: 120, fontSize: 44, color: "#666" }}>• {f1} • {f2}</div>}
    </div>
  );

  const half = (node: JSX.Element, x: number, w: number, s: number, label: string, labelColor: string) => (
    <div style={{ position: "absolute", left: x, top: 0, width: w, height: 1080, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: w / 2 - 960 * s, top: 540 - 540 * s, width: 1920, height: 1080, transform: `scale(${s})`, transformOrigin: "0 0" }}>{node}</div>
      <div style={{ position: "absolute", left: 30, top: 30, padding: "10px 22px", borderRadius: 99, background: labelColor, color: "#fff", fontFamily: ff, fontSize: 26, fontWeight: 700, opacity: 1 - c01((t - 7.4) * 3) }}>{label}</div>
    </div>
  );

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - fadeR }}>
        {div > 1 && half(Slides, 0, div, 0.5, "Before", "#888")}
        {half(Motion, div, 1920 - div, scaleR, "After", pal.v)}
        {div > 1 && <div style={{ position: "absolute", left: div - 3, top: 0, width: 6, height: 1080, background: pal.fg }} />}
        {div > 1 && t > 0.2 && (
          <div style={{ position: "absolute", left: div, top: 540, transform: "translate(-50%, -50%)", width: 84, height: 84, borderRadius: 42, background: pal.fg, color: pal.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 800 }}>↔</div>
        )}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="Same story. Better told." x={960} y={520} size={110} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={name} x={960} y={640} size={52} weight={600} color={pal.v} font={ff} p={c01((t - 10.0) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/remake-compare.wav" on={audio} />
    </AbsoluteFill>
  );
}

