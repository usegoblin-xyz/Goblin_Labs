import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { type Brand } from "../brand";
import { font, list, type Template, type TemplateProps } from "../kit";

// "Type becomes a city." A stroke becomes the initial, the initial floods into
// strips, strips reveal words, words fall into bars, bars rise into an
// isometric skyline, the skyline becomes a bar chart, the chart becomes a
// barcode, the barcode a slit, the slit the brand name, and the name closes
// back into the stroke. 15 s at 120 BPM; every property is a pure function of t.

type C = { words: string; tagline: string };

const W = 1920;
const H = 1080;
const CX = W / 2;
const CY = H / 2;

// ---- time helpers -------------------------------------------------------------
const c01 = (x: number) => Math.min(1, Math.max(0, x));
const expOut = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * c01(x)));
const expInOut = (x: number) => {
  const v = c01(x);
  if (v === 0 || v === 1) return v;
  return v < 0.5 ? Math.pow(2, 20 * v - 10) / 2 : (2 - Math.pow(2, -20 * v + 10)) / 2;
};
type Ease = (x: number) => number;
function kf(t: number, pts: [number, number][], ease: Ease = expOut) {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [t0, v0] = pts[i];
    const [t1, v1] = pts[i + 1];
    if (t <= t1) return v0 + (v1 - v0) * ease((t - t0) / (t1 - t0));
  }
  return pts[pts.length - 1][1];
}
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
// Directional blur on fast moves: horizontal speed → a horizontal smear
// (approximated with an SVG-free CSS blur scaled along the move axis).
function smear(vx: number, vy: number, k = 1 / 600, max = 14) {
  const sx = Math.min(max, Math.abs(vx) * k);
  const sy = Math.min(max, Math.abs(vy) * k);
  const s = Math.max(sx, sy);
  return s > 0.4 ? `blur(${s.toFixed(1)}px)` : undefined;
}
function vel(f: (t: number) => number, t: number) {
  return (f(t) - f(t - 1 / 60)) * 60;
}
function mix(a: string, b: string, p: number) {
  const pa = a.replace("#", "");
  const pb = b.replace("#", "");
  const ca = [0, 2, 4].map((i) => parseInt(pa.slice(i, i + 2), 16));
  const cb = [0, 2, 4].map((i) => parseInt(pb.slice(i, i + 2), 16));
  const q = c01(p);
  return "#" + ca.map((v, i) => Math.round(v + (cb[i] - v) * q).toString(16).padStart(2, "0")).join("");
}

function Box({ cx, cy, w, h, color, r = 0, rot = 0, filter, style, children }: {
  cx: number; cy: number; w: number; h: number; color: string; r?: number; rot?: number; filter?: string; style?: CSSProperties; children?: ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: cx - w / 2,
        top: cy - h / 2,
        width: Math.max(0, w),
        height: Math.max(0, h),
        background: color,
        borderRadius: r,
        transform: rot ? `rotate(${rot}deg)` : undefined,
        filter,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

type P = { t: number; b: Brand; c: C };
const TYPE: CSSProperties = { fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1, textTransform: "uppercase", whiteSpace: "nowrap" };

// ---- 1. Hook (0–2): stroke → initial → flood → four strips --------------------
const ROWS = [-330, -110, 110, 330];
const STRIP_H = 200;

function Hook({ t, b }: P) {
  const stemH = kf(t, [[0, 320], [0.05, 320], [0.4, 1080]]);
  const stemW = kf(t, [[0.5, 40], [0.8, 0]]);
  const reveal = kf(t, [[0.5, 0], [0.85, 1]]);
  const flood = kf(t, [[1.0, 0], [1.4, 1]]);
  const split = kf(t, [[1.5, 0], [1.9, 1]]);
  const letterScale = 1 - kf(t, [[1.5, 0], [1.78, 1]]);
  const initial = (b.name.trim()[0] ?? "G").toUpperCase();
  const stripColors = [b.primary, b.accent, b.foreground, b.primary];
  const fh = (x: number) => kf(x, [[0, 320], [0.05, 320], [0.4, 1080]]);

  const letter = (color: string, clip?: string) => (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", clipPath: clip }}>
      <div
        style={{
          ...TYPE,
          fontSize: 900,
          color,
          clipPath: `inset(0 ${(1 - reveal) * 50}% 0 ${(1 - reveal) * 50}%)`,
          transform: `scale(${letterScale})`,
        }}
      >
        {initial}
      </div>
    </div>
  );

  return (
    <>
      {/* flood rises from the bottom; inside it the letter inverts */}
      {split <= 0 && flood > 0 && <Box cx={CX} cy={H - (H * flood) / 2} w={W} h={H * flood} color={b.primary} />}
      {split > 0 &&
        ROWS.map((y, i) => {
          const hh = lerp(270, STRIP_H, split);
          const cy = lerp(CY + (i - 1.5) * 270, CY + y, split);
          return <Box key={i} cx={CX} cy={cy} w={W} h={hh} color={mix(b.primary, stripColors[i], split)} />;
        })}
      {reveal > 0 && letterScale > 0.01 && (
        <>
          {letter(b.primary, `inset(0 0 ${flood * 100}% 0)`)}
          {letter(b.background, `inset(${(1 - flood) * 100}% 0 0 0)`)}
        </>
      )}
      {stemW > 0.5 && <Box cx={CX} cy={CY} w={stemW} h={stemH} color={b.primary} filter={smear(0, vel(fh, t))} />}
    </>
  );
}

// ---- 2. Kinetic type (2–4): strips wipe off as words slide in -----------------
const FS = 190;
const estW = (s: string) => Math.max(260, s.length * FS * 0.66);

function wordsOf(b: Brand, c: C) {
  const w = [b.name, ...list(c.words).slice(0, 3)];
  while (w.length < 4) w.push(b.name);
  return w;
}

function Kinetic({ t, b, c }: P) {
  const words = wordsOf(b, c);
  const stripColors = [b.primary, b.accent, b.foreground, b.primary];
  const solid = kf(t, [[3.72, 0], [3.95, 1]]);
  return (
    <>
      {words.map((w, i) => {
        const t0 = 2.0 + i * 0.5;
        const dir = i % 2 === 0 ? 1 : -1;
        const wipe = expOut((t - t0) / 0.35);
        const fx = (x: number) => dir * (1 - expOut((x - t0) / 0.38)) * W * 0.7;
        const color = i === 3 ? b.primary : b.foreground;
        const bw = estW(w) + 60;
        return (
          <div key={i} style={{ position: "absolute", left: 0, top: CY + ROWS[i] - STRIP_H / 2, width: W, height: STRIP_H, overflow: "hidden" }}>
            {t >= t0 && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  ...TYPE,
                  fontSize: FS,
                  color,
                  transform: `translateX(${fx(t)}px)`,
                  filter: smear(vel(fx, t), 0),
                }}
              >
                {w}
              </div>
            )}
            {/* strip wipes away toward the side the word comes from */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: stripColors[i],
                transform: `scaleX(${1 - wipe})`,
                transformOrigin: dir > 0 ? "left center" : "right center",
              }}
            />
            {/* type becomes shape: each word fills into a solid block */}
            {solid > 0 && (
              <div style={{ position: "absolute", left: (W - bw) / 2, width: bw, bottom: (STRIP_H - 150) / 2, height: 150 * solid, background: color }} />
            )}
          </div>
        );
      })}
    </>
  );
}

// ---- 3. Shape morph (4–6): blocks → bars → 8 bars → pills → tile grid ---------
const H8 = [0.45, 0.7, 0.55, 0.9, 0.62, 1, 0.5, 0.8];
const BASE = CY + 400;
const tileXY = (k: number) => ({ x: CX + ((k % 4) - 1.5) * 240, y: CY + (Math.floor(k / 4) - 0.5) * 240 });

function Morph({ t, b, c }: P) {
  const words = wordsOf(b, c);
  const rot = kf(t, [[4.0, 0], [4.4, 1]]);
  const split = kf(t, [[4.5, 0], [4.85, 1]]);
  const round = kf(t, [[5.0, 0], [5.35, 1]]);
  const flat = kf(t, [[5.5, 0], [5.9, 1]]);
  const palette = [b.primary, b.accent, b.foreground];
  const rowColor = (i: number) => (i === 3 ? b.primary : b.foreground);

  return (
    <>
      {Array.from({ length: 8 }).map((_, k) => {
        const parent = Math.floor(k / 2);
        const half = k % 2;
        const blockW = estW(words[parent]) + 60;
        const tall = Math.min(760, blockW * 0.7);
        // stage 1: block (blockW × 150) rotating upright into a bar (150 × tall)
        const barX = CX + (parent - 1.5) * 300;
        const x1 = lerp(CX, barX, rot);
        const y1 = lerp(CY + ROWS[parent], BASE - tall / 2, rot);
        const w1 = lerp(blockW, 150, rot);
        const h1 = lerp(150, tall, rot);
        // stage 2: each bar splits into two and spreads to 8 slots
        const slotX = CX + (k - 3.5) * 190;
        const hk = H8[k] * 680;
        const x2 = lerp(x1 + (half ? 1 : -1) * (w1 / 4), slotX, split);
        const w2 = lerp(w1 / 2, 76, split);
        const h2 = lerp(h1, hk, split);
        const y2 = lerp(y1, BASE - hk / 2, split);
        // stage 3: pills; stage 4: flatten into a 4×2 tile grid
        const g = tileXY(k);
        const x = lerp(x2, g.x, flat);
        const y = lerp(y2, g.y, flat);
        const w = lerp(w2, 200, flat);
        const h = lerp(h2, 200, flat);
        const r = lerp(38 * round, 16, flat);
        const color = round > 0 ? mix(rowColor(parent), palette[k % 3], round) : rowColor(parent);
        const fx = (tt: number) => lerp(CX, barX, kf(tt, [[4.0, 0], [4.4, 1]]));
        return <Box key={k} cx={x} cy={y} w={w} h={h} r={r} color={color} filter={rot < 1 ? smear(vel(fx, t), 0) : undefined} />;
      })}
    </>
  );
}

// ---- 4 & 5. 2D → 3D city → front-view bar chart (6–10) ------------------------
const H2 = [0.42, 0.66, 0.5, 0.86, 0.6, 1, 0.48, 0.76]; // tower heights (× 520)
const ROW_X = (k: number) => (k - 3.5) * 230;
const S3 = 0.82; // group scale so 8 towers fit the frame

function cityState(t: number) {
  const tilt = kf(t, [[6.0, 0], [6.4, 58], [7.5, 58], [7.9, 74], [8.0, 74], [8.4, 90]]);
  const orbit = kf(t, [[6.0, 0], [6.4, 35], [7.0, 35], [7.4, 55], [7.5, 55], [7.9, 0]]);
  const extrude = (k: number) => expOut((t - 6.5 - (k % 4) * 0.05 - Math.floor(k / 4) * 0.08) / 0.35);
  const toRow = kf(t, [[7.5, 0], [7.9, 1]]);
  // camera pulls back and down as the towers rise, landing on the chart framing
  const drop = kf(t, [[6.0, 0], [6.9, 150], [8.0, 150], [8.4, 330]]);
  const zoom = kf(t, [[6.0, 1], [6.9, 0.78], [7.5, 0.78], [7.9, S3]]);
  return { tilt, orbit, extrude, toRow, drop, zoom };
}

function City({ t, b }: P) {
  const { tilt, orbit, extrude, toRow, drop, zoom } = cityState(t);
  const palette = [b.primary, b.accent, b.foreground];
  return (
    <AbsoluteFill style={{ perspective: 20000 }}>
      <div
        style={{
          position: "absolute",
          left: CX,
          top: CY + drop,
          width: 0,
          height: 0,
          transformStyle: "preserve-3d",
          transform: `scale(${zoom}) rotateX(${tilt}deg) rotateZ(${-orbit}deg)`,
        }}
      >
        {Array.from({ length: 8 }).map((_, k) => {
          const g = tileXY(k);
          const x = lerp(g.x - CX, ROW_X(k), toRow);
          const y = lerp(g.y - CY, 0, toRow);
          const hgt = H2[k] * 520 * extrude(k);
          const s = 200;
          const base = palette[k % 3];
          const faces: { tf: string; w: number; h: number; c: string }[] = [
            { tf: `translateZ(${hgt}px)`, w: s, h: s, c: base },
            // walls: rotate into place about their own center, lift by half the height, push to the edge
            { tf: `translateY(${s / 2}px) translateZ(${hgt / 2}px) rotateX(-90deg)`, w: s, h: hgt, c: mix(base, "#000000", 0.18) },
            { tf: `translateY(${-s / 2}px) translateZ(${hgt / 2}px) rotateX(90deg)`, w: s, h: hgt, c: mix(base, "#000000", 0.32) },
            { tf: `translateX(${s / 2}px) translateZ(${hgt / 2}px) rotateY(90deg)`, w: hgt, h: s, c: mix(base, "#000000", 0.25) },
            { tf: `translateX(${-s / 2}px) translateZ(${hgt / 2}px) rotateY(-90deg)`, w: hgt, h: s, c: mix(base, "#000000", 0.4) },
          ];
          return (
            <div key={k} style={{ position: "absolute", left: x, top: y, width: 0, height: 0, transformStyle: "preserve-3d" }}>
              {faces.map((f, i) =>
                f.w > 0.5 && f.h > 0.5 ? (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: -f.w / 2,
                      top: -f.h / 2,
                      width: f.w,
                      height: f.h,
                      background: f.c,
                      borderRadius: i === 0 ? 16 * (1 - toRow) : 0,
                      transform: f.tf,
                    }}
                  />
                ) : null,
              )}
              {hgt < 1 && <div style={{ position: "absolute", left: -s / 2, top: -s / 2, width: s, height: s, borderRadius: 16, background: base }} />}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// Flat chart with the exact geometry of the front view, so the swap is invisible.
function chartBars() {
  return Array.from({ length: 8 }).map((_, k) => {
    const x = CX + ROW_X(k) * S3;
    const w = 200 * S3;
    const h = H2[k] * 520 * S3;
    return { x, w, h, base: CY + 330 };
  });
}

function Chart({ t, b }: P) {
  const bars = chartBars();
  const palette = [b.primary, b.accent, b.foreground];
  const count = kf(t, [[8.5, 0], [8.95, 1]]);
  const line = kf(t, [[9.0, 0], [9.42, 1]]);
  const focus = kf(t, [[9.5, 0], [9.85, 1]]);
  const thin = kf(t, [[10.0, 0], [10.4, 1]]);
  const maxK = H2.indexOf(Math.max(...H2));
  const pts = bars.map((r) => `${r.x},${r.base - r.h - 40}`).join(" ");
  return (
    <>
      {bars.map((r, k) => {
        const base = palette[k % 3];
        const dim = k === maxK ? 0 : focus * 0.65;
        const settle = kf(t, [[8.4, 0], [8.7, 1]]);
        const face = mix(mix(base, "#000000", 0.18), base, settle);
        const color = k === maxK ? mix(face, b.primary, focus) : mix(face, b.background, dim);
        const w = lerp(r.w, 12, thin);
        const h = lerp(r.h, H, thin);
        const cy = lerp(r.base - r.h / 2, CY, thin);
        return <Box key={k} cx={r.x} cy={cy} w={w} h={h} color={thin > 0 ? mix(color, b.primary, thin) : color} />;
      })}
      {thin < 1 && (
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 ${thin * 100}% 0)` }}>
          {bars.map((r, k) => (
            <div
              key={k}
              style={{
                position: "absolute",
                left: r.x - 80,
                width: 160,
                top: r.base - r.h - 64,
                textAlign: "center",
                fontSize: k === maxK ? 44 + 10 * focus : 40,
                fontWeight: 800,
                color: b.foreground,
                fontVariantNumeric: "tabular-nums",
                clipPath: `inset(${(1 - count) * 100}% 0 0 0)`,
              }}
            >
              {Math.round(H2[k] * 100 * count)}
            </div>
          ))}
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            <polyline points={pts} fill="none" stroke={b.accent} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - line} />
          </svg>
        </div>
      )}
    </>
  );
}

// ---- 6. Build (10–12): lines multiply, sweep, rotate into one horizontal line --
function Barcode({ t, b }: P) {
  const bars = chartBars();
  const mult = kf(t, [[10.5, 0], [10.85, 1]]);
  const sweep = (x: number) => kf(x, [[11.0, 0], [11.5, -W * 0.12]], (v) => v * v);
  const fold = kf(t, [[11.5, 0], [11.9, 1]]);
  const n = 24;
  return (
    <>
      {Array.from({ length: n }).map((_, j) => {
        const parent = Math.floor(j / 3);
        const x0 = bars[parent].x + ((j % 3) - 1) * 26 * mult;
        const spread = CX + (j - (n - 1) / 2) * (W / n);
        const xLine = lerp(x0, spread, mult) + sweep(t) * (0.6 + (j % 5) * 0.12);
        const wLine = lerp(12, 6 + ((j * 7) % 5) * 5, mult);
        // fold: every line turns horizontal and lands on the center line
        const x = lerp(xLine, CX, fold);
        const w = lerp(wLine, W, fold);
        const h = lerp(H, 10, fold);
        const color = j % 4 === 0 ? mix(b.primary, b.accent, mult) : b.primary;
        return <Box key={j} cx={x} cy={CY} w={w} h={h} color={fold > 0.5 ? b.primary : color} filter={smear(vel(sweep, t), 0, 1 / 300, 16)} />;
      })}
    </>
  );
}

// ---- 7. Strongest moment (12–14): slit opens, name races in, triples, snaps ----
function nameFs(name: string) {
  return Math.min(420, 1700 / Math.max(1, name.length * 0.66));
}

function Slit({ t, b }: P) {
  const name = b.name.toUpperCase();
  const fs = nameFs(name);
  const open = kf(t, [[12.0, -10], [12.3, 270], [12.5, 270], [12.85, 1100]]);
  const race = (x: number) => kf(x, [[12.0, W * 1.1], [12.45, 0]]);
  const triple = kf(t, [[12.5, 0], [12.85, 1]]);
  const slam = kf(t, [[13.0, 0], [13.3, 1]], expInOut);
  const wide = 0.12 * Math.min(1, 6 / Math.max(1, name.length)); // long names open less
  const track = kf(t, [[13.5, wide], [13.85, -0.045]]);
  const trackIn = kf(t, [[13.0, -0.045], [13.4, wide]]);
  const spacing = t < 13.5 ? (t < 13.0 ? -0.045 : trackIn) : track;
  const push = kf(t, [[13.5, 1], [13.95, 1.06]]);
  const rows = [
    { dy: -1, color: b.accent, from: -1 },
    { dy: 0, color: b.foreground, from: 0 },
    { dy: 1, color: b.primary, from: 1 },
  ];
  return (
    <>
      {rows.map((r, i) => {
        if (r.dy !== 0 && triple <= 0) return null;
        const stack = triple * (1 - slam);
        const rs = lerp(1, 0.74, stack); // rows shrink while stacked so all three fit
        const y = CY + r.dy * (fs * 0.86 * rs) * stack;
        const x = r.dy === 0 ? race(t) : r.from * W * 0.5 * (1 - triple);
        const color = r.dy === 0 ? b.foreground : mix(r.color, b.foreground, slam);
        const vx = r.dy === 0 ? vel(race, t) : 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: y - fs * 0.6,
              height: fs * 1.2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...TYPE,
              fontSize: fs,
              letterSpacing: `${spacing}em`,
              color,
              transform: `translateX(${x}px) scale(${push * rs})`,
              filter: smear(vx, 0, 1 / 400, 18),
            }}
          >
            {name}
          </div>
        );
      })}
      {/* the slit's two edges, pushed open */}
      <Box cx={CX} cy={CY - open / 2 - 5} w={W} h={10} color={b.primary} />
      <Box cx={CX} cy={CY + open / 2 + 5} w={W} h={10} color={b.primary} />
    </>
  );
}

// ---- 8. End title (14–15) → the opening stroke ---------------------------------
function EndTitle({ t, b, c }: P) {
  const name = b.name.toUpperCase();
  const fs = nameFs(name);
  const shrink = kf(t, [[14.0, 0], [14.35, 1]]);
  const scale = lerp(1.06, 0.36, shrink);
  const lift = shrink * -40;
  const tag = kf(t, [[14.1, 0], [14.38, 1]]);
  const close = kf(t, [[14.5, 0], [14.75, 1]], expInOut);
  const edges = kf(t, [[14.0, 1100], [14.3, 0]]);
  const stemH = kf(t, [[14.55, 0], [14.95, 320]]);
  const stemW = 40;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${close * 50}% 0 ${close * 50}%)` }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: CY - fs * 0.6 + lift,
            height: fs * 1.2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...TYPE,
            fontSize: fs,
            color: b.foreground,
            transform: `scale(${scale})`,
          }}
        >
          {name}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: CY + fs * 0.36 * 0.6 + 10, height: 70, overflow: "hidden" }}>
          <div style={{ textAlign: "center", fontSize: 42, fontWeight: 500, color: b.foreground, opacity: 0.75, transform: `translateY(${(1 - tag) * 80}px)` }}>{c.tagline}</div>
        </div>
      </div>
      {edges > 1 && (
        <>
          <Box cx={CX} cy={CY - edges / 2 - 5} w={W * Math.min(1, edges / 560)} h={10} color={b.primary} />
          <Box cx={CX} cy={CY + edges / 2 + 5} w={W * Math.min(1, edges / 560)} h={10} color={b.primary} />
        </>
      )}
      {stemH > 0.5 && <Box cx={CX} cy={CY} w={stemW} h={stemH} color={b.primary} />}
    </>
  );
}

function KineticReel({ brand, content, audio }: TemplateProps<C>) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p: P = { t, b: brand, c: content };
  const scene =
    t < 2 ? <Hook {...p} /> :
    t < 4 ? <Kinetic {...p} /> :
    t < 6 ? <Morph {...p} /> :
    t < 8.4 ? <City {...p} /> :
    t < 10.5 ? <Chart {...p} /> :
    t < 12 ? <Barcode {...p} /> :
    t < 14 ? <Slit {...p} /> :
    <EndTitle {...p} />;
  return (
    <AbsoluteFill style={{ background: brand.background, fontFamily: font(brand), fontSynthesis: "none", overflow: "hidden" }}>
      {scene}
      {audio && <Audio src={staticFile("kinetic-reel/kinetic-reel-120bpm.wav")} />}
    </AbsoluteFill>
  );
}

export const kineticReel: Template<C> = {
  id: "kinetic-reel",
  title: "Kinetic Type Reel",
  outcome: "A 15-second type-led reel: your words become a city, a chart, then your name",
  category: "Brand",
  tags: ["showreel", "kinetic type", "typography", "isometric", "3d", "chart", "loop", "music"],
  width: W,
  height: H,
  fps: 60,
  durationInFrames: 900,
  component: KineticReel,
  soundtrack: "kinetic-reel/kinetic-reel-120bpm.wav",
  defaults: { words: "Make, it, move", tagline: "Motion that matches your brand" },
  fields: [
    { key: "words", label: "Three words", type: "text", hint: "Comma separated; the last one gets your primary color" },
    { key: "tagline", label: "End title tagline", type: "text" },
  ],
};
