import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, expInOut, fontOf, hash, nameOf, palette, seg, useT } from "../../motion";

type C = { shots: string; tagline: string };

// A drone showreel shot from above: the camera glides over generated terrain
// (fields, river, roads, rooftops) while a viewfinder HUD shows altitude,
// speed, heading and a record dot; each segment has a shot name, the camera
// banks between them, and the last rise pulls up to the brand.
export default function DroneFlight({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const shots = [...list(c.shots || "Coastline, Farmland, Old town"), "Shot", "Shot", "Shot"].slice(0, 3);
  const per = 2.6;
  const k = Math.min(2, Math.floor(t / per));
  const u = t - k * per;
  const speed = 140;
  const fx = t * speed;
  const fy = t * speed * 0.35;
  const bank = Math.sin(t * 0.7) * 6 + (u < 0.4 && k > 0 ? (1 - u / 0.4) * 14 : 0);
  const rise = expInOut(seg(t, 7.8, 1.2));
  const zoom = 1.6 - rise * 0.9 + Math.sin(t * 0.5) * 0.05;
  const endP = c01((t - 8.8) / 0.8);
  const alt = Math.round(120 + Math.sin(t * 0.4) * 15 + rise * 280);
  // terrain tiles
  const T = 200;
  const tiles: JSX.Element[] = [];
  const ox = Math.floor(fx / T);
  const oy = Math.floor(fy / T);
  const biome = (i: number, j: number) => {
    // the river runs diagonally; old town clusters later in the flight
    const river = Math.abs(i - j * 0.6 - 4) < 0.8;
    if (river) return "river";
    if (k === 0 && i % 9 < 2) return "sea";
    const h = hash(i, j);
    if (k === 2) return h > 0.35 ? "roof" : "road";
    return h > 0.7 ? "trees" : h > 0.35 ? "field" : "field2";
  };
  const colors: Record<string, string> = { river: "#3f7fa6", sea: "#2b6a8f", roof: "#b5624c", road: "#5d5a55", trees: "#3e6b3a", field: "#9db35a", field2: "#c9b763" };
  for (let j = oy - 5; j <= oy + 6; j++)
    for (let i = ox - 7; i <= ox + 8; i++) {
      const bm = biome(i, j);
      const x = i * T - fx;
      const y = j * T - fy;
      tiles.push(
        <g key={`${i},${j}`}>
          <rect x={x} y={y} width={T + 1} height={T + 1} fill={colors[bm]} />
          {bm === "field" && Array.from({ length: 6 }, (_, s) => <line key={s} x1={x + 10} x2={x + T - 10} y1={y + 20 + s * 30} y2={y + 20 + s * 30} stroke="#86a04a" strokeWidth={6} />)}
          {bm === "trees" && Array.from({ length: 5 }, (_, s) => <circle key={s} cx={x + 30 + hash(i, j, s) * 140} cy={y + 30 + hash(j, i, s) * 140} r={22 + hash(s, i) * 14} fill="#2f5530" />)}
          {bm === "roof" && <rect x={x + 20} y={y + 20} width={T - 40} height={T - 40} fill="#8f4a3a" />}
          {bm === "roof" && <line x1={x + 20} y1={y + T / 2} x2={x + T - 20} y2={y + T / 2} stroke="#d27a60" strokeWidth={6} />}
          {(bm === "sea" || bm === "river") && <path d={`M${x},${y + 80 + Math.sin(t * 2 + i) * 6} q50,-14 100,0 t100,0`} stroke="#ffffff55" strokeWidth={4} fill="none" />}
        </g>,
      );
    }

  return (
    <AbsoluteFill style={{ background: "#222", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, transform: `rotate(${bank}deg) scale(${zoom})` }}>
        <Svg>
          <g transform="translate(960 540)">{tiles}</g>
          {/* a tiny boat / car following the path */}
          <rect x={960 + Math.sin(t) * 120} y={540 + Math.cos(t * 0.7) * 80} width={20} height={10} fill="#fff" />
        </Svg>
      </div>
      {/* vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55))" }} />
      {/* HUD */}
      <div style={{ position: "absolute", inset: 0, fontFamily: MONO, color: "#fff", opacity: 1 - endP }}>
        <Svg>
          {[
            [80, 80, 1, 1],
            [1840, 80, -1, 1],
            [80, 1000, 1, -1],
            [1840, 1000, -1, -1],
          ].map(([x, y, sx, sy], i) => (
            <path key={i} d={`M${x},${y + sy * 60} V${y} H${x + sx * 60}`} fill="none" stroke="#fff" strokeWidth={4} />
          ))}
          <line x1={930} x2={990} y1={540} y2={540} stroke="#fff" strokeWidth={3} />
          <line x1={960} x2={960} y1={510} y2={570} stroke="#fff" strokeWidth={3} />
        </Svg>
        <div style={{ position: "absolute", left: 120, top: 110, display: "flex", alignItems: "center", gap: 14, fontSize: 28 }}>
          <span style={{ width: 22, height: 22, borderRadius: 11, background: "#ff3b30", opacity: Math.floor(t * 2) % 2 ? 1 : 0.3 }} />
          REC {String(Math.floor(t / 60)).padStart(2, "0")}:{String(Math.floor(t % 60)).padStart(2, "0")}:{String(Math.floor((t % 1) * 30)).padStart(2, "0")}
        </div>
        <div style={{ position: "absolute", right: 120, top: 110, fontSize: 28, textAlign: "right", lineHeight: 1.5 }}>
          ALT {alt} m<br />SPD {Math.round(52 + Math.sin(t) * 4)} km/h<br />HDG {String(Math.round(118 + bank * 3)).padStart(3, "0")}°
        </div>
        <div style={{ position: "absolute", left: 120, bottom: 100, fontSize: 30 }}>4K · 60fps · ND16</div>
        <div key={k} style={{ position: "absolute", right: 120, bottom: 100, fontFamily: ff, fontSize: 64, fontWeight: 800, opacity: c01(u * 3) * (1 - c01((u - per + 0.3) * 4)) * (1 - rise) }}>
          {String(k + 1).padStart(2, "0")} — {shots[k]}
        </div>
      </div>
      {endP > 0 && (
        <AbsoluteFill style={{ background: `rgba(0,0,0,${0.55 * endP})` }}>
          <Svg>
            <Txt text={nameOf(b)} x={960} y={540} size={160} weight={900} color="#fff" font={ff} p={endP} tracking={-0.03} />
            <Txt text={c.tagline || "Aerial film & photo"} x={960} y={650} size={48} weight={600} color={pal.v} font={ff} p={c01((t - 9.2) / 0.6)} mode="fade" />
          </Svg>
        </AbsoluteFill>
      )}
      <Track src="tracks/drone-flight.wav" on={audio} />
    </AbsoluteFill>
  );
}
