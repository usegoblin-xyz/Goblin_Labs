import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { onColor, type Brand } from "../brand";
import { font, list, type Template, type TemplateProps } from "../kit";

// Fast, light-mode product ad. Ten shots in 14 s on a 120 BPM grid, each one
// made out of the previous: mark → tiles → art panels → pill → word morphs →
// full-frame image with paint → 3D carousel → prompt bar → kinetic headline →
// mosaic → mark → tagline → logo lockup. Every property is a pure function of t.

type C = { words: string; detail: string; prompt: string; line1: string; line2: string; tagline: string; images: string };

const W = 1920;
const H = 1080;
const CX = W / 2;
const CY = H / 2;
const PAPER = "#ffffff";
const INK = "#0b0b0c";
const M = 220; // brand mark size

// ---- motion toolkit ----------------------------------------------------------
const c01 = (x: number) => Math.min(1, Math.max(0, x));
const expOut = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * c01(x)));
const expInOut = (x: number) => {
  const v = c01(x);
  if (v === 0 || v === 1) return v;
  return v < 0.5 ? Math.pow(2, 20 * v - 10) / 2 : (2 - Math.pow(2, -20 * v + 10)) / 2;
};
function spring(tau: number, w = 22, z = 0.8) {
  if (tau <= 0) return 0;
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + (z / Math.sqrt(1 - z * z)) * Math.sin(wd * tau));
}
const seg = (t: number, a: number, d: number) => c01((t - a) / d);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
type Ease = (x: number) => number;
function kf(t: number, pts: [number, number][], ease: Ease = expInOut) {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [t0, v0] = pts[i];
    const [t1, v1] = pts[i + 1];
    if (t <= t1) return v0 + (v1 - v0) * ease((t - t0) / (t1 - t0));
  }
  return pts[pts.length - 1][1];
}
function vel(f: (t: number) => number, t: number) {
  return (f(t) - f(t - 1 / 60)) * 60;
}
const blurFor = (v: number, k = 1 / 700, max = 12) => {
  const b = Math.min(max, Math.abs(v) * k);
  return b > 0.4 ? `blur(${b.toFixed(1)}px)` : undefined;
};
function hex(c: string) {
  const h = c.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function neutral(c: string) {
  const [r, g, b] = hex(c);
  return Math.max(r, g, b) - Math.min(r, g, b) < 28;
}

function Rect({ x, y, w, h, r = 0, bg, style, children }: { x: number; y: number; w: number; h: number; r?: number | string; bg?: string; style?: CSSProperties; children?: ReactNode }) {
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: Math.max(0, w), height: Math.max(0, h), borderRadius: r, background: bg, overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}

// ---- art panels (original editorial compositions, or the visitor's images) ----
type Pal = { p: string; a: string };
function ArtSvg({ v, pal }: { v: number; pal: Pal }) {
  const { p, a } = pal;
  const svg = (children: ReactNode, bg: string) => (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <rect width="100" height="100" fill={bg} />
      {children}
    </svg>
  );
  switch (((v % 8) + 8) % 8) {
    case 0:
      return svg(<><circle cx="50" cy="44" r="24" fill={PAPER} /><rect y="66" width="100" height="34" fill={INK} /><circle cx="76" cy="24" r="6" fill={a} /></>, p);
    case 1:
      return svg(<>{Array.from({ length: 9 }).map((_, i) => <rect key={i} x={-30 + i * 16} y="-10" width="6" height="140" fill={INK} transform="rotate(28 50 50)" />)}<circle cx="64" cy="42" r="22" fill={p} /></>, "#efefed");
    case 2:
      return svg(<>{[38, 30, 22, 14].map((r, i) => <path key={i} d={`M${50 - r},100 A${r},${r} 0 0 1 ${50 + r},100`} fill={i % 2 ? INK : a} />)}<circle cx="50" cy="30" r="7" fill={PAPER} /></>, INK);
    case 3:
      return svg(<>{Array.from({ length: 16 }).map((_, i) => <rect key={i} x={14 + (i % 4) * 19} y={14 + Math.floor(i / 4) * 19} width="12" height="12" rx="2" fill={i === 6 ? p : INK} />)}</>, a);
    case 4:
      return svg(<><path d="M18,70 C10,40 34,14 58,22 C84,30 92,58 74,76 C58,92 26,94 18,70 Z" fill={INK} /><rect x="54" y="18" width="30" height="40" fill={p} /></>, PAPER);
    case 5:
      return svg(<>{Array.from({ length: 7 }).map((_, i) => <path key={i} d={`M-5,${22 + i * 10} Q25,${12 + i * 10} 50,${22 + i * 10} T105,${22 + i * 10}`} stroke={PAPER} strokeWidth="3" fill="none" />)}</>, p);
    case 6:
      return svg(<>{Array.from({ length: 100 }).map((_, i) => { const x = (i % 10) * 10 + 5; const y = Math.floor(i / 10) * 10 + 5; const d = Math.hypot(x - 38, y - 40); return <circle key={i} cx={x} cy={y} r={Math.max(0.6, 4.6 - d / 12)} fill={INK} />; })}<circle cx="72" cy="70" r="14" fill={p} /></>, PAPER);
    default:
      return svg(<><path d="M10,88 L50,14 L90,88 Z" fill={PAPER} /><path d="M30,88 A20,20 0 0 1 70,88 Z" fill={p} /></>, INK);
  }
}
function Art({ v, pal, imgs }: { v: number; pal: Pal; imgs: string[] }) {
  const src = imgs.length ? imgs[((v % imgs.length) + imgs.length) % imgs.length] : "";
  if (src) return <Img src={src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />;
  return <ArtSvg v={v} pal={pal} />;
}

// Hand-painted stroke: a path drawn on with a round brush.
function Paint({ d, color, width, p, out = 0, vb = `0 0 ${W} ${H}` }: { d: string; color: string; width: number; p: number; out?: number; vb?: string }) {
  if (p <= 0 || out >= 1) return null;
  return (
    <svg viewBox={vb} width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p - out} />
    </svg>
  );
}

const estW = (s: string, size: number) => s.length * size * 0.6;

type P = { t: number; b: Brand; c: C; pal: Pal; imgs: string[] };

// ---- A + B: mark → four tiles → art panels → one big, three small (0–2.4) -----
const Q = [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const;

function MarkTiles({ t, b, pal, imgs }: P) {
  const appear = spring(t - 0.02, 20, 0.78);
  const rot = (1 - expOut(t / 0.45)) * -90;
  const split = expInOut(seg(t, 0.5, 0.45));
  const reveal = expOut(seg(t, 0.85, 0.35));
  const paint = expOut(seg(t, 1.2, 0.3));
  const paintOut = expInOut(seg(t, 1.6, 0.3));
  const grow = expInOut(seg(t, 1.5, 0.4));
  const toPill = expInOut(seg(t, 2.0, 0.4));
  const unreveal = expInOut(seg(t, 2.0, 0.25));
  const initial = (b.name.trim()[0] ?? "G").toUpperCase();
  const onP = onColor(pal.p);

  return (
    <>
      {Q.map(([qx, qy], i) => {
        // stage 1: quadrant of the mark → 300px tile on a 2×2 grid
        const size1 = lerp(M / 2, 300, split);
        const x1 = qx * lerp(M / 4, 170, split);
        const y1 = qy * lerp(M / 4, 170, split);
        // stage 2: tile 0 grows big at left; tiles 1–3 shrink into a column at right
        const big = i === 0;
        const col = [-190, 0, 190][i - 1] ?? 0;
        const x2 = lerp(x1, big ? -260 : 440, grow);
        const y2 = lerp(y1, big ? 0 : col, grow);
        const s2 = lerp(size1, big ? 620 : 150, grow);
        // stage 3: big tile becomes the pill; small tiles fly off right
        const fx = (tt: number) => (big ? 0 : lerp(0, 1100, expInOut(seg(tt, 2.0, 0.3))));
        const x = big ? lerp(x2, 0, toPill) : x2 + fx(t);
        const w = big ? lerp(s2, 620, toPill) : s2;
        const h = big ? lerp(s2, 260, toPill) : s2;
        const outer = 56 * (1 - split) + 28 * split;
        const inner = 28 * split;
        const corners = [
          [outer, inner, inner, inner],
          [inner, outer, inner, inner],
          [inner, inner, inner, outer],
          [inner, inner, outer, inner],
        ][i];
        const r = big && toPill > 0 ? `${lerp(28, 130, toPill)}px` : corners.map((v) => `${v}px`).join(" ");
        const sc = i === 0 ? 1 : 1;
        const artR = (big ? reveal * (1 - unreveal) : reveal) * 75;
        return (
          <div key={i} style={{ position: "absolute", left: CX + x - w / 2, top: CY + y2 - h / 2, width: w, height: h, transform: `scale(${appear * sc}) rotate(${rot}deg)`, transformOrigin: `${CX - (CX + x - w / 2)}px ${CY - (CY + y2 - h / 2)}px`, filter: blurFor(vel(fx, t), 1 / 500, 14) }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: r, background: pal.p, overflow: "hidden" }}>
              {/* the initial, split across the four quadrants */}
              {split < 1 && (
                <div style={{ position: "absolute", left: w / 2 - qx * (w / 2) - M / 2 + qx * 0, top: h / 2 - qy * (h / 2) - M / 2, width: M, height: M, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 140, fontWeight: 800, color: onP, transform: `translate(${-qx * (size1 - M / 2) * 0}px, 0) scale(${1 - split * 0.5})`, opacity: 1 - split }}>
                  {initial}
                </div>
              )}
              {artR > 0.5 && (
                <div style={{ position: "absolute", inset: 0, clipPath: `circle(${artR}% at 50% 50%)` }}>
                  <Art v={i} pal={pal} imgs={imgs} />
                </div>
              )}
            </div>
          </div>
        );
      })}
      <Paint d="M 470 600 C 760 470, 1060 700, 1450 500" color={pal.a} width={46} p={paint} out={paintOut} />
    </>
  );
}

// ---- C: pill with a word that morphs on the beat (2.35–3.6) -------------------
function MorphWord({ t, pal, c }: P) {
  const words = list(c.words).slice(0, 3);
  while (words.length < 3) words.push("Create");
  const changes = [2.35, 2.85, 3.35];
  const size = 150;
  const widths = words.map((w) => estW(w, size) + 160);
  const pillW = 620 + (widths[0] - 620) * expInOut(seg(t, 2.35, 0.3)) + (widths[1] - widths[0]) * spring(t - changes[1], 20, 0.85) + (widths[2] - widths[1]) * spring(t - changes[2], 20, 0.85);
  const open = expInOut(seg(t, 3.6, 0.36));
  const fw = lerp(pillW, W, open);
  const fh = lerp(260, H, open);
  const fr = lerp(130, 0, open);
  const zoom = lerp(1.12, 1.0, seg(t, 3.6, 1.4));
  const onP = onColor(pal.p);
  return (
    <Rect x={CX} y={CY} w={fw} h={fh} r={fr} bg={pal.p}>
      {/* full-frame art, revealed through the opening pill */}
      {open > 0 && (
        <div style={{ position: "absolute", left: (fw - W) / 2, top: (fh - H) / 2, width: W, height: H, transform: `scale(${zoom})` }}>
          <ArtFull v={1} pal={pal} t={t} />
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {words.map((w, wi) => {
          const tin = changes[wi];
          const tout = wi < 2 ? changes[wi + 1] : 3.55;
          if (t < tin - 0.05 || t > tout + 0.45) return null;
          return (
            <div key={wi} style={{ position: "absolute", display: "flex", alignItems: "center", height: size * 1.18, overflow: "hidden", fontSize: size, fontWeight: 800, letterSpacing: "-0.04em", color: onP, lineHeight: 1 }}>
              {w.split("").map((ch, i) => {
                const d = i * 0.022;
                const yin = (1 - expOut((t - tin - d) / 0.32)) * 110;
                const yout = -expOut((t - tout - d) / 0.28) * 110;
                return (
                  <span key={i} style={{ display: "inline-block", whiteSpace: "pre", transform: `translateY(${yin + yout}%)` }}>
                    {ch}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    </Rect>
  );
}
// A version of the art panel used full-frame (needs the visitor's images too)
let IMGS: string[] = [];
function ArtFull({ v, pal }: { v: number; pal: Pal; t: number }) {
  return <Art v={v} pal={pal} imgs={IMGS} />;
}

// ---- D: full-frame image with paint on top, then shrinks into a card (3.6–5.0) -
const CARD_W = 360;
const CARD_H = 480;
function Painted({ t, pal, c }: P) {
  const zoom = lerp(1.12, 1.0, seg(t, 3.6, 1.4));
  const circle = expOut(seg(t, 3.95, 0.35));
  const label = expOut(seg(t, 4.2, 0.3));
  const under = expOut(seg(t, 4.4, 0.22));
  const arrow = expOut(seg(t, 4.5, 0.25));
  const shrink = expInOut(seg(t, 4.7, 0.3));
  const off = expInOut(seg(t, 4.62, 0.16)); // paint draws off just before the card shrinks
  const w = lerp(W, CARD_W, shrink);
  const h = lerp(H, CARD_H, shrink);
  return (
    <>
      <Rect x={CX} y={CY} w={w} h={h} r={24 * shrink} bg={pal.p}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})` }}>
          <ArtFull v={1} pal={pal} t={t} />
        </div>
      </Rect>
      <Paint d="M 1420 300 C 1600 300, 1640 520, 1460 590 C 1290 650, 1060 560, 1080 420 C 1100 290, 1300 250, 1470 330" color={pal.p === INK ? pal.a : INK} width={16} p={circle} out={off} />
      <div style={{ position: "absolute", left: 150, top: 690, padding: "18px 34px 24px", background: PAPER, clipPath: `inset(0 ${(1 - label + off) * 100}% 0 0)` }}>
        <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: "-0.045em", color: INK, lineHeight: 1, whiteSpace: "nowrap" }}>{c.detail}</div>
      </div>
      <Paint d="M 180 900 C 420 880, 640 912, 880 886" color={pal.a} width={22} p={under} out={off} />
      <Paint d="M 930 760 C 1030 640, 1080 590, 1150 560 M 1150 560 L 1100 560 M 1150 560 L 1140 610" color={INK} width={12} p={arrow} out={off} />
    </>
  );
}

// ---- E: 3D carousel of five cards, spins on the beat, then the front flips (5–6.6)
function Carousel({ t, pal, imgs }: P) {
  const R = 560 * expInOut(seg(t, 5.0, 0.38));
  const spin = -72 * spring(t - 5.5, 18, 0.86) - 72 * spring(t - 6.0, 18, 0.86);
  const flipT = seg(t, 6.3, 0.32);
  const fold = expInOut(flipT);
  const arts = [1, 2, 3, 4, 5];
  return (
    <AbsoluteFill style={{ perspective: 1900 }}>
      <div style={{ position: "absolute", left: CX, top: CY, width: 0, height: 0, transformStyle: "preserve-3d", transform: `translateZ(${-R}px) rotateY(${spin}deg)` }}>
        {arts.map((v, k) => {
          const ang = k * 72;
          const isFront = k === 2;
          if (isFront && fold > 0) return null;
          const others = k !== 0 ? expOut(seg(t, 5.0, 0.4)) : 1;
          const away = fold > 0 ? 1 - fold : 1;
          return (
            <div
              key={k}
              style={{
                position: "absolute",
                left: -CARD_W / 2,
                top: -CARD_H / 2,
                width: CARD_W,
                height: CARD_H,
                borderRadius: 24,
                overflow: "hidden",
                background: pal.p,
                transform: `rotateY(${ang}deg) translateZ(${R}px) scale(${others * away})`,
                boxShadow: "0 30px 60px rgba(0,0,0,0.12)",
              }}
            >
              <Art v={v} pal={pal} imgs={imgs} />
            </div>
          );
        })}
      </div>
      {fold > 0 && <FlipCard t={t} pal={pal} imgs={imgs} />}
    </AbsoluteFill>
  );
}

// Front card flips over and its back becomes the prompt bar.
const BAR_W = 1100;
const BAR_H = 140;
function FlipCard({ t, pal, imgs }: { t: number; pal: Pal; imgs: string[] }) {
  const f = expInOut(seg(t, 6.3, 0.34));
  const w = lerp(CARD_W, BAR_W, f);
  const h = lerp(CARD_H, BAR_H, f);
  const r = lerp(24, 70, f);
  const rot = f * 180;
  return (
    <div style={{ position: "absolute", left: CX - w / 2, top: CY - h / 2, width: w, height: h, transformStyle: "preserve-3d", transform: `rotateY(${rot}deg)` }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: r, overflow: "hidden", backfaceVisibility: "hidden", background: pal.p }}>
        <Art v={3} pal={pal} imgs={imgs} />
      </div>
      <div style={{ position: "absolute", inset: 0, borderRadius: r, backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: PAPER, boxShadow: "0 0 0 2px #e7e7e5, 0 24px 60px rgba(0,0,0,0.10)" }} />
    </div>
  );
}

// ---- F: prompt bar types, sends, results slide out; camera pans up (6.6–8.15) --
function Prompt({ t, pal, c, imgs }: P) {
  const text = c.prompt;
  const n = Math.round(c01((t - 6.72) / 0.6) * text.length);
  const caret = Math.floor(t / 0.25) % 2 === 0;
  const press = t >= 7.42 && t <= 7.54 ? 0.9 : 1;
  const sendIn = spring(t - 6.62, 20, 0.8);
  const pan = (tt: number) => -H * expInOut(seg(tt, 7.85, 0.32));
  const onP = onColor(pal.p);
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateY(${pan(t)}px)`, filter: blurFor(vel(pan, t), 1 / 600, 16) }}>
      <Rect x={CX} y={CY} w={BAR_W} h={BAR_H} r={70} bg={PAPER} style={{ boxShadow: "0 0 0 2px #e7e7e5, 0 24px 60px rgba(0,0,0,0.10)", overflow: "visible" }}>
        <div style={{ position: "absolute", left: 60, top: 0, bottom: 0, display: "flex", alignItems: "center", fontSize: 50, fontWeight: 500, color: INK, whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>
          {text.slice(0, n)}
          <span style={{ width: 4, height: 56, marginLeft: 4, background: caret || n < text.length ? INK : "transparent" }} />
        </div>
        <div style={{ position: "absolute", right: 24, top: 24, width: 92, height: 92, borderRadius: 99, background: pal.p, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${sendIn * press})` }}>
          <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke={onP} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </div>
      </Rect>
      {[0, 1, 2].map((i) => {
        const p = spring(t - 7.58 - i * 0.07, 20, 0.82);
        const x = CX + (i - 1) * 360;
        const y = lerp(CY, CY + 270, p);
        return (
          <Rect key={i} x={x} y={y} w={320 * p} h={210 * p} r={20} bg={pal.p}>
            <Art v={4 + i} pal={pal} imgs={imgs} />
          </Rect>
        );
      })}
    </div>
  );
}

// ---- G: kinetic headline with a painted highlight (8.0–9.6) --------------------
function Headline({ t, pal, c }: P) {
  const pan = H * (1 - expInOut(seg(t, 7.85, 0.32)));
  const size = 200;
  const l1 = c.line1.split(/\s+/).filter(Boolean);
  const l2 = c.line2.split(/\s+/).filter(Boolean);
  const hl = expOut(seg(t, 8.6, 0.28));
  const pop = 1 + 0.07 * Math.sin(Math.PI * c01((t - 9.0) / 0.3));
  const drift = expInOut(seg(t, 9.0, 0.35));
  const squash = expInOut(seg(t, 9.3, 0.3));
  const lastW = estW(l2[l2.length - 1] ?? "", size);
  const line = (words: string[], y: number, t0: number, dx: number, last: boolean) => (
    <div style={{ position: "absolute", left: 0, right: 0, top: y - size * 0.62, height: size * 1.24, display: "flex", justifyContent: "center", alignItems: "center", gap: size * 0.28, transform: `translateX(${dx}px) scaleY(${1 - squash})` }}>
      {words.map((w, i) => {
        const p = expOut((t - t0 - i * 0.1) / 0.32);
        const isLast = last && i === words.length - 1;
        return (
          <span key={i} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            {isLast && (
              <svg viewBox={`0 0 ${lastW + 80} ${size}`} width={lastW + 80} height={size} style={{ position: "absolute", left: -12, top: size * 0.12, overflow: "visible" }}>
                <path d={`M 40 ${size * 0.62} C ${lastW * 0.3} ${size * 0.5}, ${lastW * 0.7} ${size * 0.74}, ${lastW + 70} ${size * 0.58}`} stroke={pal.a} strokeWidth={size * 0.5} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - hl} />
              </svg>
            )}
            <span style={{ position: "relative", display: "inline-flex", overflow: "hidden", height: size * 1.16, alignItems: "center" }}>
              <span style={{ display: "inline-block", fontSize: size, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1, whiteSpace: "nowrap", color: isLast ? pal.p : INK, transform: `translateY(${(1 - p) * 110}%) scale(${isLast ? pop : 1})` }}>
                {w}
              </span>
            </span>
          </span>
        );
      })}
    </div>
  );
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateY(${pan}px)` }}>
      {line(l1, CY - 120, 8.02, -60 * drift, false)}
      {line(l2, CY + 120, 8.3, 60 * drift, true)}
      {squash > 0 && <Rect x={CX} y={CY} w={lerp(300, 1100, squash)} h={24 * squash} r={12} bg={INK} />}
    </div>
  );
}

// ---- H: bar breaks into nine tiles → mosaic → 3D flips → tightens into the mark
function cell(k: number) {
  return { x: ((k % 3) - 1) * 256, y: (Math.floor(k / 3) - 1) * 256 };
}
function Mosaic({ t, pal, imgs }: P) {
  const shrink = expInOut(seg(t, 11.0, 0.4));
  const scale = lerp(1, M / (3 * 240), shrink);
  const gap = lerp(16, 0, shrink);
  return (
    <div style={{ position: "absolute", left: CX, top: CY, width: 0, height: 0, perspective: 1600 }}>
      {shrink > 0.97 && <div style={{ position: "absolute", left: -M / 2, top: -M / 2, width: M, height: M, borderRadius: 56, background: pal.p, transform: "translateZ(-1px)" }} />}
      {Array.from({ length: 9 }).map((_, k) => {
        const land = expInOut(seg(t, 9.6 + k * 0.04, 0.4));
        const g = cell(k);
        const segX = (k - 4) * (1100 / 9);
        const fx = (tt: number) => lerp(segX, g.x, expInOut(seg(tt, 9.6 + k * 0.04, 0.4)));
        const x0 = fx(t);
        const y0 = lerp(0, g.y, land);
        const w0 = lerp(1100 / 9 - 4, 240, land);
        const h0 = lerp(24, 240, land);
        const pitch = 240 + gap;
        const xs = lerp(x0, ((k % 3) - 1) * pitch, shrink) * scale;
        const ys = lerp(y0, (Math.floor(k / 3) - 1) * pitch, shrink) * scale;
        const ws = w0 * scale;
        const hs = h0 * scale;
        const reveal = expOut(seg(t, 9.85 + k * 0.03, 0.3));
        const flip = expInOut(seg(t, 10.5 + ((k % 3) + Math.floor(k / 3)) * 0.06, 0.34)) * 180;
        const fill = expInOut(seg(t, 10.95 + k * 0.02, 0.25));
        const outerR = 56 * shrink;
        const corner = (kx: number, ky: number) => (kx === (k % 3) && ky === Math.floor(k / 3) ? outerR : 0);
        const radius = shrink > 0 ? `${Math.max(14 * (1 - shrink), corner(0, 0))}px ${Math.max(14 * (1 - shrink), corner(2, 0))}px ${Math.max(14 * (1 - shrink), corner(2, 2))}px ${Math.max(14 * (1 - shrink), corner(0, 2))}px` : `${lerp(12, 14, land)}px`;
        const face = (v: number, back: boolean): CSSProperties => ({
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          overflow: "hidden",
          backfaceVisibility: "hidden",
          transform: back ? "rotateY(180deg)" : undefined,
          background: INK,
        });
        return (
          <div key={k} style={{ position: "absolute", left: xs - ws / 2, top: ys - hs / 2, width: ws, height: hs, transformStyle: "preserve-3d", transform: `rotateY(${flip}deg)`, filter: blurFor(vel(fx, t), 1 / 500, 12) }}>
            <div style={face(k, false)}>
              {reveal > 0 && <div style={{ position: "absolute", inset: 0, clipPath: `circle(${reveal * 75}% at 50% 50%)` }}><Art v={k} pal={pal} imgs={imgs} /></div>}
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${fill * 100}%`, background: pal.p }} />
            </div>
            <div style={face(k + 3, true)}>
              <Art v={k + 3} pal={pal} imgs={imgs} />
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${fill * 100}%`, background: pal.p }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- I + J: mark slides left, tagline + swoosh, then the logo lockup (11.4–14) --
function Finale({ t, b, pal, c }: P) {
  const initial = (b.name.trim()[0] ?? "G").toUpperCase();
  const onP = onColor(pal.p);
  const left = expInOut(seg(t, 11.45, 0.32));
  const letter = spring(t - 11.5, 20, 0.8);
  const words = c.tagline.split(/\s+/).filter(Boolean);
  const swoosh = expOut(seg(t, 12.1, 0.26));
  const tagOut = expInOut(seg(t, 12.8, 0.22));
  const lock = expInOut(seg(t, 12.9, 0.36));
  const nameIn = expOut(seg(t, 13.0, 0.36));
  const nameSize = 150;
  const nameW = estW(b.name, nameSize);
  const lockGap = 48;
  const lockX = CX - (M + lockGap + nameW) / 2 + M / 2;
  const markX = lerp(lerp(CX, CX - 470, left), lockX, lock);
  const tagSize = 96;
  const lastW = estW(words[words.length - 1] ?? "", tagSize);
  return (
    <>
      <Rect x={markX} y={CY} w={M} h={M} r={56} bg={pal.p}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 140, fontWeight: 800, color: onP, transform: `scale(${letter})` }}>{initial}</div>
      </Rect>
      {tagOut < 1 && (
        <div style={{ position: "absolute", left: CX - 300, top: CY - 70, display: "flex", gap: 26, clipPath: `inset(0 ${tagOut * 100}% 0 0)` }}>
          {words.map((w, i) => {
            const p = expOut((t - 11.6 - i * 0.07) / 0.3);
            const isLast = i === words.length - 1;
            return (
              <span key={i} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                <span style={{ display: "inline-flex", overflow: "hidden", height: 120, alignItems: "center" }}>
                  <span style={{ display: "inline-block", fontSize: tagSize, fontWeight: 800, letterSpacing: "-0.04em", color: INK, whiteSpace: "nowrap", transform: `translateY(${(1 - p) * 110}%)` }}>{w}</span>
                </span>
                {isLast && (
                  <svg width={lastW + 40} height={40} viewBox={`0 0 ${lastW + 40} 40`} style={{ position: "absolute", left: -10, bottom: -18, overflow: "visible" }}>
                    <path d={`M 6 26 C ${lastW * 0.35} 10, ${lastW * 0.7} 36, ${lastW + 30} 14`} stroke={pal.a} strokeWidth={16} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - swoosh} />
                  </svg>
                )}
              </span>
            );
          })}
        </div>
      )}
      {nameIn > 0 && (
        <div style={{ position: "absolute", left: lockX + M / 2 + lockGap, top: CY - nameSize * 0.6, height: nameSize * 1.2, display: "flex", alignItems: "center", fontSize: nameSize, fontWeight: 800, letterSpacing: "-0.045em", color: INK, whiteSpace: "nowrap", clipPath: `inset(0 ${(1 - nameIn) * 100}% 0 0)`, transform: `translateX(${(1 - nameIn) * -40}px)` }}>
          {b.name}
        </div>
      )}
    </>
  );
}

function ProductAd({ brand, content, audio }: TemplateProps<C>) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const pal: Pal = { p: neutral(brand.primary) ? brand.accent : brand.primary, a: neutral(brand.primary) ? brand.primary : brand.accent };
  const imgs = list(content.images).filter((u) => /^https?:\/\//.test(u));
  IMGS = imgs;
  const p: P = { t, b: brand, c: content, pal, imgs };
  const scene =
    t < 2.35 ? <MarkTiles {...p} /> :
    t < 3.6 ? <MorphWord {...p} /> :
    t < 5.0 ? (t < 3.96 ? <MorphWord {...p} /> : <Painted {...p} />) :
    t < 6.64 ? <Carousel {...p} /> :
    t < 8.2 ? (
      <>
        <Prompt {...p} />
        {t >= 7.85 && <Headline {...p} />}
      </>
    ) :
    t < 9.6 ? <Headline {...p} /> :
    t < 11.45 ? <Mosaic {...p} /> :
    <Finale {...p} />;
  return (
    <AbsoluteFill style={{ background: PAPER, color: INK, fontFamily: font(brand), fontSynthesis: "none", overflow: "hidden" }}>
      {scene}
      {audio && <Audio src={staticFile("product-ad/product-ad-120bpm.wav")} />}
    </AbsoluteFill>
  );
}

export const productAd: Template<C> = {
  id: "product-ad",
  title: "Fast Product Ad",
  outcome: "A fast, light-mode 14-second ad that ends on your logo",
  category: "Launch",
  tags: ["ad", "promo", "commercial", "fast cuts", "morph", "3d", "paint", "logo", "music"],
  width: W,
  height: H,
  fps: 60,
  durationInFrames: 840,
  component: ProductAd,
  soundtrack: "product-ad/product-ad-120bpm.wav",
  defaults: {
    words: "Think, Write, Build",
    detail: "Every detail.",
    prompt: "Make it bold. Make it fast.",
    line1: "From idea",
    line2: "to impact",
    tagline: "Your best work, faster.",
    images: "",
  },
  fields: [
    { key: "words", label: "Three morphing words", type: "text", hint: "Comma separated" },
    { key: "detail", label: "Painted caption", type: "text" },
    { key: "prompt", label: "Prompt text", type: "text" },
    { key: "line1", label: "Headline line 1", type: "text" },
    { key: "line2", label: "Headline line 2", type: "text", hint: "Last word gets the painted highlight" },
    { key: "tagline", label: "Tagline", type: "text" },
    { key: "images", label: "Image URLs (optional)", type: "textarea", hint: "Comma separated links; replaces the built-in art panels" },
  ],
};
