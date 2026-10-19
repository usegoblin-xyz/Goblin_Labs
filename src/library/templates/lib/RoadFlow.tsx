import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, fontOf, nameOf, palette, seg, useT } from "../../motion";

type C = { signs: string; role: string };

// A night-drive showreel: a perspective road rushes toward camera with lane
// dashes and streaking light trails; green road signs carrying words grow
// from the vanishing point and whip past overhead; the speedometer climbs,
// and the final sign holds the name as the car slows.
export default function RoadFlow({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const signs = [...list(c.signs || "Momentum, Direction, Flow"), "Next exit", "Next exit", "Next exit"].slice(0, 3);
  const HZ = 430;
  const VX = 960;
  const slow = c01((t - 7.2) / 1.2);
  const speed = 1 - slow * 0.85;
  // integrate distance roughly
  const dist = t * 4 - Math.max(0, t - 7.2) * 4 * 0.42;
  const outro = expInOut(seg(t, 9.4, 0.5));
  const proj = (x: number, z: number) => ({ x: VX + (x * 600) / z, y: HZ + 650 / z, s: 1 / z });
  const dashes = Array.from({ length: 16 }, (_, i) => {
    const z = 0.6 + ((i - (dist % 1) * 1) % 16 + 16) % 16;
    return z;
  });
  const signAt = (i: number) => 1.0 + i * 2.0;
  const kmh = Math.round(40 + c01(t / 2) * 80 - slow * 70);

  return (
    <AbsoluteFill style={{ background: "#05060c", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          <defs>
            <linearGradient id="rf-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#05060c" />
              <stop offset="1" stopColor="#1b1638" />
            </linearGradient>
          </defs>
          <rect width={1920} height={HZ} fill="url(#rf-sky)" />
          {/* skyline silhouettes */}
          {Array.from({ length: 40 }, (_, i) => (
            <rect key={i} x={i * 50} y={HZ - 30 - ((i * 37) % 70)} width={46} height={30 + ((i * 37) % 70)} fill="#0c0d18" />
          ))}
          {/* road */}
          <path d={`M${VX - 6},${HZ} L${VX + 6},${HZ} L1920,1080 L0,1080 Z`} fill="#111219" />
          {dashes.map((z, i) => {
            const a = proj(0, z);
            const bq = proj(0, z + 0.35);
            return <path key={i} d={`M${a.x - 8 * a.s},${a.y} L${a.x + 8 * a.s},${a.y} L${bq.x + 8 * bq.s},${bq.y} L${bq.x - 8 * bq.s},${bq.y} Z`} fill="#f2f2f2" opacity={0.85} />;
          })}
          {[-1.6, 1.6].map((x, k) => {
            const a = proj(x, 0.6);
            return <line key={k} x1={VX} y1={HZ} x2={a.x} y2={a.y} stroke="#f2f2f2" strokeWidth={6} opacity={0.5} />;
          })}
          {/* light trails */}
          {Array.from({ length: 10 }, (_, i) => {
            const side = i % 2 ? 1 : -1;
            const z = 0.6 + ((i * 1.7 - dist * 1.5) % 14 + 14) % 14;
            const a = proj(side * 2.4, z);
            const bq = proj(side * 2.4, z + 1.6 * speed);
            return <line key={i} x1={a.x} y1={a.y - 40 * a.s} x2={bq.x} y2={bq.y - 40 * bq.s} stroke={side > 0 ? "#ff3b5c" : pal.v} strokeWidth={Math.max(1, 14 * a.s)} strokeLinecap="round" opacity={0.85} />;
          })}
          {/* signs */}
          {[...signs, nameOf(b)].map((s, i) => {
            const at = signAt(i);
            const final = i === 3;
            const u = t - at;
            if (u < 0) return null;
            const z = final ? Math.max(1.6, 12 - u * 6) : 12 - u * 6;
            if (z < 0.35) return null;
            const p = proj(final ? 0 : 0.9, z);
            const w = 900 * p.s;
            const h = 260 * p.s;
            return (
              <g key={i} opacity={c01((12 - z) / 2)}>
                <line x1={p.x - w * 0.42} x2={p.x - w * 0.42} y1={p.y - 900 * p.s} y2={p.y} stroke="#555" strokeWidth={8 * p.s} />
                <line x1={p.x + w * 0.42} x2={p.x + w * 0.42} y1={p.y - 900 * p.s} y2={p.y} stroke="#555" strokeWidth={8 * p.s} />
                <rect x={p.x - w / 2} y={p.y - 1100 * p.s} width={w} height={h} rx={16 * p.s} fill={final ? pal.v : "#0d6b3a"} stroke="#fff" strokeWidth={6 * p.s} />
                <text x={p.x} y={p.y - 1100 * p.s + h * 0.64} textAnchor="middle" fontFamily={ff} fontSize={130 * p.s} fontWeight={800} fill={final ? pal.onV : "#fff"}>
                  {s}
                </text>
              </g>
            );
          })}
          {/* speedo */}
          <g transform="translate(1740 960)">
            <circle r={110} fill="#0c0d16" stroke="#333" strokeWidth={6} />
            <line x1={0} y1={0} x2={0} y2={-86} stroke={pal.v} strokeWidth={8} strokeLinecap="round" transform={`rotate(${-120 + (kmh / 160) * 240})`} />
            <text y={60} textAnchor="middle" fontFamily={ff} fontSize={36} fontWeight={800} fill="#fff">
              {kmh}
            </text>
          </g>
          <Txt text={c.role || "Motion that moves"} x={960} y={1010} size={40} weight={600} color="#fff" font={ff} p={c01((t - 8.0) / 0.6)} mode="fade" />
        </Svg>
      </div>
      <Track src="tracks/road-flow.wav" on={audio} />
    </AbsoluteFill>
  );
}
