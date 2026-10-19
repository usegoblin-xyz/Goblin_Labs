import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Track, c01, cubicInOut, expInOut, fit, fontOf, nameOf, palette, seg, useT } from "../../motion";

type C = { words: string; role: string };

// A drum-type showreel: words are printed around a 3D cylinder that spins
// on its horizontal axis like a slot machine, clicking to a stop on each
// word with a small overshoot; the last stop lands on the name.
export default function DrumType({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const words = [...list(c.words || "DESIGN, MOTION, TYPE, SOUND, COLOUR, RHYTHM, SPACE, LIGHT"), "MOTION", "MOTION", "MOTION", "MOTION", "MOTION", "MOTION", "MOTION", "MOTION"].slice(0, 8).map((w) => w.toUpperCase());
  const name = nameOf(b).toUpperCase();
  const faces = [...words.slice(0, 7), name];
  const N = faces.length;
  const H = 240;
  const R = H / 2 / Math.tan(Math.PI / N);
  const stops = [1.2, 2.6, 4.0, 5.4, 6.8];
  const targetsByDrum = [
    [1, 3, 5, 6, 7],
    [2, 4, 1, 5, 7],
    [3, 0, 6, 2, 7],
  ];
  const outro = expInOut(seg(t, 8.8, 0.5));
  const drumRot = (d: number) => {
    let idx = 0;
    let prev = 0;
    for (let s = 0; s < stops.length; s++) {
      const at = stops[s] + d * 0.15;
      const from = s ? stops[s - 1] + d * 0.15 : 0;
      const target = targetsByDrum[d][s] + N * (s + 1);
      const p = c01((t - from) / (at - from));
      // overshoot settle
      const e = p < 1 ? cubicInOut(p) : 1;
      const settle = t > at ? Math.sin(Math.min(1, (t - at) / 0.3) * Math.PI) * 0.12 * (1 - Math.min(1, (t - at) / 0.3)) : 0;
      if (t >= from) {
        idx = prev + (target - prev) * e + settle;
      }
      prev = target;
    }
    return idx;
  };

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff, perspective: 1800 }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {[1].map((d) => {
          const rot = drumRot(d) * (360 / N);
          return (
            <div key={d} style={{ position: "absolute", left: 120, right: 120, top: 540 - H / 2, height: H, transformStyle: "preserve-3d", transform: `translateZ(${-R}px) rotateX(${rot}deg)` }}>
              {faces.map((f, i) => (
                <div key={i} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: i === 7 ? pal.v : pal.card, color: i === 7 ? pal.onV : pal.fg, fontSize: fit(f, 1500, H * 0.8, 900, -0.03, ff), fontWeight: 900, letterSpacing: "-0.03em", transform: `rotateX(${-(i * 360) / N}deg) translateZ(${R}px)`, backfaceVisibility: "hidden", borderTop: `2px solid ${pal.bg}` }}>
                  {f}
                </div>
              ))}
            </div>
          );
        })}
        {/* window shading */}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(${pal.bg} 0%, ${pal.bg} 14%, transparent 34%, transparent 66%, ${pal.bg} 86%, ${pal.bg} 100%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 40, textAlign: "center", fontSize: 40, fontWeight: 700, color: pal.muted, opacity: c01((t - 7.2) * 2) }}>{c.role || "Type that spins"}</div>
      </div>
      <Track src="tracks/drum-type.wav" on={audio} />
    </AbsoluteFill>
  );
}
