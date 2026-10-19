import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { c01, expOut, fontOf, hash, lerp, nameOf, palette, seg, useT } from "../../motion";
import { Track } from "../../motion";

type C = { title: string; steps: string; outro: string };

// A whiteboard explainer: a marker draws a title, three boxed steps joined
// by arrows, and doodles that circle the key word, all in hand-wobbled
// strokes on a white board. The marker itself rides the stroke being drawn.
const INKC = "#1d1d1f";
function wobble(d: [number, number][], seed: number, amp = 3) {
  return "M" + d.map(([x, y], i) => `${(x + (hash(seed, i, 1) - 0.5) * amp).toFixed(1)},${(y + (hash(seed, i, 2) - 0.5) * amp).toFixed(1)}`).join(" L");
}
function rectPts(x: number, y: number, w: number, h: number): [number, number][] {
  const pts: [number, number][] = [];
  const n = 12;
  for (let i = 0; i <= n; i++) pts.push([x + (w * i) / n, y]);
  for (let i = 1; i <= n / 2; i++) pts.push([x + w, y + (h * i) / (n / 2)]);
  for (let i = 1; i <= n; i++) pts.push([x + w - (w * i) / n, y + h]);
  for (let i = 1; i <= n / 2 + 1; i++) pts.push([x, y + h - (h * i) / (n / 2)]);
  return pts;
}

export default function Whiteboard({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = '"Comic Sans MS", "Chalkboard SE", "Marker Felt", ' + fontOf(b);
  const steps = [...list(c.steps || "One prompt, One answer, Ship the film"), "Step", "Step", "Step"].slice(0, 3);
  const title = c.title || "How it works";
  // strokes in order: [path, start, duration, color, width]
  type S = { d: string; at: number; dur: number; col: string; w: number; len: number };
  const strokes: S[] = [];
  const BX = [200, 760, 1320];
  steps.forEach((_, i) => {
    strokes.push({ d: wobble(rectPts(BX[i], 420, 400, 260), i + 3), at: 1.6 + i * 1.6, dur: 0.7, col: INKC, w: 7, len: 1 });
    if (i < 2) strokes.push({ d: `${wobble([[BX[i] + 420, 550], [BX[i] + 470, 548], [BX[i] + 520, 552], [BX[i] + 540, 550]], 20 + i)} M${BX[i] + 515},528 L${BX[i] + 542},550 L${BX[i] + 515},574`, at: 2.6 + i * 1.6, dur: 0.4, col: INKC, w: 7, len: 1 });
  });
  strokes.push({ d: wobble(Array.from({ length: 40 }, (_, i) => [BX[2] + 200 + Math.cos((i / 36) * Math.PI * 2.2) * 260, 550 + Math.sin((i / 36) * Math.PI * 2.2) * 170]), 40, 6), at: 6.6, dur: 0.8, col: pal.v, w: 9, len: 1 });
  strokes.push({ d: wobble([[520, 230], [700, 240], [900, 226], [1100, 238], [1400, 230]], 50, 5), at: 1.0, dur: 0.5, col: pal.v, w: 10, len: 1 });
  const active = strokes.filter((s) => t >= s.at && t < s.at + s.dur).pop();
  const outro = c01((t - 8.4) / 0.4);

  return (
    <AbsoluteFill style={{ background: "#fbfbf8", overflow: "hidden" }}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <g opacity={1 - outro}>
          <text x={960} y={200} textAnchor="middle" fontFamily={ff} fontSize={110} fontWeight={700} fill={INKC} style={{ clipPath: `inset(0 ${(1 - c01((t - 0.2) / 0.8)) * 100}% 0 0)` }}>
            {title}
          </text>
          {strokes.map((s, i) => {
            const p = c01((t - s.at) / s.dur);
            return p > 0 ? <path key={i} d={s.d} fill="none" stroke={s.col} strokeWidth={s.w} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 2`} /> : null;
          })}
          {steps.map((s, i) => {
            const at = 2.2 + i * 1.6;
            return (
              <g key={i}>
                <text x={BX[i] + 200} y={500} textAnchor="middle" fontFamily={ff} fontSize={44} fill={pal.v} fontWeight={700} opacity={c01((t - at) * 4)}>
                  {i + 1}
                </text>
                <text x={BX[i] + 200} y={590} textAnchor="middle" fontFamily={ff} fontSize={Math.min(52, 700 / Math.max(6, s.length))} fill={INKC} fontWeight={700} style={{ clipPath: `inset(0 ${(1 - c01((t - at - 0.1) / 0.6)) * 100}% 0 0)` }}>
                  {s}
                </text>
              </g>
            );
          })}
        </g>
        {/* marker */}
        {active && t < 8.4 && (() => {
          const p = c01((t - active.at) / active.dur);
          // approximate the pen position along the path by sampling coordinates
          const nums = active.d.match(/-?\d+\.?\d*/g)!.map(Number);
          const pts = [] as [number, number][];
          for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
          const k = Math.min(pts.length - 1, Math.floor(p * (pts.length - 1)));
          const [x, y] = pts[k];
          return (
            <g transform={`translate(${x} ${y}) rotate(-35)`}>
              <rect x={-6} y={-150} width={34} height={140} rx={8} fill={pal.v} />
              <rect x={-6} y={-40} width={34} height={30} fill="#333" />
              <path d="M-6,-10 L28,-10 L14,6Z" fill={INKC} />
            </g>
          );
        })()}
        {outro > 0 && (
          <>
            <text x={960} y={540} textAnchor="middle" fontFamily={ff} fontSize={96} fontWeight={700} fill={INKC} style={{ clipPath: `inset(0 ${(1 - c01((t - 8.6) / 0.8)) * 100}% 0 0)` }}>
              {c.outro || "That's it. Really."}
            </text>
            <text x={960} y={650} textAnchor="middle" fontFamily={fontOf(b)} fontSize={48} fontWeight={700} fill={pal.v} opacity={c01((t - 9.2) * 2)}>
              {nameOf(b)}
            </text>
          </>
        )}
      </svg>
      <Track src="tracks/whiteboard.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = [lerp, expOut, seg];
