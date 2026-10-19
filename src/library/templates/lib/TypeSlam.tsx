import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expOut, fit, fontOf, hash, nameOf, palette, spring, useT } from "../../motion";

type C = { words: string; role: string };

// A bold type showreel cut on the beat: each word slams in full-bleed on a
// new color field, with a different entrance per cut (drop, split, stretch,
// stack, rotate), and the last cut resolves into the name.
export default function TypeSlam({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const words = [...list(c.words || "LOUD, CLEAR, FAST, SHARP, BOLD, YOURS"), "TYPE", "TYPE", "TYPE", "TYPE", "TYPE", "TYPE"].slice(0, 6);
  const beat = 60 / 120; // 120 bpm
  const per = beat * 2; // one word per bar half
  const start = 0.4;
  const k = Math.floor((t - start) / per);
  const u = t - start - k * per;
  const fields = [
    [pal.v, pal.onV],
    [pal.fg, pal.bg],
    [pal.a, pal.onA],
    [pal.bg, pal.fg],
    [pal.v, pal.onV],
    [pal.fg, pal.bg],
  ];
  const endAt = start + per * words.length;
  const endP = c01((t - endAt) / 0.6);

  if (t < start) return <AbsoluteFill style={{ background: pal.bg }}><Track src="tracks/type-slam.wav" on={audio} /></AbsoluteFill>;

  if (k >= words.length) {
    const n = nameOf(b);
    return (
      <AbsoluteFill style={{ background: pal.bg, fontFamily: ff }}>
        <Svg>
          <Txt text={n} x={960} y={600} size={fit(n, 1600, 300, 900, -0.05, ff)} weight={900} color={pal.fg} font={ff} p={endP} mode="scale" tracking={-0.05} />
          <Txt text={(c.role || "Type that moves").toUpperCase()} x={960} y={740} size={44} weight={700} color={pal.v} font={ff} p={c01((t - endAt - 0.4) / 0.5)} tracking={0.2} mode="fade" />
        </Svg>
        <Track src="tracks/type-slam.wav" on={audio} />
      </AbsoluteFill>
    );
  }

  const w = words[k];
  const [bg, fg] = fields[k];
  const size = fit(w, 1760, 520, 900, -0.05, ff);
  const s = spring(u, 22, 0.5);
  const e = expOut(c01(u / 0.35));
  const mode = k % 5;
  const shake = u < 0.12 ? (hash(k, Math.floor(u * 60)) - 0.5) * 30 : 0;
  let body: JSX.Element;
  if (mode === 0) {
    body = <div style={{ transform: `translateY(${(1 - s) * -1100}px)` }}>{w}</div>;
  } else if (mode === 1) {
    // split: top and bottom halves slide in from opposite sides
    body = (
      <div style={{ position: "relative" }}>
        <div style={{ clipPath: "inset(0 0 50% 0)", transform: `translateX(${(1 - e) * -1900}px)` }}>{w}</div>
        <div style={{ position: "absolute", inset: 0, clipPath: "inset(50% 0 0 0)", transform: `translateX(${(1 - e) * 1900}px)` }}>{w}</div>
      </div>
    );
  } else if (mode === 2) {
    body = <div style={{ transform: `scaleX(${0.05 + 0.95 * s}) scaleY(${2.4 - 1.4 * s})` }}>{w}</div>;
  } else if (mode === 3) {
    // stacked echoes collapse into one
    body = (
      <div style={{ position: "relative" }}>
        {[3, 2, 1].map((j) => (
          <div key={j} style={{ position: "absolute", inset: 0, transform: `translateY(${j * 120 * (1 - e)}px)`, opacity: 0.35 * (1 - e), WebkitTextStroke: `4px ${fg}`, color: "transparent" }}>
            {w}
          </div>
        ))}
        <div style={{ transform: `translateY(${(1 - e) * -60}px)` }}>{w}</div>
      </div>
    );
  } else {
    body = <div style={{ transform: `rotate(${(1 - s) * -90}deg) scale(${0.3 + 0.7 * s})` }}>{w}</div>;
  }

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden", fontFamily: ff }}>
      {/* small meta row */}
      <div style={{ position: "absolute", left: 70, top: 60, right: 70, display: "flex", justifyContent: "space-between", fontSize: 26, fontWeight: 700, color: fg, opacity: 0.7, letterSpacing: "0.12em" }}>
        <span>{nameOf(b).toUpperCase()}</span>
        <span>{String(k + 1).padStart(2, "0")} / {String(words.length).padStart(2, "0")}</span>
      </div>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `translate(${shake}px, ${shake * 0.6}px)` }}>
        <div style={{ fontSize: size, fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 0.9, color: fg, whiteSpace: "nowrap" }}>{body}</div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 70, bottom: 60, height: 10, width: `${c01(u / per) * 1780}px`, background: fg, opacity: 0.8 }} />
      <Track src="tracks/type-slam.wav" on={audio} />
    </AbsoluteFill>
  );
}
