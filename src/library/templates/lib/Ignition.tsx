import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expIn, expInOut, expOut, fit, fontOf, hash, lerp, nameOf, palette, seg, useT } from "../../motion";

type C = { line1: string; line2: string; tagline: string };

// A slow, heavy build: thousands of particles drift toward a core, the core
// tightens and glows while two quiet lines appear, then it implodes to a
// point, holds one beat of silence, and detonates into light that resolves
// into the name.
export default function Ignition({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const gather = expInOut(seg(t, 0, 5.5));
  const implode = expIn(seg(t, 6.0, 0.6));
  const flash = c01(1 - Math.abs(t - 6.9) * 3.5);
  const blast = expOut(seg(t, 6.85, 1.6));
  const endP = c01((t - 7.6) / 1.0);
  const N = 520;
  const glow = lerp(40, 180, gather) * (1 - implode);

  return (
    <AbsoluteFill style={{ background: "#040405", overflow: "hidden", fontFamily: ff }}>
      <Svg>
        <defs>
          <radialGradient id="ig-core">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.95} />
            <stop offset="30%" stopColor={pal.v} stopOpacity={0.7} />
            <stop offset="100%" stopColor={pal.v} stopOpacity={0} />
          </radialGradient>
        </defs>
        {t < 6.85 && <circle cx={960} cy={540} r={glow * 2.2} fill="url(#ig-core)" opacity={0.8} />}
        {Array.from({ length: N }, (_, i) => {
          const a = hash(i, 1) * Math.PI * 2;
          const R = 300 + hash(i, 2) * 1100;
          const swirl = a + t * (0.2 + hash(i, 3) * 0.3) * (1 + gather * 2);
          let r = lerp(R, 60 + hash(i, 4) * 120, gather);
          r = lerp(r, 0, implode);
          if (t > 6.85) r = blast * (400 + hash(i, 5) * 1600);
          const x = 960 + Math.cos(swirl) * r * 1.3;
          const y = 540 + Math.sin(swirl) * r * 0.75;
          const size = t > 6.85 ? 2 + (1 - blast) * 5 : 1.5 + hash(i, 6) * 2.5;
          const op = t > 6.85 ? 1 - blast * 0.8 : 0.3 + gather * 0.6;
          return <circle key={i} cx={x} cy={y} r={size} fill={hash(i, 7) > 0.7 ? "#ffffff" : pal.v} opacity={op} />;
        })}
        {t < 6.0 && (
          <>
            <Txt text={c.line1 || "Everything you have read."} x={960} y={190} size={54} weight={500} color="rgba(255,255,255,0.75)" font={ff} p={c01((t - 1.2) / 1.0)} out={c01((t - 5.4) / 0.5)} mode="blur" />
            <Txt text={c.line2 || "Concentrated."} x={960} y={930} size={54} weight={500} color="rgba(255,255,255,0.75)" font={ff} p={c01((t - 3.2) / 1.0)} out={c01((t - 5.4) / 0.5)} mode="blur" />
          </>
        )}
        {flash > 0 && <rect width={1920} height={1080} fill="#fff" opacity={flash} />}
        {endP > 0 && (
          <>
            <Txt text={nameOf(b)} x={960} y={570} size={fit(nameOf(b), 1600, 220, 800, -0.05, ff)} weight={800} color="#ffffff" font={ff} p={endP} tracking={-0.05} mode="blur" />
            <Txt text={c.tagline || "Knowledge, concentrated."} x={960} y={700} size={46} weight={500} color={pal.v} font={ff} p={c01((t - 8.2) / 0.8)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/ignition.wav" on={audio} />
    </AbsoluteFill>
  );
}
