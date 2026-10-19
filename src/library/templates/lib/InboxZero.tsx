import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { senders: string; tagline: string };

// Inbox zero, fast: a stack of emails, each one gets an AI summary chip and
// is swiped away (archive, snooze, reply) in rhythm, the unread counter
// drops, and the last swipe reveals an empty inbox with a calm sun.
const ACTIONS = ["Archive", "Snooze", "Replied", "Archive", "Done", "Archive", "Snooze"];

export default function InboxZero({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const senders = [...list(c.senders || "Ava, Billing, Design team, Marco, Calendar, Newsletter, Sam"), "Team"].slice(0, 7);
  const N = 7;
  const per = 0.75;
  const start = 1.2;
  const swipe = (i: number) => c01((t - start - i * per) / 0.4);
  const gone = senders.filter((_, i) => swipe(i) >= 1).length;
  const count = Math.max(0, N - gone);
  const zero = t > start + N * per + 0.1;
  const outro = expInOut(seg(t, 8.2, 0.5));
  const endP = c01((t - 8.6) / 0.8);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <div style={{ position: "absolute", left: 160, top: 200, fontSize: 64, fontWeight: 800, color: pal.fg, letterSpacing: "-0.03em" }}>Inbox</div>
        <div style={{ position: "absolute", left: 160, top: 290, fontSize: 200, fontWeight: 900, color: zero ? pal.v : pal.fg, letterSpacing: "-0.05em", lineHeight: 1, transform: `scale(${1 + 0.1 * Math.exp(-((t - start) % per) * 8) * (t > start && !zero ? 1 : 0)})`, transformOrigin: "0 50%" }}>{count}</div>
        <div style={{ position: "absolute", left: 160, top: 500, fontSize: 36, color: pal.muted }}>{zero ? "All clear" : "unread"}</div>
        {senders.map((s, i) => {
          const sw = swipe(i);
          const slot = i - senders.slice(0, i).reduce((acc, _, j) => acc + cubicInOut(c01((t - start - j * per - 0.35) / 0.3)), 0);
          const y = 160 + slot * 116;
          const dir = i % 3 === 1 ? -1 : 1;
          const appear = spring(t - 0.2 - i * 0.06, 18, 0.7);
          const chip = c01((t - start - i * per + 0.35) * 5);
          if (sw >= 1) return null;
          return (
            <div key={i} style={{ position: "absolute", left: 820 + dir * expOut(sw) * 1300, top: y, width: 940, height: 100, borderRadius: 22, background: pal.card2, display: "flex", alignItems: "center", gap: 20, padding: "0 26px", boxSizing: "border-box", transform: `rotate(${dir * sw * 6}deg) scale(${appear})`, opacity: 1 - sw * 0.6 }}>
              <div style={{ width: 54, height: 54, borderRadius: 27, background: [pal.v, pal.a, pal.fg][i % 3], flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: pal.fg }}>{s}</div>
                <div style={{ marginTop: 6, height: 12, width: `${50 + hash(i, 1) * 40}%`, borderRadius: 6, background: pal.faint }} />
              </div>
              {chip > 0 && (
                <div style={{ padding: "10px 20px", borderRadius: 99, background: pal.v, color: pal.onV, fontSize: 22, fontWeight: 700, opacity: chip, transform: `scale(${lerp(0.6, 1, chip)})`, whiteSpace: "nowrap" }}>{ACTIONS[i]}</div>
              )}
            </div>
          );
        })}
        {zero && (
          <Svg>
            <g transform={`translate(1290 560) scale(${spring(t - (start + N * per + 0.1), 14, 0.6)})`}>
              <circle r={120} fill={pal.v} />
              {Array.from({ length: 12 }, (_, i) => {
                const a = (i / 12) * Math.PI * 2 + t * 0.4;
                return <line key={i} x1={Math.cos(a) * 160} y1={Math.sin(a) * 160} x2={Math.cos(a) * 200} y2={Math.sin(a) * 200} stroke={pal.v} strokeWidth={10} strokeLinecap="round" />;
              })}
            </g>
            <Txt text="Inbox zero." x={1290} y={880} size={84} weight={800} color={pal.fg} font={ff} p={c01((t - start - N * per - 0.3) / 0.6)} tracking={-0.04} />
          </Svg>
        )}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Email, handled."} x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - 9.0) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/inbox-zero.wav" on={audio} />
    </AbsoluteFill>
  );
}
