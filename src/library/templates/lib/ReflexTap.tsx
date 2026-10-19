import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, expInOut, fontOf, hash, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { headline: string; tagline: string };

// A reflex brand reel: targets pop up at random spots on a dark field; a
// tap ripple hits each one a beat later and a reaction time in ms flashes
// beside it, getting faster each round; the times stack into a column, the
// best one is circled, and the brand line lands.
export default function ReflexTap({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const N = 7;
  const times = [312, 268, 241, 219, 197, 183, 164];
  const at = (i: number) => 0.6 + i * 0.75 - i * i * 0.012;
  const hitAt = (i: number) => at(i) + times[i] / 1000;
  const stack = expInOut(seg(t, 6.4, 0.6));
  const outro = expInOut(seg(t, 8.6, 0.5));
  const endP = c01((t - 7.4) / 0.8);
  const pos = (i: number) => ({ x: 260 + hash(i, 1) * 1400, y: 180 + hash(i, 2) * 700 });

  return (
    <AbsoluteFill style={{ background: "#07070a", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          {Array.from({ length: N }, (_, i) => {
            const p = pos(i);
            const s = spring(t - at(i), 22, 0.45);
            const hit = t > hitAt(i);
            const hu = c01((t - hitAt(i)) / 0.5);
            if (t < at(i) || stack > 0.9) return null;
            return (
              <g key={i} opacity={1 - stack}>
                {!hit && (
                  <g transform={`translate(${p.x} ${p.y}) scale(${s})`}>
                    <circle r={70} fill="none" stroke={pal.v} strokeWidth={8} />
                    <circle r={40} fill="none" stroke={pal.v} strokeWidth={8} />
                    <circle r={12} fill={pal.v} />
                  </g>
                )}
                {hit && hu < 1 && <circle cx={p.x} cy={p.y} r={70 + hu * 120} fill="none" stroke="#fff" strokeWidth={6 * (1 - hu)} />}
                {hit && (
                  <text x={p.x} y={p.y + 20} textAnchor="middle" fontFamily={MONO} fontSize={60} fontWeight={700} fill={i === N - 1 ? pal.v : "#fff"} opacity={1 - c01((t - hitAt(i) - 0.6) * 2)}>
                    {times[i]}ms
                  </text>
                )}
              </g>
            );
          })}
          {/* stacked results */}
          {stack > 0 &&
            times.map((ms, i) => (
              <g key={i} opacity={stack} transform={`translate(${1500} ${180 + i * 100})`}>
                <rect x={-20} y={-60} width={300 * (ms / 320)} height={70} rx={10} fill={i === N - 1 ? pal.v : "#1c1c22"} />
                <text x={0} y={-12} fontFamily={MONO} fontSize={44} fill={i === N - 1 ? pal.onV : "#fff"}>
                  {ms}ms
                </text>
              </g>
            ))}
          {stack > 0.8 && <circle cx={1580} cy={180 + 6 * 100 - 25} r={110 * spring(t - 6.9, 16, 0.5)} fill="none" stroke="#fff" strokeWidth={6} />}
          {endP > 0 && (
            <>
              <Txt text={c.headline || "Faster than a blink."} x={720} y={520} size={110} weight={900} color="#fff" font={ff} p={endP} tracking={-0.04} />
              <Txt text={`${nameOf(b)} · ${c.tagline || "train your reflexes"}`} x={720} y={630} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 7.8) / 0.6)} mode="fade" />
            </>
          )}
        </Svg>
      </div>
      <Track src="tracks/reflex-tap.wav" on={audio} />
    </AbsoluteFill>
  );
}
