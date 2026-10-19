import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { MONO, Paint, Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, hash, lerp, mix, nameOf, palette, seg, useT } from "../../motion";

type C = { title: string; length: string; span: string };

// A vintage propeller plane drawn on a blueprint: the outline, canopy, wing,
// tail and gear draft in line by line with a top-view inset, dimensions are
// called out, colour floods in, the propeller spins up, the gear tucks away
// and the blueprint dissolves into sky as it flies off.
const PARTS = [
  "M560,520 C560,470 640,450 760,450 L1300,470 L1420,440 L1432,470 L1420,500 L1300,540 L760,560 C640,560 560,560 560,520 Z",
  "M820,452 C850,392 960,386 1004,452",
  "M820,522 L1080,522 L1062,548 L842,548 Z",
  "M1300,470 L1378,352 L1432,352 L1420,440",
  "M1330,490 L1462,488 L1452,506 L1332,506 Z",
];
const DETAIL = ["M700,455 L700,555", "M880,452 L880,560", "M1150,462 L1150,545", "M640,470 L660,470 M640,486 L660,486 M640,502 L660,502"];

export default function BlueprintPlane({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const bp = "#0d3b8e";
  const line = "#dbe7ff";

  const grid = expOut(seg(t, 0, 0.5));
  const draw = (i: number, n: number, a = 0.4, span = 2.4) => expInOut(seg(t, a + (i / n) * span * 0.8, span * 0.35));
  const dims = c01((t - 3.0) / 0.9);
  const fill = expInOut(seg(t, 4.2, 0.9));
  const spin = c01((t - 5.1) / 0.6);
  const gear = expInOut(seg(t, 5.8, 0.6));
  const sky = expInOut(seg(t, 5.8, 1.0));
  const fly = expInOut(seg(t, 6.4, 1.8));
  const titleP = c01((t - 8.1) / 0.6);

  const px = lerp(0, 1500, fly);
  const py = lerp(0, -260, fly) + Math.sin(t * 2) * 6 * sky;
  const bank = Math.sin(fly * Math.PI) * -6;
  const bladeAngle = t * 40 * spin * spin;
  const bladeScale = spin > 0.6 ? 1 : Math.cos(bladeAngle);

  return (
    <AbsoluteFill style={{ background: mix(bp, "#8fc8f4", sky), overflow: "hidden", fontFamily: ff }}>
      <Svg>
        {/* blueprint grid */}
        <g opacity={grid * (1 - sky) * 0.35} stroke={line} strokeWidth={1}>
          {Array.from({ length: 49 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 40} x2={i * 40} y1={0} y2={1080} strokeWidth={i % 5 ? 0.6 : 1.4} />
          ))}
          {Array.from({ length: 28 }).map((_, j) => (
            <line key={`h${j}`} y1={j * 40} y2={j * 40} x1={0} x2={1920} strokeWidth={j % 5 ? 0.6 : 1.4} />
          ))}
        </g>
        {/* clouds once airborne */}
        {sky > 0 &&
          Array.from({ length: 6 }).map((_, i) => {
            const x = (((i * 420 - t * 380 * fly) % 2300) + 2300) % 2300 - 200;
            const y = 180 + hash(i, 2) * 600;
            return <ellipse key={i} cx={x} cy={y} rx={160 + hash(i, 3) * 120} ry={40} fill="#ffffff" opacity={0.75 * sky} />;
          })}
        {/* title block */}
        <g opacity={(1 - sky) * grid} fontFamily={MONO} fill={line} fontSize={20}>
          <rect x={1460} y={880} width={400} height={150} fill="none" stroke={line} strokeWidth={2} />
          <text x={1480} y={920}>DWG NO. 01-A</text>
          <text x={1480} y={960}>{(c.title || "Prop Plane").toUpperCase()}</text>
          <text x={1480} y={1000}>SCALE 1:48 · SIDE ELEV.</text>
        </g>
        {/* top-view inset */}
        <g opacity={1 - sky} transform="translate(140 110) scale(0.42)" stroke={line} strokeWidth={4} fill="none">
          <Paint d="M100,300 L700,300" color={line} width={10} p={draw(0, 3, 0.6)} />
          <Paint d="M330,40 L380,40 L420,560 L370,560 Z" color={line} width={5} p={draw(1, 3, 0.6)} />
          <Paint d="M620,210 L660,210 L680,390 L640,390 Z" color={line} width={5} p={draw(2, 3, 0.6)} />
        </g>
        {/* the plane */}
        <g transform={`translate(${px} ${py}) rotate(${bank} 960 520)`}>
          {fill > 0 && (
            <g opacity={fill}>
              <path d={PARTS[0]} fill={pal.p} />
              <path d={`${PARTS[1]} Z`} fill="#bfe6ff" />
              <path d={PARTS[2]} fill={mix(pal.p, "#000000", 0.25)} />
              <path d={`${PARTS[3]} Z`} fill={pal.p} />
              <path d={PARTS[4]} fill={mix(pal.p, "#000000", 0.2)} />
              <rect x={1180} y={478} width={60} height={56} fill="#ffffff" opacity={0.85} />
              <circle cx={1210} cy={506} r={18} fill={pal.a} />
            </g>
          )}
          {PARTS.map((d, i) => (
            <Paint key={i} d={d} color={fill > 0.5 ? mix(line, "#0b0b0c", fill) : line} width={4} p={draw(i, PARTS.length)} />
          ))}
          {DETAIL.map((d, i) => (
            <Paint key={`d${i}`} d={d} color={fill > 0.5 ? "#0b0b0c" : line} width={2} p={draw(i, DETAIL.length, 1.9, 1.2)} opacity={0.7} />
          ))}
          {/* gear */}
          <g transform={`translate(0 ${-gear * 90})`} opacity={1 - gear}>
            <Paint d="M905,548 L905,610" color={fill > 0.5 ? "#2b2b2e" : line} width={8} p={draw(0, 1, 2.2, 0.6)} />
            <circle cx={905} cy={640} r={30} fill={fill > 0.5 ? "#2b2b2e" : "none"} stroke={line} strokeWidth={4} opacity={draw(0, 1, 2.3, 0.6)} />
            <circle cx={1392} cy={572} r={12} fill={fill > 0.5 ? "#2b2b2e" : "none"} stroke={line} strokeWidth={3} opacity={draw(0, 1, 2.4, 0.6)} />
          </g>
          {/* spinner + prop */}
          <path d="M560,500 L524,515 L560,532 Z" fill={fill > 0.5 ? "#e8e8e8" : "none"} stroke={line} strokeWidth={3} opacity={draw(0, 1, 2.5, 0.5)} />
          <g transform={`translate(532 516) scale(1 ${bladeScale})`} opacity={draw(0, 1, 2.5, 0.5)}>
            <rect x={-6} y={-140} width={12} height={280} rx={6} fill={fill > 0.5 ? "#2b2b2e" : line} opacity={1 - spin * 0.7} />
          </g>
          {spin > 0.3 && <ellipse cx={532} cy={516} rx={10} ry={140} fill="#ffffff" opacity={0.18 * spin} />}
        </g>
        {/* dimensions */}
        <g opacity={dims * (1 - sky)} fontFamily={MONO} fill={line} fontSize={24}>
          <Paint d="M560,720 L1432,720 M560,700 L560,740 M1432,700 L1432,740" color={line} width={2} p={dims} />
          <text x={996} y={760} textAnchor="middle">{`L = ${c.length || "11.8 m"}`}</text>
          <Paint d="M1520,352 L1520,670 M1500,352 L1540,352 M1500,670 L1540,670" color={line} width={2} p={dims} />
          <text x={1560} y={520}>H = 4.8 m</text>
          <text x={300} y={380} textAnchor="middle">{`SPAN ${c.span || "15.2 m"}`}</text>
        </g>
        {titleP > 0 && (
          <>
            <Txt text={c.title || "Prop Plane"} x={960} y={520} size={fit(c.title || "Prop Plane", 1400, 170, 900)} weight={900} color="#0b2e6b" font={ff} p={titleP} tracking={-0.04} />
            <Txt text={name} x={960} y={620} size={52} weight={700} color="#ffffff" font={ff} p={c01((t - 8.5) / 0.5)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/blueprint-plane.wav" on={audio} />
    </AbsoluteFill>
  );
}
