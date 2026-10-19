import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Icon, Mark, Svg, Track, Txt, c01, expInOut, expOut, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { apps: string; events: string; tagline: string };

// Connectors plug in: app tiles orbit the brand hub, each cable snakes in and
// clicks into a port, and every connection starts feeding the activity log
// on the right.
const ICONS6 = ["mail", "chat", "doc", "calendar", "chart", "cloud"];

export default function ConnectorHub({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const apps = [...list(c.apps || "Mail, Chat, Docs, Calendar, Sheets, Drive"), "App", "App", "App", "App", "App", "App"].slice(0, 6);
  const events = [...list(c.events || "New lead from Mail, Standup notes synced, Doc edited by Ava, Meeting moved to 3pm, Sheet updated, File shared"), "Event"].slice(0, 6);
  const HX = 700;
  const HY = 540;
  const R = 330;
  const plug = (i: number) => 1.0 + i * 0.5;
  const outro = expInOut(seg(t, 7.6, 0.5));
  const endP = c01((t - 8.0) / 0.8);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          {apps.map((a, i) => {
            const ang = -Math.PI / 2 + (i / 6) * Math.PI * 2 + t * 0.08;
            const x = HX + Math.cos(ang) * R;
            const y = HY + Math.sin(ang) * R;
            const p = expInOut(seg(t, plug(i) - 0.4, 0.5));
            const sx = HX + Math.cos(ang) * 110;
            const sy = HY + Math.sin(ang) * 110;
            const mid = { x: lerp(x, sx, 0.5) + Math.sin(ang) * 60, y: lerp(y, sy, 0.5) - Math.cos(ang) * 60 };
            const live = t > plug(i);
            return (
              <g key={i}>
                <path d={`M${x},${y} Q${mid.x},${mid.y} ${sx},${sy}`} fill="none" stroke={live ? pal.v : pal.line} strokeWidth={6} pathLength={1} strokeDasharray={`${p} 2`} strokeLinecap="round" />
                {live && <circle cx={lerp(x, sx, ((t * 0.9 + i * 0.17) % 1))} cy={lerp(y, sy, ((t * 0.9 + i * 0.17) % 1))} r={7} fill={pal.v} />}
                <g transform={`translate(${x} ${y}) scale(${Math.max(0, spring(t - 0.2 - i * 0.08, 16, 0.6))})`}>
                  <rect x={-62} y={-62} width={124} height={124} rx={30} fill={live ? pal.card2 : pal.card} stroke={live ? pal.v : pal.line} strokeWidth={3} />
                  <Icon name={ICONS6[i] === "calendar" ? "clock" : ICONS6[i]} x={0} y={-6} size={52} color={live ? pal.v : pal.muted} width={2.4} />
                  <text y={92} textAnchor="middle" fontFamily={ff} fontSize={24} fontWeight={600} fill={pal.fg}>
                    {a}
                  </text>
                </g>
              </g>
            );
          })}
        </Svg>
        <Mark x={HX} y={HY} size={180} b={b} pal={pal} s={spring(t - 0.1, 14, 0.6) * (1 + 0.04 * Math.sin(t * 4))} />
        {/* activity log */}
        <div style={{ position: "absolute", left: 1220, top: 170, width: 580, height: 740, borderRadius: 30, background: pal.card, padding: 34, boxSizing: "border-box", overflow: "hidden", opacity: expOut(seg(t, 0.6, 0.5)) }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: pal.fg, marginBottom: 20 }}>Activity</div>
          {events.map((e, i) => {
            const at = plug(i) + 0.25;
            if (t < at) return null;
            const p = spring(t - at, 18, 0.7);
            const newer = events.filter((_, j) => j > i && t >= plug(j) + 0.25).length;
            return (
              <div key={i} style={{ position: "absolute", left: 34, right: 34, top: 90 + newer * 104, height: 88, borderRadius: 20, background: newer === 0 ? pal.v : pal.card2, display: "flex", alignItems: "center", gap: 16, padding: "0 22px", transform: `translateY(${(1 - p) * -40}px)`, opacity: c01(p * 2), transition: "none" }}>
                <div style={{ width: 14, height: 14, borderRadius: 7, background: newer === 0 ? pal.onV : pal.v, flexShrink: 0 }} />
                <div style={{ fontSize: 25, fontWeight: 600, color: newer === 0 ? pal.onV : pal.fg, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e}</div>
                <div style={{ marginLeft: "auto", fontSize: 20, color: newer === 0 ? pal.onV : pal.muted, opacity: 0.8 }}>{newer === 0 ? "now" : `${newer * 2 + Math.floor(hash(i, 1) * 2)}m`}</div>
              </div>
            );
          })}
        </div>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Every tool. One feed."} x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - 8.4) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/connector-hub.wav" on={audio} />
    </AbsoluteFill>
  );
}
