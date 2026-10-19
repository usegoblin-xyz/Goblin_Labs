import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, backOut, c01, expInOut, expOut, fit, fontOf, lerp, mix, nameOf, onColor, palette, seg, spring, useT } from "../../motion";

type C = { speaker: string; transcript: string; handle: string };

// A punchy vertical talking-head edit: an illustrated speaker talks while
// word-by-word captions highlight the spoken word, the frame punches in on
// key beats, stickers and a stat pop up, a progress bar runs along the top,
// and it ends on a follow card.
const W = 1080;
const H = 1920;
const START = 0.6;
const PER = 0.3;

export default function TalkingHead({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const words = (c.transcript || "Most people quit right before it starts working. So here is the trick: ship small, ship daily, and let the results compound.").split(/\s+/);
  const endT = START + words.length * PER;
  const idx = Math.min(words.length - 1, Math.max(-1, Math.floor((t - START) / PER)));
  const talking = t > START && t < endT;
  const mouth = talking ? 0.3 + 0.7 * Math.abs(Math.sin((t - START) * 23)) : 0.15;
  const bob = Math.sin(t * 2.4) * 8 + (talking ? Math.sin(t * 11) * 3 : 0);
  const blink = [1.9, 4.3, 6.8].some((bt) => t > bt && t < bt + 0.1) ? 0.1 : 1;

  // punch-ins on emphasis words
  const punches = [2.4, 4.2, 5.7];
  const punch = punches.reduce((m, p) => Math.max(m, Math.exp(-Math.pow((t - p) / 0.18, 2)) * (t > p - 0.05 ? 1 : 0)), 0);
  const zoom = 1 + 0.16 * expOut(c01(punch * 1.5));
  const follow = expInOut(seg(t, endT + 0.3, 0.5));
  const lower = expOut(seg(t, 0.3, 0.4)) * (1 - expInOut(seg(t, 2.2, 0.3)));

  // caption: the current group of 3 words
  const group = Math.max(0, Math.floor(Math.max(0, idx) / 3));
  const gWords = words.slice(group * 3, group * 3 + 3);
  const capSize = 92;

  const sticker = (at: number, emoji: string, x: number, y: number, rot: number) => {
    const s = backOut(c01((t - at) / 0.3), 2.6) * (1 - c01((t - at - 1.4) / 0.2));
    if (s <= 0.01) return null;
    return (
      <div style={{ position: "absolute", left: x - 90, top: y - 90, width: 180, height: 180, borderRadius: 40, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 110, transform: `scale(${s}) rotate(${rot}deg)`, boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}>
        {emoji}
      </div>
    );
  };

  const skin = "#e9b48f";
  const hair = "#2b211c";
  const shirt = pal.p;
  return (
    <AbsoluteFill style={{ background: mix(pal.a, pal.bg, 0.6), overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom * (1 - follow * 0.1)})`, transformOrigin: "50% 40%" }}>
        {/* room */}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${mix(pal.a, "#ffffff", 0.35)}, ${mix(pal.a, pal.p, 0.35)})` }} />
        <div style={{ position: "absolute", left: 90, top: 300, width: 260, height: 340, borderRadius: 18, background: "rgba(255,255,255,0.35)" }} />
        <div style={{ position: "absolute", right: 120, top: 260, width: 120, height: 420, borderRadius: 60, background: "rgba(0,0,0,0.08)" }} />
        {/* speaker */}
        <Svg w={W} h={H}>
          <g transform={`translate(540 ${1020 + bob})`}>
            <path d="M-330,900 C-330,560 -230,420 0,420 C230,420 330,560 330,900 Z" fill={shirt} />
            <rect x={-60} y={330} width={120} height={120} rx={40} fill={skin} />
            <ellipse cx={0} cy={180} rx={190} ry={230} fill={skin} />
            <path d="M-195,150 C-205,-40 -60,-90 30,-80 C150,-70 215,10 195,160 C170,70 120,30 40,40 C-40,50 -120,40 -195,150 Z" fill={hair} />
            <ellipse cx={-70} cy={190} rx={18} ry={22 * blink} fill="#1d1d1f" />
            <ellipse cx={70} cy={190} rx={18} ry={22 * blink} fill="#1d1d1f" />
            <path d="M-100,140 Q-70,125 -40,138 M40,138 Q70,125 100,140" stroke={hair} strokeWidth={10} strokeLinecap="round" fill="none" />
            <ellipse cx={0} cy={300} rx={52} ry={10 + 34 * mouth} fill="#7a2e2e" />
            <circle cx={-120} cy={260} r={24} fill="#ff8a7a" opacity={0.35} />
            <circle cx={120} cy={260} r={24} fill="#ff8a7a" opacity={0.35} />
          </g>
        </Svg>
      </div>

      {/* progress bar */}
      <div style={{ position: "absolute", left: 0, top: 0, height: 14, width: `${c01(t / 10) * 100}%`, background: pal.p }} />

      {/* lower third */}
      {lower > 0 && (
        <div style={{ position: "absolute", left: 60, top: 1160, padding: "22px 34px", borderRadius: 24, background: "#fff", transform: `translateX(${(1 - lower) * -600}px)` }}>
          <div style={{ fontSize: 44, fontWeight: 800, color: "#111" }}>{c.speaker || "Alex Rivera"}</div>
          <div style={{ fontSize: 30, color: "#666" }}>{c.handle || "@alexbuilds"}</div>
        </div>
      )}

      {sticker(2.4, "🔥", 860, 520, 10)}
      {sticker(4.2, "💡", 220, 620, -12)}
      {sticker(5.7, "📈", 840, 760, 8)}
      {/* stat sticker */}
      {(() => {
        const s = spring(t - 6.3, 16, 0.6) * (1 - c01((t - 7.4) / 0.2));
        if (s <= 0.01) return null;
        return (
          <div style={{ position: "absolute", left: 540 - 200, top: 560, width: 400, padding: "26px 0", borderRadius: 30, background: pal.p, color: onColor(pal.p), textAlign: "center", transform: `scale(${s}) rotate(-4deg)` }}>
            <div style={{ fontSize: 120, fontWeight: 900, lineHeight: 1 }}>1%</div>
            <div style={{ fontSize: 34, fontWeight: 700 }}>better, every day</div>
          </div>
        );
      })()}

      {/* captions */}
      {talking && (
        <div style={{ position: "absolute", left: 60, right: 60, top: 1480, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px 22px" }}>
          {gWords.map((w, i) => {
            const wi = group * 3 + i;
            const active = wi === idx;
            const seen = wi <= idx;
            return (
              <span key={wi} style={{ fontSize: capSize, fontWeight: 900, textTransform: "uppercase", lineHeight: 1.05, padding: "4px 16px", borderRadius: 18, background: active ? pal.p : "transparent", color: active ? onColor(pal.p) : "#fff", opacity: seen ? 1 : 0.55, textShadow: active ? undefined : "0 4px 0 #111, 0 0 18px rgba(0,0,0,0.5)", transform: `scale(${active ? 1.08 : 1}) rotate(${active ? -2 : 0}deg)`, display: "inline-block" }}>
                {w}
              </span>
            );
          })}
        </div>
      )}

      {/* follow card */}
      {follow > 0 && (
        <div style={{ position: "absolute", inset: 0, background: `${pal.bg}e6`, opacity: follow }}>
          <Svg w={W} h={H}>
            <Txt text="Follow for more" x={540} y={880} size={fit("Follow for more", 900, 110, 900)} weight={900} color={pal.fg} font={ff} p={c01((t - endT - 0.4) / 0.5)} tracking={-0.04} />
            <Txt text={name} x={540} y={1010} size={60} weight={700} color={pal.p} font={ff} p={c01((t - endT - 0.7) / 0.5)} mode="fade" />
          </Svg>
        </div>
      )}
      <Track src="tracks/talking-head.wav" on={audio} />
    </AbsoluteFill>
  );
}

