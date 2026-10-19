import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fontOf, nameOf, palette, seg, useT } from "../../motion";

type C = { words: string; year: string; role: string };

// A Swiss-style showreel: a 12-column grid draws, then flush-left type,
// rules, large numerals and a red block snap to columns; the layout
// re-composes three times on the grid before the name sets in black.
export default function SwissGrid({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const red = pal.v;
  const ink = "#111";
  const paper = "#f3f1ec";
  const words = [...list(c.words || "Order, Clarity, Rhythm"), "Form", "Form", "Form"].slice(0, 3);
  const year = c.year || "2026";
  const col = (i: number) => 80 + i * 146.67; // 12 cols across 1760
  const gridP = expOut(c01(t / 0.9));
  const L = (k: number) => cubicInOut(c01((t - (1.0 + k * 2.3)) / 0.6)); // layout k progress
  const lay = t < 3.3 ? 0 : t < 5.6 ? 1 : 2;
  const p0 = L(0);
  const p1 = L(1);
  const p2 = L(2);
  const lerp3 = (a: number, b2: number, c2: number) => (lay === 0 ? a : lay === 1 ? a + (b2 - a) * p1 : b2 + (c2 - b2) * p2);
  // red block geometry per layout
  const bx = lerp3(col(8), col(0), col(6));
  const by = lerp3(80, 640, 80);
  const bw = lerp3(col(12) - col(8), col(5) - col(0), col(12) - col(6));
  const bh = lerp3(560, 360, 920);
  const numX = lerp3(col(0), col(7), col(0));
  const numY = lerp3(1000, 560, 1000);
  const outro = expInOut(seg(t, 8.4, 0.5));
  const endP = c01((t - 8.8) / 0.8);

  return (
    <AbsoluteFill style={{ background: paper, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          {Array.from({ length: 13 }, (_, i) => (
            <line key={i} x1={col(i)} x2={col(i)} y1={40} y2={40 + 1000 * c01(gridP * 1.4 - i * 0.03)} stroke="#c9c4ba" strokeWidth={1.5} />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <line key={i} y1={80 + i * 130} y2={80 + i * 130} x1={40} x2={40 + 1840 * c01(gridP * 1.4 - i * 0.05)} stroke="#c9c4ba" strokeWidth={1} />
          ))}
          <rect x={bx} y={by} width={bw * p0} height={bh} fill={red} />
          <line x1={col(0)} x2={col(0) + (col(12) - col(0)) * expOut(c01((t - 1.4) / 0.6))} y1={lerp3(620, 300, 560)} y2={lerp3(620, 300, 560)} stroke={ink} strokeWidth={6} />
        </Svg>
        {/* big numeral */}
        <div style={{ position: "absolute", left: numX, top: numY - 380, fontSize: 380, fontWeight: 900, letterSpacing: "-0.06em", lineHeight: 1, color: ink, opacity: c01((t - 1.6) * 3), fontVariantNumeric: "tabular-nums" }}>
          {String(lay + 1).padStart(2, "0")}
        </div>
        {/* flush-left headline */}
        {words.map((w, i) => {
          const vis = lay === i;
          const p = vis ? expOut(c01((t - (1.2 + i * 2.3)) / 0.5)) : 0;
          if (!vis) return null;
          const x = [col(0), col(0), col(7)][i];
          const y = [200, 140, 640][i];
          return (
            <div key={i} style={{ position: "absolute", left: x, top: y, fontSize: 200, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 0.9, color: i === 2 ? paper : ink, clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`, mixBlendMode: i === 2 ? "normal" : "multiply" }}>
              {w}.
            </div>
          );
        })}
        {/* small captions on columns */}
        <div style={{ position: "absolute", left: col(lay === 0 ? 4 : 0), top: [680, 380, 160][lay], width: 560, fontSize: 26, lineHeight: 1.4, color: ink, opacity: c01((t - 2.0) * 2) }}>
          <b>{nameOf(b)}</b> — {c.role || "graphic design & motion"}. Set on a twelve-column grid, {year}.
        </div>
        <div style={{ position: "absolute", right: 80, top: 50, fontSize: 24, fontWeight: 700, color: ink }}>{year}</div>
      </div>
      {endP > 0 && (
        <AbsoluteFill style={{ background: red }}>
          <Svg>
            <Txt text={nameOf(b)} x={80} y={600} size={220} weight={900} color={paper} font={ff} p={endP} tracking={-0.05} anchor="start" />
            <Txt text={c.role || "Graphic design & motion"} x={86} y={700} size={44} weight={600} color={paper} font={ff} p={c01((t - 9.2) / 0.6)} mode="fade" anchor="start" />
          </Svg>
        </AbsoluteFill>
      )}
      <Track src="tracks/swiss-grid.wav" on={audio} />
    </AbsoluteFill>
  );
}
