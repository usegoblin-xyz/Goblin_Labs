import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { book: string; chapters: string; summary: string };

// A book-to-mind-map explainer: a book cover sits in the centre; chapters
// branch out as curved limbs with labels, each sprouting two small idea
// leaves; then every branch retracts and the leaves collapse into one
// summary sentence card under the book.
export default function ChapterMap({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const book = c.book || "Deep Habits";
  const chapters = [...list(c.chapters || "Cues, Cravings, Response, Reward, Identity, Systems"), "Chapter", "Chapter", "Chapter", "Chapter", "Chapter", "Chapter"].slice(0, 6);
  const summary = c.summary || "Change the system, and the habits follow.";
  const CX = 960;
  const CY = 500;
  const grow = (i: number) => cubicInOut(c01((t - 1.0 - i * 0.3) / 0.6));
  const leaf = (i: number) => spring(t - 1.6 - i * 0.3, 16, 0.55);
  const collapse = expInOut(seg(t, 5.2, 0.9));
  const card = spring(t - 5.9, 14, 0.65);
  const outro = expInOut(seg(t, 8.4, 0.5));
  const cols = [pal.v, pal.a, "#38a3ff", "#f28ab2", "#f2b64a", "#2fbf71"];

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          {chapters.map((ch, i) => {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 2 + Math.PI / 6;
            const g = grow(i) * (1 - collapse);
            const ex = CX + Math.cos(a) * 470 * g;
            const ey = CY + Math.sin(a) * 300 * g;
            const mx = CX + Math.cos(a) * 200;
            const my = CY + Math.sin(a) * 60;
            return (
              <g key={i}>
                <path d={`M${CX},${CY} Q${mx},${my} ${ex},${ey}`} fill="none" stroke={cols[i]} strokeWidth={10} strokeLinecap="round" />
                {g > 0.6 && (
                  <>
                    {[-1, 1].map((s) => {
                      const la = a + s * 0.5;
                      const lx = ex + Math.cos(la) * 90 * leaf(i) * (1 - collapse);
                      const ly = ey + Math.sin(la) * 70 * leaf(i) * (1 - collapse);
                      return (
                        <g key={s}>
                          <line x1={ex} y1={ey} x2={lx} y2={ly} stroke={cols[i]} strokeWidth={4} />
                          <circle cx={lx} cy={ly} r={14 * leaf(i)} fill={cols[i]} opacity={0.6} />
                        </g>
                      );
                    })}
                    <circle cx={ex} cy={ey} r={22} fill={cols[i]} />
                    <text x={ex + Math.cos(a) * 40} y={ey + Math.sin(a) * 40 + 12} textAnchor={Math.cos(a) > 0.2 ? "start" : Math.cos(a) < -0.2 ? "end" : "middle"} fontFamily={ff} fontSize={38} fontWeight={800} fill={pal.fg} opacity={c01((g - 0.6) * 3)}>
                      {ch}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </Svg>
        {/* book */}
        <div style={{ position: "absolute", left: CX - 110, top: CY - 150 - collapse * 130, width: 220, height: 300, borderRadius: "6px 16px 16px 6px", background: pal.v, boxShadow: "inset 14px 0 0 rgba(0,0,0,0.2), 0 20px 40px rgba(0,0,0,0.3)", transform: `scale(${spring(t - 0.2, 14, 0.6) * lerp(1, 0.8, collapse)})`, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, boxSizing: "border-box", textAlign: "center" }}>
          <div style={{ fontSize: 40, fontWeight: 900, color: pal.onV, lineHeight: 1.05 }}>{book}</div>
        </div>
        {card > 0.01 && (
          <div style={{ position: "absolute", left: 360, right: 360, top: 640, padding: "40px 50px", borderRadius: 30, background: pal.card, textAlign: "center", transform: `scale(${card})` }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: pal.muted, letterSpacing: "0.12em", marginBottom: 10 }}>THE WHOLE BOOK IN ONE LINE</div>
            <div style={{ fontSize: 58, fontWeight: 800, color: pal.fg, letterSpacing: "-0.02em" }}>{summary}</div>
          </div>
        )}
      </div>
      {outro > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={520} size={150} weight={900} color={pal.fg} font={ff} p={c01((t - 8.8) / 0.6)} tracking={-0.04} />
          <Txt text="Books, mapped." x={960} y={630} size={48} weight={600} color={pal.v} font={ff} p={c01((t - 9.1) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/chapter-map.wav" on={audio} />
    </AbsoluteFill>
  );
}
