import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, fontOf, hash, lerp, mix, nameOf, palette, seg, useT } from "../../motion";

type C = { line: string };

// Two little biplanes chase each other over a sunset sea: towering purple
// cumulus, a low sun, glitter on the water and the planes' reflections; the
// chase loops through the clouds, then a quiet line appears.
function Plane({ x, y, rot, s, body, wing }: { x: number; y: number; rot: number; s: number; body: string; wing: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <rect x={-70} y={-12} width={140} height={24} rx={12} fill={body} />
      <rect x={-20} y={-46} width={40} height={92} rx={8} fill={wing} />
      <rect x={-14} y={-46} width={28} height={92} rx={8} fill={wing} transform="translate(0 0)" opacity={0.6} />
      <rect x={-70} y={-24} width={22} height={48} rx={6} fill={wing} />
      <circle cx={74} cy={0} r={8} fill="#222" />
      <rect x={78} y={-30} width={4} height={60} fill="#fff" opacity={0.5} />
      <circle cx={6} cy={-18} r={9} fill="#2b2b2b" />
    </g>
  );
}

export default function SunsetDogfight({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const HZ = 640;
  // flight paths: a lead plane and a chaser on looping lissajous paths
  const path = (tt: number) => ({
    x: 960 + Math.sin(tt * 0.6) * 760,
    y: 360 + Math.sin(tt * 1.2) * 150,
  });
  const lead = path(t);
  const lead2 = path(t + 0.02);
  const chase = path(t - 0.55);
  const chase2 = path(t - 0.53);
  const ang = (a: { x: number; y: number }, z: { x: number; y: number }) => (Math.atan2(z.y - a.y, z.x - a.x) * 180) / Math.PI;
  const lineP = c01((t - 7.0) / 1.2);
  const endP = c01((t - 9.4) / 0.8);
  const sky0 = "#2b1c4a";
  const sky1 = "#ff8a5b";

  return (
    <AbsoluteFill style={{ overflow: "hidden", fontFamily: ff }}>
      <Svg>
        <defs>
          <linearGradient id="sd-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={sky0} />
            <stop offset="60%" stopColor="#b24d7a" />
            <stop offset="100%" stopColor={sky1} />
          </linearGradient>
          <linearGradient id="sd-sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5a3a6e" />
            <stop offset="100%" stopColor="#1b1430" />
          </linearGradient>
        </defs>
        <rect width={1920} height={HZ} fill="url(#sd-sky)" />
        <circle cx={1180} cy={HZ - 30} r={120} fill="#ffd59a" />
        {/* clouds */}
        {Array.from({ length: 7 }, (_, i) => {
          const x = ((i * 380 - t * (12 + i * 4)) % 2600 + 2600) % 2600 - 340;
          const y = 200 + hash(i, 1) * 260;
          const s = 0.8 + hash(i, 2) * 0.8;
          const col = mix("#7b5aa6", "#ffb38a", hash(i, 3) * 0.5);
          return (
            <g key={i} transform={`translate(${x} ${y}) scale(${s})`} opacity={0.92}>
              {[[-120, 30, 90], [-30, -20, 130], [90, 20, 100], [0, 50, 110], [170, 50, 70]].map(([dx, dy, r], k) => (
                <circle key={k} cx={dx} cy={dy} r={r} fill={col} />
              ))}
              <rect x={-210} y={50} width={460} height={70} fill={col} />
            </g>
          );
        })}
        {/* planes */}
        <Plane x={lead.x} y={lead.y} rot={ang(lead, lead2)} s={0.9} body="#e9e4d8" wing="#3fa36b" />
        <Plane x={chase.x} y={chase.y} rot={ang(chase, chase2)} s={0.75} body={mix(pal.v, "#ffffff", 0.2)} wing="#d64545" />
        {/* tracer puffs */}
        {Array.from({ length: 8 }, (_, i) => {
          const p = path(t - 0.55 - i * 0.08);
          return <circle key={i} cx={p.x} cy={p.y} r={6 + i * 2} fill="#fff" opacity={0.25 - i * 0.03} />;
        })}
        {/* sea with reflections */}
        <rect y={HZ} width={1920} height={1080 - HZ} fill="url(#sd-sea)" />
        <g transform={`translate(0 ${HZ * 2}) scale(1 -1)`} opacity={0.35}>
          <circle cx={1180} cy={HZ - 30} r={120} fill="#ffd59a" />
          <Plane x={lead.x} y={lead.y} rot={ang(lead, lead2)} s={0.9} body="#e9e4d8" wing="#3fa36b" />
          <Plane x={chase.x} y={chase.y} rot={ang(chase, chase2)} s={0.75} body={mix(pal.v, "#ffffff", 0.2)} wing="#d64545" />
        </g>
        {Array.from({ length: 70 }, (_, i) => {
          const y = HZ + 10 + Math.pow(hash(i, 4), 1.6) * 420;
          const w = 20 + hash(i, 5) * 90 * (1 - (y - HZ) / 600);
          const x = 1180 + (hash(i, 6) - 0.5) * (y - HZ) * 2.2 + Math.sin(t * 2 + i) * 10;
          return <rect key={i} x={x - w / 2} y={y} width={w} height={3} rx={1.5} fill="#ffd59a" opacity={0.35 + 0.4 * Math.sin(t * 4 + i * 1.7)} />;
        })}
        <Txt text={c.line || "just breathe."} x={960} y={960} size={64} weight={500} color="#fff2e6" font={ff} p={lineP} out={c01((t - 9.0) / 0.4)} mode="blur" italic />
      </Svg>
      {endP > 0 && (
        <AbsoluteFill style={{ background: lerp(0, 1, endP) > 0 ? sky0 : sky0, opacity: expInOut(seg(t, 9.2, 0.6)) }}>
          <Svg>
            <Txt text={nameOf(b)} x={960} y={560} size={150} weight={800} color="#fff2e6" font={ff} p={endP} tracking={-0.04} />
          </Svg>
        </AbsoluteFill>
      )}
      <Track src="tracks/sunset-dogfight.wav" on={audio} />
    </AbsoluteFill>
  );
}
