import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, lum, nameOf, palette, seg, useT } from "../../motion";

type C = { colors: string; names: string; role: string };

// A colour showreel: a paint swatch deck pivots open like a fan from its
// pin; each swatch in turn swings to the front, grows to fill the frame and
// floods the background with its colour while the name and hex type in;
// then the fan closes and the brand colour holds.
export default function SwatchFan({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const colors = [...list(c.colors || `${pal.v}, #ff6b4a, #ffd23f, #3bc9db, #7048e8`), "#888", "#888", "#888", "#888", "#888"].slice(0, 5);
  const names = [...list(c.names || "Signal, Ember, Sunbeam, Lagoon, Ultra"), "Colour", "Colour", "Colour", "Colour", "Colour"].slice(0, 5);
  const open = cubicInOut(c01((t - 0.3) / 0.9)) * (1 - cubicInOut(c01((t - 7.6) / 0.6)));
  const per = 1.2;
  const start = 1.4;
  const k = Math.min(4, Math.max(-1, Math.floor((t - start) / per)));
  const u = t - start - k * per;
  const flood = k >= 0 && t < start + per * 5 ? cubicInOut(c01(u / 0.35)) * (1 - cubicInOut(c01((u - per + 0.25) / 0.25))) : 0;
  const bg = k >= 0 && flood > 0.02 ? colors[k] : pal.bg;
  const outro = expInOut(seg(t, 9.0, 0.5));
  const fg = (hex: string) => (lum(hex) > 0.5 ? "#111" : "#fff");
  const PX = 960;
  const PY = 920;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <AbsoluteFill style={{ background: bg, clipPath: `circle(${flood * 130}% at 50% 85%)` }} />
      <div style={{ position: "absolute", inset: 0, opacity: (1 - outro) * (1 - c01((t - 7.9) * 3)) }}>
        <Svg>
          {colors.map((col, i) => {
            const a = (i - 2) * 16 * open;
            const front = k === i ? flood : 0;
            return (
              <g key={i} transform={`translate(${PX} ${PY}) rotate(${a * (1 - front)}) scale(${1 + front * 0.15})`} opacity={k === i && flood > 0.95 ? 0 : 1}>
                <rect x={-90} y={-640} width={180} height={680} rx={18} fill="#fff" stroke="#00000022" strokeWidth={2} />
                <rect x={-80} y={-630} width={160} height={480} rx={10} fill={col} />
                <text x={0} y={-110} textAnchor="middle" fontFamily={ff} fontSize={28} fontWeight={800} fill="#222">
                  {names[i]}
                </text>
                <text x={0} y={-70} textAnchor="middle" fontFamily={MONO} fontSize={22} fill="#777">
                  {col.toUpperCase()}
                </text>
              </g>
            );
          })}
          <circle cx={PX} cy={PY} r={18} fill="#ccc" stroke="#888" strokeWidth={4} />
          {k >= 0 && flood > 0.6 && t < start + per * 5 && (
            <>
              <Txt text={names[k]} x={960} y={420} size={190} weight={900} color={fg(colors[k])} font={ff} p={c01((u - 0.2) / 0.3)} tracking={-0.04} />
              <Txt text={colors[k].toUpperCase()} x={960} y={520} size={50} weight={600} color={fg(colors[k])} font={MONO} p={c01((u - 0.3) / 0.4)} mode="type" />
            </>
          )}
        </Svg>
      </div>
      {t > 8.2 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={520} size={160} weight={900} color={pal.fg} font={ff} p={c01((t - 8.2) / 0.6)} tracking={-0.04} />
          <Txt text={c.role || "Colour & identity"} x={960} y={630} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 8.6) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/swatch-fan.wav" on={audio} />
    </AbsoluteFill>
  );
}
