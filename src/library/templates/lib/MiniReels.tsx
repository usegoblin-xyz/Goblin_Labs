// Small procedural "reels": stand-in previews for gallery tiles, built from the
// brand palette. Each is a pure function of local time and fills its box.
import { c01, hash, lerp, type Pal } from "../../motion";

export const REEL_COUNT = 10;

export function MiniReel({ k, t, pal, font }: { k: number; t: number; pal: Pal; font: string }) {
  const v = ((k % REEL_COUNT) + REEL_COUNT) % REEL_COUNT;
  const P = pal.v;
  const A = pal.a;
  const D = pal.dark ? "#f2f2ef" : "#101012";
  const L = pal.dark ? "#101012" : "#f2f2ef";
  const bgs = [D, L, P, D, A, L, D, P, L, D];
  const bg = bgs[v];
  const fg = bg === D ? L : bg === L ? D : D;
  const s = (x: number) => Math.sin(x);
  let body: JSX.Element;
  switch (v) {
    case 0: // rotating squares
      body = <g>{[0, 1, 2].map((i) => <rect key={i} x={80 - 18 + i * 0} y={50 - 18} width={36} height={36} rx={6} fill="none" stroke={i === 1 ? P : fg} strokeWidth={4} transform={`translate(80 50) rotate(${t * 60 * (i + 1) + i * 20}) scale(${1 + i * 0.5}) translate(-80 -50)`} />)}</g>;
      break;
    case 1: // bouncing dots
      body = <g>{[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={36 + i * 22} cy={70 - Math.abs(s(t * 4 + i * 0.6)) * 34} r={7} fill={i === 2 ? P : fg} />)}<line x1={20} x2={140} y1={78} y2={78} stroke={fg} strokeWidth={2} opacity={0.3} /></g>;
      break;
    case 2: // kinetic word
      body = <text x={80} y={62} textAnchor="middle" fontFamily={font} fontSize={30 + 6 * s(t * 2)} fontWeight={800} fill={fg} letterSpacing={lerp(-1, 6, (s(t * 1.5) + 1) / 2)}>MOVE</text>;
      break;
    case 3: // bars
      body = <g>{Array.from({ length: 8 }).map((_, i) => { const h = 16 + (s(t * 3 + i * 0.8) + 1) * 26; return <rect key={i} x={26 + i * 14} y={80 - h} width={10} height={h} rx={3} fill={i === 5 ? P : fg} />; })}</g>;
      break;
    case 4: // orbit
      body = <g><circle cx={80} cy={50} r={8} fill={D} />{[18, 30, 42].map((r, i) => <g key={r}><circle cx={80} cy={50} r={r} fill="none" stroke={D} strokeWidth={1.5} opacity={0.35} /><circle cx={80 + r * Math.cos(t * (2 - i * 0.5) + i)} cy={50 + r * Math.sin(t * (2 - i * 0.5) + i)} r={5} fill={D} /></g>)}</g>;
      break;
    case 5: // waves
      body = <g>{[0, 1, 2, 3].map((i) => <path key={i} d={"M0 " + (34 + i * 12) + Array.from({ length: 33 }).map((_, x) => ` L${x * 5} ${34 + i * 12 + s(x * 0.4 + t * 3 + i) * 6}`).join("")} stroke={i === 1 ? P : fg} strokeWidth={3} fill="none" />)}</g>;
      break;
    case 6: // grid pulse
      body = <g>{Array.from({ length: 40 }).map((_, i) => { const x = 20 + (i % 8) * 17; const y = 18 + Math.floor(i / 8) * 16; const d = Math.hypot(x - 80, y - 50); const r = 2 + 4 * c01((s(t * 3 - d * 0.08) + 1) / 2); return <circle key={i} cx={x} cy={y} r={r} fill={d < 12 ? P : fg} />; })}</g>;
      break;
    case 7: // big number
      body = <text x={80} y={66} textAnchor="middle" fontFamily={font} fontSize={44} fontWeight={800} fill={D}>{Math.floor(((t * 37) % 100) + 1)}%</text>;
      break;
    case 8: // blob morph
      body = <path d={`M80 ${20 + 6 * s(t * 2)} C ${110 + 8 * s(t * 1.7)} 20, 120 ${60 + 6 * s(t)}, 80 80 C 40 ${84 + 4 * s(t * 2.3)}, 36 30, 80 ${20 + 6 * s(t * 2)} Z`} fill={P} />;
      break;
    default: // cursor + button
      body = <g><rect x={46} y={40} width={68} height={22} rx={11} fill={c01(s(t * 2)) > 0.5 ? P : fg} /><path d={`M${90 + 10 * s(t * 2)} ${58 + 6 * Math.cos(t * 2)} l0 16 l4 -4 l4 7 l3 -1 l-4 -7 l6 0 z`} fill={fg} stroke={bg} strokeWidth={1} /></g>;
  }
  return (
    <svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style={{ position: "absolute", inset: 0, display: "block" }}>
      <rect width="160" height="100" fill={bg} />
      {body}
      <circle cx={150} cy={10} r={2} fill={fg} opacity={0.25 + 0.2 * hash(v)} />
    </svg>
  );
}
