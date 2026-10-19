import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { c01, hash, nameOf, palette, fontOf, useT } from "../../motion";
import { Track } from "../../motion";

type C = { title: string; idea1: string; idea2: string; idea3: string };

// A hand-drawn whiteboard explainer of a rugged landscape: a marker draws a
// bumpy energy curve, balls drop and settle into different valleys, the
// valleys get grouped into a branching tree, and three captions explain.
const INK = "#1d1d1f";
function wob(pts: [number, number][], seed: number, a = 2.5) {
  return "M" + pts.map(([x, y], i) => `${(x + (hash(seed, i) - 0.5) * a).toFixed(1)},${(y + (hash(seed, i, 2) - 0.5) * a).toFixed(1)}`).join(" L");
}
const curveY = (x: number) => 620 + Math.sin(x / 70) * 60 + Math.sin(x / 31 + 1) * 35 + Math.sin(x / 140 + 2) * 70;

export default function EnergyLandscape({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = '"Comic Sans MS", "Chalkboard SE", "Marker Felt", ' + fontOf(b);
  const curve = Array.from({ length: 120 }, (_, i) => [160 + i * 13.5, curveY(160 + i * 13.5)] as [number, number]);
  const draw = c01((t - 1.0) / 1.4);
  // find local minima as valleys
  const valleys: number[] = [];
  for (let i = 2; i < curve.length - 2; i++) if (curve[i][1] > curve[i - 1][1] && curve[i][1] >= curve[i + 1][1] && curve[i][1] > curve[i - 2][1]) valleys.push(i);
  const balls = valleys.slice(0, 6);
  const treeP = c01((t - 6.4) / 1.6);
  const cap = (i: number) => c01((t - [2.8, 4.8, 6.6][i]) / 0.8);
  const outro = c01((t - 9.6) / 0.4);

  return (
    <AbsoluteFill style={{ background: "#fbfbf8", overflow: "hidden" }}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <g opacity={1 - outro}>
          <text x={960} y={150} textAnchor="middle" fontFamily={ff} fontSize={84} fontWeight={700} fill={INK} style={{ clipPath: `inset(0 ${(1 - c01((t - 0.2) / 0.8)) * 100}% 0 0)` }}>
            {c.title || "Why some systems get stuck"}
          </text>
          <path d={wob(curve, 1)} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${draw} 2`} />
          {/* balls drop into valleys */}
          {balls.map((vi, k) => {
            const [vx, vy] = curve[vi];
            const t0 = 2.6 + k * 0.25;
            const u = c01((t - t0) / 0.9);
            const sx = vx + (hash(k, 3) - 0.5) * 120;
            const x = sx + (vx - sx) * (1 - Math.pow(1 - u, 3));
            const y = u < 0.5 ? 240 + (curveY(x) - 26 - 240) * (u / 0.5) * (u / 0.5) : curveY(x) - 26 - Math.abs(Math.sin((u - 0.5) * 12)) * 20 * (1 - u);
            return t > t0 ? <circle key={k} cx={x} cy={Math.min(y, curveY(x) - 26)} r={22} fill={k % 2 ? pal.v : "#e5484d"} stroke={INK} strokeWidth={4} /> : null;
          })}
          {/* the tree grouping valleys */}
          {treeP > 0 &&
            (() => {
              const leaves = balls.map((vi) => curve[vi][0]);
              const y0 = 820;
              const segs: string[] = [];
              leaves.forEach((x) => segs.push(wob([[x, y0], [x, y0 + 60]], Math.round(x))));
              for (let i = 0; i + 1 < leaves.length; i += 2) segs.push(wob([[leaves[i], y0 + 60], [leaves[i + 1], y0 + 60]], i + 50));
              const mids = [] as number[];
              for (let i = 0; i + 1 < leaves.length; i += 2) mids.push((leaves[i] + leaves[i + 1]) / 2);
              mids.forEach((m) => segs.push(wob([[m, y0 + 60], [m, y0 + 120]], Math.round(m) + 3)));
              if (mids.length > 1) segs.push(wob([[mids[0], y0 + 120], [mids[mids.length - 1], y0 + 120]], 99));
              const root = (mids[0] + mids[mids.length - 1]) / 2;
              segs.push(wob([[root, y0 + 120], [root, y0 + 180]], 101));
              return segs.map((d, i) => <path key={i} d={d} fill="none" stroke={pal.v} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={`${c01(treeP * segs.length - i)} 2`} />);
            })()}
          {[c.idea1 || "Many valleys, not one", c.idea2 || "Each ball settles somewhere different", c.idea3 || "The valleys nest like a family tree"].map((s, i) => (
            <text key={i} x={[1500, 1500, 1500][i]} y={[300, 380, 460][i]} textAnchor="middle" fontFamily={ff} fontSize={40} fontWeight={700} fill={i === 2 ? pal.v : INK} style={{ clipPath: `inset(0 ${(1 - cap(i)) * 100}% 0 0)` }}>
              {`${i + 1}. ${s}`}
            </text>
          ))}
        </g>
        {outro > 0 && (
          <text x={960} y={560} textAnchor="middle" fontFamily={fontOf(b)} fontSize={110} fontWeight={800} fill={INK} opacity={outro}>
            {nameOf(b)}
          </text>
        )}
      </svg>
      <Track src="tracks/energy-landscape.wav" on={audio} />
    </AbsoluteFill>
  );
}
