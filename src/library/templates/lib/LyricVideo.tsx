import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, backOut, c01, expInOut, expOut, fit, fontOf, nameOf, onColor, palette, seg, spring, txtW, useT } from "../../motion";

type C = { lyrics: string; song: string };

// A lyric video: six lines, each in its own typographic layout, every word
// landing on an eighth note at 120 BPM. The background wipes to a new colour
// with each line, and the last line hands over to the song credit.
const LINE_T = [0.4, 1.75, 3.1, 4.45, 5.8, 7.15];
const STEP = 0.25;

export default function LyricVideo({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const lines = (c.lyrics || "We were made of city lights / running every red / out into the night / say it louder / never let it fade / this is where we start")
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
  while (lines.length < 6) lines.push("la la la");
  const bgs = [pal.bg, pal.p, pal.bg, pal.a, "#0b0b0c", pal.p, pal.bg];
  const li = LINE_T.reduce((k, at, i) => (t >= at ? i : k), -1);
  const local = li >= 0 ? t - LINE_T[li] : 0;
  const words = li >= 0 ? lines[li].split(/\s+/) : [];
  const wp = (i: number) => c01((local - i * STEP) / 0.22);
  const bg = li >= 0 ? bgs[li] : pal.bg;
  const prevBg = li > 0 ? bgs[li - 1] : pal.bg;
  const wipe = expInOut(seg(local, 0, 0.3));
  const ink = onColor(bg);
  const endP = c01((t - 8.55) / 0.5);

  let body = null;
  if (li === 0) {
    const size = fit(lines[0], 1700, 170, 900);
    const xs: number[] = [];
    let acc = 0;
    const total = txtW(lines[0], size, 900, -0.04, ff);
    words.forEach((w, i) => {
      xs.push(acc);
      acc += txtW(w + (i < words.length - 1 ? " " : ""), size, 900, -0.04, ff);
    });
    body = words.map((w, i) => {
      const s = backOut(wp(i), 2.4);
      const cx = 960 - total / 2 + xs[i] + txtW(w, size, 900, -0.04, ff) / 2;
      return (
        <g key={i} transform={`translate(${cx} 560) scale(${s}) translate(${-cx} -560)`}>
          <Txt text={w} x={cx} y={600} size={size} weight={900} color={i === words.length - 1 ? pal.p : ink} font={ff} tracking={-0.04} mode="fade" stagger={0} />
        </g>
      );
    });
  } else if (li === 1) {
    body = words.map((w, i) => {
      const e = expOut(wp(i));
      return <Txt key={i} text={w} x={160 - (1 - e) * 300} y={300 + i * 200} size={200} weight={900} color={ink} font={ff} anchor="start" tracking={-0.05} opacity={e} mode="fade" stagger={0} />;
    });
  } else if (li === 2) {
    const size = fit(lines[2], 1700, 180, 900);
    let x = 960 - txtW(lines[2], size, 900, -0.04, ff) / 2;
    body = words.map((w, i) => {
      const s = spring(local - i * STEP, 16, 0.45);
      const y = 600 - (1 - s) * 700;
      const el = <Txt key={i} text={w} x={x} y={y} size={size} weight={900} color={i % 2 ? pal.p : ink} font={ff} anchor="start" tracking={-0.04} mode="fade" stagger={0} opacity={c01(s * 4)} />;
      x += txtW(w + " ", size, 900, -0.04, ff);
      return el;
    });
  } else if (li === 3) {
    body = (
      <>
        <g transform="translate(330 540) rotate(-90)">
          <Txt text={words[0] ?? ""} x={0} y={110} size={fit(words[0] ?? "", 980, 300, 900)} weight={900} color={ink} font={ff} p={expOut(wp(0))} mode="rise" tracking={-0.05} />
        </g>
        {words.slice(1).map((w, i) => (
          <Txt key={i} text={w} x={620} y={380 + i * 170} size={150} weight={900} color={ink} font={ff} anchor="start" p={expOut(wp(i + 1))} mode="rise" tracking={-0.04} />
        ))}
      </>
    );
  } else if (li === 4) {
    const size = fit(lines[4], 1700, 190, 900);
    const fill = c01((local - 0.15) / 1.0);
    body = (
      <>
        <text x={960} y={610} textAnchor="middle" fontFamily={ff} fontSize={size} fontWeight={900} letterSpacing="-0.04em" fill="none" stroke={pal.p} strokeWidth={4} opacity={c01(local / 0.2)}>
          {lines[4]}
        </text>
        <defs>
          <clipPath id="lyric-fill">
            <rect x={0} y={0} width={1920 * fill} height={1080} />
          </clipPath>
        </defs>
        <text x={960} y={610} textAnchor="middle" fontFamily={ff} fontSize={size} fontWeight={900} letterSpacing="-0.04em" fill={pal.p} clipPath="url(#lyric-fill)">
          {lines[4]}
        </text>
      </>
    );
  } else if (li === 5) {
    body = words.map((w, i) => {
      const s = expOut(wp(i));
      const gap = Math.min(175, 820 / Math.max(1, words.length - 1));
      const size = Math.min(230 - i * 10, gap * 1.15);
      return <Txt key={i} text={w} x={960} y={600 - ((words.length - 1) * gap) / 2 + i * gap} size={size} weight={900} color={i === words.length - 1 ? pal.fg : ink} font={ff} p={s} mode="scale" tracking={-0.05} />;
    });
  }

  return (
    <AbsoluteFill style={{ background: prevBg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, background: bg, clipPath: `circle(${wipe * 120}% at 50% 50%)` }} />
      <Svg>
        {endP < 1 && <g opacity={1 - endP}>{body}</g>}
        {endP > 0 && (
          <>
            <Txt text={c.song || "City Lights"} x={960} y={520} size={fit(c.song || "City Lights", 1400, 170, 900)} weight={900} color={ink} font={ff} p={endP} tracking={-0.05} />
            <Txt text={name} x={960} y={640} size={52} weight={600} color={ink} font={ff} p={c01((t - 8.9) / 0.5)} mode="fade" opacity={0.75} />
          </>
        )}
      </Svg>
      {/* beat dots */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 60, display: "flex", justifyContent: "center", gap: 14 }}>
        {[0, 1, 2, 3].map((k) => (
          <div key={k} style={{ width: 14, height: 14, borderRadius: 99, background: ink, opacity: Math.floor(t / 0.5) % 4 === k ? 0.9 : 0.2 }} />
        ))}
      </div>
      <Track src="tracks/lyric-video.wav" on={audio} />
    </AbsoluteFill>
  );
}
