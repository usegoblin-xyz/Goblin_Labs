import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, countStat, expInOut, expOut, fit, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { headline: string; nav: string; tagline: string };

// A slick explainer for an agent-run fund. Kinetic intro, then a dark
// dashboard: four AI agents each run a strategy with live sparklines, an
// allocation ring rebalances toward the agents that perform, guardrails cap
// the drawdown, a deposit and an instant withdrawal show you stay in
// control, and the fund value counts up.
const AGENTS = [
  { n: "Atlas", s: "Momentum" },
  { n: "Rook", s: "Market making" },
  { n: "Wren", s: "Yield" },
  { n: "Quill", s: "Macro" },
];

export default function AgentFund({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const head = c.headline || "Agents trade. You stay in control.";
  const words = head.split(" ");
  const dot = head.indexOf(". ");
  const lines = dot > 0 ? [head.slice(0, dot + 1), head.slice(dot + 2)] : [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")];

  const introOut = expInOut(seg(t, 2.0, 0.5));
  const dash = expOut(seg(t, 2.2, 0.6)) * (1 - expInOut(seg(t, 8.0, 0.4)));
  const endP = c01((t - 8.3) / 0.6);
  const reb = expInOut(seg(t, 4.4, 1.0));
  const w0 = [0.25, 0.25, 0.25, 0.25];
  const w1 = [0.38, 0.17, 0.3, 0.15];
  const weights = w0.map((w, i) => lerp(w, w1[i], reb));
  const guard = expOut(seg(t, 5.6, 0.5));
  const withdraw = expOut(seg(t, 6.6, 0.5));
  const navP = expOut(c01((t - 2.4) / 5.4));

  const spark = (i: number, w: number, h: number) => {
    const n = 26;
    const vis = c01((t - 2.6 - i * 0.12) / 2.6);
    let y = 0;
    const pts: string[] = [];
    for (let k = 0; k <= n * vis; k++) {
      y += (hash(i, k) - 0.42 + (i === 1 ? -0.06 : 0)) * 0.9;
      pts.push(`${(k / n) * w},${h / 2 - y * (h / 8)}`);
    }
    return pts.length > 1 ? "M" + pts.join(" L") : "";
  };

  let acc = -Math.PI / 2;
  const ring = weights.map((w, i) => {
    const a0 = acc;
    acc += w * Math.PI * 2;
    return { a0, a1: acc, i };
  });
  const cols = [pal.p, pal.a, "#6ec3ff", "#c79bff"];

  return (
    <AbsoluteFill style={{ background: pal.dark ? pal.bg : "#0b0d12", overflow: "hidden", fontFamily: ff }}>
      <Svg>
        {/* kinetic intro */}
        {introOut < 1 && (
          <g opacity={1 - introOut} transform={`translate(0 ${-introOut * 120})`}>
            {lines.map((text, row) => (
              <Txt key={row} text={text} x={960} y={500 + row * 150} size={fit(text, 1600, 130, 900)} weight={900} color={row === 0 ? "#ffffff" : pal.p} font={ff} p={c01((t - 0.2 - row * 0.6) / 0.6)} tracking={-0.045} />
            ))}
          </g>
        )}

        {dash > 0 && (
          <g opacity={dash} transform={`translate(0 ${(1 - dash) * 60})`}>
            {/* header */}
            <text x={100} y={120} fontFamily={ff} fontSize={30} fill="#8b93a7">
              Fund value
            </text>
            <text x={100} y={200} fontFamily={ff} fontSize={78} fontWeight={900} fill="#ffffff" letterSpacing={-2}>
              {countStat(c.nav || "$12.4M", navP)}
            </text>
            <g transform="translate(560 160)" opacity={c01((t - 3.0) / 0.3)}>
              <rect width={170} height={48} rx={24} fill={pal.p} opacity={0.18} />
              <text x={85} y={32} textAnchor="middle" fontFamily={ff} fontSize={24} fontWeight={800} fill={pal.p}>
                ▲ 4.8% this month
              </text>
            </g>

            {/* agent cards */}
            {AGENTS.map((a, i) => {
              const x = 100 + (i % 2) * 520;
              const y = 290 + Math.floor(i / 2) * 330;
              const e = spring(t - 2.5 - i * 0.12, 14, 0.75);
              return (
                <g key={a.n} transform={`translate(${x} ${y + (1 - e) * 60})`} opacity={c01(e)}>
                  <rect width={490} height={300} rx={26} fill="#151925" stroke="#232838" strokeWidth={2} />
                  <circle cx={52} cy={56} r={26} fill={cols[i]} />
                  <text x={52} y={66} textAnchor="middle" fontFamily={ff} fontSize={26} fontWeight={900} fill="#0b0d12">
                    {a.n[0]}
                  </text>
                  <text x={94} y={52} fontFamily={ff} fontSize={30} fontWeight={800} fill="#fff">{`Agent ${a.n}`}</text>
                  <text x={94} y={84} fontFamily={ff} fontSize={22} fill="#8b93a7">
                    {a.s}
                  </text>
                  <text x={450} y={60} textAnchor="end" fontFamily={ff} fontSize={26} fontWeight={800} fill={cols[i]}>
                    {`${Math.round(weights[i] * 100)}%`}
                  </text>
                  <g transform="translate(36 130)">
                    <path d={spark(i, 418, 130)} fill="none" stroke={cols[i]} strokeWidth={4} strokeLinejoin="round" />
                  </g>
                  <circle cx={450} cy={260} r={8} fill="#2fbf71" opacity={0.5 + 0.5 * Math.sin(t * 6 + i)} />
                  <text x={432} y={268} textAnchor="end" fontFamily={ff} fontSize={20} fill="#8b93a7">
                    live
                  </text>
                </g>
              );
            })}

            {/* allocation ring */}
            <g transform="translate(1440 400)" opacity={c01((t - 3.0) / 0.4)}>
              {ring.map(({ a0, a1, i }) => {
                const r = 190;
                const large = a1 - a0 > Math.PI ? 1 : 0;
                return <path key={i} d={`M${Math.cos(a0 + 0.02) * r},${Math.sin(a0 + 0.02) * r} A${r},${r} 0 ${large} 1 ${Math.cos(a1 - 0.02) * r},${Math.sin(a1 - 0.02) * r}`} fill="none" stroke={cols[i]} strokeWidth={46} />;
              })}
              <text x={0} y={-6} textAnchor="middle" fontFamily={ff} fontSize={30} fontWeight={800} fill="#fff">
                {reb > 0 && reb < 1 ? "Rebalancing" : "Allocation"}
              </text>
              <text x={0} y={30} textAnchor="middle" fontFamily={ff} fontSize={22} fill="#8b93a7">
                set by performance
              </text>
            </g>

            {/* guardrails + withdraw */}
            <g transform="translate(1180 690)" opacity={guard}>
              <rect width={520} height={130} rx={22} fill="#151925" stroke="#232838" strokeWidth={2} />
              <text x={30} y={50} fontFamily={ff} fontSize={26} fontWeight={800} fill="#fff">
                Guardrail · max drawdown
              </text>
              <rect x={30} y={78} width={380} height={12} rx={6} fill="#232838" />
              <rect x={30} y={78} width={380 * 0.4 * guard} height={12} rx={6} fill={pal.p} />
              <circle cx={30 + 380 * 0.4 * guard} cy={84} r={14} fill="#fff" />
              <text x={490} y={92} textAnchor="end" fontFamily={ff} fontSize={30} fontWeight={900} fill={pal.p}>
                8%
              </text>
            </g>
            <g transform="translate(1180 840)" opacity={withdraw}>
              <rect width={520} height={100} rx={50} fill={t > 7.1 ? "#2fbf71" : "#ffffff"} />
              <text x={260} y={63} textAnchor="middle" fontFamily={ff} fontSize={32} fontWeight={800} fill="#0b0d12">
                {t > 7.1 ? "✓ Withdrawn instantly" : "Withdraw anytime"}
              </text>
            </g>
          </g>
        )}

        {endP > 0 && (
          <>
            <Txt text={name} x={960} y={520} size={fit(name, 1300, 200, 900)} weight={900} color="#ffffff" font={ff} p={endP} tracking={-0.05} />
            <Txt text={c.tagline || "An agent-run fund with guardrails"} x={960} y={630} size={46} weight={500} color="#8b93a7" font={ff} p={c01((t - 8.7) / 0.5)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/agent-fund.wav" on={audio} />
    </AbsoluteFill>
  );
}
