import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, fontOf, hash, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { lines: string; result: string; tagline: string };

// A voice-agent launch: a phone rings, a glowing orb answers and pulses with
// speech, the call transcript builds turn by turn with live waveform bars,
// tool calls flash (calendar, CRM), and a booking card confirms.
export default function VoiceAgent({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const lines = [...(c.lines || "Hi! I'd like to book a cleaning next week. | Sure. Tuesday at 10 or Thursday at 3? | Thursday works. | Done. You're booked for Thursday at 3.").split("|").map((x) => x.trim()), "", "", "", ""].slice(0, 4);
  const result = c.result || "Thursday · 3:00 PM";
  const ring = t < 1.2;
  const turnAt = [1.4, 2.9, 4.4, 5.3];
  const speaking = (() => {
    for (let i = 3; i >= 0; i--) if (t > turnAt[i]) return t < turnAt[i] + 1.2 ? i : -1;
    return -1;
  })();
  const agentTalk = speaking === 1 || speaking === 3;
  const amp = speaking >= 0 ? 0.5 + 0.5 * Math.abs(Math.sin(t * 13) * Math.sin(t * 7.3)) : 0.08;
  const tools = [
    { at: 2.5, label: "calendar.check()" },
    { at: 5.0, label: "booking.create()" },
  ];
  const confirm = spring(t - 6.6, 14, 0.6);
  const outro = expInOut(seg(t, 8.8, 0.5));
  const endP = c01((t - 9.2) / 0.8);

  return (
    <AbsoluteFill style={{ background: "#08080b", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* orb */}
        <div style={{ position: "absolute", left: 300, top: 300, width: 480, height: 480, transform: `translate(${ring ? Math.sin(t * 60) * 6 : 0}px,0) scale(${spring(t - 0.1, 12, 0.6) * (1 + (agentTalk ? amp * 0.08 : 0))})` }}>
          <div style={{ position: "absolute", inset: -80, borderRadius: "50%", background: `radial-gradient(circle, ${pal.v}66, transparent 65%)`, opacity: 0.4 + (agentTalk ? amp * 0.6 : 0) }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `conic-gradient(from ${t * 90}deg, ${pal.v}, ${pal.a}, #38a3ff, ${pal.v})`, filter: "blur(2px)" }} />
          <div style={{ position: "absolute", inset: 30, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #ffffffaa, transparent 40%), radial-gradient(circle, transparent 55%, #08080b 100%)` }} />
        </div>
        {ring && (
          <div style={{ position: "absolute", left: 300, top: 820, width: 480, textAlign: "center", fontSize: 40, fontWeight: 700, color: "#fff", opacity: Math.floor(t * 4) % 2 ? 1 : 0.4 }}>Incoming call…</div>
        )}
        {!ring && (
          <div style={{ position: "absolute", left: 300, top: 830, width: 480, display: "flex", justifyContent: "center", gap: 8, alignItems: "center", height: 80 }}>
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} style={{ width: 10, borderRadius: 5, background: agentTalk ? pal.v : "#fff", height: 8 + amp * 70 * (0.3 + 0.7 * Math.abs(Math.sin(t * 9 + i * 0.7 + hash(i, 1) * 3))) }} />
            ))}
          </div>
        )}
        {/* transcript */}
        <div style={{ position: "absolute", left: 960, top: 160, width: 820 }}>
          {lines.map((l, i) => {
            if (t < turnAt[i] || !l) return null;
            const isAgent = i % 2 === 1;
            const n = Math.floor(c01((t - turnAt[i]) / 1.0) * l.length);
            return (
              <div key={i} style={{ display: "flex", justifyContent: isAgent ? "flex-start" : "flex-end", marginBottom: 22 }}>
                <div style={{ maxWidth: 640, padding: "22px 30px", borderRadius: 30, background: isAgent ? pal.v : "#1c1c22", color: isAgent ? pal.onV : "#fff", fontSize: 34, lineHeight: 1.3, transform: `translateY(${(1 - spring(t - turnAt[i], 18, 0.7)) * 40}px)` }}>
                  <div style={{ fontSize: 22, opacity: 0.7, marginBottom: 6 }}>{isAgent ? "Agent" : "Caller"}</div>
                  {l.slice(0, n)}
                </div>
              </div>
            );
          })}
          {tools.map((tl, i) =>
            t > tl.at ? (
              <div key={i} style={{ display: "inline-block", marginRight: 16, marginBottom: 16, padding: "10px 20px", borderRadius: 12, border: `2px solid ${pal.a}`, color: pal.a, fontFamily: "monospace", fontSize: 24, opacity: c01((t - tl.at) * 4) }}>
                ⚡ {tl.label} {t > tl.at + 0.5 ? "✓" : "…"}
              </div>
            ) : null,
          )}
          {confirm > 0.01 && (
            <div style={{ marginTop: 20, padding: 34, borderRadius: 28, background: "#fff", color: "#111", transform: `scale(${confirm})`, transformOrigin: "0 0", display: "flex", alignItems: "center", gap: 26 }}>
              <div style={{ width: 70, height: 70, borderRadius: 35, background: "#2fbf71", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 900 }}>✓</div>
              <div>
                <div style={{ fontSize: 24, color: "#666" }}>Booked by voice</div>
                <div style={{ fontSize: 44, fontWeight: 800 }}>{result}</div>
              </div>
            </div>
          )}
        </div>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="Every call, answered." x={960} y={520} size={120} weight={800} color="#fff" font={ff} p={endP} tracking={-0.04} />
          <Txt text={`${nameOf(b)} · ${c.tagline || "voice agents for your business"}`} x={960} y={640} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 9.6) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/voice-agent.wav" on={audio} />
    </AbsoluteFill>
  );
}
