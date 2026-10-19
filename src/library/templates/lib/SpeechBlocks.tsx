import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, fit, fontOf, hash, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { floor: string; walls: string; roof: string; outro: string };

// A speech built as architecture: spoken lines appear as captions, then
// each phrase becomes a block that drops into place: first the floor slab,
// then wall columns rising on either side, then a roof beam swung in by a
// crane line; dust puffs on each landing, and the finished building holds
// the closing line.
export default function SpeechBlocks({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const floor = (c.floor || "BUILD THE FLOOR").toUpperCase();
  const walls = [...list(c.walls || "TRUST, CRAFT, PATIENCE, GRIT"), "WALL", "WALL", "WALL", "WALL"].slice(0, 4).map((w) => w.toUpperCase());
  const roof = (c.roof || "THEN AIM HIGHER").toUpperCase();
  const ground = 900;
  const floorP = spring(t - 0.8, 13, 0.55);
  const wallP = (i: number) => spring(t - 2.4 - i * 0.45, 14, 0.55);
  const roofP = spring(t - 5.0, 10, 0.6);
  const swing = Math.sin(Math.max(0, 5.0 - t) * 4) * 0;
  const outro = expInOut(seg(t, 9.2, 0.5));
  const endP = c01((t - 7.0) / 0.8);
  const dust = (x: number, y: number, at: number, w: number) => {
    const u = c01((t - at) / 0.8);
    if (u <= 0 || u >= 1) return null;
    return Array.from({ length: 10 }, (_, i) => {
      const dir = i % 2 ? 1 : -1;
      return <circle key={i} cx={x + dir * (w / 2 + u * (60 + hash(i) * 80))} cy={y - u * (20 + hash(i, 2) * 40)} r={(6 + hash(i, 3) * 12) * (1 - u * 0.4)} fill={pal.muted} opacity={0.5 * (1 - u)} />;
    });
  };
  const caption = t < 2.3 ? floor : t < 4.9 ? walls.join(" · ") : roof;
  const capAt = t < 2.3 ? 0.2 : t < 4.9 ? 2.3 : 4.9;
  const wallX = [420, 760, 1160, 1500];
  const wallH = 380;

  return (
    <AbsoluteFill style={{ background: pal.dark ? "#101114" : "#eeebe4", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          <line x1={0} x2={1920} y1={ground} y2={ground} stroke={pal.fg} strokeWidth={4} />
          {/* floor slab */}
          <g transform={`translate(0 ${(1 - floorP) * -1000})`}>
            <rect x={260} y={ground - 110} width={1400} height={110} fill={pal.fg} />
            <text x={960} y={ground - 35} textAnchor="middle" fontFamily={ff} fontSize={fit(floor, 1300, 76, 900, 0.05, ff)} fontWeight={900} fill={pal.bg} letterSpacing="0.05em">
              {floor}
            </text>
          </g>
          {dust(960, ground - 110, 1.0, 1400)}
          {/* walls */}
          {walls.map((w, i) => {
            const p = wallP(i);
            const x = wallX[i];
            return (
              <g key={i}>
                <g transform={`translate(0 ${(1 - p) * -1100})`}>
                  <rect x={x - 60} y={ground - 110 - wallH} width={120} height={wallH} fill={i % 2 ? pal.a : pal.v} />
                  <text transform={`translate(${x + 14} ${ground - 110 - wallH / 2}) rotate(-90)`} textAnchor="middle" fontFamily={ff} fontSize={fit(w, wallH - 40, 56, 900, 0.05, ff)} fontWeight={900} fill={i % 2 ? pal.onA : pal.onV} letterSpacing="0.05em">
                    {w}
                  </text>
                </g>
                {dust(x, ground - 110 - 0, 2.6 + i * 0.45, 120)}
              </g>
            );
          })}
          {/* crane line and roof */}
          {t > 4.7 && <line x1={960} y1={0} x2={960} y2={ground - 110 - wallH - 120 - (1 - roofP) * 600} stroke={pal.muted} strokeWidth={4} opacity={1 - c01((t - 6.2) * 2)} />}
          <g transform={`translate(0 ${(1 - roofP) * -600}) rotate(${(1 - roofP) * 6 + swing} 960 ${ground - 110 - wallH - 60})`}>
            <rect x={300} y={ground - 110 - wallH - 120} width={1320} height={120} fill={pal.fg} opacity={t > 4.7 ? 1 : 0} />
            <text x={960} y={ground - 110 - wallH - 40} textAnchor="middle" fontFamily={ff} fontSize={fit(roof, 1200, 80, 900, 0.05, ff)} fontWeight={900} fill={pal.bg} letterSpacing="0.05em" opacity={t > 4.7 ? 1 : 0}>
              {roof}
            </text>
          </g>
          {/* caption */}
          {endP <= 0 && <Txt key={capAt} text={`“${caption.toLowerCase()}”`} x={960} y={1010} size={40} weight={500} color={pal.muted} font={ff} p={c01((t - capAt) / 0.5)} mode="type" italic />}
          {endP > 0 && (
            <>
              <Txt text={c.outro || "Every great thing has a floor."} x={960} y={150} size={70} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.03} />
              <Txt text={nameOf(b)} x={960} y={1010} size={44} weight={700} color={pal.v} font={ff} p={c01((t - 7.6) / 0.6)} mode="fade" />
            </>
          )}
        </Svg>
      </div>
      <Track src="tracks/speech-blocks.wav" on={audio} />
    </AbsoluteFill>
  );
}
