import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { SERIF, Svg, Track, Txt, c01, expInOut, fit, hash, lerp, mix, nameOf, palette, seg, useT } from "../../motion";

type C = { title: string };

// A cosy, perfectly symmetrical train carriage in pastel. Through the window
// the four seasons pass in turn: blossom, high summer, red autumn, falling
// snow. The coffee on the table ripples with every rail joint, steam curls,
// and the trip ends on a centred title card.
const SEASONS = [
  { sky: "#cfe6f2", hill1: "#9ccf9a", hill2: "#7fb98a", tree: "#f4b6c8", ground: "#b7dba0" },
  { sky: "#9fd3ee", hill1: "#6fb36a", hill2: "#4f9a55", tree: "#3f8a48", ground: "#8cc46f" },
  { sky: "#f2d6b3", hill1: "#d89a52", hill2: "#b8743c", tree: "#d4552e", ground: "#cf9a5a" },
  { sky: "#dfe7ee", hill1: "#f4f6f8", hill2: "#e4e9ef", tree: "#ffffff", ground: "#f7f8fa" },
];
const SEASON_T = [0.0, 2.2, 4.4, 6.6];
const WX = 560;
const WY = 220;
const WW = 800;
const WH = 470;

export default function TrainSeasons({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const name = nameOf(b);
  const si = SEASON_T.reduce((k, at, i) => (t >= at ? i : k), 0);
  const blend = si < 3 ? expInOut(seg(t, SEASON_T[si + 1] - 0.5, 0.5)) : 0;
  const S = SEASONS[si];
  const N = SEASONS[Math.min(3, si + 1)];
  const col = (k: keyof typeof S) => mix(S[k], N[k], blend);
  const scroll = t * 520;
  // rail joints every 0.8 s: a small jolt
  const jolt = Math.exp(-Math.pow(((t % 0.8) - 0.05) / 0.06, 2));
  const shake = jolt * 3;
  const ripple = Math.exp(-((t % 0.8) / 0.35)) * Math.sin((t % 0.8) * 40);
  const titleP = expInOut(seg(t, 8.4, 0.8));
  const wall = "#f3c9c6";
  const wood = "#b5835a";

  const hills = (base: number, amp: number, speed: number, color: string, seed: number) => {
    const pts: string[] = [];
    const off = (scroll * speed) % 400;
    for (let x = -400; x <= WW + 400; x += 40) {
      const k = Math.floor((x + scroll * speed) / 40);
      const y = base - amp * (0.5 + 0.5 * Math.sin(k * 0.45 + seed)) - hash(k, seed) * amp * 0.25;
      pts.push(`${x - (off % 40)},${y}`);
    }
    return <path d={`M-400,${WH} L${pts.join(" L")} L${WW + 400},${WH} Z`} fill={color} />;
  };

  return (
    <AbsoluteFill style={{ background: wall, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${shake}px)` }}>
        {/* window view */}
        <div style={{ position: "absolute", left: WX, top: WY, width: WW, height: WH, borderRadius: 60, overflow: "hidden", background: col("sky") }}>
          <Svg w={WW} h={WH}>
            {si === 1 && <circle cx={620} cy={110} r={56} fill="#fff1b8" opacity={1 - blend} />}
            {hills(250, 90, 0.15, col("hill2"), 1)}
            {hills(330, 70, 0.35, col("hill1"), 2)}
            {/* trees */}
            {Array.from({ length: 12 }).map((_, i) => {
              const x = ((i * 170 - scroll * 0.7) % (WW + 340) + WW + 340) % (WW + 340) - 170;
              const h = 70 + hash(i, 3) * 60;
              return (
                <g key={i} transform={`translate(${x} 380)`}>
                  <rect x={-6} y={-h * 0.4} width={12} height={h * 0.5} fill={mix(wood, "#000000", 0.2)} />
                  <circle cx={0} cy={-h * 0.6} r={h * 0.38} fill={col("tree")} />
                </g>
              );
            })}
            <rect x={0} y={400} width={WW} height={WH - 400} fill={col("ground")} />
            {/* telegraph poles */}
            {Array.from({ length: 4 }).map((_, i) => {
              const x = ((i * 300 - scroll * 1.6) % 1200 + 1200) % 1200 - 200;
              return <rect key={i} x={x} y={40} width={14} height={WH} fill="#6b4a33" opacity={0.85} />;
            })}
            {/* snow */}
            {(si === 3 || (si === 2 && blend > 0)) &&
              Array.from({ length: 70 }).map((_, i) => {
                const x = ((hash(i, 1) * WW - t * 120 * (0.5 + hash(i, 2))) % WW + WW) % WW;
                const y = ((hash(i, 3) * WH + t * 90 * (0.6 + hash(i, 4))) % WH);
                return <circle key={i} cx={x} cy={y} r={3 + hash(i, 5) * 3} fill="#fff" opacity={si === 3 ? 0.9 : blend} />;
              })}
            {/* blossom petals */}
            {si === 0 &&
              Array.from({ length: 30 }).map((_, i) => {
                const x = ((hash(i, 6) * WW - t * 200) % WW + WW) % WW;
                const y = (hash(i, 7) * WH + t * 40) % WH;
                return <ellipse key={i} cx={x} cy={y} rx={5} ry={3} fill="#f6a9c0" opacity={1 - blend} />;
              })}
          </Svg>
          <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 0 18px #fbeee4, inset 0 0 0 26px #d9a68a" }} />
        </div>
        {/* curtains, symmetric */}
        {[-1, 1].map((s) => (
          <div key={s} style={{ position: "absolute", top: 170, left: s < 0 ? WX - 150 : WX + WW - 30, width: 180, height: 600, background: `repeating-linear-gradient(90deg, ${pal.p} 0 26px, ${mix(pal.p, "#ffffff", 0.25)} 26px 52px)`, borderRadius: s < 0 ? "0 0 0 90px" : "0 0 90px 0", opacity: 0.92 }} />
        ))}
        <div style={{ position: "absolute", left: WX - 180, top: 150, width: WW + 360, height: 40, borderRadius: 20, background: "#c9973c" }} />
        {/* lamps */}
        {[-1, 1].map((s) => (
          <div key={s} style={{ position: "absolute", left: 960 + s * 640 - 50, top: 300, width: 100, height: 120, borderRadius: "50px 50px 12px 12px", background: "#fff2c4", boxShadow: "0 0 60px rgba(255,220,150,0.7)" }} />
        ))}
        {/* table */}
        <div style={{ position: "absolute", left: 360, top: 780, width: 1200, height: 60, borderRadius: 12, background: wood }} />
        <div style={{ position: "absolute", left: 360, top: 840, width: 1200, height: 260, background: "#9c6b45" }} />
        {/* coffee cup, centred */}
        <Svg>
          <ellipse cx={960} cy={782} rx={140} ry={20} fill="#ffffff" />
          <path d="M890,690 L1030,690 L1018,776 Q960,792 902,776 Z" fill="#fff" stroke="#e7d6c9" strokeWidth={4} />
          <path d="M1030,705 q46,6 30,46 q-10,18 -34,18" fill="none" stroke="#fff" strokeWidth={14} />
          <ellipse cx={960} cy={692} rx={68} ry={9} fill="#5a3825" />
          <ellipse cx={960} cy={692} rx={30 + 30 * Math.abs(ripple)} ry={4 + 4 * Math.abs(ripple)} fill="none" stroke="#8a5a3c" strokeWidth={2} opacity={Math.abs(ripple)} />
          {[0, 1, 2].map((k) => {
            const ph = t * 1.4 + k * 1.2;
            const up = (ph % 1) * 160;
            return <path key={k} d={`M${940 + k * 20},${670 - up} q${Math.sin(ph * 4) * 18},-30 0,-60`} stroke="#ffffff" strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.5 * (1 - (ph % 1))} />;
          })}
        </Svg>
      </div>
      {/* season label */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 60, textAlign: "center", fontFamily: SERIF, fontSize: 52, color: "#7a4b3a", letterSpacing: "0.15em", opacity: 1 - titleP }}>
        {["Spring", "Summer", "Autumn", "Winter"][si]}
      </div>
      {/* title card */}
      {titleP > 0 && (
        <div style={{ position: "absolute", inset: 0, background: "#f6e3d7", opacity: titleP }}>
          <Svg>
            <rect x={460} y={300} width={1000} height={480} fill="none" stroke="#c46e5a" strokeWidth={6} />
            <rect x={480} y={320} width={960} height={440} fill="none" stroke="#c46e5a" strokeWidth={2} />
            <Txt text={c.title || "Four Seasons Express"} x={960} y={540} size={fit(c.title || "Four Seasons Express", 860, 96, 400)} weight={400} color="#7a3b2e" font={SERIF} p={c01((t - 8.7) / 0.6)} mode="fade" tracking={0.02} />
            <Txt text={`A film by ${name}`} x={960} y={640} size={36} weight={400} color="#a0624f" font={SERIF} p={c01((t - 9.0) / 0.6)} mode="fade" tracking={0.12} />
          </Svg>
        </div>
      )}
      <Track src="tracks/train-seasons.wav" on={audio} />
    </AbsoluteFill>
  );
}

