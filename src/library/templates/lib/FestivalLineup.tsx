import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, hash, mix, palette, seg, useT } from "../../motion";

type C = { festival: string; dates: string; city: string; headliners: string; artists: string; cta: string };

// A ten-second vertical lineup reel cut on the beat at 128 BPM. The festival
// name slams in over a sun-burst, the dates and city flash, each headliner
// gets its own full-screen beat, the rest of the lineup stacks in a poster
// grid, and the ticket call to action pulses on the downbeat.
const W = 1080;
const H = 1920;
const BEAT = 60 / 128;

export default function FestivalLineup({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const fest = c.festival || "Solar Tide";
  const heads = (c.headliners || "Nova Kai / The Lumen Set / Aster & Vale").split("/").map((s) => s.trim()).filter(Boolean).slice(0, 3);
  const rest = (c.artists || "DJ Marrow / Kito Bloom / Saint Ocre / Pale Harbour / Rue Delta / Mika Sol / Ivo & The Tides / Lune").split("/").map((s) => s.trim()).filter(Boolean).slice(0, 10);
  const beat = Math.floor(t / BEAT);
  const bp = (t % BEAT) / BEAT;
  const kick = Math.exp(-bp * 5);

  // sections in beats
  const sTitle = t < 4 * BEAT;
  const sDates = t >= 4 * BEAT && t < 6 * BEAT;
  const hIdx = Math.floor((t - 6 * BEAT) / (2 * BEAT));
  const sHead = t >= 6 * BEAT && hIdx < heads.length;
  const gridAt = (6 + heads.length * 2) * BEAT;
  const sGrid = t >= gridAt && t < gridAt + 5 * BEAT;
  const sEnd = t >= gridAt + 5 * BEAT;
  const bg = sHead ? (hIdx % 2 ? pal.a : pal.p) : sDates ? pal.fg : pal.bg;
  const ink = sHead ? (hIdx % 2 ? pal.onA : pal.onP) : sDates ? pal.bg : pal.fg;

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden", fontFamily: ff }}>
      <Svg w={W} h={H}>
        {/* sun-burst rays */}
        <g transform={`translate(540 960) rotate(${t * 12}) scale(${1 + kick * 0.04})`} opacity={sTitle || sEnd ? 0.16 : 0.08}>
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i / 24) * Math.PI * 2;
            const a2 = a + Math.PI / 24;
            return <path key={i} d={`M0,0 L${Math.cos(a) * 1600},${Math.sin(a) * 1600} L${Math.cos(a2) * 1600},${Math.sin(a2) * 1600} Z`} fill={sHead ? ink : pal.p} />;
          })}
        </g>

        {sTitle && (
          <g>
            <circle cx={540} cy={960} r={300 * expOut(c01(t / 0.5)) * (1 + kick * 0.05)} fill={pal.p} />
            {fest.toUpperCase().split(" ").map((w, i, arr) => (
              <Txt key={i} text={w} x={540} y={960 + (i - (arr.length - 1) / 2) * 200 + 60} size={fit(w, 960, 230, 900)} weight={900} color={pal.fg} font={ff} p={c01((t - 0.15 - i * BEAT) / 0.3)} mode="scale" tracking={-0.04} />
            ))}
            <Txt text="FESTIVAL" x={540} y={1440} size={70} weight={800} color={pal.p} font={ff} p={c01((t - 3 * BEAT) / 0.3)} tracking={0.3} />
          </g>
        )}

        {sDates && (
          <g>
            <Txt text={c.dates || "12 · 13 · 14 JUNE"} x={540} y={900} size={fit(c.dates || "12 · 13 · 14 JUNE", 960, 130, 900)} weight={900} color={ink} font={ff} p={c01((t - 4 * BEAT) / 0.25)} mode="drop" tracking={-0.03} />
            <Txt text={(c.city || "Harbour Park").toUpperCase()} x={540} y={1060} size={fit(c.city || "Harbour Park", 900, 90, 800)} weight={800} color={pal.p} font={ff} p={c01((t - 5 * BEAT) / 0.25)} mode="rise" tracking={0.1} />
          </g>
        )}

        {sHead && (() => {
          const name = heads[hIdx].toUpperCase();
          const lt = t - (6 + hIdx * 2) * BEAT;
          const words = name.split(" ");
          return (
            <g transform={`scale(${1 + lt * 0.04}) translate(${-lt * 0.04 * 540} ${-lt * 0.04 * 960})`}>
              <text x={540} y={560} textAnchor="middle" fontFamily={ff} fontSize={40} fontWeight={800} fill={ink} letterSpacing={10} opacity={0.75}>
                {["HEADLINER", "ALSO HEADLINING", "CLOSING NIGHT"][hIdx]}
              </text>
              {words.map((w, i) => (
                <Txt key={i} text={w} x={540} y={960 + (i - (words.length - 1) / 2) * 210 + 70} size={fit(w, 980, 240, 900)} weight={900} color={ink} font={ff} p={c01((lt - i * 0.08) / 0.22)} mode="scale" tracking={-0.04} />
              ))}
            </g>
          );
        })()}

        {sGrid && (() => {
          const lt = t - gridAt;
          return (
            <g>
              <text x={540} y={300} textAnchor="middle" fontFamily={ff} fontSize={46} fontWeight={800} fill={pal.p} letterSpacing={8}>
                PLUS
              </text>
              {rest.map((a, i) => {
                const e = expOut(c01((lt - i * 0.09) / 0.25));
                const y = 440 + i * 120;
                const size = fit(a.toUpperCase(), 900, 92, 900);
                return (
                  <g key={i} opacity={e} transform={`translate(${(1 - e) * (i % 2 ? 300 : -300)} 0)`}>
                    <Txt text={a.toUpperCase()} x={540} y={y} size={size} weight={900} color={i % 3 === 0 ? pal.p : pal.fg} font={ff} p={1} tracking={-0.03} />
                  </g>
                );
              })}
            </g>
          );
        })()}

        {sEnd && (() => {
          const lt = t - gridAt - 5 * BEAT;
          const e = expInOut(c01(lt / 0.4));
          return (
            <g>
              <Txt text={fest.toUpperCase()} x={540} y={720} size={fit(fest.toUpperCase(), 960, 170, 900)} weight={900} color={pal.fg} font={ff} p={e} tracking={-0.04} />
              <Txt text={c.dates || "12 · 13 · 14 JUNE"} x={540} y={830} size={56} weight={700} color={pal.muted} font={ff} p={c01((lt - 0.2) / 0.3)} mode="fade" />
              <g transform={`translate(540 1080) scale(${(1 + kick * 0.06) * expOut(c01((lt - 0.4) / 0.3))})`}>
                <rect x={-380} y={-80} width={760} height={160} rx={80} fill={pal.p} />
                <text x={0} y={22} textAnchor="middle" fontFamily={ff} fontSize={60} fontWeight={900} fill={pal.onP}>
                  {(c.cta || "Tickets on sale now").toUpperCase()}
                </text>
              </g>
            </g>
          );
        })()}

        {/* confetti on every bar */}
        {beat % 4 === 0 &&
          Array.from({ length: 24 }).map((_, i) => {
            const a = hash(i, beat) * Math.PI * 2;
            const r = bp * (500 + hash(i, beat, 2) * 500);
            return <rect key={i} x={540 + Math.cos(a) * r} y={960 + Math.sin(a) * r + bp * bp * 300} width={18} height={10} fill={mix(pal.p, pal.a, hash(i, 3))} opacity={1 - bp} transform={`rotate(${a * 57} ${540 + Math.cos(a) * r} ${960 + Math.sin(a) * r})`} />;
          })}
      </Svg>
      <Track src="tracks/festival-lineup.wav" on={audio} />
    </AbsoluteFill>
  );
}
