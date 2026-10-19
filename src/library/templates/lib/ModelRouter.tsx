import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { call: string; models: string; tagline: string };

// One API, many models: a single line of code fires a request into a router;
// the router fans out to a column of model providers, one goes red and the
// request reroutes to a fallback, while cost and latency counters tick.
export default function ModelRouter({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const call = c.call || 'completion(model="best", messages=msgs)';
  const models = [...list(c.models || "Model A, Model B, Model C, Model D, Model E"), "Model", "Model", "Model", "Model", "Model"].slice(0, 5);
  const typed = call.slice(0, Math.floor(c01((t - 0.3) / 1.0) * call.length));
  const RX = 900;
  const RY = 540;
  const my = (i: number) => 220 + i * 160;
  const fan = expOut(seg(t, 1.8, 0.8));
  const req1 = c01((t - 2.8) / 0.6); // to model B (index 1)
  const fail = t > 3.5;
  const req2 = c01((t - 3.9) / 0.6); // reroute to model D (index 3)
  const ok = t > 4.6;
  const outro = expInOut(seg(t, 7.6, 0.5));
  const endP = c01((t - 8.0) / 0.8);
  const red = "#e5484d";
  const curve = (i: number) => `M${RX + 90},${RY} C${RX + 300},${RY} ${1300},${my(i)} ${1460},${my(i)}`;
  const at = (i: number, u: number) => {
    const p0 = { x: RX + 90, y: RY };
    const p1 = { x: RX + 300, y: RY };
    const p2 = { x: 1300, y: my(i) };
    const p3 = { x: 1460, y: my(i) };
    const m = 1 - u;
    return { x: m * m * m * p0.x + 3 * m * m * u * p1.x + 3 * m * u * u * p2.x + u * u * u * p3.x, y: m * m * m * p0.y + 3 * m * m * u * p1.y + 3 * m * u * u * p2.y + u * u * u * p3.y };
  };

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* code */}
        <div style={{ position: "absolute", left: 80, top: 440, width: 640, padding: "34px 34px", borderRadius: 24, background: pal.dark ? "#0f1013" : "#17181c", fontFamily: MONO, fontSize: 26, color: "#e6e6e8", lineHeight: 1.5, wordBreak: "break-all" }}>
          <span style={{ color: "#8fb4ff" }}>{typed}</span>
          {t < 1.4 && <span>▍</span>}
          {ok && <div style={{ marginTop: 16, color: "#2fbf71", opacity: c01((t - 4.7) * 3) }}>→ 200 OK · fallback used</div>}
        </div>
        <Svg>
          <line x1={720} y1={RY} x2={RX - 90} y2={RY} stroke={t > 1.4 ? pal.v : pal.line} strokeWidth={6} />
          {t > 1.4 && t < 1.9 && <circle cx={lerp(720, RX - 90, c01((t - 1.4) / 0.4))} cy={RY} r={12} fill={pal.v} />}
          <g transform={`translate(${RX} ${RY}) scale(${spring(t - 1.2, 16, 0.6)})`}>
            <rect x={-90} y={-90} width={180} height={180} rx={40} fill={pal.v} />
            <text y={14} textAnchor="middle" fontFamily={ff} fontSize={34} fontWeight={800} fill={pal.onV}>
              router
            </text>
          </g>
          {models.map((m, i) => {
            const isFail = i === 1 && fail;
            const isOk = i === 3 && ok;
            return (
              <g key={i}>
                <path d={curve(i)} fill="none" stroke={isFail ? red : isOk ? pal.v : pal.line} strokeWidth={isOk || isFail ? 6 : 3} pathLength={1} strokeDasharray={`${fan} 2`} />
                <g transform={`translate(1600 ${my(i)}) scale(${spring(t - 1.8 - i * 0.08, 16, 0.6)})`}>
                  <rect x={-140} y={-55} width={280} height={110} rx={26} fill={isFail ? `${red}30` : isOk ? pal.v : pal.card2} stroke={isFail ? red : "none"} strokeWidth={4} />
                  <text y={12} textAnchor="middle" fontFamily={ff} fontSize={34} fontWeight={700} fill={isOk ? pal.onV : pal.fg}>
                    {m}
                  </text>
                  {isFail && (
                    <text x={110} y={-30} fontFamily={ff} fontSize={40} fontWeight={900} fill={red}>
                      ✕
                    </text>
                  )}
                </g>
              </g>
            );
          })}
          {req1 > 0 && req1 < 1 && <circle cx={at(1, cubicInOut(req1)).x} cy={at(1, cubicInOut(req1)).y} r={14} fill={pal.fg} />}
          {req2 > 0 && req2 < 1 && <circle cx={at(3, cubicInOut(req2)).x} cy={at(3, cubicInOut(req2)).y} r={14} fill={pal.v} />}
          {fail && t < 4.4 && <Txt text="rate limited · retrying" x={1600} y={my(1) + 100} size={26} weight={600} color={red} font={ff} p={1} />}
        </Svg>
        <div style={{ position: "absolute", left: 80, top: 760, display: "flex", gap: 40, opacity: c01((t - 4.8) * 3) }}>
          {[["latency", `${Math.round(lerp(0, 412, c01((t - 4.8) / 0.8)))} ms`], ["cost", `$${lerp(0, 0.0031, c01((t - 4.8) / 0.8)).toFixed(4)}`]].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 24, color: pal.muted }}>{k}</div>
              <div style={{ fontSize: 50, fontWeight: 800, color: pal.fg, fontVariantNumeric: "tabular-nums" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="One API. Every model." x={960} y={500} size={120} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={`${nameOf(b)} · ${c.tagline || "with fallbacks built in"}`} x={960} y={620} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 8.4) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/model-router.wav" on={audio} />
    </AbsoluteFill>
  );
}
