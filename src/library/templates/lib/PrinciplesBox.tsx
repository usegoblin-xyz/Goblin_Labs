import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { principles: string; role: string };

// Motion principles performed by one character: a box with a springy
// antenna. Anticipation (it crouches before jumping), follow-through (the
// antenna keeps swinging after landing), overlapping action (its eyes lag
// the body), and arcs (it hops along a dotted arc); each gets a title card.
export default function PrinciplesBox({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const names = [...list(c.principles || "Anticipation, Follow-through, Overlap, Arcs"), "Principle", "Principle", "Principle", "Principle"].slice(0, 4);
  const per = 2.0;
  const k = Math.min(3, Math.floor(t / per));
  const u = t - k * per;
  const ground = 760;
  const outro = expInOut(seg(t, 8.6, 0.5));
  // jump: crouch 0–0.4, air 0.4–1.0, land at 1.0
  const crouch = k === 0 ? Math.sin(c01(u / 0.45) * Math.PI / 2) * (u < 0.5 ? 1 : 0) : u < 0.25 ? Math.sin(c01(u / 0.25) * Math.PI / 2) * (u < 0.3 ? 1 : 0) * 0.6 : 0;
  const air = c01((u - 0.45) / 0.65);
  const hgt = Math.sin(air * Math.PI) * (k === 3 ? 240 : 250);
  const landT = u - 1.1;
  const landSq = landT > 0 ? Math.exp(-landT * 8) * Math.cos(landT * 30) * 0.18 : 0;
  const sy = 1 - crouch * 0.3 + (air > 0 && air < 1 ? 0.12 : 0) - landSq;
  const sx = 1 / Math.max(0.6, sy);
  const x = k === 3 ? lerp(560, 1360, air) : 960;
  const y = ground - hgt;
  const vy = Math.cos(air * Math.PI); // + up, - down
  // antenna follow-through: damped spring driven by vertical motion & landing
  const swing = (k >= 1 ? 1 : 0.5) * (air > 0 && air < 1 ? -vy * 22 : landT > 0 ? Math.exp(-landT * 2.5) * Math.sin(landT * 14) * 40 : 0);
  // eyes lag (overlap)
  const eyeLag = k >= 2 ? (air > 0 && air < 1 ? vy * 14 : landT > 0 ? Math.exp(-landT * 4) * Math.sin(landT * 12) * 12 : 0) : 0;
  const size = 200;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          <line x1={0} x2={1920} y1={ground} y2={ground} stroke={pal.line} strokeWidth={6} />
          {k === 3 && (
            <path d={`M560,${ground - size / 2} Q960,${ground - 260 * 2 - size / 2} 1360,${ground - size / 2}`} fill="none" stroke={pal.faint} strokeWidth={4} strokeDasharray="4 16" strokeLinecap="round" />
          )}
          {/* ghost frames for arcs */}
          {k === 3 &&
            [0.2, 0.4, 0.6, 0.8].map((a) => (
              <rect key={a} x={lerp(560, 1360, a) - size / 2} y={ground - Math.sin(a * Math.PI) * 260 - size} width={size} height={size} rx={30} fill="none" stroke={pal.faint} strokeWidth={3} opacity={air > a ? 0.6 : 0} />
            ))}
          <ellipse cx={x} cy={ground + 6} rx={size * 0.6 * (1 - hgt / 700)} ry={14} fill="#000" opacity={0.15} />
          <g transform={`translate(${x} ${y}) scale(${sx} ${sy})`}>
            {/* antenna */}
            <path d={`M0,${-size} Q${swing * 0.6},${-size - 70} ${swing},${-size - 130}`} fill="none" stroke={pal.fg} strokeWidth={8} strokeLinecap="round" />
            <circle cx={swing} cy={-size - 140} r={16} fill={pal.a} />
            <rect x={-size / 2} y={-size} width={size} height={size} rx={34} fill={pal.v} />
            <circle cx={-38} cy={-size * 0.62 + eyeLag} r={22} fill="#fff" />
            <circle cx={38} cy={-size * 0.62 + eyeLag} r={22} fill="#fff" />
            <circle cx={-34} cy={-size * 0.6 + eyeLag * 1.4} r={10} fill="#111" />
            <circle cx={42} cy={-size * 0.6 + eyeLag * 1.4} r={10} fill="#111" />
          </g>
          {/* title */}
          <Txt key={k} text={names[k]} x={960} y={150} size={110} weight={900} color={pal.fg} font={ff} p={c01(u / 0.3)} out={c01((u - per + 0.2) / 0.2)} tracking={-0.03} mode="rise" />
          <Txt text={`${String(k + 1).padStart(2, "0")} / 04`} x={960} y={210} size={30} weight={700} color={pal.muted} font={ff} p={c01(u / 0.3)} />
          {t > 8.0 && (
            <>
              <Txt text={nameOf(b)} x={960} y={950} size={60} weight={900} color={pal.fg} font={ff} p={c01((t - 8.0) / 0.4)} tracking={-0.03} />
              <Txt text={c.role || "Character animation"} x={960} y={1020} size={34} weight={600} color={pal.v} font={ff} p={c01((t - 8.2) / 0.4)} mode="fade" />
            </>
          )}
        </Svg>
      </div>
      <Track src="tracks/principles-box.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = [spring];
