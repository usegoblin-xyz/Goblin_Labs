import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { role: string; line: string };

// A motion designer's process reel: a pen tool places anchors and pulls
// bezier handles to draw a wave, the shape fills, a graph editor opens and
// its speed curve is dragged into an ease, and the shape replays with that
// easing before the name sets.
export default function PenToolReel({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  // anchors and their handles
  const A = [
    { x: 260, y: 520, hx: 120 },
    { x: 620, y: 300, hx: 160 },
    { x: 980, y: 620, hx: 160 },
    { x: 1340, y: 300, hx: 160 },
    { x: 1660, y: 520, hx: 120 },
  ];
  const placeAt = (i: number) => 0.4 + i * 0.6;
  const pull = (i: number) => cubicInOut(c01((t - placeAt(i) - 0.15) / 0.35));
  const placed = A.filter((_, i) => t > placeAt(i)).length;
  let d = "";
  for (let i = 0; i < placed; i++) {
    const a = A[i];
    if (i === 0) d = `M${a.x},${a.y}`;
    else {
      const p = A[i - 1];
      const ph = p.hx * pull(i - 1);
      const ch = a.hx * pull(i);
      d += ` C${p.x + ph},${p.y} ${a.x - ch},${a.y} ${a.x},${a.y}`;
    }
  }
  const closed = d + (t > 3.6 ? ` L1660,860 L260,860 Z` : "");
  const fill = c01((t - 3.6) / 0.5);
  // graph editor
  const graph = expInOut(seg(t, 4.4, 0.5));
  const drag = cubicInOut(c01((t - 5.0) / 0.9));
  const h1 = { x: lerp(0.33, 0.7, drag), y: lerp(0.33, 0, drag) };
  const h2 = { x: lerp(0.67, 0.1, drag), y: lerp(0.67, 1, drag) };
  const bez = (u: number, p1: number, p2: number) => 3 * (1 - u) * (1 - u) * u * p1 + 3 * (1 - u) * u * u * p2 + u * u * u;
  // replay with eased motion
  const replay = c01((t - 6.3) / 1.4);
  const ease = (() => {
    // solve x(u)=replay
    let lo = 0;
    let hi = 1;
    for (let k = 0; k < 18; k++) {
      const m = (lo + hi) / 2;
      if (bez(m, h1.x, h2.x) < replay) lo = m;
      else hi = m;
    }
    return bez(lo, h1.y, h2.y);
  })();
  const outro = expInOut(seg(t, 8.4, 0.5));
  const endP = c01((t - 8.8) / 0.8);
  const shapeY = t > 6.3 ? lerp(0, -150, ease) + (t > 7.7 ? lerp(-150, 0, cubicInOut(c01((t - 7.7) / 0.5))) : 0) : 0;
  const GX = 1180;
  const GY = 600;
  const GS = 380;

  return (
    <AbsoluteFill style={{ background: pal.dark ? "#141417" : "#f4f4f2", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          {/* artboard grid */}
          {Array.from({ length: 20 }, (_, i) => (
            <line key={i} x1={i * 100} x2={i * 100} y1={0} y2={1080} stroke={pal.line} strokeWidth={1} opacity={0.5} />
          ))}
          <g transform={`translate(0 ${shapeY}) scale(${1 - graph * 0.45}) translate(${graph * 120} ${graph * 80})`}>
            <path d={closed} fill={pal.v} fillOpacity={fill} stroke={pal.fg} strokeWidth={4} />
            {fill < 1 &&
              A.slice(0, placed).map((a, i) => {
                const hp = a.hx * pull(i);
                return (
                  <g key={i} opacity={1 - fill}>
                    <line x1={a.x - hp} y1={a.y} x2={a.x + hp} y2={a.y} stroke="#38a3ff" strokeWidth={2} />
                    <circle cx={a.x - hp} cy={a.y} r={8} fill="#fff" stroke="#38a3ff" strokeWidth={3} />
                    <circle cx={a.x + hp} cy={a.y} r={8} fill="#fff" stroke="#38a3ff" strokeWidth={3} />
                    <rect x={a.x - 10} y={a.y - 10} width={20} height={20} fill={i === placed - 1 ? "#38a3ff" : "#fff"} stroke="#38a3ff" strokeWidth={3} transform={`scale(1)`} />
                  </g>
                );
              })}
          </g>
          {/* pen cursor */}
          {t < 3.5 && placed > 0 && (() => {
            const i = placed - 1;
            const a = A[i];
            const hp = a.hx * pull(i);
            return (
              <g transform={`translate(${a.x + hp} ${a.y})`}>
                <path d="M0,0 L14,40 L4,46 L-6,40 Z" fill={pal.fg} transform="rotate(-30)" />
              </g>
            );
          })()}
        </Svg>
        {/* graph editor panel */}
        {graph > 0 && (
          <div style={{ position: "absolute", left: GX - 60, top: GY - GS - 120, width: GS + 120, height: GS + 200, borderRadius: 28, background: pal.card, transform: `translateX(${(1 - graph) * 900}px)`, boxShadow: "0 30px 70px rgba(0,0,0,0.25)" }}>
            <div style={{ padding: "26px 30px", fontFamily: MONO, fontSize: 24, color: pal.muted }}>
              speed graph · cubic-bezier({h1.x.toFixed(2)}, {h1.y.toFixed(2)}, {h2.x.toFixed(2)}, {h2.y.toFixed(2)})
            </div>
          </div>
        )}
        {graph > 0 && (
          <Svg style={{ transform: `translateX(${(1 - graph) * 900}px)` }}>
            <rect x={GX} y={GY - GS} width={GS} height={GS} fill="none" stroke={pal.line} strokeWidth={2} />
            <path d={`M${GX},${GY} C${GX + h1.x * GS},${GY - h1.y * GS} ${GX + h2.x * GS},${GY - h2.y * GS} ${GX + GS},${GY - GS}`} fill="none" stroke={pal.v} strokeWidth={6} />
            <line x1={GX} y1={GY} x2={GX + h1.x * GS} y2={GY - h1.y * GS} stroke={pal.muted} strokeWidth={2} />
            <line x1={GX + GS} y1={GY - GS} x2={GX + h2.x * GS} y2={GY - h2.y * GS} stroke={pal.muted} strokeWidth={2} />
            <circle cx={GX + h1.x * GS} cy={GY - h1.y * GS} r={14} fill={pal.a} />
            <circle cx={GX + h2.x * GS} cy={GY - h2.y * GS} r={14} fill={pal.a} />
            {replay > 0 && replay < 1 && <circle cx={GX + replay * GS} cy={GY - ease * GS} r={10} fill={pal.fg} />}
          </Svg>
        )}
        <div style={{ position: "absolute", left: 70, top: 50, fontFamily: MONO, fontSize: 26, color: pal.muted }}>
          {t < 3.6 ? "✎ pen tool" : t < 4.4 ? "◼ fill" : t < 6.3 ? "⟋ easing" : "▶ play"}
        </div>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={c.line || "Every curve, on purpose."} x={960} y={500} size={100} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={`${nameOf(b)} · ${c.role || "motion designer"}`} x={960} y={620} size={48} weight={600} color={pal.v} font={ff} p={c01((t - 9.2) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/pen-tool-reel.wav" on={audio} />
    </AbsoluteFill>
  );
}
