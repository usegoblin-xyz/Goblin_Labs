import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, hash, kf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { thing: string; tagline: string };

// A seek-and-find scene: a swirling painted night over a hill village, a
// lens glides from rooftop to window to tree and each time finds a hidden
// cat; a counter fills to five, then every cat waves at once.
const CATS = [
  { x: 420, y: 640, s: 1 },
  { x: 880, y: 560, s: 0.8 },
  { x: 1290, y: 700, s: 1 },
  { x: 1600, y: 430, s: 0.7 },
  { x: 640, y: 290, s: 0.75 },
];

function Cat({ x, y, s, col, wave = 0 }: { x: number; y: number; s: number; col: string; wave?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-26,30 C-30,0 -22,-18 -18,-24 L-22,-46 L-8,-30 C-3,-32 3,-32 8,-30 L22,-46 L18,-24 C22,-18 30,0 26,30Z" fill={col} />
      <path d={`M24,24 C44,${20 - wave * 30} 50,${0 - wave * 20} 40,${-12 - wave * 10}`} fill="none" stroke={col} strokeWidth={8} strokeLinecap="round" />
      <circle cx={-8} cy={-12} r={3} fill="#ffe66b" />
      <circle cx={8} cy={-12} r={3} fill="#ffe66b" />
    </g>
  );
}

export default function SpotTheCat({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const night = "#14204a";
  const sky2 = "#2c4aa0";
  const finds = CATS.map((_, i) => 1.4 + i * 1.3);
  const lx = kf(t, [[0.6, 960], ...finds.map((f, i) => [f - 0.2, CATS[i].x] as [number, number]), [finds[4] + 1.0, 960]], cubicInOut);
  const ly = kf(t, [[0.6, 540], ...finds.map((f, i) => [f - 0.2, CATS[i].y] as [number, number]), [finds[4] + 1.0, 540]], cubicInOut);
  const found = finds.filter((f) => t > f).length;
  const lensOut = expInOut(seg(t, finds[4] + 0.8, 0.5));
  const wave = t > finds[4] + 1.2 ? Math.sin((t - finds[4]) * 9) * 0.5 + 0.5 : 0;
  const outro = expInOut(seg(t, 9.4, 0.5));
  const endP = c01((t - 9.8) / 0.8);
  const swirl = (cx: number, cy: number, r: number, k: number) =>
    "M" + Array.from({ length: 50 }, (_, i) => {
      const a = (i / 49) * Math.PI * 3.2 + t * 0.4 * (k % 2 ? 1 : -1);
      const rr = r * (0.3 + (i / 49) * 0.7);
      return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr * 0.6).toFixed(1)}`;
    }).join(" L");

  const Scene = ({ dimCats }: { dimCats: boolean }) => (
    <Svg>
      <rect width={1920} height={1080} fill={night} />
      {Array.from({ length: 26 }, (_, i) => (
        <path key={i} d={swirl(hash(i, 1) * 1920, hash(i, 2) * 520, 80 + hash(i, 3) * 120, i)} fill="none" stroke={i % 3 ? sky2 : "#6f8fe0"} strokeWidth={10 + hash(i, 4) * 8} strokeLinecap="round" opacity={0.7} />
      ))}
      <circle cx={1650} cy={170} r={70} fill="#ffe66b" />
      <circle cx={1650} cy={170} r={110} fill="none" stroke="#ffe66b" strokeWidth={10} opacity={0.4} />
      {Array.from({ length: 30 }, (_, i) => (
        <circle key={i} cx={hash(i, 5) * 1920} cy={hash(i, 6) * 480} r={6 + 4 * Math.sin(t * 3 + i)} fill="#fff6b0" opacity={0.85} />
      ))}
      <path d="M0,620 Q480,470 960,600 T1920,560 L1920,1080 L0,1080Z" fill="#1b2a1e" />
      {Array.from({ length: 9 }, (_, i) => {
        const x = 260 + i * 170;
        const y = 640 + Math.sin(i) * 40;
        return (
          <g key={i}>
            <rect x={x} y={y} width={120} height={110} fill="#3a3550" />
            <path d={`M${x - 10},${y} L${x + 60},${y - 60} L${x + 130},${y}Z`} fill="#26213a" />
            <rect x={x + 44} y={y + 34} width={30} height={36} fill="#ffd36b" opacity={0.8} />
          </g>
        );
      })}
      <path d="M140,1080 C120,800 180,600 150,380 C170,600 230,820 240,1080Z" fill="#0d1610" />
      {CATS.map((ct, i) => (
        <Cat key={i} x={ct.x} y={ct.y} s={ct.s} col={dimCats ? "#0f1430" : "#111"} wave={wave} />
      ))}
    </Svg>
  );

  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Scene dimCats />
        {/* the lens shows the same scene, brighter, with cats outlined */}
        {lensOut < 1 && (
          <div style={{ position: "absolute", left: lx - 150, top: ly - 150, width: 300, height: 300, borderRadius: 150, overflow: "hidden", boxShadow: `0 0 0 10px ${pal.v}, 0 20px 50px rgba(0,0,0,0.5)`, transform: `scale(${(1 - lensOut) * spring(t - 0.5, 16, 0.6)})` }}>
            <div style={{ position: "absolute", left: -(lx - 150) * 1, top: -(ly - 150) * 1, width: 1920, height: 1080, transformOrigin: `${lx}px ${ly}px`, transform: "scale(1.6)", filter: "brightness(1.6) saturate(1.2)" }}>
              <Scene dimCats={false} />
            </div>
          </div>
        )}
        <Svg>
          {CATS.map((ct, i) =>
            t > finds[i] ? (
              <circle key={i} cx={ct.x} cy={ct.y - 6} r={60 * ct.s + 10 * (1 - c01((t - finds[i]) * 3))} fill="none" stroke={pal.v} strokeWidth={6} opacity={lensOut > 0 ? 1 : 0.9} />
            ) : null,
          )}
        </Svg>
        <div style={{ position: "absolute", right: 70, top: 60, padding: "16px 30px", borderRadius: 40, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 40, fontWeight: 800, display: "flex", alignItems: "center", gap: 14 }}>
          <span>🐾</span>
          <span style={{ fontVariantNumeric: "tabular-nums", color: found === 5 ? pal.v : "#fff" }}>{found} / 5</span>
        </div>
        {found === 5 && <Svg><Txt text={`All five ${c.thing || "cats"} found!`} x={960} y={940} size={72} weight={800} color="#fff" font={ff} p={c01((t - finds[4] - 0.3) / 0.6)} /></Svg>}
      </div>
      {endP > 0 && (
        <AbsoluteFill style={{ background: pal.bg }}>
          <Svg>
            <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
            <Txt text={c.tagline || "Look closer."} x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - 10.2) / 0.6)} mode="fade" />
          </Svg>
        </AbsoluteFill>
      )}
      <Track src="tracks/spot-the-cat.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = lerp;
