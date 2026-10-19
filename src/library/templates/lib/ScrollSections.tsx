import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, countStat, expInOut, fit, fontOf, kf, lerp, mix, nameOf, onColor, palette, seg, useT } from "../../motion";

type C = { headline: string; stat: string; tagline: string };

// One page, five scroll effects: a sticky hero whose headline scales as you
// scroll, a horizontal card gallery driven by vertical scroll, layered
// parallax hills, stats that count as they enter, and a mask that grows from
// a small window to the full frame. A scrollbar tracks the whole trip.
const SEC = 1080;

export default function ScrollSections({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const headline = c.headline || "Scroll is a stage";

  // scroll position in px over the page (5 sections, with holds)
  const y = kf(t, [[0.3, 0], [1.5, SEC * 0.9], [2.0, SEC], [3.4, SEC * 1.9], [4.0, SEC * 2.9], [4.6, SEC * 3.3], [5.2, SEC * 3.9], [6.0, SEC * 3.95], [6.8, SEC * 4.9], [8.0, SEC * 5.4]]);
  const total = SEC * 5.4;
  // section tops: the hero is sticky, section 2 pins while its cards travel,
  // 3 and 4 follow, and 5 pins while its mask grows
  const top2 = y < SEC ? SEC - y : y < SEC * 1.9 ? 0 : SEC * 1.9 - y;
  const top3 = top2 + SEC;
  const top4 = top3 + SEC;
  const top5 = Math.max(0, top4 + SEC);
  const endP = c01((t - 8.2) / 0.6);

  // section 1: sticky hero, headline scales up and fades as you leave
  const s1 = c01(y / SEC);
  // section 2: horizontal gallery, pinned while the cards travel
  const s2 = c01((y - SEC) / (SEC * 0.9));
  // section 3: parallax
  const s3 = (y - SEC * 2.9) / SEC;
  // section 4: stats
  const s4 = c01((y - SEC * 3.4) / (SEC * 0.7));
  // section 5: growing mask
  const s5 = c01((y - SEC * 4.9) / (SEC * 0.5));

  const cards = ["Strategy", "Identity", "Product", "Motion", "Launch"];

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      {/* 1. sticky hero */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: SEC, background: pal.bg, opacity: y < SEC * 1.01 ? 1 : 0 }}>
        <Svg>
          <g transform={`translate(960 540) scale(${1 + s1 * 1.6}) translate(-960 -540)`} opacity={1 - s1 * 1.1}>
            <Txt text={headline} x={960} y={580} size={fit(headline, 1500, 190, 900)} weight={900} color={pal.fg} font={ff} p={c01((t - 0.05) / 0.5)} tracking={-0.05} />
          </g>
          <text x={960} y={980} textAnchor="middle" fontFamily={ff} fontSize={26} fill={pal.muted} opacity={1 - s1 * 3}>
            scroll ↓
          </text>
        </Svg>
      </div>
      {/* 2. horizontal gallery */}
      <div style={{ position: "absolute", left: 0, top: top2, width: 1920, height: SEC, background: pal.card, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 120, top: 120, fontSize: 40, fontWeight: 800, color: pal.fg }}>What we do</div>
        {cards.map((cd, i) => (
          <div key={cd} style={{ position: "absolute", top: 240, left: 120 + i * 620 - s2 * 2200, width: 560, height: 680, borderRadius: 28, background: i % 2 ? pal.p : pal.card2, color: i % 2 ? onColor(pal.p) : pal.fg, padding: 36, boxSizing: "border-box", fontSize: 56, fontWeight: 900, letterSpacing: "-0.03em" }}>
            <div style={{ fontSize: 22, opacity: 0.6 }}>0{i + 1}</div>
            {cd}
          </div>
        ))}
        <div style={{ position: "absolute", left: 120, right: 120, bottom: 70, height: 6, borderRadius: 3, background: pal.line }}>
          <div style={{ width: `${s2 * 100}%`, height: "100%", borderRadius: 3, background: pal.p }} />
        </div>
      </div>
      {/* 3. parallax */}
      <div style={{ position: "absolute", left: 0, top: top3, width: 1920, height: SEC, overflow: "hidden", background: mix(pal.p, "#bfe3ff", 0.6) }}>
        <Svg>
          <circle cx={1400} cy={300 + s3 * 200} r={110} fill="#fff6c8" />
          {[0, 1, 2, 3].map((k) => {
            const sp = [0.2, 0.45, 0.7, 1.0][k];
            const base = 600 + k * 110 - s3 * 260 * sp;
            const col = mix(pal.p, "#0b2a14", k * 0.25);
            const pts = Array.from({ length: 21 }, (_, i) => `${i * 100},${base - 90 * Math.sin(i * 0.7 + k * 1.7) - 40 * Math.sin(i * 1.9)}`);
            return <path key={k} d={`M0,1080 L${pts.join(" L")} L1920,1080 Z`} fill={col} />;
          })}
          <Txt text="Depth, by scrolling" x={960} y={260 - s3 * 120} size={96} weight={900} color="#ffffff" font={ff} p={1} tracking={-0.04} opacity={0.95} />
        </Svg>
      </div>
      {/* 4. stats */}
      <div style={{ position: "absolute", left: 0, top: top4, width: 1920, height: SEC, background: pal.bg }}>
        <Svg>
          {[c.stat || "2.4M", "98%", "140+"].map((v, i) => (
            <g key={i} opacity={c01(s4 * 2 - i * 0.2)}>
              <text x={420 + i * 540} y={560} textAnchor="middle" fontFamily={ff} fontSize={170} fontWeight={900} fill={i === 0 ? pal.p : pal.fg} letterSpacing="-0.04em">
                {countStat(v, c01(s4 * 1.4 - i * 0.15))}
              </text>
              <text x={420 + i * 540} y={640} textAnchor="middle" fontFamily={ff} fontSize={34} fill={pal.muted}>
                {["visitors", "satisfaction", "launches"][i]}
              </text>
            </g>
          ))}
        </Svg>
      </div>
      {/* 5. growing mask */}
      <div style={{ position: "absolute", left: 0, top: top5, width: 1920, height: SEC, background: pal.bg }}>
        <div
          style={{
            position: "absolute",
            left: lerp(760, 0, expInOut(s5)),
            top: lerp(340, 0, expInOut(s5)),
            width: lerp(400, 1920, expInOut(s5)),
            height: lerp(400, 1080, expInOut(s5)),
            borderRadius: lerp(200, 0, expInOut(s5)),
            background: `linear-gradient(135deg, ${pal.p}, ${pal.a})`,
          }}
        />
        <Svg>
          {endP > 0 && (
            <>
              <Txt text={name} x={960} y={540} size={fit(name, 1300, 220, 900)} weight={900} color={onColor(pal.p)} font={ff} p={endP} tracking={-0.05} />
              <Txt text={c.tagline || "Five ways to tell a story with scroll"} x={960} y={650} size={44} weight={600} color={onColor(pal.p)} font={ff} p={c01((t - 8.6) / 0.5)} mode="fade" opacity={0.85} />
            </>
          )}
        </Svg>
      </div>
      {/* scrollbar */}
      <div style={{ position: "absolute", right: 14, top: 20, bottom: 20, width: 8, borderRadius: 4, background: pal.line }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: `${(y / total) * 80}%`, height: "20%", borderRadius: 4, background: pal.muted }} />
      </div>
      <Track src="tracks/scroll-sections.wav" on={audio} />
    </AbsoluteFill>
  );
}

