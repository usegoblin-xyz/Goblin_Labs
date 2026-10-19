import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { problem: string; what: string; steps: string; proof: string; cta: string };

// A four-part service explainer: the problem lands as a heavy crate that
// cracks the floor; "what I do" lifts it off with a crane line; three steps
// light up along a path; a proof quote card and a result stat slide in;
// then the call to action.
export default function ServiceExplainer({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const problem = c.problem || "Your website gets visits but no calls.";
  const what = c.what || "I turn it into your best salesperson.";
  const steps = [...list(c.steps || "Audit, Rewrite, Launch"), "Step", "Step", "Step"].slice(0, 3);
  const proof = c.proof || "Leads doubled in six weeks.";
  const cta = c.cta || "Book a free call";
  const P1 = t < 2.4;
  const P2 = t >= 2.4 && t < 4.4;
  const P3 = t >= 4.4 && t < 6.8;
  const drop = spring(t - 0.3, 12, 0.45);
  const crack = c01((t - 0.55) / 0.2);
  const lift = cubicInOut(c01((t - 2.9) / 0.9));
  const line = c01((t - 2.4) / 0.4);
  const stepP = (i: number) => c01((t - 4.7 - i * 0.6) / 0.4);
  const proofIn = spring(t - 6.9, 14, 0.65);
  const outro = expInOut(seg(t, 9.0, 0.5));
  const endP = c01((t - 9.4) / 0.8);
  const label = (n: number, s: string) => (
    <div style={{ position: "absolute", left: 120, top: 90, fontSize: 30, fontWeight: 800, letterSpacing: "0.16em", color: pal.v }}>
      {String(n).padStart(2, "0")} · {s}
    </div>
  );

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {(P1 || P2) && (
          <>
            {label(P1 ? 1 : 2, P1 ? "THE PROBLEM" : "WHAT I DO")}
            <Svg>
              <line x1={0} x2={1920} y1={820} y2={820} stroke={pal.fg} strokeWidth={6} />
              {crack > 0 && <path d="M960,820 L930,860 L975,890 L940,940 M960,820 L1010,850 L990,900" stroke={pal.fg} strokeWidth={5} fill="none" opacity={1 - lift} pathLength={1} strokeDasharray={`${crack} 2`} />}
              {P2 && <line x1={960} y1={0} x2={960} y2={line * (540 - lift * 400)} stroke={pal.v} strokeWidth={6} />}
              {P2 && <path d={`M935,${line * (540 - lift * 400)} q25,40 50,0`} stroke={pal.v} strokeWidth={8} fill="none" />}
              <g transform={`translate(960 ${-400 + drop * 1000 - lift * 400}) rotate(${(1 - drop) * 8})`}>
                <rect x={-220} y={-280} width={440} height={280} rx={10} fill={pal.card2} stroke={pal.fg} strokeWidth={6} />
                <path d="M-220,-280 L220,0 M220,-280 L-220,0" stroke={pal.fg} strokeWidth={4} opacity={0.3} />
                <text y={-125} textAnchor="middle" fontFamily={ff} fontSize={56} fontWeight={900} fill={pal.fg}>
                  PROBLEM
                </text>
              </g>
            </Svg>
            <div style={{ position: "absolute", left: 120, right: 120, top: 880, textAlign: "center", fontSize: 58, fontWeight: 800, letterSpacing: "-0.02em", color: pal.fg }}>
              {P1 ? problem : what}
            </div>
          </>
        )}
        {P3 && (
          <>
            {label(3, "HOW IT WORKS")}
            <Svg>
              <path d="M320,560 C620,360 1000,760 1600,560" fill="none" stroke={pal.line} strokeWidth={8} strokeDasharray="6 18" strokeLinecap="round" />
              <path d="M320,560 C620,360 1000,760 1600,560" fill="none" stroke={pal.v} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={`${c01((t - 4.6) / 1.6)} 2`} />
              {steps.map((s, i) => {
                const pos = [
                  [320, 560],
                  [960, 560],
                  [1600, 560],
                ][i];
                const p = stepP(i);
                return (
                  <g key={i} transform={`translate(${pos[0]} ${pos[1]})`}>
                    <circle r={80 * (0.6 + 0.4 * spring(t - 4.7 - i * 0.6, 16, 0.5))} fill={p > 0.5 ? pal.v : pal.card} stroke={pal.v} strokeWidth={6} />
                    <text y={18} textAnchor="middle" fontFamily={ff} fontSize={54} fontWeight={900} fill={p > 0.5 ? pal.onV : pal.muted}>
                      {i + 1}
                    </text>
                    <text y={160} textAnchor="middle" fontFamily={ff} fontSize={50} fontWeight={800} fill={pal.fg} opacity={p}>
                      {s}
                    </text>
                  </g>
                );
              })}
            </Svg>
          </>
        )}
        {t >= 6.8 && (
          <>
            {label(4, "PROOF")}
            <div style={{ position: "absolute", left: 220, top: 260, width: 1480, padding: 70, borderRadius: 40, background: pal.card, boxSizing: "border-box", transform: `translateY(${(1 - proofIn) * 600}px)` }}>
              <div style={{ fontSize: 140, lineHeight: 0.6, color: pal.v, fontWeight: 900 }}>“</div>
              <div style={{ fontSize: 76, fontWeight: 800, color: pal.fg, letterSpacing: "-0.03em", lineHeight: 1.1 }}>{proof}</div>
              <div style={{ marginTop: 30, display: "flex", gap: 8, color: "#f2b64a", fontSize: 44 }}>
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} style={{ opacity: c01((t - 7.4 - i * 0.1) * 5) }}>★</span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={500} size={140} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <rect x={960 - 300} y={580} width={600} height={110} rx={55} fill={pal.v} opacity={c01((t - 9.8) * 3)} />
          <Txt text={`${cta} →`} x={960} y={650} size={44} weight={800} color={pal.onV} font={ff} p={c01((t - 9.9) / 0.4)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/service-explainer.wav" on={audio} />
    </AbsoluteFill>
  );
}
