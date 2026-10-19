import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, hash, lerp, nameOf, palette, seg, useT } from "../../motion";

type C = { stages: string; line: string };

// The cycle of life as one continuous loop: a seed drops into soil,
// sprouts, grows into a tree, blossoms, fruits, and the fruit falls back
// into the soil as the next seed; a ring around the scene fills like a
// clock with stage labels, and the seasons tint the sky.
export default function LifeCycle({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const stages = [...list(c.stages || "Seed, Sprout, Tree, Bloom, Fruit, Return"), "Stage", "Stage", "Stage", "Stage", "Stage", "Stage"].slice(0, 6);
  const L = 8.4; // loop length
  const p = c01(t / L);
  const st = Math.min(5, Math.floor(p * 6));
  const sky = ["#cfe8ff", "#d8f3d0", "#bfe3ff", "#ffe1ec", "#ffe2b8", "#e8d8c8"][st];
  const ground = 760;
  const CX = 960;
  const grow = cubicInOut(c01((p - 1 / 6) / (2 / 6)));
  const bloom = c01((p - 3 / 6) / (1 / 6));
  const fruit = c01((p - 4 / 6) / (0.8 / 6));
  const fall = c01((p - 5 / 6) / (0.6 / 6));
  const seedDrop = c01(p / (0.6 / 6));
  const outro = expInOut(seg(t, 9.6, 0.5));
  const trunkH = 40 + grow * 380;
  const crown = grow;
  const branches = Array.from({ length: 6 }, (_, i) => {
    const y = ground - trunkH * (0.45 + i * 0.09);
    const dir = i % 2 ? 1 : -1;
    return { x1: CX, y1: y, x2: CX + dir * (80 + i * 14) * crown, y2: y - 70 * crown };
  });

  return (
    <AbsoluteFill style={{ background: sky, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          {/* sun moves across */}
          <circle cx={lerp(300, 1620, p)} cy={220 - Math.sin(p * Math.PI) * 80} r={70} fill="#ffd36b" />
          {/* soil */}
          <rect x={0} y={ground} width={1920} height={320} fill="#6b4b33" />
          <rect x={0} y={ground} width={1920} height={18} fill="#4f8a3a" />
          {/* seed */}
          {p < 2 / 6 && <ellipse cx={CX} cy={lerp(200, ground + 30, cubicInOut(seedDrop))} rx={16} ry={11} fill="#8a5a2b" />}
          {/* trunk & branches */}
          {p > 1 / 6 && (
            <g>
              <path d={`M${CX - 10 - grow * 18},${ground} L${CX - 4},${ground - trunkH} L${CX + 4},${ground - trunkH} L${CX + 10 + grow * 18},${ground} Z`} fill={grow < 0.3 ? "#5aa646" : "#6b4b33"} />
              {branches.map((br, i) => (
                <line key={i} x1={br.x1} y1={br.y1} x2={br.x2} y2={br.y2} stroke="#6b4b33" strokeWidth={10 * crown} strokeLinecap="round" />
              ))}
              {grow < 0.35 && (
                <>
                  <ellipse cx={CX - 26} cy={ground - trunkH} rx={26} ry={12} fill="#5aa646" transform={`rotate(-30 ${CX - 26} ${ground - trunkH})`} />
                  <ellipse cx={CX + 26} cy={ground - trunkH} rx={26} ry={12} fill="#5aa646" transform={`rotate(30 ${CX + 26} ${ground - trunkH})`} />
                </>
              )}
              {/* canopy */}
              {Array.from({ length: 14 }, (_, i) => {
                const a = (i / 14) * Math.PI * 2;
                const r = 170 * crown;
                return <circle key={i} cx={CX + Math.cos(a) * r * 0.9} cy={ground - trunkH - 40 + Math.sin(a) * r * 0.6} r={90 * crown} fill={i % 2 ? "#4f9a3e" : "#5fb04b"} opacity={0.95} />;
              })}
              {/* blossoms */}
              {Array.from({ length: 22 }, (_, i) => {
                const a = hash(i, 1) * Math.PI * 2;
                const r = hash(i, 2) * 200 * crown;
                const bx = CX + Math.cos(a) * r;
                const by = ground - trunkH - 40 + Math.sin(a) * r * 0.6;
                return <circle key={i} cx={bx} cy={by} r={12 * bloom * (1 - fruit)} fill="#ffc2d6" />;
              })}
              {/* fruit */}
              {Array.from({ length: 7 }, (_, i) => {
                const a = hash(i, 5) * Math.PI * 2;
                const r = hash(i, 6) * 170;
                const fx = CX + Math.cos(a) * r;
                const fy0 = ground - trunkH - 20 + Math.sin(a) * r * 0.5;
                const isFall = i === 0;
                const fy = isFall ? lerp(fy0, ground + 20, cubicInOut(fall)) : fy0;
                return <circle key={i} cx={isFall ? lerp(fx, CX + 180, fall) : fx} cy={fy} r={20 * fruit} fill={pal.v} />;
              })}
            </g>
          )}
          {/* stage ring */}
          <g transform="translate(1660 860)">
            <circle r={120} fill="none" stroke="#00000018" strokeWidth={16} />
            <circle r={120} fill="none" stroke={pal.v} strokeWidth={16} strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 2`} transform="rotate(-90)" />
            <text y={14} textAnchor="middle" fontFamily={ff} fontSize={38} fontWeight={800} fill="#2b2118">
              {stages[st]}
            </text>
          </g>
          {t > L && (
            <>
              <Txt text={c.line || "Everything comes back around."} x={960} y={150} size={80} weight={800} color="#2b2118" font={ff} p={c01((t - L) / 0.6)} tracking={-0.02} />
              <Txt text={nameOf(b)} x={960} y={230} size={40} weight={600} color={pal.v} font={ff} p={c01((t - L - 0.3) / 0.6)} mode="fade" />
            </>
          )}
        </Svg>
      </div>
      <Track src="tracks/life-cycle.wav" on={audio} />
    </AbsoluteFill>
  );
}
