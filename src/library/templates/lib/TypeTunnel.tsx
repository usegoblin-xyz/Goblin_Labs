import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, kf, lerp, nameOf, onColor, palette, seg, useT } from "../../motion";

type C = { words: string; role: string };

// A tunnel built from type: square frames carry a word on each wall and rush
// past the camera, speeding up on the drop and tilting through a turn. The
// flight slows, one last frame arrives head-on and its centre is your name.
const FRAMES = 14;
const GAP = 340; // depth between frames
const FOCAL = 520;

export default function TypeTunnel({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const words = list(c.words || "Faster, Louder, Bolder, Further, Deeper, Brighter");
  while (words.length < 3) words.push("Go");

  // distance travelled: slow, accelerate on the drop, ease to a stop
  const dist = kf(t, [[0, 0], [1.6, 380], [2.0, 560], [5.6, 3800], [7.4, 4620]], (x) => x);
  const settle = expInOut(seg(t, 6.6, 0.9));
  const roll = kf(t, [[2.0, 0], [3.4, 18], [4.6, -14], [6.2, 0]]);
  const sway = Math.sin(t * 1.3) * 60 * (1 - settle);
  const nameP = expOut(seg(t, 7.3, 0.6));
  const roleP = c01((t - 7.9) / 0.6);
  const finalZ = 4620 + 900; // depth of the name frame

  const frames = [];
  for (let i = FRAMES - 1; i >= 0; i--) {
    const zWorld = 400 + i * GAP + Math.floor(Math.max(0, dist - 400 - i * GAP) / (FRAMES * GAP)) * FRAMES * GAP;
    const z = zWorld - dist;
    if (z < 60 || z > FRAMES * GAP) continue;
    const s = FOCAL / z;
    const size = 1500 * s;
    const fade = c01((FRAMES * GAP - z) / 600) * c01((z - 60) / 120) * c01((s - 0.2) / 0.2) * (1 - settle * 0.85);
    const w = words[(i + Math.floor((zWorld - 400) / GAP)) % words.length];
    const col = i % 3 === 0 ? pal.p : pal.fg;
    const fs = 150 * s;
    frames.push(
      <g key={i} opacity={fade} transform={`translate(${960 + sway * s} 540)`}>
        <rect x={-size / 2} y={-size * 0.3} width={size} height={size * 0.6} fill="none" stroke={pal.line} strokeWidth={Math.max(1, 6 * s)} />
        <Txt text={w} x={0} y={-size * 0.3 + fs * 0.95} size={fs} weight={900} color={col} font={ff} tracking={-0.04} />
        <g transform="rotate(180)">
          <Txt text={w} x={0} y={-size * 0.3 + fs * 0.95} size={fs} weight={900} color={col} font={ff} tracking={-0.04} opacity={0.6} />
        </g>
        <g transform="rotate(-90)">
          <Txt text={w} x={0} y={-size / 2 + fs * 0.95} size={fs * 0.8} weight={900} color={pal.a} font={ff} tracking={-0.04} opacity={0.75} />
        </g>
        <g transform="rotate(90)">
          <Txt text={w} x={0} y={-size / 2 + fs * 0.95} size={fs * 0.8} weight={900} color={pal.a} font={ff} tracking={-0.04} opacity={0.75} />
        </g>
      </g>,
    );
  }
  // the name frame arrives head-on
  const zN = finalZ - dist - settle * 380;
  const sN = FOCAL / Math.max(200, zN);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        <g transform={`rotate(${roll} 960 540)`}>{frames}</g>
        <g transform={`translate(960 540) scale(${lerp(sN, 1, settle)}) translate(-960 -540)`} opacity={c01((t - 5.6) / 0.6)}>
          <rect x={960 - 760} y={540 - 280} width={1520} height={560} rx={24} fill={pal.p} opacity={0.12 + 0.88 * nameP} />
          <Txt text={name} x={960} y={600} size={fit(name, 1300, 220, 900)} weight={900} color={nameP > 0.5 ? onColor(pal.p) : pal.fg} font={ff} p={c01((t - 6.0) / 0.6)} tracking={-0.05} />
        </g>
        {roleP > 0 && <Txt text={c.role || "Type that moves you"} x={960} y={900} size={42} weight={500} color={pal.muted} font={ff} p={roleP} mode="fade" />}
      </Svg>
      <Track src="tracks/type-tunnel.wav" on={audio} />
    </AbsoluteFill>
  );
}
