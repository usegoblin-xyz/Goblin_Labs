import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { bad: string; good: string; tagline: string };

// A parody: the first half is every motion cliché at once (rainbow word art,
// spinning text, star wipe, clip-art sparkles, a drop shadow from 2003);
// then a record-scratch freeze, the junk falls away, and the same message is
// shown the clean way, in the brand kit.
export default function BadMotion({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const bad = c.bad || "OUR AMAZING PRODUCT!!!";
  const good = c.good || "Your product, shown well.";
  const freeze = t >= 4.2;
  const tb = Math.min(t, 4.2); // bad section clock (frozen after the scratch)
  const fall = expInOut(seg(t, 4.8, 0.9));
  const clean = c01((t - 5.8) / 0.8);
  const endP = c01((t - 7.8) / 0.8);
  const rainbow = ["#ff0000", "#ff8800", "#ffee00", "#00cc44", "#0088ff", "#8833ff"];
  const star = (r: number) =>
    Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
      const rr = i % 2 ? r * 0.45 : r;
      return `${960 + Math.cos(a) * rr},${540 + Math.sin(a) * rr}`;
    }).join(" ");

  return (
    <AbsoluteFill style={{ background: freeze && fall > 0.5 ? pal.bg : "#2a2aff", overflow: "hidden" }}>
      {/* the bad version */}
      {fall < 1 && (
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${fall * 1200}px) rotate(${fall * 8}deg)`, filter: freeze ? "grayscale(0.6)" : undefined }}>
          <div style={{ position: "absolute", inset: 0, background: `repeating-linear-gradient(45deg, #ff00cc 0 40px, #00ffee 40px 80px)`, opacity: 0.35 }} />
          <Svg>
            <polygon points={star(lerp(0, 2200, c01((tb - 0.2) / 0.8)))} fill="#ffee00" opacity={tb < 1.0 ? 1 : 0} />
            {bad.split("").map((ch, i) => {
              const a = tb * 4 + i * 0.5;
              const x = 960 + (i - bad.length / 2) * 62;
              const y = 520 + Math.sin(a) * 60;
              return (
                <text key={i} x={x} y={y} textAnchor="middle" fontFamily='"Comic Sans MS", "Chalkboard SE", cursive' fontSize={110} fontWeight={700} fill={rainbow[i % 6]} stroke="#000" strokeWidth={4} transform={`rotate(${Math.sin(a * 1.3) * 25} ${x} ${y})`} style={{ filter: "drop-shadow(8px 8px 0 #000)" }} opacity={c01((tb - 1.0 - i * 0.04) * 4)}>
                  {ch}
                </text>
              );
            })}
            {Array.from({ length: 14 }, (_, i) => {
              const x = (i * 337) % 1800 + 60;
              const y = (i * 211) % 900 + 90;
              const s = 0.6 + 0.6 * Math.abs(Math.sin(tb * 5 + i));
              return <polygon key={i} points="0,-30 8,-8 30,0 8,8 0,30 -8,8 -30,0 -8,-8" fill="#fff" transform={`translate(${x} ${y}) scale(${s}) rotate(${tb * 200 + i * 30})`} opacity={c01(tb - 1.5)} />;
            })}
            <text x={960} y={860} textAnchor="middle" fontFamily="Times New Roman, serif" fontSize={64} fill="#00ff00" transform={`rotate(${tb * 120} 960 840)`} opacity={c01(tb - 2.2)}>
              ★ Click Here ★
            </text>
          </Svg>
        </div>
      )}
      {/* record scratch label */}
      {freeze && fall < 0.6 && (
        <div style={{ position: "absolute", left: 960, top: 140, transform: `translateX(-50%) scale(${spring(t - 4.2, 18, 0.5)})`, padding: "18px 36px", borderRadius: 14, background: "#111", color: "#fff", fontFamily: ff, fontSize: 48, fontWeight: 800, whiteSpace: "nowrap" }}>
          Wait. Stop.
        </div>
      )}
      {/* the clean version */}
      {clean > 0 && (
        <Svg>
          <Txt text={good} x={960} y={540 + 40} size={fit(good, 1500, 130, 800, -0.04, ff)} weight={800} color={pal.fg} font={ff} p={clean} out={c01((t - 7.5) / 0.3)} tracking={-0.04} />
          <rect x={960 - 120} y={640} width={240 * expOut(seg(t, 6.4, 0.5))} height={10} rx={5} fill={pal.v} opacity={1 - c01((t - 7.5) * 3)} />
        </Svg>
      )}
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Motion with taste."} x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - 8.2) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/bad-motion.wav" on={audio} />
    </AbsoluteFill>
  );
}
