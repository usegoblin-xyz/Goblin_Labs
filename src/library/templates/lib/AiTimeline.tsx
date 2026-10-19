import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fit, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { years: string; moments: string; outro: string };

// A history of AI on a rising line: each milestone drops in as a year and a
// one-liner, while behind it a neural network grows a few nodes per era,
// sparse at first, then dense and firing by the present.
export default function AiTimeline({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const years = [...list(c.years || "1950, 1956, 1997, 2012, 2017, 2022"), "", "", "", "", "", ""].slice(0, 6);
  const moments = [...list(c.moments || "Can machines think?, The field gets a name, A computer wins at chess, Deep learning sees, Attention is all you need, Chat goes mainstream"), "", "", "", "", "", ""].slice(0, 6);
  const per = 1.45;
  const start = 0.6;
  const cur = Math.min(5, Math.max(0, Math.floor((t - start) / per)));
  const local = t - start - cur * per;
  const grow = c01((t - start) / (per * 6));
  const outro = expInOut(seg(t, start + 6 * per + 0.3, 0.6));
  const endP = c01((t - (start + 6 * per + 0.7)) / 0.8);
  // network: nodes reveal progressively
  const NN = 90;
  const nodes = Array.from({ length: NN }, (_, i) => ({ x: 960 + (hash(i, 1) - 0.5) * 1700, y: 540 + (hash(i, 2) - 0.5) * 900, at: (i / NN) * 0.95 }));
  const edges: [number, number][] = [];
  for (let i = 1; i < NN; i++) {
    let best = 0;
    let bd = 1e9;
    for (let j = 0; j < i; j++) {
      const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
      if (d < bd) {
        bd = d;
        best = j;
      }
    }
    edges.push([i, best]);
    if (hash(i, 9) > 0.5) edges.push([i, Math.floor(hash(i, 8) * i)]);
  }
  // timeline points rise left → right
  const px = (i: number) => 220 + i * 296;
  const py = (i: number) => 820 - Math.pow(i / 5, 1.8) * 520;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        <g opacity={1 - outro}>
          {edges.map(([a, z], k) => {
            const on = grow > nodes[a].at;
            if (!on) return null;
            const fire = Math.exp(-((t * 1.6 + hash(k, 3) * 6) % 6) * 2);
            return <line key={k} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[z].x} y2={nodes[z].y} stroke={fire > 0.3 && grow > 0.6 ? pal.v : pal.line} strokeWidth={fire > 0.3 && grow > 0.6 ? 2.5 : 1.5} opacity={0.6} />;
          })}
          {nodes.map((n, i) => (grow > n.at ? <circle key={i} cx={n.x} cy={n.y} r={3 + spring((grow - n.at) * 10, 18, 0.5) * 3} fill={pal.faint} /> : null))}
          {/* the timeline */}
          <polyline points={Array.from({ length: cur + 1 }, (_, i) => `${px(i)},${py(i)}`).join(" ")} fill="none" stroke={pal.v} strokeWidth={6} />
          {cur < 5 && <line x1={px(cur)} y1={py(cur)} x2={lerp(px(cur), px(cur + 1), cubicInOut(c01((local - per + 0.4) / 0.4)))} y2={lerp(py(cur), py(cur + 1), cubicInOut(c01((local - per + 0.4) / 0.4)))} stroke={pal.v} strokeWidth={6} />}
          {Array.from({ length: cur + 1 }, (_, i) => (
            <g key={i}>
              <circle cx={px(i)} cy={py(i)} r={i === cur ? 18 : 11} fill={i === cur ? pal.v : pal.fg} />
              <text x={px(i)} y={py(i) + 52} textAnchor="middle" fontFamily={ff} fontSize={i === cur ? 34 : 26} fontWeight={700} fill={i === cur ? pal.fg : pal.muted}>
                {years[i]}
              </text>
            </g>
          ))}
        </g>
        {/* current milestone, big */}
        {t < start + 6 * per + 0.3 && t > start && (
          <>
            <Txt key={`y${cur}`} text={years[cur]} x={140} y={250} size={170} weight={900} color={pal.fg} font={ff} anchor="start" p={c01(local / 0.35)} out={c01((local - per + 0.2) / 0.2)} tracking={-0.05} mode="drop" />
            <Txt key={`m${cur}`} text={moments[cur]} x={150} y={330} size={fit(moments[cur], 1200, 56, 700, -0.02, ff)} weight={700} color={pal.v} font={ff} anchor="start" p={c01((local - 0.15) / 0.4)} out={c01((local - per + 0.2) / 0.2)} />
          </>
        )}
        {endP > 0 && (
          <>
            <Txt text={c.outro || "And it's only the beginning."} x={960} y={530} size={96} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.03} />
            <Txt text={nameOf(b)} x={960} y={650} size={48} weight={600} color={pal.v} font={ff} p={c01((t - (start + 6 * per + 1.1)) / 0.6)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/ai-timeline.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = expOut;
