import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Cursor, Mark, Track, alpha, c01, cubicInOut, expIn, expInOut, expOut, fontOf, kf, lerp, nameOf, palette, seg, SERIF, spring, useT, type Pal } from "../../motion";

type C = { request: string; thinking: string; results: string; answer: string; question: string; line1: string; line2: string };

// An assistant launch film on a 130 BPM grid, one continuous take: a request
// typed into a glowing composer, a send that becomes a wok tossing
// ingredients, a flood of result cards on the drop, the pick flying back into
// the chat, an order, and the button growing into the closing page.
const B = 60 / 130;
const b = (n: number) => n * B;
const PH_W = 428;
const PH_H = 900;
const SX = 960 - PH_W / 2; // phone screen origin in world/screen space
const SY = 540 - PH_H / 2;

function Dish({ k, pal }: { k: number; pal: Pal }) {
  const d: ReactNode[] = [
    // noodles
    <g key="n"><ellipse cx="50" cy="62" rx="38" ry="10" fill="#f4e3c1" /><path d="M12 62 A38 30 0 0 0 88 62 Z" fill="#e2552c" />{[0, 1, 2, 3].map((i) => <path key={i} d={`M${22 + i * 14} 60 q6 -14 0 -26 q-6 -10 2 -18`} stroke="#ffd66b" strokeWidth="4" fill="none" strokeLinecap="round" />)}<circle cx="70" cy="52" r="5" fill="#d11f1f" /><path d="M30 20 l30 -12" stroke="#c88a4a" strokeWidth="3" /></g>,
    // taco
    <g key="t"><path d="M14 66 A36 36 0 0 1 86 66 Z" fill="#f2b845" /><path d="M22 62 q10 -16 20 -6 q10 -14 20 -4 q10 -12 18 4" stroke="#5cb85c" strokeWidth="7" fill="none" strokeLinecap="round" /><circle cx="38" cy="52" r="5" fill="#d9342b" /><circle cx="60" cy="50" r="5" fill="#8b3a1a" /></g>,
    // burger
    <g key="b"><path d="M18 46 A32 22 0 0 1 82 46 Z" fill="#e8a343" /><rect x="16" y="46" width="68" height="7" rx="3" fill="#6dbb4a" /><rect x="16" y="53" width="68" height="11" rx="4" fill="#6b3a1f" /><rect x="18" y="64" width="64" height="6" fill="#f6c945" /><rect x="18" y="70" width="64" height="9" rx="4" fill="#e8a343" /></g>,
    // wings
    <g key="w">{[0, 1, 2].map((i) => <g key={i} transform={`rotate(${-30 + i * 30} 50 60)`}><ellipse cx="50" cy="40" rx="11" ry="18" fill="#c8501f" /><rect x="47" y="56" width="6" height="16" rx="3" fill="#f4e3c1" /></g>)}</g>,
    // ramen
    <g key="r"><path d="M12 54 A38 30 0 0 0 88 54 Z" fill="#202020" /><ellipse cx="50" cy="54" rx="38" ry="10" fill="#d9822b" /><circle cx="38" cy="52" r="8" fill="#fff" /><circle cx="38" cy="52" r="4" fill="#f5b51b" /><rect x="56" y="46" width="18" height="9" rx="3" fill="#e9c3a5" /><path d="M60 20 l14 26 M66 18 l12 28" stroke="#c88a4a" strokeWidth="3" /></g>,
    // hot chicken
    <g key="c"><path d="M20 66 q-6 -30 26 -36 q30 -6 34 22 q2 20 -24 22 q-28 2 -36 -8z" fill="#b8361b" /><path d="M28 50 q10 -6 18 2 M48 42 q10 -4 16 6 M40 60 q8 -6 16 0" stroke="#e26a2c" strokeWidth="4" fill="none" strokeLinecap="round" /><rect x="64" y="58" width="22" height="8" rx="4" fill="#9fd17a" /></g>,
  ];
  return (
    <svg viewBox="0 0 100 90" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      <rect width="100" height="90" fill={[pal.p, "#2a1f17", "#1d2a1b", "#2a1a14", "#151d2a", "#2a1520"][k % 6]} opacity={k % 6 === 0 ? 0.25 : 1} />
      {d[k % d.length]}
    </svg>
  );
}

export default function AskThinkDeliver({ brand: br, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(br);
  const ff = fontOf(br);
  const req = (c.request || "I'm really hungry, I don't know / what I want but something / spicy, crispy and filling").split("/").map((s) => s.trim()).slice(0, 3);
  const dishes = list(c.results || "Fire Noodles, Birria Tacos, Smash Burger, Buffalo Wings, Spicy Ramen, Hot Chicken").slice(0, 6);
  while (dishes.length < 6) dishes.push("Chef's pick");
  const pick = 0;
  const ink = pal.dark ? "#f5f5f2" : "#0e0e10";
  const flood = pal.a;
  const onFlood = alpha(pal.onA, 1);

  // ---- typing ----
  const full = req.join("\n");
  const typeEnd = b(5.6);
  const nTyped = Math.floor(c01(seg(t, b(0.6), typeEnd - b(0.6))) * full.length);
  const typedLines = full.slice(0, nTyped).split("\n");
  const sent = t >= b(6);

  // ---- camera on the phone world ----
  const lz = Math.log;
  const camZ = Math.exp(kf(t, [[0, lz(2.2)], [b(5.8), lz(3.0)], [b(6.2), lz(3.0)], [b(7.6), lz(1.0)], [b(21), lz(1.0)], [b(22.6), lz(1.18)]], cubicInOut));
  const composerY = SY + PH_H - 92;
  const camY = kf(t, [[0, composerY], [b(6.2), composerY], [b(7.6), 540], [b(21), 540], [b(22.6), 640]], cubicInOut);
  const camX = kf(t, [[0, 960], [b(21), 960], [b(22.6), 960]], cubicInOut);

  // ---- phases ----
  const ripple = expOut(seg(t, b(6), b(1.2)));
  const bubbleUp = expInOut(seg(t, b(6.1), b(1.4)));
  const wok = spring(t - b(6.8), 16, 0.7) * (1 - c01(seg(t, b(12), b(0.6))));
  const drop = b(12);
  const floodR = expIn(seg(t, drop - 0.1, 0.45)) * 2300 * (1 - expInOut(seg(t, b(16), b(1.2))));
  const cardsOn = t >= drop && t < b(16.4);
  const stripX = kf(t, [[drop, 3], [drop + b(1.2), 3], [drop + b(3.4), 0]], expInOut);
  const chatIn = t >= b(16);
  const fly = expInOut(seg(t, b(16), b(1.4)));
  const ans = expOut(seg(t, b(17.3), b(0.8)));
  const ask = expOut(seg(t, b(18.2), b(0.8)));
  const pills = spring(t - b(19), 18, 0.75);
  const clickT = b(20.2);
  const spin = t > clickT && t < b(21);
  const done = t >= b(21);
  const grow = expInOut(seg(t, b(21.6), b(2.2)));
  const outro = t >= b(21.6);

  // composer glow
  const glow = (_r: number) => `conic-gradient(from ${t * 120}deg, #ff5fa2, #ff8a3d, ${pal.p}, #4fd8ff, #8b6cff, #ff5fa2)`;
  const screen = (x: number, y: number) => ({ left: SX + x, top: SY + y });

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      {/* ===== phone world ===== */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0 0", transform: `translate(960px, 540px) scale(${camZ}) translate(${-camX}px, ${-camY}px)` }}>
        {/* phone body */}
        <div style={{ position: "absolute", left: SX - 11, top: SY - 11, width: PH_W + 22, height: PH_H + 22, borderRadius: 64, background: "#0e0e10", opacity: c01(seg(t, b(6.4), b(0.6))) }} />
        <div style={{ position: "absolute", ...screen(0, 0), width: PH_W, height: PH_H, borderRadius: 54, background: pal.bg, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 30, top: 18, fontSize: 17, fontWeight: 600, color: pal.fg, opacity: c01(seg(t, b(6.4), b(0.6))) }}>9:41</div>
          <div style={{ position: "absolute", left: PH_W / 2 - 60, top: 12, width: 120, height: 32, borderRadius: 20, background: "#0e0e10", opacity: c01(seg(t, b(6.4), b(0.6))) }} />
          {/* user bubble */}
          {sent && (
            <div style={{ position: "absolute", right: 18, top: lerp(PH_H - 190, 80, bubbleUp), maxWidth: 330, padding: "14px 18px", borderRadius: 22, borderBottomRightRadius: 6, background: ink, color: pal.dark ? "#0e0e10" : "#f5f5f2", fontSize: 17, lineHeight: 1.35, transform: `scale(${lerp(1.05, 1, bubbleUp)})`, transformOrigin: "100% 0" }}>
              {req.join(" ")}
            </div>
          )}
          {/* thinking */}
          {t > b(7) && t < b(12.2) && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", fontSize: 19, fontWeight: 600, color: pal.muted, opacity: expOut(seg(t, b(7), b(0.6))), backgroundImage: `linear-gradient(90deg, ${pal.muted} 0%, ${pal.fg} ${((t * 0.9) % 1) * 100}%, ${pal.muted} 100%)`, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {c.thinking || "Finding something for you…"}
            </div>
          )}
          {/* chosen card in the chat */}
          {chatIn && (
            <div style={{ position: "absolute", left: 18, top: lerp(260, 250, fly), width: lerp(330, 240, fly), height: lerp(440, 300, fly), borderRadius: 22, overflow: "hidden", background: "#121214", opacity: c01(fly * 4), transform: `translateY(${(1 - fly) * -60}px)` }}>
              <div style={{ position: "relative", height: "62%" }}><Dish k={pick} pal={pal} /></div>
              <div style={{ padding: "10px 14px", color: "#f5f5f2", fontSize: 18, fontWeight: 700 }}>{dishes[pick]}</div>
            </div>
          )}
          {chatIn && (
            <div style={{ position: "absolute", left: 18, top: 572, width: 380, fontSize: 18, lineHeight: 1.4, color: pal.fg }}>
              <div style={{ opacity: ans, transform: `translateY(${(1 - ans) * 18}px)` }}>{c.answer || "Found it. Smoky, spicy and seriously filling."}</div>
              <div style={{ marginTop: 10, opacity: ask, transform: `translateY(${(1 - ask) * 18}px)`, fontWeight: 600 }}>{c.question || "Want me to order it for you?"}</div>
            </div>
          )}
          {chatIn && (
            <div style={{ position: "absolute", left: 18, top: 690, display: "flex", gap: 10, opacity: c01(pills * 1.5), transform: `translateY(${(1 - pills) * 20}px)` }}>
              <div style={{ width: 170, height: 52, borderRadius: 26, background: ink, color: pal.dark ? "#0e0e10" : "#f5f5f2", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {spin ? <div style={{ width: 20, height: 20, borderRadius: 10, border: `3px solid ${alpha(pal.dark ? "#0e0e10" : "#f5f5f2", 0.3)}`, borderTopColor: pal.dark ? "#0e0e10" : "#f5f5f2", transform: `rotate(${t * 720}deg)` }} /> : done ? "✓ Ordered" : "Order now"}
              </div>
              <div style={{ width: 170, height: 52, borderRadius: 26, boxShadow: `inset 0 0 0 2px ${pal.line}`, color: pal.fg, fontSize: 18, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>More options</div>
            </div>
          )}
          {/* composer */}
          <div style={{ position: "absolute", left: 16, right: 16, top: PH_H - 160, height: 130 }}>
            <div style={{ position: "absolute", inset: -6, borderRadius: 30, background: glow(0), filter: "blur(14px)", opacity: sent ? 1 - ripple : 0.9 }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: 26, background: pal.dark ? "#141416" : "#ffffff", boxShadow: `inset 0 0 0 1.5px ${pal.line}` }} />
            {!sent && (
              <div style={{ position: "absolute", left: 18, top: 16, right: 70, fontSize: 18, lineHeight: "26px", color: pal.fg, whiteSpace: "pre" }}>
                {typedLines.join("\n")}
                <span style={{ display: "inline-block", width: 2, height: 20, background: pal.p, verticalAlign: "-3px", opacity: Math.floor(t * 3) % 2 }} />
              </div>
            )}
            {sent && <div style={{ position: "absolute", left: 18, top: 16, fontSize: 18, color: pal.faint }}>Ask anything</div>}
            {/* send button / wok */}
            {(() => {
              const sx = PH_W - 32 - 42;
              const sy = 130 - 24 - 21;
              const press = t > b(5.8) && t < b(6.1) ? 0.88 : 1;
              const wx = PH_W / 2 - 16;
              const wy = 360 - (PH_H - 160);
              const w = wok;
              const x = lerp(sx, wx, w);
              const y = lerp(sy, wy, w);
              const size = lerp(42, 170, w);
              return (
                <>
                  {sent && ripple < 1 && <div style={{ position: "absolute", left: sx + 21 - ripple * 260, top: sy + 21 - ripple * 260, width: ripple * 520, height: ripple * 520, borderRadius: "50%", background: flood, opacity: 0.55 * (1 - ripple) }} />}
                  <div style={{ position: "absolute", left: x - size / 2 + 21, top: y + 21 - size / 2, width: size, height: lerp(size, size / 2, w), borderRadius: w > 0.05 ? `0 0 ${size}px ${size}px` : 21, background: w > 0.05 ? "#ff6a2a" : "#2f6bff", transform: `scale(${press})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 22, fontWeight: 800 }}>
                    {w < 0.05 && "↑"}
                  </div>
                  {w > 0.3 && <div style={{ position: "absolute", left: x + 21 + size / 2 - 4, top: y + 21 - 2, width: 80 * w, height: 7, borderRadius: 4, background: "#ff6a2a", transform: "rotate(-8deg)", transformOrigin: "0 50%" }} />}
                  {w > 0.3 &&
                    [8, 9, 10, 11].flatMap((beat, k) =>
                      [0, 1].map((j) => {
                        const tt = (t - b(beat)) / b(1.2);
                        if (tt < 0 || tt > 1) return null;
                        const col = ["#d11f1f", "#5cb85c", "#ffd66b", "#e2552c", "#8b6cff", "#f4e3c1"][(k * 2 + j) % 6];
                        const dx = (j ? 1 : -1) * (20 + k * 8) * tt;
                        const dy = -260 * 4 * tt * (1 - tt);
                        return <div key={`${k}${j}`} style={{ position: "absolute", left: x + 21 + dx * 1.6 - 15, top: y + 4 + dy * 1.2, width: 30, height: 30, borderRadius: j ? 7 : 15, background: col, transform: `rotate(${tt * 540}deg)` }} />;
                      }),
                    )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ===== screen-space layers ===== */}
      {floodR > 0 && (
        (() => {
          const k = expInOut(seg(t, b(16), b(1.2)));
          const fx = lerp(SX + PH_W / 2, SX + PH_W - 120, k);
          const fy = lerp(SY + 360, SY + 110, k);
          return <div style={{ position: "absolute", left: fx - floodR, top: fy - floodR, width: floodR * 2, height: floodR * 2, borderRadius: "50%", background: flood }} />;
        })()
      )}
      {cardsOn &&
        dishes.map((name, i) => {
          const burst = spring(t - drop - i * 0.04, 15, 0.72);
          const out = expInOut(seg(t, b(16), b(0.8)));
          const x = 960 + (i - pick - stripX) * 370 * burst;
          const isPick = i === pick;
          const lift = isPick ? expOut(seg(t, drop + b(3.4), b(0.6))) : 0;
          return (
            <div key={i} style={{ position: "absolute", left: x - 165, top: 540 - 220 - lift * 30, width: 330, height: 440, borderRadius: 28, overflow: "hidden", background: "#121214", transform: `scale(${burst * (1 - out * (isPick ? 0 : 1))})`, opacity: isPick ? 1 - out : 1 - out, boxShadow: lift ? "0 30px 60px rgba(0,0,0,0.35)" : undefined }}>
              <div style={{ position: "relative", height: 250 }}><Dish k={i} pal={pal} /></div>
              <div style={{ padding: "18px 22px", color: "#f5f5f2" }}>
                <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>{name}</div>
                <div style={{ fontSize: 17, opacity: 0.6, marginTop: 6 }}>Bold, fresh and fast</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 26, fontSize: 20, fontWeight: 600 }}>
                  <span>${(12 + i * 1.5).toFixed(2)}</span>
                  <span style={{ opacity: 0.8 }}>★ {(4.9 - i * 0.1).toFixed(1)}</span>
                </div>
              </div>
              {isPick && lift > 0 && <div style={{ position: "absolute", left: 16, top: 16, padding: "8px 14px", borderRadius: 99, background: flood, color: onFlood, fontSize: 16, fontWeight: 700, opacity: lift }}>Best match</div>}
            </div>
          );
        })}
      {t > clickT - 0.8 && t < clickT + 0.5 && (
        <Cursor x={lerp(1240, SX + 18 + 85, cubicInOut(seg(t, clickT - 0.8, 0.7)))} y={lerp(900, SY + 690 + 30, cubicInOut(seg(t, clickT - 0.8, 0.7)))} press={t > clickT - 0.06 && t < clickT + 0.08 ? 1 : 0} color={pal.dark ? "#fff" : "#0b0b0c"} size={40} />
      )}

      {/* ===== outro: the button becomes the page ===== */}
      {outro && (() => {
        const w = lerp(170 * camZ, 2400, grow);
        const h = lerp(52 * camZ, 1300, grow);
        const bx = lerp(960 + (SX + 18 + 85 - camX) * camZ, 960, grow);
        const by = lerp(540 + (SY + 690 + 26 - camY) * camZ, 540, grow);
        const label = expInOut(seg(t, b(23.2), b(1)));
        const w1 = (c.line1 || "You were craving noodles.").split(" ");
        const w2 = (c.line2 || "Now it's on the way.").split(" ");
        const route = expInOut(seg(t, b(27), b(2.2)));
        const markIn = spring(t - b(29.2), 16, 0.7);
        const wipe = expOut(seg(t, b(29.8), b(1.2)));
        const linesOut = expInOut(seg(t, b(28.6), b(0.8)));
        const fgc = pal.dark ? "#0e0e10" : "#f5f5f2";
        return (
          <>
            <div style={{ position: "absolute", left: bx - w / 2, top: by - h / 2, width: w, height: h, borderRadius: Math.min(h / 2, 600), background: ink }} />
            {label < 1 && (
              <div style={{ position: "absolute", left: bx, top: by, transform: `translate(-50%, -50%) translateX(${-label * 1400}px)`, fontSize: lerp(18 * camZ, 120, grow), fontWeight: 700, color: fgc, whiteSpace: "nowrap" }}>✓ Ordered</div>
            )}
            {t > b(24) && (
              <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", color: fgc, fontSize: 92, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.12, opacity: 1 - linesOut, transform: `translateY(${-linesOut * 60}px)` }}>
                <div>{w1.map((w, i) => { const e = expOut(seg(t, b(24) + i * 0.08, 0.4)); return <span key={i} style={{ display: "inline-block", marginRight: "0.25em", opacity: e, transform: `translateY(${(1 - e) * 40}px)` }}>{w}</span>; })}</div>
                <div style={{ color: alpha(fgc, 0.55) }}>{w2.map((w, i) => { const e = expOut(seg(t, b(25.4) + i * 0.08, 0.4)); return <span key={i} style={{ display: "inline-block", marginRight: "0.25em", opacity: e, transform: `translateY(${(1 - e) * 40}px)` }}>{w}</span>; })}</div>
              </div>
            )}
            {t > b(26.6) && (
              <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
                <path d="M520 820 C 700 700, 820 900, 1000 760 S 1300 640, 1400 720" stroke={alpha(fgc, 0.25)} strokeWidth={6} fill="none" strokeDasharray="2 18" strokeLinecap="round" opacity={1 - linesOut * 0} />
                {(() => {
                  const P = (p: number) => {
                    // sample the cubic chain
                    const seg2 = p < 0.5 ? [[520, 820], [700, 700], [820, 900], [1000, 760]] : [[1000, 760], [1180, 620], [1300, 640], [1400, 720]];
                    const u = p < 0.5 ? p * 2 : (p - 0.5) * 2;
                    const q = (k: number) => (1 - u) ** 3 * seg2[0][k] + 3 * (1 - u) ** 2 * u * seg2[1][k] + 3 * (1 - u) * u * u * seg2[2][k] + u ** 3 * seg2[3][k];
                    return [q(0), q(1)];
                  };
                  const [x, y] = P(route);
                  return markIn < 0.01 ? <circle cx={x} cy={y} r={14} fill={pal.p} /> : null;
                })()}
              </svg>
            )}
            {t > b(26.6) && markIn < 0.5 && (
              <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
                <path d="M1400 700 c-26 0 -44 -20 -44 -44 a44 44 0 0 1 88 0 c0 24 -18 44 -44 44 z" fill={pal.p} transform={`translate(0 ${-20 + 20 * expOut(seg(t, b(26.8), b(0.8)))})`} opacity={expOut(seg(t, b(26.8), b(0.8)))} />
              </svg>
            )}
            {t > b(29) && (() => {
              const mx = lerp(1400, 960 - 190, expInOut(seg(t, b(29.2), b(1))));
              const my = lerp(660, 560, expInOut(seg(t, b(29.2), b(1))));
              return (
                <>
                  <div style={{ position: "absolute", left: mx + 70, top: my - 70, height: 140, display: "flex", alignItems: "center", overflow: "hidden", width: 520 * wipe }}>
                    <span style={{ fontFamily: SERIF, fontSize: 110, color: fgc, whiteSpace: "nowrap", paddingLeft: 30 }}>{nameOf(br)}</span>
                  </div>
                  <div style={{ position: "absolute", left: mx + 100, top: my - 112, fontSize: 22, color: alpha(fgc, 0.6), opacity: wipe }}>made with</div>
                  <Mark x={mx} y={my} size={140 * Math.min(1.2, markIn)} b={br} pal={pal} />
                </>
              );
            })()}
          </>
        );
      })()}
      <Track src="tracks/ask-think-deliver.wav" on={audio} />
    </AbsoluteFill>
  );
}
