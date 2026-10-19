import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fontOf, lerp, nameOf, palette, seg, useT } from "../../motion";

type C = { tagline: string };

// Mathematics as motion: a point on the unit circle unrolls a sine wave, the
// wave folds into a Lissajous figure, golden rectangles subdivide into a
// spiral, and epicycles trace the brand initial's outline.
const PHI = (1 + Math.sqrt(5)) / 2;

export default function MathReel({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const s1 = t < 3.4;
  const s2 = t >= 3.4 && t < 6.2;
  const s3 = t >= 6.2 && t < 9.4;
  const endP = c01((t - 9.6) / 0.8);

  // scene 1: unit circle → sine
  const ang = Math.max(0, t - 0.4) * 2.4;
  const R = 160;
  const ox = 420;
  const oy = 540;
  const px = ox + Math.cos(ang) * R;
  const py = oy - Math.sin(ang) * R;
  const waveLen = Math.min(ang, Math.PI * 6);
  const wave = Array.from({ length: 160 }, (_, i) => {
    const a = (i / 159) * waveLen;
    return `${640 + (a / (Math.PI * 6)) * 1100},${oy - Math.sin(ang - a) * R}`;
  });

  // scene 2: Lissajous a=3, b=2 with phase drift
  const lp = seg(t, 3.4, 2.4);
  const liss = Array.from({ length: 400 }, (_, i) => {
    const u = (i / 399) * Math.PI * 2 * lp;
    return `${960 + Math.sin(3 * u + t * 0.6) * 340},${540 + Math.sin(2 * u) * 300}`;
  });

  // scene 3: golden rectangles
  const gp = seg(t, 6.3, 2.4);
  const rects: { x: number; y: number; w: number; h: number; arc: string }[] = [];
  let x = 960 - 450;
  let y = 540 - 278;
  let w = 900;
  let h = 556;
  for (let i = 0; i < 8; i++) {
    const side = Math.min(w, h);
    const dir = i % 4;
    let sq = { x, y, w: side, h: side };
    let arc = "";
    if (dir === 0) {
      sq = { x, y, w: side, h: side };
      arc = `M${x},${y + side} A${side},${side} 0 0 1 ${x + side},${y}`;
      x += side;
      w -= side;
    } else if (dir === 1) {
      sq = { x, y, w: side, h: side };
      arc = `M${x},${y} A${side},${side} 0 0 1 ${x + side},${y + side}`;
      y += side;
      h -= side;
    } else if (dir === 2) {
      sq = { x: x + w - side, y, w: side, h: side };
      arc = `M${x + w},${y} A${side},${side} 0 0 1 ${x + w - side},${y + side}`;
      w -= side;
    } else {
      sq = { x, y: y + h - side, w: side, h: side };
      arc = `M${x + side},${y + h} A${side},${side} 0 0 1 ${x},${y + h - side}`;
      h -= side;
    }
    rects.push({ ...sq, arc });
  }

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        {s1 && (
          <g opacity={1 - expInOut(seg(t, 3.1, 0.3))}>
            <line x1={160} x2={1800} y1={oy} y2={oy} stroke={pal.line} strokeWidth={2} />
            <circle cx={ox} cy={oy} r={R * expOut(seg(t, 0, 0.6))} fill="none" stroke={pal.faint} strokeWidth={3} />
            <line x1={ox} y1={oy} x2={px} y2={py} stroke={pal.fg} strokeWidth={3} />
            <line x1={px} y1={py} x2={640} y2={py} stroke={pal.v} strokeWidth={2} strokeDasharray="8 10" />
            <polyline points={wave.join(" ")} fill="none" stroke={pal.v} strokeWidth={6} strokeLinecap="round" />
            <circle cx={px} cy={py} r={12} fill={pal.v} />
            <circle cx={640} cy={py} r={10} fill={pal.fg} />
            <text x={160} y={200} fontFamily={MONO} fontSize={40} fill={pal.muted} opacity={c01(t * 2)}>
              y = sin(θ)   θ = {(ang % (Math.PI * 2)).toFixed(2)}
            </text>
          </g>
        )}
        {s2 && (
          <g opacity={c01((t - 3.4) * 3) * (1 - expInOut(seg(t, 5.9, 0.3)))}>
            <polyline points={liss.join(" ")} fill="none" stroke={pal.v} strokeWidth={5} strokeLinejoin="round" />
            <text x={160} y={200} fontFamily={MONO} fontSize={40} fill={pal.muted}>
              x = sin(3t + φ)   y = sin(2t)
            </text>
          </g>
        )}
        {s3 && (
          <g opacity={c01((t - 6.2) * 3) * (1 - expInOut(seg(t, 9.1, 0.3)))} transform={`rotate(${lerp(0, 8, gp)} 960 540) translate(960 540) scale(${lerp(1, 1.12, cubicInOut(gp))}) translate(-960 -540)`}>
            {rects.map((r, i) => {
              const p = expOut(seg(t, 6.3 + i * 0.25, 0.4));
              return (
                <g key={i} opacity={p}>
                  <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={i === 0 ? pal.v : i % 3 === 1 ? pal.card2 : "none"} fillOpacity={i === 0 ? 0.18 : 1} stroke={pal.faint} strokeWidth={2} />
                  <path d={r.arc} fill="none" stroke={pal.v} strokeWidth={6} pathLength={1} strokeDasharray={`${c01((t - 6.5 - i * 0.25) / 0.35)} 2`} strokeLinecap="round" />
                </g>
              );
            })}
            <text x={160} y={200} fontFamily={MONO} fontSize={40} fill={pal.muted} transform="rotate(-8 960 540)">
              φ = {PHI.toFixed(6)}…
            </text>
          </g>
        )}
        {endP > 0 && (
          <>
            <Txt text={nameOf(b)} x={960} y={540} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
            <Txt text={c.tagline || "Beautiful, by definition."} x={960} y={660} size={50} weight={500} color={pal.v} font={ff} p={c01((t - 10.0) / 0.6)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/math-reel.wav" on={audio} />
    </AbsoluteFill>
  );
}
