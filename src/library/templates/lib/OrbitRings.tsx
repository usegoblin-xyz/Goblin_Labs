import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, expOut, fontOf, nameOf, palette, seg, useT } from "../../motion";

type C = { rings: string; role: string };

// A ring showreel: four concentric rings of text set on circular paths spin
// at different speeds and directions; they drop in one by one, the camera
// tilts the stack into 3D, then the rings collapse into the centre and burst
// out as the name.
export default function OrbitRings({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const rings = [...list(c.rings || "DESIGN, MOTION, IDENTITY, CRAFT"), "MOTION", "MOTION", "MOTION", "MOTION"].slice(0, 4);
  const R = [140, 240, 340, 440];
  const tilt = expInOut(seg(t, 3.6, 1.2)) * (1 - expInOut(seg(t, 6.2, 0.8)));
  const collapse = expInOut(seg(t, 7.0, 0.7));
  const endP = c01((t - 7.6) / 0.6);
  const cols = [pal.v, pal.fg, pal.a, pal.fg];

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff, perspective: 1600 }}>
      <div style={{ position: "absolute", inset: 0, transform: `rotateX(${tilt * 58}deg) rotateZ(${tilt * -12}deg)`, opacity: 1 - c01((collapse - 0.8) * 5) }}>
        <Svg>
          <defs>
            {R.map((r, i) => (
              <path key={i} id={`or-ring-${i}`} d={`M960,${540 - r} a${r},${r} 0 1,1 -0.01,0`} />
            ))}
          </defs>
          {R.map((r, i) => {
            const inP = expOut(c01((t - 0.3 - i * 0.4) / 0.8));
            const dir = i % 2 ? -1 : 1;
            const speed = 40 - i * 7;
            const rr = r * (1 - collapse);
            const size = 34 + i * 10;
            const reps = Math.max(1, Math.floor((2 * Math.PI * r) / ((rings[i].length + 3) * size * 0.68)));
            const text = Array.from({ length: reps }, () => `${rings[i]} • `).join("");
            return (
              <g key={i} transform={`translate(960 540) rotate(${t * speed * dir}) scale(${inP * (rr / r || 0.001)}) translate(-960 -540)`} opacity={inP}>
                <circle cx={960} cy={540} r={r} fill="none" stroke={pal.line} strokeWidth={2} />
                <text fontFamily={ff} fontSize={size} fontWeight={900} fill={cols[i]} letterSpacing="0.06em" dominantBaseline="middle">
                  <textPath href={`#or-ring-${i}`} textLength={2 * Math.PI * r * 0.995} lengthAdjust="spacing">
                    {text}
                  </textPath>
                </text>
              </g>
            );
          })}
          <circle cx={960} cy={540} r={40 + collapse * 30} fill={pal.v} opacity={1 - endP} />
        </Svg>
      </div>
      {endP > 0 && (
        <Svg>
          <circle cx={960} cy={540} r={endP * 1400} fill={pal.v} opacity={0.15 * (1 - endP)} />
          <Txt text={nameOf(b)} x={960} y={560} size={180} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.04} mode="scale" />
          <Txt text={c.role || "Studio for motion"} x={960} y={670} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 8.0) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/orbit-rings.wav" on={audio} />
    </AbsoluteFill>
  );
}
