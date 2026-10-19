import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, hash, kf, lerp, mix, nameOf, onColor, palette, seg, spring, useT } from "../../motion";

type C = { task: string; title: string };

// A day in the life of a little AI agent: it boots at 9:00, a task card drops
// on the desk, windows fly open while it types, the tests go red, it thinks,
// the tests go green, the pull request flies to a human who approves it, and
// at sunset the agent powers down with a sleepy zzz.
export default function AgentsDay({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const task = c.task || "Fix the checkout bug";

  const hour = kf(t, [[0, 9], [7.4, 17], [8.4, 18.5]], (x) => x);
  const hh = Math.floor(hour);
  const mm = Math.floor((hour - hh) * 60);
  const dusk = expInOut(seg(t, 7.2, 1.2));
  const sky = mix("#bfe3ff", "#ff9a6b", c01(dusk * 1.6));
  const night = c01((dusk - 0.6) * 2.5);
  const eyesOpen = c01((t - 0.3) / 0.3) * (1 - c01((t - 8.2) / 0.3));
  const failed = t > 3.4 && t < 4.7;
  const passed = t > 4.8 && t < 7.4;
  const think = t > 4.0 && t < 4.75;
  const typing = t > 1.6 && t < 3.4;
  const card = spring(t - 0.8, 14, 0.7);
  const pr = expInOut(seg(t, 6.0, 0.7));
  const thumbs = spring(t - 6.8, 15, 0.6);
  const titleP = expOut(seg(t, 8.8, 0.6));

  const RX = 640;
  const RY = 560;
  const eyeCol = failed ? "#ff5a5a" : pal.p;
  const armL = typing ? Math.sin(t * 30) * 10 : 0;
  const armR = typing ? Math.cos(t * 30) * 10 : 0;

  const win = (i: number, x: number, y: number, w: number, h: number, title: string) => {
    const s = spring(t - 1.7 - i * 0.25, 15, 0.75) * (1 - expInOut(seg(t, 5.9, 0.3)));
    if (s <= 0.01) return null;
    return (
      <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 16, background: i === 0 ? "#111317" : pal.card, border: `1.5px solid ${pal.line}`, overflow: "hidden", transform: `scale(${s})`, boxShadow: "0 16px 40px rgba(0,0,0,0.25)" }}>
        <div style={{ height: 34, display: "flex", alignItems: "center", padding: "0 14px", gap: 6, fontSize: 16, color: i === 0 ? "rgba(255,255,255,0.5)" : pal.muted }}>
          <span style={{ width: 10, height: 10, borderRadius: 9, background: "#ff5f57" }} />
          <span style={{ width: 10, height: 10, borderRadius: 9, background: "#febc2e" }} />
          <span style={{ marginLeft: 10 }}>{title}</span>
        </div>
        {i === 0 ? (
          <div style={{ padding: "8px 16px", fontFamily: MONO, fontSize: 17, lineHeight: "26px", color: "rgba(255,255,255,0.75)" }}>
            {Array.from({ length: 7 }).map((_, k) => {
              const show = t > 1.9 + k * 0.18;
              const line = ["$ npm test", "checkout.spec ✓ cart", "checkout.spec ✓ address", failed || t < 4.8 ? "checkout.spec ✗ pay" : "checkout.spec ✓ pay", "", passed ? "128 passing" : "1 failing", ""][k];
              const col = line.includes("✗") || line.includes("failing") ? "#ff6b6b" : line.includes("passing") ? "#3ddc84" : undefined;
              return show ? (
                <div key={k} style={{ color: col }}>
                  {line || " "}
                </div>
              ) : null;
            })}
          </div>
        ) : (
          <div style={{ padding: 16 }}>
            <div style={{ height: 16, width: "70%", borderRadius: 8, background: pal.line }} />
            <div style={{ height: 90, marginTop: 14, borderRadius: 10, background: mix(pal.p, pal.bg, 0.7) }} />
            <div style={{ height: 34, width: 140, marginTop: 14, borderRadius: 17, background: pal.p }} />
          </div>
        )}
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: mix(pal.bg, "#000000", night * 0.5), overflow: "hidden", fontFamily: ff }}>
      {/* window */}
      <div style={{ position: "absolute", left: 1420, top: 120, width: 360, height: 300, borderRadius: 16, background: mix(sky, "#0b1030", night), border: `10px solid ${pal.card2}` }}>
        <div style={{ position: "absolute", left: 160, top: lerp(60, 230, dusk), width: 70, height: 70, borderRadius: 99, background: night > 0.5 ? "#f6f0d8" : "#fff2a8", opacity: 0.95 }} />
      </div>
      {/* clock */}
      <div style={{ position: "absolute", left: 120, top: 110, fontFamily: MONO, fontSize: 64, fontWeight: 700, color: pal.fg }}>
        {String(hh).padStart(2, "0")}:{String(mm).padStart(2, "0")}
      </div>
      {/* desk */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 820, height: 260, background: pal.card2 }} />

      {win(0, 880, 230, 460, 260, "terminal")}
      {win(1, 960, 520, 380, 250, "localhost:3000")}

      {/* task card */}
      {card > 0.01 && pr < 0.05 && (
        <div style={{ position: "absolute", left: 1000, top: lerp(-200, 690, card), width: 340, padding: "18px 22px", borderRadius: 16, background: "#fff7cc", color: "#3a3320", fontSize: 26, fontWeight: 700, transform: `rotate(${(1 - card) * 20 - 3}deg)`, boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }}>
          <div style={{ fontSize: 16, letterSpacing: "0.1em", opacity: 0.6 }}>TASK</div>
          {task}
        </div>
      )}
      {/* status banners */}
      {failed && <div style={{ position: "absolute", left: 880, top: 160, padding: "10px 22px", borderRadius: 12, background: "#ff5a5a", color: "#fff", fontSize: 26, fontWeight: 800 }}>Tests failed</div>}
      {passed && <div style={{ position: "absolute", left: 880, top: 160, padding: "10px 22px", borderRadius: 12, background: "#2fbf71", color: "#fff", fontSize: 26, fontWeight: 800, transform: `scale(${spring(t - 4.8, 18, 0.6)})` }}>All 128 tests pass</div>}

      {/* PR card flying to the human */}
      {pr > 0 && (
        <div style={{ position: "absolute", left: lerp(860, 1430, pr), top: lerp(560, 540, pr) - Math.sin(pr * Math.PI) * 160, width: 240, padding: "14px 18px", borderRadius: 14, background: pal.card, border: `2px solid ${pal.p}`, fontSize: 22, fontWeight: 700, color: pal.fg, transform: `rotate(${(1 - pr) * -10}deg)` }}>
          Pull request #42
          {thumbs > 0.5 && <div style={{ marginTop: 6, display: "inline-block", padding: "4px 10px", borderRadius: 8, background: "#8957e5", color: "#fff", fontSize: 18 }}>Merged</div>}
        </div>
      )}
      {/* human */}
      <Svg>
        <g transform={`translate(1600 ${lerp(1320, 700, expOut(seg(t, 5.9, 0.5)))})`} opacity={1 - night}>
          <circle cx={0} cy={0} r={56} fill="#e9b48f" />
          <path d="M-56,-6 C-60,-70 50,-80 58,-10 C30,-40 -20,-40 -56,-6 Z" fill="#2b211c" />
          <path d="M-110,190 C-110,90 -70,70 0,70 C70,70 110,90 110,190 Z" fill={pal.a} />
          {thumbs > 0.01 && <text x={90} y={20} fontSize={90 * thumbs}>👍</text>}
        </g>
        {/* robot */}
        <g transform={`translate(${RX} ${RY + 20}) scale(1.35)`}>
          <rect x={-120} y={60} width={240} height={200} rx={40} fill={pal.card} stroke={pal.line} strokeWidth={3} />
          <path d={`M-110,130 L${-40 + armL},230`} stroke={pal.faint} strokeWidth={22} strokeLinecap="round" />
          <path d={`M110,130 L${40 + armR},230`} stroke={pal.faint} strokeWidth={22} strokeLinecap="round" />
          <line x1={0} y1={-130} x2={0} y2={-170} stroke={pal.faint} strokeWidth={8} />
          <circle cx={0} cy={-178} r={14} fill={failed ? "#ff5a5a" : pal.p} opacity={0.6 + 0.4 * Math.sin(t * 6)} />
          <rect x={-140} y={-130} width={280} height={190} rx={46} fill={pal.card2} stroke={pal.line} strokeWidth={3} />
          <rect x={-114} y={-104} width={228} height={138} rx={30} fill="#0c0d10" />
          {failed ? (
            <g stroke={eyeCol} strokeWidth={10} strokeLinecap="round">
              <path d="M-66,-56 l28,28 M-38,-56 l-28,28 M38,-56 l28,28 M66,-56 l-28,28" />
            </g>
          ) : passed ? (
            <g stroke={eyeCol} strokeWidth={10} strokeLinecap="round" fill="none">
              <path d="M-70,-30 q18,-28 36,0 M34,-30 q18,-28 36,0" />
            </g>
          ) : (
            <g fill={eyeCol}>
              <rect x={-68} y={-62 + 22 * (1 - eyesOpen)} width={30} height={Math.max(4, 44 * eyesOpen)} rx={10} />
              <rect x={38} y={-62 + 22 * (1 - eyesOpen)} width={30} height={Math.max(4, 44 * eyesOpen)} rx={10} />
            </g>
          )}
          {failed && <path d="M118,-120 q14,22 0,30 q-14,-8 0,-30" fill="#7ec8ff" />}
          {/* keyboard */}
          <rect x={-150} y={236} width={300} height={34} rx={8} fill={pal.faint} />
        </g>
        {think && (
          <g transform={`translate(${RX + 170} ${RY - 230}) scale(${spring(t - 4.0, 18, 0.6)})`}>
            <circle cx={-60} cy={70} r={12} fill={pal.card} />
            <circle cx={-30} cy={40} r={18} fill={pal.card} />
            <ellipse cx={40} cy={-10} rx={80} ry={60} fill={pal.card} />
            <text x={40} y={14} textAnchor="middle" fontSize={64}>
              💡
            </text>
          </g>
        )}
        {passed &&
          Array.from({ length: 24 }).map((_, i) => {
            const k = c01((t - 4.8) / 1.2);
            const a = hash(i, 1) * Math.PI * 2;
            const r = 80 + k * 260 * (0.5 + hash(i, 2));
            return <rect key={i} x={RX + Math.cos(a) * r} y={RY - 200 + Math.sin(a) * r + k * k * 200} width={14} height={8} fill={[pal.p, pal.a, "#ffcc4d"][i % 3]} opacity={1 - k} transform={`rotate(${i * 40 + t * 300} ${RX + Math.cos(a) * r} ${RY - 200 + Math.sin(a) * r})`} />;
          })}
        {night > 0.3 &&
          ["z", "z", "z"].map((z, i) => {
            const k = c01((t - 8.0 - i * 0.25) / 1.0);
            return (
              <text key={i} x={RX + 140 + k * 60 + i * 20} y={RY - 160 - k * 120 - i * 30} fontFamily={ff} fontSize={50 + i * 14} fontWeight={800} fill={pal.fg} opacity={k * (1 - k) * 4}>
                {z}
              </text>
            );
          })}
      </Svg>
      {titleP > 0 && (
        <div style={{ position: "absolute", inset: 0, background: mix(pal.bg, "#000000", 0.4), opacity: titleP * 0.85 }}>
          <Svg>
            <Txt text={c.title || "A day in the life of an agent"} x={960} y={520} size={fit(c.title || "A day in the life of an agent", 1600, 110, 900)} weight={900} color="#fff" font={ff} p={titleP} tracking={-0.03} />
            <Txt text={name} x={960} y={620} size={48} weight={700} color={pal.p} font={ff} p={c01((t - 9.2) / 0.5)} mode="fade" />
          </Svg>
        </div>
      )}
      <Track src="tracks/agents-day.wav" on={audio} />
    </AbsoluteFill>
  );
}

