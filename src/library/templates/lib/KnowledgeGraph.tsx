import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, expInOut, expOut, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { notes: string; question: string; tagline: string };

// A second brain: scattered notes drop in as cards, shrink into nodes, link
// up into a graph that breathes, and a typed question lights the path
// through the notes that answer it.
const N = 18;
function layout(i: number) {
  // a deterministic, roughly even scatter in an ellipse
  const a = i * 2.39996;
  const r = Math.sqrt((i + 0.5) / N);
  return { x: 960 + Math.cos(a) * r * 640, y: 500 + Math.sin(a) * r * 330 };
}

export default function KnowledgeGraph({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const notes = [...list(c.notes || "Meeting notes, Book highlights, Ideas, Recipes, Reading list, Project plan"), "Note", "Note", "Note", "Note", "Note", "Note"].slice(0, 6);
  const question = c.question || "What did I learn about pricing?";
  const nodes = Array.from({ length: N }, (_, i) => layout(i));
  const links: [number, number][] = [];
  for (let i = 1; i < N; i++) {
    links.push([i, Math.floor(hash(i, 1) * i)]);
    if (hash(i, 2) > 0.55) links.push([i, Math.floor(hash(i, 3) * i)]);
  }
  const shrink = expInOut(seg(t, 2.6, 0.8));
  const linkP = (k: number) => expOut(seg(t, 3.2 + k * 0.04, 0.4));
  const ask = c01((t - 5.0) / 1.0);
  const path = [0, 3, 7, 12, 16];
  const lit = (k: number) => c01((t - 6.2 - k * 0.25) * 4);
  const outro = expInOut(seg(t, 8.4, 0.5));
  const endP = c01((t - 8.8) / 0.8);
  const breathe = (i: number) => Math.sin(t * 1.2 + i) * 6;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          {links.map(([a, z], k) => {
            const A = nodes[a];
            const Z = nodes[z];
            const onPath = path.includes(a) && path.includes(z) && Math.abs(path.indexOf(a) - path.indexOf(z)) === 1;
            const lp = linkP(k);
            const lightK = onPath ? lit(Math.max(path.indexOf(a), path.indexOf(z))) : 0;
            return <line key={k} x1={A.x + breathe(a)} y1={A.y + breathe(a + 3)} x2={lerp(A.x + breathe(a), Z.x + breathe(z), lp)} y2={lerp(A.y + breathe(a + 3), Z.y + breathe(z + 3), lp)} stroke={lightK > 0 ? pal.v : pal.line} strokeWidth={lightK > 0 ? 6 : 3} />;
          })}
          {nodes.map((n, i) => {
            const isNote = i < notes.length;
            const p = spring(t - 0.2 - i * 0.12, 16, 0.65);
            const onPath = path.indexOf(i);
            const glow = onPath >= 0 ? lit(onPath) : 0;
            const r = isNote ? lerp(0, 16, shrink) : 12;
            return (
              <g key={i} transform={`translate(${n.x + breathe(i)} ${n.y + breathe(i + 3)}) scale(${Math.max(0, p)})`} opacity={isNote ? 1 : c01((t - 2.8) * 2)}>
                {glow > 0 && <circle r={34} fill={pal.v} opacity={0.25 * glow} />}
                <circle r={r} fill={glow > 0 ? pal.v : pal.fg} />
              </g>
            );
          })}
        </Svg>
        {/* the notes as cards before they shrink */}
        {notes.map((n, i) => {
          const p = spring(t - 0.2 - i * 0.12, 16, 0.65);
          const node = nodes[i];
          const w = lerp(300, 0, shrink);
          if (w < 4) return null;
          return (
            <div key={i} style={{ position: "absolute", left: node.x - w / 2, top: node.y - lerp(60, 0, shrink), width: w, height: lerp(120, 0, shrink), borderRadius: 18, background: pal.card2, transform: `translateY(${(1 - p) * -200}px) rotate(${(hash(i, 4) - 0.5) * 8 * (1 - shrink)}deg)`, opacity: c01(p * 2) * (1 - shrink), padding: 20, boxSizing: "border-box", overflow: "hidden" }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: pal.fg, whiteSpace: "nowrap" }}>{n}</div>
              <div style={{ marginTop: 12, height: 10, width: "80%", borderRadius: 5, background: pal.faint }} />
              <div style={{ marginTop: 8, height: 10, width: "55%", borderRadius: 5, background: pal.faint }} />
            </div>
          );
        })}
        {/* the question */}
        {t > 4.8 && (
          <div style={{ position: "absolute", left: 960, top: 960, transform: `translateX(-50%) translateY(${(1 - spring(t - 4.8, 16, 0.7)) * 120}px)`, padding: "24px 40px", borderRadius: 40, background: pal.card2, fontFamily: MONO, fontSize: 34, color: pal.fg, whiteSpace: "nowrap" }}>
            {question.slice(0, Math.floor(ask * question.length))}
            {ask < 1 && <span style={{ color: pal.v }}>▍</span>}
          </div>
        )}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={c.tagline || "Remember everything."} x={960} y={530} size={140} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={nameOf(b)} x={960} y={650} size={50} weight={600} color={pal.v} font={ff} p={c01((t - 9.2) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/knowledge-graph.wav" on={audio} />
    </AbsoluteFill>
  );
}
