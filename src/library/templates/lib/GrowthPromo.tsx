import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Box, Icon, Phone, Svg, Track, Txt, c01, countStat, expInOut, expOut, fit, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { handle: string; followers: string; tagline: string };

// A growth app promo: a post goes up on a phone, hearts stream off it, the
// follower count and a curve climb on either side and notifications stack.
export default function GrowthPromo({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const phoneIn = expOut(seg(t, 0, 0.8));
  const count = expInOut(seg(t, 1.6, 4.2));
  const outro = expInOut(seg(t, 7.2, 0.6));
  const endP = c01((t - 7.6) / 0.8);
  const handle = c.handle || "@studio";
  const followers = c.followers || "48.6k";
  const notes = ["+1,204 followers", "Your post is trending", "New milestone reached"];
  const curve = Array.from({ length: 40 }, (_, i) => {
    const f = i / 39;
    const y = Math.pow(f, 2.2) * 0.85 + 0.05 * Math.sin(f * 14) * f;
    return [1330 + f * 470, 900 - y * 380] as [number, number];
  });
  const shown = Math.floor(count * 39);
  const d = "M" + curve.slice(0, shown + 1).map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" L");
  const head = curve[Math.max(0, shown)];

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro, transform: `scale(${1 + outro * 0.1})` }}>
        <Phone x={960} y={lerp(1400, 560, phoneIn)} h={880} pal={pal}>
          <div style={{ padding: "70px 26px 0", fontFamily: ff }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 26, background: pal.v }} />
              <div style={{ fontSize: 24, fontWeight: 700, color: pal.fg }}>{handle}</div>
            </div>
            <div style={{ marginTop: 20, height: 400, borderRadius: 22, overflow: "hidden", position: "relative", background: `linear-gradient(160deg, ${pal.v}, ${pal.a})` }}>
              <div style={{ position: "absolute", left: 60, top: 70, width: 180, height: 180, borderRadius: "50%", background: pal.onV, opacity: 0.85 }} />
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 120, background: pal.bg, opacity: 0.85 }} />
              <div style={{ position: "absolute", right: 40, top: 40, width: 90, height: 90, borderRadius: 18, background: pal.bg, transform: `rotate(${t * 20}deg)` }} />
            </div>
            <div style={{ marginTop: 20, display: "flex", gap: 22, alignItems: "center", fontSize: 26, fontWeight: 700, color: pal.fg }}>
              <span style={{ color: pal.v, transform: `scale(${1 + 0.3 * Math.max(0, Math.sin(t * 9)) * c01(count * 3)})`, display: "inline-block" }}>♥</span>
              {countStat("12.8k", count)}
              <span style={{ color: pal.muted, fontWeight: 500 }}>likes</span>
            </div>
          </div>
        </Phone>
        {/* hearts */}
        <Svg>
          {Array.from({ length: 26 }, (_, i) => {
            const t0 = 1.7 + hash(i, 1) * 4.2;
            const u = (t - t0) / 1.6;
            if (u < 0 || u > 1) return null;
            const x = 960 + (hash(i, 2) - 0.5) * 300 + Math.sin(u * 6 + i) * 30;
            const y = 700 - u * 520;
            return <Icon key={i} name="heart" x={x} y={y} size={40 + hash(i, 3) * 30} color={pal.v} fill={pal.v} p={1} />;
          })}
        </Svg>
        {/* followers */}
        <Svg>
          <Txt text="Followers" x={170} y={380} size={40} weight={600} color={pal.muted} font={ff} anchor="start" p={c01((t - 1.0) / 0.5)} mode="fade" />
          <text x={170} y={540} fontFamily={ff} fontSize={fit(followers, 560, 170, 800, -0.04, ff)} fontWeight={800} fill={pal.fg} letterSpacing="-0.04em" opacity={c01((t - 1.2) * 3)}>
            {countStat(followers, count)}
          </text>
          <Txt text={`+${Math.round(count * 380)}% this month`} x={170} y={620} size={36} weight={600} color={pal.v} font={ff} anchor="start" p={c01((t - 2.0) / 0.5)} mode="fade" />
          <line x1={1330} x2={1800} y1={900} y2={900} stroke={pal.line} strokeWidth={3} />
          <path d={d} stroke={pal.v} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {count > 0 && <circle cx={head[0]} cy={head[1]} r={14} fill={pal.v} stroke={pal.bg} strokeWidth={5} />}
        </Svg>
        {/* notifications */}
        {notes.map((n, i) => {
          const at = 2.6 + i * 1.2;
          const pop = spring(t - at, 16, 0.65);
          if (t < at) return null;
          const stack = notes.filter((_, j) => j > i && t >= 2.6 + j * 1.2).length;
          return (
            <Box key={n} x={1565} y={190} w={520} h={96} r={26} bg={pal.card2} style={{ transform: `translateY(${(1 - pop) * -60 + stack * 108}px) scale(${lerp(0.9, 1, pop)})`, opacity: c01(pop * 2), display: "flex", alignItems: "center", gap: 18, padding: "0 26px", boxSizing: "border-box", boxShadow: "0 18px 40px rgba(0,0,0,0.25)" }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: pal.v, flexShrink: 0 }} />
              <div style={{ fontSize: 27, fontWeight: 700, color: pal.fg, whiteSpace: "nowrap" }}>{n}</div>
            </Box>
          );
        })}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={540} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Grow on autopilot."} x={960} y={660} size={52} weight={500} color={pal.v} font={ff} p={c01((t - 8.0) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/growth-promo.wav" on={audio} />
    </AbsoluteFill>
  );
}
