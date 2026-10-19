import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fit, fontOf, hash, lerp, mix, nameOf, palette, seg, useT } from "../../motion";

type C = { years: string; travel: string; line: string };

// The life of one photon: born in the Sun's core, it random-walks through
// packed plasma for thousands of years, escapes the surface, crosses space in
// eight minutes and ends in an eye. Counters keep time throughout.
export default function PhotonJourney({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const hot = pal.v;
  const sunCol = "#ffb547";

  // scene timing
  const s1 = t < 4.2; // core random walk
  const s2 = t >= 4.2 && t < 6.2; // escape
  const s3 = t >= 6.2 && t < 10.2; // crossing
  const s4 = t >= 10.2; // the eye
  const years = Math.round(lerp(0, Number(String(c.years || "170000").replace(/\D/g, "")) || 170000, Math.pow(c01((t - 0.6) / 3.4), 2)));

  // random walk inside the core (zoomed view)
  const steps = 60;
  const walk: [number, number][] = [[960, 540]];
  for (let i = 1; i < steps; i++) {
    const a = hash(i, 5) * Math.PI * 2;
    const d = 40 + hash(i, 6) * 70;
    walk.push([Math.min(1780, Math.max(140, walk[i - 1][0] + Math.cos(a) * d)), Math.min(980, Math.max(100, walk[i - 1][1] + Math.sin(a) * d))]);
  }
  const wp = c01((t - 0.6) / 3.4) * (steps - 1);
  const wi = Math.floor(wp);
  const wf = wp - wi;
  const head = wi < steps - 1 ? [lerp(walk[wi][0], walk[wi + 1][0], wf), lerp(walk[wi][1], walk[wi + 1][1], wf)] : walk[steps - 1];

  // crossing
  const cross = cubicInOut(seg(t, 6.6, 3.2));
  const min = Math.floor(cross * 500);
  const travel = c.travel || "8 min 20 s";

  return (
    <AbsoluteFill style={{ background: pal.dark ? pal.bg : "#07070a", overflow: "hidden", fontFamily: ff }}>
      <Svg>
        {/* stars for space scenes */}
        {(s3 || s4) &&
          Array.from({ length: 120 }, (_, i) => {
            const x = ((hash(i, 1) * 2200 - cross * 400 * (0.3 + hash(i, 3))) % 2200 + 2200) % 2200 - 140;
            return <circle key={i} cx={x} cy={hash(i, 2) * 1080} r={0.8 + hash(i, 4) * 1.8} fill="#fff" opacity={0.25 + hash(i, 5) * 0.5} />;
          })}
        {s1 && (
          <g opacity={1 - expInOut(seg(t, 3.9, 0.3))}>
            {Array.from({ length: 220 }, (_, i) => {
              const x = hash(i, 1) * 1920 + Math.sin(t * 2 + i) * 6;
              const y = hash(i, 2) * 1080 + Math.cos(t * 2.4 + i) * 6;
              return <circle key={i} cx={x} cy={y} r={6 + hash(i, 3) * 10} fill={sunCol} opacity={0.18 + hash(i, 4) * 0.35} />;
            })}
            <path d={"M" + walk.slice(0, wi + 1).map((p) => p.join(",")).join(" L") + ` L${head[0]},${head[1]}`} fill="none" stroke={hot} strokeWidth={3} opacity={0.6} />
            <circle cx={head[0]} cy={head[1]} r={13} fill="#fff" />
            <circle cx={head[0]} cy={head[1]} r={30} fill={hot} opacity={0.35} />
          </g>
        )}
        {s2 &&
          (() => {
            const u = seg(t, 4.2, 2.0);
            const R = lerp(1500, 420, expOut(u));
            const cx = lerp(960, 560, expOut(u));
            const px = cx + R * 0.72 + expInOut(seg(t, 5.0, 1.2)) * 900;
            const py = 540 - R * 0.69 + lerp(0, -40, u);
            return (
              <g>
                <circle cx={cx} cy={540} r={R} fill={sunCol} />
                <circle cx={cx} cy={540} r={R * 1.06} fill={sunCol} opacity={0.25} />
                <circle cx={px} cy={py} r={12} fill="#fff" />
                <line x1={px - 120 * expInOut(seg(t, 5.0, 1.2))} y1={py} x2={px} y2={py} stroke="#fff" strokeWidth={4} opacity={0.7} />
              </g>
            );
          })()}
        {s3 && (
          <g>
            <circle cx={lerp(160, -400, cross)} cy={540} r={260} fill={sunCol} />
            <circle cx={lerp(2300, 1500, cross)} cy={540} r={lerp(60, 140, cross)} fill={mix(pal.a, "#3b82f6", 0.6)} />
            <path d={`M${lerp(lerp(160, -400, cross) + 260, 300, 0)},540 L${lerp(400, 1500 - lerp(60, 140, cross), cross)},540`} stroke="#fff" strokeWidth={3} strokeDasharray="10 16" opacity={0.4} />
            <circle cx={lerp(420, 1500 - lerp(60, 140, cross) - 20, cross)} cy={540} r={12} fill="#fff" />
          </g>
        )}
        {s4 &&
          (() => {
            const u = expOut(seg(t, 10.2, 1.4));
            const r = lerp(160, 360, u);
            const dil = 1 - 0.35 * expOut(seg(t, 11.2, 0.5));
            const ph = c01((t - 10.2) / 0.9);
            return (
              <g transform="translate(0 40)">
                <ellipse cx={960} cy={540} rx={r * 2.1} ry={r * 1.1} fill="#f2efe9" />
                <circle cx={960} cy={540} r={r} fill={pal.v} />
                {Array.from({ length: 36 }, (_, i) => {
                  const a = (i / 36) * Math.PI * 2;
                  return <line key={i} x1={960 + Math.cos(a) * r * 0.5} y1={540 + Math.sin(a) * r * 0.5} x2={960 + Math.cos(a) * r * 0.95} y2={540 + Math.sin(a) * r * 0.95} stroke={mix(pal.v, "#000", 0.35)} strokeWidth={3} />;
                })}
                <circle cx={960} cy={540} r={r * 0.45 * dil} fill="#050505" />
                <circle cx={960 - r * 0.2} cy={540 - r * 0.22} r={r * 0.09} fill="#fff" opacity={0.8} />
                {ph < 1 && <circle cx={lerp(1900, 960, ph)} cy={lerp(300, 540, ph)} r={12} fill="#fff" />}
              </g>
            );
          })()}
        {/* captions and counters */}
        {s1 && (
          <>
            <Txt text="Born in the core of the Sun" x={960} y={140} size={56} weight={700} color="#fff" font={ff} p={c01((t - 0.2) / 0.6)} out={c01((t - 3.8) / 0.3)} />
            <text x={960} y={1000} textAnchor="middle" fontFamily={ff} fontSize={64} fontWeight={800} fill="#fff" opacity={c01((t - 0.6) * 3) * (1 - c01((t - 3.9) * 3))}>
              {years.toLocaleString("en-US")} years
            </text>
          </>
        )}
        {s2 && <Txt text="It finally breaks free" x={1400} y={980} size={56} weight={700} color="#fff" font={ff} p={c01((t - 4.6) / 0.6)} out={c01((t - 5.9) / 0.3)} />}
        {s3 && (
          <>
            <Txt text="Then crosses empty space" x={960} y={180} size={56} weight={700} color="#fff" font={ff} p={c01((t - 6.4) / 0.6)} out={c01((t - 9.8) / 0.3)} />
            <text x={960} y={900} textAnchor="middle" fontFamily={ff} fontSize={88} fontWeight={800} fill="#fff" opacity={c01((t - 6.6) * 3) * (1 - c01((t - 9.9) * 3))}>
              {Math.floor(min / 60)} min {String(min % 60).padStart(2, "0")} s
            </text>
            <Txt text={`(about ${travel})`} x={960} y={970} size={30} weight={500} color="rgba(255,255,255,0.5)" font={ff} p={c01((t - 7.0) / 0.5)} mode="fade" out={c01((t - 9.8) / 0.3)} />
          </>
        )}
        {s4 && (
          <>
            <Txt text={c.line || "All that way, just to be seen."} x={960} y={120} size={fit(c.line || "All that way, just to be seen.", 1600, 72, 800, -0.03, ff)} weight={800} color="#fff" font={ff} p={c01((t - 11.4) / 0.8)} />
            <Txt text={nameOf(b)} x={960} y={1046} size={40} weight={700} color={pal.v} font={ff} p={c01((t - 12.2) / 0.6)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/photon-journey.wav" on={audio} />
    </AbsoluteFill>
  );
}
