import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, expInOut, fontOf, hash, nameOf, palette, seg, useT } from "../../motion";

type C = { features: string; tagline: string };

// A genomics promo: a DNA double helix spins horizontally across the frame
// with depth-sorted base pairs; a scanner bracket slides along it, reading
// letters into a sequence ticker; one pair flashes as a variant, and a
// spectrum bar chart of results grows beneath.
export default function DnaHelix({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const feats = [...list(c.features || "Whole genome, 30× coverage, Results in 5 days"), "Feature", "Feature", "Feature"].slice(0, 3);
  const N = 48;
  const CY = 400;
  const A = 160;
  const spin = t * 2.2;
  const scan = c01((t - 1.2) / 4.0);
  const scanX = 160 + scan * 1600;
  const bases = "ACGT";
  const comp: Record<string, string> = { A: "T", T: "A", C: "G", G: "C" };
  const seq = Array.from({ length: N }, (_, i) => bases[Math.floor(hash(i, 3) * 4)]);
  const variant = 31;
  const bcol: Record<string, string> = { A: pal.v, T: pal.a, C: "#38a3ff", G: "#f28ab2" };
  const outro = expInOut(seg(t, 8.6, 0.5));
  const endP = c01((t - 9.0) / 0.8);
  const read = seq.slice(0, Math.floor(scan * N)).join("");
  const pairs = Array.from({ length: N }, (_, i) => {
    const x = 160 + (i / (N - 1)) * 1600;
    const a = i * 0.42 + spin;
    const y1 = CY + Math.sin(a) * A;
    const y2 = CY - Math.sin(a) * A;
    const z = Math.cos(a);
    return { i, x, y1, y2, z };
  });

  return (
    <AbsoluteFill style={{ background: "#060912", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          {pairs
            .slice()
            .sort((p, q) => Math.abs(p.z) - Math.abs(q.z))
            .map(({ i, x, y1, y2, z }) => {
              const flash = i === variant && t > 3.6 ? 0.5 + 0.5 * Math.sin(t * 12) : 0;
              const lit = x < scanX;
              return (
                <g key={i} opacity={0.35 + 0.65 * Math.abs(z)}>
                  <line x1={x} y1={y1} x2={x} y2={(y1 + y2) / 2} stroke={flash ? "#ff3b5c" : bcol[seq[i]]} strokeWidth={6} opacity={lit ? 1 : 0.5} />
                  <line x1={x} y1={(y1 + y2) / 2} x2={x} y2={y2} stroke={flash ? "#ff3b5c" : bcol[comp[seq[i]]]} strokeWidth={6} opacity={lit ? 1 : 0.5} />
                  <circle cx={x} cy={y1} r={9 + 3 * z} fill="#e8ecff" />
                  <circle cx={x} cy={y2} r={9 - 3 * z} fill="#e8ecff" />
                </g>
              );
            })}
          {/* backbones */}
          {[1, -1].map((s) => (
            <polyline key={s} points={pairs.map((p) => `${p.x},${s > 0 ? p.y1 : p.y2}`).join(" ")} fill="none" stroke="#e8ecff" strokeWidth={3} opacity={0.5} />
          ))}
          {/* scanner */}
          {scan > 0 && scan < 1 && (
            <g>
              <rect x={scanX - 30} y={CY - A - 40} width={60} height={2 * A + 80} rx={14} fill="none" stroke={pal.v} strokeWidth={4} />
              <rect x={scanX - 30} y={CY - A - 40} width={60} height={2 * A + 80} rx={14} fill={pal.v} opacity={0.12} />
            </g>
          )}
          {t > 3.6 && t < 6 && (
            <g opacity={c01((t - 3.6) * 3)}>
              <line x1={pairs[variant].x} y1={CY - A - 50} x2={pairs[variant].x} y2={CY - A - 110} stroke="#ff3b5c" strokeWidth={3} />
              <text x={pairs[variant].x} y={CY - A - 124} textAnchor="middle" fontFamily={MONO} fontSize={26} fill="#ff3b5c">
                variant found
              </text>
            </g>
          )}
        </Svg>
        {/* sequence ticker */}
        <div style={{ position: "absolute", left: 160, right: 160, top: 640, fontFamily: MONO, fontSize: 34, letterSpacing: "0.3em", whiteSpace: "nowrap", overflow: "hidden", color: "#9aa6c8" }}>
          {read.split("").map((ch, i) => (
            <span key={i} style={{ color: i === variant ? "#ff3b5c" : bcol[ch] }}>
              {ch}
            </span>
          ))}
          <span style={{ color: pal.v }}>▍</span>
        </div>
        {/* spectrum bars */}
        <Svg>
          {Array.from({ length: 40 }, (_, i) => {
            const h = (20 + hash(i, 9) * 150) * c01((t - 5.2 - i * 0.02) / 0.5);
            return <rect key={i} x={160 + i * 40} y={960 - h} width={30} height={h} rx={6} fill={["#38a3ff", pal.v, pal.a, "#f28ab2"][i % 4]} opacity={0.85} />;
          })}
        </Svg>
        <div style={{ position: "absolute", left: 160, top: 70, display: "flex", gap: 20 }}>
          {feats.map((f, i) => (
            <div key={i} style={{ padding: "12px 24px", borderRadius: 24, border: "2px solid #2a3350", color: "#cfd6ee", fontSize: 26, fontWeight: 600, opacity: c01((t - 0.4 - i * 0.2) * 3) }}>
              {f}
            </div>
          ))}
        </div>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="Read your code." x={960} y={500} size={130} weight={800} color="#fff" font={ff} p={endP} tracking={-0.04} />
          <Txt text={`${nameOf(b)} · ${c.tagline || "genomics, made clear"}`} x={960} y={620} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 9.4) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/dna-helix.wav" on={audio} />
    </AbsoluteFill>
  );
}
