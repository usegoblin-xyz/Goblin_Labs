import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Txt, Track, c01, cubicInOut, expInOut, expOut, fit, fontOf, hash, kf, lerp, MONO, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { shipped: string; next: string; teaser: string; date: string };

// Roadmap teaser: shipped items tick past on a timeline, the camera races to
// a locked card, the card scrambles and cracks open on the next feature's
// name, then "coming" and a date.
export default function FeatureTeaser({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const shipped = list(c.shipped || "Dark mode, Brand kits, Team spaces, API access").slice(0, 5);
  const next = c.next || "Live Collaboration";
  const N = shipped.length;
  const GAP = 620;

  // timeline travel
  const travel = kf(t, [[0, 0], [0.6, 0], [4.6, N * GAP], [5.4, N * GAP + 260]], cubicInOut);
  const lockIn = expOut(seg(t, 5.0, 0.6));
  const shake = t > 6.0 && t < 7.4 ? Math.sin(t * 90) * 6 * seg(t, 6.0, 1.4) : 0;
  const crack = expInOut(seg(t, 7.4, 0.5));
  const nameIn = t >= 7.6;
  const zoom = lerp(1, 1.08, seg(t, 7.4, 4));
  const outro = expInOut(seg(t, 12.0, 0.45));
  const glyphs = "▚▞▙▟█▓▒░#%&@$";
  const scramble = (s: string, p: number, seed: number) =>
    s.split("").map((ch, i) => (ch === " " ? " " : i / s.length < p ? ch : glyphs[Math.floor(hash(i, seed, Math.floor(t * 20)) * glyphs.length)])).join("");
  const nameP = c01((t - 7.6) / 1.2);
  const W = fit(next, 1500, 170, 800, -0.04, ff);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      {/* grid */}
      <div style={{ position: "absolute", inset: -200, backgroundImage: `linear-gradient(${pal.line} 1.5px, transparent 1.5px), linear-gradient(90deg, ${pal.line} 1.5px, transparent 1.5px)`, backgroundSize: "120px 120px", transform: `translateX(${-(travel % 120)}px)`, opacity: 0.6 }} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom}) translateX(${shake}px)`, opacity: 1 - outro }}>
        {/* the road */}
        <Svg>
          <line x1={0} x2={1920} y1={640} y2={640} stroke={pal.line} strokeWidth={4} />
          <line x1={0} x2={Math.min(1920, 400 + travel - 0)} y1={640} y2={640} stroke={pal.v} strokeWidth={4} />
        </Svg>
        {shipped.map((s, i) => {
          const x = 400 + i * GAP - travel;
          if (x < -400 || x > 2300) return null;
          const passed = 960 > x;
          const pop = spring(t - (0.6 + (i * GAP + 400 - 560) / (N * GAP) * 4), 18, 0.6);
          return (
            <div key={s} style={{ position: "absolute", left: x - 240, top: 350 }}>
              <div style={{ width: 480, height: 210, borderRadius: 28, background: pal.card, boxShadow: `inset 0 0 0 2px ${passed ? pal.v : pal.line}`, padding: 28, boxSizing: "border-box" }}>
                <div style={{ fontFamily: MONO, fontSize: 24, color: pal.muted }}>v{1 + i * 0.1 > 1 ? (1 + i * 0.1).toFixed(1) : "1.0"} · shipped</div>
                <div style={{ marginTop: 18, fontSize: 50, fontWeight: 700, color: pal.fg, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>{s}</div>
              </div>
              <div style={{ position: "absolute", left: 240 - 22, top: 268, width: 44, height: 44, borderRadius: 22, background: passed ? pal.v : pal.card2, color: pal.onV, fontSize: 26, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${passed ? 1 + 0.2 * (1 - c01(pop)) : 1})` }}>{passed ? "✓" : ""}</div>
            </div>
          );
        })}
        {/* the locked card */}
        {(() => {
          const x = 400 + N * GAP - travel + 260;
          const sx = lerp(1, 1.6, lockIn);
          return (
            <div style={{ position: "absolute", left: x - 260, top: 540 - 200, width: 520, height: 400, transform: `scale(${sx})` }}>
              {[0, 1].map((half) => (
                <div key={half} style={{ position: "absolute", left: half ? 260 : 0, top: 0, width: 260, height: 400, overflow: "hidden", transform: `translateX(${(half ? 1 : -1) * crack * 1500}px) rotate(${(half ? 1 : -1) * crack * 14}deg)`, opacity: 1 - seg(t, 7.6, 0.25) }}>
                  <div style={{ position: "absolute", left: half ? -260 : 0, width: 520, height: 400, borderRadius: 34, background: pal.fg, color: pal.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <svg width={110} height={110} viewBox="0 0 24 24"><path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 017 0v3" fill="none" stroke={pal.bg} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <div style={{ marginTop: 18, fontFamily: MONO, fontSize: 30, letterSpacing: "0.1em" }}>{scramble("CLASSIFIED", 0, 3)}</div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
      {/* the reveal */}
      {nameIn && (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", fontFamily: MONO, fontSize: 30, letterSpacing: "0.3em", color: pal.v, opacity: expOut(seg(t, 7.7, 0.4)) }}>{(c.teaser || "NEXT UP").toUpperCase()}</div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 380, textAlign: "center", fontSize: W, fontWeight: 800, letterSpacing: "-0.04em", color: pal.fg, lineHeight: 1 }}>{scramble(next, nameP, 9)}</div>
          <div style={{ position: "absolute", left: "50%", top: 640, transform: `translateX(-50%) scale(${spring(t - 9.2, 16, 0.6)})`, padding: "16px 34px", borderRadius: 99, background: pal.v, color: pal.onV, fontSize: 38, fontWeight: 700 }}>{c.date || "Coming this spring"}</div>
        </div>
      )}
      {outro > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={570} size={130} weight={800} color={pal.fg} font={ff} p={c01((t - 12.5) / 0.7)} />
        </Svg>
      )}
      <Track src="tracks/feature-teaser.wav" on={audio} />
    </AbsoluteFill>
  );
}
