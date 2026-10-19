import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, expInOut, fontOf, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { emails: string; rate: string; tagline: string };

// An email-verification promo: a messy list drops in, a scan line sweeps
// down it, each address gets a verdict chip (valid, typo fixed, disposable,
// bounced), bad rows are struck and slide out, and a deliverability gauge
// swings from red to green.
export default function EmailVerify({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const emails = [...list(c.emails || "ana@studio.co, leo@gmial.com, temp123@trashmail.io, sam@company.com, no-reply@old-domain.biz, kai@startup.dev, mia@hotmial.com, ops@company.com"), "x@y.z"].slice(0, 8);
  const verdict = ["valid", "typo", "disposable", "valid", "bounced", "valid", "typo", "valid"];
  const fixes: Record<number, string> = { 1: "leo@gmail.com", 6: "mia@hotmail.com" };
  const green = "#2fbf71";
  const red = "#e5484d";
  const amber = "#f2b64a";
  const colOf = (v: string) => (v === "valid" ? green : v === "typo" ? amber : red);
  const rowH = 92;
  const top = 160;
  const scanY = top + c01((t - 1.4) / 3.2) * emails.length * rowH;
  const purge = expInOut(seg(t, 5.0, 0.6));
  const rate = c.rate || "99.2%";
  const gauge = expInOut(c01((t - 5.4) / 1.2));
  const outro = expInOut(seg(t, 8.4, 0.5));
  const endP = c01((t - 8.8) / 0.8);
  const bad = (i: number) => verdict[i] === "disposable" || verdict[i] === "bounced";
  // y position after purge: bad rows collapse
  const yOf = (i: number) => {
    let y = top + i * rowH;
    const removed = emails.slice(0, i).filter((_, j) => bad(j)).length;
    y -= removed * rowH * purge;
    return y;
  };
  const gA = -120 + gauge * 230; // needle angle
  const pct = (40 + gauge * (parseFloat(rate) - 40)).toFixed(1);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <div style={{ position: "absolute", left: 120, top: 80, fontSize: 34, fontWeight: 800, color: pal.fg }}>contacts.csv</div>
        {emails.map((e, i) => {
          const scanned = scanY > top + i * rowH + rowH / 2;
          const v = verdict[i];
          const gone = bad(i) ? purge : 0;
          return (
            <div key={i} style={{ position: "absolute", left: 120, top: yOf(i), width: 1000, height: rowH - 14, display: "flex", alignItems: "center", gap: 24, padding: "0 30px", borderRadius: 18, background: pal.card, boxSizing: "border-box", transform: `translateX(${(1 - spring(t - 0.2 - i * 0.06, 16, 0.7)) * -1300 + gone * -1400}px)`, opacity: 1 - gone }}>
              <div style={{ fontFamily: MONO, fontSize: 32, color: pal.fg, position: "relative", flex: 1 }}>
                {scanned && fixes[i] ? fixes[i] : e}
                {scanned && bad(i) && <div style={{ position: "absolute", left: 0, top: "50%", height: 4, width: `${c01((t - 1.4 - ((i + 0.5) / emails.length) * 3.2) * 4) * 100}%`, background: red }} />}
              </div>
              {scanned && (
                <div style={{ padding: "8px 20px", borderRadius: 20, background: `${colOf(v)}26`, color: colOf(v), fontSize: 24, fontWeight: 800, transform: `scale(${spring(t - 1.4 - ((i + 0.5) / emails.length) * 3.2, 18, 0.5)})` }}>
                  {v === "typo" ? "typo fixed" : v}
                </div>
              )}
            </div>
          );
        })}
        {t > 1.4 && t < 4.8 && <div style={{ position: "absolute", left: 100, width: 1040, top: scanY, height: 4, background: pal.v, boxShadow: `0 0 30px 8px ${pal.v}88` }} />}
        {/* gauge */}
        <Svg>
          <g transform={`translate(1520 560) scale(${spring(t - 0.6, 14, 0.7)})`}>
            <path d="M-260,0 A260,260 0 0 1 260,0" fill="none" stroke={pal.card2} strokeWidth={40} />
            <path d="M-260,0 A260,260 0 0 1 260,0" fill="none" stroke={gauge > 0.5 ? green : gauge > 0.2 ? amber : red} strokeWidth={40} pathLength={1} strokeDasharray={`${0.3 + gauge * 0.68} 2`} />
            <line x1={0} y1={0} x2={0} y2={-220} stroke={pal.fg} strokeWidth={10} strokeLinecap="round" transform={`rotate(${gA * 0.75})`} />
            <circle r={22} fill={pal.fg} />
            <text y={110} textAnchor="middle" fontFamily={ff} fontSize={90} fontWeight={900} fill={pal.fg}>
              {pct}%
            </text>
            <text y={160} textAnchor="middle" fontFamily={ff} fontSize={30} fill={pal.muted}>
              deliverability
            </text>
          </g>
        </Svg>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="Send to people who are there." x={960} y={500} size={96} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={`${nameOf(b)} · ${c.tagline || "verify before you send"}`} x={960} y={620} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 9.2) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/email-verify.wav" on={audio} />
    </AbsoluteFill>
  );
}
