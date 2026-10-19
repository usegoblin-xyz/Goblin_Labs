import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fmtNum, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { accounts: string; values: string; tagline: string };

// All your investments in one view: account cards from different places fly
// in scattered, then stream into a single total that counts up; the total
// splits into an allocation donut, and a performance line draws beneath.
export default function NetWorth({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const accounts = [...list(c.accounts || "Brokerage, Retirement, Crypto, Savings, Property"), "Account", "Account", "Account", "Account", "Account"].slice(0, 5);
  const values = [...list(c.values || "84200, 132500, 12400, 25800, 210000").map(Number), 1000, 1000, 1000, 1000, 1000].slice(0, 5);
  const total = values.reduce((a, b2) => a + b2, 0);
  const cols = [pal.v, pal.a, "#38a3ff", "#f28ab2", "#f2b64a"];
  const merge = cubicInOut(c01((t - 2.2) / 1.0));
  const count = cubicInOut(c01((t - 2.6) / 1.4));
  const donut = expInOut(seg(t, 4.3, 0.8));
  const line = c01((t - 5.0) / 1.6);
  const outro = expInOut(seg(t, 8.6, 0.5));
  const endP = c01((t - 9.0) / 0.8);
  const scatter = [
    [300, 260, -8],
    [1500, 220, 6],
    [260, 760, 5],
    [1560, 780, -6],
    [920, 900, 3],
  ];
  const DX = 1080;
  const DY = 470;
  let acc = 0;
  const pts = Array.from({ length: 40 }, (_, i) => {
    const x = 160 + (i / 39) * 1600;
    const y = 960 - (i / 39) * 120 - Math.sin(i * 0.9) * 22 - Math.sin(i * 0.31) * 30;
    return [x, y] as const;
  });
  const lineD = pts.slice(0, Math.max(2, Math.floor(line * 40))).map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {accounts.map((a, i) => {
          const [sx, sy, r] = scatter[i];
          const s = spring(t - 0.2 - i * 0.18, 14, 0.65);
          const x = lerp(sx, 960, merge);
          const y = lerp(sy, 300, merge);
          const sc = lerp(1, 0.2, merge);
          return (
            <div key={i} style={{ position: "absolute", left: x - 200, top: y - 80, width: 400, height: 160, borderRadius: 26, background: pal.card, padding: 28, boxSizing: "border-box", transform: `scale(${s * sc}) rotate(${r * (1 - merge)}deg)`, opacity: 1 - c01((merge - 0.8) / 0.2), borderLeft: `10px solid ${cols[i]}` }}>
              <div style={{ fontSize: 26, color: pal.muted }}>{a}</div>
              <div style={{ fontSize: 50, fontWeight: 800, color: pal.fg, fontVariantNumeric: "tabular-nums" }}>${fmtNum(values[i])}</div>
            </div>
          );
        })}
        {t > 2.6 && (
          <div style={{ position: "absolute", left: lerp(0, 160, donut), width: lerp(1920, 900, donut), top: lerp(260, 300, donut), textAlign: lerp(0, 1, donut) > 0.5 ? "left" : "center" }}>
            <div style={{ fontSize: 34, color: pal.muted }}>Net worth</div>
            <div style={{ fontSize: lerp(180, 130, donut), fontWeight: 900, letterSpacing: "-0.04em", color: pal.fg, fontVariantNumeric: "tabular-nums" }}>${fmtNum(Math.round(total * count))}</div>
            {line > 0 && <div style={{ fontSize: 36, fontWeight: 700, color: "#2fbf71", opacity: c01(line * 3) }}>▲ 12.4% this year</div>}
          </div>
        )}
        {donut > 0 && (
          <Svg>
            <g transform={`translate(${DX + 160} ${DY}) rotate(-90)`}>
              {values.map((v, i) => {
                const f = v / total;
                const start = acc;
                acc += f;
                return <circle key={i} r={200} fill="none" stroke={cols[i]} strokeWidth={70} pathLength={1} strokeDasharray={`${Math.max(0, f * donut - 0.004)} 2`} strokeDashoffset={-start * donut} />;
              })}
            </g>
            {accounts.map((a, i) => (
              <g key={i} opacity={c01((donut - 0.6) * 3 - i * 0.2)}>
                <circle cx={DX + 440} cy={DY - 140 + i * 70} r={12} fill={cols[i]} />
                <text x={DX + 464} y={DY - 130 + i * 70} fontFamily={ff} fontSize={26} fill={pal.fg}>
                  {a} · {Math.round((values[i] / total) * 100)}%
                </text>
              </g>
            ))}
            {line > 0 && <path d={lineD} fill="none" stroke={pal.v} strokeWidth={6} strokeLinejoin="round" />}
          </Svg>
        )}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="Everything you own. One view." x={960} y={500} size={96} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={`${nameOf(b)} · ${c.tagline || "connect your accounts"}`} x={960} y={620} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 9.4) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/net-worth.wav" on={audio} />
    </AbsoluteFill>
  );
}
