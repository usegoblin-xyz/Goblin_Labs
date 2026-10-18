// Shared motion kit for library templates. Every value is a pure function of
// time, so previews, scrubbing and MP4 renders always agree.
import type { CSSProperties, ReactNode } from "react";
import { Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { alpha, FONTS, onColor, type Brand } from "./brand";
import { charX, textWidth } from "./metrics";

export { charX, textWidth };

// ---- time & easing -------------------------------------------------------------
export function useT() {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  return { t: frame / fps, frame, fps, W: width, H: height, dur: durationInFrames / fps };
}
export const c01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const seg = (t: number, a: number, d: number) => c01((t - a) / d);
export const expOut = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * c01(x)));
export const expIn = (x: number) => (x <= 0 ? 0 : Math.pow(2, 10 * (c01(x) - 1)));
export const expInOut = (x: number) => {
  const v = c01(x);
  if (v === 0 || v === 1) return v;
  return v < 0.5 ? Math.pow(2, 20 * v - 10) / 2 : (2 - Math.pow(2, -20 * v + 10)) / 2;
};
export const cubicOut = (x: number) => 1 - Math.pow(1 - c01(x), 3);
export const cubicInOut = (x: number) => {
  const v = c01(x);
  return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
};
export const sineInOut = (x: number) => (1 - Math.cos(Math.PI * c01(x))) / 2;
export const backOut = (x: number, s = 1.7) => {
  const v = c01(x) - 1;
  return 1 + (s + 1) * v * v * v + s * v * v;
};
// Closed-form damped spring 0 → 1 (z < 1 overshoots, z = 1 critically damped).
export function spring(tau: number, w = 22, z = 0.8) {
  if (tau <= 0) return 0;
  if (z >= 1) return 1 - Math.exp(-w * tau) * (1 + w * tau);
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + (z / Math.sqrt(1 - z * z)) * Math.sin(wd * tau));
}
export type Ease = (x: number) => number;
// Keyframes: [[time, value], ...] with an easing per segment.
export function kf(t: number, pts: [number, number][], ease: Ease = expInOut) {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [t0, v0] = pts[i];
    const [t1, v1] = pts[i + 1];
    if (t <= t1) return v0 + (v1 - v0) * ease((t - t0) / (t1 - t0));
  }
  return pts[pts.length - 1][1];
}
// In-hold-out envelope: 0 → 1 over `fin`, hold, 1 → 0 over `fout` ending at b.
export function inout(t: number, a: number, b: number, fin = 0.35, fout = 0.3, ease: Ease = expOut) {
  return Math.min(ease(seg(t, a, fin)), 1 - expIn(seg(t, b - fout, fout)));
}
// Deterministic pseudo-random in [0, 1) from any number of integer seeds.
export function hash(...n: number[]) {
  let h = 2166136261;
  for (const v of n) {
    h ^= Math.floor(v * 1000003) | 0;
    h = Math.imul(h, 16777619);
    h ^= h >>> 13;
  }
  return ((h >>> 0) % 100000) / 100000;
}

// ---- color ---------------------------------------------------------------------
export function rgbOf(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0");
  const n = parseInt(f.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function mix(a: string, b: string, k: number) {
  const A = rgbOf(a);
  const B = rgbOf(b);
  return "#" + A.map((v, i) => Math.round(lerp(v, B[i], k)).toString(16).padStart(2, "0")).join("");
}
export const lum = (hex: string) => {
  const [r, g, b] = rgbOf(hex).map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export { alpha, onColor };

// Everything a template needs from the brand kit, resolved once.
export function palette(b: Brand) {
  const dark = lum(b.background) < 0.5;
  const [r, g, bl] = rgbOf(b.primary);
  const vivid = Math.max(r, g, bl) - Math.min(r, g, bl) < 28 ? b.accent : b.primary;
  return {
    v: vivid, // the brand's most colorful color (primary unless it is neutral)
    onV: onColor(vivid),
    bg: b.background,
    fg: b.foreground,
    p: b.primary,
    a: b.accent,
    onP: onColor(b.primary),
    onA: onColor(b.accent),
    muted: alpha(b.foreground, 0.6),
    faint: alpha(b.foreground, 0.35),
    line: alpha(b.foreground, 0.12),
    card: mix(b.background, b.foreground, dark ? 0.07 : 0.04),
    card2: mix(b.background, b.foreground, dark ? 0.13 : 0.08),
    dark,
  };
}
export type Pal = ReturnType<typeof palette>;

export const fontOf = (b: Brand) => FONTS[b.font].stack;
export const MONO = '"JetBrains Mono", "JetBrains Mono Variable", ui-monospace, monospace';
export const SERIF = '"Instrument Serif", Georgia, serif';
export const initialOf = (b: Brand) => (b.name.trim()[0] ?? "G").toUpperCase();
export const nameOf = (b: Brand) => b.name.trim() || "Goblin";

// ---- primitives ------------------------------------------------------------------
export function Svg({ w = 1920, h = 1080, children, style }: { w?: number; h?: number; children: ReactNode; style?: CSSProperties }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", ...style }}>
      {children}
    </svg>
  );
}

// A stroke drawn on along its length; the visible part runs from `out` to `p`.
export function Paint({ d, color, width, p, out = 0, cap = "round", opacity }: { d: string; color: string; width: number; p: number; out?: number; cap?: "round" | "butt" | "square"; opacity?: number }) {
  if (p - out < 0.004 || out > 0.996) return null;
  return (
    <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap={cap} strokeLinejoin="round" pathLength={1} strokeDasharray={`${p - out} 2`} strokeDashoffset={-out} opacity={opacity} />
  );
}

// Absolutely positioned box centred on (x, y).
export function Box({ x, y, w, h, r = 0, bg, style, children, className }: { x: number; y: number; w: number; h: number; r?: number | string; bg?: string; style?: CSSProperties; children?: ReactNode; className?: string }) {
  return (
    <div className={className} style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: Math.max(0, w), height: Math.max(0, h), borderRadius: r, background: bg, ...style }}>
      {children}
    </div>
  );
}

// Centred text block (HTML), handy for wrapping copy.
export function Label({ x, y, children, size, weight = 600, color, font, w, align = "center", lh = 1.1, ls = "-0.02em", style }: { x: number; y: number; children: ReactNode; size: number; weight?: number; color: string; font: string; w?: number; align?: "left" | "center" | "right"; lh?: number; ls?: string; style?: CSSProperties }) {
  const tx = align === "center" ? "-50%" : align === "right" ? "-100%" : "0";
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(${tx}, -50%)`, width: w, fontFamily: font, fontSize: size, fontWeight: weight, color, lineHeight: lh, letterSpacing: ls, textAlign: align, whiteSpace: w ? "normal" : "nowrap", ...style }}>
      {children}
    </div>
  );
}

type Reveal = "rise" | "fade" | "type" | "scale" | "blur" | "drop";
// Single-line SVG text on a baseline, animated per letter with exact metrics.
// `p` 0 → 1 drives the reveal; `out` 0 → 1 the exit.
export function Txt({
  text, x, y, size, weight = 700, color, font, anchor = "middle", p = 1, out = 0, mode = "rise", stagger = 0.06, tracking = -0.02, opacity = 1, italic,
}: {
  text: string; x: number; y: number; size: number; weight?: number; color: string; font: string; anchor?: "start" | "middle" | "end"; p?: number; out?: number; mode?: Reveal; stagger?: number; tracking?: number; opacity?: number; italic?: boolean;
}) {
  const xs = charX(text, size, weight, tracking, font);
  const total = xs[xs.length - 1];
  const x0 = anchor === "start" ? x : anchor === "end" ? x - total : x - total / 2;
  const n = Math.max(1, text.length);
  const span = 1 + stagger * (n - 1);
  return (
    <g opacity={opacity}>
      {text.split("").map((ch, i) => {
        const local = c01((p * span - i * stagger) / 1);
        const lo = c01((out * span - i * stagger) / 1);
        const e = expOut(local);
        const eo = expIn(lo);
        if (ch === " " || e <= 0.001 || eo >= 0.999) return null;
        let dy = 0;
        let sc = 1;
        let op = 1;
        let blur = 0;
        if (mode === "rise") dy = (1 - e) * size * 0.6 - eo * size * 0.5;
        if (mode === "drop") dy = -(1 - e) * size * 0.6 + eo * size * 0.5;
        if (mode === "fade" || mode === "blur") op = e;
        if (mode === "blur") blur = (1 - e) * 12;
        if (mode === "scale") sc = backOut(local, 2.2);
        if (mode === "type") op = local > 0 ? 1 : 0;
        op *= 1 - eo;
        if (mode === "rise" || mode === "drop") op *= c01(e * 3);
        const cx = x0 + (xs[i] + xs[i + 1]) / 2;
        return (
          <text
            key={i}
            x={x0 + xs[i]}
            y={y}
            fontFamily={font}
            fontSize={size}
            fontStyle={italic ? "italic" : undefined}
            style={{ fontWeight: weight, filter: blur > 0.3 ? `blur(${blur}px)` : undefined }}
            fill={color}
            opacity={op}
            transform={`translate(0 ${dy}) translate(${cx} ${y - size * 0.35}) scale(${sc}) translate(${-cx} ${-(y - size * 0.35)})`}
          >
            {ch}
          </text>
        );
      })}
    </g>
  );
}
export const txtW = (s: string, size: number, weight = 700, tracking = -0.02, font?: string) => textWidth(s, size, weight, tracking, font);
// Font size that fits `s` in `maxW`, capped at `max`.
export const fit = (s: string, maxW: number, max: number, weight = 700, tracking = -0.02, font?: string) => Math.min(max, maxW / Math.max(0.01, textWidth(s, 1, weight, tracking, font)));

// Soundtrack: plays only where audio is allowed (editor and renders).
export function Track({ src, on }: { src: string; on?: boolean }) {
  return on ? <Audio src={staticFile(src)} /> : null;
}

// ---- devices & UI ------------------------------------------------------------------
export function Phone({ x, y, h, pal, children, tilt = 0, s = 1, screen }: { x: number; y: number; h: number; pal: Pal; children?: ReactNode; tilt?: number; s?: number; screen?: string }) {
  const w = h * 0.49;
  const r = h * 0.085;
  const bz = h * 0.018;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: r, background: pal.dark ? "#1b1b1d" : "#0d0d0f", padding: bz, boxSizing: "border-box", transform: `perspective(1600px) rotateY(${tilt}deg) scale(${s})`, boxShadow: `0 ${h * 0.04}px ${h * 0.1}px rgba(0,0,0,${pal.dark ? 0.5 : 0.22})` }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: r - bz, overflow: "hidden", background: screen ?? pal.bg }}>
        {children}
        <div style={{ position: "absolute", left: "50%", top: h * 0.016, width: w * 0.3, height: h * 0.03, borderRadius: 99, background: "#0a0a0a", transform: "translateX(-50%)" }} />
      </div>
    </div>
  );
}

export function Browser({ x, y, w, h, pal, url = "", children, s = 1, style }: { x: number; y: number; w: number; h: number; pal: Pal; url?: string; children?: ReactNode; s?: number; style?: CSSProperties }) {
  const bar = Math.max(30, h * 0.07);
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: 18, overflow: "hidden", background: pal.card, border: `1.5px solid ${pal.line}`, transform: `scale(${s})`, boxShadow: `0 30px 80px rgba(0,0,0,${pal.dark ? 0.45 : 0.14})`, ...style }}>
      <div style={{ height: bar, display: "flex", alignItems: "center", gap: 8, padding: "0 16px", borderBottom: `1.5px solid ${pal.line}`, background: pal.card2 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: bar * 0.32, height: bar * 0.32, borderRadius: 99, background: pal.line }} />
        ))}
        {url && (
          <div style={{ marginLeft: 16, flex: 1, maxWidth: w * 0.5, height: bar * 0.56, borderRadius: 99, background: pal.bg, color: pal.muted, fontSize: bar * 0.32, display: "flex", alignItems: "center", padding: "0 14px", fontFamily: "Inter, sans-serif" }}>{url}</div>
        )}
      </div>
      <div style={{ position: "relative", width: "100%", height: h - bar }}>{children}</div>
    </div>
  );
}

export function Cursor({ x, y, press = 0, color = "#0b0b0c", size = 34 }: { x: number; y: number; press?: number; color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: "absolute", left: x - 3, top: y - 2, transform: `scale(${1 - press * 0.15})`, transformOrigin: "3px 2px", filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.3))" }}>
      <path d="M3 2 L3 19 L8 14.5 L11.5 22 L14.5 20.6 L11 13.4 L18 13.4 Z" fill={color} stroke="#fff" strokeWidth={1.4} strokeLinejoin="round" />
    </svg>
  );
}

// Minimal line icons on a 24 grid.
export const ICONS: Record<string, string> = {
  check: "M5 12.5l4.5 4.5L19 7.5",
  plus: "M12 5v14M5 12h14",
  arrow: "M5 12h14M13 6l6 6-6 6",
  star: "M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z",
  bolt: "M13 2.5L4.5 13.5H11l-1 8 8.5-11H12z",
  heart: "M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0112 7.3a4.3 4.3 0 017.5 2.5C19.5 15.4 12 20 12 20z",
  bell: "M6 16V11a6 6 0 0112 0v5l1.5 2h-15zM10 20.5a2 2 0 004 0",
  search: "M10.5 17a6.5 6.5 0 100-13 6.5 6.5 0 000 13zM15.5 15.5L20 20",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 20.5a7.5 7.5 0 0115 0",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  lock: "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 017 0v3",
  mail: "M3.5 6.5h17v11h-17zM3.5 7l8.5 6.5L20.5 7",
  play: "M8 5.5v13l10.5-6.5z",
  sparkle: "M12 3l1.8 5.7L19.5 10l-5.7 1.8L12 17.5l-1.8-5.7L4.5 10l5.7-1.3z",
  globe: "M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18",
  code: "M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5",
  cloud: "M7 18.5h10.5a4 4 0 00.5-8 6 6 0 00-11.5 1.5A3.3 3.3 0 007 18.5z",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3.5 2",
  doc: "M6.5 3h8l4 4v14h-12zM14.5 3v4h4M9 12h6M9 16h6",
  chat: "M4 5h16v11H9l-5 4z",
  gear: "M12 15a3 3 0 100-6 3 3 0 000 6zM12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1",
  camera: "M3.5 7.5h4l2-2.5h5l2 2.5h4v12h-17zM12 17a3.5 3.5 0 100-7 3.5 3.5 0 000 7z",
  music: "M9 18V5.5l11-2.5v12.5M9 18a3 3 0 11-6 0 3 3 0 016 0zM20 15.5a3 3 0 11-6 0 3 3 0 016 0z",
  cart: "M3 4h3l2.4 11h10.1l2-8H7M10 20a1 1 0 100-2 1 1 0 000 2zM17 20a1 1 0 100-2 1 1 0 000 2z",
  shield: "M12 3l7.5 3v6c0 4.5-3.2 7.8-7.5 9-4.3-1.2-7.5-4.5-7.5-9V6z",
  rocket: "M12 15l-3-3c1.5-5 5-8.5 10.5-9-.5 5.5-4 9-7.5 12zM9 12l-4 1-1.5 3.5L7 15M12 15l-1 4 3.5-1.5L15.5 14M5 19c0-1.5 1-3 2.5-3",
  layers: "M12 3.5l9 4.8-9 4.8-9-4.8zM3 12.5l9 4.8 9-4.8M3 16.5l9 4.8 9-4.8",
  wand: "M4 20L16 8M14 4.5v2M17.5 6.5h2M18 3l-1 1M12 2.5l.5 1.5",
};
export function Icon({ name, x, y, size = 48, color, width = 2, p = 1, fill }: { name: string; x: number; y: number; size?: number; color: string; width?: number; p?: number; fill?: string }) {
  const d = ICONS[name] ?? ICONS.sparkle;
  return (
    <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${size / 24})`}>
      {fill && <path d={d} fill={fill} opacity={c01(p * 2 - 1)} />}
      <path d={d} fill="none" stroke={color} strokeWidth={(width * 24) / size} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${c01(p)} 2`} />
    </g>
  );
}

// Brand mark: rounded square with the initial (or a ring/dot variant).
export function Mark({ x, y, size, b, pal, r = 0.26, s = 1, rot = 0, letter = 1, color }: { x: number; y: number; size: number; b: Brand; pal: Pal; r?: number; s?: number; rot?: number; letter?: number; color?: string }) {
  const bg = color ?? pal.p;
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: size * r, background: bg, transform: `rotate(${rot}deg) scale(${s})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {letter > 0 && <span style={{ fontFamily: fontOf(b), fontWeight: 800, fontSize: size * 0.6, lineHeight: 1, color: onColor(bg), opacity: letter }}>{initialOf(b)}</span>}
    </div>
  );
}

// Count-up formatting for stats: "12.4k", "98%", "$1,240".
export function fmtNum(v: number, decimals = 0) {
  return v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
// Parses "12.5k", "$40", "98%" into prefix/number/suffix for counting.
export function parseStat(s: string | number) {
  const m = String(s).match(/^([^0-9.-]*)(-?[0-9][0-9,]*\.?[0-9]*)(.*)$/);
  if (!m) return { pre: "", n: 0, dec: 0, suf: String(s) };
  const num = m[2].replace(/,/g, "");
  return { pre: m[1], n: parseFloat(num), dec: (num.split(".")[1] ?? "").length, suf: m[3] };
}
export function countStat(s: string | number, p: number) {
  const { pre, n, dec, suf } = parseStat(s);
  return `${pre}${fmtNum(n * p, dec)}${suf}`;
}
