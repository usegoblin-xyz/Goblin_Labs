import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { ticker: string; price: string; tagline: string };

// A trading terminal that blooms from a single dot: the dot pulses, stretches
// into a price line, the line splits into candlesticks, then panels unfold
// around it (order book, depth chart, watchlist, ticket) on a dark grid,
// with prices ticking live.
export default function TerminalBloom({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const ticker = c.ticker || "ACME/USD";
  const base = Number(c.price || 184.2) || 184.2;
  const green = "#2fbf71";
  const red = "#e5484d";
  const dot = spring(t - 0.2, 14, 0.5);
  const stretch = expInOut(seg(t, 1.0, 0.8));
  const candles = c01((t - 1.9) / 0.8);
  const panels = (i: number) => expOut(c01((t - 2.8 - i * 0.25) / 0.6));
  const outro = expInOut(seg(t, 8.0, 0.5));
  const endP = c01((t - 8.4) / 0.8);
  const N = 36;
  const series = Array.from({ length: N }, (_, i) => {
    const o = 0.5 + Math.sin(i * 0.4) * 0.18 + (hash(i, 1) - 0.5) * 0.1 + i * 0.006;
    const cl = o + (hash(i, 2) - 0.48) * 0.12;
    return { o, c: cl, h: Math.max(o, cl) + hash(i, 3) * 0.05, l: Math.min(o, cl) - hash(i, 4) * 0.05 };
  });
  // chart area grows from the centre point
  const CX = 960;
  const CY = 470;
  const cw = lerp(0, 1000, stretch);
  const ch = 420;
  const x0 = CX - cw / 2;
  const yOf = (v: number) => CY + ch / 2 - v * ch;
  const live = base + Math.sin(t * 3) * 0.4 + (hash(Math.floor(t * 6)) - 0.5) * 0.3;
  const book = Array.from({ length: 7 }, (_, i) => ({ p: (live + (i + 1) * 0.05).toFixed(2), s: Math.round(200 + hash(i, Math.floor(t * 4)) * 1800) }));
  const bids = Array.from({ length: 7 }, (_, i) => ({ p: (live - (i + 1) * 0.05).toFixed(2), s: Math.round(200 + hash(i + 9, Math.floor(t * 4)) * 1800) }));
  const panel = (i: number, style: React.CSSProperties, child: React.ReactNode) => (
    <div style={{ position: "absolute", border: "1px solid #232836", background: "#0d1017", fontFamily: MONO, color: "#c8cfdc", fontSize: 20, padding: 16, boxSizing: "border-box", transform: `scale(${0.85 + 0.15 * panels(i)})`, opacity: panels(i), ...style }}>{child}</div>
  );

  return (
    <AbsoluteFill style={{ background: "#07090d", overflow: "hidden", fontFamily: ff }}>
      <AbsoluteFill style={{ backgroundImage: "linear-gradient(#ffffff08 1px, transparent 1px), linear-gradient(90deg, #ffffff08 1px, transparent 1px)", backgroundSize: "60px 60px", opacity: panels(0) }} />
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          {stretch < 1 && <circle cx={CX + cw / 2} cy={yOf(series[N - 1].c)} r={10 * dot * (1 + Math.sin(t * 8) * 0.2 * (1 - stretch))} fill={pal.v} />}
          {stretch > 0 && candles < 1 && (
            <path d={series.map((s, i) => `${i ? "L" : "M"}${x0 + (i / (N - 1)) * cw},${yOf(s.c)}`).join(" ")} fill="none" stroke={pal.v} strokeWidth={4} opacity={1 - candles} />
          )}
          {candles > 0 &&
            series.map((s, i) => {
              const x = x0 + (i / (N - 1)) * cw;
              const up = s.c >= s.o;
              const col = up ? green : red;
              const k = c01(candles * 1.5 - (i / N) * 0.5);
              const mid = (yOf(s.o) + yOf(s.c)) / 2;
              return (
                <g key={i} opacity={k}>
                  <line x1={x} x2={x} y1={lerp(mid, yOf(s.h), k)} y2={lerp(mid, yOf(s.l), k)} stroke={col} strokeWidth={2} />
                  <rect x={x - 9} y={lerp(mid, Math.min(yOf(s.o), yOf(s.c)), k)} width={18} height={Math.max(2, Math.abs(yOf(s.o) - yOf(s.c)) * k)} fill={col} />
                </g>
              );
            })}
          {candles > 0.5 && <line x1={x0} x2={x0 + cw} y1={yOf(series[N - 1].c)} y2={yOf(series[N - 1].c)} stroke={pal.v} strokeWidth={1.5} strokeDasharray="6 6" />}
        </Svg>
        {/* header */}
        {panel(0, { left: 460, top: 60, width: 1000, height: 120 }, (
          <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
            <span style={{ fontSize: 34, color: "#fff", fontWeight: 700 }}>{ticker}</span>
            <span style={{ fontSize: 40, color: green, fontVariantNumeric: "tabular-nums" }}>{live.toFixed(2)}</span>
            <span style={{ color: green }}>▲ 2.31%</span>
            <span style={{ marginLeft: "auto", color: "#6b7385" }}>1m 5m 15m 1h 1D</span>
          </div>
        ))}
        {panel(1, { left: 40, top: 60, width: 380, height: 820 }, (
          <div>
            <div style={{ color: "#6b7385", marginBottom: 12 }}>ORDER BOOK</div>
            {book.slice().reverse().map((r, i) => (
              <div key={i} style={{ display: "flex", position: "relative", height: 40, alignItems: "center" }}>
                <div style={{ position: "absolute", right: 0, top: 6, bottom: 6, width: `${r.s / 25}%`, background: `${red}22` }} />
                <span style={{ color: red, position: "relative" }}>{r.p}</span>
                <span style={{ marginLeft: "auto", position: "relative" }}>{r.s}</span>
              </div>
            ))}
            <div style={{ fontSize: 30, color: "#fff", margin: "14px 0", fontVariantNumeric: "tabular-nums" }}>{live.toFixed(2)}</div>
            {bids.map((r, i) => (
              <div key={i} style={{ display: "flex", position: "relative", height: 40, alignItems: "center" }}>
                <div style={{ position: "absolute", right: 0, top: 6, bottom: 6, width: `${r.s / 25}%`, background: `${green}22` }} />
                <span style={{ color: green, position: "relative" }}>{r.p}</span>
                <span style={{ marginLeft: "auto", position: "relative" }}>{r.s}</span>
              </div>
            ))}
          </div>
        ))}
        {panel(2, { left: 1500, top: 60, width: 380, height: 500 }, (
          <div>
            <div style={{ color: "#6b7385", marginBottom: 12 }}>WATCHLIST</div>
            {["ACME", "NOVA", "ORBT", "LUMA", "KITE", "ZEST"].map((s, i) => {
              const ch = (hash(i, 7) - 0.4) * 5;
              return (
                <div key={i} style={{ display: "flex", height: 66, alignItems: "center" }}>
                  <span style={{ color: "#fff" }}>{s}</span>
                  <span style={{ marginLeft: "auto", color: ch >= 0 ? green : red }}>{ch >= 0 ? "+" : ""}{ch.toFixed(2)}%</span>
                </div>
              );
            })}
          </div>
        ))}
        {panel(3, { left: 1500, top: 600, width: 380, height: 280 }, (
          <div>
            <div style={{ color: "#6b7385", marginBottom: 14 }}>ORDER TICKET</div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1, padding: 14, textAlign: "center", background: green, color: "#04110a", fontWeight: 700 }}>BUY</div>
              <div style={{ flex: 1, padding: 14, textAlign: "center", border: `1px solid ${red}`, color: red }}>SELL</div>
            </div>
            <div style={{ marginTop: 18 }}>Qty 100 · Limit {live.toFixed(2)}</div>
          </div>
        ))}
        {panel(4, { left: 460, top: 720, width: 1000, height: 160 }, (
          <svg width={968} height={128}>
            <path d={`M0,128 ${Array.from({ length: 20 }, (_, i) => `L${i * 24},${128 - (20 - i) * 5 - hash(i) * 8}`).join(" ")} L484,128 Z`} fill={`${green}33`} stroke={green} />
            <path d={`M484,128 ${Array.from({ length: 20 }, (_, i) => `L${484 + i * 24},${128 - i * 5 - hash(i, 2) * 8}`).join(" ")} L968,128 Z`} fill={`${red}33`} stroke={red} />
          </svg>
        ))}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="Everything, from one point." x={960} y={500} size={100} weight={800} color="#fff" font={ff} p={endP} tracking={-0.03} />
          <Txt text={`${nameOf(b)} · ${c.tagline || "the trading terminal"}`} x={960} y={620} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 8.8) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/terminal-bloom.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = [cubicInOut];
