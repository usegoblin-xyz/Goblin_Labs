import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { title: string; branch: string; outro: string };

// Version control in one picture: commits land on main, a branch splits off
// and gets its own commits, main moves on, the branch merges back, and each
// step's command types in a terminal strip with a one-line meaning.
type Node = { x: number; y: number; at: number; lane: 0 | 1; merge?: boolean };

export default function GitExplained({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const branch = c.branch || "feature";
  const Y0 = 420;
  const Y1 = 640;
  const nodes: Node[] = [
    { x: 260, y: Y0, at: 1.0, lane: 0 },
    { x: 480, y: Y0, at: 1.6, lane: 0 },
    { x: 700, y: Y1, at: 3.0, lane: 1 },
    { x: 920, y: Y1, at: 3.6, lane: 1 },
    { x: 1000, y: Y0, at: 4.6, lane: 0 },
    { x: 1140, y: Y1, at: 5.2, lane: 1 },
    { x: 1400, y: Y0, at: 6.4, lane: 0, merge: true },
    { x: 1640, y: Y0, at: 7.2, lane: 0 },
  ];
  const steps: [number, string, string][] = [
    [0.8, "git commit -m \"first\"", "Save a snapshot"],
    [2.6, `git switch -c ${branch}`, "Start a separate line of work"],
    [4.4, "git commit (on main)", "Main keeps moving"],
    [6.0, `git merge ${branch}`, "Bring the work back together"],
  ];
  const cur = steps.filter((s) => t >= s[0]).pop();
  const titleOut = expInOut(seg(t, 0.6, 0.4));
  const outro = expInOut(seg(t, 8.4, 0.5));
  const endP = c01((t - 8.8) / 0.8);
  const edge = (a: Node, z: Node) => (a.y === z.y ? `M${a.x},${a.y} L${z.x},${z.y}` : `M${a.x},${a.y} C${lerp(a.x, z.x, 0.6)},${a.y} ${lerp(a.x, z.x, 0.4)},${z.y} ${z.x},${z.y}`);
  const links: [number, number][] = [[0, 1], [1, 2], [2, 3], [1, 4], [3, 5], [4, 6], [5, 6], [6, 7]];

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        <Txt text={c.title || "What is Git?"} x={960} y={560} size={150} weight={800} color={pal.fg} font={ff} p={c01((t - 0.05) / 0.4)} out={titleOut} tracking={-0.04} />
        <g opacity={1 - outro}>
          <text x={120} y={Y0 + 12} fontFamily={MONO} fontSize={28} fill={pal.muted} opacity={c01((t - 0.9) * 2)}>
            main
          </text>
          <text x={120} y={Y1 + 12} fontFamily={MONO} fontSize={28} fill={pal.a} opacity={c01((t - 2.9) * 2)}>
            {branch}
          </text>
          {links.map(([a, z], i) => {
            const A = nodes[a];
            const Z = nodes[z];
            const p = expOut(seg(t, Z.at - 0.35, 0.4));
            return <path key={i} d={edge(A, Z)} fill="none" stroke={Z.lane || A.lane ? (A.lane && Z.lane ? pal.a : pal.faint) : pal.v} strokeWidth={8} pathLength={1} strokeDasharray={`${p} 2`} strokeLinecap="round" />;
          })}
          {nodes.map((n, i) => {
            const p = spring(t - n.at, 18, 0.5);
            return (
              <g key={i} transform={`translate(${n.x} ${n.y}) scale(${Math.max(0, p)})`}>
                <circle r={n.merge ? 34 : 26} fill={pal.bg} stroke={n.lane ? pal.a : pal.v} strokeWidth={8} />
                {n.merge && <circle r={14} fill={pal.v} />}
              </g>
            );
          })}
          {/* HEAD pointer */}
          {t > 1.0 &&
            (() => {
              const last = nodes.filter((n) => t >= n.at).pop()!;
              const prev = nodes.filter((n) => t >= n.at)[nodes.filter((n) => t >= n.at).length - 2] ?? last;
              const u = cubicInOut(c01((t - last.at) / 0.4));
              const x = lerp(prev.x, last.x, u);
              const y = lerp(prev.y, last.y, u) - 70;
              return (
                <g transform={`translate(${x} ${y})`}>
                  <rect x={-50} y={-26} width={100} height={40} rx={10} fill={pal.fg} />
                  <text y={2} textAnchor="middle" fontFamily={MONO} fontSize={22} fontWeight={700} fill={pal.bg}>
                    HEAD
                  </text>
                  <path d="M-8,14 L0,24 L8,14Z" fill={pal.fg} />
                </g>
              );
            })()}
        </g>
      </Svg>
      {cur && (
        <div style={{ position: "absolute", left: 120, right: 120, top: 820, height: 150, borderRadius: 28, background: pal.card, display: "flex", alignItems: "center", gap: 50, padding: "0 50px", opacity: 1 - outro }}>
          <div style={{ fontFamily: MONO, fontSize: 38, color: pal.v, whiteSpace: "nowrap" }}>
            $ {cur[1].slice(0, Math.floor(c01((t - cur[0]) / 0.6) * cur[1].length))}
          </div>
          <div style={{ marginLeft: "auto", fontSize: 38, fontWeight: 600, color: pal.fg, opacity: c01((t - cur[0] - 0.5) * 3), whiteSpace: "nowrap" }}>{cur[2]}</div>
        </div>
      )}
      {endP > 0 && (
        <Svg>
          <Txt text={c.outro || "History you can always go back to."} x={960} y={520} size={86} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.03} />
          <Txt text={nameOf(b)} x={960} y={640} size={48} weight={600} color={pal.v} font={ff} p={c01((t - 9.2) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/git-explained.wav" on={audio} />
    </AbsoluteFill>
  );
}
