import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, fontOf, hash, mix, nameOf, palette, seg, useT } from "../../motion";

type C = { role: string };

// A kaleidoscope showreel: a wedge of drifting shapes (circles, bars,
// triangles in brand colours) is mirrored twelve ways around the centre,
// so their simple motion blooms into symmetric patterns; the segment count
// steps up on beats, and the pattern contracts into the name.
export default function Kaleido({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const segsSeq = [6, 8, 12, 16];
  const k = Math.min(3, Math.floor(t / 2.0));
  const S = segsSeq[k];
  const contract = expInOut(seg(t, 7.6, 0.9));
  const outro = expInOut(seg(t, 9.6, 0.5));
  const cols = [pal.v, pal.a, "#38a3ff", "#f28ab2", "#ffd23f", mix(pal.v, "#fff", 0.4)];
  const R = 620 * (1 - contract * 0.85);
  const shapes = Array.from({ length: 14 }, (_, i) => {
    const r = (0.15 + hash(i, 1) * 0.85) * R;
    const a = hash(i, 2) * (Math.PI / S) + Math.sin(t * (0.5 + hash(i, 3)) + i) * 0.2;
    const x = Math.cos(a) * r + Math.sin(t * 1.3 + i) * 20;
    const y = Math.sin(a) * r;
    const s = (20 + hash(i, 4) * 50) * (1 - contract * 0.6) * (1 + 0.2 * Math.sin(t * 3 + i));
    const type = i % 3;
    const col = cols[i % cols.length];
    const rot = t * 60 * (i % 2 ? 1 : -1);
    return { x, y, s, type, col, rot };
  });
  const wedge = (
    <g>
      {shapes.map((sh, i) =>
        sh.type === 0 ? (
          <circle key={i} cx={sh.x} cy={sh.y} r={sh.s * 0.6} fill={sh.col} opacity={0.85} />
        ) : sh.type === 1 ? (
          <rect key={i} x={sh.x - sh.s} y={sh.y - sh.s * 0.2} width={sh.s * 2} height={sh.s * 0.4} rx={sh.s * 0.2} fill={sh.col} transform={`rotate(${sh.rot} ${sh.x} ${sh.y})`} opacity={0.85} />
        ) : (
          <path key={i} d={`M${sh.x},${sh.y - sh.s * 0.7} L${sh.x + sh.s * 0.6},${sh.y + sh.s * 0.4} L${sh.x - sh.s * 0.6},${sh.y + sh.s * 0.4} Z`} fill={sh.col} transform={`rotate(${sh.rot} ${sh.x} ${sh.y})`} opacity={0.85} />
        ),
      )}
    </g>
  );

  return (
    <AbsoluteFill style={{ background: "#08060f", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          <defs>
            <clipPath id={`kl-w${S}`}>
              <path d={`M0,0 L${1400},0 A1400,1400 0 0 1 ${Math.cos(Math.PI / S) * 1400},${Math.sin(Math.PI / S) * 1400} Z`} />
            </clipPath>
          </defs>
          <g transform={`translate(960 540) rotate(${t * 8})`}>
            {Array.from({ length: S }, (_, i) => (
              <g key={i} transform={`rotate(${(i * 360) / S}) ${i % 2 ? `scale(1 -1) rotate(${-180 / S})` : ""}`}>
                <g clipPath={`url(#kl-w${S})`}>{wedge}</g>
              </g>
            ))}
          </g>
          <circle cx={960} cy={540} r={40 + contract * 200} fill="#08060f" opacity={contract} />
          {contract > 0.5 && (
            <>
              <Txt text={nameOf(b)} x={960} y={560} size={110} weight={900} color="#fff" font={ff} p={c01((t - 8.1) / 0.5)} tracking={-0.03} mode="scale" />
              <Txt text={c.role || "Pattern & motion"} x={960} y={1000} size={40} weight={600} color="#fff" font={ff} p={c01((t - 8.5) / 0.6)} tracking={0.15} mode="fade" />
            </>
          )}
        </Svg>
      </div>
      <Track src="tracks/kaleido.wav" on={audio} />
    </AbsoluteFill>
  );
}
