import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, fit, fontOf, hash, lerp, nameOf, palette, useT } from "../../motion";

type C = { title: string };

// A samurai performs a kata in one spot: ready stance, overhead raise, a
// downward cut, a horizontal sweep, a rising thrust and the finish. The body
// is a jointed rig blended between poses with sharp ease, the blade leaves a
// trail of fire, and embers rise from every strike.
type Pose = { torso: number; ua: number; fa: number; sw: number; t1: number; s1: number; t2: number; s2: number; dy: number };
const POSES: Pose[] = [
  { torso: -90, ua: 70, fa: -10, sw: -55, t1: 62, s1: 96, t2: 118, s2: 84, dy: 0 },
  { torso: -96, ua: -125, fa: -85, sw: -115, t1: 58, s1: 96, t2: 124, s2: 86, dy: -12 },
  { torso: -68, ua: 25, fa: 35, sw: 25, t1: 28, s1: 100, t2: 145, s2: 122, dy: 46 },
  { torso: -90, ua: -5, fa: 0, sw: 0, t1: 48, s1: 72, t2: 132, s2: 108, dy: 24 },
  { torso: -100, ua: -45, fa: -55, sw: -70, t1: 72, s1: 88, t2: 108, s2: 92, dy: -26 },
  { torso: -90, ua: 105, fa: 160, sw: 172, t1: 80, s1: 90, t2: 100, s2: 90, dy: 0 },
];
const AT = [0.2, 1.3, 2.5, 3.7, 4.9, 6.2];
const MOVE = 0.32;

const rad = (d: number) => (d * Math.PI) / 180;
const dir = (d: number) => [Math.cos(rad(d)), Math.sin(rad(d))] as const;
function angLerp(a: number, b: number, k: number) {
  let d = ((b - a + 540) % 360) - 180;
  return a + d * k;
}

function poseAt(t: number): Pose {
  let i = 0;
  for (let k = 0; k < AT.length; k++) if (t >= AT[k]) i = k;
  if (i === AT.length - 1 || t < AT[0]) return POSES[Math.min(i, POSES.length - 1)];
  const k = expInOut(c01((t - (AT[i + 1] - MOVE)) / MOVE));
  const A = POSES[i];
  const B = POSES[i + 1];
  return {
    torso: angLerp(A.torso, B.torso, k),
    ua: angLerp(A.ua, B.ua, k),
    fa: angLerp(A.fa, B.fa, k),
    sw: angLerp(A.sw, B.sw, k),
    t1: lerp(A.t1, B.t1, k),
    s1: lerp(A.s1, B.s1, k),
    t2: lerp(A.t2, B.t2, k),
    s2: lerp(A.s2, B.s2, k),
    dy: lerp(A.dy, B.dy, k),
  };
}

function rig(t: number) {
  const p = poseAt(t);
  const H = [960, 640 + p.dy + Math.sin(t * 2) * 3] as const;
  const S = [H[0] + 200 * dir(p.torso)[0], H[1] + 200 * dir(p.torso)[1]] as const;
  const head = [S[0] + 70 * dir(p.torso)[0], S[1] + 70 * dir(p.torso)[1]] as const;
  const E = [S[0] + 120 * dir(p.ua)[0], S[1] + 120 * dir(p.ua)[1]] as const;
  const hand = [E[0] + 115 * dir(p.fa)[0], E[1] + 115 * dir(p.fa)[1]] as const;
  const tip = [hand[0] + 360 * dir(p.sw)[0], hand[1] + 360 * dir(p.sw)[1]] as const;
  const pommel = [hand[0] - 70 * dir(p.sw)[0], hand[1] - 70 * dir(p.sw)[1]] as const;
  const K1 = [H[0] + 150 * dir(p.t1)[0], H[1] + 150 * dir(p.t1)[1]] as const;
  const F1 = [K1[0] + 150 * dir(p.s1)[0], K1[1] + 150 * dir(p.s1)[1]] as const;
  const K2 = [H[0] + 150 * dir(p.t2)[0], H[1] + 150 * dir(p.t2)[1]] as const;
  const F2 = [K2[0] + 150 * dir(p.s2)[0], K2[1] + 150 * dir(p.s2)[1]] as const;
  return { H, S, head, E, hand, tip, pommel, K1, F1, K2, F2, p };
}

export default function FireKata({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const r = rig(t);
  const body = "#0b0605";
  const fire = pal.p;
  const hot = "#ffd166";
  const titleP = c01((t - 7.6) / 0.6);

  // fire trail: recent sword tips
  const trail = Array.from({ length: 16 }, (_, k) => rig(t - k * 0.018));
  const speed = Math.hypot(trail[0].tip[0] - trail[3].tip[0], trail[0].tip[1] - trail[3].tip[1]);
  const trailOn = c01((speed - 20) / 60);

  const strike = AT.slice(1).reduce((m, a) => Math.max(m, Math.exp(-Math.pow((t - a) / 0.15, 2))), 0);
  const ground = 960;
  const hakama = `M${r.H[0] - 46},${r.H[1] - 10} L${r.H[0] + 46},${r.H[1] - 10} L${r.K1[0] + 60},${r.K1[1] + 70} L${r.K2[0] - 60},${r.K2[1] + 70} Z`;
  const limb = (a: readonly number[], b2: readonly number[], w: number) => <line x1={a[0]} y1={a[1]} x2={b2[0]} y2={b2[1]} stroke={body} strokeWidth={w} strokeLinecap="round" />;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #2a0b12 0%, #7a1e14 55%, #c8462a 88%)", overflow: "hidden", fontFamily: ff }}>
      <Svg>
        <defs>
          <linearGradient id="fk-fire" x1="0" x2="1">
            <stop offset="0" stopColor={hot} />
            <stop offset="0.5" stopColor={fire} />
            <stop offset="1" stopColor="#ff3d1f" stopOpacity={0} />
          </linearGradient>
          <filter id="fk-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>
        <circle cx={960} cy={520} r={360} fill="#ff9a4a" opacity={0.9} />
        <circle cx={960} cy={520} r={360} fill="#ffd27a" opacity={0.25 + strike * 0.35} />
        <ellipse cx={960} cy={ground + 10} rx={420} ry={40} fill="#ff6a2a" opacity={0.18 + strike * 0.25} filter="url(#fk-glow)" />
        <rect x={0} y={ground} width={1920} height={120} fill="#0c0705" />
        {/* embers */}
        {Array.from({ length: 60 }).map((_, i) => {
          const life = (t * (0.4 + hash(i, 1) * 0.5) + hash(i, 2)) % 1;
          const x = 960 + (hash(i, 3) - 0.5) * 900 + Math.sin(t * 2 + i) * 30 * life;
          const y = ground - life * 760;
          return <circle key={i} cx={x} cy={y} r={2 + hash(i, 4) * 3} fill={i % 3 ? fire : hot} opacity={(1 - life) * 0.8} />;
        })}
        {/* fire trail */}
        {trailOn > 0.02 && (
          <g opacity={trailOn}>
            {trail.slice(0, -1).map((q, k) => {
              const n = trail[k + 1];
              return <path key={k} d={`M${q.hand[0]},${q.hand[1]} L${q.tip[0]},${q.tip[1]} L${n.tip[0]},${n.tip[1]} L${n.hand[0]},${n.hand[1]} Z`} fill={k < 4 ? "#ffffff" : hot} opacity={(1 - k / 15) * 0.7} />;
            })}
            <g filter="url(#fk-glow)">
              {trail.slice(0, 8).map((q, k) => (
                <circle key={k} cx={q.tip[0]} cy={q.tip[1]} r={26 - k * 2} fill={fire} opacity={0.5 - k * 0.05} />
              ))}
            </g>
          </g>
        )}
        {/* back leg, body, front leg */}
        {limb(r.H, r.K2, 34)}
        {limb(r.K2, r.F2, 28)}
        <path d={hakama} fill={body} />
        {limb(r.H, r.S, 74)}
        <circle cx={r.head[0]} cy={r.head[1]} r={44} fill={body} />
        <circle cx={r.head[0] - 12 * dir(r.p.torso)[1]} cy={r.head[1] - 40} r={18} fill={body} />
        {limb(r.H, r.K1, 34)}
        {limb(r.K1, r.F1, 28)}
        <path d={`M${r.F1[0] - 10},${r.F1[1]} l46,0`} stroke={body} strokeWidth={18} strokeLinecap="round" />
        <path d={`M${r.F2[0] - 36},${r.F2[1]} l46,0`} stroke={body} strokeWidth={18} strokeLinecap="round" />
        {/* sword */}
        <line x1={r.pommel[0]} y1={r.pommel[1]} x2={r.hand[0]} y2={r.hand[1]} stroke="#3a2a22" strokeWidth={14} strokeLinecap="round" />
        <line x1={r.hand[0]} y1={r.hand[1]} x2={r.tip[0]} y2={r.tip[1]} stroke="#e9eef2" strokeWidth={8} strokeLinecap="round" />
        <line x1={r.hand[0]} y1={r.hand[1]} x2={r.tip[0]} y2={r.tip[1]} stroke={hot} strokeWidth={3} opacity={0.6 + strike * 0.4} />
        {/* arms over the body */}
        {limb(r.S, r.E, 30)}
        {limb(r.E, r.hand, 26)}
        {/* rim light */}
        <g stroke={fire} strokeWidth={3} fill="none" opacity={0.7}>
          <path d={`M${r.S[0] + 30},${r.S[1]} L${r.H[0] + 30},${r.H[1]}`} />
          <circle cx={r.head[0]} cy={r.head[1]} r={44} strokeDasharray="60 300" />
        </g>
        {titleP > 0 && (
          <>
            <Txt text={c.title || "Fire Kata"} x={960} y={220} size={fit(c.title || "Fire Kata", 1400, 150, 900)} weight={900} color="#fff3e6" font={ff} p={titleP} tracking={-0.03} />
            <Txt text={name} x={960} y={300} size={44} weight={700} color={fire} font={ff} p={c01((t - 8.0) / 0.5)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/fire-kata.wav" on={audio} />
    </AbsoluteFill>
  );
}
