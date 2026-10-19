import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { title: string; mistakes: string; fixes: string; outro: string };

// A tutorial in pairs: each mistake appears on a red card with a cross, gets
// struck through, and the fix slides in beside it on a green card with a
// tick. Three pairs, a counter, and a closing rule of thumb.
export default function DoDont({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const mistakes = [...list(c.mistakes || "make it better, write a blog post, fix my code"), "Vague", "Vague", "Vague"].slice(0, 3);
  const fixes = [...list(c.fixes || "tighten to 120 words for busy founders, 800 words on pricing with 3 examples, the test on line 42 fails: why?"), "Specific", "Specific", "Specific"].slice(0, 3);
  const title = c.title || "3 prompting mistakes";
  const per = 2.2;
  const start = 1.2;
  const k = Math.min(2, Math.max(0, Math.floor((t - start) / per)));
  const u = t - start - k * per;
  const titleOut = expInOut(seg(t, 0.9, 0.3));
  const red = "#e5484d";
  const green = "#2fbf71";
  const outroAt = start + per * 3;
  const endP = c01((t - outroAt - 0.2) / 0.8);
  const cardIn = spring(u, 16, 0.7);
  const strike = c01((u - 0.6) / 0.3);
  const fixIn = spring(u - 0.8, 15, 0.65);
  const out = c01((u - per + 0.25) / 0.25);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        <Txt text={title} x={960} y={570} size={fit(title, 1500, 130, 800, -0.04, ff)} weight={800} color={pal.fg} font={ff} p={c01(t / 0.5)} out={titleOut} tracking={-0.04} />
      </Svg>
      {t > start && t < outroAt && (
        <>
          <div style={{ position: "absolute", left: 120, top: 100, fontFamily: MONO, fontSize: 36, color: pal.muted }}>
            {String(k + 1).padStart(2, "0")} / 03
          </div>
          {/* mistake */}
          <div style={{ position: "absolute", left: 120, top: 260, width: 800, height: 520, borderRadius: 36, background: `${red}18`, boxShadow: `inset 0 0 0 4px ${red}`, padding: 50, boxSizing: "border-box", transform: `translateY(${(1 - cardIn) * 300 - out * 900}px)`, opacity: c01(cardIn * 2) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 36, fontWeight: 800, color: red }}>
              <span style={{ width: 54, height: 54, borderRadius: 27, background: red, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>✕</span>
              Don't
            </div>
            <div style={{ position: "relative", marginTop: 50, fontFamily: MONO, fontSize: fit(`“${mistakes[k]}”`, 700, 56, 600, 0, MONO), color: pal.fg }}>
              “{mistakes[k]}”
              <div style={{ position: "absolute", left: -10, top: "50%", height: 6, width: `${strike * 105}%`, background: red }} />
            </div>
          </div>
          {/* fix */}
          <div style={{ position: "absolute", left: 1000, top: 260, width: 800, height: 520, borderRadius: 36, background: `${green}18`, boxShadow: `inset 0 0 0 4px ${green}`, padding: 50, boxSizing: "border-box", transform: `translateX(${(1 - fixIn) * 600}px) translateY(${-out * 900}px)`, opacity: c01(fixIn * 2) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 36, fontWeight: 800, color: green }}>
              <span style={{ width: 54, height: 54, borderRadius: 27, background: green, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>✓</span>
              Do
            </div>
            <div style={{ marginTop: 50, fontFamily: MONO, fontSize: 40, lineHeight: 1.35, color: pal.fg }}>“{fixes[k]}”</div>
          </div>
        </>
      )}
      {endP > 0 && (
        <Svg>
          <Txt text={c.outro || "Be specific. Give context. Ask once."} x={960} y={520} size={fit(c.outro || "Be specific. Give context. Ask once.", 1600, 90, 800, -0.03, ff)} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.03} />
          <Txt text={nameOf(b)} x={960} y={640} size={48} weight={600} color={pal.v} font={ff} p={c01((t - outroAt - 0.6) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/do-dont.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = [expOut, lerp];
