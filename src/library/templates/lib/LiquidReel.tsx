import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, fit, fontOf, nameOf, palette, seg, useT } from "../../motion";

type C = { words: string; role: string };

// A liquid showreel: gooey blobs (blur + contrast metaballs) orbit, merge and
// split in time with the beat; each merge swallows the previous word and
// spits out the next one in knockout type, and the final merge forms one
// big drop that clears to the name.
export default function LiquidReel({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const words = [...list(c.words || "Fluid, Playful, Precise, Alive"), "Motion", "Motion", "Motion", "Motion"].slice(0, 4);
  const per = 1.9;
  const start = 0.6;
  const k = Math.min(3, Math.max(0, Math.floor((t - start) / per)));
  const u = (t - start - k * per) / per;
  const merge = Math.pow(Math.sin(Math.PI * u), 2); // 0 apart → 1 merged → 0 apart
  const final = expInOut(seg(t, start + per * 4 - 0.2, 0.8));
  const outro = expInOut(seg(t, start + per * 4 + 0.8, 0.5));
  const endP = c01((t - start - per * 4 - 1.1) / 0.8);
  const N = 7;
  const blobs = Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2 + t * (0.6 + (i % 3) * 0.15) * (i % 2 ? 1 : -1);
    const r = (420 - merge * 330) * (1 - final) + 0;
    const rad = (110 + (i % 3) * 30) * (1 + final * 0.6);
    return { x: 960 + Math.cos(a) * r * 1.3, y: 540 + Math.sin(a) * r * 0.75, r: rad };
  });
  const word = words[k];
  const wordOp = c01((merge - 0.5) * 4);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          <defs>
            <filter id="lr-goo" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="28" />
              <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 40 -18" />
            </filter>
          </defs>
          <g filter="url(#lr-goo)">
            {blobs.map((bl, i) => (
              <circle key={i} cx={bl.x} cy={bl.y} r={bl.r} fill={pal.v} />
            ))}
            <circle cx={960} cy={540} r={60 + merge * 160 + final * 300} fill={pal.v} />
          </g>
        </Svg>
        <Svg>
          <Txt text={word} x={960} y={575} size={fit(word, 700, 150, 900, -0.04, ff)} weight={900} color={pal.onV} font={ff} p={wordOp} tracking={-0.04} mode="scale" />
          <Txt text={`${String(k + 1).padStart(2, "0")} / 04`} x={1800} y={90} size={30} weight={700} color={pal.fg} font={ff} p={1} anchor="end" />
        </Svg>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={540} size={170} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.04} mode="blur" />
          <Txt text={c.role || "Motion designer"} x={960} y={650} size={48} weight={600} color={pal.v} font={ff} p={c01((t - start - per * 4 - 1.5) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/liquid-reel.wav" on={audio} />
    </AbsoluteFill>
  );
}
