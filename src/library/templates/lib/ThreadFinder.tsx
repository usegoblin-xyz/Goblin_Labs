import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, expInOut, expOut, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { keyword: string; threads: string; reply: string; tagline: string };

// Social listening: forum threads stream past, the tool lights up the ones
// that mention your keyword, one gets pulled out, a reply drafts itself
// and the upvotes climb.
export default function ThreadFinder({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const kw = c.keyword || "invoicing";
  const titles = [...list(c.threads || `Best tool for ${kw}?, What do you all use for ${kw}, Weekend project ideas, Hiring my first designer, Struggling with ${kw} for freelancers, Show your desk setup, Any advice on pricing?`), "Thread"].slice(0, 7);
  const scroll = Math.min(3.4, t) * 140;
  const pick = expInOut(seg(t, 3.6, 0.8));
  const reply = c.reply || `We built a tool for exactly this. Happy to share how we handle ${kw}.`;
  const typed = reply.slice(0, Math.floor(c01((t - 4.6) / 1.6) * reply.length));
  const votes = Math.round(lerp(3, 128, expOut(seg(t, 6.2, 1.2))));
  const outro = expInOut(seg(t, 7.8, 0.5));
  const endP = c01((t - 8.2) / 0.8);
  const hit = (s: string) => s.toLowerCase().includes(kw.toLowerCase());
  const chosen = titles.findIndex(hit);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* keyword pill */}
        <div style={{ position: "absolute", left: 120, top: 80, display: "flex", alignItems: "center", gap: 16, padding: "18px 30px", borderRadius: 40, background: pal.card2, fontFamily: MONO, fontSize: 32, color: pal.fg, opacity: expOut(seg(t, 0, 0.5)) }}>
          <span style={{ width: 16, height: 16, borderRadius: 8, background: pal.v, boxShadow: `0 0 0 ${6 + Math.sin(t * 6) * 4}px ${pal.v}44` }} />
          tracking “{kw}”
        </div>
        {/* thread list */}
        <div style={{ position: "absolute", left: 0, top: 190, width: 1000, height: 890, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: -190, width: 1000, height: 1080 }}>
        {titles.concat(titles).map((s, i) => {
          const y = 220 + i * 140 - scroll;
          const k = i % titles.length;
          const isHit = hit(s);
          const isChosen = k === chosen && i < titles.length;
          if (!isChosen && (y < -150 || y > 1200)) return null;
          const x = isChosen ? lerp(120, 120, pick) : 120;
          const yy = isChosen ? lerp(y, 260, pick) : y;
          const dim = pick > 0 && !isChosen ? 1 - pick * 0.8 : 1;
          return (
            <div key={i} style={{ position: "absolute", left: x, top: yy, width: 820, height: 116, borderRadius: 22, background: isHit && t > 1.0 ? pal.card2 : pal.card, boxShadow: isHit && t > 1.0 ? `inset 0 0 0 3px ${pal.v}` : undefined, display: "flex", alignItems: "center", gap: 22, padding: "0 26px", boxSizing: "border-box", opacity: dim, zIndex: isChosen ? 5 : 1 }}>
              <div style={{ width: 54, textAlign: "center", fontSize: 24, fontWeight: 800, color: pal.muted }}>
                ▲<div style={{ color: isChosen && t > 6.2 ? pal.v : pal.muted }}>{isChosen && t > 6.2 ? votes : 3 + Math.floor(hash(k, 1) * 40)}</div>
              </div>
              <div>
                <div style={{ fontSize: 20, color: pal.muted, fontFamily: MONO }}>r/{["smallbusiness", "freelance", "startups", "design", "solopreneur", "battlestations", "pricing"][k]}</div>
                <div style={{ fontSize: 31, fontWeight: 700, color: pal.fg, marginTop: 4, whiteSpace: "nowrap" }}>{s}</div>
              </div>
            </div>
          );
        })}
          </div>
        </div>
        {/* reply draft */}
        {t > 4.3 && (
          <div style={{ position: "absolute", left: 1020, top: 260, width: 780, borderRadius: 26, background: pal.card2, padding: 34, boxSizing: "border-box", transform: `translateX(${(1 - spring(t - 4.3, 16, 0.7)) * 300}px)`, opacity: c01((t - 4.3) * 3) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 22, background: pal.v }} />
              <div style={{ fontSize: 26, fontWeight: 700, color: pal.fg }}>Suggested reply</div>
              <div style={{ marginLeft: "auto", padding: "6px 14px", borderRadius: 99, background: pal.v, color: pal.onV, fontSize: 20, fontWeight: 700 }}>AI draft</div>
            </div>
            <div style={{ fontSize: 34, lineHeight: 1.35, color: pal.fg, minHeight: 180 }}>
              {typed}
              {t < 6.3 && <span style={{ color: pal.v }}>▍</span>}
            </div>
            <div style={{ marginTop: 20, display: "inline-block", padding: "14px 30px", borderRadius: 99, background: t > 6.1 ? pal.v : pal.fg, color: t > 6.1 ? pal.onV : pal.bg, fontSize: 26, fontWeight: 700 }}>{t > 6.1 ? "Posted ✓" : "Post reply"}</div>
          </div>
        )}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Be in every conversation that matters."} x={960} y={650} size={48} weight={500} color={pal.v} font={ff} p={c01((t - 8.6) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/thread-finder.wav" on={audio} />
    </AbsoluteFill>
  );
}
