import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Browser, Mark, Phone, Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, lerp, mix, nameOf, onColor, palette, seg, spring, useT } from "../../motion";

type C = { prompt: string; headline: string; tagline: string };

// A brand-aware image generator: a prompt types, four on-brand images resolve
// out of noise (your colours, your mark, your headline), one gets picked, and
// it drops straight into a social post, an email header and a website hero.
export default function BrandImageGen({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const prompt = c.prompt || "Summer sale banner, on brand, bold";
  const headline = c.headline || "SUMMER SALE";

  const barIn = spring(t - 0.05, 15, 0.8);
  const typed = Math.floor(c01((t - 0.4) / 1.0) * prompt.length);
  const gen = (i: number) => c01((t - 1.7 - i * 0.12) / 1.0);
  const pick = t > 3.4;
  const gridOut = expInOut(seg(t, 3.9, 0.5));
  const place = (i: number) => spring(t - 4.05 - i * 0.3, 14, 0.78);
  const endP = c01((t - 8.0) / 0.6);

  const art = (v: number, w: number, h: number, key: string): ReactNode => {
    const bgA = [pal.p, pal.a, mix(pal.p, "#000000", 0.4), mix(pal.a, pal.p, 0.5)][v];
    const bgB = [pal.a, pal.p, pal.p, mix(pal.p, "#ffffff", 0.3)][v];
    const ink = onColor(bgA);
    return (
      <div key={key} style={{ position: "absolute", inset: 0, background: `linear-gradient(${120 + v * 40}deg, ${bgA}, ${bgB})`, overflow: "hidden" }}>
        <Svg w={w} h={h}>
          {v === 0 && <circle cx={w * 0.72} cy={h * 0.4} r={h * 0.32} fill="#fff3b0" opacity={0.9} />}
          {v === 1 && [0, 1, 2].map((k) => <circle key={k} cx={w * (0.2 + k * 0.3)} cy={h * 0.75} r={h * 0.22} fill={ink} opacity={0.15 + k * 0.1} />)}
          {v === 2 && <path d={`M0,${h * 0.7} Q${w * 0.3},${h * 0.5} ${w * 0.6},${h * 0.68} T${w},${h * 0.6} V${h} H0 Z`} fill="#7fd3ff" opacity={0.8} />}
          {v === 3 && <rect x={w * 0.55} y={h * 0.15} width={w * 0.32} height={w * 0.32} rx={20} fill="#ffffff" opacity={0.85} transform={`rotate(12 ${w * 0.7} ${h * 0.4})`} />}
          <text x={w * 0.07} y={h * 0.8} fontFamily={ff} fontSize={fit(headline, w * 0.8, h * 0.2, 900)} fontWeight={900} fill={ink} letterSpacing="-0.03em">
            {headline}
          </text>
        </Svg>
        <Mark x={w * 0.12} y={h * 0.17} size={h * 0.16} b={b} pal={pal} color={onColor(bgA) === "#ffffff" ? "#ffffff" : "#111111"} />
      </div>
    );
  };

  const tile = (v: number, x: number, y: number, w: number, h: number) => {
    const g = gen(v);
    const chosen = pick && v === 1;
    return (
      <div key={v} style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: 22, overflow: "hidden", transform: `scale(${expOut(c01(g * 3)) * (chosen ? 1.06 : pick ? 0.94 : 1)})`, boxShadow: chosen ? `0 0 0 8px ${pal.p}` : "0 14px 30px rgba(0,0,0,0.25)", opacity: pick && !chosen ? 0.45 : 1 }}>
        <div style={{ position: "absolute", inset: 0, filter: `blur(${(1 - g) * 26}px) saturate(${0.4 + g * 0.6})` }}>{art(v, w, h, `a${v}`)}</div>
        <svg width={w} height={h} style={{ position: "absolute", inset: 0, opacity: (1 - g) * 0.9 }}>
          <filter id={`big-noise-${v}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed={Math.floor(t * 20) + v} />
          </filter>
          <rect width={w} height={h} filter={`url(#big-noise-${v})`} />
        </svg>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      {/* prompt bar */}
      <div style={{ position: "absolute", left: 360, top: lerp(470, 90, expInOut(seg(t, 1.4, 0.4))), width: 1200, height: 110, borderRadius: 60, background: pal.card, border: `1.5px solid ${pal.line}`, display: "flex", alignItems: "center", padding: "0 40px", fontSize: 40, color: pal.fg, transform: `scale(${barIn})`, opacity: 1 - gridOut }}>
        <span style={{ color: pal.p, marginRight: 20 }}>✦</span>
        {prompt.slice(0, typed)}
        <span style={{ opacity: Math.floor(t * 3) % 2 && typed < prompt.length ? 1 : 0 }}>|</span>
        <div style={{ marginLeft: "auto", padding: "14px 26px", borderRadius: 40, background: pal.p, color: pal.onP, fontSize: 26, fontWeight: 800 }}>Generate</div>
      </div>
      {/* the four results */}
      {t > 1.6 && gridOut < 1 && (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - gridOut, transform: `scale(${1 - gridOut * 0.1})` }}>
          {[0, 1, 2, 3].map((v) => tile(v, 420 + v * 360, 560, 330, 420))}
        </div>
      )}
      {/* placements */}
      {gridOut > 0 && endP < 1 && (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - c01(endP * 3) }}>
          <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - place(0)) * 900}px)` }}>
            <Phone x={330} y={560} h={760} pal={pal}>
              <div style={{ position: "absolute", left: 14, top: 70, fontSize: 18, fontWeight: 700, color: pal.fg }}>{name.toLowerCase()}</div>
              <div style={{ position: "absolute", left: 0, right: 0, top: 104, height: 340 }}>{art(1, 345, 340, "p")}</div>
              <div style={{ position: "absolute", left: 14, top: 460, fontSize: 18, color: pal.muted }}>♥ 2,481 · 💬 96</div>
            </Phone>
          </div>
          <div style={{ position: "absolute", left: 640, top: 200, width: 520, height: 680, borderRadius: 18, background: "#ffffff", overflow: "hidden", transform: `translateY(${(1 - place(1)) * 900}px)`, boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
            <div style={{ height: 60, borderBottom: "1px solid #eee", display: "flex", alignItems: "center", padding: "0 20px", fontSize: 18, color: "#555" }}>Inbox · {name}</div>
            <div style={{ position: "relative", height: 260 }}>{art(1, 520, 260, "e")}</div>
            {[90, 70, 84, 50].map((w, i) => (
              <div key={i} style={{ height: 14, width: `${w}%`, background: "#eee", borderRadius: 7, margin: "18px 24px 0" }} />
            ))}
            <div style={{ margin: "26px 24px", display: "inline-block", padding: "14px 30px", borderRadius: 30, background: pal.p, color: pal.onP, fontWeight: 800, fontSize: 20 }}>Shop now</div>
          </div>
          <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - place(2)) * 900}px)` }}>
            <Browser x={1520} y={540} w={680} h={520} pal={pal} url={`${name.toLowerCase()}.com`}>
              <div style={{ position: "absolute", inset: 0 }}>{art(1, 680, 467, "w")}</div>
            </Browser>
          </div>
        </div>
      )}
      <Svg>
        {endP > 0 && (
          <>
            <Txt text={name} x={960} y={520} size={fit(name, 1300, 190, 900)} weight={900} color={pal.fg} font={ff} p={c01((t - 8.2) / 0.6)} tracking={-0.05} />
            <Txt text={c.tagline || "On-brand images, wherever you need them"} x={960} y={630} size={46} weight={500} color={pal.muted} font={ff} p={c01((t - 8.4) / 0.5)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/brand-image-gen.wav" on={audio} />
    </AbsoluteFill>
  );
}
