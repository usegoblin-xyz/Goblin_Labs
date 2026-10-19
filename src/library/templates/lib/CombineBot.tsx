import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fontOf, lerp, mix, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { callout: string; tagline: string };

// Three vehicles race in (a car, a jet, a truck), leap, and transform
// mid-air into the parts of one giant robot: the truck becomes the legs, the
// car the torso and arms, the jet the head and wings. Pose, flash, name.
type Part = { car: [number, number, number, number]; bot: [number, number, number, number]; col: string; r?: number };

export default function CombineBot({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const A = pal.v;
  const B = mix(pal.v, "#000000", 0.35);
  const C2 = pal.a;
  const D = mix(pal.fg, pal.bg, 0.25);
  const race = expOut(seg(t, 0, 1.6));
  const leap = seg(t, 2.2, 0.8);
  const form = expInOut(seg(t, 2.6, 1.4));
  const settle = spring(t - 4.0, 12, 0.5);
  const flash = c01(1 - Math.abs(t - 4.1) * 4);
  const pose = expOut(seg(t, 4.3, 0.6));
  const outro = expInOut(seg(t, 7.4, 0.5));
  const endP = c01((t - 7.8) / 0.8);
  // vehicle-space rects [x, y, w, h] in screen coords; robot-space rects in the same
  const parts: Part[] = [
    // truck → legs
    { car: [1200, 760, 300, 140], bot: [870, 680, 80, 300], col: B, r: 14 },
    { car: [1500, 780, 140, 120], bot: [970, 680, 80, 300], col: B, r: 14 },
    { car: [1220, 900, 60, 60], bot: [850, 960, 120, 50], col: D, r: 24 },
    { car: [1440, 900, 60, 60], bot: [950, 960, 120, 50], col: D, r: 24 },
    // car → torso and arms
    { car: [620, 820, 360, 110], bot: [840, 440, 240, 250], col: A, r: 20 },
    { car: [690, 760, 200, 70], bot: [700 - pose * 20, 450 - pose * 60, 130, 70], col: C2, r: 20 },
    { car: [640, 930, 60, 60], bot: [1090, 450 - pose * 160, 130, 70], col: C2, r: 20 },
    { car: [900, 930, 60, 60], bot: [1150, 330 - pose * 220, 70, 70], col: D, r: 35 },
    // jet → head and wings
    { car: [400, 300, 300, 70], bot: [900, 300, 120, 120], col: A, r: 28 },
    { car: [500, 250, 120, 50], bot: [930, 345, 60, 20], col: "#fff", r: 10 },
    { car: [440, 340, 160, 40], bot: [690, 470, 160, 40], col: C2, r: 8 },
    { car: [560, 220, 80, 60], bot: [1070, 470, 160, 40], col: C2, r: 8 },
  ];
  const racing = (i: number) => {
    // vehicles slide in from the sides with a bob
    const fromLeft = i >= 4;
    const dx = (1 - race) * (fromLeft ? -1400 : 1400);
    const bob = Math.sin(t * 22 + i) * 3 * (1 - form);
    const hop = -Math.sin(Math.PI * leap) * 260;
    return { dx, dy: bob + hop };
  };

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        <g opacity={1 - outro} transform={`translate(0 ${(1 - settle) * 0})`}>
          {/* speed lines while racing */}
          {form < 0.3 &&
            Array.from({ length: 10 }, (_, i) => {
              const y = 200 + i * 80;
              const x = ((t * 2600 + i * 400) % 2400) - 400;
              return <line key={i} x1={1920 - x} x2={1920 - x - 220} y1={y} y2={y} stroke={pal.line} strokeWidth={4} />;
            })}
          <line x1={0} x2={1920} y1={960} y2={960} stroke={pal.line} strokeWidth={4} opacity={1 - form} />
          {parts.map((p, i) => {
            const { dx, dy } = racing(i);
            const [x0, y0, w0, h0] = p.car;
            const [x1, y1, w1, h1] = p.bot;
            const stagger = c01((form - (i % 4) * 0.06) / 0.82);
            const e = cubicInOut(stagger);
            const spin = Math.sin(e * Math.PI) * (i % 2 ? 180 : -180);
            const x = lerp(x0 + dx, x1, e);
            const y = lerp(y0 + dy, y1, e) - (1 - e) * 0;
            const w = lerp(w0, w1, e);
            const h = lerp(h0, h1, e);
            return <rect key={i} x={x} y={y} width={w} height={h} rx={p.r ?? 10} fill={p.col} transform={`rotate(${spin} ${x + w / 2} ${y + h / 2})`} />;
          })}
          {/* eyes light up */}
          {pose > 0 && <rect x={930} y={345} width={60} height={20} rx={10} fill={pal.fg} opacity={0.5 + 0.5 * Math.sin(t * 12)} />}
        </g>
        {flash > 0 && <rect width={1920} height={1080} fill="#fff" opacity={flash * 0.7} />}
        {pose > 0 && t < 7.4 && <Txt text={c.callout || "Combine!"} x={960} y={190} size={120} weight={900} color={pal.v} font={ff} p={c01((t - 4.4) / 0.4)} out={c01((t - 7.0) / 0.3)} mode="scale" tracking={-0.03} />}
        {endP > 0 && (
          <>
            <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
            <Txt text={c.tagline || "Better together."} x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - 8.2) / 0.6)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/combine-bot.wav" on={audio} />
    </AbsoluteFill>
  );
}
