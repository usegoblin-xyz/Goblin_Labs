import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Cursor, Track, c01, cubicInOut, expOut, fontOf, kf, lerp, palette, seg, spring, useT } from "../../motion";

type C = { target: string; note1: string; note2: string; note3: string; reply: string };

// A ball that runs the whole UI: it springs out of a toggle, drags a slider,
// lands on a notification, types a reply on a keyboard and travels home, in
// one world with one camera. The last frame matches the first, so it loops.

const TOG = { x: 0, y: 0 };
const SL = { x0: 420, x1: 1420, y: 0 };
const CARD_X = 920;
const CARD_Y = [380, 560, 740];
const PILL = { x: 1190, y: 740 };
const FIELD = { x: 920, y: 905, w: 760, h: 84 };
const KB = { x: 920, y: 1200 };
const KEY = 84;
const GAP = 12;
const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const BR = 34; // ball radius

function keyPos(ch: string) {
  if (ch === " ") return { x: KB.x - 40, y: KB.y + 3 * (KEY + GAP) - 150 + 10 };
  for (let r = 0; r < 3; r++) {
    const i = ROWS[r].indexOf(ch);
    if (i >= 0) {
      const rw = ROWS[r].length * (KEY + GAP) - GAP;
      return { x: KB.x - rw / 2 + i * (KEY + GAP) + KEY / 2 - (r === 2 ? 60 : 0), y: KB.y - 150 + r * (KEY + GAP) + KEY / 2 };
    }
  }
  return keyPos("m");
}
const RETURN = (() => {
  const rw = ROWS[2].length * (KEY + GAP) - GAP;
  return { x: KB.x + rw / 2 - 60 + GAP + 90, y: KB.y - 150 + 2 * (KEY + GAP) + KEY / 2 };
})();

type P2 = { x: number; y: number };
// Parabolic hop from a to b between t0 and t1 with the apex `h` above the higher end.
function hop(t: number, t0: number, t1: number, a: P2, b: P2, h: number): P2 {
  const p = c01((t - t0) / (t1 - t0));
  const top = Math.min(a.y, b.y) - h;
  // y(p) = (1-p)^2 a + 2p(1-p) c + p^2 b, with c chosen so the apex reaches `top`
  const c = 2 * top - (a.y + b.y) / 2;
  return { x: lerp(a.x, b.x, p), y: (1 - p) * (1 - p) * a.y + 2 * p * (1 - p) * c + p * p * b.y };
}

export default function BallUILoop({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const target = Number(String(c.target).replace(/[^0-9.]/g, "")) || 100;
  const reply = (c.reply || "retry").toLowerCase().slice(0, 9);
  const notes = [c.note1 || "Slider · Reached 100", c.note2 || "Gravity · Something is falling", c.note3 || "Messages · What now?"].map((n) => {
    const [h, ...rest] = n.split("·");
    return { h: h.trim(), m: rest.join("·").trim() };
  });

  // key schedule
  const kStart = 4.9;
  const kStep = Math.min(0.32, 1.6 / Math.max(1, reply.length));
  const kTimes = reply.split("").map((_, i) => kStart + i * kStep);
  const retT = kStart + reply.length * kStep + 0.12;

  // ---- ball route ----
  const knobOn = { x: TOG.x + 62, y: TOG.y };
  const slideStart = { x: SL.x0, y: SL.y - BR + 4 };
  const slideEnd = { x: SL.x1, y: SL.y - BR + 4 };
  const pillTop = { x: PILL.x, y: PILL.y - 28 - BR };
  const fieldSpot = { x: FIELD.x + FIELD.w / 2 - 60, y: FIELD.y - FIELD.h / 2 - BR };
  let ball: P2;
  let sq = 0; // squash amount
  const landings = [1.3, 3.9, ...kTimes, retT, 9.4];
  for (const L of landings) sq = Math.max(sq, Math.exp(-((t - L) * (t - L)) / 0.0016) * (t >= L - 0.02 ? 1 : 0));
  const slideP = cubicInOut(seg(t, 1.35, 1.25));
  if (t < 0.5) ball = knobOn;
  else if (t < 1.3) ball = hop(t, 0.5, 1.3, knobOn, slideStart, 260);
  else if (t < 2.6) ball = { x: lerp(SL.x0, SL.x1, slideP), y: slideStart.y };
  else if (t < 3.9) ball = hop(t, 2.6, 3.9, slideEnd, pillTop, 180);
  else if (t < 4.5) ball = { x: lerp(pillTop.x, fieldSpot.x, cubicInOut(seg(t, 4.0, 0.4))), y: lerp(pillTop.y, fieldSpot.y, cubicInOut(seg(t, 4.0, 0.4))) };
  else if (t < kStart) ball = hop(t, 4.5, kStart, fieldSpot, { ...keyPos(reply[0] ?? "r"), y: keyPos(reply[0] ?? "r").y - BR - 10 }, 120);
  else if (t < retT) {
    const i = Math.min(reply.length - 1, Math.floor((t - kStart) / kStep));
    const a = keyPos(reply[i]);
    const nxt = i + 1 < reply.length ? keyPos(reply[i + 1]) : RETURN;
    const t1 = i + 1 < reply.length ? kTimes[i + 1] : retT;
    ball = hop(t, kTimes[i], t1, { x: a.x, y: a.y - BR - 10 }, { x: nxt.x, y: nxt.y - BR - 10 }, 110);
  } else if (t < 7.4) ball = { x: RETURN.x, y: RETURN.y - BR - 10 };
  else if (t < 9.4) ball = hop(t, 7.4, 9.4, { x: RETURN.x, y: RETURN.y - BR - 10 }, knobOn, 700);
  else ball = knobOn;

  const value = Math.round(target * (t < 1.3 ? 0 : t < 2.6 ? slideP : t < 7.4 ? 1 : 1 - seg(t, 7.4, 1.2)));
  const switchOn = t < 0.45 || t >= 9.4;
  const sw = switchOn ? (t >= 9.4 ? spring(t - 9.4, 24, 0.7) : 1) : 1 - spring(t - 0.45, 24, 0.8);

  // ---- camera (center + log zoom), first frame = last frame ----
  const lz = (z: number) => Math.log(z);
  const followX = lerp(700, 1000, slideP);
  const cx = kf(t, [[0, 0], [0.5, 0], [1.3, 640], [2.6, followX], [3.9, CARD_X], [4.6, CARD_X], [7.4, CARD_X], [8.5, 720], [9.0, 720], [9.9, 0], [10, 0]], cubicInOut);
  const cy = kf(t, [[0, 0], [0.5, 0], [1.3, 0], [2.6, 0], [3.9, 600], [4.6, 1010], [7.4, 1010], [8.5, 620], [9.0, 620], [9.9, 0], [10, 0]], cubicInOut);
  const z = Math.exp(kf(t, [[0, lz(1.7)], [0.5, lz(1.7)], [1.3, lz(1.08)], [2.6, lz(1.0)], [3.9, lz(0.98)], [4.6, lz(0.86)], [7.4, lz(0.86)], [8.5, lz(0.44)], [9.0, lz(0.44)], [9.9, lz(1.7)], [10, lz(1.7)]], cubicInOut));

  const cards = CARD_Y.map((y, i) => {
    const at = 2.8 + i * 0.3;
    const e = spring(t - at, 20, 0.72);
    const back = 1 - c01(seg(t, 9.0, 0.5));
    return { y: y + (1 - e) * 120, o: c01(e * 1.5) * back };
  });
  const expand = cubicInOut(seg(t, 4.0, 0.45));
  const kbIn = spring(t - 4.2, 18, 0.8) * (1 - seg(t, 9.0, 0.5));
  const typed = reply.slice(0, kTimes.filter((k) => t >= k).length);
  const sent = cubicInOut(seg(t, retT + 0.15, 0.45));
  const fieldVis = t >= 4.0 && t < 9.4;
  const pressed = (ch: string | "ret") => {
    const times = ch === "ret" ? [retT] : kTimes.filter((_, i) => reply[i] === ch);
    return Math.max(0, ...times.map((k) => (t >= k && t < k + 0.16 ? 1 - (t - k) / 0.16 : 0)));
  };

  const cursorVis = t < 1.0 ? 1 - seg(t, 0.75, 0.25) : seg(t, 9.4, 0.3);
  const cur = t < 1.0 ? { x: lerp(-330, knobOn.x + 6, cubicInOut(seg(t, 0, 0.42))) + seg(t, 0.55, 0.4) * -60, y: lerp(260, knobOn.y + 8, cubicInOut(seg(t, 0, 0.42))) + seg(t, 0.55, 0.4) * 80 } : { x: lerp(-440, -330, cubicInOut(seg(t, 9.4, 0.6))), y: lerp(380, 260, cubicInOut(seg(t, 9.4, 0.6))) };
  const press = t > 0.38 && t < 0.52 ? 1 : 0;

  const card = pal.card2;
  const ball2 = pal.dark ? "#ffffff" : pal.fg;
  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", left: 960, top: 540, transformOrigin: "0 0", transform: `scale(${z}) translate(${-cx}px, ${-cy}px)` }}>
        <div style={{ position: "absolute", left: -2400, top: -2000, width: 6000, height: 5200, backgroundImage: `radial-gradient(${pal.line} 2.2px, transparent 2.6px)`, backgroundSize: "44px 44px" }} />
        {/* toggle */}
        <div style={{ position: "absolute", left: TOG.x - 130, top: TOG.y - 70, width: 260, height: 140, borderRadius: 70, background: sw > 0.5 ? pal.p : card, transition: "none", boxShadow: `inset 0 0 0 2px ${pal.line}` }} />
        {/* slider */}
        <div style={{ position: "absolute", left: SL.x0 - 20, top: SL.y - 11, width: SL.x1 - SL.x0 + 40, height: 22, borderRadius: 11, background: card }} />
        <div style={{ position: "absolute", left: SL.x0 - 20, top: SL.y - 11, width: Math.max(0, (t < 2.6 ? ball.x : t < 7.4 ? SL.x1 : lerp(SL.x1, SL.x0, seg(t, 7.4, 1.2))) - SL.x0 + (t >= 1.3 && t < 8.6 ? 20 : 0)), height: 22, borderRadius: 11, background: pal.p }} />
        {t >= 1.2 && t < 8.6 && (() => {
          const kx = t < 2.6 ? ball.x : t < 7.4 ? SL.x1 : lerp(SL.x1, SL.x0, seg(t, 7.4, 1.2));
          const e = expOut(seg(t, 1.2, 0.3)) * (1 - seg(t, 8.3, 0.3));
          return (
            <div style={{ position: "absolute", left: kx - 70, top: SL.y - 150, width: 140, height: 70, borderRadius: 18, background: pal.fg, color: pal.bg, fontSize: 38, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", opacity: e, transform: `translateY(${(1 - e) * 20}px)` }}>
              {value}
            </div>
          );
        })()}
        {/* notifications */}
        {cards.map((k, i) => (
          <div key={i} style={{ position: "absolute", left: CARD_X - 380, top: k.y - 70, width: 760, height: 140, borderRadius: 26, background: card, opacity: k.o, display: "flex", alignItems: "center", gap: 24, padding: "0 30px", boxSizing: "border-box" }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: i === 2 ? pal.p : pal.line }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: pal.fg }}>{notes[i].h}</div>
              <div style={{ fontSize: 26, color: pal.muted, marginTop: 4 }}>{notes[i].m}</div>
            </div>
          </div>
        ))}
        {/* reply pill → field → sent bubble */}
        {t >= 3.0 && t < 9.4 && (() => {
          const w = lerp(150, FIELD.w, expand) * lerp(1, 0.42, sent);
          const h = lerp(56, FIELD.h, expand);
          const x = lerp(lerp(PILL.x, FIELD.x, expand), FIELD.x + FIELD.w / 2 - (FIELD.w * 0.42) / 2, sent);
          const y = lerp(PILL.y, FIELD.y, expand);
          const o = cards[2].o;
          return (
            <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: h / 2, background: sent > 0 ? pal.p : expand > 0.5 ? pal.bg : pal.line, boxShadow: expand > 0.5 && sent < 1 ? `inset 0 0 0 2px ${pal.line}` : undefined, opacity: o, display: "flex", alignItems: "center", padding: "0 28px", boxSizing: "border-box", fontSize: expand > 0.5 ? 36 : 24, color: sent > 0.5 ? pal.onP : pal.fg, fontWeight: 600, justifyContent: expand > 0.5 && sent < 0.5 ? "flex-start" : "center" }}>
              {expand < 0.5 ? "Reply" : typed}
              {expand >= 0.5 && sent < 0.3 && Math.floor(t * 2.5) % 2 === 0 && <span style={{ width: 3, height: 38, background: pal.p, marginLeft: 4 }} />}
            </div>
          );
        })()}
        {fieldVis && sent < 1 && expand > 0.5 && (
          <div style={{ position: "absolute", left: FIELD.x + FIELD.w / 2 + 16, top: FIELD.y - 32, width: 64, height: 64, borderRadius: 32, background: t >= retT ? pal.p : card, opacity: 1 - sent }} />
        )}
        {/* keyboard */}
        {kbIn > 0.01 && (
          <div style={{ position: "absolute", left: 0, top: 0, opacity: c01(kbIn * 1.4), transform: `translateY(${(1 - kbIn) * 160}px)` }}>
            <div style={{ position: "absolute", left: KB.x - 560, top: KB.y - 190, width: 1120, height: 440, borderRadius: 36, background: pal.card }} />
            {ROWS.map((row, r) =>
              row.split("").map((ch) => {
                const k = keyPos(ch);
                const pr = pressed(ch);
                return (
                  <div key={ch} style={{ position: "absolute", left: k.x - KEY / 2, top: k.y - KEY / 2, width: KEY, height: KEY, borderRadius: 16, background: pr > 0 ? pal.p : card, color: pr > 0 ? pal.onP : pal.fg, fontSize: 34, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", transform: `translateY(${pr * 6}px)` }}>
                    {ch}
                  </div>
                );
              }),
            )}
            <div style={{ position: "absolute", left: RETURN.x - 90, top: RETURN.y - KEY / 2, width: 180, height: KEY, borderRadius: 16, background: t >= retT ? pal.p : card, color: t >= retT ? pal.onP : pal.fg, fontSize: 28, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", transform: `translateY(${pressed("ret") * 6}px)` }}>
              return
            </div>
            <div style={{ position: "absolute", left: KB.x - 300, top: KB.y - 150 + 3 * (KEY + GAP), width: 600, height: KEY, borderRadius: 16, background: card }} />
          </div>
        )}
        {/* the ball */}
        <div style={{ position: "absolute", left: ball.x - BR, top: ball.y - BR, width: BR * 2, height: BR * 2, borderRadius: BR, background: t < 0.5 || t >= 9.4 ? "#ffffff" : ball2, boxShadow: "0 6px 18px rgba(0,0,0,0.25)", transformOrigin: "50% 100%", transform: `scale(${1 + 0.18 * sq}, ${1 - 0.22 * sq})` }} />
        {cursorVis > 0 && (
          <div style={{ opacity: cursorVis }}>
            <Cursor x={cur.x} y={cur.y} press={press} color={pal.dark ? "#ffffff" : "#0b0b0c"} size={52} />
          </div>
        )}
      </div>
      <Track src="tracks/ball-ui-loop.wav" on={audio} />
    </AbsoluteFill>
  );
}
