import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { events: string; rate: string; tagline: string };

// Usage-based billing as a machine: event particles stream in from three
// sources, pour into a meter that spins up, the meter ticks out invoice
// lines with amounts, and a tier bar fills as volume crosses each tier.
export default function UsageBilling({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const events = [...list(c.events || "API calls, Tokens, Storage GB"), "Events", "Events", "Events"].slice(0, 3);
  const rates = [0.002, 0.00001, 0.08];
  const flow = c01((t - 0.6) / 5.0);
  const counts = [Math.round(cubicInOut(flow) * 184000), Math.round(cubicInOut(flow) * 9200000), Math.round(cubicInOut(flow) * 420)];
  const total = counts.reduce((a, n, i) => a + n * rates[i], 0);
  const tier = c01(total / 600);
  const outro = expInOut(seg(t, 7.6, 0.5));
  const endP = c01((t - 8.0) / 0.8);
  const MX = 860;
  const MY = 520;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          {/* sources */}
          {events.map((e, i) => {
            const y = 260 + i * 260;
            return (
              <g key={i}>
                <rect x={100} y={y - 50} width={300} height={100} rx={24} fill={pal.card2} opacity={expOut(seg(t, 0.1 + i * 0.1, 0.5))} />
                <text x={250} y={y + 12} textAnchor="middle" fontFamily={ff} fontSize={34} fontWeight={700} fill={pal.fg}>
                  {e}
                </text>
                {Array.from({ length: 14 }, (_, k) => {
                  const u = ((t - 0.6) * 0.9 + k / 14 + hash(i, k) * 0.05) % 1;
                  if (t < 0.6 || t > 6.0) return null;
                  const x = lerp(400, MX - 120, u);
                  const yy = lerp(y, MY, u * u) + Math.sin(u * 8 + k) * 6;
                  return <circle key={k} cx={x} cy={yy} r={7} fill={[pal.v, pal.a, pal.fg][i]} opacity={Math.sin(u * Math.PI)} />;
                })}
              </g>
            );
          })}
          {/* meter */}
          <circle cx={MX} cy={MY} r={140} fill={pal.card} stroke={pal.line} strokeWidth={4} />
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i / 24) * Math.PI * 2 + t * 2 * flow * (t < 6 ? 1 : 0);
            return <line key={i} x1={MX + Math.cos(a) * 100} y1={MY + Math.sin(a) * 100} x2={MX + Math.cos(a) * 125} y2={MY + Math.sin(a) * 125} stroke={i % 4 ? pal.faint : pal.v} strokeWidth={5} />;
          })}
          <text x={MX} y={MY + 16} textAnchor="middle" fontFamily={MONO} fontSize={40} fontWeight={700} fill={pal.fg}>
            ${total.toFixed(2)}
          </text>
        </Svg>
        {/* invoice */}
        <div style={{ position: "absolute", left: 1160, top: 140, width: 660, borderRadius: 28, background: pal.dark ? "#f6f6f4" : "#ffffff", color: "#141416", padding: 40, boxSizing: "border-box", boxShadow: "0 30px 70px rgba(0,0,0,0.35)", transform: `translateY(${(1 - spring(t - 0.4, 14, 0.7)) * 200}px)` }}>
          <div style={{ fontSize: 34, fontWeight: 800 }}>Invoice</div>
          <div style={{ fontFamily: MONO, fontSize: 20, color: "#777", marginTop: 4 }}>this month · live</div>
          {events.map((e, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginTop: 26, fontSize: 28 }}>
              <span>
                {e} <span style={{ color: "#888", fontFamily: MONO, fontSize: 22 }}>× {counts[i].toLocaleString("en-US")}</span>
              </span>
              <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${(counts[i] * rates[i]).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ height: 2, background: "#e4e4e0", margin: "28px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 38, fontWeight: 800 }}>
            <span>Total</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>${total.toFixed(2)}</span>
          </div>
        </div>
        {/* tiers */}
        <div style={{ position: "absolute", left: 1160, top: 760, width: 660 }}>
          <div style={{ display: "flex", gap: 8, height: 26 }}>
            {["Starter", "Growth", "Scale"].map((n, i) => (
              <div key={n} style={{ flex: 1, borderRadius: 13, background: pal.card2, overflow: "hidden" }}>
                <div style={{ width: `${c01(tier * 3 - i) * 100}%`, height: "100%", background: [pal.a, pal.v, pal.fg][i] }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 26, color: pal.muted }}>
            <span>Starter</span>
            <span>Growth</span>
            <span>Scale</span>
          </div>
        </div>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={c.rate || "Bill for what's used."} x={960} y={500} size={110} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={nameOf(b)} x={960} y={620} size={52} weight={600} color={pal.v} font={ff} p={c01((t - 8.4) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/usage-billing.wav" on={audio} />
    </AbsoluteFill>
  );
}
