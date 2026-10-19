import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, fit, fontOf, hash, lerp, nameOf, palette, seg, useT } from "../../motion";

type C = { words: string; tagline: string };

// Stencil type: a giant word is cut out of the frame and shapes move behind
// it, so you only see them through the letters (circles roll, stripes slide,
// a triangle spins). Each word swaps on a wipe and the shapes change color.
export default function StencilType({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const words = [...list(c.words || "SHAPE, COLOR, TYPE"), "FORM"].slice(0, 3);
  const per = 2.6;
  const k = Math.min(2, Math.floor(t / per));
  const u = t - k * per;
  const wipe = expInOut(c01((u - per + 0.4) / 0.4));
  const word = words[k];
  const size = fit(word, 1760, 520, 900, -0.04, ff);
  const endAt = per * 3;
  const endP = c01((t - endAt) / 0.8);
  const cols = [pal.v, pal.a, pal.fg];
  const A = cols[k % 3];
  const B = cols[(k + 1) % 3];

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      {t < endAt && (
        <Svg>
          <defs>
            <clipPath id={`st-${k}`}>
              <text x={960} y={540 + size * 0.36} textAnchor="middle" fontFamily={ff} fontSize={size} fontWeight={900} letterSpacing={-size * 0.04}>
                {word}
              </text>
            </clipPath>
          </defs>
          <text x={960} y={540 + size * 0.36} textAnchor="middle" fontFamily={ff} fontSize={size} fontWeight={900} letterSpacing={-size * 0.04} fill={pal.card}>
            {word}
          </text>
          <g clipPath={`url(#st-${k})`}>
            {k === 0 &&
              Array.from({ length: 7 }, (_, i) => {
                const x = ((i * 340 + t * 420) % 2400) - 240;
                return <circle key={i} cx={x} cy={540 + Math.sin(t * 2 + i) * 120} r={150 + hash(i, 1) * 80} fill={i % 2 ? A : B} />;
              })}
            {k === 1 &&
              Array.from({ length: 30 }, (_, i) => (
                <rect key={i} x={-400 + i * 90 + ((u * 300) % 180)} y={-200} width={45} height={1500} fill={i % 2 ? A : B} transform={`rotate(20 960 540)`} />
              ))}
            {k === 2 && (
              <>
                <rect width={1920} height={1080} fill={B} />
                {Array.from({ length: 5 }, (_, i) => (
                  <path key={i} d="M0,-260 L225,130 L-225,130Z" fill={i % 2 ? A : pal.bg} transform={`translate(${300 + i * 330} 540) rotate(${t * 60 * (i % 2 ? 1 : -1) + i * 30}) scale(${0.7 + 0.3 * Math.sin(t * 3 + i)})`} />
                ))}
              </>
            )}
          </g>
          {/* wipe to the next word */}
          {wipe > 0 && k < 2 && <rect x={lerp(-1920, 0, wipe)} y={0} width={1920} height={1080} fill={pal.bg} />}
        </Svg>
      )}
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={530} size={170} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Type with something inside."} x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - endAt - 0.4) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/stencil-type.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = seg;
