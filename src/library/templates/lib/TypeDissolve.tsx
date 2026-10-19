import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, hash, lerp, nameOf, palette, seg, useT } from "../../motion";
import { dotCell, dotsFor } from "./dotfont";

type C = { words: string; role: string };

// A type-and-particle showreel: each word is built of particles; it holds,
// then dissolves into a swirling cloud (curl-like drift) and the same
// particles stream into the next word, each word in a different colour;
// the last one is the name.
export default function TypeDissolve({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const words = [...list(c.words || "DREAM, BUILD, SHIP"), "MAKE", "MAKE", "MAKE"].slice(0, 3).map((w) => w.toUpperCase());
  const seqW = [...words, nameOf(b).toUpperCase()];
  const cols = [pal.v, pal.a, "#38a3ff", pal.fg];
  const per = 2.2;
  const k = Math.min(3, Math.floor(t / per));
  const u = t - k * per;
  const N = 700;
  const targets = seqW.map((w) => {
    const cell = dotCell(w, 1600, 40);
    const d = dotsFor(w, 960, 540, cell);
    return { d, cell };
  });
  // within a slot: 0..0.8 form from cloud, 0.8..1.5 hold, 1.5..2.2 dissolve
  const form = cubicInOut(c01(u / 0.8));
  const diss = k < 3 ? cubicInOut(c01((u - 1.5) / 0.7)) : 0;
  const outro = expInOut(seg(t, per * 3 + 2.0, 0.5));
  const pts = Array.from({ length: N }, (_, i) => {
    const T = targets[k];
    const tg = T.d[i % T.d.length];
    const extra = i >= T.d.length;
    const a = hash(i, 1) * Math.PI * 2 + t * (0.6 + hash(i, 2));
    const r = 200 + hash(i, 3) * 600;
    const cloud = { x: 960 + Math.cos(a) * r * 1.4, y: 540 + Math.sin(a * 1.3) * r * 0.6 };
    const tx = extra ? tg[0] + (hash(i, 5) - 0.5) * 8 : tg[0];
    const ty = extra ? tg[1] + (hash(i, 6) - 0.5) * 8 : tg[1];
    const p = form * (1 - diss);
    return { x: lerp(cloud.x, tx, p), y: lerp(cloud.y, ty, p), r: lerp(2.5, T.cell * 0.38, p) * (extra ? 0.6 : 1), o: extra ? 0.35 + 0.65 * (1 - p) : 1 };
  });

  return (
    <AbsoluteFill style={{ background: "#07070b", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          {pts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={cols[k]} opacity={p.o} />
          ))}
          {k === 3 && <Txt text={c.role || "Type & particles"} x={960} y={760} size={44} weight={600} color="#fff" font={ff} p={c01((u - 0.9) / 0.6)} tracking={0.15} mode="fade" />}
        </Svg>
      </div>
      <Track src="tracks/type-dissolve.wav" on={audio} />
    </AbsoluteFill>
  );
}
