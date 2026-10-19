import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Phone, SERIF, Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { word: string; meaning: string; tagline: string };

// A reading app explained in three steps beside a phone: tap a hard word and
// its meaning slides up, ask about a passage and a plain-English summary
// writes itself, then the word flies into a review deck and the reading
// streak ring fills.
const PAGE = "The garden was a palimpsest of every summer before it: paths worn and rewritten, roses grafted onto older roots, a sundial that no longer agreed with the sun.";

export default function ReadingApp({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const word = c.word || "palimpsest";
  const meaning = c.meaning || "Something reused or altered but still showing traces of its earlier form.";

  const phoneIn = spring(t - 0.05, 13, 0.82);
  const step = t < 3.2 ? 0 : t < 6.0 ? 1 : 2;
  const tap = t > 1.0 && t < 1.25;
  const hl = expOut(seg(t, 1.1, 0.3));
  const sheet = expInOut(seg(t, 1.4, 0.5)) * (1 - expInOut(seg(t, 3.1, 0.4)));
  const select = c01((t - 3.5) / 0.6);
  const ask = spring(t - 4.2, 16, 0.75) * (1 - expInOut(seg(t, 5.9, 0.4)));
  const summary = c01((t - 4.6) / 1.1);
  const fly = expInOut(seg(t, 6.2, 0.7));
  const streak = expOut(seg(t, 7.0, 1.0));
  const endP = c01((t - 8.4) / 0.6);

  const steps = ["Tap any word", "Ask about any passage", "Keep what you learn"];
  const PX = 1300;
  const PH = 900;
  const SW = PH * 0.49 - PH * 0.036;
  const words = PAGE.replace("palimpsest", word).split(" ");
  const target = words.findIndex((w) => w.toLowerCase().startsWith(word.toLowerCase()));
  const summaryText = "Plain English: the garden shows layers of many past summers, some of them changed or out of date.";

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      {/* steps */}
      <div style={{ position: "absolute", left: 140, top: 300, width: 720, opacity: 1 - endP }}>
        {steps.map((s, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 48, opacity: c01((t - 0.3 - i * 0.15) / 0.4) * (active ? 1 : 0.4), transform: `translateX(${active ? 0 : -10}px)` }}>
              <div style={{ width: 76, height: 76, borderRadius: 99, background: active || done ? pal.p : pal.card2, color: active || done ? pal.onP : pal.fg, fontSize: 36, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{done ? "✓" : i + 1}</div>
              <div style={{ fontSize: 58, fontWeight: 800, color: pal.fg, letterSpacing: "-0.03em" }}>{s}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - phoneIn) * 900}px)`, opacity: 1 - endP }}>
        <Phone x={PX} y={540} h={PH} pal={pal} screen="#fbf8f1">
          <div style={{ position: "absolute", left: 28, right: 28, top: 70, fontFamily: SERIF, fontSize: 30, lineHeight: 1.5, color: "#2a2620" }}>
            <div style={{ fontFamily: ff, fontSize: 16, letterSpacing: "0.12em", color: "#9a8f7c", marginBottom: 14 }}>CHAPTER 3 · 42%</div>
            {words.map((w, i) => {
              const isT = i === target;
              const inSel = step >= 1 && i <= Math.floor(select * words.length) && t < 6.0;
              return (
                <span key={i} style={{ background: isT && hl > 0 ? `rgba(255, 214, 90, ${0.7 * hl})` : inSel ? `${pal.p}33` : "transparent", borderRadius: 4, padding: "0 2px" }}>
                  {w}{" "}
                </span>
              );
            })}
          </div>
          {tap && <div style={{ position: "absolute", left: 180, top: 180, width: 70, height: 70, borderRadius: 99, background: "rgba(0,0,0,0.15)", transform: `scale(${1 + (t - 1.0) * 3})` }} />}
          {/* definition sheet */}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 330, borderRadius: "28px 28px 0 0", background: "#ffffff", boxShadow: "0 -10px 30px rgba(0,0,0,0.15)", padding: 28, boxSizing: "border-box", transform: `translateY(${(1 - sheet) * 360}px)` }}>
            <div style={{ fontFamily: SERIF, fontSize: 42, color: "#111", fontStyle: "italic" }}>{word}</div>
            <div style={{ fontSize: 16, color: "#999", margin: "4px 0 12px" }}>noun</div>
            <div style={{ fontSize: 22, lineHeight: 1.4, color: "#333" }}>{meaning}</div>
            <div style={{ marginTop: 16, display: "inline-block", padding: "10px 18px", borderRadius: 99, background: pal.p, color: pal.onP, fontSize: 18, fontWeight: 800 }}>+ Save word</div>
          </div>
          {/* ask card */}
          <div style={{ position: "absolute", left: 18, right: 18, top: 430, borderRadius: 22, background: "#ffffff", boxShadow: "0 12px 30px rgba(0,0,0,0.18)", padding: 22, transform: `scale(${ask})`, transformOrigin: "50% 0" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: pal.p, letterSpacing: "0.1em" }}>✦ EXPLAIN</div>
            <div style={{ fontSize: 21, lineHeight: 1.45, color: "#222", marginTop: 8 }}>{summaryText.slice(0, Math.floor(summary * summaryText.length))}</div>
          </div>
          {/* streak */}
          {streak > 0 && (
            <Svg w={SW} h={PH} style={{ opacity: c01(streak * 3) }}>
              <rect x={20} y={420} width={SW - 40} height={300} rx={26} fill="#ffffff" />
              <circle cx={SW / 2} cy={540} r={70} fill="none" stroke="#eee" strokeWidth={18} />
              <circle cx={SW / 2} cy={540} r={70} fill="none" stroke={pal.p} strokeWidth={18} strokeLinecap="round" pathLength={1} strokeDasharray={`${streak} 2`} transform={`rotate(-90 ${SW / 2} 540)`} />
              <text x={SW / 2} y={554} textAnchor="middle" fontFamily={ff} fontSize={44} fontWeight={900} fill="#111">
                {Math.round(lerp(11, 12, c01(streak * 1.2)))}
              </text>
              <text x={SW / 2} y={680} textAnchor="middle" fontFamily={ff} fontSize={22} fill="#666">
                day reading streak
              </text>
            </Svg>
          )}
        </Phone>
      </div>
      {/* word flying to the deck */}
      {fly > 0 && fly < 1 && (
        <div style={{ position: "absolute", left: lerp(PX - 150, 520, fly), top: lerp(700, 860, fly) - Math.sin(fly * Math.PI) * 200, padding: "16px 26px", borderRadius: 14, background: pal.card2, border: `2px solid ${pal.p}`, fontFamily: SERIF, fontSize: 34, color: pal.fg, transform: `rotate(${fly * -8}deg)` }}>{word}</div>
      )}
      {t > 6.2 && endP < 1 && (
        <div style={{ position: "absolute", left: 440, top: 820, width: 300, height: 140, opacity: c01((t - 6.2) / 0.3) }}>
          {[2, 1, 0].map((k) => (
            <div key={k} style={{ position: "absolute", left: k * 10, top: -k * 10, width: 280, height: 120, borderRadius: 16, background: k === 0 && fly >= 1 ? pal.p : pal.card, border: `1.5px solid ${pal.line}`, color: k === 0 && fly >= 1 ? pal.onP : pal.muted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700 }}>{k === 0 ? (fly >= 1 ? word : "Review deck") : ""}</div>
          ))}
        </div>
      )}
      <Svg>
        {endP > 0 && (
          <>
            <Txt text={name} x={960} y={520} size={fit(name, 1300, 190, 900)} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.05} />
            <Txt text={c.tagline || "Read anything. Understand everything."} x={960} y={630} size={46} weight={500} color={pal.muted} font={ff} p={c01((t - 8.8) / 0.5)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/reading-app.wav" on={audio} />
    </AbsoluteFill>
  );
}
