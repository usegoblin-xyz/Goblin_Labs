import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { SERIF, Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, hash, lerp, mix, nameOf, palette, seg, useT } from "../../motion";

type C = { drink: string; one: string; two: string; three: string; serve: string };

// A stirred-drink recipe, start to finish: a jigger measures three equal parts
// into a mixing glass, ice tumbles in, a bar spoon stirs until the glass
// frosts, the drink is strained over one big cube, and an orange peel is
// expressed over the top. The recipe card on the right ticks off each step.
const COLS = ["#e9eef0", "#c8102e", "#6e2614"];

export default function StirredCocktail({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const drink = c.drink || "The Ember";
  const steps = [c.one || "30 ml gin", c.two || "30 ml red bitter", c.three || "30 ml sweet vermouth", "Stir with ice", "Strain over a big cube", "Express orange peel"];
  const stepAt = [0.6, 1.4, 2.2, 3.6, 5.4, 6.7];

  // mixing glass geometry
  const MX = 600;
  const MB = 880;
  const MW = 240;
  const MH = 380;
  const pour = (i: number) => c01((t - stepAt[i] - 0.25) / 0.45);
  const vol = [0, 1, 2].reduce((s, i) => s + pour(i), 0) / 3; // 0..1
  const liquidCol = (() => {
    const w = [0, 1, 2].map((i) => pour(i));
    const tot = w[0] + w[1] + w[2];
    if (tot < 0.001) return COLS[0];
    const a = mix(COLS[0], COLS[1], w[1] / Math.max(0.001, w[0] + w[1]));
    return mix(a, COLS[2], w[2] / tot);
  })();
  const stir = c01((t - 3.6) / 1.7);
  const frost = expOut(c01((t - 4.0) / 1.4));
  const tilt = expInOut(seg(t, 5.4, 0.5)) * (1 - expInOut(seg(t, 6.6, 0.4)));
  const drain = c01((t - 5.75) / 0.8);
  const rocks = drain;
  const peel = c01((t - 6.7) / 1.0);
  const endP = c01((t - 8.1) / 0.6);
  const hero = expInOut(seg(t, 7.4, 0.6));

  // mixing glass transform during the strain: lift, move right and tilt
  const gx = lerp(0, 330, tilt);
  const gy = lerp(0, -300, tilt);
  const ga = tilt * 62;
  const glassPath = `M${-MW / 2},${-MH} L${-MW / 2 + 16},0 L${MW / 2 - 16},0 L${MW / 2},${-MH} Z`;
  const T = `translate(${MX + gx} ${MB + gy}) rotate(${ga} ${MW / 2} ${-MH})`;
  const surf = (vol > 0 ? MB - 20 : MB + 10) - vol * (1 - drain) * (MH * 0.55);
  const lipX = MX + gx + MW / 2;
  const lipY = MB + gy - MH;

  // rocks glass
  const RX = 1040 - hero * 80;
  const RB = 880;
  const RW = 230;
  const RH = 210;
  const cubeIn = expOut(c01((t - 5.0) / 0.4));

  return (
    <AbsoluteFill style={{ background: pal.dark ? "#16110f" : "#f3ece2", overflow: "hidden", fontFamily: ff }}>
      <Svg>
        <defs>
          <clipPath id="sc-mix">
            <path d={glassPath} transform={T} />
          </clipPath>
          <clipPath id="sc-rocks">
            <path d={`M${RX - RW / 2},${RB - RH} L${RX - RW / 2 + 8},${RB} L${RX + RW / 2 - 8},${RB} L${RX + RW / 2},${RB - RH} Z`} />
          </clipPath>
        </defs>
        {/* bar top */}
        <rect x={0} y={880} width={1920} height={200} fill={pal.dark ? "#2a1d16" : "#d9c8b2"} />
        <rect x={0} y={880} width={1920} height={6} fill="#000" opacity={0.12} />

        {/* mixing glass */}
        <g opacity={1 - c01((t - 6.9) / 0.4)}>
          <g clipPath="url(#sc-mix)">
            <rect x={0} y={surf} width={1920} height={1200} fill={liquidCol} opacity={0.9} />
            {/* ice */}
            {t > 3.0 &&
              Array.from({ length: 6 }).map((_, i) => {
                const drop = expOut(c01((t - 3.0 - i * 0.07) / 0.4));
                const sa = stir * Math.PI * 6 + i;
                const x = MX + gx + Math.cos(sa) * 60 * (stir > 0 ? 1 : 0) + (i % 3 - 1) * 60 - Math.cos(i) * 0;
                const y = lerp(MB - MH - 200, MB - 60 - Math.floor(i / 3) * 70, drop) + gy;
                return <rect key={i} x={x - 32} y={y - 32} width={64} height={64} rx={10} fill="#ffffff" opacity={0.55} transform={`rotate(${hash(i) * 40 + sa * 20} ${x} ${y})`} />;
              })}
            {/* frost */}
            <rect x={0} y={0} width={1920} height={1080} fill="#ffffff" opacity={0.18 * frost} />
          </g>
          <path d={glassPath} transform={T} fill="none" stroke={pal.fg} strokeWidth={5} strokeLinejoin="round" opacity={0.75} />
          {/* bar spoon */}
          {t > 3.4 && t < 5.5 && (() => {
            const a = stir * Math.PI * 7;
            const sx = MX + Math.cos(a) * 50;
            return (
              <g opacity={c01((t - 3.4) / 0.2) * (1 - c01((t - 5.2) / 0.2))}>
                <line x1={sx} y1={MB - 60} x2={sx + Math.cos(a) * 30 + 40} y2={MB - MH - 220} stroke="#b8b8bc" strokeWidth={8} strokeLinecap="round" />
                <circle cx={sx + Math.cos(a) * 30 + 40} cy={MB - MH - 224} r={10} fill="#b8b8bc" />
              </g>
            );
          })()}
        </g>

        {/* jigger pours */}
        {[0, 1, 2].map((i) => {
          const at = stepAt[i];
          const v = c01((t - at) / 0.25) * (1 - c01((t - at - 0.75) / 0.2));
          if (v <= 0) return null;
          const tip = expOut(c01((t - at - 0.1) / 0.2)) * (1 - c01((t - at - 0.7) / 0.1));
          const jx = MX - 40;
          const jy = MB - MH - 120;
          const flowing = t > at + 0.25 && t < at + 0.7;
          return (
            <g key={i} opacity={v}>
              <g transform={`translate(${jx} ${jy}) rotate(${tip * 70})`}>
                <path d="M-40,-60 L40,-60 L12,0 L40,60 L-40,60 L-12,0 Z" fill="#c9c9cd" stroke={pal.fg} strokeWidth={3} strokeLinejoin="round" opacity={0.9} />
                <path d="M-36,-56 L36,-56 L14,-6 L-14,-6 Z" fill={COLS[i]} opacity={1 - pour(i)} />
              </g>
              {flowing && <line x1={jx + 50} y1={jy - 20} x2={jx + 50} y2={surf} stroke={COLS[i]} strokeWidth={10} strokeLinecap="round" opacity={0.95} />}
            </g>
          );
        })}

        {/* rocks glass */}
        <g clipPath="url(#sc-rocks)">
          <rect x={RX - RW} y={RB - 20 - rocks * RH * 0.7} width={RW * 2} height={rocks > 0 ? 400 : 0} fill={mix(mix(COLS[0], COLS[1], 0.5), COLS[2], 0.33)} opacity={0.9} />
          <rect x={RX - 62} y={lerp(RB - RH - 300, RB - 140, cubeIn)} width={124} height={124} rx={18} fill="#ffffff" opacity={cubeIn > 0 ? 0.5 : 0} />
        </g>
        <path d={`M${RX - RW / 2},${RB - RH} L${RX - RW / 2 + 8},${RB} L${RX + RW / 2 - 8},${RB} L${RX + RW / 2},${RB - RH} Z`} fill="none" stroke={pal.fg} strokeWidth={5} opacity={0.75} />
        <rect x={RX - RW / 2 + 8} y={RB - 18} width={RW - 16} height={18} fill={pal.fg} opacity={0.15} />
        {/* strain stream */}
        {drain > 0 && drain < 1 && <path d={`M${lipX + 10},${lipY + 20} Q${lipX + 60},${lipY + 40} ${RX},${RB - 20 - rocks * RH * 0.7}`} stroke={liquidCol} strokeWidth={10} fill="none" strokeLinecap="round" />}

        {/* orange peel */}
        {peel > 0 && (() => {
          const squeeze = Math.sin(c01(peel / 0.5) * Math.PI);
          const fall = expInOut(c01((peel - 0.55) / 0.45));
          const px = RX + 40 - fall * 30;
          const py = lerp(RB - RH - 140, RB - RH + 10, fall);
          return (
            <g>
              <ellipse cx={px} cy={py} rx={70 * (1 - squeeze * 0.25)} ry={22} fill="#f28c28" transform={`rotate(${-15 + fall * 40} ${px} ${py})`} />
              <ellipse cx={px} cy={py - 4} rx={60 * (1 - squeeze * 0.25)} ry={12} fill="#ffb15c" transform={`rotate(${-15 + fall * 40} ${px} ${py})`} />
              {squeeze > 0.05 &&
                Array.from({ length: 18 }).map((_, i) => {
                  const k = c01(peel / 0.55);
                  const a = Math.PI / 2 + (hash(i, 1) - 0.5) * 1.6;
                  return <circle key={i} cx={px + Math.cos(a) * 140 * k * hash(i, 2)} cy={py + Math.sin(a) * 140 * k * hash(i, 3)} r={3} fill="#ffb15c" opacity={0.8 * (1 - k)} />;
                })}
            </g>
          );
        })()}

        {/* recipe card */}
        <g transform={`translate(${1340 + hero * 600} 170)`} opacity={c01(t / 0.4) * (1 - hero)}>
          <text x={0} y={0} fontFamily={SERIF} fontSize={84} fontStyle="italic" fill={pal.fg}>
            {drink}
          </text>
          <text x={0} y={52} fontFamily={ff} fontSize={24} fill={pal.muted} letterSpacing={3}>
            STIRRED · ROCKS · ORANGE
          </text>
          {steps.map((s, i) => {
            const on = t > stepAt[i];
            const done = t > (stepAt[i + 1] ?? 7.7);
            return (
              <g key={i} transform={`translate(0 ${130 + i * 74})`} opacity={on ? 1 : 0.35}>
                <circle cx={18} cy={-10} r={18} fill={done ? pal.p : "none"} stroke={on ? pal.p : pal.muted} strokeWidth={3} />
                {done && <path d="M9,-10 L16,-3 L28,-18" stroke={pal.onP} strokeWidth={4} fill="none" strokeLinecap="round" />}
                <text x={54} y={0} fontFamily={ff} fontSize={34} fontWeight={on && !done ? 800 : 500} fill={pal.fg}>
                  {s}
                </text>
              </g>
            );
          })}
        </g>

        {endP > 0 && (
          <>
            <Txt text={drink} x={1380} y={500} size={fit(drink, 800, 150, 400, -0.01, SERIF)} weight={400} color={pal.fg} font={SERIF} p={endP} italic tracking={-0.01} />
            <Txt text={c.serve || "Stir 30 seconds. Serve very cold."} x={1380} y={580} size={36} weight={500} color={pal.muted} font={ff} p={c01((t - 8.4) / 0.5)} mode="fade" />
            <Txt text={name} x={1380} y={680} size={40} weight={800} color={pal.p} font={ff} p={c01((t - 8.7) / 0.5)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/stirred-cocktail.wav" on={audio} />
    </AbsoluteFill>
  );
}
