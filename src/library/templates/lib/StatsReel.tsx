import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, countStat, cubicInOut, expInOut, expOut, fit, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { stat: string; statLabel: string; bars: string; share: string; tagline: string };

// A data showreel: a huge number slams and counts, bars race and re-sort,
// a donut bursts into particles that re-form as the share percentage, and
// the particles finally sweep into the name.
export default function StatsReel({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const stat = c.stat || "2.4M";
  const bars = [...list(c.bars || "Mon 30, Tue 55, Wed 42, Thu 78, Fri 64"), "Day 10"].slice(0, 5).map((s) => {
    const parts = s.trim().split(" ");
    return { label: parts.slice(0, -1).join(" ") || parts[0], v: Number(parts[parts.length - 1]) || 10 };
  });
  const share = Number(String(c.share || "72").replace(/\D/g, "")) || 72;
  const s1 = t < 3.0;
  const s2 = t >= 3.0 && t < 6.0;
  const s3 = t >= 6.0 && t < 9.0;
  const endP = c01((t - 9.2) / 0.8);
  const maxV = Math.max(...bars.map((x) => x.v));
  const race = cubicInOut(seg(t, 3.2, 1.6));
  // sort order after the race
  const order = bars.map((x, i) => ({ i, v: x.v })).sort((a, z) => z.v - a.v).map((x) => x.i);
  const resort = expInOut(seg(t, 4.9, 0.6));

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        {s1 && (
          <>
            <Txt text={countStat(stat, cubicInOut(seg(t, 0.2, 1.6)))} x={960} y={620} size={fit(stat, 1600, 360, 900, -0.05, ff)} weight={900} color={pal.fg} font={ff} p={c01(t / 0.3)} mode="scale" out={c01((t - 2.7) / 0.3)} tracking={-0.05} />
            <Txt text={c.statLabel || "people reached"} x={960} y={760} size={56} weight={600} color={pal.v} font={ff} p={c01((t - 0.8) / 0.5)} out={c01((t - 2.7) / 0.3)} mode="fade" />
          </>
        )}
        {s2 &&
          bars.map((x, i) => {
            const rank = order.indexOf(i);
            const slot = lerp(i, rank, resort);
            const y = 220 + slot * 140;
            const w = (x.v / maxV) * 1200 * race;
            const out = c01((t - 5.75) * 4);
            return (
              <g key={i} opacity={1 - out}>
                <text x={300} y={y + 18} textAnchor="end" fontFamily={ff} fontSize={40} fontWeight={700} fill={pal.muted}>
                  {x.label}
                </text>
                <rect x={330} y={y - 36} width={Math.max(0, w)} height={88} rx={20} fill={rank === 0 && resort > 0.5 ? pal.v : pal.card2} />
                <text x={340 + w + 20} y={y + 22} fontFamily={ff} fontSize={48} fontWeight={800} fill={pal.fg}>
                  {Math.round(x.v * race)}
                </text>
              </g>
            );
          })}
        {s3 &&
          (() => {
            const u = t - 6.0;
            const ring = expOut(c01(u / 0.8));
            const burst = c01((u - 1.2) / 0.6);
            const form = expInOut(c01((u - 1.8) / 0.9));
            return (
              <g>
                {Array.from({ length: 160 }, (_, i) => {
                  const a = (i / 160) * Math.PI * 2 - Math.PI / 2;
                  const inShare = i / 160 < share / 100;
                  const rx = 960 + Math.cos(a) * 260;
                  const ry = 520 + Math.sin(a) * 260;
                  const bx = rx + Math.cos(a) * (200 + hash(i, 1) * 500) * burst;
                  const by = ry + Math.sin(a) * (200 + hash(i, 1) * 400) * burst;
                  const tx = 960 + (hash(i, 2) - 0.5) * 1700;
                  const ty = 540 + (hash(i, 3) - 0.5) * 900;
                  const x = lerp(bx, tx, form);
                  const y = lerp(by, ty, form);
                  return <circle key={i} cx={x} cy={y} r={lerp(14, 4, Math.max(burst, 0))} fill={inShare ? pal.v : pal.card2} opacity={ring * (form > 0 ? 1 - form * 0.6 : 1)} />;
                })}
                <Txt text={`${share}%`} x={960} y={560 + 60} size={200} weight={900} color={pal.fg} font={ff} p={c01((u - 0.4) / 0.4)} out={c01((u - 1.1) / 0.2)} mode="scale" tracking={-0.05} />
                <Txt text={`${share}%`} x={960} y={600} size={280} weight={900} color={pal.v} font={ff} p={c01((u - 2.2) / 0.4)} out={c01((u - 2.8) / 0.2)} mode="scale" tracking={-0.05} />
              </g>
            );
          })()}
        {endP > 0 && (
          <>
            <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
            <Txt text={c.tagline || "Numbers, in motion."} x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - 9.6) / 0.6)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/stats-reel.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = spring;
