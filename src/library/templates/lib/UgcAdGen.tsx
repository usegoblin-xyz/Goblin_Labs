import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, hash, lerp, mix, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { product: string; promise: string; cta: string };

// A minimal vertical promo for a UGC ad generator: a hook in big type, a
// product drops into the app, three tones are picked, a grid of creator-style
// clips develops, one plays full screen with word-by-word captions, then the
// count and call to action land.
const W = 1080;
const H = 1920;
const TONES = ["Unboxing", "Honest review", "Before / after"];
const CAPTION = ["I", "did", "not", "expect", "this", "to", "actually", "work"];

function Creator({ x, y, w, h, i, pal, live }: { x: number; y: number; w: number; h: number; i: number; pal: ReturnType<typeof palette>; live: number }) {
  const a = mix(pal.p, ["#ffb38a", "#9ad1ff", "#ffd36e", "#c7a2ff", "#8be3c0", "#ff9eb5"][i % 6], 0.55);
  const b2 = mix(a, "#000000", 0.35);
  const bob = Math.sin(live * 5 + i) * h * 0.01;
  return (
    <g>
      <defs>
        <linearGradient id={`ugc-g${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b2} />
        </linearGradient>
        <clipPath id={`ugc-c${i}`}>
          <rect x={x} y={y} width={w} height={h} rx={w * 0.08} />
        </clipPath>
      </defs>
      <g clipPath={`url(#ugc-c${i})`}>
        <rect x={x} y={y} width={w} height={h} fill={`url(#ugc-g${i})`} />
        {/* creator silhouette */}
        <ellipse cx={x + w / 2} cy={y + h * 0.95 + bob} rx={w * 0.42} ry={h * 0.28} fill="#000" opacity={0.28} />
        <circle cx={x + w / 2} cy={y + h * 0.5 + bob} r={w * 0.2} fill="#000" opacity={0.28} />
        {/* product in hand */}
        <rect x={x + w * 0.58} y={y + h * 0.6 + bob} width={w * 0.14} height={h * 0.16} rx={w * 0.03} fill="#fff" opacity={0.85} />
      </g>
    </g>
  );
}

export default function UgcAdGen({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const product = c.product || "Glow Serum";
  const promise = c.promise || "Twelve creator-style ads in a minute";

  const hookOut = expInOut(seg(t, 1.5, 0.4));
  const app = expOut(seg(t, 1.6, 0.6)) * (1 - expInOut(seg(t, 3.4, 0.4)));
  const drop = spring(t - 2.0, 14, 0.6);
  const grid = c01((t - 3.5) / 0.3) * (1 - c01((t - 5.9) / 0.3));
  const play = expInOut(seg(t, 5.8, 0.5)) * (1 - expInOut(seg(t, 7.6, 0.4)));
  const endP = c01((t - 7.8) / 0.5);

  const GW = 300;
  const GH = 533;
  const cell = (i: number) => [90 + (i % 3) * 315, 520 + Math.floor(i / 3) * 560] as const;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg w={W} h={H}>
        {/* hook */}
        {hookOut < 1 && (
          <g opacity={1 - hookOut} transform={`translate(0 ${-hookOut * 200})`}>
            <Txt text="Need UGC ads?" x={540} y={860} size={fit("Need UGC ads?", 900, 130, 900)} weight={900} color={pal.fg} font={ff} p={c01((t - 0.1) / 0.5)} tracking={-0.04} />
            <Txt text="Skip the casting." x={540} y={1010} size={72} weight={700} color={pal.p} font={ff} p={c01((t - 0.6) / 0.5)} tracking={-0.03} />
          </g>
        )}

        {/* app: drop the product, pick tones */}
        {app > 0 && (
          <g opacity={app} transform={`translate(0 ${(1 - app) * 120})`}>
            <rect x={140} y={360} width={800} height={1160} rx={60} fill={pal.card} />
            <text x={200} y={460} fontFamily={ff} fontSize={40} fontWeight={800} fill={pal.fg}>
              New ad set
            </text>
            <rect x={200} y={510} width={680} height={460} rx={34} fill="none" stroke={pal.line} strokeWidth={4} strokeDasharray="16 12" />
            <g transform={`translate(540 ${lerp(300, 740, drop)})`} opacity={c01((t - 2.0) / 0.1)}>
              <rect x={-60} y={-130} width={120} height={230} rx={26} fill={pal.p} />
              <rect x={-26} y={-170} width={52} height={50} rx={10} fill={mix(pal.p, "#000", 0.4)} />
              <text x={0} y={10} textAnchor="middle" fontFamily={ff} fontSize={22} fontWeight={800} fill={pal.onP}>
                {product.split(" ")[0]}
              </text>
            </g>
            <text x={200} y={1050} fontFamily={ff} fontSize={30} fill={pal.muted}>
              Tone
            </text>
            {TONES.map((tone, i) => {
              const on = t > 2.6 + i * 0.22;
              const y = 1100 + i * 100;
              return (
                <g key={tone} transform={`translate(200 ${y})`}>
                  <rect width={680} height={80} rx={40} fill={on ? pal.p : "none"} stroke={on ? pal.p : pal.line} strokeWidth={3} />
                  <text x={40} y={52} fontFamily={ff} fontSize={32} fontWeight={700} fill={on ? pal.onP : pal.fg}>
                    {tone}
                  </text>
                  {on && <path d="M612,40 l12,12 l22,-26" stroke={pal.onP} strokeWidth={5} fill="none" strokeLinecap="round" />}
                </g>
              );
            })}
          </g>
        )}

        {/* generated grid */}
        {grid > 0 && (
          <g opacity={grid}>
            <Txt text={`Generating for ${product}`} x={540} y={330} size={46} weight={800} color={pal.fg} font={ff} p={c01((t - 3.5) / 0.4)} mode="fade" />
            <text x={540} y={410} textAnchor="middle" fontFamily={ff} fontSize={34} fill={pal.p} fontWeight={800}>
              {`${Math.min(12, Math.floor(c01((t - 3.6) / 1.8) * 12))} of 12 ready`}
            </text>
            {Array.from({ length: 6 }).map((_, i) => {
              const [x, y] = cell(i);
              const dev = c01((t - 3.6 - i * 0.22) / 0.6);
              return (
                <g key={i} opacity={expOut(dev)} transform={`translate(0 ${(1 - expOut(dev)) * 60})`}>
                  <Creator x={x} y={y} w={GW} h={GH} i={i} pal={pal} live={t} />
                  <rect x={x} y={y} width={GW} height={GH} rx={24} fill={pal.bg} opacity={(1 - dev) * 0.8} />
                  <rect x={x + 20} y={y + GH - 90} width={GW - 40} height={50} rx={12} fill="#000" opacity={0.45} />
                  <text x={x + GW / 2} y={y + GH - 56} textAnchor="middle" fontFamily={ff} fontSize={22} fontWeight={800} fill="#fff">
                    {TONES[i % 3]}
                  </text>
                  <text x={x + 24} y={y + 44} fontFamily={ff} fontSize={20} fontWeight={700} fill="#fff">{`▶ 0:${12 + Math.floor(hash(i) * 18)}`}</text>
                </g>
              );
            })}
          </g>
        )}

        {/* full screen playback with captions */}
        {play > 0 && (() => {
          const [x0, y0] = cell(1);
          const x = lerp(x0, 0, play);
          const y = lerp(y0, 0, play);
          const w = lerp(GW, W, play);
          const h = lerp(GH, H, play);
          const k = Math.floor(c01((t - 6.2) / 1.3) * CAPTION.length);
          return (
            <g>
              <Creator x={x} y={y} w={w} h={h} i={1} pal={pal} live={t} />
              <g opacity={c01((t - 6.1) / 0.2)}>
                {[0, 1].map((row) => (
                  <text key={row} x={540} y={1560 + row * 100} textAnchor="middle" fontFamily={ff} fontSize={68} fontWeight={900} style={{ paintOrder: "stroke" }} stroke="#000" strokeWidth={10} strokeLinejoin="round">
                    {CAPTION.slice(row * 4, row * 4 + 4).map((word, n) => {
                      const i = row * 4 + n;
                      return (
                        <tspan key={i} fill={i === k ? pal.a : "#fff"} fillOpacity={i <= k ? 1 : 0.35}>
                          {(n ? " " : "") + word}
                        </tspan>
                      );
                    })}
                  </text>
                ))}
              </g>
            </g>
          );
        })()}

        {/* end */}
        {endP > 0 && (
          <>
            <Txt text="12 ads." x={540} y={760} size={180} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.05} />
            <Txt text="One minute." x={540} y={920} size={120} weight={900} color={pal.p} font={ff} p={c01((t - 8.1) / 0.5)} tracking={-0.04} />
            <Txt text={promise} x={540} y={1060} size={fit(promise, 900, 44, 500)} weight={500} color={pal.muted} font={ff} p={c01((t - 8.4) / 0.5)} mode="fade" />
            <g opacity={c01((t - 8.7) / 0.4)}>
              <rect x={290} y={1200} width={500} height={110} rx={55} fill={pal.p} />
              <text x={540} y={1268} textAnchor="middle" fontFamily={ff} fontSize={40} fontWeight={800} fill={pal.onP}>
                {c.cta || "Try it free"}
              </text>
              <text x={540} y={1460} textAnchor="middle" fontFamily={ff} fontSize={44} fontWeight={800} fill={pal.fg}>
                {name}
              </text>
            </g>
          </>
        )}
      </Svg>
      <Track src="tracks/ugc-ad-gen.wav" on={audio} />
    </AbsoluteFill>
  );
}
