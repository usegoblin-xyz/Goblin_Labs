import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fit, fontOf, hash, lerp, nameOf, palette, seg, useT } from "../../motion";

type C = { pages: string; chapters: string; points: string; line: string };

// Four layers of a summary: hundreds of page slivers collapse into chapter
// cards, chapter cards collapse into key points, the points collapse into a
// single sentence; a counter on the left tracks each step down.
export default function SummaryLayers({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const pages = Number(c.pages || 300);
  const chapters = Number(c.chapters || 12);
  const points = Number(c.points || 40);
  const line = c.line || "Small habits, repeated, become who you are.";
  const L = [
    { n: pages, label: "pages" },
    { n: chapters, label: "chapters" },
    { n: points, label: "key points" },
    { n: 1, label: "sentence" },
  ];
  const step = (i: number) => cubicInOut(seg(t, 1.6 + i * 1.8, 0.9));
  const s0 = step(0); // pages → chapters
  const s1 = step(1); // chapters → points
  const s2 = step(2); // points → sentence
  const level = s2 > 0.5 ? 3 : s1 > 0.5 ? 2 : s0 > 0.5 ? 1 : 0;
  const outro = expInOut(seg(t, 8.4, 0.5));
  const endP = c01((t - 8.8) / 0.8);
  const AX = 1180;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* the counter */}
        <div style={{ position: "absolute", left: 120, top: 360 }}>
          <div key={level} style={{ fontSize: 220, fontWeight: 900, letterSpacing: "-0.05em", color: level === 3 ? pal.v : pal.fg, lineHeight: 1 }}>{L[level].n}</div>
          <div style={{ fontSize: 48, color: pal.muted, fontWeight: 600 }}>{L[level].label}</div>
          <div style={{ marginTop: 40, display: "flex", gap: 12 }}>
            {L.map((_, i) => (
              <div key={i} style={{ width: 70, height: 10, borderRadius: 5, background: i <= level ? pal.v : pal.card2 }} />
            ))}
          </div>
        </div>
        <Svg>
          {/* pages: thin slivers in a block */}
          {s0 < 1 &&
            Array.from({ length: 80 }, (_, i) => {
              const x = AX - 400 + (i % 40) * 20;
              const y = 260 + Math.floor(i / 40) * 290;
              const ci = Math.floor(i / 7) % 12;
              const tx = AX - 330 + (ci % 4) * 220;
              const ty = 280 + Math.floor(ci / 4) * 180;
              return <rect key={i} x={lerp(x, tx, s0)} y={lerp(y, ty, s0)} width={lerp(12, 180, s0)} height={lerp(260, 140, s0)} rx={lerp(2, 18, s0)} fill={pal.card2} opacity={lerp(0.9, 0, c01((s0 - 0.6) * 3))} />;
            })}
          {/* chapters */}
          {s0 > 0.5 &&
            s1 < 1 &&
            Array.from({ length: 12 }, (_, i) => {
              const x = AX - 330 + (i % 4) * 220;
              const y = 280 + Math.floor(i / 4) * 180;
              const tx = AX - 300 + (i % 3) * 300;
              const ty = 360 + Math.floor(i / 4) * 0 + (i % 4) * 0 + (Math.floor(i / 3) % 4) * 90;
              return (
                <g key={i} opacity={c01((s0 - 0.5) * 4) * (1 - c01((s1 - 0.6) * 3))}>
                  <rect x={lerp(x, tx, s1)} y={lerp(y, ty, s1)} width={lerp(180, 260, s1)} height={lerp(140, 64, s1)} rx={18} fill={i % 3 === 0 ? pal.v : pal.card2} />
                  <text x={lerp(x, tx, s1) + 20} y={lerp(y, ty, s1) + 44} fontFamily={ff} fontSize={26} fontWeight={700} fill={i % 3 === 0 ? pal.onV : pal.fg}>
                    Ch. {i + 1}
                  </text>
                </g>
              );
            })}
          {/* key points */}
          {s1 > 0.5 &&
            s2 < 1 &&
            Array.from({ length: 12 }, (_, i) => {
              const x = AX - 300 + (i % 3) * 300;
              const y = 360 + (Math.floor(i / 3) % 4) * 90;
              return (
                <g key={i} opacity={c01((s1 - 0.5) * 4) * (1 - s2)} transform={`translate(${lerp(x, AX - 120, s2)} ${lerp(y, 520, s2)}) scale(${lerp(1, 0.2, s2)})`}>
                  <circle cx={14} cy={20} r={10} fill={pal.v} />
                  <rect x={36} y={12} width={160 + hash(i, 1) * 60} height={16} rx={8} fill={pal.fg} opacity={0.8} />
                </g>
              );
            })}
          {s2 > 0.5 && <Txt text={line} x={AX} y={560} size={fit(line, 900, 64, 800, -0.03, ff)} weight={800} color={pal.fg} font={ff} p={c01((s2 - 0.5) * 2)} tracking={-0.03} />}
        </Svg>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={`${pages} pages. One sentence.`} x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - 9.2) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/summary-layers.wav" on={audio} />
    </AbsoluteFill>
  );
}
