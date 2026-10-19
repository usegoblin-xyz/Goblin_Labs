import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fit, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { link: string; transcript: string; tagline: string };

// Paste a video, get every word: a link drops into a field, the video card
// appears with a moving waveform, the audio peels off into words that stream
// out karaoke-style, then stack into a clean transcript page.
export default function TranscriptAd({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const link = c.link || "youtu.be/your-video";
  const words = (c.transcript || "so today I want to show you the one habit that changed how I work and it takes five minutes a day").split(/\s+/).slice(0, 26);
  const paste = c01((t - 0.4) / 0.3);
  const card = expOut(seg(t, 1.0, 0.6));
  const play = t > 1.6;
  const stream = c01((t - 2.2) / 3.4);
  const shown = Math.floor(stream * words.length);
  const page = expInOut(seg(t, 5.8, 0.8));
  const outro = expInOut(seg(t, 8.0, 0.5));
  const endP = c01((t - 8.4) / 0.8);

  // kinetic stream: the current word big in the middle, recent words trailing
  const cur = Math.min(words.length - 1, shown);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* field */}
        <div style={{ position: "absolute", left: 960, top: lerp(470, 120, card), transform: "translateX(-50%)", width: 1000, height: 100, borderRadius: 50, background: pal.card2, display: "flex", alignItems: "center", padding: "0 40px", boxSizing: "border-box", fontFamily: MONO, fontSize: 34, color: pal.fg, gap: 20, opacity: 1 - page }}>
          <span style={{ color: pal.muted }}>⌘V</span>
          <span style={{ opacity: paste, transform: `translateY(${(1 - paste) * 20}px)` }}>{link}</span>
          <span style={{ marginLeft: "auto", padding: "12px 24px", borderRadius: 30, background: pal.v, color: pal.onV, fontFamily: ff, fontWeight: 700, fontSize: 26 }}>Transcribe</span>
        </div>
        {/* video card */}
        {card > 0 && (
          <div style={{ position: "absolute", left: lerp(960, 420, page), top: lerp(560, 540, page), transform: `translate(-50%, -50%) scale(${lerp(card, 0.75, page)})`, width: 860, height: 484, borderRadius: 28, background: pal.card, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.4)" }}>
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${pal.card2}, ${pal.card})` }} />
            <div style={{ position: "absolute", left: "50%", top: "42%", transform: "translate(-50%, -50%)", width: 120, height: 120, borderRadius: 60, background: play ? "transparent" : pal.v, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {!play && <div style={{ width: 0, height: 0, borderLeft: `40px solid ${pal.onV}`, borderTop: "26px solid transparent", borderBottom: "26px solid transparent", marginLeft: 10 }} />}
            </div>
            <svg style={{ position: "absolute", left: 40, right: 40, bottom: 50, width: 780, height: 120 }} viewBox="0 0 780 120">
              {Array.from({ length: 60 }, (_, i) => {
                const h = play ? 10 + Math.abs(Math.sin(t * 9 + i * 0.7) * Math.cos(t * 3.1 + i * 0.3)) * 100 * (0.4 + hash(i, 1) * 0.6) : 8;
                return <rect key={i} x={i * 13} y={60 - h / 2} width={7} height={h} rx={3.5} fill={i / 60 < stream ? pal.v : pal.faint} />;
              })}
            </svg>
          </div>
        )}
        {/* streaming words */}
        {stream > 0 && page < 1 && (
          <Svg>
            <g opacity={1 - page}>
              {[-3, -2, -1, 0].map((o) => {
                const i = cur + o;
                if (i < 0) return null;
                const w = words[i];
                const sz = o === 0 ? 96 : 44;
                return <Txt key={i} text={w} x={960} y={o === 0 ? 1010 : 940 + (o + 1) * 46} size={sz} weight={o === 0 ? 800 : 600} color={o === 0 ? pal.v : pal.faint} font={ff} p={o === 0 ? c01((stream * words.length - shown) * 4) : 1} mode="rise" opacity={1 + o * 0.25} />;
              })}
            </g>
          </Svg>
        )}
        {/* transcript page */}
        {page > 0 && (
          <div style={{ position: "absolute", left: 900, top: 140, width: 900, height: 800, borderRadius: 30, background: pal.card, padding: 56, boxSizing: "border-box", transform: `translateX(${(1 - page) * 400}px)`, opacity: page, fontSize: 40, lineHeight: 1.45, color: pal.fg, letterSpacing: "-0.01em" }}>
            <div style={{ fontFamily: MONO, fontSize: 24, color: pal.muted, marginBottom: 24 }}>00:00 — transcript</div>
            {words.map((w, i) => (
              <span key={i} style={{ color: i < Math.floor(c01((t - 6.2) / 1.4) * words.length) ? pal.fg : pal.faint, background: i >= 7 && i <= 9 ? `linear-gradient(${pal.v}55, ${pal.v}55)` : undefined }}>
                {w}{" "}
              </span>
            ))}
          </div>
        )}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={c.tagline || "Every word. In seconds."} x={960} y={530} size={fit(c.tagline || "Every word. In seconds.", 1500, 130, 800, -0.04, ff)} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={nameOf(b)} x={960} y={650} size={50} weight={600} color={pal.v} font={ff} p={c01((t - 8.8) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/transcript-ad.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = [cubicInOut, spring];
