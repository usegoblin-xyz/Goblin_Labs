import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Phone, Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, hash, kf, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { posts: string; friends: string; tagline: string };

// A social app reel in vertical: a feed scrolls with flicks, a double-tap
// bursts hearts, a story ring opens full-screen, a DM thread pops replies,
// and the app icon lands with the tagline.
export default function SocialFeed({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const W = 1080;
  const H = 1920;
  const posts = [...list(c.posts || "Sunday market finds, First climb of the year, New studio day, Late-night ramen"), "Post", "Post", "Post", "Post"].slice(0, 4);
  const friends = [...list(c.friends || "maya, leo, sam, ana, kai"), "friend", "friend", "friend", "friend", "friend"].slice(0, 5);
  const cols = [pal.v, pal.a, "#38a3ff", "#f28ab2", "#f2b64a"];
  const scroll = kf(t, [[1.0, 0], [1.5, 700], [2.2, 700], [2.6, 1400]], cubicInOut);
  const tap = 2.0;
  const story = expInOut(seg(t, 3.4, 0.5)) * (1 - expInOut(seg(t, 5.0, 0.4)));
  const dm = c01((t - 5.4) / 0.3);
  const msgs = [
    ["them", "omg where is this?? 😍"],
    ["me", "the market on 5th!"],
    ["them", "going this weekend"],
  ];
  const outro = expInOut(seg(t, 8.3, 0.5));
  const endP = c01((t - 8.6) / 0.8);
  const ph = 1500;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Phone x={W / 2} y={H / 2 + 60 + (1 - spring(t - 0.1, 12, 0.7)) * 1500} h={ph} pal={pal} screen={pal.bg}>
          <div style={{ position: "absolute", inset: 0, fontFamily: ff }}>
            {/* stories row */}
            <div style={{ position: "absolute", left: 0, right: 0, top: 80, height: 150, display: "flex", gap: 22, padding: "0 26px" }}>
              {friends.map((f, i) => (
                <div key={i} style={{ textAlign: "center", transform: `scale(${spring(t - 0.6 - i * 0.07, 16, 0.55)})` }}>
                  <div style={{ width: 100, height: 100, borderRadius: 50, padding: 5, background: `conic-gradient(${pal.v}, ${pal.a}, ${pal.v})` }}>
                    <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: cols[i], border: `5px solid ${pal.bg}`, boxSizing: "border-box" }} />
                  </div>
                  <div style={{ fontSize: 20, color: pal.muted, marginTop: 6 }}>{f}</div>
                </div>
              ))}
            </div>
            {/* feed */}
            <div style={{ position: "absolute", left: 0, right: 0, top: 260, bottom: 0, overflow: "hidden" }}>
              <div style={{ transform: `translateY(${-scroll}px)` }}>
                {posts.map((p, i) => (
                  <div key={i} style={{ marginBottom: 30 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 26px 14px" }}>
                      <div style={{ width: 50, height: 50, borderRadius: 25, background: cols[(i + 1) % 5] }} />
                      <div style={{ fontSize: 24, fontWeight: 700, color: pal.fg }}>{friends[i % 5]}</div>
                    </div>
                    <div style={{ position: "relative", height: 620, background: `linear-gradient(${120 + i * 40}deg, ${cols[i]}, ${cols[(i + 2) % 5]})`, overflow: "hidden" }}>
                      {Array.from({ length: 5 }, (_, j) => (
                        <div key={j} style={{ position: "absolute", left: hash(i, j) * 600, top: hash(j, i) * 500, width: 120 + hash(i, j, 2) * 200, height: 120 + hash(i, j, 2) * 200, borderRadius: "50%", background: "rgba(255,255,255,0.25)" }} />
                      ))}
                      {i === 1 && t > tap && t < tap + 1.0 && (
                        <div style={{ position: "absolute", left: "50%", top: "50%", fontSize: 220, transform: `translate(-50%,-50%) scale(${spring(t - tap, 16, 0.45) * (1 - c01((t - tap - 0.7) / 0.3))})`, color: "#fff" }}>♥</div>
                      )}
                    </div>
                    <div style={{ padding: "16px 26px", fontSize: 26, color: pal.fg }}>
                      <span style={{ color: i === 1 && t > tap ? "#ff3b5c" : pal.fg, fontSize: 34, marginRight: 14 }}>{i === 1 && t > tap ? "♥" : "♡"}</span>
                      <b>{p}</b>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* story overlay */}
            {story > 0.01 && (
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(170deg, ${cols[2]}, ${cols[3]})`, clipPath: `circle(${story * 150}% at 15% 8%)` }}>
                <div style={{ position: "absolute", left: 20, right: 20, top: 60, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.4)" }}>
                  <div style={{ width: `${c01((t - 3.5) / 1.5) * 100}%`, height: "100%", background: "#fff", borderRadius: 3 }} />
                </div>
                <div style={{ position: "absolute", left: 0, right: 0, top: "40%", textAlign: "center", fontSize: 80, fontWeight: 900, color: "#fff" }}>golden hour ☀</div>
              </div>
            )}
            {/* DM sheet */}
            {dm > 0 && (
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 900, borderRadius: "40px 40px 0 0", background: pal.card, transform: `translateY(${(1 - spring(t - 5.4, 14, 0.7)) * 900}px)`, padding: 30, boxSizing: "border-box" }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: pal.fg, marginBottom: 30 }}>{friends[0]}</div>
                {msgs.map(([who, m], i) => {
                  const at = 5.8 + i * 0.7;
                  if (t < at) return null;
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: who === "me" ? "flex-end" : "flex-start", marginBottom: 18 }}>
                      <div style={{ padding: "18px 26px", borderRadius: 30, background: who === "me" ? pal.v : pal.card2, color: who === "me" ? pal.onV : pal.fg, fontSize: 30, transform: `scale(${spring(t - at, 18, 0.55)})`, transformOrigin: who === "me" ? "100% 100%" : "0 100%" }}>
                        {m}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Phone>
      </div>
      {endP > 0 && (
        <Svg w={W} h={H}>
          <rect x={W / 2 - 130} y={680 + (1 - spring(t - 8.6, 14, 0.55)) * 300} width={260} height={260} rx={64} fill={pal.v} />
          <text x={W / 2} y={850 + (1 - spring(t - 8.6, 14, 0.55)) * 300} textAnchor="middle" fontFamily={ff} fontSize={150} fontWeight={900} fill={pal.onV}>
            {nameOf(b)[0]}
          </text>
          <Txt text={nameOf(b)} x={W / 2} y={1080} size={110} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Share the good stuff."} x={W / 2} y={1170} size={50} weight={600} color={pal.v} font={ff} p={c01((t - 9.0) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/social-feed.wav" on={audio} />
    </AbsoluteFill>
  );
}

