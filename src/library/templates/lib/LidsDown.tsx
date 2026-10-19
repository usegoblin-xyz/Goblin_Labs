import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { apps: string; tagline: string };

// A screen-time app: a laptop glows late at night with app usage bars
// growing; a gentle wind-down prompt appears, the bars shrink as limits
// kick in, the laptop lid closes with a soft click, the room goes dark,
// a moon rises in the window and a sleep score fills.
export default function LidsDown({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const apps = [...list(c.apps || "Video, Social, Email, Games"), "App", "App", "App", "App"].slice(0, 4);
  const usage = [2.4, 1.8, 0.9, 1.2];
  const limit = [0.8, 0.5, 0.4, 0.3];
  const grow = cubicInOut(c01((t - 0.4) / 1.2));
  const prompt = spring(t - 2.0, 14, 0.6);
  const shrink = cubicInOut(c01((t - 3.0) / 0.9));
  const lid = cubicInOut(c01((t - 4.4) / 0.9));
  const dark = c01((t - 5.0) / 0.8);
  const moon = expInOut(seg(t, 5.6, 1.2));
  const score = c01((t - 6.6) / 1.2);
  const outro = expInOut(seg(t, 8.8, 0.5));
  const endP = c01((t - 9.2) / 0.8);
  const LX = 960;
  const LY = 760;
  const SW = 760;
  const SH = 470;
  const screenGlow = 1 - lid;

  return (
    <AbsoluteFill style={{ background: lerp(0, 1, dark) > 0.5 ? "#05060c" : "#141526", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          {/* window with night sky */}
          <rect x={1380} y={120} width={380} height={300} rx={10} fill="#0b1030" stroke="#2a2d48" strokeWidth={10} />
          <circle cx={1570} cy={lerp(460, 250, moon)} r={50} fill="#f6f0d8" opacity={moon} />
          <line x1={1570} y1={120} x2={1570} y2={420} stroke="#2a2d48" strokeWidth={8} />
          {/* desk */}
          <rect x={0} y={LY} width={1920} height={320} fill="#1d1a24" />
          {/* screen glow on wall */}
          <ellipse cx={LX} cy={LY - 260} rx={700} ry={420} fill="#8fb4ff" opacity={0.12 * screenGlow * (1 - dark)} />
          {/* laptop base */}
          <path d={`M${LX - SW / 2 - 40},${LY} L${LX + SW / 2 + 40},${LY} L${LX + SW / 2 + 70},${LY + 26} L${LX - SW / 2 - 70},${LY + 26} Z`} fill="#3a3b44" />
          {/* lid */}
          <g transform={`translate(${LX} ${LY}) scale(1 ${Math.cos(lid * Math.PI * 0.5)}) translate(${-LX} ${-LY})`}>
            <rect x={LX - SW / 2} y={LY - SH} width={SW} height={SH} rx={18} fill="#2a2b33" />
            <rect x={LX - SW / 2 + 16} y={LY - SH + 16} width={SW - 32} height={SH - 32} rx={8} fill={pal.dark ? "#0f1016" : "#f4f5f8"} opacity={screenGlow} />
          </g>
        </Svg>
        {/* usage UI inside the screen */}
        {lid < 0.3 && (
          <div style={{ position: "absolute", left: LX - SW / 2 + 50, top: LY - SH + 50, width: SW - 100, opacity: 1 - lid * 3 }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: pal.fg }}>Today · 11:48 PM</div>
            {apps.map((a, i) => {
              const v = lerp(usage[i] * grow, limit[i], shrink);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 22 }}>
                  <div style={{ width: 120, fontSize: 24, color: pal.muted }}>{a}</div>
                  <div style={{ height: 26, width: `${(v / 2.6) * 70}%`, borderRadius: 13, background: shrink > 0.5 ? "#2fbf71" : ["#e5484d", pal.a, "#38a3ff", "#f28ab2"][i] }} />
                  <div style={{ fontSize: 22, color: pal.fg, fontVariantNumeric: "tabular-nums" }}>{v.toFixed(1)}h</div>
                </div>
              );
            })}
          </div>
        )}
        {prompt > 0.01 && lid < 0.5 && (
          <div style={{ position: "absolute", left: LX + SW / 2 - 330, top: LY - SH - 90, width: 420, padding: "22px 28px", borderRadius: 24, background: pal.card, transform: `scale(${prompt})`, transformOrigin: "100% 100%", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
            <div style={{ fontSize: 26, color: pal.muted }}>🌙 Wind-down time</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: pal.fg }}>Close up for the night?</div>
          </div>
        )}
        {score > 0 && (
          <Svg>
            <g transform="translate(560 330)">
              <circle r={120} fill="none" stroke="#1e2133" strokeWidth={20} />
              <circle r={120} fill="none" stroke="#8fb4ff" strokeWidth={20} strokeLinecap="round" pathLength={1} strokeDasharray={`${score * 0.92} 2`} transform="rotate(-90)" />
              <text y={18} textAnchor="middle" fontFamily={ff} fontSize={64} fontWeight={900} fill="#fff">
                {Math.round(score * 92)}
              </text>
              <text y={170} textAnchor="middle" fontFamily={ff} fontSize={30} fill="#9aa3c8">
                sleep score
              </text>
            </g>
          </Svg>
        )}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="Lids down. Lights out." x={960} y={500} size={120} weight={800} color="#fff" font={ff} p={endP} tracking={-0.04} />
          <Txt text={`${nameOf(b)} · ${c.tagline || "screen time that winds you down"}`} x={960} y={620} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 9.6) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/lids-down.wav" on={audio} />
    </AbsoluteFill>
  );
}
