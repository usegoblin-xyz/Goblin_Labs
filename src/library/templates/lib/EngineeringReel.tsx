import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fit, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { stages: string; before: string; after: string; tagline: string };

// An engineering reel cut to the beat: a code diff scrolls with red and
// green lines, a CI pipeline lights stage by stage, a deploy rolls out across
// a server grid, and the latency chart drops off a cliff.
export default function EngineeringReel({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const stages = [...list(c.stages || "Build, Test, Lint, Deploy"), "Step", "Step", "Step", "Step"].slice(0, 4);
  const before = Number(String(c.before || "420").replace(/\D/g, "")) || 420;
  const after = Number(String(c.after || "38").replace(/\D/g, "")) || 38;
  const s1 = t < 2.6;
  const s2 = t >= 2.6 && t < 5.2;
  const s3 = t >= 5.2 && t < 7.4;
  const s4 = t >= 7.4 && t < 10.0;
  const endP = c01((t - 10.2) / 0.8);
  const green = "#2fbf71";
  const red = "#e5484d";

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      {s1 && (
        <div style={{ position: "absolute", left: 160, top: 120, width: 1600, height: 840, borderRadius: 26, background: pal.card, overflow: "hidden", fontFamily: MONO, fontSize: 30 }}>
          {Array.from({ length: 30 }, (_, i) => {
            const y = i * 52 - t * 160 + 40;
            const kind = hash(i, 1) < 0.18 ? "del" : hash(i, 1) < 0.4 ? "add" : "ctx";
            return (
              <div key={i} style={{ position: "absolute", left: 0, right: 0, top: y, height: 52, display: "flex", alignItems: "center", gap: 24, padding: "0 30px", background: kind === "add" ? `${green}22` : kind === "del" ? `${red}22` : "transparent", color: kind === "add" ? green : kind === "del" ? red : pal.muted }}>
                <span style={{ width: 50, opacity: 0.6 }}>{120 + i}</span>
                <span>{kind === "add" ? "+" : kind === "del" ? "−" : " "}</span>
                <span style={{ whiteSpace: "pre", color: kind === "ctx" ? pal.fg : undefined }}>{["const cache = new Map()", "  if (cache.has(key)) return cache.get(key)", "await db.query(sql)", "export function handler(req) {", "  return json(result)", "}", "for (const row of rows) {", "  batch.push(row)"][i % 8]}</span>
              </div>
            );
          })}
          <div style={{ position: "absolute", right: 30, top: 24, padding: "10px 20px", borderRadius: 99, background: pal.card2, color: pal.fg, fontFamily: ff, fontSize: 26, fontWeight: 700 }}>
            <span style={{ color: green }}>+{Math.round(t * 48)}</span> <span style={{ color: red }}>−{Math.round(t * 19)}</span>
          </div>
        </div>
      )}
      {s2 && (
        <Svg>
          {stages.map((s, i) => {
            const x = 300 + i * 440;
            const at = 2.8 + i * 0.55;
            const run = c01((t - at) / 0.45);
            const ok = t > at + 0.45;
            return (
              <g key={i}>
                {i < 3 && <line x1={x + 70} x2={x + 370} y1={540} y2={540} stroke={ok ? green : pal.line} strokeWidth={8} />}
                <circle cx={x} cy={540} r={70} fill={ok ? green : pal.card2} />
                {!ok && run > 0 && <circle cx={x} cy={540} r={70} fill="none" stroke={green} strokeWidth={8} pathLength={1} strokeDasharray={`${run} 2`} transform={`rotate(-90 ${x} 540)`} />}
                {ok && <path d={`M${x - 26},${540} l18,18 l34,-36`} fill="none" stroke="#fff" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />}
                <text x={x} y={680} textAnchor="middle" fontFamily={ff} fontSize={40} fontWeight={700} fill={pal.fg}>
                  {s}
                </text>
                <text x={x} y={730} textAnchor="middle" fontFamily={MONO} fontSize={24} fill={pal.muted}>
                  {ok ? `${(hash(i, 2) * 40 + 4).toFixed(0)}s` : run > 0 ? "running" : "queued"}
                </text>
              </g>
            );
          })}
          <Txt text="All checks passed" x={960} y={300} size={72} weight={800} color={green} font={ff} p={c01((t - 5.0) * 5)} mode="scale" />
        </Svg>
      )}
      {s3 && (
        <Svg>
          {Array.from({ length: 48 }, (_, i) => {
            const col = i % 12;
            const row = Math.floor(i / 12);
            const at = 5.3 + (col + row) * 0.07;
            const on = t > at;
            return <rect key={i} x={250 + col * 120} y={300 + row * 130} width={96} height={100} rx={14} fill={on ? pal.v : pal.card2} transform={`translate(0 ${on ? -6 * Math.exp(-(t - at) * 8) : 0})`} />;
          })}
          <Txt text={`Rolling out · ${Math.min(100, Math.round(c01((t - 5.3) / 1.4) * 100))}%`} x={960} y={900} size={56} weight={700} color={pal.fg} font={ff} p={1} />
        </Svg>
      )}
      {s4 &&
        (() => {
          const drop = cubicInOut(seg(t, 8.0, 0.8));
          const pts = Array.from({ length: 60 }, (_, i) => {
            const f = i / 59;
            const v = f < 0.5 ? before + Math.sin(i * 1.7) * 30 : lerp(before, after, drop * c01((f - 0.5) * 6)) + Math.sin(i * 1.7) * 6;
            return `${200 + f * 1520},${860 - (v / before) * 520}`;
          });
          const shown = Math.floor(c01((t - 7.5) / 1.6) * 60);
          return (
            <>
              <Svg>
                <line x1={200} x2={1720} y1={860} y2={860} stroke={pal.line} strokeWidth={3} />
                <polyline points={pts.slice(0, shown + 1).join(" ")} fill="none" stroke={pal.v} strokeWidth={8} strokeLinejoin="round" />
              </Svg>
              <div style={{ position: "absolute", left: 200, top: 120, fontSize: 150, fontWeight: 900, color: pal.fg, letterSpacing: "-0.05em", fontVariantNumeric: "tabular-nums" }}>
                {Math.round(lerp(before, after, drop))}
                <span style={{ fontSize: 60, color: pal.muted }}> ms p95</span>
              </div>
            </>
          );
        })()}
      {endP > 0 && (
        <Svg>
          <Txt text="Shipped." x={960} y={500} size={190} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.05} mode="scale" />
          <Txt text={`${nameOf(b)} · ${c.tagline || "engineering"}`} x={960} y={640} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 10.6) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/engineering-reel.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = [expInOut, expOut, fit, spring];
