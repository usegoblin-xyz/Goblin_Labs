import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, fontOf, hash, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { amount: string; cities: string; tagline: string };

// An instant-payments social promo: a dotted globe spins, a lightning bolt
// strikes from the sender city and arcs to the receiver; a receipt pops with
// an elapsed timer stopped at under a second, then three more payments fire
// in parallel across the globe as a counter climbs.
export default function InstantPay({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const amount = c.amount || "$250.00";
  const cities = [...list(c.cities || "São Paulo, Nairobi, London, Tokyo, Toronto, Lagos"), "City", "City", "City", "City", "City", "City"].slice(0, 6);
  const R = 360;
  const CX = 960;
  const CY = 560;
  const spin = 5 - t * 6;
  // pin positions as lon/lat in degrees
  const geo = [
    [-46, -23],
    [36, -1],
    [0, 51],
    [139, 35],
    [-79, 43],
    [3, 6],
  ];
  const proj = (lon: number, lat: number) => {
    const l = ((lon + spin) * Math.PI) / 180;
    const p = (lat * Math.PI) / 180;
    return { x: CX + R * Math.cos(p) * Math.sin(l), y: CY - R * Math.sin(p), z: Math.cos(p) * Math.cos(l) };
  };
  const arc = (a: number, b2: number, u: number) => {
    const A = proj(geo[a][0], geo[a][1]);
    const B = proj(geo[b2][0], geo[b2][1]);
    const mx = (A.x + B.x) / 2;
    const my = (A.y + B.y) / 2 - 220;
    const pts = Array.from({ length: 31 }, (_, i) => {
      const s = (i / 30) * u;
      const x = (1 - s) * (1 - s) * A.x + 2 * (1 - s) * s * mx + s * s * B.x;
      const y = (1 - s) * (1 - s) * A.y + 2 * (1 - s) * s * my + s * s * B.y;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return { d: `M${pts.join(" L")}`, end: pts[30].split(",").map(Number), A, B };
  };
  const strike = c01((t - 1.0) / 0.15);
  const main = c01((t - 1.15) / 0.5);
  const receipt = spring(t - 1.8, 14, 0.6);
  const elapsed = Math.min(0.42, Math.max(0, t - 1.15) * 0.84);
  const more = c01((t - 4.0) / 0.5);
  const count = Math.floor(Math.max(0, t - 4.0) * 1840);
  const outro = expInOut(seg(t, 7.8, 0.5));
  const endP = c01((t - 8.2) / 0.8);
  const bolt = (x: number, y: number) => `M${x - 10},${y - 260} L${x + 30},${y - 140} L${x - 5},${y - 130} L${x + 25},${y}`;
  const m = arc(0, 1, main);

  return (
    <AbsoluteFill style={{ background: "#07060f", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          <circle cx={CX} cy={CY} r={R} fill="#120f26" />
          {Array.from({ length: 900 }, (_, i) => {
            const lat = Math.asin(2 * hash(i, 1) - 1) * (180 / Math.PI);
            const lon = hash(i, 2) * 360 - 180;
            const p = proj(lon, lat);
            if (p.z < 0) return null;
            return <circle key={i} cx={p.x} cy={p.y} r={3} fill={pal.v} opacity={0.25 + p.z * 0.6} />;
          })}
          {/* main payment */}
          {strike > 0 && t < 1.5 && <path d={bolt(m.A.x, m.A.y)} fill="none" stroke="#fff6b0" strokeWidth={10} strokeLinejoin="round" opacity={1 - c01((t - 1.25) / 0.25)} />}
          {main > 0 && <path d={m.d} fill="none" stroke="#fff6b0" strokeWidth={6} strokeLinecap="round" />}
          {main > 0 && <circle cx={m.end[0]} cy={m.end[1]} r={12 + (main >= 1 ? Math.sin(t * 8) * 4 : 0)} fill="#fff6b0" />}
          {[0, 1].map((ci) => {
            const p = ci ? m.B : m.A;
            return (
              <g key={ci} opacity={p.z > 0 ? 1 : 0.3}>
                <circle cx={p.x} cy={p.y} r={10} fill={pal.a} />
                <text x={p.x} y={p.y - 24} textAnchor="middle" fontFamily={ff} fontSize={28} fontWeight={700} fill="#fff">
                  {cities[ci]}
                </text>
              </g>
            );
          })}
          {/* parallel payments */}
          {more > 0 &&
            [
              [2, 3],
              [4, 5],
              [3, 0],
            ].map(([a, b2], i) => {
              const u = c01((t - 4.0 - i * 0.25) / 0.5);
              const ar = arc(a, b2, u);
              return u > 0 ? <path key={i} d={ar.d} fill="none" stroke={pal.v} strokeWidth={5} strokeLinecap="round" opacity={0.9} /> : null;
            })}
        </Svg>
        {/* receipt */}
        <div style={{ position: "absolute", left: 1400, top: 300, width: 420, padding: 34, borderRadius: 28, background: "#fff", color: "#111", transform: `scale(${receipt})`, transformOrigin: "0 50%" }}>
          <div style={{ fontSize: 24, color: "#777" }}>Sent to {cities[1]}</div>
          <div style={{ fontSize: 66, fontWeight: 900, letterSpacing: "-0.03em" }}>{amount}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, fontSize: 28, fontWeight: 700, color: "#2fbf71" }}>
            ⚡ Settled in {elapsed.toFixed(2)}s
          </div>
          <div style={{ fontSize: 22, color: "#999", marginTop: 8 }}>Fee: $0.001</div>
        </div>
        {more > 0 && (
          <div style={{ position: "absolute", left: 100, top: 420, color: "#fff", opacity: more }}>
            <div style={{ fontSize: 28, color: "#a59fd0" }}>Payments this second</div>
            <div style={{ fontSize: 96, fontWeight: 900, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>{count.toLocaleString("en-US")}</div>
          </div>
        )}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="Money at the speed of a message." x={960} y={500} size={92} weight={800} color="#fff" font={ff} p={endP} tracking={-0.03} />
          <Txt text={`${nameOf(b)} · ${c.tagline || "instant global payments"}`} x={960} y={620} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 8.6) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/instant-pay.wav" on={audio} />
    </AbsoluteFill>
  );
}
