import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Browser, Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { url: string; issues: string; from: string; to: string; tagline: string };

// A website analyzer: a URL goes in, a scan beam sweeps the page and drops
// pins on problems, each pin turns from red to fixed, and the score ring
// climbs while a checklist ticks off.
export default function SiteAudit({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const url = c.url || "yoursite.com";
  const issues = [...list(c.issues || "Slow hero image, Missing meta title, Low contrast button, Broken link"), "Issue", "Issue", "Issue", "Issue"].slice(0, 4);
  const from = Number(c.from || 62);
  const to = Number(c.to || 98);
  const typed = url.slice(0, Math.floor(c01((t - 0.3) / 0.7) * url.length));
  const scan = c01((t - 1.4) / 1.6);
  const pins = [
    { x: 380, y: 260 },
    { x: 980, y: 120 },
    { x: 560, y: 520 },
    { x: 1080, y: 600 },
  ];
  const fixAt = (i: number) => 3.6 + i * 0.6;
  const score = lerp(from, to, cubicInOut(seg(t, 3.6, 2.6)));
  const outro = expInOut(seg(t, 7.4, 0.5));
  const endP = c01((t - 7.8) / 0.8);
  const red = "#e5484d";

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Browser x={720} y={540} w={1240} h={820} pal={pal} url={typed} s={lerp(0.94, 1, expOut(seg(t, 0, 0.6)))}>
          {/* a generic page */}
          <div style={{ position: "absolute", left: 60, top: 50, width: 500, height: 40, borderRadius: 10, background: pal.fg, opacity: 0.85 }} />
          <div style={{ position: "absolute", left: 60, top: 110, width: 420, height: 18, borderRadius: 9, background: pal.muted }} />
          <div style={{ position: "absolute", left: 60, top: 150, width: 380, height: 18, borderRadius: 9, background: pal.muted }} />
          <div style={{ position: "absolute", left: 60, top: 200, width: 200, height: 56, borderRadius: 28, background: t > fixAt(2) ? pal.v : pal.card2 }} />
          <div style={{ position: "absolute", right: 60, top: 50, width: 480, height: 320, borderRadius: 20, background: pal.card2 }} />
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ position: "absolute", left: 60 + i * 380, top: 420, width: 340, height: 220, borderRadius: 18, background: pal.card2 }} />
          ))}
          {scan > 0 && scan < 1 && <div style={{ position: "absolute", left: 0, right: 0, top: `${scan * 100}%`, height: 4, background: pal.v, boxShadow: `0 0 30px 6px ${pal.v}` }} />}
          {pins.map((p, i) => {
            const show = scan * 760 > p.y;
            const fixed = t > fixAt(i);
            const pop = spring(t - (1.4 + (p.y / 760) * 1.6), 18, 0.5);
            return show ? (
              <div key={i} style={{ position: "absolute", left: p.x - 26, top: p.y - 26, width: 52, height: 52, borderRadius: 26, background: fixed ? pal.v : red, color: "#fff", fontSize: 28, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${fixed ? 1 + 0.25 * (1 - c01((t - fixAt(i)) * 4)) : pop})`, boxShadow: `0 0 0 ${fixed ? 0 : 8}px ${red}33` }}>
                {fixed ? "✓" : "!"}
              </div>
            ) : null;
          })}
        </Browser>
        <Svg>
          <circle cx={1620} cy={330} r={150} fill="none" stroke={pal.card2} strokeWidth={26} />
          <circle cx={1620} cy={330} r={150} fill="none" stroke={score > 90 ? pal.v : score > 75 ? "#f5a524" : red} strokeWidth={26} strokeLinecap="round" transform="rotate(-90 1620 330)" pathLength={1} strokeDasharray={`${(score / 100) * c01((t - 1.0) * 2)} 2`} />
          <text x={1620} y={360} textAnchor="middle" fontFamily={ff} fontSize={96} fontWeight={800} fill={pal.fg}>
            {Math.round(score * c01((t - 1.0) * 2))}
          </text>
        </Svg>
        {issues.map((it, i) => {
          const fixed = t > fixAt(i);
          const show = scan * 760 > pins[i].y;
          return show ? (
            <div key={i} style={{ position: "absolute", left: 1410, top: 560 + i * 88, width: 440, display: "flex", alignItems: "center", gap: 18, fontSize: 28, color: fixed ? pal.muted : pal.fg, textDecoration: fixed ? "line-through" : "none", opacity: c01(spring(t - 1.6 - i * 0.3, 18, 0.7) * 2) }}>
              <span style={{ width: 34, height: 34, borderRadius: 17, flexShrink: 0, background: fixed ? pal.v : red, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>{fixed ? "✓" : i + 1}</span>
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it}</span>
            </div>
          ) : null;
        })}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Find it. Fix it. Ship it."} x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - 8.2) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/site-audit.wav" on={audio} />
    </AbsoluteFill>
  );
}
