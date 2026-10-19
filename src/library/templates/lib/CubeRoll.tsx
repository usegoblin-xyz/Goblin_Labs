import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { words: string; role: string };

// A rolling-cube showreel: a row of five 3D cubes tumbles a quarter turn on
// each beat in a ripple, each face carrying a letter or a colour block, so
// the row spells a new word after every roll; the last roll spells the name.
export default function CubeRoll({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const words = [...list(c.words || "SHAPE, SPACE, TIMED, SHARP"), "MOTION"].slice(0, 4).map((w) => w.toUpperCase());
  const name = nameOf(b).toUpperCase();
  const seq = [...words, name];
  const N = Math.min(8, Math.max(...seq.map((s) => s.length)));
  const S = Math.min(240, 1600 / N - 20);
  const beat = 1.25;
  const start = 0.6;
  const faceBg = [pal.v, pal.fg, pal.a, pal.card2, pal.v];
  const faceFg = [pal.onV, pal.bg, pal.onA, pal.fg, pal.onV];
  const outro = expInOut(seg(t, start + beat * 5 + 0.8, 0.5));
  const intro = spring(t - 0.1, 13, 0.7);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff, perspective: 2400 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 540 - S / 2, height: S, display: "flex", justifyContent: "center", gap: 20, opacity: 1 - outro, transform: `rotateX(-18deg) rotateY(${Math.sin(t * 0.5) * 10}deg) scale(${intro})`, transformStyle: "preserve-3d" }}>
        {Array.from({ length: N }, (_, i) => {
          // rolls completed for this cube (ripple delay per index)
          let rot = 0;
          for (let k = 0; k < seq.length - 1; k++) rot += cubicInOut(c01((t - start - k * beat - i * 0.06) / 0.5));
          const idx = Math.round(rot);
          const faceFor = (f: number) => {
            // which sequence entry is shown on face f: the one whose roll number ≡ f (mod 4) closest to current
            const cand = [f, f + 4].filter((n) => n < seq.length);
            const best = cand.reduce((a, b2) => (Math.abs(b2 - rot) < Math.abs(a - rot) ? b2 : a), cand[0] ?? 0);
            return best;
          };
          return (
            <div key={i} style={{ position: "relative", width: S, height: S, transformStyle: "preserve-3d", transform: `translateZ(${-S / 2}px) rotateX(${rot * 90}deg)` }}>
              {[0, 1, 2, 3].map((f) => {
                const w = faceFor(f);
                const s = seq[w] ?? "";
                const pad = Math.floor((N - s.length) / 2);
                const ch = s[i - pad] ?? "";
                const tf = [`translateZ(${S / 2}px)`, `rotateX(-90deg) translateZ(${S / 2}px)`, `rotateX(-180deg) translateZ(${S / 2}px)`, `rotateX(-270deg) translateZ(${S / 2}px)`][f];
                return (
                  <div key={f} style={{ position: "absolute", inset: 0, transform: tf, background: ch ? faceBg[w] : pal.card, color: faceFg[w], display: "flex", alignItems: "center", justifyContent: "center", fontSize: S * 0.62, fontWeight: 900, borderRadius: S * 0.08, backfaceVisibility: "hidden", boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.08)" }}>
                    {ch}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <Svg>
        <Txt text={c.role || "Motion design"} x={960} y={540 + S / 2 + 140} size={44} weight={600} color={pal.muted} font={ff} p={c01((t - start - beat * 4 - 0.6) / 0.6) * (1 - outro)} mode="fade" />
      </Svg>
      <Track src="tracks/cube-roll.wav" on={audio} />
    </AbsoluteFill>
  );
}
