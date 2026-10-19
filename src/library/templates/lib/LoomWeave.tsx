import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, nameOf, palette, seg, useT } from "../../motion";

type C = { steps: string; tagline: string };

// A handwoven-textile explainer: warp threads stretch taut on a loom, a
// shuttle passes the weft row by row (over-under alternating) and a diamond
// pattern emerges in colour; step captions mark warp, weave, pattern,
// finish, then the cloth drapes into a soft fold.
export default function LoomWeave({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const steps = [...list(c.steps || "Stretch the warp, Pass the weft, Build the pattern, Finish by hand"), "Step", "Step", "Step", "Step"].slice(0, 4);
  const cols = 34;
  const rows = 24;
  const X0 = 560;
  const Y0 = 150;
  const cw = 24;
  const rh = 30;
  const warp = cubicInOut(c01((t - 0.3) / 1.0));
  const weaveP = c01((t - 1.6) / 5.4);
  const rowsDone = weaveP * rows;
  const curRow = Math.floor(rowsDone);
  const shuttleU = rowsDone - curRow;
  const step = t < 1.5 ? 0 : t < 3.4 ? 1 : t < 7.1 ? 2 : 3;
  const drape = expInOut(seg(t, 7.4, 1.0));
  const outro = expInOut(seg(t, 9.4, 0.5));
  const endP = c01((t - 9.8) / 0.8);
  const warpCol = "#e9dcc4";
  const yarn = [pal.v, pal.a, "#c8553d", "#2d4a6b"];
  // diamond motif
  const motif = (i: number, j: number) => {
    const d = Math.abs((i % 12) - 6) + Math.abs((j % 12) - 6);
    return d < 3 ? 0 : d < 5 ? 1 : d === 6 ? 2 : 3;
  };

  return (
    <AbsoluteFill style={{ background: pal.dark ? "#1c1814" : "#f2ebe0", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          {/* loom beams */}
          <rect x={X0 - 60} y={Y0 - 50} width={cols * cw + 120} height={40} rx={12} fill="#8b5a2b" />
          <rect x={X0 - 60} y={Y0 + rows * rh + 10} width={cols * cw + 120} height={40} rx={12} fill="#8b5a2b" />
          <g transform={`translate(${X0 + (cols * cw) / 2} ${Y0}) skewX(${drape * -8}) scale(${1 - drape * 0.1} 1) translate(${-(X0 + (cols * cw) / 2)} ${-Y0})`}>
            {/* warp threads */}
            {Array.from({ length: cols }, (_, i) => (
              <line key={i} x1={X0 + i * cw + cw / 2} x2={X0 + i * cw + cw / 2} y1={Y0} y2={Y0 + rows * rh * warp} stroke={warpCol} strokeWidth={8} />
            ))}
            {/* woven rows */}
            {Array.from({ length: Math.min(rows, curRow + 1) }, (_, j) => {
              const rowY = Y0 + (rows - 1 - j) * rh + rh / 2;
              const partial = j === curRow ? shuttleU : 1;
              const dir = j % 2 === 0 ? 1 : -1;
              return (
                <g key={j}>
                  {Array.from({ length: cols }, (_, i) => {
                    const pos = dir > 0 ? i / cols : 1 - (i + 1) / cols;
                    if (pos > partial) return null;
                    const over = (i + j) % 2 === 0;
                    const colr = yarn[motif(i, j)];
                    return <rect key={i} x={X0 + i * cw - (over ? 1 : -6)} y={rowY - rh / 2 + 3} width={over ? cw + 2 : cw - 12} height={rh - 6} rx={6} fill={colr} opacity={over ? 1 : 0.55} />;
                  })}
                </g>
              );
            })}
            {/* shuttle */}
            {curRow < rows && weaveP > 0 && (
              <g transform={`translate(${curRow % 2 === 0 ? X0 + shuttleU * cols * cw : X0 + (1 - shuttleU) * cols * cw} ${Y0 + (rows - 1 - curRow) * rh + rh / 2})`}>
                <path d="M-60,0 Q-30,-22 0,-22 Q30,-22 60,0 Q30,22 0,22 Q-30,22 -60,0 Z" fill="#a8702f" stroke="#5a3a18" strokeWidth={4} />
                <ellipse rx={18} ry={10} fill={yarn[motif(Math.round(shuttleU * cols), curRow)]} />
              </g>
            )}
          </g>
        </Svg>
        {/* step list */}
        <div style={{ position: "absolute", left: 80, top: 260, width: 400 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 36, opacity: i === step ? 1 : i < step ? 0.55 : 0.25 }}>
              <div style={{ width: 54, height: 54, borderRadius: 27, background: i <= step ? pal.v : "transparent", border: `3px solid ${pal.v}`, color: pal.onV, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, flexShrink: 0 }}>{i < step ? "✓" : i + 1}</div>
              <div style={{ fontSize: 34, fontWeight: i === step ? 800 : 500, color: pal.fg }}>{s}</div>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", right: 60, top: 70, fontSize: 28, color: pal.muted, fontVariantNumeric: "tabular-nums" }}>row {Math.min(rows, curRow + (weaveP > 0 ? 1 : 0))}/{rows}</div>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={c.tagline || "Woven slowly. Made to last."} x={960} y={500} size={100} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.03} />
          <Txt text={nameOf(b)} x={960} y={620} size={50} weight={600} color={pal.v} font={ff} p={c01((t - 10.2) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/loom-weave.wav" on={audio} />
    </AbsoluteFill>
  );
}
