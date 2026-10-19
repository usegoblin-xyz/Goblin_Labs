import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, fontOf, hash, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { task: string; distractions: string; tagline: string };

// A focus-app launch: notifications pile in from every side and buzz; one
// tap on "Focus" and they all freeze, blur and get swept into a small
// "held for later" badge; a large timer ring then runs a 25-minute session
// time-lapsed, ending in a satisfying completion burst.
export default function FocusTimer({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const task = c.task || "Write the launch post";
  const dist = [...list(c.distractions || "3 new messages, Your order shipped, 12 likes on your photo, Meeting in 10 min, Flash sale ends soon, Someone mentioned you"), "Ping", "Ping", "Ping", "Ping", "Ping", "Ping"].slice(0, 6);
  const tap = 2.2;
  const sweep = expInOut(seg(t, tap + 0.2, 0.7));
  const ring = c01((t - 3.4) / 3.6);
  const done = t > 7.0;
  const outro = expInOut(seg(t, 8.6, 0.5));
  const endP = c01((t - 9.0) / 0.8);
  const mins = Math.max(0, 25 - Math.floor(ring * 25));
  const secs = ring >= 1 ? 0 : 59 - Math.floor((ring * 25 * 60) % 60);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* notifications */}
        {dist.map((d, i) => {
          const at = 0.2 + i * 0.28;
          const s = spring(t - at, 16, 0.6);
          const x0 = 140 + hash(i, 1) * 1240;
          const y0 = 100 + hash(i, 2) * 760;
          const buzz = t < tap ? Math.sin(t * 60 + i) * 4 * c01((t - at) * 3) : 0;
          const x = x0 + (1560 - x0) * sweep;
          const y = y0 + (90 - y0) * sweep;
          return (
            <div key={i} style={{ position: "absolute", left: x + buzz, top: y, width: 520, padding: "22px 28px", borderRadius: 26, background: pal.card, display: "flex", alignItems: "center", gap: 18, transform: `scale(${s * (1 - sweep * 0.8)})`, opacity: c01(s * 2) * (1 - c01((sweep - 0.7) * 4)), filter: t > tap ? `blur(${sweep * 6}px)` : "none", boxShadow: "0 16px 40px rgba(0,0,0,0.25)" }}>
              <div style={{ width: 54, height: 54, borderRadius: 14, background: ["#e5484d", "#38a3ff", "#f28ab2", "#f2b64a", pal.a, "#2fbf71"][i], flexShrink: 0 }} />
              <div style={{ fontSize: 28, fontWeight: 600, color: pal.fg }}>{d}</div>
            </div>
          );
        })}
        {/* held badge */}
        {sweep > 0.6 && (
          <div style={{ position: "absolute", left: 1560, top: 70, padding: "14px 24px", borderRadius: 30, background: pal.card2, color: pal.muted, fontSize: 26, fontWeight: 700, transform: `scale(${spring(t - tap - 0.6, 18, 0.5)})` }}>
            🔕 6 held for later
          </div>
        )}
        {/* focus button / ring */}
        <Svg>
          {t < tap + 0.4 && (
            <g transform={`translate(960 540) scale(${spring(t - 1.6, 16, 0.6) * (t > tap && t < tap + 0.15 ? 0.92 : 1)})`} opacity={1 - c01((t - tap) * 3)}>
              <rect x={-200} y={-70} width={400} height={140} rx={70} fill={pal.v} />
              <text y={18} textAnchor="middle" fontFamily={ff} fontSize={56} fontWeight={800} fill={pal.onV}>
                Focus
              </text>
            </g>
          )}
          {t > tap + 0.6 && (
            <g transform={`translate(960 520) scale(${spring(t - tap - 0.6, 12, 0.7)})`}>
              <circle r={300} fill="none" stroke={pal.card2} strokeWidth={30} />
              <circle r={300} fill="none" stroke={pal.v} strokeWidth={30} strokeLinecap="round" pathLength={1} strokeDasharray={`${ring} 2`} transform="rotate(-90)" />
              <text y={30} textAnchor="middle" fontFamily={ff} fontSize={130} fontWeight={800} fill={pal.fg} style={{ fontVariantNumeric: "tabular-nums" }}>
                {done ? "Done" : `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`}
              </text>
              <text y={110} textAnchor="middle" fontFamily={ff} fontSize={36} fill={pal.muted}>
                {task}
              </text>
              {done &&
                Array.from({ length: 24 }, (_, i) => {
                  const a = (i / 24) * Math.PI * 2;
                  const u = c01((t - 7.0) / 0.8);
                  return <circle key={i} cx={Math.cos(a) * (310 + u * 160)} cy={Math.sin(a) * (310 + u * 160)} r={10 * (1 - u)} fill={i % 2 ? pal.v : pal.a} />;
                })}
            </g>
          )}
        </Svg>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="Silence the noise. Finish the thing." x={960} y={500} size={90} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.03} />
          <Txt text={`${nameOf(b)} · ${c.tagline || "deep work, made easy"}`} x={960} y={620} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 9.4) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/focus-timer.wav" on={audio} />
    </AbsoluteFill>
  );
}
