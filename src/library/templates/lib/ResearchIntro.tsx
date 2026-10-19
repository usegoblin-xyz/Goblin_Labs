import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { name: string; field: string; question: string; topics: string };

// A researcher's intro: a stack of paper pages fans out, a single
// highlighted question lifts off the top page, then a citation graph grows
// around it (nodes for topics linking to the question), the graph rotates
// slowly, and the researcher's name and field sign it.
export default function ResearchIntro({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = c.name || nameOf(b);
  const field = c.field || "PhD candidate · computational biology";
  const question = c.question || "How do cells decide what to become?";
  const topics = [...list(c.topics || "Gene networks, Single-cell data, Development, Machine learning, Imaging, Evolution"), "Topic", "Topic", "Topic", "Topic", "Topic", "Topic"].slice(0, 6);
  const fan = expInOut(seg(t, 0.3, 0.9));
  const lift = expInOut(seg(t, 1.6, 0.8));
  const graph = c01((t - 2.6) / 2.2);
  const outro = expInOut(seg(t, 8.0, 0.5));
  const endP = c01((t - 6.2) / 0.8);
  const rot = t * 6;
  const CX = 960;
  const CY = 470;
  const nodes = topics.map((tp, i) => {
    const a = ((i / 6) * 360 + rot) * (Math.PI / 180);
    const r = 330 + hash(i) * 60;
    return { x: CX + Math.cos(a) * r * 1.4, y: CY + Math.sin(a) * r * 0.75, tp };
  });

  return (
    <AbsoluteFill style={{ background: pal.dark ? "#0d0e11" : "#f5f3ee", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* paper stack */}
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} style={{ position: "absolute", left: 960 - 260, top: 260, width: 520, height: 680, background: "#fffdf8", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", transform: `translateX(${(i - 2.5) * 120 * fan}px) rotate(${(i - 2.5) * 6 * fan}deg)`, opacity: 1 - c01((t - 2.4) * 2) }}>
            {Array.from({ length: 14 }, (_, j) => (
              <div key={j} style={{ height: 10, borderRadius: 5, background: "#e2ddd2", margin: "26px 40px 0", width: `${55 + hash(i, j) * 35}%` }} />
            ))}
          </div>
        ))}
        {/* question */}
        <div style={{ position: "absolute", left: 0, right: 0, top: lerp(560, CY - 50, lift), textAlign: "center", opacity: c01((t - 1.2) * 3) }}>
          <span style={{ fontSize: lerp(36, 64, lift), fontWeight: 800, color: pal.fg, background: `linear-gradient(transparent 55%, ${pal.v}88 55%)`, padding: "0 10px" }}>{question}</span>
        </div>
        {/* graph */}
        <Svg>
          {nodes.map((n, i) => {
            const p = c01(graph * 1.6 - i * 0.12);
            return (
              <g key={i} opacity={p}>
                <line x1={CX} y1={CY - 20} x2={lerp(CX, n.x, p)} y2={lerp(CY - 20, n.y, p)} stroke={pal.v} strokeWidth={3} />
                {nodes.map((m, j) => (j === (i + 2) % 6 && p > 0.9 ? <line key={j} x1={n.x} y1={n.y} x2={m.x} y2={m.y} stroke={pal.line} strokeWidth={2} strokeDasharray="6 8" /> : null))}
              </g>
            );
          })}
          {nodes.map((n, i) => {
            const s = spring(t - 2.7 - i * 0.2, 16, 0.55);
            return (
              <g key={`n${i}`} transform={`translate(${n.x} ${n.y}) scale(${s})`}>
                <circle r={14} fill={i % 2 ? pal.a : pal.v} />
                <text y={-26} textAnchor="middle" fontFamily={ff} fontSize={32} fontWeight={700} fill={pal.fg}>
                  {n.tp}
                </text>
              </g>
            );
          })}
          {endP > 0 && (
            <>
              <Txt text={name} x={960} y={930} size={70} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.03} />
              <Txt text={field} x={960} y={1000} size={36} weight={500} color={pal.muted} font={ff} p={c01((t - 6.6) / 0.6)} mode="fade" />
            </>
          )}
        </Svg>
      </div>
      <Track src="tracks/research-intro.wav" on={audio} />
    </AbsoluteFill>
  );
}
