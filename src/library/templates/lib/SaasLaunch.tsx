import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Box, Icon, Mark, Svg, Track, Txt, c01, countStat, cubicInOut, expInOut, expOut, fit, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { hook: string; problem: string; features: string; stat: string; cta: string };

// The classic SaaS launch arc in 15 seconds: a one-word hook, the problem as
// a pile of chaotic tabs, the product snapping that chaos into one clean
// dashboard, three features in quick cards, a proof stat, and the CTA.
export default function SaasLaunch({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const hook = c.hook || "Busy?";
  const problem = c.problem || "Twelve tools. Zero clarity.";
  const feats = [...list(c.features || "One inbox, Live dashboards, Automations"), "Feature", "Feature", "Feature"].slice(0, 3);
  const stat = c.stat || "10x";
  const B1 = 1.6; // problem
  const B2 = 4.4; // product snap
  const B3 = 7.6; // features
  const B4 = 11.0; // proof
  const B5 = 13.0; // cta

  const hookS = fit(hook, 1500, 320, 900, -0.05, ff);
  const snap = expInOut(seg(t, B2, 0.9));
  const fly = (i: number) => {
    const tx = 960 + (hash(i, 1) - 0.5) * 1500;
    const ty = 540 + (hash(i, 2) - 0.5) * 760;
    return { tx, ty, r: (hash(i, 3) - 0.5) * 40 };
  };

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      {t < B1 && (
        <Svg>
          <Txt text={hook} x={960} y={540 + hookS * 0.36} size={hookS} weight={900} color={pal.fg} font={ff} p={c01(t / 0.35)} out={c01((t - B1 + 0.25) / 0.25)} mode="scale" tracking={-0.05} />
        </Svg>
      )}
      {t >= B1 && t < B3 && (
        <>
          {Array.from({ length: 12 }, (_, i) => {
            const f = fly(i);
            const pop = spring(t - B1 - i * 0.08, 16, 0.6);
            const x = lerp(f.tx, 960, snap);
            const y = lerp(f.ty, 560, snap);
            const s = lerp(1, 0.2, snap);
            return (
              <Box key={i} x={x} y={y} w={360} h={230} r={18} bg={pal.card2} style={{ transform: `rotate(${lerp(f.r, 0, snap)}deg) scale(${pop * s})`, opacity: 1 - snap, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
                <div style={{ height: 34, background: pal.card, borderRadius: "18px 18px 0 0", display: "flex", gap: 8, alignItems: "center", padding: "0 14px" }}>
                  {[0, 1, 2].map((j) => (
                    <div key={j} style={{ width: 10, height: 10, borderRadius: 5, background: pal.faint }} />
                  ))}
                </div>
                <div style={{ margin: 18, height: 14, width: "70%", borderRadius: 7, background: pal.faint }} />
                <div style={{ margin: "0 18px", height: 14, width: "45%", borderRadius: 7, background: pal.faint }} />
                <div style={{ position: "absolute", right: 16, top: 50, width: 34, height: 34, borderRadius: 17, background: "#e5484d", color: "#fff", fontSize: 18, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{1 + Math.floor(hash(i, 5) * 9)}</div>
              </Box>
            );
          })}
          <Svg>
            <Txt text={problem} x={960} y={140} size={fit(problem, 1500, 84, 800, -0.03, ff)} weight={800} color={pal.fg} font={ff} p={c01((t - B1 - 0.3) / 0.6)} out={c01((t - B2) / 0.3)} />
          </Svg>
          {snap > 0 && (
            <Box x={960} y={560} w={lerp(200, 1500, snap)} h={lerp(120, 820, snap)} r={28} bg={pal.card} style={{ overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.4)", opacity: c01(snap * 3) }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 260, background: pal.card2, padding: 30, boxSizing: "border-box" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: pal.v }} />
                  <div style={{ fontSize: 26, fontWeight: 800, color: pal.fg }}>{nameOf(b)}</div>
                </div>
                {[0, 1, 2, 3, 4].map((j) => (
                  <div key={j} style={{ marginTop: j ? 18 : 40, height: 16, width: `${70 - j * 6}%`, borderRadius: 8, background: j === 0 ? pal.v : pal.faint }} />
                ))}
              </div>
              <div style={{ position: "absolute", left: 300, top: 40, right: 40, display: "flex", gap: 24 }}>
                {["Revenue", "Users", "Tasks"].map((k, j) => (
                  <div key={k} style={{ flex: 1, height: 150, borderRadius: 20, background: pal.card2, padding: 24, boxSizing: "border-box" }}>
                    <div style={{ fontSize: 22, color: pal.muted }}>{k}</div>
                    <div style={{ fontSize: 46, fontWeight: 800, color: pal.fg, marginTop: 8 }}>{countStat(["$48k", "2,140", "312"][j], cubicInOut(seg(t, B2 + 0.6, 1.4)))}</div>
                  </div>
                ))}
              </div>
              <svg style={{ position: "absolute", left: 300, top: 230, width: 1160, height: 520 }} viewBox="0 0 1160 520">
                <polyline points={Array.from({ length: 30 }, (_, i) => `${i * 40},${460 - Math.pow(i / 29, 1.6) * 360 * cubicInOut(seg(t, B2 + 0.6, 1.6)) - Math.sin(i * 0.9) * 20}`).join(" ")} fill="none" stroke={pal.v} strokeWidth={8} strokeLinejoin="round" />
              </svg>
            </Box>
          )}
        </>
      )}
      {t >= B3 && t < B4 && (
        <>
          {feats.map((f, i) => {
            const p = spring(t - B3 - i * 0.35, 15, 0.65);
            const out = expIn01(t, B4 - 0.35, 0.35);
            return (
              <Box key={i} x={420 + i * 540} y={560} w={480} h={560} r={36} bg={i === 1 ? pal.v : pal.card2} style={{ transform: `translateY(${(1 - p) * 700 - out * 900}px) rotate(${(i - 1) * 3 * p}deg)`, padding: 44, boxSizing: "border-box" }}>
                <Svg w={480} h={560} style={{ width: 480, height: 560 }}>
                  <Icon name={["mail", "chart", "bolt"][i]} x={84} y={110} size={100} color={i === 1 ? pal.onV : pal.v} width={2.4} p={c01((t - B3 - i * 0.35 - 0.2) * 2)} />
                </Svg>
                <div style={{ position: "absolute", left: 44, bottom: 54, fontSize: fit(f, 400, 58, 800, -0.03, ff), fontWeight: 800, color: i === 1 ? pal.onV : pal.fg, letterSpacing: "-0.03em" }}>{f}</div>
              </Box>
            );
          })}
        </>
      )}
      {t >= B4 && t < B5 && (
        <Svg>
          <Txt text={countStat(stat, cubicInOut(seg(t, B4, 1.0)))} x={960} y={600} size={360} weight={900} color={pal.v} font={ff} p={c01((t - B4) / 0.3)} mode="scale" tracking={-0.05} />
          <Txt text="faster from question to answer" x={960} y={760} size={54} weight={600} color={pal.muted} font={ff} p={c01((t - B4 - 0.4) / 0.6)} mode="fade" />
        </Svg>
      )}
      {t >= B5 && (
        <>
          <Mark x={960} y={400} size={170} b={b} pal={pal} s={spring(t - B5, 16, 0.55)} />
          <Svg>
            <Txt text={nameOf(b)} x={960} y={620} size={140} weight={800} color={pal.fg} font={ff} p={c01((t - B5 - 0.1) / 0.6)} tracking={-0.04} />
            <g transform={`translate(960 740) scale(${spring(t - B5 - 0.5, 16, 0.6)})`}>
              <rect x={-220} y={-46} width={440} height={92} rx={46} fill={pal.v} />
              <text y={14} textAnchor="middle" fontFamily={ff} fontSize={38} fontWeight={700} fill={pal.onV}>
                {c.cta || "Start free"}
              </text>
            </g>
          </Svg>
        </>
      )}
      <Track src="tracks/saas-launch.wav" on={audio} />
    </AbsoluteFill>
  );
}

function expIn01(t: number, a: number, d: number) {
  const x = c01((t - a) / d);
  return x <= 0 ? 0 : Math.pow(2, 10 * (x - 1));
}

export const _e = expOut;
