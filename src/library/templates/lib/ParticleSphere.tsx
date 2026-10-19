import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, hash, lerp, nameOf, palette, seg, useT } from "../../motion";
import { dotCell, dotsFor } from "./dotfont";

type C = { role: string };

// A particle reel: ~900 points sit on a Fibonacci sphere that rotates in 3D
// with depth shading; it breathes, twists into a torus, explodes outward on
// the drop, and the particles settle into the brand name in a dot matrix.
export default function ParticleSphere({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const N = 900;
  const name = nameOf(b).toUpperCase();
  const cell = dotCell(name, 1500, 34);
  const word = dotsFor(name, 960, 500, cell);
  const toTorus = cubicInOut(c01((t - 2.6) / 1.2));
  const burst = expInOut(seg(t, 4.6, 0.6));
  const form = cubicInOut(c01((t - 5.4) / 1.4));
  const outro = expInOut(seg(t, 9.0, 0.5));
  const ry = t * 0.6;
  const rx = 0.35 + Math.sin(t * 0.4) * 0.2;
  const breathe = 1 + Math.sin(t * 3) * 0.04;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const pts = Array.from({ length: N }, (_, i) => {
    // sphere
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    let x = Math.cos(th) * r;
    let z = Math.sin(th) * r;
    let yy = y;
    // torus
    const u = (i / N) * Math.PI * 2 * 1;
    const v = ((i * 37) % N) / N * Math.PI * 2;
    const tx = (1 + 0.38 * Math.cos(v)) * Math.cos(u) * 0.8;
    const tz = (1 + 0.38 * Math.cos(v)) * Math.sin(u) * 0.8;
    const ty = 0.38 * Math.sin(v) * 0.8;
    x = lerp(x, tx, toTorus);
    yy = lerp(yy, ty, toTorus);
    z = lerp(z, tz, toTorus);
    // rotate
    const cx = x * Math.cos(ry) + z * Math.sin(ry);
    const cz = -x * Math.sin(ry) + z * Math.cos(ry);
    const cy = yy * Math.cos(rx) - cz * Math.sin(rx);
    const cz2 = yy * Math.sin(rx) + cz * Math.cos(rx);
    const R = 380 * breathe * (1 + burst * (1.5 + hash(i, 1) * 2) * (1 - form));
    const persp = 1 / (1.8 - cz2 * 0.5);
    let sx = 960 + cx * R * persp * 1.6;
    let sy = 540 + cy * R * persp * 1.6;
    let size = 2 + persp * 4;
    let op = 0.25 + 0.75 * ((cz2 + 1) / 2);
    // final word
    if (form > 0) {
      const tgt = word[i % word.length];
      const extra = i >= word.length;
      sx = lerp(sx, extra ? 960 + (hash(i, 3) - 0.5) * 2400 : tgt[0], form);
      sy = lerp(sy, extra ? 540 + (hash(i, 4) - 0.5) * 1600 : tgt[1], form);
      size = lerp(size, extra ? 1.5 : cell * 0.42, form);
      op = lerp(op, extra ? 0.15 : 1, form);
    }
    return { sx, sy, size, op, z: cz2 };
  });

  return (
    <AbsoluteFill style={{ background: "#05050a", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          {pts
            .slice()
            .sort((a, b2) => a.z - b2.z)
            .map((p, i) => (
              <circle key={i} cx={p.sx} cy={p.sy} r={p.size} fill={p.op > 0.7 ? pal.v : "#ffffff"} opacity={p.op} />
            ))}
          <Txt text={c.role || "Generative motion"} x={960} y={760} size={44} weight={600} color="#fff" font={ff} p={c01((t - 7.0) / 0.6)} mode="fade" tracking={0.15} />
        </Svg>
      </div>
      <Track src="tracks/particle-sphere.wav" on={audio} />
    </AbsoluteFill>
  );
}
