import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, countStat, cubicInOut, expInOut, fontOf, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { issue: string; stories: string; subs: string; openRate: string };

// A newsletter showreel: an envelope drops, its flap opens and the issue
// slides out and unfolds into a tall page; three story blocks scroll past
// with headlines; the page folds into a paper plane that flies off, and
// subscriber and open-rate counters climb.
export default function NewsletterIssue({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const issue = c.issue || "Issue #128";
  const stories = [...list(c.stories || "The quiet rise of small software, Five tools we actually use, What we got wrong this year"), "Story", "Story", "Story"].slice(0, 3);
  const drop = spring(t - 0.1, 13, 0.6);
  const flap = cubicInOut(c01((t - 0.9) / 0.4));
  const slide = expInOut(seg(t, 1.3, 0.7));
  const scroll = cubicInOut(c01((t - 2.4) / 2.6)) * 900;
  const plane = expInOut(seg(t, 5.4, 1.0));
  const stats = c01((t - 6.2) / 1.2);
  const outro = expInOut(seg(t, 8.6, 0.5));
  const endP = c01((t - 9.0) / 0.8);
  const paper = "#fffdf8";

  return (
    <AbsoluteFill style={{ background: pal.dark ? "#101014" : "#efe9df", overflow: "hidden", fontFamily: ff, perspective: 1600 }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* envelope */}
        {slide < 1 && (
          <div style={{ position: "absolute", left: 960 - 330, top: 380 + (1 - drop) * -900, width: 660, height: 420, transform: `translateY(${slide * 800}px)`, opacity: 1 - slide }}>
            <div style={{ position: "absolute", inset: 0, background: pal.v, borderRadius: 14 }} />
            <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, borderLeft: "330px solid transparent", borderRight: "330px solid transparent", borderTop: `240px solid ${pal.a}`, transformOrigin: "50% 0", transform: `rotateX(${flap * 170}deg)` }} />
            <div style={{ position: "absolute", left: 40, bottom: 30, fontSize: 30, fontWeight: 800, color: pal.onV }}>{issue}</div>
          </div>
        )}
        {/* page */}
        {slide > 0 && plane < 1 && (
          <div style={{ position: "absolute", left: 960 - 380, top: 80 + (1 - slide) * 400, width: 760, height: 920, background: paper, borderRadius: 10, boxShadow: "0 30px 60px rgba(0,0,0,0.25)", overflow: "hidden", transform: `translate(${plane * 1400}px, ${-plane * 600}px) rotate(${plane * -30}deg) scale(${1 - plane * 0.7}, ${1 - plane * 0.9})`, opacity: 1 - c01((plane - 0.7) * 3) }}>
            <div style={{ transform: `translateY(${-scroll}px)`, padding: 50 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#888" }}>{issue}</div>
              <div style={{ fontSize: 76, fontWeight: 900, color: "#111", letterSpacing: "-0.03em", lineHeight: 1 }}>{nameOf(b)} Weekly</div>
              <div style={{ height: 4, background: "#111", margin: "30px 0" }} />
              {stories.map((s, i) => (
                <div key={i} style={{ marginBottom: 50 }}>
                  <div style={{ height: 260, borderRadius: 14, background: [pal.v, pal.a, "#38a3ff"][i], marginBottom: 22 }} />
                  <div style={{ fontSize: 46, fontWeight: 800, color: "#111", lineHeight: 1.1 }}>{s}</div>
                  {Array.from({ length: 3 }, (_, j) => (
                    <div key={j} style={{ height: 12, borderRadius: 6, background: "#ddd", marginTop: 16, width: `${90 - j * 15}%` }} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* paper plane */}
        {plane > 0.6 && (
          <Svg>
            <g transform={`translate(${960 + plane * 900} ${540 - plane * 500}) rotate(-20)`} opacity={1 - c01((plane - 0.95) * 20)}>
              <path d="M-60,0 L60,-20 L-20,30 Z" fill={paper} stroke="#999" strokeWidth={2} />
              <path d="M-20,30 L0,0 L60,-20" fill="none" stroke="#999" strokeWidth={2} />
            </g>
          </Svg>
        )}
        {/* stats */}
        {stats > 0 && (
          <div style={{ position: "absolute", left: 0, right: 0, top: 360, display: "flex", justifyContent: "center", gap: 120 }}>
            {[
              [countStat(c.subs || "48,200", stats), "subscribers"],
              [countStat(c.openRate || "61%", stats), "open rate"],
            ].map(([v, l], i) => (
              <div key={i} style={{ textAlign: "center", transform: `translateY(${(1 - spring(t - 6.2 - i * 0.2, 14, 0.6)) * 200}px)` }}>
                <div style={{ fontSize: 150, fontWeight: 900, color: pal.fg, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums" }}>{v}</div>
                <div style={{ fontSize: 40, color: pal.muted }}>{l}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={`${nameOf(b)} Weekly`} x={960} y={520} size={130} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text="Every Friday. Free." x={960} y={630} size={48} weight={600} color={pal.v} font={ff} p={c01((t - 9.4) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/newsletter-issue.wav" on={audio} />
    </AbsoluteFill>
  );
}
