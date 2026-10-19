import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Box, Paint, Svg, Track, Txt, c01, countStat, expIn, expInOut, expOut, fit, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { stat: string; words: string; role: string };

// A product dashboard assembles, then gets remixed into motion: the bar chart
// takes the frame and dances on the beat under a slammed word, the bars
// collapse into a spinning donut, the donut unrolls into a rising line, and
// the line underlines your name.
const BARS = [0.42, 0.65, 0.5, 0.8, 0.58, 0.92, 0.72];

export default function DashboardRemix({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const words = [...list(c.words || "Measure, Move, Grow"), "Move", "Move", "Move"].slice(0, 3);

  const cardIn = (i: number) => spring(t - 0.15 - i * 0.18, 15, 0.78);
  const flyOff = expIn(seg(t, 2.9, 0.4));
  const zoom = expInOut(seg(t, 2.9, 0.6));
  const collapse = expInOut(seg(t, 4.55, 0.4));
  const ring = expOut(seg(t, 4.85, 0.5));
  const unroll = expInOut(seg(t, 6.2, 0.7));
  const underline = expInOut(seg(t, 7.8, 0.6));
  const wordOut = expInOut(seg(t, 7.4, 0.4));
  const nameP = c01((t - 8.0) / 0.6);
  const roleP = c01((t - 8.5) / 0.6);

  // Bar card: grows from its dashboard slot to full frame.
  const bx = lerp(1250, 960, zoom);
  const by = lerp(390, 540, zoom);
  const bw = lerp(860, 1920, zoom);
  const bh = lerp(480, 1080, zoom);
  const barW = lerp(70, 150, zoom);
  const gap = lerp(36, 60, zoom);
  const baseY = lerp(by + bh / 2 - 60, 900, zoom);
  const maxH = lerp(300, 460, zoom);
  const beat = (tt: number) => Math.pow(Math.max(0, Math.cos(((tt - 3.0) / 0.5) * Math.PI)), 6);
  const dance = c01((t - 3.1) / 0.2) * (1 - collapse);

  const slam = spring(t - 3.25, 18, 0.55);
  const word2 = spring(t - 5.05, 16, 0.7);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      {/* dashboard cards that leave */}
      {flyOff < 1 && (
        <>
          <Box x={440} y={300} w={520} h={300} r={28} bg={pal.card} style={{ transform: `scale(${cardIn(0)}) translateX(${flyOff * -900}px)`, border: `1.5px solid ${pal.line}` }}>
            <div style={{ position: "absolute", left: 40, top: 36, fontSize: 28, color: pal.muted }}>Revenue</div>
            <div style={{ position: "absolute", left: 40, top: 90, fontSize: 110, fontWeight: 800, color: pal.fg, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums" }}>{countStat(c.stat || "+128%", expOut(seg(t, 0.5, 1.4)))}</div>
          </Box>
          <Box x={440} y={760} w={520} h={420} r={28} bg={pal.card} style={{ transform: `scale(${cardIn(2)}) translateY(${flyOff * 700}px)`, border: `1.5px solid ${pal.line}` }}>
            <Svg w={520} h={420}>
              <circle cx={260} cy={210} r={120} fill="none" stroke={pal.line} strokeWidth={42} />
              <circle cx={260} cy={210} r={120} fill="none" stroke={pal.p} strokeWidth={42} pathLength={1} strokeDasharray={`${0.68 * expOut(seg(t, 0.8, 1.2))} 2`} transform="rotate(-90 260 210)" />
              <circle cx={260} cy={210} r={120} fill="none" stroke={pal.a} strokeWidth={42} pathLength={1} strokeDasharray={`0 0.68 ${0.2 * expOut(seg(t, 1.3, 0.8))} 2`} transform="rotate(-90 260 210)" />
            </Svg>
          </Box>
          <Box x={1250} y={830} w={860} h={340} r={28} bg={pal.card} style={{ transform: `scale(${cardIn(3)}) translateX(${flyOff * 1100}px)`, border: `1.5px solid ${pal.line}` }}>
            <Svg w={860} h={340}>
              <Paint d="M40,280 C160,260 220,180 330,200 S520,90 620,120 S760,60 820,40" color={pal.p} width={8} p={expOut(seg(t, 1.0, 1.4))} />
            </Svg>
          </Box>
        </>
      )}

      {/* the bar card, which becomes the stage */}
      {collapse < 1 && (
        <Box x={bx} y={by} w={bw} h={bh} r={lerp(28, 0, zoom)} bg={zoom > 0.98 ? "transparent" : pal.card} style={{ transform: `scale(${cardIn(1)})`, border: zoom > 0.98 ? undefined : `1.5px solid ${pal.line}` }} />
      )}
      <Svg>
        {collapse < 1 &&
          BARS.map((v, i) => {
            const rise = expOut(seg(t, 0.5 + i * 0.07, 0.6));
            const n = BARS.length;
            const x = bx - ((n - 1) * (barW + gap)) / 2 + i * (barW + gap);
            const h = (v * rise + 0.35 * dance * beat(t - i * 0.04)) * maxH;
            const cx = lerp(x, 960, collapse);
            const cy = lerp(baseY - h / 2, 540, collapse);
            const w = lerp(barW, 40, collapse);
            const hh = lerp(h, 40, collapse);
            return <rect key={i} x={cx - w / 2} y={cy - hh / 2} width={w} height={hh} rx={lerp(12, 20, collapse)} fill={i === 5 ? pal.p : i % 2 ? pal.a : pal.fg} opacity={i === 5 ? 1 : 0.9} />;
          })}
        {slam > 0.01 && collapse < 1 && (
          <Txt text={words[0]} x={960} y={330} size={fit(words[0], 1500, 260, 900)} weight={900} color={pal.fg} font={ff} p={1} tracking={-0.05} opacity={1 - collapse} />
        )}
        {/* donut, then unrolled line */}
        {ring > 0 && unroll < 1 && (
          <g transform={`translate(960 540) rotate(${t * 140})`}>
            <circle r={lerp(20, 300, ring)} fill="none" stroke={pal.p} strokeWidth={lerp(40, 70, ring)} pathLength={1} strokeDasharray={`${0.72 * (1 - unroll)} 2`} />
            <circle r={lerp(20, 300, ring)} fill="none" stroke={pal.a} strokeWidth={lerp(40, 70, ring)} pathLength={1} strokeDasharray={`0 ${0.74 * (1 - unroll)} ${0.24 * (1 - unroll)} 2`} />
          </g>
        )}
        {word2 > 0.01 && unroll < 1 && <Txt text={words[1]} x={960} y={575} size={fit(words[1], 460, 130, 900)} weight={900} color={pal.fg} font={ff} p={word2} mode="scale" opacity={1 - unroll} />}
        {unroll > 0 && (
          <>
            <Paint d="M120,820 C420,800 560,600 820,640 S1240,380 1500,420 S1720,260 1800,240" color={pal.p} width={lerp(70, 18, unroll)} p={unroll} opacity={1 - wordOut} />
            {wordOut < 1 && <Txt text={words[2]} x={lerp(300, 1500, unroll)} y={lerp(760, 360, unroll)} size={120} weight={900} color={pal.fg} font={ff} p={c01((t - 6.3) / 0.4)} opacity={1 - wordOut} />}
          </>
        )}
        {nameP > 0 && (
          <>
            <Txt text={name} x={960} y={560} size={fit(name, 1400, 220, 900)} weight={900} color={pal.fg} font={ff} p={nameP} tracking={-0.05} />
            <Paint d="M560,640 C800,660 1100,620 1360,640" color={pal.p} width={18} p={underline} />
          </>
        )}
        {roleP > 0 && <Txt text={c.role || "Product, in motion"} x={960} y={760} size={44} weight={500} color={pal.muted} font={ff} p={roleP} mode="fade" />}
      </Svg>
      <Track src="tracks/dashboard-remix.wav" on={audio} />
    </AbsoluteFill>
  );
}
