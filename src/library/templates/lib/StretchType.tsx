import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Track, c01, expInOut, fontOf, nameOf, palette, seg, useT } from "../../motion";

type C = { words: string; role: string };

// An elastic type showreel: stacked lines of one word fill the frame, and a
// travelling pulse stretches each letter vertically and squeezes its
// neighbours like an accordion, rippling top to bottom on the beat; the
// word changes on every bar and the last bar holds the name.
export default function StretchType({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const words = [...list(c.words || "ELASTIC, BOUNCE, STRETCH"), "MOTION", "MOTION", "MOTION"].slice(0, 3).map((w) => w.toUpperCase());
  const seqW = [...words, nameOf(b).toUpperCase()];
  const bar = 2.0;
  const k = Math.min(3, Math.floor(t / bar));
  const word = seqW[k];
  const ROWS = 6;
  const rowH = 1080 / ROWS;
  const outro = expInOut(seg(t, bar * 4 + 0.6, 0.5));
  const bgs = [pal.bg, pal.v, pal.fg, pal.bg];
  const fgs = [pal.fg, pal.onV, pal.bg, pal.v];

  return (
    <AbsoluteFill style={{ background: bgs[k], overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {Array.from({ length: ROWS }, (_, r) => {
          const letters = word.split("");
          const n = letters.length;
          // pulse position across letters for this row
          const phase = (t * 1.6 - r * 0.12) % 1;
          const center = phase * (n + 2) - 1;
          const weights = letters.map((_, i) => 1 + 2.2 * Math.exp(-Math.pow(i - center, 2) / 1.2));
          const sumW = weights.reduce((a, b2) => a + b2, 0);
          const scaleY = (i: number) => 0.55 + 0.9 * Math.exp(-Math.pow(i - center, 2) / 1.2);
          return (
            <div key={r} style={{ position: "absolute", left: 40, right: 40, top: r * rowH, height: rowH, display: "flex", alignItems: "center" }}>
              {letters.map((L, i) => (
                <div key={i} style={{ width: `${(weights[i] / sumW) * 100}%`, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "visible" }}>
                  <span style={{ display: "inline-block", fontSize: rowH * 0.92, fontWeight: 900, lineHeight: 1, color: r === 2 && k < 3 ? (k === 1 ? pal.bg : pal.v) : fgs[k], transform: `scaleX(${(weights[i] / sumW) * n * 0.95}) scaleY(${scaleY(i) * (r % 2 ? 1 : 1)})` }}>{L}</span>
                </div>
              ))}
            </div>
          );
        })}
        {k === 3 && (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 30, textAlign: "center", fontSize: 34, fontWeight: 700, color: pal.fg, letterSpacing: "0.2em", opacity: c01((t - bar * 3 - 0.4) * 2) }}>{(c.role || "Type in motion").toUpperCase()}</div>
        )}
      </div>
      <Track src="tracks/stretch-type.wav" on={audio} />
    </AbsoluteFill>
  );
}
