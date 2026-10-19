import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fit, fontOf, lerp, nameOf, palette, seg, useT } from "../../motion";

type C = { role: string };

// Three spirograph curves drawn live by a gear rolling inside a ring, each in
// a brand colour. Then the three spin together, shrink into one rosette and
// sit beside your name like a seal.
const R = 300;
const CURVES = [
  { r: 105, d: 80, loops: 7, at: 0.3, dur: 2.4, rot: 0 },
  { r: 90, d: 120, loops: 3, at: 2.8, dur: 1.9, rot: 20 },
  { r: 132, d: 110, loops: 11, at: 4.8, dur: 1.9, rot: -15 },
];

function point(r: number, d: number, th: number) {
  const k = (R - r) / r;
  return [(R - r) * Math.cos(th) + d * Math.cos(k * th), (R - r) * Math.sin(th) - d * Math.sin(k * th)];
}
const PATHS = CURVES.map(({ r, d, loops }) => {
  const n = loops * 160;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const [x, y] = point(r, d, (i / n) * loops * Math.PI * 2);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M${pts.join(" L")}`;
});

export default function SpirographReel({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const colors = [pal.p, pal.a, pal.fg];

  const ringIn = cubicInOut(seg(t, 0, 0.4));
  const spin = expInOut(seg(t, 6.8, 1.1));
  const settle = expInOut(seg(t, 7.4, 0.8));
  const nameW = Math.min(1000, name.length * 110);
  const cx = lerp(960, 960 - nameW / 2 - 60, settle);
  const scale = lerp(1, 0.42, settle);
  const nameP = c01((t - 8.0) / 0.6);
  const roleP = c01((t - 8.5) / 0.6);
  const active = CURVES.findIndex((cv) => t >= cv.at && t < cv.at + cv.dur);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        <g transform={`translate(${cx} 540) scale(${scale}) rotate(${spin * 240})`}>
          <circle r={R} fill="none" stroke={pal.line} strokeWidth={3} pathLength={1} strokeDasharray={`${ringIn * (1 - settle)} 2`} />
          {CURVES.map((cv, i) => {
            const p = cubicInOut(seg(t, cv.at, cv.dur));
            if (p <= 0) return null;
            return (
              <g key={i} transform={`rotate(${cv.rot * (1 + spin * (i - 1) * 2)})`}>
                <path d={PATHS[i]} fill="none" stroke={colors[i]} strokeWidth={lerp(3, 4.5, settle)} strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 2`} opacity={i === 2 ? 0.75 : 1} />
              </g>
            );
          })}
          {active >= 0 &&
            (() => {
              const cv = CURVES[active];
              const p = cubicInOut(seg(t, cv.at, cv.dur));
              const th = p * cv.loops * Math.PI * 2;
              const gx = (R - cv.r) * Math.cos(th);
              const gy = (R - cv.r) * Math.sin(th);
              const [px, py] = point(cv.r, cv.d, th);
              const gearRot = (-th * (R - cv.r)) / cv.r;
              return (
                <g transform={`rotate(${cv.rot})`}>
                  <g transform={`translate(${gx} ${gy}) rotate(${(gearRot * 180) / Math.PI})`}>
                    <circle r={cv.r} fill={pal.card} fillOpacity={0.55} stroke={pal.faint} strokeWidth={2} />
                    {Array.from({ length: 24 }).map((_, k) => {
                      const a = (k / 24) * Math.PI * 2;
                      return <line key={k} x1={Math.cos(a) * (cv.r - 8)} y1={Math.sin(a) * (cv.r - 8)} x2={Math.cos(a) * cv.r} y2={Math.sin(a) * cv.r} stroke={pal.faint} strokeWidth={2} />;
                    })}
                  </g>
                  <circle cx={px} cy={py} r={9} fill={colors[active]} />
                  <circle cx={px} cy={py} r={18} fill="none" stroke={colors[active]} strokeWidth={2} opacity={0.5} />
                </g>
              );
            })()}
        </g>
        {nameP > 0 && <Txt text={name} x={cx + 200} y={580} size={fit(name, nameW + 160, 150, 800)} weight={800} color={pal.fg} font={ff} p={nameP} anchor="start" tracking={-0.04} />}
        {roleP > 0 && <Txt text={c.role || "Precision, in loops"} x={cx + 204} y={660} size={40} weight={500} color={pal.muted} font={ff} p={roleP} mode="fade" anchor="start" />}
      </Svg>
      <Track src="tracks/spirograph-reel.wav" on={audio} />
    </AbsoluteFill>
  );
}

