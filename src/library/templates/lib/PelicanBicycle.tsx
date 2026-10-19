import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expOut, fit, fontOf, hash, kf, mix, nameOf, palette, seg, useT } from "../../motion";

type C = { title: string };

// A pelican rides a bicycle through a summer afternoon. The wheels, crank and
// chain turn with the distance travelled, each leg is solved with two-bone IK
// so the webbed feet stay on the pedals, the pouch wobbles with every stroke,
// and it rings its bell before the title rolls in.
const R = 118; // wheel radius
const REAR = [720, 742] as const;
const FRONT = [1090, 742] as const;
const BB = [890, 752] as const;
const CRANK = 50;
const HIP = [846, 566] as const;
const THIGH = 128;
const SHIN = 132;
const GROUND = 860;

function ik(hip: readonly [number, number], foot: [number, number]) {
  const dx = foot[0] - hip[0];
  const dy = foot[1] - hip[1];
  const d = Math.min(THIGH + SHIN - 1, Math.max(Math.abs(THIGH - SHIN) + 1, Math.hypot(dx, dy)));
  const base = Math.atan2(dy, dx);
  const a = Math.acos((THIGH * THIGH + d * d - SHIN * SHIN) / (2 * THIGH * d));
  const ang = base - a; // knee forward (toward +x)
  return [hip[0] + Math.cos(ang) * THIGH, hip[1] + Math.sin(ang) * THIGH] as [number, number];
}

export default function PelicanBicycle({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);

  const dist = kf(t, [[0, 0], [1.2, 260], [10, 3200]], (x) => x);
  const wheel = (dist / R) * (180 / Math.PI);
  const crank = (dist / R) * 0.62;
  const bob = Math.sin(crank * 2) * 4;
  const bell = t > 6.3 && t < 6.9;
  const titleP = expOut(seg(t, 7.6, 0.8));
  const title = c.title || "Pelican on a Bicycle";

  const pedal = (k: number): [number, number] => [BB[0] + Math.cos(crank + k * Math.PI) * CRANK, BB[1] + Math.sin(crank + k * Math.PI) * CRANK];
  const hip: [number, number] = [HIP[0], HIP[1] + bob];
  const leg = (k: number, color: string) => {
    const foot = pedal(k);
    const knee = ik(hip, foot);
    return (
      <g>
        <path d={`M${hip[0]},${hip[1]} L${knee[0]},${knee[1]} L${foot[0]},${foot[1]}`} fill="none" stroke={color} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M${foot[0] - 14},${foot[1] - 6} L${foot[0] + 34},${foot[1] - 10} L${foot[0] + 40},${foot[1] + 4} L${foot[0] + 24},${foot[1] + 6} L${foot[0] + 12},${foot[1] + 12} L${foot[0] - 16},${foot[1] + 6} Z`} fill={color} />
      </g>
    );
  };
  const spokes = (cx: number, cy: number) =>
    Array.from({ length: 16 }).map((_, i) => {
      const a = ((wheel + i * 22.5) * Math.PI) / 180;
      return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(a) * (R - 8)} y2={cy + Math.sin(a) * (R - 8)} stroke="#9aa0a6" strokeWidth={2} />;
    });

  const sky1 = "#ffd9b8";
  const sky2 = "#9fd3ee";
  const pouchSag = 10 + Math.sin(crank * 2 + 0.6) * 6;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${sky2}, ${sky1})`, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        <circle cx={1560} cy={230} r={90} fill="#fff4c8" />
        {/* clouds */}
        {Array.from({ length: 5 }).map((_, i) => {
          const x = (((i * 520 - dist * 0.08) % 2600) + 2600) % 2600 - 300;
          const y = 140 + hash(i, 1) * 180;
          return (
            <g key={i} transform={`translate(${x} ${y})`} opacity={0.9}>
              <ellipse cx={0} cy={0} rx={110} ry={34} fill="#fff" />
              <ellipse cx={-40} cy={-22} rx={60} ry={36} fill="#fff" />
              <ellipse cx={40} cy={-28} rx={70} ry={42} fill="#fff" />
            </g>
          );
        })}
        {/* hills */}
        {[0, 1].map((k) => {
          const sp = k ? 0.35 : 0.15;
          const pts: string[] = [];
          for (let x = -100; x <= 2020; x += 60) {
            const wx = x + dist * sp;
            pts.push(`${x},${(k ? 700 : 620) - 70 * Math.sin(wx * 0.004 + k) - 30 * Math.sin(wx * 0.011)}`);
          }
          return <path key={k} d={`M-100,1080 L${pts.join(" L")} L2020,1080 Z`} fill={k ? "#8cc47a" : "#b5d99b"} />;
        })}
        {/* road */}
        <rect x={0} y={GROUND - 10} width={1920} height={240} fill="#6f6a66" />
        <rect x={0} y={GROUND - 14} width={1920} height={8} fill="#8a847e" />
        {Array.from({ length: 12 }).map((_, i) => {
          const x = (((i * 200 - dist) % 2400) + 2400) % 2400 - 200;
          return <rect key={i} x={x} y={GROUND + 90} width={110} height={14} rx={7} fill="#f2efe8" />;
        })}
        {/* far leg behind the bike */}
        {leg(1, "#d98a2b")}
        {/* bike */}
        <g>
          {[REAR, FRONT].map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r={R} fill="none" stroke="#2b2b2e" strokeWidth={14} />
              <circle cx={cx} cy={cy} r={R - 8} fill="none" stroke="#c9ccd1" strokeWidth={3} />
              {spokes(cx, cy)}
              <circle cx={cx} cy={cy} r={10} fill="#2b2b2e" />
            </g>
          ))}
          <g stroke={pal.p} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d={`M${REAR[0]},${REAR[1]} L${BB[0]},${BB[1]} L${HIP[0] + 4},${HIP[1] + 18} Z`} />
            <path d={`M${HIP[0] + 4},${HIP[1] + 18} L${1035},${585} L${BB[0]},${BB[1]}`} />
            <path d={`M${1035},${585} L${1045},${548} M${1035},${585} L${FRONT[0]},${FRONT[1]}`} />
          </g>
          <path d={`M1045,548 L1030,520 L1070,512`} stroke="#2b2b2e" strokeWidth={10} strokeLinecap="round" fill="none" />
          <rect x={HIP[0] - 34} y={HIP[1] + 6} width={68} height={16} rx={8} fill="#2b2b2e" />
          {/* bell */}
          <g transform={`translate(1052 ${512}) rotate(${bell ? Math.sin(t * 60) * 18 : 0})`}>
            <path d="M-12,0 a12,12 0 0 1 24,0 Z" fill="#f2c94c" />
          </g>
          {bell && (
            <g stroke="#2b2b2e" strokeWidth={4} strokeLinecap="round" opacity={0.7}>
              <path d="M1085,470 l18,-18 M1095,492 l24,-6 M1070,456 l4,-24" />
            </g>
          )}
          {/* chainring + chain */}
          <circle cx={BB[0]} cy={BB[1]} r={34} fill="none" stroke="#2b2b2e" strokeWidth={8} strokeDasharray="6 5" strokeDashoffset={-crank * 30} />
          <path d={`M${BB[0]},${BB[1] - 34} L${REAR[0]},${REAR[1] - 16} M${BB[0]},${BB[1] + 34} L${REAR[0]},${REAR[1] + 16}`} stroke="#2b2b2e" strokeWidth={5} strokeDasharray="8 5" strokeDashoffset={-crank * 30} />
        </g>
        {/* pelican body */}
        <g transform={`translate(0 ${bob})`}>
          <path d="M740,470 L660,452 L676,488 L640,500 L744,508 Z" fill="#e9e6df" />
          <ellipse cx={860} cy={470} rx={130} ry={86} fill="#ffffff" transform="rotate(-14 860 470)" />
          <ellipse cx={850} cy={500} rx={110} ry={46} fill="#e6e2da" transform="rotate(-14 850 500)" />
          {/* neck */}
          <path d={`M930,420 C990,380 930,300 975,250 C1000,222 1030,218 1040,236`} fill="none" stroke="#ffffff" strokeWidth={40} strokeLinecap="round" />
          <path d={`M930,420 C990,380 930,300 975,250`} fill="none" stroke="#ece8e1" strokeWidth={12} strokeLinecap="round" opacity={0.6} transform="translate(-8 4)" />
          {/* head */}
          <circle cx={1022} cy={236} r={36} fill="#ffffff" />
          <path d="M992,214 q24,-26 52,-8" fill="none" stroke="#f2d08a" strokeWidth={10} strokeLinecap="round" />
          <circle cx={1034} cy={228} r={6} fill="#1d1d1f" />
          {/* beak + pouch */}
          <path d={`M1050,232 L1268,262 L1262,272 L1052,250 Z`} fill="#f2c27a" />
          <path d={`M1052,250 Q1150,${296 + pouchSag} 1262,272 Q1160,${276 + pouchSag * 0.4} 1052,250 Z`} fill="#f08a3c" />
          <path d="M1264,262 q10,4 8,14 l-8,-4 Z" fill="#d9572e" />
          {/* wing reaching the handlebar */}
          <path d={`M900,430 C960,440 1010,470 1058,512 C1020,520 960,520 900,500 C860,486 850,450 900,430 Z`} fill="#f2f0ec" stroke="#d9d4cb" strokeWidth={3} />
          <path d="M1000,500 l26,10 M985,508 l24,12 M970,512 l22,12" stroke="#2b2b2e" strokeWidth={4} strokeLinecap="round" opacity={0.75} />
        </g>
        {/* near leg in front */}
        {leg(0, "#f0a03c")}
        {/* title */}
        {titleP > 0 && (
          <g opacity={titleP} transform={`translate(0 ${(1 - titleP) * -40})`}>
            <rect x={960 - 640} y={70} width={1280} height={170} rx={30} fill={mix(pal.bg, "#ffffff", pal.dark ? 0 : 0.2)} opacity={0.92} />
            <Txt text={title} x={960} y={170} size={fit(title, 1180, 96, 900)} weight={900} color={pal.fg} font={ff} p={c01((t - 7.8) / 0.6)} tracking={-0.03} />
            <Txt text={name} x={960} y={222} size={30} weight={600} color={pal.p} font={ff} p={c01((t - 8.3) / 0.5)} mode="fade" />
          </g>
        )}
      </Svg>
      <Track src="tracks/pelican-bicycle.wav" on={audio} />
    </AbsoluteFill>
  );
}

