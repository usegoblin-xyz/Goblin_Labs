import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Box, Icon, Paint, Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fit, fontOf, hash, lerp, nameOf, palette, seg, useT } from "../../motion";

type C = { before: string; after: string; chunks: string; tagline: string };

// A wall of text gets sliced: a blade cuts the long read into chunks, each
// chunk flips into a bite-size card with an icon, and the cards settle into a
// grid under the product name.
const ICONS5 = ["bolt", "doc", "chart", "chat", "star"];

export default function ChunkPromo({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const chunks = [...list(c.chunks || "Key idea, Summary, Data, Quotes, Takeaways"), "Idea", "Summary", "Data", "Quote", "Takeaway"].slice(0, 5);
  const before = c.before || "Long reads.";
  const after = c.after || "Bite-size.";
  const slabIn = expOut(seg(t, 0, 0.7));
  const cut = seg(t, 2.0, 1.0); // blade sweep
  const split = expInOut(seg(t, 3.1, 0.8));
  const flip = (i: number) => expInOut(seg(t, 3.8 + i * 0.12, 0.5));
  const gridP = expInOut(seg(t, 5.0, 0.9));
  const endP = c01((t - 6.4) / 0.8);
  const SW = 900;
  const SH = 760;
  const sy = 540 - SH / 2;
  const rows = 5;
  const rh = SH / rows;
  const beforeS = fit(before, 760, 120, 800, -0.04, ff);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        <Txt text={before} x={480} y={250} size={beforeS} weight={800} color={pal.fg} font={ff} p={c01((t - 0.3) / 0.6)} out={c01((t - 2.9) / 0.4)} />
        <Txt text={after} x={480} y={250} size={beforeS} weight={800} color={pal.v} font={ff} p={c01((t - 3.5) / 0.6)} out={c01((t - 6.0) / 0.4)} />
      </Svg>
      {chunks.map((label, i) => {
        // each slice of the slab becomes a card
        const sx = 960 + 280 + lerp(0, (i % 2 ? 1 : -1) * 30, split);
        const syi = sy + i * rh + rh / 2 + (i - 2) * 26 * split;
        const cols = 5;
        const gx = 960 - ((cols - 1) * 330) / 2 + i * 330;
        const gy = 700;
        const x = lerp(sx, gx, gridP);
        const y = lerp(syi, gy, gridP);
        const w = lerp(SW, 300, gridP);
        const h = lerp(rh - 2, 300, gridP);
        const f = flip(i);
        const showCard = f > 0.5;
        const rot = Math.sin(f * Math.PI) * 90 * (f < 0.5 ? 1 : -1);
        return (
          <Box key={i} x={x} y={y} w={w} h={h} r={lerp(4, 28, f)} bg={showCard ? (i === 0 ? pal.v : pal.card2) : pal.card} style={{ transform: `translateY(${(1 - slabIn) * 140}px) perspective(1400px) rotateX(${rot}deg)`, opacity: slabIn, overflow: "hidden" }}>
            {!showCard &&
              Array.from({ length: 3 }, (_, j) => (
                <div key={j} style={{ position: "absolute", left: 40, top: 24 + j * 44, height: 16, width: `${60 + hash(i, j) * 32}%`, borderRadius: 8, background: pal.faint }} />
              ))}
            {showCard && (
              <>
                <Svg w={300} h={300} style={{ width: "100%", height: "100%" }}>
                  <Icon name={ICONS5[i]} x={150} y={118} size={92} color={i === 0 ? pal.onV : pal.v} width={2.4} p={c01((t - 4.2 - i * 0.12) * 2)} />
                </Svg>
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, textAlign: "center", fontSize: 32, fontWeight: 700, color: i === 0 ? pal.onV : pal.fg, letterSpacing: "-0.02em" }}>{label}</div>
              </>
            )}
          </Box>
        );
      })}
      {/* the blade */}
      <Svg>
        {Array.from({ length: rows - 1 }, (_, k) => {
          const y = sy + (k + 1) * rh;
          const p = c01(cut * 1.4 - k * 0.1);
          return <Paint key={k} d={`M${960 + 280 - SW / 2 - 40},${y} L${960 + 280 + SW / 2 + 40},${y}`} color={pal.v} width={6} p={p} out={c01(cut * 1.4 - k * 0.1 - 0.5) * 2} />;
        })}
        {cut > 0 && cut < 1 && <circle cx={lerp(960 + 280 - SW / 2 - 40, 960 + 280 + SW / 2 + 40, cubicInOut(cut))} cy={sy + rh * (1 + Math.floor(cut * 4))} r={14} fill={pal.v} />}
      </Svg>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={330} size={150} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Read less. Know more."} x={960} y={430} size={48} weight={500} color={pal.muted} font={ff} p={c01((t - 6.8) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/chunk-promo.wav" on={audio} />
    </AbsoluteFill>
  );
}

