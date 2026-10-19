import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, fontOf, nameOf, palette, seg, useT } from "../../motion";

type C = { words: string; name: string };

// A kinetic-type self-portrait: rows of the subject's own words scroll in
// alternating directions, clipped inside a head-and-shoulders profile; the
// words inside the silhouette are bold and bright, outside they are faint,
// and the profile turns slightly before the name sets beneath.
export default function TypePortrait({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const words = list(c.words || "curious, maker, night owl, coffee, type nerd, runner, builder, dreamer, listener, optimist");
  const name = c.name || nameOf(b);
  const reveal = expInOut(seg(t, 0.4, 1.4));
  const turn = Math.sin(t * 0.7) * 0.04;
  const outro = expInOut(seg(t, 8.2, 0.5));
  const endP = c01((t - 8.6) / 0.8);
  const rows = 22;
  const rowH = 52;
  const line = (r: number) => Array.from({ length: 10 }, (_, i) => words[(r * 3 + i) % words.length]).join(" · ") + " · ";
  // a stylised profile facing left, centred ~960
  const head = `M1060,1080 C1060,960 1170,930 1250,900 C1330,870 1330,820 1300,800 L1220,770 C1210,740 1230,720 1200,700 C1220,690 1220,670 1200,660 C1215,640 1205,620 1180,610 C1190,560 1170,520 1140,500 C1180,470 1190,420 1180,380 C1160,250 1060,180 950,190 C830,200 750,290 760,420 C770,520 820,580 860,630 C880,700 860,760 830,800 C760,850 660,880 640,1080 Z`;

  return (
    <AbsoluteFill style={{ background: pal.dark ? "#0a0a0c" : pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro, clipPath: `inset(${(1 - reveal) * 100}% 0 0 0)`, transform: `scaleX(${1 + turn})` }}>
        <Svg>
          <defs>
            <clipPath id="tp-head">
              <path d={head} />
            </clipPath>
          </defs>
          <g>
            {/* faint field */}
            {Array.from({ length: rows }, (_, r) => {
              const dir = r % 2 ? 1 : -1;
              const off = ((t * 90 * dir + r * 137) % 1400) - 1400;
              return (
                <text key={r} x={off} y={30 + r * rowH} fontFamily={ff} fontSize={40} fontWeight={500} fill={pal.fg} opacity={0.12}>
                  {line(r) + line(r) + line(r)}
                </text>
              );
            })}
            {/* bold inside the head */}
            <g clipPath="url(#tp-head)">
              <rect x={600} y={150} width={800} height={950} fill={pal.v} opacity={0.12} />
              {Array.from({ length: rows }, (_, r) => {
                const dir = r % 2 ? 1 : -1;
                const off = ((t * 90 * dir + r * 137) % 1400) - 1400;
                return (
                  <text key={r} x={off} y={30 + r * rowH} fontFamily={ff} fontSize={40} fontWeight={900} fill={r % 3 === 0 ? pal.v : pal.fg}>
                    {line(r) + line(r) + line(r)}
                  </text>
                );
              })}
            </g>
          </g>
        </Svg>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={name} x={960} y={520} size={150} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={words.slice(0, 3).join(" · ")} x={960} y={630} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 9.0) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/type-portrait.wav" on={audio} />
    </AbsoluteFill>
  );
}
