import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Box, MONO, Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, lerp, palette, seg, spring, useT } from "../../motion";

type C = { product: string; version: string; note: string };

// A CSS library release: rules type into an editor and a live preview obeys
// each one (grid, gap, radius, padding, color), then the version lands.
const LINES: [string, string][] = [
  [".cards {", ""],
  ["  display:", " grid;"],
  ["  gap:", " 24px;"],
  ["  border-radius:", " 28px;"],
  ["  padding:", " 40px;"],
  ["  color:", " var(--brand);"],
  ["}", ""],
];
const STARTS = [0.3, 0.75, 1.75, 2.75, 3.75, 4.75, 5.75];
const CPS = 26;

export default function CssRelease({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const typed = (i: number) => {
    const full = LINES[i][0] + LINES[i][1];
    return full.slice(0, Math.max(0, Math.floor((t - STARTS[i]) * CPS)));
  };
  const done = (i: number) => t - STARTS[i] > (LINES[i][0] + LINES[i][1]).length / CPS;
  const at = (i: number) => (LINES[i][0] + LINES[i][1]).length / CPS + STARTS[i];
  const pGrid = expInOut(seg(t, at(1), 0.5));
  const gap = lerp(8, 24, expInOut(seg(t, at(2), 0.5)));
  const rad = lerp(0, 28, expInOut(seg(t, at(3), 0.5)));
  const pad = lerp(0, 40, expInOut(seg(t, at(4), 0.5)));
  const col = expInOut(seg(t, at(5), 0.5));
  const outro = expInOut(seg(t, 7.0, 0.5));
  const endP = c01((t - 7.35) / 0.8);

  // preview container
  const X0 = 990;
  const Y0 = 250;
  const CW = 780;
  const CH = 560;
  const cells = Array.from({ length: 6 }, (_, i) => {
    const bw = CW - 2 * pad;
    const bh = 64;
    const bar = { x: X0 + pad, y: Y0 + pad + i * (bh + gap), w: bw, h: bh };
    const cw = (CW - 2 * pad - 2 * gap) / 3;
    const ch = (CH - 2 * pad - gap) / 2;
    const cell = { x: X0 + pad + (i % 3) * (cw + gap), y: Y0 + pad + Math.floor(i / 3) * (ch + gap), w: cw, h: ch };
    return { x: lerp(bar.x, cell.x, pGrid), y: lerp(bar.y, cell.y, pGrid), w: lerp(bar.w, cell.w, pGrid), h: lerp(bar.h, cell.h, pGrid) };
  });
  const product = c.product || "Tidy CSS";
  const version = c.version || "1.0";
  const vs = fit(product, 1300, 190, 800, -0.04, ff);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${-outro * 80}px) scale(${1 - outro * 0.08})`, opacity: 1 - outro }}>
        {/* editor */}
        <Box x={510} y={540} w={780} h={620} r={24} bg={pal.dark ? "#0f1013" : "#16171b"} style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.35)", transform: `translateY(${(1 - expOut(seg(t, 0, 0.6))) * 60}px)` }}>
          <div style={{ display: "flex", gap: 9, padding: "20px 24px" }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((k) => (
              <div key={k} style={{ width: 13, height: 13, borderRadius: 7, background: k }} />
            ))}
            <div style={{ marginLeft: 14, fontFamily: MONO, fontSize: 18, color: "#7d7f88" }}>cards.css</div>
          </div>
          <div style={{ padding: "18px 34px", fontFamily: MONO, fontSize: 34, lineHeight: 1.75 }}>
            {LINES.map(([prop], i) => {
              const s = typed(i);
              const p = s.slice(0, prop.length);
              const v = s.slice(prop.length);
              const live = t >= STARTS[i] && !done(i);
              return (
                <div key={i} style={{ whiteSpace: "pre", minHeight: 59, color: "#e8e8ea", background: done(i) && t < at(i) + 0.5 && LINES[i][1] ? "rgba(255,255,255,0.06)" : undefined, borderRadius: 6 }}>
                  <span style={{ color: i === 0 || i === 6 ? "#e8e8ea" : "#8fb4ff" }}>{p}</span>
                  <span style={{ color: pal.a }}>{v}</span>
                  {live && Math.floor(t * 3) % 2 === 0 && <span style={{ display: "inline-block", width: 16, height: 36, background: "#e8e8ea", verticalAlign: "-6px" }} />}
                </div>
              );
            })}
          </div>
        </Box>
        {/* preview */}
        <Box x={X0 + CW / 2} y={Y0 + CH / 2} w={CW + 40} h={CH + 40} r={28} bg={pal.card} style={{ opacity: expOut(seg(t, 0.2, 0.6)) }} />
        {cells.map((r, i) => {
          const pop = spring(t - 0.4 - i * 0.06, 18, 0.6);
          return <div key={i} style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: rad, background: col > 0.5 ? [pal.v, pal.a, pal.fg][i % 3] : pal.card2, transform: `scale(${pop})`, transition: "none", boxShadow: col > 0.5 ? "none" : `inset 0 0 0 2px ${pal.line}` }} />;
        })}
      </div>
      {/* release */}
      {endP > 0 && (
        <Svg>
          <Txt text={product} x={960} y={520} size={vs} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <g transform={`translate(960 680) scale(${spring(t - 7.85, 16, 0.55)})`}>
            <rect x={-150} y={-52} width={300} height={104} rx={52} fill={pal.v} />
            <text x={0} y={18} textAnchor="middle" fontFamily={MONO} fontSize={52} fontWeight={700} fill={pal.onV}>
              v{version}
            </text>
          </g>
          <Txt text={c.note || "Released today"} x={960} y={820} size={40} weight={500} color={pal.muted} font={ff} p={c01((t - 8.25) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/css-release.wav" on={audio} />
    </AbsoluteFill>
  );
}

