import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Box, Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fit, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { book: string; pages: string; ideas: string; minutes: string; tagline: string };

// A product explainer for book summaries: a thick book opens, its pages fan
// out and pour into a still, and what drips out are key-idea cards plus a
// reading time that drops from hours to minutes.
export default function BookDistill({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const ideas = [...list(c.ideas || "Start with why, Habits compound, Focus wins, Rest is work"), "Idea", "Idea", "Idea", "Idea"].slice(0, 4);
  const book = c.book || "The Long Book";
  const pagesN = Number(String(c.pages || "412").replace(/\D/g, "")) || 412;
  const open = expInOut(seg(t, 0.8, 0.8));
  const pour = seg(t, 1.8, 2.4);
  const distill = expOut(seg(t, 3.6, 1.2));
  const outro = expInOut(seg(t, 9.6, 0.6));
  const endP = c01((t - 10.0) / 0.8);
  const hrs = lerp(7.5, Number(c.minutes || 15) / 60, cubicInOut(seg(t, 6.6, 1.6)));
  const timeLabel = hrs >= 1 ? `${hrs.toFixed(1)} h` : `${Math.round(hrs * 60)} min`;

  // funnel geometry
  const FX = 960;
  const FY = 470;
  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* the book */}
        <div style={{ position: "absolute", left: 300 - 170, top: 540 - 230, width: 340, height: 460, perspective: 1600, transform: `translateY(${(1 - expOut(seg(t, 0, 0.7))) * 120}px)` }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 10, background: pal.card2, boxShadow: `inset 0 0 0 2px ${pal.line}` }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: 10, background: pal.v, transformOrigin: "0% 50%", transform: `rotateY(${-open * 150}deg)`, backfaceVisibility: "hidden", padding: 34, boxSizing: "border-box" }}>
            <div style={{ fontSize: fit(book, 260, 52, 800, -0.03, ff), fontWeight: 800, color: pal.onV, letterSpacing: "-0.03em", lineHeight: 1.05 }}>{book}</div>
            <div style={{ position: "absolute", left: 34, bottom: 34, fontSize: 24, color: pal.onV, opacity: 0.8 }}>{pagesN} pages</div>
          </div>
        </div>
        <Svg>
          {/* pages flying into the funnel */}
          {Array.from({ length: 24 }, (_, i) => {
            const t0 = 1.8 + i * 0.09;
            const u = c01((t - t0) / 1.1);
            if (u <= 0 || u >= 1) return null;
            const sx = 330;
            const sy = 540 + (hash(i, 1) - 0.5) * 200;
            const x = lerp(sx, FX, u) + Math.sin(u * Math.PI) * (hash(i, 2) - 0.5) * 120;
            const y = lerp(sy, FY - 120, u) - Math.sin(u * Math.PI) * (220 + hash(i, 3) * 160);
            const r = (hash(i, 4) - 0.5) * 720 * u;
            return <rect key={i} x={-34} y={-44} width={68} height={88} rx={6} fill={pal.fg} opacity={0.9 * (1 - u * 0.4)} transform={`translate(${x} ${y}) rotate(${r}) scale(${1 - u * 0.5})`} />;
          })}
          {/* the still: funnel + coil */}
          <g opacity={expOut(seg(t, 1.2, 0.6))}>
            <path d={`M${FX - 210},${FY - 160} L${FX + 210},${FY - 160} L${FX + 40},${FY + 40} L${FX + 40},${FY + 90} L${FX - 40},${FY + 90} L${FX - 40},${FY + 40} Z`} fill={pal.card} stroke={pal.line} strokeWidth={3} />
            <rect x={FX - 210} y={FY - 160} width={420 * Math.min(1, pour * 1.2)} height={12} rx={6} fill={pal.v} />
            {Array.from({ length: 5 }, (_, i) => (
              <path key={i} d={`M${FX - 40},${FY + 110 + i * 34} C${FX - 120},${FY + 120 + i * 34} ${FX + 120},${FY + 130 + i * 34} ${FX + 40},${FY + 144 + i * 34}`} fill="none" stroke={distill > i / 5 ? pal.v : pal.line} strokeWidth={10} strokeLinecap="round" />
            ))}
          </g>
          {/* drops */}
          {Array.from({ length: 4 }, (_, i) => {
            const u = c01((t - 4.2 - i * 0.5) / 0.5);
            if (u <= 0 || u >= 1) return null;
            return <circle key={i} cx={FX} cy={lerp(FY + 300, FY + 420, u * u)} r={14} fill={pal.v} />;
          })}
        </Svg>
        {/* idea cards */}
        {ideas.map((idea, i) => {
          const at = 4.6 + i * 0.5;
          const p = spring(t - at, 15, 0.65);
          if (t < at) return null;
          return (
            <Box key={i} x={1540} y={260 + i * 150} w={560} h={124} r={24} bg={i === 0 ? pal.v : pal.card2} style={{ transform: `translateX(${(1 - p) * -420}px) scale(${lerp(0.4, 1, c01(p))})`, opacity: c01(p * 2), display: "flex", alignItems: "center", gap: 22, padding: "0 30px", boxSizing: "border-box" }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: i === 0 ? pal.onV : pal.v, width: 44 }}>{String(i + 1).padStart(2, "0")}</div>
              <div style={{ fontSize: 34, fontWeight: 700, color: i === 0 ? pal.onV : pal.fg, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>{idea}</div>
            </Box>
          );
        })}
        {/* reading time */}
        {t > 6.4 && (
          <div style={{ position: "absolute", left: 960, top: 980, transform: `translateX(-50%) scale(${spring(t - 6.4, 16, 0.6)})`, display: "flex", alignItems: "baseline", gap: 18, whiteSpace: "nowrap" }}>
            <span style={{ fontSize: 32, color: pal.muted }}>Reading time</span>
            <span style={{ fontSize: 64, fontWeight: 800, color: pal.fg, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{timeLabel}</span>
          </div>
        )}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Every book, distilled."} x={960} y={650} size={52} weight={500} color={pal.v} font={ff} p={c01((t - 10.4) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/book-distill.wav" on={audio} />
    </AbsoluteFill>
  );
}
