import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Mark, alpha, countStat, expInOut, expOut, fontOf, lerp, mix, nameOf, palette, seg, SERIF, useT, c01, cubicInOut, type Pal } from "../../motion";

type C = { headline: string; sub: string; cta: string; statement: string; tail: string };

// One continuous camera over a landing page built from the brand kit: a glide
// down the page with pieces lifting toward the lens, a rise to the whole page,
// a dive into the hero, and a title card. No cuts.
const PW = 1200;
const PH = 3900;
const PERSP = 1880;
const K = 1.55; // world scale
const HERO_Y = 330;
const CARD_H = 780; // the hero card the dive lands on
const STRIPS: [number, number][] = (() => {
  const cuts = [0, 300, 600, CARD_H];
  for (let y = CARD_H + 300; y < PH; y += 300) cuts.push(y);
  cuts.push(PH);
  return cuts.slice(0, -1).map((y, i) => [y, cuts[i + 1]] as [number, number]);
})();

// Glide speed (share of cruise) integrated into page position.
const GLIDE = (() => {
  const dt = 1 / 240;
  const sp = (t: number) => (t < 0.6 ? 0.5 * cubicInOut(t / 0.6) : t < 1.25 ? 0.5 : t < 1.6 ? lerp(0.5, 1, cubicInOut((t - 1.25) / 0.35)) : t < 7.3 ? 1 + 0.06 * Math.sin(t * 1.3) : lerp(1, 0.12, cubicInOut((t - 7.3) / 0.9)));
  const pos = [0];
  for (let t = dt; t <= 8.2 + 1e-9; t += dt) pos.push(pos[pos.length - 1] + sp(t) * dt);
  const k = (3480 - HERO_Y) / pos[pos.length - 1];
  return (t: number) => {
    const i = Math.min(pos.length - 1, Math.max(0, t / dt));
    const a = Math.floor(i);
    const b2 = Math.min(pos.length - 1, a + 1);
    return HERO_Y + (pos[a] + (pos[b2] - pos[a]) * (i - a)) * k;
  };
})();

function Lift({ x, y, w, h, z, stand, children, blur = 0, shadow = true, r = 18, gone = 0 }: { x: number; y: number; w: number; h: number; z: number; stand: number; children: ReactNode; blur?: number; shadow?: boolean; r?: number; gone?: number }) {
  if (gone >= 1) return null;
  return (
    <>
      {shadow && (
        <div style={{ position: "absolute", left: x + z * 0.1, top: y + 4 + z * 0.36, width: w, height: h, borderRadius: r, background: "#1a2133", opacity: 0.22 * (1 - gone), filter: `blur(${7 + z * 0.5}px)` }} />
      )}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: h,
          opacity: 1 - gone,
          transformOrigin: "50% 100%",
          transform: `translateZ(${z}px) rotateX(${-stand}deg)`,
          filter: blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : undefined,
        }}
      >
        {children}
      </div>
    </>
  );
}

const card = (pal: Pal, extra?: CSSProperties): CSSProperties => ({ width: "100%", height: "100%", borderRadius: 18, background: pal.card, border: `1.5px solid ${pal.line}`, boxSizing: "border-box", overflow: "hidden", ...extra });

export default function LandingFlyover({ brand: b, content: c }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const floor = mix(pal.bg, pal.dark ? "#000000" : "#eef0f4", pal.dark ? 0.35 : 0.6);

  // camera
  const rise = cubicInOut(seg(t, 7.75, 1.5));
  const dive = cubicInOut(seg(t, 9.47, 0.5));
  const glideY = GLIDE(Math.min(t, 8.2));
  const tilt = lerp(56, 0, cubicInOut(seg(t, 8.15, 0.8)));
  const distGlide = lerp(1080, 1420, expOut(seg(t, 0, 8)));
  const distAll = (PERSP * K) / 0.25 - PERSP;
  const distHero = (PERSP * K) / 0.86 - PERSP;
  const logD = lerp(Math.log(distGlide), Math.log(distAll), rise);
  let dist = Math.exp(lerp(logD, Math.log(distHero), dive));
  dist *= 1 - 0.035 * seg(t, 9.25, 0.22) * (1 - dive);
  const scrollAll = PH / 2 - 40;
  const heroLook = CARD_H / 2;
  let scroll = lerp(glideY, scrollAll, rise);
  scroll = lerp(scroll, heroLook, dive);
  const land = cubicInOut(seg(t, 9.85, 0.5));
  const creep = 1 + 0.02 * seg(t, 10.4, 4.1);
  const fadeRest = c01(dive * 1.6);

  // depth of field: blur by distance down the page from the focus point (near = below)
  const dof = (y: number) => {
    if (t > 8.4) return 0;
    const d = y - scroll;
    return Math.min(14, d > 0 ? d * 0.016 : -d * 0.004) * (1 - seg(t, 7.8, 0.6));
  };
  const lift = (t0: number, z: number, stand: number) => {
    const e = expOut(seg(t, t0, 0.9));
    return { z: z * e, stand: stand * e * (1 - rise) };
  };

  const feat = [
    { k: "Brand kits", d: "Colors, type and motion feel in one place." },
    { k: "Live preview", d: "Every change plays back instantly." },
    { k: "One-click render", d: "MP4 in 16:9, square or vertical." },
  ];
  const stats = [["12k", "teams"], ["4.9", "rating"], ["98%", "on-brand"]];
  const passStat = expOut(seg(scroll, 1700, 500));
  const tiles = [0, 1, 2, 3].map((i) => {
    const e = expOut(seg(t, 0.1 + i * 0.12, 1.1));
    const trail = expInOut(seg(t, 1.2, 1.2));
    const out = seg(t, 2.2, 0.6) * (1 - seg(t, 9.6, 0.4));
    const side = i % 2 ? 1 : -1;
    const row = i < 2 ? 0 : 1;
    return { x: PW / 2 + side * (PW / 2 + 60 + row * 70), y: 60 + row * 150 + trail * 300, z: lerp(0, 160 + row * 40, e), s: lerp(0.4, 1, e), o: (1 - out) * c01(e * 3) };
  });

  const words1 = (c.statement || "Launch videos, on brand").split(" ");
  const words2 = (c.tail || "in minutes.").split(" ");

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, ${mix(floor, pal.dark ? "#000" : "#fff", 0.5)} 0%, ${floor} 75%)`, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", left: 960, top: 540 + land * 150, width: 0, height: 0, perspective: PERSP, transformStyle: "preserve-3d" }}>
        <div
          style={{
            position: "absolute",
            left: -PW / 2,
            top: 0,
            width: PW,
            height: PH,
            transformOrigin: `${PW / 2}px 0px`,
            transformStyle: "preserve-3d",
            transform: `translateZ(${-dist}px) scale3d(${K * creep}, ${K * creep}, ${K * creep}) rotateX(${tilt}deg) translateY(${-scroll}px)`,
          }}
        >
          {/* the page */}
          {/* page background in strips, so strips that pass behind the lens drop out alone */}
          {STRIPS.map(([y0, y1], k) => {
            const below = y0 >= CARD_H;
            const R = lerp(24, 38, dive);
            const last = y1 === CARD_H;
            return (
              <div
                key={k}
                style={{
                  position: "absolute",
                  left: 0,
                  top: y0,
                  width: PW,
                  height: y1 - y0 + (y1 < PH ? 1 : 0),
                  background: pal.bg,
                  opacity: below ? 1 - fadeRest : 1,
                  borderTopLeftRadius: k === 0 ? R : 0,
                  borderTopRightRadius: k === 0 ? R : 0,
                  borderBottomLeftRadius: y1 === PH ? 24 : last ? R * dive : 0,
                  borderBottomRightRadius: y1 === PH ? 24 : last ? R * dive : 0,
                  boxShadow: last && dive > 0 ? `0 40px 80px rgba(26,33,51,${0.2 * dive})` : undefined,
                }}
              />
            );
          })}
          <div style={{ position: "absolute", inset: 0 }}>
            {/* nav */}
            <div style={{ position: "absolute", left: 48, right: 48, top: 30, height: 56, display: "flex", alignItems: "center", gap: 14, filter: `blur(${dof(60)}px)` }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: pal.p }} />
              <div style={{ fontSize: 22, fontWeight: 700, color: pal.fg }}>{nameOf(b)}</div>
              <div style={{ flex: 1 }} />
              {["Product", "Pricing", "Docs"].map((x) => (
                <div key={x} style={{ fontSize: 17, color: pal.muted, marginRight: 22 }}>{x}</div>
              ))}
              <div style={{ padding: "10px 18px", borderRadius: 99, background: pal.fg, color: pal.bg, fontSize: 16, fontWeight: 600 }}>Sign in</div>
            </div>
            {/* hero copy */}
            <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", filter: `blur(${dof(260)}px)` }}>
              <div style={{ fontSize: 78, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.02, color: pal.fg, padding: "0 140px" }}>{c.headline || "Motion that already looks like your brand"}</div>
              <div style={{ marginTop: 22, fontSize: 22, color: pal.muted }}>{c.sub || "Templates for every launch, styled by your kit."}</div>
            </div>
            {/* section titles & body (flat) */}
            {[
              [1290, "Everything you need to ship"],
              [1930, "Teams already moving"],
              [2920, "Simple pricing"],
            ].map(([y, s]) => (
              <div key={s as string} style={{ position: "absolute", left: 0, right: 0, top: y as number, opacity: 1 - fadeRest, textAlign: "center", fontSize: 50, fontWeight: 700, letterSpacing: "-0.03em", color: pal.fg, filter: `blur(${dof((y as number) + 30)}px)` }}>
                {s}
              </div>
            ))}
            {stats.map(([n, l], i) => (
              <div key={l} style={{ position: "absolute", top: 2030, left: 120 + i * 340, width: 280, opacity: 1 - fadeRest, textAlign: "center", filter: `blur(${dof(2080)}px)` }}>
                <div style={{ fontSize: 76, fontWeight: 800, color: i === 1 ? pal.p : pal.fg, letterSpacing: "-0.04em" }}>{countStat(n, passStat)}</div>
                <div style={{ fontSize: 20, color: pal.muted }}>{l}</div>
              </div>
            ))}
            {/* footer */}
            <div style={{ position: "absolute", left: 0, right: 0, top: 3500, opacity: 1 - fadeRest, textAlign: "center", filter: `blur(${dof(3540)}px)` }}>
              <div style={{ fontSize: 58, fontWeight: 700, letterSpacing: "-0.035em", color: pal.fg }}>Start your first video today</div>
              <div style={{ display: "inline-block", marginTop: 26, padding: "16px 30px", borderRadius: 99, background: pal.p, color: pal.onP, fontSize: 20, fontWeight: 600 }}>{c.cta || "Get started free"}</div>
              <div style={{ marginTop: 70, display: "flex", justifyContent: "center", gap: 40, color: pal.faint, fontSize: 16 }}>
                {["About", "Blog", "Careers", "Privacy", "Terms"].map((x) => <span key={x}>{x}</span>)}
              </div>
            </div>
          </div>

          <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", opacity: 1 }}>
            {/* hero button */}
            {(() => {
              const l = lift(0.2, 24, 0);
              return (
                <Lift x={PW / 2 - 130} y={430} w={260} h={64} z={l.z} stand={0} blur={dof(460)} r={99}>
                  <div style={{ ...card(pal), borderRadius: 99, background: pal.p, border: "none", color: pal.onP, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, fontWeight: 600 }}>{c.cta || "Get started free"}</div>
                </Lift>
              );
            })()}
            {/* hero chips */}
            {["4K export", "Brand kit", "60 fps"].map((s, i) => {
              const l = lift(0.15 + i * 0.1, 60 + i * 10, 30);
              return (
                <Lift key={s} x={160 + i * 330} y={540} w={220} h={52} z={l.z} stand={l.stand} blur={dof(560)} r={99}>
                  <div style={{ ...card(pal), borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 18, fontWeight: 600, color: pal.fg }}>
                    <span style={{ width: 10, height: 10, borderRadius: 99, background: i === 1 ? pal.p : pal.a }} />
                    {s}
                  </div>
                </Lift>
              );
            })}
            {/* product mockup */}
            {(() => {
              const l = lift(0.4, 30, 8);
              return (
                <Lift x={100} y={640} w={1000} h={lerp(540, CARD_H - 640 - 30, fadeRest)} z={l.z * (1 - fadeRest)} stand={l.stand} blur={dof(900)}>
                  <div style={{ ...card(pal), padding: 0 }}>
                    <div style={{ height: 40, background: pal.card2, display: "flex", alignItems: "center", gap: 8, padding: "0 16px" }}>
                      {[0, 1, 2].map((i) => <div key={i} style={{ width: 11, height: 11, borderRadius: 9, background: pal.line }} />)}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", height: 500 }}>
                      <div style={{ borderRight: `1.5px solid ${pal.line}`, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                        {[0.9, 0.6, 0.75, 0.5, 0.7].map((w, i) => <div key={i} style={{ height: 14, width: `${w * 100}%`, borderRadius: 7, background: i === 1 ? pal.p : pal.line }} />)}
                      </div>
                      <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} style={{ borderRadius: 12, background: i === 0 ? pal.p : i === 4 ? pal.a : pal.card2, height: 200 }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </Lift>
              );
            })()}
            {/* feature cards */}
            {feat.map((f, i) => {
              const l = lift(1.3 + i * 0.12, 40 + i * 20, 46);
              return (
                <Lift key={f.k} x={60 + i * 370} y={1390} gone={fadeRest} w={340} h={360} z={l.z} stand={l.stand} blur={dof(1570)}>
                  <div style={{ ...card(pal), padding: 30 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: [pal.p, pal.a, pal.fg][i] }} />
                    <div style={{ marginTop: 120, fontSize: 30, fontWeight: 700, color: pal.fg, letterSpacing: "-0.02em" }}>{f.k}</div>
                    <div style={{ marginTop: 10, fontSize: 18, color: pal.muted, lineHeight: 1.35 }}>{f.d}</div>
                  </div>
                </Lift>
              );
            })}
            {/* testimonial */}
            {(() => {
              const l = lift(5.45, 112, 30);
              return (
                <Lift x={160} y={2340} gone={fadeRest} w={880} h={420} z={lerp(22, l.z, c01(l.z / 112))} stand={l.stand} blur={dof(2550)}>
                  <div style={{ ...card(pal, { background: pal.p, border: "none", padding: 50, boxShadow: `inset 0 -34px 0 ${alpha("#ffffff", 0.9)}` }) }}>
                    <div style={{ fontSize: 40, lineHeight: 1.22, fontWeight: 600, color: pal.onP, letterSpacing: "-0.02em" }}>“We replaced a week of motion work with an afternoon.”</div>
                    <div style={{ marginTop: 34, display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ width: 54, height: 54, borderRadius: 99, background: alpha(pal.onP, 0.3) }} />
                      <div style={{ color: pal.onP, fontSize: 20 }}>Head of Brand, a happy team</div>
                    </div>
                  </div>
                </Lift>
              );
            })()}
            {/* pricing */}
            {["Starter", "Pro", "Team"].map((n, i) => {
              const l = lift(6.4 + i * 0.1, i === 1 ? 70 : 36, 34);
              return (
                <Lift key={n} x={60 + i * 370} y={3020} gone={fadeRest} w={340} h={400} z={l.z} stand={l.stand} blur={dof(3200)}>
                  <div style={{ ...card(pal, i === 1 ? { background: pal.fg, border: "none" } : {}), padding: 30 }}>
                    <div style={{ fontSize: 22, color: i === 1 ? pal.bg : pal.muted, fontWeight: 600 }}>{n}</div>
                    <div style={{ marginTop: 14, fontSize: 64, fontWeight: 800, color: i === 1 ? pal.bg : pal.fg, letterSpacing: "-0.04em" }}>{["$0", "$19", "$49"][i]}</div>
                    {[0.8, 0.65, 0.7].map((w, k) => <div key={k} style={{ marginTop: 22, height: 12, width: `${w * 100}%`, borderRadius: 6, background: i === 1 ? alpha(pal.bg, 0.25) : pal.line }} />)}
                    <div style={{ position: "absolute", left: 30, right: 30, bottom: 30, height: 52, borderRadius: 99, background: i === 1 ? pal.p : pal.card2 }} />
                  </div>
                </Lift>
              );
            })}
            {/* logo tiles */}
            {tiles.map((p, i) => (
              <div key={i} style={{ position: "absolute", left: p.x - 50, top: p.y, width: 100, height: 100, transform: `translateZ(${p.z}px) rotateX(${-tilt * 0.9}deg) scale(${p.s})`, opacity: p.o, filter: `blur(${dof(p.y + 200) * 0.6}px)` }}>
                <Mark x={50} y={50} size={100} b={b} pal={pal} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* title card */}
      {t > 9.95 && (
        <>
          <div style={{ position: "absolute", left: "50%", top: 44, transform: `translateX(-50%)`, opacity: expOut(seg(t, 10.02, 0.4)), display: "flex", alignItems: "center", gap: 10, padding: "9px 18px 9px 10px", borderRadius: 99, background: pal.dark ? pal.card2 : "#fff", boxShadow: "0 6px 24px rgba(26,33,51,0.1)" }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: pal.p }} />
            <span style={{ fontSize: 21, fontWeight: 600, color: pal.fg }}>{nameOf(b)}</span>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 112, textAlign: "center", fontSize: 74, fontWeight: 500, letterSpacing: "-0.035em", color: pal.fg }}>
            {words1.map((w, i) => {
              const e = expOut(seg(t, 10.12 + i * 0.06, 0.34));
              return (
                <span key={i} style={{ display: "inline-block", marginRight: "0.25em", opacity: e, transform: `translateY(${(1 - e) * 16}px)`, filter: `blur(${(1 - e) * 12}px)` }}>{w}</span>
              );
            })}
            {words2.map((w, i) => {
              const e = expOut(seg(t, 10.36 + (words1.length - 1) * 0.06 + i * 0.05, 0.34));
              return (
                <span key={`t${i}`} style={{ display: "inline-block", marginRight: "0.22em", fontFamily: SERIF, fontStyle: "italic", fontSize: 82, color: pal.dark ? pal.muted : "#8b8b92", opacity: e, transform: `translateY(${(1 - e) * 16}px)`, filter: `blur(${(1 - e) * 12}px)` }}>{w}</span>
              );
            })}
          </div>
        </>
      )}
    </AbsoluteFill>
  );
}

