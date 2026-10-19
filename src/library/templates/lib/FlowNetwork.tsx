import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Icon, Mark, Svg, Track, Txt, c01, countStat, expInOut, expOut, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { left: string; right: string; stat1: string; stat2: string; tagline: string };

// A platform overview as a living diagram: supply nodes on the left, demand
// on the right, the brand hub in the middle. Edges draw, packets flow both
// ways, and the hub's live stats count up.
export default function FlowNetwork({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const L = [...list(c.left || "Backers, Funds, Communities"), "Supply", "Supply", "Supply"].slice(0, 3);
  const R = [...list(c.right || "GPU clusters, Researchers, Startups"), "Demand", "Demand", "Demand"].slice(0, 3);
  const HX = 960;
  const HY = 520;
  const nodeL = L.map((n, i) => ({ n, x: 300, y: 260 + i * 260, icon: ["user", "chart", "globe"][i] }));
  const nodeR = R.map((n, i) => ({ n, x: 1620, y: 260 + i * 260, icon: ["layers", "sparkle", "rocket"][i] }));
  const hub = spring(t - 0.3, 14, 0.6);
  const edgesP = (i: number) => expInOut(seg(t, 1.0 + i * 0.12, 0.6));
  const flow = t > 1.8;
  const stats = expInOut(seg(t, 2.4, 3.0));
  const outro = expInOut(seg(t, 7.6, 0.6));
  const endP = c01((t - 8.0) / 0.8);
  const curve = (x0: number, y0: number, x1: number, y1: number) => `M${x0},${y0} C${lerp(x0, x1, 0.5)},${y0} ${lerp(x0, x1, 0.5)},${y1} ${x1},${y1}`;
  const bez = (x0: number, y0: number, x1: number, y1: number, u: number) => {
    const cx = lerp(x0, x1, 0.5);
    const m = 1 - u;
    return { x: m * m * m * x0 + 3 * m * m * u * cx + 3 * m * u * u * cx + u * u * u * x1, y: m * m * m * y0 + 3 * m * m * u * y0 + 3 * m * u * u * y1 + u * u * u * y1 };
  };

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro, transform: `scale(${1 - outro * 0.06})` }}>
        <Svg>
          {[...nodeL, ...nodeR].map((nd, i) => {
            const left = i < 3;
            const x0 = left ? nd.x + 70 : HX + 120;
            const x1 = left ? HX - 120 : nd.x - 70;
            const y0 = left ? nd.y : HY;
            const y1 = left ? HY : nd.y;
            const d = curve(x0, y0, x1, y1);
            return (
              <g key={i}>
                <path d={d} fill="none" stroke={pal.line} strokeWidth={4} pathLength={1} strokeDasharray={`${edgesP(i)} 2`} />
                {flow &&
                  Array.from({ length: 4 }, (_, k) => {
                    const u = (((t - 1.8) * 0.45 + k / 4 + hash(i, k) * 0.1) % 1 + 1) % 1;
                    const p = bez(x0, y0, x1, y1, u);
                    return <circle key={k} cx={p.x} cy={p.y} r={9} fill={left ? pal.v : pal.a} opacity={Math.sin(u * Math.PI)} />;
                  })}
              </g>
            );
          })}
          {[...nodeL, ...nodeR].map((nd, i) => {
            const p = spring(t - 0.5 - i * 0.08, 16, 0.6);
            return (
              <g key={`n${i}`} transform={`translate(${nd.x} ${nd.y}) scale(${Math.max(0, p)})`}>
                <circle r={66} fill={pal.card2} />
                <Icon name={nd.icon} x={0} y={0} size={56} color={i < 3 ? pal.v : pal.a} width={2.4} />
              </g>
            );
          })}
          {[...nodeL, ...nodeR].map((nd, i) => (
            <Txt key={`l${i}`} text={nd.n} x={nd.x} y={nd.y + 116} size={32} weight={600} color={pal.fg} font={ff} p={c01((t - 0.8 - i * 0.08) / 0.5)} mode="fade" />
          ))}
          <circle cx={HX} cy={HY} r={150 * hub + 20 * Math.sin(t * 3) * 0.1} fill={pal.v} opacity={0.12} />
        </Svg>
        <Mark x={HX} y={HY} size={200} b={b} pal={pal} s={hub} />
        <div style={{ position: "absolute", left: HX, top: HY + 160, transform: "translateX(-50%)", display: "flex", gap: 60, opacity: c01((t - 2.3) * 3), whiteSpace: "nowrap" }}>
          {[c.stat1 || "$4.2M deployed", c.stat2 || "1,280 GPUs"].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 58, fontWeight: 800, color: pal.fg, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{countStat(s.split(" ")[0], stats)}</div>
              <div style={{ fontSize: 26, color: pal.muted }}>{s.split(" ").slice(1).join(" ")}</div>
            </div>
          ))}
        </div>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Capital in. Compute out."} x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - 8.4) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/flow-network.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = expOut;
