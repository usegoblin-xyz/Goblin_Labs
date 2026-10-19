import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, fontOf, hash, nameOf, palette, seg, useT } from "../../motion";

type C = { lines: string; title: string };

// A short about the last light: in a dark forest one small firefly drifts
// between silhouetted trees; wherever it passes, it touches a dim bud of
// light that wakes up, until the whole forest glows; captions narrate in
// three short lines, and the title card fades up.
export default function LastLight({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const lines = [...(c.lines || "Everyone said the forest had gone dark. | One small light kept going anyway. | Light, it turns out, is contagious.").split("|").map((s) => s.trim()), "", "", ""].slice(0, 3);
  const glow = "#ffe9a3";
  const path = (u: number) => ({ x: 120 + u * 1680, y: 560 + Math.sin(u * Math.PI * 3) * 180 - Math.sin(u * 9) * 40 });
  const fly = c01((t - 0.6) / 6.4);
  const fp = path(fly);
  const bloom = expInOut(seg(t, 7.0, 1.2));
  const outro = expInOut(seg(t, 10.4, 0.5));
  const N = 34;
  const buds = Array.from({ length: N }, (_, i) => {
    const u = hash(i, 1);
    const p = path(u);
    return { x: p.x + (hash(i, 2) - 0.5) * 300, y: p.y + (hash(i, 3) - 0.5) * 340, u };
  });
  const line = t < 2.8 ? 0 : t < 5.4 ? 1 : 2;
  const lineAt = [0.4, 2.8, 5.4][line];
  const trees = Array.from({ length: 14 }, (_, i) => ({ x: i * 150 + hash(i) * 60, h: 600 + hash(i, 4) * 300, w: 40 + hash(i, 5) * 40 }));

  return (
    <AbsoluteFill style={{ background: "#03040a", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          <defs>
            <radialGradient id="ll-g">
              <stop offset="0" stopColor={glow} stopOpacity={1} />
              <stop offset="0.3" stopColor={glow} stopOpacity={0.5} />
              <stop offset="1" stopColor={glow} stopOpacity={0} />
            </radialGradient>
          </defs>
          {/* ambient bloom */}
          <rect width={1920} height={1080} fill="#1a1a2e" opacity={bloom * 0.7} />
          {/* trees */}
          {trees.map((tr, i) => (
            <g key={i} opacity={0.9}>
              <rect x={tr.x} y={1080 - tr.h} width={tr.w} height={tr.h} fill="#06070d" />
              {Array.from({ length: 4 }, (_, k) => (
                <path key={k} d={`M${tr.x + tr.w / 2},${1080 - tr.h + 60 + k * 120} l${(k % 2 ? 1 : -1) * 140},-70`} stroke="#06070d" strokeWidth={14} />
              ))}
            </g>
          ))}
          {/* buds */}
          {buds.map((bd, i) => {
            const lit = fly > bd.u ? c01((t - 0.6 - bd.u * 6.4) / 0.5) : 0;
            const v = Math.max(lit, bloom * c01(bloom * 2 - hash(i) * 0.6));
            const flick = 0.85 + 0.15 * Math.sin(t * 6 + i);
            return (
              <g key={i}>
                <circle cx={bd.x} cy={bd.y} r={60 * v * flick} fill="url(#ll-g)" opacity={0.8} />
                <circle cx={bd.x} cy={bd.y} r={4 + v * 4} fill={v > 0.1 ? glow : "#2a2a35"} />
              </g>
            );
          })}
          {/* the firefly and its trail */}
          {fly > 0 &&
            Array.from({ length: 16 }, (_, k) => {
              const p = path(Math.max(0, fly - k * 0.006));
              return <circle key={k} cx={p.x} cy={p.y} r={6 - k * 0.3} fill={glow} opacity={(1 - k / 16) * 0.6} />;
            })}
          <circle cx={fp.x} cy={fp.y} r={110} fill="url(#ll-g)" opacity={0.7 + Math.sin(t * 8) * 0.1} />
          <circle cx={fp.x} cy={fp.y} r={10} fill="#fff" />
          {/* caption */}
          {t < 7.2 && <Txt key={line} text={lines[line]} x={960} y={980} size={46} weight={500} color="#e8e6f0" font={ff} p={c01((t - lineAt) / 0.8)} out={c01((t - lineAt - 2.2) / 0.3)} mode="blur" italic />}
          {t > 8.0 && (
            <>
              <Txt text={c.title || "The Last Light"} x={960} y={500} size={130} weight={300} color={glow} font={ff} p={c01((t - 8.0) / 1.0)} tracking={0.05} mode="blur" />
              <Txt text={nameOf(b)} x={960} y={600} size={36} weight={600} color="#c8c6d8" font={ff} p={c01((t - 8.8) / 0.8)} tracking={0.3} mode="fade" />
            </>
          )}
        </Svg>
      </div>
      <Track src="tracks/last-light.wav" on={audio} />
    </AbsoluteFill>
  );
}

