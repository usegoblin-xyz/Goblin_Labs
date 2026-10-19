import { AbsoluteFill } from "remotion";
import type { ReactNode } from "react";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, countStat, expInOut, expOut, fit, fontOf, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { campaign: string; budget: string; revenue: string };

// A punchy walkthrough for an ads platform on AI chat assistants. Seven fast
// beats, each its own card sliding in: create a campaign, connect metrics,
// see attribution from chat to purchase, a voice agent takes the call, an
// automatic follow-up, a human approves, and analytics close it out.
const STEPS = ["Create", "Connect", "Attribute", "Voice agent", "Follow up", "Approve", "Analyze"];
const D = 1.1;
const S0 = 0.6;

export default function ChatAds({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const campaign = c.campaign || "Spring launch";
  const idx = Math.max(0, Math.min(STEPS.length - 1, Math.floor((t - S0) / D)));
  const local = t - S0 - idx * D;
  const endP = c01((t - (S0 + STEPS.length * D) - 0.1) / 0.5);
  const intro = 1 - expInOut(seg(t, S0 - 0.2, 0.3));
  const card = expOut(c01(local / 0.3));
  const P = (a: number, d = 0.3) => expOut(c01((local - a) / d));

  const scenes: ReactNode[] = [
    // create
    <g key="0">
      <text x={0} y={0} fontFamily={ff} fontSize={28} fill={pal.muted}>Campaign name</text>
      <rect x={0} y={20} width={760} height={76} rx={14} fill={pal.bg} stroke={pal.line} strokeWidth={2} />
      <text x={24} y={70} fontFamily={ff} fontSize={34} fill={pal.fg}>{campaign.slice(0, Math.floor(c01(local / 0.4) * campaign.length))}</text>
      <text x={0} y={150} fontFamily={ff} fontSize={28} fill={pal.muted}>Daily budget</text>
      <text x={0} y={210} fontFamily={ff} fontSize={56} fontWeight={900} fill={pal.fg}>{countStat(c.budget || "$500", P(0.3, 0.5))}</text>
      <text x={0} y={270} fontFamily={ff} fontSize={28} fill={pal.muted}>Shows when people ask about</text>
      {["running shoes", "marathon training", "trail gear"].map((k, i) => (
        <g key={k} transform={`translate(${i * 250} 300)`} opacity={P(0.4 + i * 0.12)}>
          <rect width={236} height={56} rx={28} fill={pal.p} />
          <text x={118} y={37} textAnchor="middle" fontFamily={ff} fontSize={24} fontWeight={700} fill={pal.onP}>{k}</text>
        </g>
      ))}
    </g>,
    // connect
    <g key="1">
      {["Store", "Analytics", "CRM", "Payments"].map((k, i) => {
        const on = local > 0.25 + i * 0.15;
        return (
          <g key={k} transform={`translate(0 ${i * 92})`}>
            <rect width={760} height={76} rx={16} fill={pal.bg} stroke={pal.line} strokeWidth={2} />
            <text x={28} y={50} fontFamily={ff} fontSize={32} fontWeight={700} fill={pal.fg}>{k}</text>
            <rect x={640} y={18} width={84} height={40} rx={20} fill={on ? pal.p : pal.line} />
            <circle cx={on ? 704 : 660} cy={38} r={16} fill="#fff" />
          </g>
        );
      })}
    </g>,
    // attribute
    <g key="2">
      {["Chat answer", "Ad click", "Product page", "Purchase"].map((k, i) => (
        <g key={k} transform={`translate(${i * 200} 120)`} opacity={P(i * 0.15)}>
          <circle cx={70} cy={60} r={56} fill={i === 3 ? pal.p : pal.card2} stroke={pal.p} strokeWidth={3} />
          <text x={70} y={160} textAnchor="middle" fontFamily={ff} fontSize={24} fill={pal.fg}>{k}</text>
          {i < 3 && <line x1={130} y1={60} x2={130 + 70 * P(i * 0.15 + 0.1)} y2={60} stroke={pal.p} strokeWidth={4} />}
        </g>
      ))}
      <text x={0} y={40} fontFamily={ff} fontSize={34} fontWeight={800} fill={pal.fg} opacity={P(0.6)}>{`${countStat("38%", P(0.6, 0.4))} of sales start in chat`}</text>
    </g>,
    // voice agent
    <g key="3">
      <circle cx={80} cy={150} r={70} fill={pal.p} />
      <text x={80} y={166} textAnchor="middle" fontFamily={ff} fontSize={44} fill={pal.onP}>☎</text>
      {Array.from({ length: 40 }).map((_, i) => {
        const h = 20 + Math.abs(Math.sin(t * 9 + i * 0.7) * Math.sin(i * 0.3)) * 110;
        return <rect key={i} x={190 + i * 14} y={150 - h / 2} width={8} height={h} rx={4} fill={pal.p} opacity={0.85} />;
      })}
      <text x={0} y={300} fontFamily={ff} fontSize={30} fill={pal.fg} opacity={P(0.3)}>"Yes, the trail pair ships tomorrow."</text>
    </g>,
    // follow up
    <g key="4">
      <rect x={0} y={0} width={560} height={110} rx={26} fill={pal.p} opacity={P(0)} />
      <text x={28} y={66} fontFamily={ff} fontSize={30} fill={pal.onP} opacity={P(0)}>Still thinking about those shoes?</text>
      <rect x={200} y={140} width={560} height={110} rx={26} fill={pal.card2} opacity={P(0.35)} />
      <text x={228} y={206} fontFamily={ff} fontSize={30} fill={pal.fg} opacity={P(0.35)}>Yes! Is my size in stock?</text>
      <text x={0} y={310} fontFamily={ff} fontSize={26} fill={pal.muted} opacity={P(0.55)}>Sent automatically after 24 h</text>
    </g>,
    // approve
    <g key="5">
      <text x={0} y={30} fontFamily={ff} fontSize={30} fill={pal.fg}>New ad copy ready for review</text>
      <rect x={0} y={60} width={760} height={120} rx={16} fill={pal.bg} stroke={pal.line} strokeWidth={2} />
      <text x={24} y={132} fontFamily={ff} fontSize={30} fill={pal.fg}>"Light enough for race day."</text>
      <rect x={0} y={220} width={240} height={76} rx={38} fill={local > 0.5 ? "#2fbf71" : pal.p} transform={`scale(${local > 0.45 && local < 0.55 ? 0.95 : 1})`} />
      <text x={120} y={268} textAnchor="middle" fontFamily={ff} fontSize={30} fontWeight={800} fill="#fff">{local > 0.5 ? "✓ Approved" : "Approve"}</text>
      <text x={280} y={268} fontFamily={ff} fontSize={26} fill={pal.muted}>A human signs off</text>
    </g>,
    // analyze
    <g key="6">
      <text x={0} y={30} fontFamily={ff} fontSize={28} fill={pal.muted}>Revenue from chat ads</text>
      <text x={0} y={100} fontFamily={ff} fontSize={70} fontWeight={900} fill={pal.fg}>{countStat(c.revenue || "$48,200", P(0, 0.8))}</text>
      {[30, 42, 38, 55, 61, 74, 90].map((v, i) => (
        <rect key={i} x={i * 104} y={330 - v * 2 * P(i * 0.06, 0.4)} width={78} height={v * 2 * P(i * 0.06, 0.4)} rx={10} fill={i === 6 ? pal.p : pal.card2} />
      ))}
    </g>,
  ];

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        {intro > 0 && (
          <g opacity={intro}>
            <Txt text="Ads, where people ask." x={960} y={560} size={fit("Ads, where people ask.", 1500, 130, 900)} weight={900} color={pal.fg} font={ff} p={c01(t / 0.4)} tracking={-0.045} />
          </g>
        )}
        {intro < 1 && endP < 1 && (
          <g opacity={1 - endP}>
            {/* step rail */}
            {STEPS.map((s, i) => (
              <g key={s} transform={`translate(${130} ${220 + i * 92})`}>
                <circle cx={0} cy={-10} r={i === idx ? 14 : 8} fill={i <= idx ? pal.p : pal.line} />
                <text x={34} y={0} fontFamily={ff} fontSize={i === idx ? 36 : 28} fontWeight={i === idx ? 900 : 500} fill={i === idx ? pal.fg : pal.muted}>
                  {s}
                </text>
              </g>
            ))}
            <g transform={`translate(${720 + (1 - card) * 220} ${260})`} opacity={card}>
              <rect x={-60} y={-90} width={1100} height={560} rx={36} fill={pal.card} />
              <text x={0} y={-30} fontFamily={ff} fontSize={22} fontWeight={800} fill={pal.p} letterSpacing={3}>{`STEP ${idx + 1} OF 7`}</text>
              <g transform="translate(0 40)">{scenes[idx]}</g>
            </g>
          </g>
        )}
        {endP > 0 && (
          <>
            <Txt text={name} x={960} y={520} size={fit(name, 1300, 190, 900)} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.05} />
            <Txt text="Ads for the age of chat" x={960} y={630} size={46} weight={500} color={pal.muted} font={ff} p={c01((t - 8.9) / 0.5)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/chat-ads.wav" on={audio} />
    </AbsoluteFill>
  );
}
