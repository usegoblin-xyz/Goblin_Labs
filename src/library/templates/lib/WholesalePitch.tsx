import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fontOf, hash, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { product: string; tiers: string; prices: string; margin: string; stores: string };

// A wholesale pitch: a product box drops and multiplies into a pallet stack,
// a price-tier ladder steps down as quantities rise, a margin bar compares
// cost to shelf price, and store pins light up across a map.
export default function WholesalePitch({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const product = c.product || "Cold brew, 12 pack";
  const tiers = [...list(c.tiers || "24+, 120+, 480+"), "1+", "1+", "1+"].slice(0, 3);
  const prices = [...list(c.prices || "$18, $15, $12"), "$0", "$0", "$0"].slice(0, 3);
  const margin = c.margin || "52%";
  const stores = Number(c.stores || 140) || 140;
  const mult = c01((t - 1.0) / 1.2);
  const tierP = (i: number) => spring(t - 2.6 - i * 0.35, 14, 0.6);
  const marginP = cubicInOut(c01((t - 4.4) / 0.9));
  const mapP = c01((t - 5.6) / 1.6);
  const outro = expInOut(seg(t, 8.6, 0.5));
  const endP = c01((t - 9.0) / 0.8);
  const box = (x: number, y: number, s: number, k: number) => (
    <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0,-40 L70,-75 L140,-40 L70,-5 Z" fill={pal.a} />
      <path d="M0,-40 L70,-5 L70,75 L0,40 Z" fill={pal.v} />
      <path d="M140,-40 L70,-5 L70,75 L140,40 Z" fill={pal.v} opacity={0.75} />
      <path d="M30,-55 L100,-20" stroke={pal.bg} strokeWidth={8} opacity={0.6} />
    </g>
  );
  const pallet: JSX.Element[] = [];
  let k = 0;
  for (let z = 0; z < 3; z++)
    for (let r = 0; r < 3; r++)
      for (let q = 0; q < 3; q++) {
        const idx = z * 9 + r * 3 + q;
        const show = expOut(c01(mult * 27 - idx));
        if (show <= 0) continue;
        const x = 260 + (q - r) * 70;
        const y = 640 + (q + r) * 35 - z * 80 - (1 - show) * 300;
        pallet.push(box(x, y, 1, k++));
      }

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          {t < 1.0 && box(260, 640 - (1 - spring(t, 12, 0.5)) * 600, 1, 99)}
          {pallet}
          <rect x={110} y={760} width={440} height={30} rx={4} fill="#8b5a2b" />
          <Txt text={product} x={330} y={880} size={44} weight={800} color={pal.fg} font={ff} p={c01((t - 0.4) / 0.5)} />
          <Txt text={`${Math.round(1 + mult * 26) * 12} units`} x={330} y={940} size={32} weight={600} color={pal.muted} font={ff} p={c01((t - 1.0) * 3)} mode="fade" />
        </Svg>
        {/* tier ladder */}
        <div style={{ position: "absolute", left: 700, top: 160, width: 520 }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: pal.muted, letterSpacing: "0.12em", marginBottom: 20, opacity: c01((t - 2.4) * 3) }}>PRICE PER CASE</div>
          {tiers.map((ti, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", height: 120, marginBottom: 14, marginLeft: i * 60, borderRadius: 24, background: i === 2 ? pal.v : pal.card, padding: "0 30px", transform: `translateX(${(1 - tierP(i)) * 800}px)`, opacity: c01((t - 2.6 - i * 0.35) * 6) }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: i === 2 ? pal.onV : pal.muted }}>{ti} cases</div>
              <div style={{ marginLeft: "auto", fontSize: 60, fontWeight: 900, color: i === 2 ? pal.onV : pal.fg }}>{prices[i]}</div>
            </div>
          ))}
          {/* margin */}
          <div style={{ marginTop: 40, opacity: c01((t - 4.3) * 3) }}>
            <div style={{ display: "flex", fontSize: 28, color: pal.muted, marginBottom: 10 }}>
              <span>Your cost</span>
              <span style={{ marginLeft: "auto" }}>Shelf price</span>
            </div>
            <div style={{ position: "relative", height: 60, borderRadius: 30, background: pal.card2, overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${48 * marginP}%`, background: pal.fg, opacity: 0.4 }} />
              <div style={{ position: "absolute", left: `${48 * marginP}%`, top: 0, bottom: 0, width: `${52 * marginP}%`, background: "#2fbf71" }} />
            </div>
            <div style={{ fontSize: 48, fontWeight: 900, color: "#2fbf71", marginTop: 12 }}>{margin} margin</div>
          </div>
        </div>
        {/* map */}
        <Svg>
          <g transform={`translate(1300 160)`} opacity={c01((t - 5.4) * 3)}>
            <rect width={520} height={680} rx={30} fill={pal.card} />
            <path d="M80,120 C160,60 300,100 380,80 C450,160 470,300 430,400 C460,500 380,600 260,610 C160,620 80,560 70,450 C40,330 30,220 80,120 Z" fill={pal.card2} />
            {Array.from({ length: 24 }, (_, i) => {
              const x = 100 + hash(i, 1) * 320;
              const y = 120 + hash(i, 2) * 460;
              const on = mapP * 24 > i;
              return (
                <g key={i} transform={`translate(${x} ${y}) scale(${on ? spring(t - 5.6 - i * 0.065, 18, 0.5) : 0})`}>
                  <circle r={22} fill={pal.v} opacity={0.25} />
                  <circle r={10} fill={pal.v} />
                </g>
              );
            })}
            <text x={260} y={650} textAnchor="middle" fontFamily={ff} fontSize={34} fontWeight={800} fill={pal.fg}>
              {Math.round(mapP * stores)} stores stock us
            </text>
          </g>
        </Svg>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="Stock it. Sell it. Reorder." x={960} y={500} size={104} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={`${nameOf(b)} wholesale`} x={960} y={620} size={48} weight={600} color={pal.v} font={ff} p={c01((t - 9.4) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/wholesale-pitch.wav" on={audio} />
    </AbsoluteFill>
  );
}
