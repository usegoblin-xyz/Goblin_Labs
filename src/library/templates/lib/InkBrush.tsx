import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, hash, nameOf, palette, seg, useT } from "../../motion";

type C = { lines: string; tagline: string };

// An ink-and-paper promo: on warm rice paper, three bold brush strokes sweep
// across in turn (each with a dry-brush tail and splatter), each stroke
// carrying a short line in reversed-out type; a red seal stamp presses in
// the corner with the brand initial.
export default function InkBrush({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const lines = [...list(c.lines || "Begin with intent, Move with rhythm, Finish with care"), "Line", "Line", "Line"].slice(0, 3);
  const paper = "#f1e9da";
  const ink = "#16130f";
  const seal = pal.v;
  const at = (i: number) => 0.4 + i * 1.9;
  const stamp = c01((t - 6.4) / 0.25);
  const outro = expInOut(seg(t, 8.6, 0.5));
  const endP = c01((t - 9.0) / 0.8);
  const stroke = (i: number) => {
    const p = cubicInOut(c01((t - at(i)) / 0.7));
    if (p <= 0) return null;
    const y = 250 + i * 270;
    const x0 = i % 2 ? 1760 : 160;
    const dir = i % 2 ? -1 : 1;
    const len = 1600 * p;
    const top: string[] = [];
    const bot: string[] = [];
    const n = 50;
    for (let k = 0; k <= n; k++) {
      const u = (k / n) * p;
      const x = x0 + dir * u * 1600;
      const thick = (110 + Math.sin(u * 9 + i) * 14) * (u < 0.05 ? u / 0.05 : u > 0.85 ? Math.max(0.15, (1 - u) / 0.15) : 1);
      const wob = Math.sin(u * 6 + i * 2) * 14;
      top.push(`${x.toFixed(1)},${(y - thick / 2 + wob + hash(i, k) * 6).toFixed(1)}`);
      bot.unshift(`${x.toFixed(1)},${(y + thick / 2 + wob - hash(k, i) * 10).toFixed(1)}`);
    }
    return (
      <g key={i}>
        <polygon points={[...top, ...bot].join(" ")} fill={ink} />
        {/* dry-brush streaks near the tail */}
        {Array.from({ length: 8 }, (_, s) => {
          const yy = y - 40 + s * 11;
          const tail = x0 + dir * len;
          return <line key={s} x1={tail - dir * (80 + hash(i, s) * 120)} x2={tail + dir * hash(s, i) * 40} y1={yy} y2={yy + 2} stroke={paper} strokeWidth={3} opacity={0.7} />;
        })}
        {/* splatter */}
        {p > 0.9 &&
          Array.from({ length: 10 }, (_, s) => (
            <circle key={s} cx={x0 + dir * (len + 20 + hash(i, s, 1) * 140)} cy={y + (hash(i, s, 2) - 0.5) * 180} r={2 + hash(i, s, 3) * 9} fill={ink} />
          ))}
        <text x={x0 + dir * 120} y={y + 22} textAnchor={dir > 0 ? "start" : "end"} fontFamily={ff} fontSize={64} fontWeight={800} fill={paper} opacity={c01((t - at(i) - 0.4) / 0.4)} letterSpacing="0.02em">
          {lines[i]}
        </text>
      </g>
    );
  };

  return (
    <AbsoluteFill style={{ background: paper, overflow: "hidden", fontFamily: ff }}>
      <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(120,90,50,0.08) 1px, transparent 1.5px)", backgroundSize: "7px 9px" }} />
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          {[0, 1, 2].map(stroke)}
          {stamp > 0 && (
            <g transform={`translate(1700 900) rotate(-6) scale(${1 + (1 - stamp) * 0.6})`} opacity={stamp}>
              <rect x={-90} y={-90} width={180} height={180} rx={14} fill={seal} />
              <rect x={-74} y={-74} width={148} height={148} rx={8} fill="none" stroke={paper} strokeWidth={6} />
              <text y={36} textAnchor="middle" fontFamily={ff} fontSize={110} fontWeight={900} fill={paper}>
                {nameOf(b)[0]}
              </text>
            </g>
          )}
        </Svg>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={520} size={160} weight={900} color={ink} font={ff} p={endP} tracking={-0.03} />
          <Txt text={c.tagline || "Crafted by hand"} x={960} y={630} size={48} weight={600} color={seal} font={ff} p={c01((t - 9.4) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/ink-brush.wav" on={audio} />
    </AbsoluteFill>
  );
}
