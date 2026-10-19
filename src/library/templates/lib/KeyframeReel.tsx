import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Box, MONO, Mark, Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fit, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { words: string; tagline: string };

// A motion designer's timeline come to life: a playhead runs across four
// property tracks (position, scale, rotation, color) and the word on stage
// obeys each keyframe; a graph editor shows the easing it is riding.
const LANE_X = 430;
const LANE_W = 1290;
const SPAN = 8; // seconds of timeline

export default function KeyframeReel({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const words = [...list(c.words || "Move, Scale, Turn, Color"), "Move", "Scale", "Turn", "Color"].slice(0, 4);
  const play = c01((t - 0.6) / 8) * SPAN; // playhead time
  const k = Math.min(3, Math.floor(play / 2));
  const u = cubicInOut(c01((play - k * 2) / 2));
  const panelIn = expOut(seg(t, 0, 0.6));
  const panelOut = expInOut(seg(t, 8.7, 0.5));
  const endIn = seg(t, 9.0, 0.8);
  const word = words[k];
  const size = fit(word, 900, 230, 800, -0.04, ff);

  // the word obeys the current track
  let x = 960;
  let sc = 1;
  let rot = 0;
  let color = pal.fg;
  if (k === 0) x = lerp(620, 1300, u);
  if (k === 1) sc = lerp(0.35, 1, u) + 0.25 * Math.sin(u * Math.PI);
  if (k === 2) rot = 360 * u;
  if (k === 3) color = u < 0.5 ? pal.v : pal.a;
  const tracks = ["Position", "Scale", "Rotation", "Color"];
  const tx = (time: number) => LANE_X + (time / SPAN) * LANE_W;
  const py = lerp(1120, 690, panelIn) + panelOut * 500;

  // graph editor curve for the current section
  const gx = 1480;
  const gy = 90;
  const gw = 340;
  const gh = 220;
  const curve = `M${gx},${gy + gh} C${gx + gw * 0.62},${gy + gh} ${gx + gw * 0.38},${gy} ${gx + gw},${gy}`;
  const cu = u; // cubic in-out approximated by the bezier
  const bez = (p: number) => {
    const P = [0, 0.62, 0.38, 1];
    const Q = [0, 0, 1, 1];
    const m = 1 - p;
    return {
      x: m * m * m * P[0] + 3 * m * m * p * P[1] + 3 * m * p * p * P[2] + p * p * p * P[3],
      y: m * m * m * Q[0] + 3 * m * m * p * Q[1] + 3 * m * p * p * Q[2] + p * p * p * Q[3],
    };
  };
  const dot = bez(c01((play - k * 2) / 2));

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      {/* stage */}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - panelOut }}>
        {k === 0 &&
          [0.3, 0.2, 0.1].map((g, i) => (
            <Svg key={i}>
              <Txt text={word} x={lerp(620, 1300, cubicInOut(c01((play - 0.12 * (i + 1)) / 2)))} y={330 + size * 0.36} size={size} weight={800} color={pal.fg} font={ff} opacity={g * c01(play * 2)} />
            </Svg>
          ))}
        <div style={{ position: "absolute", left: x, top: 330, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${sc})`, fontSize: size, fontWeight: 800, letterSpacing: "-0.04em", color, lineHeight: 1, whiteSpace: "nowrap", opacity: c01((t - 0.3) * 3) }}>
          {k === 3
            ? word.split("").map((ch, i) => (
                <span key={i} style={{ color: c01(u * 1.6 - i * 0.12) > 0.5 ? (i % 2 ? pal.a : pal.v) : pal.fg }}>
                  {ch}
                </span>
              ))
            : word}
        </div>
        <Svg>
          <rect x={gx - 20} y={gy - 20} width={gw + 40} height={gh + 40} rx={18} fill={pal.card} opacity={panelIn} />
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={gx} x2={gx + gw} y1={gy + gh * f} y2={gy + gh * f} stroke={pal.line} strokeWidth={1.5} />
          ))}
          <path d={curve} stroke={pal.v} strokeWidth={4} fill="none" opacity={panelIn} />
          <line x1={gx} y1={gy + gh} x2={gx + gw * 0.62} y2={gy + gh} stroke={pal.muted} strokeWidth={2} />
          <line x1={gx + gw} y1={gy} x2={gx + gw * 0.38} y2={gy} stroke={pal.muted} strokeWidth={2} />
          <circle cx={gx + gw * 0.62} cy={gy + gh} r={7} fill={pal.fg} />
          <circle cx={gx + gw * 0.38} cy={gy} r={7} fill={pal.fg} />
          <circle cx={gx + dot.x * gw} cy={gy + gh - dot.y * gh} r={11} fill={pal.fg} stroke={pal.v} strokeWidth={4} opacity={panelIn} />
          <text x={gx} y={gy + gh + 52} fontFamily={MONO} fontSize={20} fill={pal.muted} opacity={panelIn}>
            cubic-bezier(.62, 0, .38, 1) · {Math.round(cu * 100)}%
          </text>
        </Svg>
      </div>
      {/* timeline panel */}
      <div style={{ position: "absolute", left: 0, top: py - 690, width: 1920, height: 1080 }}>
        <Box x={960} y={850} w={1760} h={360} r={28} bg={pal.card} />
        <Svg>
          {tracks.map((name, i) => {
            const y = 735 + i * 76;
            const active = i === k && play > 0;
            return (
              <g key={name}>
                <text x={130} y={y + 8} fontFamily={MONO} fontSize={24} fill={active ? pal.fg : pal.muted}>
                  {name}
                </text>
                <line x1={LANE_X} x2={LANE_X + LANE_W} y1={y} y2={y} stroke={pal.line} strokeWidth={2} />
                {i * 2 < play && <line x1={tx(i * 2)} x2={tx(Math.min(play, i * 2 + 2))} y1={y} y2={y} stroke={pal.v} strokeWidth={6} strokeLinecap="round" />}
                {[i * 2, i * 2 + 2].map((kt, j) => {
                  const pop = spring(t - 0.3 - i * 0.08 - j * 0.04, 20, 0.55);
                  const hit = play >= kt;
                  return (
                    <g key={j} transform={`translate(${tx(kt)} ${y}) scale(${Math.max(0, pop)}) rotate(45)`}>
                      <rect x={-14} y={-14} width={28} height={28} rx={4} fill={hit ? pal.v : pal.card2} stroke={hit ? pal.v : pal.muted} strokeWidth={3} />
                    </g>
                  );
                })}
              </g>
            );
          })}
          {Array.from({ length: SPAN + 1 }, (_, s) => (
            <text key={s} x={tx(s)} y={700} fontFamily={MONO} fontSize={18} fill={pal.faint} textAnchor="middle">
              {s}s
            </text>
          ))}
          <line x1={tx(play)} x2={tx(play)} y1={690} y2={990} stroke={pal.fg} strokeWidth={3} />
          <path d={`M${tx(play) - 14},${676} L${tx(play) + 14},${676} L${tx(play)},${694} Z`} fill={pal.fg} />
        </Svg>
      </div>
      {/* end card */}
      {endIn > 0 && (
        <>
          <Mark x={960 - 260} y={520} size={150} b={b} pal={pal} r={0.18} rot={45 - 45 * expOut(endIn)} s={spring(t - 9.0, 18, 0.6)} />
          <Svg>
            <Txt text={nameOf(b)} x={960 - 150} y={565} size={130} weight={800} color={pal.fg} font={ff} anchor="start" p={c01((t - 9.15) / 0.6)} />
            <Txt text={c.tagline || "Every frame, on purpose."} x={960} y={700} size={44} weight={500} color={pal.muted} font={ff} p={c01((t - 9.4) / 0.6)} mode="fade" />
          </Svg>
        </>
      )}
      <Track src="tracks/keyframe-reel.wav" on={audio} />
    </AbsoluteFill>
  );
}
