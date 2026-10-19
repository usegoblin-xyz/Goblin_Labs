import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fit, fontOf, hash, lerp, nameOf, palette, seg, useT } from "../../motion";

type C = { labels: string; values: string; tagline: string };

// Charts that dance: bars bounce like an equalizer to the beat, then freeze
// into a labelled chart of real values; the pie spins up like a clock face;
// the line chart becomes a heartbeat that flatlines into the name.
const BEAT = 60 / 120;

export default function ChartDance({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const labels = [...list(c.labels || "Q1, Q2, Q3, Q4, Q5, Q6"), "A", "B", "C", "D", "E", "F"].slice(0, 6);
  const values = [...list(c.values || "34, 48, 41, 63, 72, 90").map(Number), 50, 50, 50, 50, 50, 50].slice(0, 6);
  const maxV = Math.max(...values);
  const freeze = expInOut(seg(t, 3.0, 0.7));
  const s1 = t < 5.0;
  const s2 = t >= 5.0 && t < 8.0;
  const s3 = t >= 8.0 && t < 11.0;
  const endP = c01((t - 11.2) / 0.8);
  const beatPh = (t / BEAT) % 1;
  const kick = Math.exp(-beatPh * 5);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        {s1 &&
          values.map((v, i) => {
            const eq = 0.25 + 0.75 * Math.abs(Math.sin(t * (3 + hash(i, 1) * 4) + i)) * (0.5 + kick * 0.5);
            const h = lerp(eq * 600, (v / maxV) * 600, freeze);
            const x = 360 + i * 220;
            const out = c01((t - 4.7) * 4);
            return (
              <g key={i} opacity={1 - out}>
                <rect x={x - 70} y={860 - h} width={140} height={h} rx={18} fill={i === values.length - 1 && freeze > 0.5 ? pal.v : freeze > 0.5 ? pal.card2 : pal.v} />
                <text x={x} y={910} textAnchor="middle" fontFamily={ff} fontSize={30} fill={pal.muted} opacity={freeze}>
                  {labels[i]}
                </text>
                <text x={x} y={840 - h} textAnchor="middle" fontFamily={ff} fontSize={38} fontWeight={800} fill={pal.fg} opacity={freeze}>
                  {Math.round(v * freeze)}
                </text>
              </g>
            );
          })}
        {s2 &&
          (() => {
            const u = t - 5.0;
            const sum = values.reduce((a, v) => a + v, 0);
            const spin = cubicInOut(c01(u / 1.4));
            let acc = 0;
            return (
              <g transform={`rotate(${(1 - spin) * -360} 960 540)`}>
                {values.map((v, i) => {
                  const a0 = (acc / sum) * Math.PI * 2 * spin - Math.PI / 2;
                  acc += v;
                  const a1 = (acc / sum) * Math.PI * 2 * spin - Math.PI / 2;
                  const R = 340;
                  const large = a1 - a0 > Math.PI ? 1 : 0;
                  const d = `M960,540 L${960 + Math.cos(a0) * R},${540 + Math.sin(a0) * R} A${R},${R} 0 ${large} 1 ${960 + Math.cos(a1) * R},${540 + Math.sin(a1) * R}Z`;
                  return <path key={i} d={d} fill={[pal.v, pal.a, pal.fg, pal.card2, pal.faint, pal.p][i]} stroke={pal.bg} strokeWidth={6} opacity={1 - c01((u - 2.7) * 4)} />;
                })}
                {Array.from({ length: 12 }, (_, i) => {
                  const a = (i / 12) * Math.PI * 2;
                  return <line key={i} x1={960 + Math.cos(a) * 370} y1={540 + Math.sin(a) * 370} x2={960 + Math.cos(a) * 395} y2={540 + Math.sin(a) * 395} stroke={pal.faint} strokeWidth={6} />;
                })}
                <line x1={960} y1={540} x2={960 + Math.cos(u * 4 - Math.PI / 2) * 280} y2={540 + Math.sin(u * 4 - Math.PI / 2) * 280} stroke={pal.bg} strokeWidth={14} strokeLinecap="round" />
              </g>
            );
          })()}
        {s3 &&
          (() => {
            const u = t - 8.0;
            const flat = c01((u - 1.8) / 0.5);
            const pts = Array.from({ length: 120 }, (_, i) => {
              const f = i / 119;
              const x = 160 + f * 1600;
              const phase = (f * 6 - u * 2) % 1;
              const spikeAmp = 1 - flat * c01((f - (1 - c01((u - 1.8) / 0.8))) * 20);
              const beat = phase > 0.4 && phase < 0.5 ? Math.sin((phase - 0.4) / 0.1 * Math.PI) * 300 : phase > 0.5 && phase < 0.56 ? -Math.sin((phase - 0.5) / 0.06 * Math.PI) * 120 : 0;
              return `${x},${540 - beat * Math.max(0, spikeAmp)}`;
            });
            return <polyline points={pts.join(" ")} fill="none" stroke={pal.v} strokeWidth={8} strokeLinejoin="round" opacity={1 - c01((u - 2.7) * 4)} />;
          })()}
        {endP > 0 && (
          <>
            <Txt text={nameOf(b)} x={960} y={530} size={fit(nameOf(b), 1500, 170, 800, -0.04, ff)} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
            <Txt text={c.tagline || "Data with a pulse."} x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - 11.6) / 0.6)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/chart-dance.wav" on={audio} />
    </AbsoluteFill>
  );
}
