import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Cursor, Svg, Track, c01, charX, cubicInOut, expIn, expInOut, expOut, fontOf, lerp, mix, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { label: string; hero: string; stat: string; words: string; line: string; note: string };

// One brand-colored dot carries a whole film: it is a toggle knob, the dot on
// an "i", a spring drawn on a graph, a shape that fills the frame, the centre
// of an orbit of words and the seed of a halftone field, then it travels home
// so the last frame matches the first.
const SPR = (x: number) => spring(x * 1.15, 9, 0.32); // the one spring the graph and the dot share
const G = { x0: 520, x1: 1400, yBase: 760, yTop: 330 };

export default function DotSystem({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const V = pal.v;
  const DARK = pal.dark ? mix(pal.bg, "#000000", 0.6) : "#0e0e10";
  const onDark = "#f4f2ee";
  const label = c.label || "Reduce Motion";
  const hero = c.hero || "Motion";
  const words = list(c.words || "SPRINGS, EASING, KINETIC TYPE, 3D, SOUND").slice(0, 6);

  // ---- toggle + word morph ----
  const LS = 64; // label size
  const HS = 230; // hero size
  const lxs = charX(label, LS, 600, 0, ff);
  const hxs = charX(hero.replace(/ı/g, "i"), HS, 800, 0, ff);
  const labelX = 960 - 120;
  const heroX = 960 - hxs[hxs.length - 1] / 2;
  const at = label.toLowerCase().lastIndexOf(hero.toLowerCase());
  const iIdx = hero.toLowerCase().indexOf("i");
  const click = 0.6;
  const knob = t < click ? 0 : spring(t - click, 26, 0.7);
  const morph = expInOut(seg(t, 1.05, 0.8));
  const toggleOut = expInOut(seg(t, 1.0, 0.45));
  const back = expInOut(seg(t, 14.2, 0.75)); // return to the first frame
  const showToggle = t < 1.6 || t > 14.0;

  // the dot's home on the hero word
  const heroBase = 560;
  const dotOnI = iIdx >= 0 ? { x: heroX + (hxs[iIdx] + hxs[iIdx + 1]) / 2, y: heroBase - HS * 0.72 } : { x: heroX + hxs[hxs.length - 1] + 30, y: heroBase - 20 };
  const knobPos = (k: number) => ({ x: lerp(960 - 300 - 46, 960 - 300 + 46, k), y: 540 });

  // ---- graph ----
  const gp = seg(t, 2.6, 2.1); // time along the spring
  const gy = (u: number) => G.yBase - (G.yBase - G.yTop) * SPR(u * 2.2);
  const gx = (u: number) => lerp(G.x0, G.x1, u);
  const graphIn = expOut(seg(t, 2.3, 0.4)) * (1 - expIn(seg(t, 5.0, 0.3)));
  const callout = spring(t - 4.6, 18, 0.6) * (1 - expIn(seg(t, 5.0, 0.25)));

  // ---- shape scene ----
  const shoot = expInOut(seg(t, 5.0, 0.4));
  const fill = expIn(seg(t, 5.35, 0.45));
  const sqIn = spring(t - 5.9, 14, 0.55);
  const pill = expInOut(seg(t, 6.8, 0.45));
  const contract = expInOut(seg(t, 7.4, 0.6));

  // ---- orbit + halftone ----
  const orbitIn = expOut(seg(t, 8.0, 0.6));
  const open = expIn(seg(t, 10.0, 0.8));
  const field = expInOut(seg(t, 10.6, 1.3));
  const flip = expInOut(seg(t, 11.5, 0.5));
  const card = expOut(seg(t, 12.0, 0.5));
  const cardOut = expInOut(seg(t, 13.6, 0.5));

  // ---- dot route ----
  let dot = { x: 960, y: 540, r: 22 };
  if (t < 1.05) dot = { ...knobPos(knob), r: 40 };
  else if (t < 1.85) {
    const k = morph;
    const a = knobPos(1);
    dot = { x: lerp(a.x, dotOnI.x, k), y: lerp(a.y, dotOnI.y, k) - Math.sin(k * Math.PI) * 120, r: lerp(40, 26, k) };
  } else if (t < 2.6) {
    const j = expInOut(seg(t, 2.25, 0.35));
    dot = { x: lerp(dotOnI.x, gx(0), j), y: lerp(dotOnI.y, gy(0), j) - Math.sin(j * Math.PI) * 160, r: 26 };
  } else if (t < 5.0) dot = { x: gx(gp), y: gy(gp), r: 26 };
  else if (t < 5.4) dot = { x: lerp(gx(1), 1500, shoot), y: lerp(gy(1), 540, shoot), r: 26 };
  else if (t < 7.4) dot = { x: 1500, y: 540, r: 26 + fill * 2400 };
  else dot = { x: lerp(1500, 960, contract), y: 540, r: lerp(2400, 30, contract) };

  const bgDark = t >= 7.4 && t < 12.0 ? 1 : 0;
  const words2 = words.map((w, i) => ({ w, a: (i / words.length) * Math.PI * 2 + (t - 8) * 0.7 }));

  return (
    <AbsoluteFill style={{ background: bgDark ? DARK : pal.bg, overflow: "hidden", fontFamily: ff }}>
      {/* toggle + label → hero word */}
      {showToggle && t < 14.0 && (
        <>
          <div style={{ position: "absolute", left: 960 - 300 - 90, top: 540 - 52, width: 180, height: 104, borderRadius: 52, background: knob > 0.5 ? mix(V, pal.bg, 0.0) : pal.card2, opacity: 1 - toggleOut, transform: `scale(${1 - toggleOut * 0.4})` }} />
          {t < click + 0.5 && <Cursor x={lerp(780, 960 - 300 + 30, cubicInOut(seg(t, 0, 0.55)))} y={lerp(800, 560, cubicInOut(seg(t, 0, 0.55)))} press={t > click - 0.06 && t < click + 0.1 ? 1 : 0} color={pal.dark ? "#fff" : "#0b0b0c"} size={46} />}
        </>
      )}
      {t < 2.6 && (
        <Svg>
          {label.split("").map((ch, i) => {
            const inHero = at >= 0 && i >= at && i < at + hero.length;
            const hi = i - at;
            const x0 = labelX + lxs[i];
            const y0 = 540 + LS * 0.36;
            if (!inHero) {
              const fall = expIn(seg(t, 1.0 + i * 0.03, 0.5));
              return <text key={i} x={x0} y={y0 + fall * 200} fontFamily={ff} fontSize={LS} style={{ fontWeight: 600 }} fill={pal.fg} opacity={1 - fall} transform={`rotate(${fall * (i % 2 ? 18 : -18)} ${x0} ${y0})`}>{ch}</text>;
            }
            const k = expInOut(seg(t, 1.05 + hi * 0.035, 0.75));
            const x = lerp(x0, heroX + hxs[hi], k);
            const y = lerp(y0, heroBase, k) - Math.sin(k * Math.PI) * (40 + hi * 12);
            const size = lerp(LS, HS, k);
            const wgt = lerp(600, 800, k);
            const isI = hi === iIdx;
            return <text key={i} x={x} y={y} fontFamily={ff} fontSize={size} style={{ fontWeight: wgt }} fill={pal.fg}>{isI && k > 0.5 ? "ı" : ch}</text>;
          })}
          {at < 0 && t > 1.2 && <text x={960} y={heroBase} textAnchor="middle" fontFamily={ff} fontSize={HS} style={{ fontWeight: 800 }} fill={pal.fg} opacity={morph}>{hero}</text>}
        </Svg>
      )}
      {t >= 2.25 && t < 2.6 && (
        <Svg>
          {hero.split("").map((ch, i) => <text key={i} x={heroX + hxs[i]} y={heroBase - expIn(seg(t, 2.3, 0.3)) * 40} fontFamily={ff} fontSize={HS} style={{ fontWeight: 800 }} fill={pal.fg} opacity={1 - expIn(seg(t, 2.3, 0.3))}>{i === iIdx ? "ı" : ch}</text>)}
        </Svg>
      )}
      {/* graph */}
      {graphIn > 0.01 && (
        <Svg>
          <g opacity={graphIn}>
            <line x1={G.x0 - 40} x2={G.x1 + 60} y1={G.yBase} y2={G.yBase} stroke={pal.line} strokeWidth={3} />
            <line x1={G.x0 - 40} x2={G.x1 + 60} y1={G.yTop} y2={G.yTop} stroke={pal.faint} strokeWidth={2} strokeDasharray="10 12" />
            <path d={"M" + Array.from({ length: 121 }).map((_, i) => { const u = (i / 120) * Math.min(1, gp); return `${gx(u).toFixed(1)},${gy(u).toFixed(1)}`; }).join(" L")} stroke={pal.fg} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          {callout > 0.01 && (
            <g transform={`translate(${G.x1 + 30} ${G.yTop - 70}) scale(${callout})`}>
              <rect x={-10} y={-56} width={220} height={92} rx={46} fill={pal.fg} />
              <text x={100} y={6} textAnchor="middle" fontFamily={ff} fontSize={52} style={{ fontWeight: 800 }} fill={pal.bg}>{c.stat || "+22%"}</text>
            </g>
          )}
          {t >= 5.0 && t < 5.4 && <line x1={gx(1)} y1={gy(1)} x2={dot.x} y2={dot.y} stroke={V} strokeWidth={6} strokeLinecap="round" />}
        </Svg>
      )}
      {/* the dot */}
      {t < 13.6 && (
        <div style={{ position: "absolute", left: dot.x - dot.r, top: dot.y - dot.r, width: dot.r * 2, height: dot.r * 2, borderRadius: "50%", background: V, zIndex: t >= 5.4 && t < 7.4 ? 0 : 2, opacity: t >= 10.0 ? 1 - open : 1 }} />
      )}
      {/* shape states inside the flood: rotating square → pill */}
      {t >= 5.9 && t < 7.4 && (
        <div style={{ position: "absolute", left: 960 - lerp(260, 520, pill) / 2, top: 540 - lerp(130, 100, pill), width: lerp(260, 520, pill), height: lerp(260, 200, pill), borderRadius: lerp(56, 100, pill), background: DARK, transform: `rotate(${lerp(-180, 0, sqIn) * (1 - pill)}deg) scale(${sqIn})` }} />
      )}
      {/* orbit of words */}
      {t >= 8.0 && t < 11.0 && (
        <Svg>
          {words2.map(({ w, a }, i) => {
            const r = 300 + open * 900;
            const x = 960 + Math.cos(a) * r;
            const y = 540 + Math.sin(a) * r * 0.62;
            return (
              <text key={i} x={x} y={y + 20} textAnchor="middle" fontFamily={ff} fontSize={56} style={{ fontWeight: 800, letterSpacing: open * 40 }} fill={onDark} opacity={orbitIn * (1 - open)}>
                {w}
              </text>
            );
          })}
        </Svg>
      )}
      {/* halftone field → black → end card */}
      {t >= 10.2 && t < 14.4 && (
        <Svg>
          {Array.from({ length: 24 * 14 }).map((_, i) => {
            const gx2 = (i % 24) * 84 + 42;
            const gy2 = Math.floor(i / 24) * 84 + 12;
            const d = Math.hypot(gx2 - 960, gy2 - 540);
            const reach = field * 1400 - d;
            const ret = t > 13.6 ? expInOut(seg(t, 13.6, 0.6)) : 0;
            const r = c01(reach / 300) * (10 + 32 * flip) * (1 - ret) + (ret > 0 ? c01((ret * 1400 - d) / 200) * 6 * (1 - back) : 0);
            return r > 0.3 ? <circle key={i} cx={gx2} cy={gy2} r={r} fill={flip > 0.5 ? DARK : V} /> : null;
          })}
        </Svg>
      )}
      {t >= 11.9 && t < 13.6 && <div style={{ position: "absolute", inset: 0, background: DARK, opacity: flip }} />}
      {t >= 12.0 && t < 14.2 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", color: onDark, opacity: card * (1 - cardOut), transform: `translateY(${(1 - card) * 30 - cardOut * 40}px)` }}>
          <div style={{ fontSize: 130, fontWeight: 800, letterSpacing: "-0.045em" }}>
            {nameOf(b)}
            <span style={{ color: V }}>.</span>
          </div>
          <div style={{ fontSize: 50, fontWeight: 600, opacity: 0.85, marginTop: 4 }}>{c.line || "Motion, by design."}</div>
          <div style={{ display: "inline-block", marginTop: 40, padding: "12px 26px", borderRadius: 99, border: `2px solid ${V}`, color: V, fontSize: 30, fontWeight: 700 }}>{c.note || "0 keyframes"}</div>
        </div>
      )}
      {/* return: the dot runs the graph backwards into the toggle */}
      {t >= 13.6 && (
        <>
          <div style={{ position: "absolute", inset: 0, background: DARK, opacity: 1 - expInOut(seg(t, 13.8, 0.5)) }} />
          {(() => {
            const r = seg(t, 13.9, 0.6);
            const k = expInOut(seg(t, 14.4, 0.5));
            const toggleBack = expOut(seg(t, 14.3, 0.4));
            const gpos = { x: gx(1 - r), y: gy(1 - r) };
            const home = knobPos(0);
            const p = t < 14.4 ? gpos : { x: lerp(gx(0), home.x, k), y: lerp(gy(0), home.y, k) };
            return (
              <>
                {t < 14.6 && (
                  <Svg>
                    <path d={"M" + Array.from({ length: 61 }).map((_, i) => { const u = (i / 60); return `${gx(u).toFixed(1)},${gy(u).toFixed(1)}`; }).join(" L")} stroke={pal.faint} strokeWidth={6} fill="none" strokeLinecap="round" opacity={1 - expIn(seg(t, 14.3, 0.3))} />
                  </Svg>
                )}
                <div style={{ position: "absolute", left: 960 - 300 - 90, top: 540 - 52, width: 180, height: 104, borderRadius: 52, background: pal.card2, opacity: toggleBack, transform: `scale(${lerp(0.6, 1, toggleBack)})` }} />
                <Svg>
                  <text x={labelX} y={540 + LS * 0.36} fontFamily={ff} fontSize={LS} style={{ fontWeight: 600 }} fill={pal.fg} opacity={toggleBack}>{label}</text>
                </Svg>
                <div style={{ position: "absolute", left: p.x - lerp(26, 40, k), top: p.y - lerp(26, 40, k), width: lerp(52, 80, k), height: lerp(52, 80, k), borderRadius: "50%", background: V }} />
                {t > 14.4 && <Cursor x={lerp(1100, 780, cubicInOut(seg(t, 14.4, 0.6)))} y={lerp(900, 800, cubicInOut(seg(t, 14.4, 0.6)))} color={pal.dark ? "#fff" : "#0b0b0c"} size={46} />}
              </>
            );
          })()}
        </>
      )}
      <Track src="tracks/dot-system.wav" on={audio} />
    </AbsoluteFill>
  );
}
