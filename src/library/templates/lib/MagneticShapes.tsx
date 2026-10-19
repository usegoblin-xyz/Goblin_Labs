import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Mark, Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, kf, lerp, mix, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { role: string };

// A field of compass needles. Two magnets, a circle and a square, dance
// across it and every needle turns to follow the field between them. On the
// last bar the magnets orbit closer and snap together, the needles point in
// and close into a ring around your mark.
const COLS = 30;
const ROWS = 17;

export default function MagneticShapes({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);

  // pole paths (keyframed), N = circle, S = square
  const nx = kf(t, [[0.8, 960], [2.0, 600], [3.0, 760], [4.0, 1300], [5.0, 900], [6.0, 640], [6.6, 860], [7.3, 960]]);
  const ny = kf(t, [[0.8, 540], [2.0, 420], [3.0, 700], [4.0, 380], [5.0, 760], [6.0, 520], [6.6, 520], [7.3, 540]]);
  const sx = kf(t, [[3.0, 1500], [4.0, 700], [5.0, 1300], [6.0, 1260], [6.6, 1060], [7.3, 960]]);
  const sy = kf(t, [[3.0, 300], [4.0, 720], [5.0, 360], [6.0, 560], [6.6, 560], [7.3, 540]]);
  const nIn = spring(t - 0.8, 14, 0.6);
  const sIn = spring(t - 3.0, 14, 0.6);
  const merged = expInOut(seg(t, 7.2, 0.3));
  const ring = expInOut(seg(t, 7.4, 0.8));
  const mark = spring(t - 7.6, 14, 0.7);
  const lock = expInOut(seg(t, 8.4, 0.5));
  const nameW = Math.min(980, name.length * 105);
  const markX = lerp(960, 960 - nameW / 2 - 40, lock);
  const nameP = c01((t - 8.5) / 0.6);
  const roleP = c01((t - 8.9) / 0.6);

  const needles = [];
  for (let i = 0; i < COLS; i++)
    for (let j = 0; j < ROWS; j++) {
      const x = 960 + (i - (COLS - 1) / 2) * 62;
      const y = 540 + (j - (ROWS - 1) / 2) * 62;
      // dipole field: out of N, into S
      let fx = 0;
      let fy = 0;
      const add = (px: number, py: number, q: number) => {
        const dx = x - px;
        const dy = y - py;
        const d2 = dx * dx + dy * dy + 900;
        const k = (q * 1e5) / (d2 * Math.sqrt(d2));
        fx += dx * k;
        fy += dy * k;
      };
      add(nx, ny, nIn);
      add(sx, sy, -sIn);
      const strength = Math.min(1, Math.hypot(fx, fy) * 0.25);
      const idle = Math.sin(i * 0.7 + j * 1.3) * 60 + t * 20;
      let ang = Math.hypot(fx, fy) > 1e-4 ? (Math.atan2(fy, fx) * 180) / Math.PI : idle;
      if (t < 0.8) ang = idle;
      // finale: point at the centre, then gather into a ring
      const dxc = 960 - x;
      const dyc = 540 - y;
      const toC = (Math.atan2(dyc, dxc) * 180) / Math.PI;
      if (merged > 0) ang = lerp(ang, toC, merged);
      const a0 = Math.atan2(-dyc, -dxc);
      const rr = 280 + ((i + j) % 3) * 26;
      const px = lerp(x, 960 + Math.cos(a0) * rr, ring);
      const py = lerp(y, 540 + Math.sin(a0) * rr, ring);
      const fade = expOut(seg(t, 0.05 + (i + j) * 0.012, 0.4)) * (1 - expInOut(seg(t, 8.2, 0.5)));
      const len = 30 * (0.6 + 0.4 * strength);
      needles.push(
        <g key={`${i}-${j}`} transform={`translate(${px} ${py}) rotate(${ang})`} opacity={fade}>
          <line x1={-len / 2} y1={0} x2={len / 2} y2={0} stroke={mix(pal.muted, pal.p, strength)} strokeWidth={5} strokeLinecap="round" />
          <circle cx={len / 2} cy={0} r={3.5} fill={strength > 0.5 ? pal.p : pal.faint} />
        </g>,
      );
    }

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        {needles}
        {nIn > 0.01 && merged < 1 && <circle cx={nx} cy={ny} r={46 * nIn} fill={pal.p} />}
        {sIn > 0.01 && merged < 1 && <rect x={sx - 42 * sIn} y={sy - 42 * sIn} width={84 * sIn} height={84 * sIn} rx={14} fill={pal.a} transform={`rotate(${t * 60} ${sx} ${sy})`} />}
      </Svg>
      {mark > 0.01 && <Mark x={markX} y={540} size={190} b={b} pal={pal} s={mark} />}
      <Svg>
        {nameP > 0 && <Txt text={name} x={markX + 135} y={578} size={fit(name, nameW + 200, 140, 800)} weight={800} color={pal.fg} font={ff} p={nameP} anchor="start" tracking={-0.04} />}
        {roleP > 0 && <Txt text={c.role || "Forces, fields, motion"} x={960} y={760} size={40} weight={500} color={pal.muted} font={ff} p={roleP} mode="fade" />}
      </Svg>
      <Track src="tracks/magnetic-shapes.wav" on={audio} />
    </AbsoluteFill>
  );
}
