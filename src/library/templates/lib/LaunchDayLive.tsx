import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, fit, fontOf, hash, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { product: string; features: string; votes: string };

// A launch-day countdown: 3, 2, 1 slam full screen on alternating colour
// fields, "LIVE" bursts with confetti, feature tags rain in, and an upvote
// card's counter rolls up while a rank badge climbs to #1.
export default function LaunchDayLive({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const product = c.product || nameOf(b);
  const feats = [...list(c.features || "AI drafts, Team inbox, One-click reports, No-code automations"), "New", "New", "New", "New"].slice(0, 4);
  const votes = Number(c.votes || 1240) || 1240;
  const n = t < 0.8 ? 3 : t < 1.6 ? 2 : t < 2.4 ? 1 : 0;
  const u = (t % 0.8) / 0.8;
  const live = t >= 2.4;
  const lu = t - 2.4;
  const count = Math.round(votes * expInOut(c01((t - 4.4) / 2.0)));
  const rank = t < 5.0 ? 4 : t < 5.6 ? 3 : t < 6.1 ? 2 : 1;
  const outro = expInOut(seg(t, 8.4, 0.5));
  const endP = c01((t - 8.8) / 0.8);
  const fields = [pal.v, pal.fg, pal.a];
  const fgs = [pal.onV, pal.bg, pal.onA];

  return (
    <AbsoluteFill style={{ background: !live ? fields[3 - n] : pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {!live && (
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 760, fontWeight: 900, lineHeight: 1, color: fgs[3 - n], transform: `scale(${1.4 - spring(u * 0.8, 20, 0.5) * 0.4}) rotate(${(1 - c01(u * 4)) * (n % 2 ? -8 : 8)}deg)` }}>{n}</div>
          </AbsoluteFill>
        )}
        {live && (
          <>
            <Svg>
              {Array.from({ length: 80 }, (_, i) => {
                const a = hash(i, 1) * Math.PI * 2;
                const v = 400 + hash(i, 2) * 900;
                const x = 960 + Math.cos(a) * v * lu;
                const y = 400 + Math.sin(a) * v * lu * 0.7 + 600 * lu * lu;
                return <rect key={i} x={x} y={y} width={18} height={10} fill={[pal.v, pal.a, "#38a3ff", "#f28ab2", "#f2b64a"][i % 5]} transform={`rotate(${i * 30 + lu * 400} ${x} ${y})`} opacity={c01(2.2 - lu)} />;
              })}
              <Txt text="WE'RE LIVE" x={960} y={lu < 1.8 ? 500 : 180} size={lu < 1.8 ? 220 : 90} weight={900} color={pal.fg} font={ff} p={c01(lu / 0.2)} mode="scale" tracking={-0.03} />
            </Svg>
            {lu > 1.8 &&
              feats.map((f, i) => (
                <div key={i} style={{ position: "absolute", left: 120 + (i % 2) * 380, top: 300 + Math.floor(i / 2) * 140, padding: "22px 34px", borderRadius: 40, background: pal.card, fontSize: fit(f, 300, 34, 700, 0, ff), fontWeight: 700, color: pal.fg, transform: `translateY(${(1 - spring(lu - 1.9 - i * 0.2, 15, 0.55)) * -700}px)` }}>
                  ✦ {f}
                </div>
              ))}
            {lu > 1.8 && (
              <div style={{ position: "absolute", left: 1000, top: 270, width: 800, padding: 44, borderRadius: 34, background: pal.card, display: "flex", alignItems: "center", gap: 34, transform: `translateX(${(1 - spring(lu - 1.9, 13, 0.7)) * 900}px)` }}>
                <div style={{ width: 130, height: 130, borderRadius: 30, background: pal.v, color: pal.onV, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 70, fontWeight: 900 }}>{product[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 52, fontWeight: 900, color: pal.fg }}>{product}</div>
                  <div style={{ fontSize: 28, color: pal.muted }}>Launched today</div>
                </div>
                <div style={{ width: 150, padding: "18px 0", borderRadius: 24, border: `4px solid ${pal.v}`, textAlign: "center", color: pal.v }}>
                  <div style={{ fontSize: 36 }}>▲</div>
                  <div style={{ fontSize: 40, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{count.toLocaleString("en-US")}</div>
                </div>
              </div>
            )}
            {lu > 2.4 && (
              <div style={{ position: "absolute", left: 1000, top: 560, padding: "26px 40px", borderRadius: 30, background: rank === 1 ? "#f2b64a" : pal.card2, color: rank === 1 ? "#2b1d00" : pal.fg, fontSize: 52, fontWeight: 900, transform: `scale(${rank === 1 ? 1 + 0.1 * Math.sin(c01((t - 6.1) / 0.4) * Math.PI) : 1})` }}>
                #{rank} product of the day {rank === 1 ? "🏆" : ""}
              </div>
            )}
          </>
        )}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={product} x={960} y={520} size={160} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text="Out now. Go say hi." x={960} y={630} size={48} weight={600} color={pal.v} font={ff} p={c01((t - 9.2) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/launch-day-live.wav" on={audio} />
    </AbsoluteFill>
  );
}
