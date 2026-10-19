import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { SERIF, Svg, Track, c01, fontOf, hash, lerp, mix, nameOf, palette, useT } from "../../motion";

type C = { intro: string; tagline: string };

// Hand-drawn stop motion at 12 drawings a second. Every line "boils" because
// each drawing is redrawn with a little wobble. A shield-shaped vault
// guardian introduces itself in the first person, watches a loan's health
// gauge slide toward the danger line as prices fall, steps in to repay a bit,
// pushes the gauge back to safe, and keeps watch through the night.
const INK = "#2a2522";

export default function StopMotionGuardian({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t: tRaw } = useT();
  const t = Math.floor(tRaw * 12) / 12; // on twos
  const step = Math.floor(tRaw * 12);
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const j = (k: number, amt = 3) => (hash(k, step) - 0.5) * amt;

  // a wobbly closed loop through points
  const loop = (pts: [number, number][], k: number, amt = 3) =>
    "M" + pts.map(([x, y], i) => `${(x + j(k * 97 + i * 2, amt)).toFixed(1)},${(y + j(k * 97 + i * 2 + 1, amt)).toFixed(1)}`).join(" L") + " Z";
  const line = (pts: [number, number][], k: number, amt = 3) =>
    "M" + pts.map(([x, y], i) => `${(x + j(k * 89 + i * 2, amt)).toFixed(1)},${(y + j(k * 89 + i * 2 + 1, amt)).toFixed(1)}`).join(" L");
  const circ = (cx: number, cy: number, r: number, k: number, n = 18) =>
    loop(Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * r, cy + Math.sin((i / n) * Math.PI * 2) * r] as [number, number]), k, 4);

  const lines: [number, string][] = [
    [0.0, c.intro || "Hi. I'm your vault guardian."],
    [1.8, "I watch your loan, day and night."],
    [3.4, "Prices drop. Your health slips..."],
    [5.0, "So I step in before the line."],
    [6.6, "Repay a little. Back to safe."],
    [8.0, c.tagline || "You sleep. I keep watch."],
  ];
  const cur = [...lines].reverse().find(([at]) => t >= at)!;
  const chars = Math.floor(c01((t - cur[0]) / 0.9) * cur[1].length);

  // health gauge value (1.0 = liquidation line)
  const health = t < 3.4 ? 2.2 : t < 5.2 ? lerp(2.2, 1.15, c01((t - 3.4) / 1.6)) : t < 6.6 ? 1.15 : lerp(1.15, 2.0, c01((t - 6.6) / 0.8));
  const gx = (h: number) => 1100 + c01((h - 0.8) / 1.8) * 640;
  const night = c01((t - 7.9) / 0.6);
  const hop = t > 5.0 && t < 6.6 ? Math.abs(Math.sin((t - 5.0) * 6)) * 30 : 0;
  const talking = chars < cur[1].length;
  const mouthOpen = talking && step % 2 === 0;
  const worried = t >= 3.4 && t < 5.6;
  const priceY = (x: number) => 300 + (t < 3.4 ? 0 : c01((x - 1100) / 640) * 160 * c01((t - 3.4) / 1.6)) + Math.sin(x / 40) * 18;

  return (
    <AbsoluteFill style={{ background: mix("#f4ecdc", "#1b2238", night * 0.75), overflow: "hidden", fontFamily: ff }}>
      {/* paper grain */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.25, backgroundImage: "radial-gradient(rgba(90,70,40,0.35) 1px, transparent 1.4px)", backgroundSize: "7px 7px", backgroundPosition: `${step % 3}px ${step % 2}px` }} />
      <Svg>
        <g stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* guardian */}
          <g transform={`translate(520 ${640 - hop})`}>
            <path d={loop([[-150, -200], [0, -250], [150, -200], [140, 20], [70, 150], [0, 200], [-70, 150], [-140, 20]], 1, 5)} fill={pal.p} fillOpacity={0.85} />
            <path d={circ(-50, -80, 28, 2)} fill="#fff" />
            <path d={circ(50, -80, 28, 3)} fill="#fff" />
            <path d={circ(-50 + (worried ? 0 : 6), worried ? -70 : -80, 11, 4, 10)} fill={INK} />
            <path d={circ(50 + (worried ? 0 : 6), worried ? -70 : -80, 11, 5, 10)} fill={INK} />
            {worried && <path d={line([[-80, -130], [-24, -116]], 6)} />}
            {worried && <path d={line([[80, -130], [24, -116]], 7)} />}
            {mouthOpen ? <path d={circ(0, 0, 22, 8, 12)} fill={INK} /> : <path d={line(worried ? [[-30, 10], [0, 0], [30, 10]] : [[-36, -4], [0, 20], [36, -4]], 9)} />}
            {/* arms */}
            <path d={line([[-140, 0], [-210, t > 5.0 && t < 6.6 ? -110 : 60]], 10)} />
            <path d={line([[140, 0], [220, t > 5.0 && t < 6.6 ? -110 : -40 + Math.sin(step) * 4]], 11)} />
            {/* legs */}
            <path d={line([[-50, 170], [-60, 260], [-90, 262]], 12)} />
            <path d={line([[50, 170], [60, 260], [90, 262]], 13)} />
          </g>

          {/* price chart doodle */}
          <g opacity={c01((t - 1.8) / 0.3) * (1 - night)}>
            <path d={line([[1080, 140], [1080, 470], [1780, 470]], 20)} strokeWidth={4} />
            <path d={line(Array.from({ length: 15 }, (_, i) => [1100 + i * 46, priceY(1100 + i * 46)] as [number, number]), 21)} stroke={t >= 3.4 ? "#c43d32" : INK} />
            <text x={1100} y={120} fontFamily={ff} fontSize={30} fill={INK} stroke="none">
              price
            </text>
          </g>

          {/* health gauge */}
          <g opacity={c01((t - 1.8) / 0.3)}>
            <path d={loop([[1100, 620], [1740, 620], [1740, 690], [1100, 690]], 30)} />
            <path d={loop([[1100, 620], [gx(health), 620], [gx(health), 690], [1100, 690]], 31, 2)} fill={health < 1.4 ? "#e0533f" : health < 1.7 ? "#f0b43c" : "#53b27a"} fillOpacity={0.9} />
            <path d={line([[gx(1.0), 590], [gx(1.0), 720]], 32)} stroke="#c43d32" strokeDasharray="10 10" />
            <text x={gx(1.0) - 70} y={770} fontFamily={ff} fontSize={26} fill="#c43d32" stroke="none">
              danger line
            </text>
            <text x={1100} y={580} fontFamily={ff} fontSize={30} fill={INK} stroke="none">
              {`loan health ${health.toFixed(2)}`}
            </text>
          </g>

          {/* coins flying from guardian to the loan */}
          {t > 5.4 && t < 6.8 &&
            [0, 1, 2].map((i) => {
              const k = c01((t - 5.4 - i * 0.25) / 0.6);
              if (k <= 0 || k >= 1) return null;
              const x = lerp(740, gx(health), k);
              const y = lerp(520, 650, k) - Math.sin(k * Math.PI) * 160;
              return <path key={i} d={circ(x, y, 24, 40 + i, 12)} fill="#f2c94c" />;
            })}

          {/* moon and stars at night */}
          {night > 0 && (
            <g opacity={night}>
              <path d={loop([[1480, 160], [1530, 200], [1540, 260], [1500, 310], [1440, 320], [1490, 270], [1500, 210]], 50)} fill="#f2e3a6" />
              {[0, 1, 2, 3, 4].map((i) => (
                <path key={i} d={line([[1200 + i * 120, 200 + (i % 2) * 60], [1200 + i * 120, 230 + (i % 2) * 60]], 60 + i)} stroke="#f2e3a6" />
              ))}
            </g>
          )}
        </g>

        {/* speech bubble */}
        <g>
          <path d={loop([[120, 90], [940, 90], [940, 230], [560, 230], [520, 300], [500, 230], [120, 230]], 70, 4)} fill="#fffaf0" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <text x={150} y={182} fontFamily={SERIF} fontSize={52} fill={INK}>
            {cur[1].slice(0, chars)}
          </text>
        </g>
        {night > 0.5 && (
          <text x={1500} y={960} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={64} fill="#f4ecdc" opacity={c01((t - 8.4) / 0.4)}>
            {name}
          </text>
        )}
      </Svg>
      <Track src="tracks/stop-motion-guardian.wav" on={audio} />
    </AbsoluteFill>
  );
}
