import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, hash, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { domain: string; score: string; tagline: string };

// A backlink audit at speed: your domain sits at the centre of a web of
// referring sites, a scan wave sweeps out and grades every link, toxic ones
// turn red and get struck for disavow, the authority score ring climbs, and a
// monthly chart shows new against lost links.
const N = 26;

export default function BacklinkAudit({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const domain = c.domain || "yoursite.com";
  const target = Math.max(1, Math.min(100, parseInt(c.score || "72", 10) || 72));
  const CX = 720;
  const CY = 540;

  const nodes = Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2 + hash(i, 1) * 0.2;
    const r = 250 + hash(i, 2) * 200;
    return { x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r * 0.85, r, toxic: hash(i, 3) < 0.23, size: 10 + hash(i, 4) * 14 };
  });
  const wave = c01((t - 1.6) / 1.8) * 520;
  const graded = (n: (typeof nodes)[number]) => n.r < wave;
  const toxicCount = nodes.filter((n) => n.toxic && graded(n)).length;
  const goodCount = nodes.filter((n) => !n.toxic && graded(n)).length;
  const disavow = expInOut(seg(t, 3.7, 0.6));
  const score = expOut(seg(t, 4.2, 1.6));
  const chart = c01((t - 5.6) / 1.4);
  const endP = c01((t - 8.0) / 0.6);
  const months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];
  const gained = [42, 55, 61, 48, 77, 90];
  const lost = [18, 22, 15, 20, 12, 9];

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        <g opacity={1 - c01(endP * 3)}>
          {nodes.map((n, i) => {
            const e = expOut(seg(t, 0.2 + i * 0.03, 0.5));
            const g = graded(n);
            const col = !g ? pal.faint : n.toxic ? "#ff4d5e" : "#2fbf71";
            const struck = n.toxic && disavow > 0;
            return (
              <g key={i} opacity={e}>
                <line x1={CX} y1={CY} x2={CX + (n.x - CX) * e} y2={CY + (n.y - CY) * e} stroke={col} strokeWidth={2} opacity={struck ? 0.25 + 0.5 * (1 - disavow) : 0.55} strokeDasharray={struck ? "6 8" : undefined} />
                <circle cx={n.x} cy={n.y} r={n.size * spring(t - 0.4 - i * 0.03, 16, 0.6)} fill={col} />
                {struck && (
                  <g stroke="#ff4d5e" strokeWidth={4} strokeLinecap="round" opacity={disavow}>
                    <line x1={n.x - 18} y1={n.y - 18} x2={n.x + 18} y2={n.y + 18} />
                    <line x1={n.x + 18} y1={n.y - 18} x2={n.x - 18} y2={n.y + 18} />
                  </g>
                )}
              </g>
            );
          })}
          {wave > 0 && wave < 520 && <ellipse cx={CX} cy={CY} rx={wave} ry={wave * 0.85} fill="none" stroke={pal.p} strokeWidth={4} opacity={0.8} />}
          <circle cx={CX} cy={CY} r={86 * spring(t - 0.05, 14, 0.7)} fill={pal.p} />
          <text x={CX} y={CY + 10} textAnchor="middle" fontFamily={ff} fontSize={24} fontWeight={800} fill={pal.onP}>
            {domain}
          </text>
          {/* right panel */}
          <g transform="translate(1260 160)" opacity={c01((t - 1.2) / 0.4)}>
            <rect width={560} height={760} rx={28} fill={pal.card} />
            <text x={40} y={70} fontFamily={ff} fontSize={30} fontWeight={800} fill={pal.fg}>
              Link audit
            </text>
            <text x={40} y={130} fontFamily={ff} fontSize={26} fill="#2fbf71">{`● ${goodCount} healthy`}</text>
            <text x={300} y={130} fontFamily={ff} fontSize={26} fill="#ff4d5e">{`● ${toxicCount} toxic`}</text>
            {/* score ring */}
            <circle cx={150} cy={290} r={90} fill="none" stroke={pal.line} strokeWidth={22} />
            <circle cx={150} cy={290} r={90} fill="none" stroke={pal.p} strokeWidth={22} strokeLinecap="round" pathLength={1} strokeDasharray={`${(score * target) / 100} 2`} transform="rotate(-90 150 290)" />
            <text x={150} y={306} textAnchor="middle" fontFamily={ff} fontSize={56} fontWeight={900} fill={pal.fg}>
              {Math.round(score * target)}
            </text>
            <text x={290} y={280} fontFamily={ff} fontSize={26} fill={pal.muted}>
              Authority
            </text>
            <text x={290} y={316} fontFamily={ff} fontSize={26} fill={pal.muted}>
              score
            </text>
            {disavow > 0 && (
              <g opacity={disavow}>
                <rect x={290} y={340} width={230} height={50} rx={25} fill="#ff4d5e" />
                <text x={405} y={373} textAnchor="middle" fontFamily={ff} fontSize={22} fontWeight={800} fill="#fff">{`Disavow ${nodes.filter((n) => n.toxic).length}`}</text>
              </g>
            )}
            {/* chart */}
            <text x={40} y={470} fontFamily={ff} fontSize={22} fill={pal.muted}>
              New vs lost links
            </text>
            {months.map((m, i) => {
              const k = c01(chart * 1.6 - i * 0.12);
              return (
                <g key={m} transform={`translate(${50 + i * 80} 700)`}>
                  <rect x={0} y={-gained[i] * 2 * k} width={28} height={gained[i] * 2 * k} rx={6} fill="#2fbf71" />
                  <rect x={32} y={-lost[i] * 2 * k} width={28} height={lost[i] * 2 * k} rx={6} fill="#ff4d5e" opacity={0.85} />
                  <text x={30} y={34} textAnchor="middle" fontFamily={ff} fontSize={18} fill={pal.muted}>
                    {m}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
        {endP > 0 && (
          <>
            <Txt text={name} x={960} y={520} size={fit(name, 1300, 190, 900)} weight={900} color={pal.fg} font={ff} p={c01((t - 8.2) / 0.6)} tracking={-0.05} />
            <Txt text={c.tagline || "Know every link pointing at you"} x={960} y={630} size={46} weight={500} color={pal.muted} font={ff} p={c01((t - 8.4) / 0.5)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/backlink-audit.wav" on={audio} />
    </AbsoluteFill>
  );
}
