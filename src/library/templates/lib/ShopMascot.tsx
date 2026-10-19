import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Browser, Cursor, Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, lerp, mix, nameOf, onColor, palette, seg, spring, useT } from "../../motion";

type C = { question: string; reply: string; tagline: string };

// A shop's chat helper: a round mascot pops out of the chat button, waves,
// and answers a shopper's question with three product picks. One gets added
// to the cart, the badge pops, the mascot does a happy hop, then it takes a
// bow beside your name.
const PRODUCTS = [
  { name: "Glaze mug", price: "$24", kind: "mug" },
  { name: "Tiny fern", price: "$18", kind: "plant" },
  { name: "Fig candle", price: "$32", kind: "candle" },
  { name: "Linen tote", price: "$28", kind: "tote" },
  { name: "Desk clock", price: "$39", kind: "clock" },
  { name: "Tea tin", price: "$15", kind: "tin" },
];

function Product({ kind, x, y, s, color, ink }: { kind: string; x: number; y: number; s: number; color: string; ink: string }) {
  const k = s / 100;
  const g = (children: React.ReactNode) => <g transform={`translate(${x} ${y}) scale(${k})`}>{children}</g>;
  if (kind === "mug") return g(<><rect x={-28} y={-26} width={48} height={56} rx={8} fill={color} /><path d="M20,-14 a14,14 0 0 1 0,28" fill="none" stroke={color} strokeWidth={8} /></>);
  if (kind === "plant") return g(<><path d="M-20,8 L20,8 L14,34 L-14,34 Z" fill={ink} /><path d="M0,8 C-30,-6 -26,-34 -6,-36 C-2,-20 0,-6 0,8 C4,-14 20,-30 30,-22 C24,-4 10,4 0,8" fill={color} /></>);
  if (kind === "candle") return g(<><rect x={-22} y={-14} width={44} height={50} rx={6} fill={color} /><path d="M0,-34 C8,-24 6,-18 0,-16 C-6,-18 -8,-24 0,-34" fill="#f5a524" /></>);
  if (kind === "tote") return g(<><path d="M-30,-8 L30,-8 L26,36 L-26,36 Z" fill={color} /><path d="M-14,-8 C-14,-36 14,-36 14,-8" fill="none" stroke={ink} strokeWidth={6} /></>);
  if (kind === "clock") return g(<><circle r={32} fill={color} /><path d="M0,0 L0,-20 M0,0 L14,8" stroke={ink} strokeWidth={6} strokeLinecap="round" /></>);
  return g(<><rect x={-24} y={-30} width={48} height={64} rx={10} fill={color} /><rect x={-24} y={-30} width={48} height={16} rx={6} fill={ink} /></>);
}

function Mascot({ x, y, s, pal, t, wave = 0, hop = 0, blinkAt = [2.6, 5.2, 8.9] }: { x: number; y: number; s: number; pal: ReturnType<typeof palette>; t: number; wave?: number; hop?: number; blinkAt?: number[] }) {
  const squash = 1 + 0.12 * Math.sin(hop * Math.PI * 2) * (1 - hop);
  const lift = Math.sin(hop * Math.PI) * 70;
  const blink = blinkAt.some((bt) => t > bt && t < bt + 0.12) ? 0.1 : 1;
  const breathe = 1 + Math.sin(t * 3) * 0.015;
  const arm = Math.sin(t * 14) * 28 * wave;
  return (
    <g transform={`translate(${x} ${y - lift}) scale(${s * breathe})`}>
      <ellipse cx={0} cy={58} rx={46} ry={8} fill="#000" opacity={0.15} transform={`scale(${1 - lift / 200} 1)`} />
      <g transform={`scale(${1 / squash} ${squash})`} style={{ transformOrigin: "0 50px" }}>
        <path d={`M44,10 q26,${-20 - arm} 30,${-34 - arm}`} stroke={pal.p} strokeWidth={14} strokeLinecap="round" fill="none" />
        <circle r={56} fill={pal.p} />
        <path d="M0,-56 C-6,-74 6,-86 18,-84 C14,-72 8,-62 0,-56" fill={pal.a} />
        <ellipse cx={-18} cy={-8} rx={9} ry={13 * blink} fill="#fff" />
        <ellipse cx={18} cy={-8} rx={9} ry={13 * blink} fill="#fff" />
        <circle cx={-16} cy={-6} r={5 * blink} fill="#111" />
        <circle cx={20} cy={-6} r={5 * blink} fill="#111" />
        <circle cx={-32} cy={14} r={8} fill="#ff8fa3" opacity={0.6} />
        <circle cx={32} cy={14} r={8} fill="#ff8fa3" opacity={0.6} />
        <path d="M-12,18 Q0,30 12,18" stroke={onColor(pal.p)} strokeWidth={5} fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
}

export default function ShopMascot({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const q = c.question || "A gift for my sister, under $40?";
  const reply = c.reply || "Here are three she'll love:";

  const win = spring(t - 0.05, 14, 0.85);
  const pop = spring(t - 1.1, 13, 0.6);
  const panel = spring(t - 1.8, 15, 0.8);
  const typed = Math.floor(c01((t - 2.2) / 0.9) * q.length);
  const sent = t > 3.2;
  const dots = t > 3.4 && t < 4.0;
  const replyP = c01((t - 4.0) / 0.4);
  const cards = (i: number) => spring(t - 4.6 - i * 0.15, 15, 0.75);
  const added = t > 6.05;
  const badge = spring(t - 6.1, 18, 0.5);
  const hop = c01((t - 6.2) / 0.6);
  const away = expInOut(seg(t, 7.4, 0.7));
  const hero = expOut(seg(t, 7.7, 0.7));
  const nameP = c01((t - 8.1) / 0.6);
  const tagP = c01((t - 8.5) / 0.6);

  const BX = 960;
  const BY = 540;
  const BW = 1520;
  const BH = 880;
  // chat panel geometry (frame coordinates)
  const PX = BX + BW / 2 - 300;
  const PY = BY + 40;

  const cur = (() => {
    const tx = PX + 160;
    const ty = PY - 12;
    const k = expInOut(seg(t, 5.3, 0.6));
    return { x: lerp(1500, tx, k), y: lerp(980, ty, k), press: t > 5.95 && t < 6.1 ? 1 : 0 };
  })();

  return (
    <AbsoluteFill style={{ background: mix(pal.bg, pal.p, 0.06), overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${away * -1400}px) scale(${lerp(0.7, 1, win) - away * 0.15})`, opacity: c01(win * 2) }}>
        <Browser x={BX} y={BY} w={BW} h={BH} pal={pal} url="shop.example">
          <div style={{ position: "absolute", left: 50, top: 30, fontSize: 40, fontWeight: 800, color: pal.fg }}>New arrivals</div>
          <div style={{ position: "absolute", right: 60, top: 32, width: 54, height: 54 }}>
            <Svg w={54} h={54}>
              <path d="M8,12 h8 l6,26 h22 l5,-18 h-30" fill="none" stroke={pal.fg} strokeWidth={4} strokeLinejoin="round" />
            </Svg>
            {badge > 0.01 && <div style={{ position: "absolute", right: -6, top: -6, width: 28, height: 28, borderRadius: 99, background: pal.p, color: pal.onP, fontSize: 18, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${badge})` }}>1</div>}
          </div>
          {PRODUCTS.map((p, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            return (
              <div key={i} style={{ position: "absolute", left: 50 + col * 300, top: 110 + row * 340, width: 270, height: 310, borderRadius: 20, background: pal.card, border: `1.5px solid ${pal.line}` }}>
                <Svg w={270} h={200}>
                  <Product kind={p.kind} x={135} y={110} s={150} color={i % 2 ? pal.a : pal.p} ink={pal.fg} />
                </Svg>
                <div style={{ position: "absolute", left: 22, top: 216, fontSize: 26, fontWeight: 700, color: pal.fg }}>{p.name}</div>
                <div style={{ position: "absolute", left: 22, top: 256, fontSize: 24, color: pal.muted }}>{p.price}</div>
              </div>
            );
          })}
        </Browser>
        {/* chat panel */}
        <div style={{ position: "absolute", left: PX - 230, top: PY - 360, width: 460, height: 640, borderRadius: 28, background: pal.bg, border: `1.5px solid ${pal.line}`, boxShadow: "0 30px 70px rgba(0,0,0,0.25)", transform: `scale(${panel})`, transformOrigin: "90% 110%", overflow: "hidden" }}>
          <div style={{ height: 76, background: pal.p, color: pal.onP, display: "flex", alignItems: "center", padding: "0 24px 0 90px", fontSize: 26, fontWeight: 800 }}>Ask {name}</div>
          <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            {sent && <div style={{ alignSelf: "flex-end", maxWidth: 330, padding: "14px 18px", borderRadius: "20px 20px 4px 20px", background: pal.card2, color: pal.fg, fontSize: 22 }}>{q}</div>}
            {dots && <div style={{ width: 80, padding: "14px 18px", borderRadius: 20, background: pal.card, display: "flex", gap: 8 }}>{[0, 1, 2].map((i) => <div key={i} style={{ width: 10, height: 10, borderRadius: 99, background: pal.muted, transform: `translateY(${Math.sin(t * 12 - i) * 4}px)` }} />)}</div>}
            {replyP > 0 && <div style={{ maxWidth: 360, padding: "14px 18px", borderRadius: "20px 20px 20px 4px", background: pal.card, color: pal.fg, fontSize: 22, opacity: replyP }}>{reply}</div>}
            {[1, 0, 2].map((pi, i) => {
              const p = PRODUCTS[pi];
              const s = cards(i);
              if (s <= 0.01) return null;
              const isAdd = i === 0;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: 10, borderRadius: 18, background: pal.card, transform: `translateX(${(1 - s) * 200}px)`, opacity: c01(s * 2) }}>
                  <Svg w={70} h={70} style={{ position: "relative" }}>
                    <Product kind={p.kind} x={35} y={38} s={70} color={pal.p} ink={pal.fg} />
                  </Svg>
                  <div style={{ flex: 1, fontSize: 22, color: pal.fg, fontWeight: 700 }}>
                    {p.name}
                    <div style={{ fontSize: 20, color: pal.muted, fontWeight: 500 }}>{p.price}</div>
                  </div>
                  <div style={{ padding: "10px 16px", borderRadius: 99, background: isAdd && added ? pal.p : pal.card2, color: isAdd && added ? pal.onP : pal.fg, fontSize: 20, fontWeight: 700 }}>{isAdd && added ? "Added ✓" : "Add"}</div>
                </div>
              );
            })}
          </div>
          {!sent && t > 2.0 && (
            <div style={{ position: "absolute", left: 18, right: 18, bottom: 18, padding: "16px 18px", borderRadius: 16, background: pal.card, color: pal.fg, fontSize: 22 }}>
              {q.slice(0, typed)}
              <span style={{ opacity: Math.floor(t * 3) % 2 }}>|</span>
            </div>
          )}
        </div>
        <Svg>
          <circle cx={PX + 180} cy={PY + 330} r={46 * (1 + 0.08 * Math.sin(t * 6) * (1 - c01(t - 1)))} fill={pal.p} opacity={1 - c01(pop * 3)} />
          {pop > 0.01 && <Mascot x={lerp(PX + 180, PX - 170, panel)} y={lerp(PY + 330, PY - 320, panel)} s={lerp(0.2, 0.62, pop) * lerp(1, 0.75, panel)} pal={pal} t={t} wave={c01((t - 1.3) / 0.2) * (1 - c01((t - 2.2) / 0.2))} hop={hop} />}
        </Svg>
        {t > 5.2 && t < 6.6 && <Cursor x={cur.x} y={cur.y} press={cur.press} color={pal.dark ? "#fff" : "#0b0b0c"} />}
      </div>
      <Svg>
        {hero > 0 && <Mascot x={lerp(-200, 640, hero)} y={560} s={2.2} pal={pal} t={t} wave={c01((t - 8.2) / 0.2)} hop={c01((t - 8.0) / 0.6)} />}
        {nameP > 0 && <Txt text={name} x={900} y={540} size={fit(name, 900, 150, 900)} weight={900} color={pal.fg} font={ff} p={nameP} anchor="start" tracking={-0.04} />}
        {tagP > 0 && <Txt text={c.tagline || "Your shop's friendliest helper"} x={904} y={630} size={42} weight={500} color={pal.muted} font={ff} p={tagP} mode="fade" anchor="start" />}
      </Svg>
      <Track src="tracks/shop-mascot.wav" on={audio} />
    </AbsoluteFill>
  );
}
