import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fit, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { categories: string; line: string; tagline: string };

// Bookkeeping, done quietly: paper receipts drift in, a scan line reads each
// one, it folds into a ledger row, the rows sort themselves into category
// bars, and the books close with a check.
export default function ReceiptBooks({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const cats = [...list(c.categories || "Software, Travel, Office, Meals"), "Other", "Other", "Other", "Other"].slice(0, 4);
  const N = 8;
  const amounts = Array.from({ length: N }, (_, i) => Math.round(20 + hash(i, 3) * 380));
  const catOf = (i: number) => i % 4;
  const sorted = expInOut(seg(t, 5.4, 1.0));
  const close = c01((t - 7.0) / 0.6);
  const outro = expInOut(seg(t, 8.6, 0.5));
  const endP = c01((t - 9.0) / 0.8);
  const line = c.line || "Books closed.";
  const totals = cats.map((_, k) => amounts.filter((_, i) => catOf(i) === k).reduce((a, v) => a + v, 0));
  const maxT = Math.max(...totals);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {Array.from({ length: N }, (_, i) => {
          const at = 0.4 + i * 0.5;
          const drift = expOut(seg(t, at - 0.4, 0.6));
          const scan = c01((t - at) / 0.35);
          const fold = cubicInOut(c01((t - at - 0.4) / 0.45));
          // receipt pose
          const rx = 520 + (hash(i, 1) - 0.5) * 120;
          const ry = 540 + (hash(i, 2) - 0.5) * 60;
          const rr = (hash(i, 4) - 0.5) * 16;
          // ledger row pose
          const lx = 1300;
          const ly = 200 + i * 86;
          // sorted bar pose: rows slide into their category column
          const k = catOf(i);
          const sx = 1040 + k * 220;
          const before = amounts.slice(0, i).filter((_, j) => catOf(j) === k).reduce((a, v) => a + v, 0);
          const sh = (amounts[i] / maxT) * 520;
          const sy = 860 - ((before / maxT) * 520) - sh / 2;
          if (t < at - 0.4) return null;
          const x = sorted > 0 ? lerp(lx, sx, sorted) : lerp(rx, lx, fold);
          const y = sorted > 0 ? lerp(ly, sy, sorted) : lerp(ry - (1 - drift) * 300, ly, fold);
          const w = sorted > 0 ? lerp(620, 160, sorted) : lerp(280, 620, fold);
          const h = sorted > 0 ? lerp(70, Math.max(6, sh - 4), sorted) : lerp(380, 70, fold);
          const rot = lerp(rr, 0, fold);
          const isRow = fold > 0.5;
          return (
            <div key={i} style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: sorted > 0 ? 10 : lerp(6, 16, fold), background: sorted > 0.5 ? [pal.v, pal.a, pal.fg, pal.faint][k] : isRow ? pal.card2 : "#f4f2ec", transform: `rotate(${rot}deg)`, opacity: drift, overflow: "hidden", boxShadow: isRow ? "none" : "0 20px 40px rgba(0,0,0,0.3)" }}>
              {!isRow && (
                <div style={{ padding: 22, fontFamily: MONO, fontSize: 18, color: "#333", opacity: 1 - fold * 2 }}>
                  <div style={{ fontWeight: 700 }}>RECEIPT #{1040 + i}</div>
                  {[0, 1, 2, 3].map((j) => (
                    <div key={j} style={{ marginTop: 14, height: 8, width: `${50 + hash(i, j) * 40}%`, background: "#c8c6bf", borderRadius: 4 }} />
                  ))}
                  <div style={{ marginTop: 30, fontWeight: 700, fontSize: 24 }}>${amounts[i]}.00</div>
                </div>
              )}
              {isRow && sorted < 0.5 && (
                <div style={{ display: "flex", alignItems: "center", height: "100%", padding: "0 26px", fontSize: 28, color: pal.fg, gap: 20, opacity: (fold - 0.5) * 2 * (1 - sorted * 2) }}>
                  <span style={{ width: 16, height: 16, borderRadius: 8, background: [pal.v, pal.a, pal.fg, pal.faint][k] }} />
                  <span style={{ flex: 1 }}>{cats[k]}</span>
                  <span style={{ fontFamily: MONO, fontWeight: 700 }}>${amounts[i]}</span>
                </div>
              )}
              {!isRow && scan > 0 && scan < 1 && <div style={{ position: "absolute", left: 0, right: 0, top: `${scan * 100}%`, height: 6, background: pal.v, boxShadow: `0 0 24px ${pal.v}` }} />}
            </div>
          );
        })}
        {sorted > 0.6 && (
          <Svg>
            {cats.map((cat, k) => (
              <g key={k} opacity={c01((sorted - 0.6) * 3)}>
                <text x={1040 + k * 220} y={920} textAnchor="middle" fontFamily={ff} fontSize={28} fill={pal.muted}>
                  {cat}
                </text>
                <text x={1040 + k * 220} y={860 - (totals[k] / maxT) * 520 - 24} textAnchor="middle" fontFamily={ff} fontSize={32} fontWeight={800} fill={pal.fg}>
                  ${totals[k]}
                </text>
              </g>
            ))}
          </Svg>
        )}
        {close > 0 && (
          <div style={{ position: "absolute", left: 520, top: 540, transform: `translate(-50%, -50%) scale(${spring(t - 7.0, 16, 0.55)})`, width: 300, height: 300, borderRadius: 150, background: pal.v, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={160} height={160} viewBox="0 0 24 24">
              <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={pal.onV} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${c01((t - 7.2) / 0.4)} 2`} />
            </svg>
          </div>
        )}
        {close > 0 && <Svg><Txt text={line} x={520} y={820} size={fit(line, 700, 76, 800, -0.03, ff)} weight={800} color={pal.fg} font={ff} p={c01((t - 7.3) / 0.6)} /></Svg>}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Bookkeeping that keeps itself."} x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - 9.4) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/receipt-books.wav" on={audio} />
    </AbsoluteFill>
  );
}
