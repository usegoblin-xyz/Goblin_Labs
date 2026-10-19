import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { tasks: string; headline: string; tagline: string };

// A hands-off automation brand promo: two outlined hands rest on a desk and
// lift away; a task list then completes itself with no cursor in sight,
// boxes ticking, rows striking and sliding, a clock speeding round, until
// the list is empty and the hands give a small wave.
export default function HandsOff({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const tasks = [...list(c.tasks || "Reply to new leads, Sync invoices, Post weekly update, Clean up the CRM, Book follow-ups, Send the report"), "Task", "Task", "Task", "Task", "Task", "Task"].slice(0, 6);
  const lift = expInOut(seg(t, 1.0, 0.8));
  const doneAt = (i: number) => 2.2 + i * 0.55;
  const clear = expInOut(seg(t, 6.0, 0.5));
  const wave = Math.sin(c01((t - 6.6) / 1.2) * Math.PI * 4) * 14 * c01((t - 6.6) * 3) * (1 - c01((t - 7.6) * 3));
  const back = expInOut(seg(t, 6.4, 0.6));
  const outro = expInOut(seg(t, 8.2, 0.5));
  const endP = c01((t - 8.6) / 0.8);
  const hand = (side: number) => {
    const m = side ? -1 : 1;
    // simple outline hand: palm + four fingers + thumb
    return (
      <g transform={`translate(${side ? 1500 : 420} ${880 - (lift - back) * 700}) scale(${m} 1) rotate(${side ? wave : -wave})`}>
        <rect x={-110} y={-140} width={220} height={200} rx={70} fill={pal.bg} stroke={pal.fg} strokeWidth={8} />
        {[-80, -27, 27, 80].map((fx, i) => (
          <rect key={i} x={fx - 24} y={-300 + Math.abs(i - 1.5) * 26} width={48} height={190} rx={24} fill={pal.bg} stroke={pal.fg} strokeWidth={8} />
        ))}
        <rect x={90} y={-120} width={46} height={140} rx={23} fill={pal.bg} stroke={pal.fg} strokeWidth={8} transform="rotate(-35 113 -50)" />
      </g>
    );
  };
  const left = tasks.filter((_, i) => t < doneAt(i) + 0.4).length;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* list card */}
        <div style={{ position: "absolute", left: 560, top: 120, width: 800, padding: 50, borderRadius: 36, background: pal.card, boxSizing: "border-box", transform: `translateY(${(1 - spring(t - 0.2, 13, 0.7)) * 200}px)`, opacity: 1 - clear * 0.0 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 30 }}>
            <div style={{ fontSize: 44, fontWeight: 800, color: pal.fg }}>Today</div>
            <div style={{ marginLeft: "auto", fontSize: 30, color: pal.muted }}>{left} left</div>
            {/* speeding clock */}
            <svg width={60} height={60} style={{ marginLeft: 20 }}>
              <circle cx={30} cy={30} r={26} fill="none" stroke={pal.fg} strokeWidth={4} />
              <line x1={30} y1={30} x2={30} y2={10} stroke={pal.fg} strokeWidth={4} transform={`rotate(${t * (t > 2 && t < 6 ? 720 : 40)} 30 30)`} />
              <line x1={30} y1={30} x2={44} y2={30} stroke={pal.v} strokeWidth={4} transform={`rotate(${t * 60} 30 30)`} />
            </svg>
          </div>
          {tasks.map((tk, i) => {
            const d = c01((t - doneAt(i)) / 0.25);
            const gone = cubicInOut(c01((t - doneAt(i) - 0.4) / 0.4));
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, height: 84 * (1 - gone), overflow: "hidden", opacity: 1 - gone, transform: `translateX(${gone * 300}px)` }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, border: `4px solid ${d > 0 ? pal.v : pal.faint}`, background: d > 0.5 ? pal.v : "transparent", color: pal.onV, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 900, flexShrink: 0 }}>{d > 0.5 ? "✓" : ""}</div>
                <div style={{ position: "relative", fontSize: 38, color: d > 0.5 ? pal.muted : pal.fg }}>
                  {tk}
                  <div style={{ position: "absolute", left: 0, top: "52%", height: 4, width: `${c01((t - doneAt(i) - 0.1) / 0.25) * 100}%`, background: pal.muted }} />
                </div>
              </div>
            );
          })}
          {t > 6.0 && <div style={{ fontSize: 44, fontWeight: 800, color: pal.v, textAlign: "center", padding: "20px 0", opacity: clear }}>All clear. ✨</div>}
        </div>
        <Svg>
          {hand(0)}
          {hand(1)}
          <Txt text={c.headline || "Look, no hands."} x={960} y={1010} size={56} weight={800} color={pal.fg} font={ff} p={c01((t - 1.6) / 0.5)} mode="fade" />
        </Svg>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={520} size={160} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Work that does itself."} x={960} y={630} size={50} weight={600} color={pal.v} font={ff} p={c01((t - 9.0) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/hands-off.wav" on={audio} />
    </AbsoluteFill>
  );
}
