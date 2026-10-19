import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, fontOf, hash, lerp, nameOf, palette, seg, useT } from "../../motion";
import { dotCell, dotsFor } from "./dotfont";

type C = { words: string; tagline: string };

// Kinetic type from particles: a cloud of dots settles into a word, holds,
// bursts, and re-forms into the next word; between words the cloud swirls
// like a flock. The last word is the brand name.
const N = 420;

export default function TypeParticles({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const words = [...list(c.words || "IDEA, MOTION, IMPACT").slice(0, 3), nameOf(b)].map((w) => w.toUpperCase().slice(0, 9));
  const per = 2.4;
  const k = Math.min(words.length - 1, Math.floor(t / per));
  const u = t - k * per;
  const targetsOf = (w: string) => dotsFor(w, 960, 500, dotCell(w, 1500, 46));
  const A = k === 0 ? null : targetsOf(words[k - 1]);
  const B = targetsOf(words[k]);
  const form = expInOut(c01((u - 0.2) / 0.9));
  const cell = dotCell(words[k], 1500, 46);
  const endP = c01((t - (words.length - 1) * per - 1.2) / 0.8);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        {Array.from({ length: N }, (_, i) => {
          // free position: a swirling flock
          const a = hash(i, 1) * Math.PI * 2 + t * (0.4 + hash(i, 2) * 0.6);
          const r = 200 + hash(i, 3) * 520;
          const fx = 960 + Math.cos(a) * r * 1.4;
          const fy = 520 + Math.sin(a) * r * 0.6;
          const from = A ? A[i % A.length] : [fx, fy];
          const to = i < B.length ? B[i] : null;
          // leaving the previous word: burst out to the flock
          const leave = expInOut(c01(u / 0.35));
          const sx = lerp(from[0], fx, A ? leave : 1);
          const sy = lerp(from[1], fy, A ? leave : 1);
          const x = to ? lerp(sx, to[0], form) : sx;
          const y = to ? lerp(sy, to[1], form) : sy;
          const rr = to ? lerp(4, cell * 0.42, form) : 3 + hash(i, 4) * 3;
          const col = to ? (hash(i, 5) > 0.82 ? pal.a : pal.v) : pal.faint;
          return <circle key={i} cx={x} cy={y} r={rr} fill={to && form > 0.95 && k === words.length - 1 ? pal.fg : col} opacity={to ? 1 : 0.6} />;
        })}
        {endP > 0 && <Txt text={c.tagline || "Every word, in motion."} x={960} y={800} size={54} weight={600} color={pal.muted} font={ff} p={endP} mode="fade" />}
      </Svg>
      <Track src="tracks/type-particles.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _s = seg;
