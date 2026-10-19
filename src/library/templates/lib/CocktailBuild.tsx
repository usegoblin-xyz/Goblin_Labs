import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, hash, nameOf, palette, seg, useT } from "../../motion";

type C = { drink: string; steps: string; amounts: string; colors: string };

// A cocktail recipe, built in the glass: an empty rocks glass, ice cubes
// drop and bob, each pour fills a layer to its line with a label and
// measure, the last pour (cream) blooms in swirling clouds, and a stir
// spoon blends the top; the recipe card lists everything at the end.
export default function CocktailBuild({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const drink = c.drink || "White Russian";
  const steps = [...list(c.steps || "Ice, Vodka, Coffee liqueur, Heavy cream"), "Pour", "Pour", "Pour", "Pour"].slice(0, 4);
  const amounts = [...list(c.amounts || "Fill, 50 ml, 20 ml, 30 ml"), "", "", "", ""].slice(0, 4);
  const cols = [...list(c.colors || "#dff3ff, #f4f1e8, #3b1f12, #f6efe2"), "#ccc", "#ccc", "#ccc", "#ccc"].slice(0, 4);
  const GX = 760;
  const GY = 260;
  const GW = 400;
  const GH = 520;
  const iceP = c01((t - 0.6) / 0.6);
  const pours = [1.6, 3.0, 4.4];
  const levels = [0.38, 0.6, 0.88];
  const fill = pours.map((p) => cubicInOut(c01((t - p) / 1.0)));
  const stir = c01((t - 5.6) / 1.2);
  const card = expInOut(seg(t, 7.0, 0.7));
  const outro = expInOut(seg(t, 9.2, 0.5));
  const level = (i: number) => GY + GH - GH * ((i ? levels[i - 1] : 0) + (levels[i] - (i ? levels[i - 1] : 0)) * fill[i]);
  const cur = t < 1.6 ? 0 : t < 3.0 ? 1 : t < 4.4 ? 2 : 3;

  return (
    <AbsoluteFill style={{ background: "#1a1410", overflow: "hidden", fontFamily: ff }}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 35%, #3a2a1f, #120d0a 70%)" }} />
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro, transform: `translateX(${-card * 420}px)` }}>
        <Svg>
          <defs>
            <clipPath id="cb-glass">
              <path d={`M${GX},${GY} L${GX + 20},${GY + GH} L${GX + GW - 20},${GY + GH} L${GX + GW},${GY} Z`} />
            </clipPath>
          </defs>
          <g clipPath="url(#cb-glass)">
            {/* liquid layers from bottom */}
            {pours.map((_, i) => {
              if (fill[i] <= 0) return null;
              const lo = i ? levels[i - 1] : 0;
              const yBot = GY + GH - GH * lo;
              const yTop = GY + GH - GH * (lo + (levels[i] - lo) * fill[i]);
              const col = cols[i + 1];
              const wave = Math.sin(t * 4 + i) * 6 * (1 - c01((t - pours[i] - 1.0) * 2));
              if (i === 2) {
                // cream floats on top and blooms down into the coffee layer
                return (
                  <g key={i}>
                    <rect x={GX} y={yTop} width={GW} height={Math.max(0, yBot - yTop + 4)} fill={col} />
                    {Array.from({ length: 8 }, (_, k) => (
                      <circle key={k} cx={GX + 40 + hash(k, 1) * (GW - 80) + Math.sin(t * 2 + k) * 20 * (1 - stir)} cy={yBot + 10 + hash(k, 2) * 70 * fill[2]} r={(14 + hash(k, 3) * 22) * fill[2]} fill={col} opacity={0.6 * (1 - stir * 0.5)} />
                    ))}
                  </g>
                );
              }
              return <path key={i} d={`M${GX},${yTop + wave} Q${GX + GW / 2},${yTop - wave} ${GX + GW},${yTop + wave} L${GX + GW},${yBot + 2} L${GX},${yBot + 2} Z`} fill={col} />;
            })}
            {/* ice cubes */}
            {Array.from({ length: 4 }, (_, k) => {
              const drop = c01(iceP * 2 - k * 0.3);
              const x = GX + 60 + (k % 2) * 160 + hash(k) * 30;
              const yRest = GY + GH - 130 - Math.floor(k / 2) * 130;
              const y = GY - 300 + (yRest - GY + 300) * cubicInOut(drop) + Math.sin(t * 2 + k) * 4;
              return <rect key={k} x={x} y={y} width={130} height={120} rx={18} fill={cols[0]} opacity={0.55} stroke="#fff" strokeWidth={3} transform={`rotate(${(hash(k, 5) - 0.5) * 20} ${x + 65} ${y + 60})`} />;
            })}
          </g>
          {/* glass outline */}
          <path d={`M${GX},${GY} L${GX + 20},${GY + GH} L${GX + GW - 20},${GY + GH} L${GX + GW},${GY}`} fill="none" stroke="#fff" strokeWidth={8} opacity={0.75} />
          <rect x={GX + 16} y={GY + GH - 30} width={GW - 32} height={30} fill="#fff" opacity={0.2} />
          {/* pour stream */}
          {pours.map((p, i) =>
            t > p && t < p + 1.0 ? <rect key={i} x={GX + GW / 2 - 8 + i * 20} y={0} width={16} height={Math.max(0, level(i) - 0)} fill={cols[i + 1]} opacity={0.95} /> : null,
          )}
          {/* stir spoon */}
          {stir > 0 && stir < 1 && <line x1={GX + GW / 2 + Math.sin(stir * Math.PI * 6) * 120} y1={GY - 180} x2={GX + GW / 2 + Math.sin(stir * Math.PI * 6) * 60} y2={GY + 280} stroke="#c9c9c9" strokeWidth={10} strokeLinecap="round" />}
          {/* step label */}
          {card < 0.5 && (
            <g>
              <Txt key={cur} text={steps[cur]} x={1300} y={480} size={64} weight={800} color="#fff" font={ff} p={c01((t - [0.6, 1.6, 3.0, 4.4][cur]) / 0.4)} anchor="start" />
              <Txt key={`a${cur}`} text={amounts[cur]} x={1300} y={560} size={44} weight={600} color={pal.v} font={ff} p={c01((t - [0.6, 1.6, 3.0, 4.4][cur] - 0.2) / 0.4)} anchor="start" mode="fade" />
            </g>
          )}
          <Txt text={drink} x={960} y={140} size={70} weight={800} color="#fff" font={ff} p={c01((t - 0.1) / 0.5)} out={card} />
        </Svg>
      </div>
      {/* recipe card */}
      {card > 0 && (
        <div style={{ position: "absolute", left: 1000, top: 200, width: 760, padding: 60, borderRadius: 30, background: "#f6efe2", color: "#2b1d14", boxSizing: "border-box", transform: `translateX(${(1 - card) * 900}px)`, opacity: 1 - outro }}>
          <div style={{ fontSize: 66, fontWeight: 900, letterSpacing: "-0.02em" }}>{drink}</div>
          <div style={{ fontSize: 26, color: "#8a7564", marginBottom: 30 }}>Rocks glass · stir gently</div>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, height: 74, borderTop: "2px dashed #d8cbb8", opacity: c01((t - 7.4 - i * 0.15) * 4) }}>
              <span style={{ width: 28, height: 28, borderRadius: 14, background: cols[i], boxShadow: "inset 0 0 0 2px #0002" }} />
              <span style={{ fontSize: 36, fontWeight: 700 }}>{s}</span>
              <span style={{ marginLeft: "auto", fontSize: 32, color: "#8a7564" }}>{amounts[i]}</span>
            </div>
          ))}
          <div style={{ marginTop: 26, fontSize: 28, fontWeight: 700, color: pal.v }}>{nameOf(b)}</div>
        </div>
      )}
      <Track src="tracks/cocktail-build.wav" on={audio} />
    </AbsoluteFill>
  );
}
