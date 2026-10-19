import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, countStat, cubicInOut, expInOut, fontOf, hash, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { problem: string; solution: string; stats: string; labels: string; ask: string };

// A blockchain-style pitch: blocks drop and link into a chain with hashes,
// each block carries one pitch beat (problem, solution, traction); the
// camera follows along the chain, traction stats count up inside the last
// block, and the chain coils into the logo.
export default function ChainPitch({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const stats = [...list(c.stats || "$4.2M, 38k, 120"), "0", "0", "0"].slice(0, 3);
  const labels = [...list(c.labels || "settled monthly, wallets, partners"), "", "", ""].slice(0, 3);
  const beats = [
    { tag: "PROBLEM", text: c.problem || "Cross-border payments take days and cost 6%." },
    { tag: "SOLUTION", text: c.solution || "Settle in seconds for a fraction of a cent." },
    { tag: "TRACTION", text: "" },
    { tag: "ASK", text: c.ask || "Raising our seed round." },
  ];
  const BW = 640;
  const gap = 240;
  const at = (i: number) => 0.4 + i * 1.9;
  const camX = (() => {
    let x = 0;
    for (let i = 1; i < 4; i++) x += cubicInOut(c01((t - at(i) + 0.5) / 0.8)) * (BW + gap);
    return x;
  })();
  const outro = expInOut(seg(t, 8.6, 0.5));
  const endP = c01((t - 9.0) / 0.8);
  const hashOf = (i: number) => "0x" + Array.from({ length: 8 }, (_, j) => "0123456789abcdef"[Math.floor(hash(i, j) * 16)]).join("");

  return (
    <AbsoluteFill style={{ background: "#07090f", overflow: "hidden", fontFamily: ff }}>
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(${pal.v}22 1.5px, transparent 1.5px)`, backgroundSize: "40px 40px", backgroundPosition: `${-camX * 0.3}px 0` }} />
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro, transform: `translateX(${-camX}px)` }}>
        {beats.map((bt, i) => {
          const x = 640 + i * (BW + gap);
          const drop = spring(t - at(i), 13, 0.6);
          const linked = c01((t - at(i) - 0.5) / 0.4);
          return (
            <div key={i}>
              {i > 0 && (
                <Svg style={{ position: "absolute", left: 0, top: 0, width: 6000, height: 1080 }} w={6000}>
                  {[0, 1, 2].map((k) => (
                    <ellipse key={k} cx={x - gap + 40 + k * 80} cy={540} rx={50} ry={26} fill="none" stroke={pal.v} strokeWidth={12} opacity={c01(linked * 3 - k)} transform={k % 2 ? `rotate(0)` : undefined} />
                  ))}
                </Svg>
              )}
              <div style={{ position: "absolute", left: x, top: 260 - (1 - drop) * 900, width: BW, height: 560, borderRadius: 26, background: "#111522", border: `3px solid ${linked > 0.9 || i === 0 ? pal.v : "#2a3245"}`, padding: 40, boxSizing: "border-box", boxShadow: `0 0 ${linked * 40}px ${pal.v}44` }}>
                <div style={{ display: "flex", fontFamily: MONO, fontSize: 22, color: "#7d8aa8" }}>
                  <span>BLOCK #{1024 + i}</span>
                  <span style={{ marginLeft: "auto" }}>{hashOf(i)}</span>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 30, color: pal.v, marginTop: 40, letterSpacing: "0.2em" }}>{bt.tag}</div>
                {i !== 2 ? (
                  <div style={{ fontSize: 56, fontWeight: 800, color: "#fff", lineHeight: 1.15, marginTop: 20 }}>{bt.text}</div>
                ) : (
                  <div style={{ marginTop: 20 }}>
                    {stats.map((s, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "baseline", gap: 18, marginBottom: 10 }}>
                        <span style={{ fontSize: 70, fontWeight: 900, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{countStat(s, c01((t - at(2) - 0.6 - j * 0.15) / 1.0))}</span>
                        <span style={{ fontSize: 28, color: "#7d8aa8" }}>{labels[j]}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ position: "absolute", left: 40, bottom: 30, fontFamily: MONO, fontSize: 20, color: "#4b5670" }}>prev: {i ? hashOf(i - 1) : "genesis"}</div>
              </div>
            </div>
          );
        })}
      </div>
      {endP > 0 && (
        <Svg>
          <g transform={`translate(960 400) rotate(${(1 - endP) * 180})`}>
            {Array.from({ length: 6 }, (_, k) => {
              const a = (k / 6) * Math.PI * 2;
              return <ellipse key={k} cx={Math.cos(a) * 90} cy={Math.sin(a) * 90} rx={50} ry={26} fill="none" stroke={pal.v} strokeWidth={12} transform={`rotate(${(a * 180) / Math.PI + 90} ${Math.cos(a) * 90} ${Math.sin(a) * 90})`} opacity={c01(endP * 6 - k)} />;
            })}
          </g>
          <Txt text={nameOf(b)} x={960} y={680} size={130} weight={900} color="#fff" font={ff} p={c01((t - 9.3) / 0.6)} tracking={-0.04} />
          <Txt text={c.ask || "Raising our seed round."} x={960} y={770} size={44} weight={600} color={pal.v} font={ff} p={c01((t - 9.6) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/chain-pitch.wav" on={audio} />
    </AbsoluteFill>
  );
}
