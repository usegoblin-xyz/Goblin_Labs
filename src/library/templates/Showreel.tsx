import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { alpha, type Brand } from "../brand";
import { font, list, type Template, type TemplateProps } from "../kit";

// "One line becomes everything." 15s at 120 BPM: a dot becomes a line, the line
// becomes type, shapes, a cube, a dashboard, a tile wall and the brand name,
// then collapses back into the dot so the loop is seamless. Every visual
// property is a pure function of t (seconds). Easing is exponential or a
// critically damped spring, never bouncy, whatever the brand's motion feel.

type C = { words: string; stat: string; tagline: string };

const W = 1920;
const H = 1080;
const CX = W / 2;
const CY = H / 2;

// ---- time helpers ---------------------------------------------------------
const c01 = (x: number) => Math.min(1, Math.max(0, x));
const expOut = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * c01(x)));
const expInOut = (x: number) => {
  const v = c01(x);
  if (v === 0 || v === 1) return v;
  return v < 0.5 ? Math.pow(2, 20 * v - 10) / 2 : (2 - Math.pow(2, -20 * v + 10)) / 2;
};
// Critically damped spring as a function of elapsed seconds (no overshoot).
const spring = (secs: number, w = 16) => (secs <= 0 ? 0 : 1 - (1 + w * secs) * Math.exp(-w * secs));
const seg = (t: number, a: number, d: number) => c01((t - a) / d);

type Ease = (x: number) => number;
// Piecewise keyframes: [[time, value], ...] eased per segment.
function kf(t: number, pts: [number, number][], ease: Ease = expOut) {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [t0, v0] = pts[i];
    const [t1, v1] = pts[i + 1];
    if (t <= t1) return v0 + (v1 - v0) * ease((t - t0) / (t1 - t0));
  }
  return pts[pts.length - 1][1];
}

// Blur follows speed: px/second of a moving property → blur radius.
function speedBlur(f: (t: number) => number, t: number, k = 1 / 550, max = 12) {
  const v = Math.abs((f(t) - f(t - 1 / 60)) * 60);
  return Math.min(max, v * k);
}

// Blend two #rrggbb colors; returns #rrggbb so results can be blended again.
function mix(a: string, b: string, p: number) {
  const pa = a.replace("#", "");
  const pb = b.replace("#", "");
  const ca = [0, 2, 4].map((i) => parseInt(pa.slice(i, i + 2), 16));
  const cb = [0, 2, 4].map((i) => parseInt(pb.slice(i, i + 2), 16));
  const q = c01(p);
  return (
    "#" +
    ca
      .map((v, i) => Math.round(v + (cb[i] - v) * q))
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

// A rect positioned by its center.
function Rect({ cx, cy, w, h, color, r = 0, blur = 0, style, children }: {
  cx: number; cy: number; w: number; h: number; color: string; r?: number; blur?: number; style?: CSSProperties; children?: ReactNode;
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
        filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

type SceneProps = { t: number; b: Brand; c: C };

// ---- 1. Hook: dot → line → three bands → caret (0–2s) ----------------------
function Hook({ t, b }: SceneProps) {
  const lineW = (x: number) => kf(x, [[0, 20], [0.05, 20], [0.42, 1400]]);
  const split = kf(t, [[0.5, 0], [0.85, 1]]);
  const grow = kf(t, [[1.0, 0], [1.4, 1]]);
  const collapse = kf(t, [[1.5, 0], [1.9, 1]]);
  const r = kf(t, [[0, 10], [0.2, 0]]);
  const colors = [b.accent, b.primary, b.foreground];

  return (
    <>
      {[-1, 0, 1].map((k, i) => {
        const isMid = k === 0;
        // y offset: split apart, then spread to fill the frame as bands
        const y = CY + k * (split * 120 + grow * 240);
        let w = lineW(t) + grow * (W - 1400);
        let h = 12 + grow * 348;
        let color = isMid ? b.primary : mix(b.primary, colors[i], split);
        if (!isMid) {
          h *= 1 - collapse;
          if (split <= 0) color = b.primary;
        } else {
          w = w + (12 - w) * collapse;
          h = h + (170 - h) * collapse;
        }
        if (!isMid && split <= 0) return null; // before the split there is one line
        const blur = isMid ? speedBlur(lineW, t) : 0;
        return <Rect key={k} cx={CX} cy={y} w={w} h={h} color={color} r={isMid ? r : 0} blur={blur} />;
      })}
    </>
  );
}

// ---- 2. Kinetic type: caret opens on the name, words swap, word → bar (2–4s)
function Kinetic({ t, b, c }: SceneProps) {
  const words = [b.name, ...list(c.words).slice(0, 3)];
  while (words.length < 4) words.push(b.name);
  const fs = 200;
  const reveal = kf(t, [[2.0, 0], [2.38, 1]]);
  const caretH = kf(t, [[2.0, 170], [2.25, 170], [2.45, 0]]);
  const estW = (s: string) => Math.max(200, s.length * fs * 0.6);
  const swapAt = [2.5, 3.0, 3.5];
  const idx = t < 2.5 ? 0 : t < 3.0 ? 1 : t < 3.5 ? 2 : 3;
  const fill = kf(t, [[3.62, 0], [3.78, 1]]); // block covers the last word
  const flat = kf(t, [[3.8, 0], [4.0, 1]]); // block → 760×152 bar

  const lastW = estW(words[3]) * 1.12 + 80;
  if (fill > 0) {
    // The last word fills into a solid block from the baseline up, then the
    // block flattens into the bar that the next scene breaks into squares.
    const w = lastW + (760 - lastW) * flat;
    const h0 = fs * 1.15;
    const h = h0 + (152 - h0) * flat;
    const hh = flat > 0 ? h : h0 * fill;
    const cy = flat > 0 ? CY : CY + h0 / 2 - hh / 2;
    return (
      <>
        {flat <= 0 && (
          <div style={{ position: "absolute", left: 0, right: 0, top: CY - fs * 0.62, height: fs * 1.24, display: "flex", justifyContent: "center", alignItems: "center", fontSize: fs, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, color: b.primary }}>
            {words[3]}
          </div>
        )}
        <Rect cx={CX} cy={cy} w={w} h={hh} color={b.primary} />
      </>
    );
  }

  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: CY - fs * 0.62, height: fs * 1.24, overflow: "hidden" }}>
        {words.map((w, i) => {
          const enterT = i === 0 ? 2.0 : swapAt[i - 1];
          const exitT = i < 3 ? swapAt[i] : 99;
          const yIn = i === 0 ? 0 : (1 - expOut((t - enterT) / 0.3)) * 110;
          const yOut = -expOut((t - exitT) / 0.3) * 110;
          if (t < enterT || t > exitT + 0.32) return null;
          const fy = (x: number) => (i === 0 ? 0 : (1 - expOut((x - enterT) / 0.3)) * 110) - expOut((x - exitT) / 0.3) * 110;
          const blur = speedBlur((x) => fy(x) * fs * 0.0124, t, 1 / 260, 10);
          const clip = i === 0 ? `inset(0 ${(1 - reveal) * 50}% 0 ${(1 - reveal) * 50}%)` : undefined;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: fs,
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                color: i === 3 ? b.primary : b.foreground,
                transform: `translateY(${yIn + yOut}%)`,
                clipPath: clip,
                filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined,
              }}
            >
              {w}
            </div>
          );
        })}
      </div>
      {caretH > 0 && (
        <>
          {[-1, 1].map((s) => (
            <Rect key={s} cx={CX + s * reveal * (estW(words[0]) / 2 + 24)} cy={CY} w={12} h={caretH} color={b.primary} />
          ))}
        </>
      )}
    </>
  );
}

// ---- 3. Shape morph: bar → 5 squares → one square → circle → ring → tile (4–6s)
function Morph({ t, b }: SceneProps) {
  const split = kf(t, [[4.0, 0], [4.25, 1]]);
  const merge = kf(t, [[4.5, 0], [4.85, 1]]);
  const round = kf(t, [[5.0, 0], [5.35, 1]]);
  const hole = kf(t, [[5.5, 0], [5.72, 0.62], [5.98, 0]]);
  const tile = kf(t, [[5.72, 0], [5.98, 1]]);
  const color = mix(mix(b.primary, b.accent, round), b.primary, tile);

  if (merge < 1) {
    return (
      <>
        {[0, 1, 2, 3, 4].map((i) => {
          const size0 = 152 + (120 - 152) * split;
          const size = size0 + (360 - size0) * merge;
          const pitch = 152 + 8 * split;
          const x0 = CX + (i - 2) * pitch;
          const xf = (x: number) => {
            const m = kf(x, [[4.5, 0], [4.85, 1]]);
            const sp = kf(x, [[4.0, 0], [4.25, 1]]);
            return CX + (i - 2) * (152 + 8 * sp) * (1 - m);
          };
          return <Rect key={i} cx={x0 + (CX - x0) * merge} cy={CY} w={size} h={size} color={b.primary} blur={speedBlur(xf, t)} />;
        })}
      </>
    );
  }
  const size = 360;
  const radius = tile > 0 ? 180 + (48 - 180) * tile : 180 * round;
  return (
    <Rect cx={CX} cy={CY} w={size} h={size} color={color} r={radius}>
      {hole > 0.04 && (
        <div style={{ position: "absolute", left: "50%", top: "50%", width: size * hole, height: size * hole, transform: "translate(-50%, -50%)", borderRadius: 999, background: b.background }} />
      )}
    </Rect>
  );
}

// ---- 4. 2D → 3D: tile → floor → cube → turn → flat card (6–8s) ------------
function Cube({ t, b }: SceneProps) {
  const tilt = kf(t, [[6.0, 0], [6.4, 1], [7.5, 1], [7.9, 0]]);
  const depth = kf(t, [[6.5, 0], [6.9, 360], [7.5, 360], [7.9, 0]]);
  const turn = kf(t, [[7.0, 0], [7.4, 90], [7.5, 90], [7.9, 180]]);
  const card = kf(t, [[7.5, 0], [7.9, 1]]);
  const w = 360 + (1100 - 360) * card;
  const h = 360 + (620 - 360) * card;
  const r = 48 * (1 - card) + 28 * card;
  const rotX = tilt * 56;
  const rotZ = tilt * 45 * (1 - c01((t - 7.0) / 0.4));
  const scale = 1 + tilt * 0.25;
  const face = (extra: CSSProperties): CSSProperties => ({
    position: "absolute",
    left: "50%",
    top: "50%",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    ...extra,
  });
  const dz = depth / 2;

  return (
    <AbsoluteFill style={{ perspective: 1800, perspectiveOrigin: "50% 45%" }}>
      <div
        style={{
          position: "absolute",
          left: CX,
          top: CY,
          width: 0,
          height: 0,
          transformStyle: "preserve-3d",
          transform: `scale(${scale}) rotateX(${rotX}deg) rotateZ(${rotZ}deg) rotateY(${turn}deg)`,
        }}
      >
        {/* front / back */}
        <div style={face({ width: w, height: h, marginLeft: -w / 2, marginTop: -h / 2, background: b.primary, borderRadius: r, transform: `translateZ(${dz}px)` })} />
        <div style={face({ width: w, height: h, marginLeft: -w / 2, marginTop: -h / 2, background: b.foreground, borderRadius: r, transform: `rotateY(180deg) translateZ(${dz}px)` })} />
        {/* sides */}
        {depth > 1 && (
          <>
            <div style={face({ width: depth, height: h, marginLeft: -depth / 2, marginTop: -h / 2, background: b.accent, transform: `rotateY(90deg) translateZ(${w / 2}px)` })} />
            <div style={face({ width: depth, height: h, marginLeft: -depth / 2, marginTop: -h / 2, background: b.accent, transform: `rotateY(-90deg) translateZ(${w / 2}px)` })} />
            <div style={face({ width: w, height: depth, marginLeft: -w / 2, marginTop: -depth / 2, background: mix(b.primary, b.background, 0.35), transform: `rotateX(90deg) translateZ(${h / 2}px)` })} />
            <div style={face({ width: w, height: depth, marginLeft: -w / 2, marginTop: -depth / 2, background: mix(b.primary, b.background, 0.55), transform: `rotateX(-90deg) translateZ(${h / 2}px)` })} />
          </>
        )}
      </div>
    </AbsoluteFill>
  );
}

// ---- 5. Data / UI: card becomes a dashboard (8–10s) ------------------------
const BARS = [0.32, 0.46, 0.4, 0.62, 0.74, 1];

function Dashboard({ b, c, t, scale = 1, cx = CX, cy = CY }: SceneProps & { scale?: number; cx?: number; cy?: number }) {
  const w = 1100;
  const h = 620;
  const statStr = c.stat || "+128%";
  const m = statStr.match(/^(\D*)(\d+(?:\.\d+)?)(.*)$/);
  const statN = m ? Number(m[2]) : 0;
  const count = kf(t, [[8.5, 0], [8.95, 1]]);
  const shownStat = m ? `${m[1]}${Math.round(statN * count)}${m[3]}` : statStr;
  const line = kf(t, [[9.0, 0], [9.42, 1]]);
  const take = kf(t, [[9.5, 0], [9.9, 1]]);
  const labelIn = kf(t, [[8.0, 0], [8.3, 1]]);
  const statIn = kf(t, [[8.5, 0], [8.8, 1]]);
  const ink = b.background;
  const chartH = 300;
  const barW = 90;
  const gap = 40;
  const startX = 60;
  const pts = BARS.map((v, i) => [startX + i * (barW + gap) + barW / 2, h - 60 - v * chartH * 0.92] as const);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");

  return (
    <div
      style={{
        position: "absolute",
        left: cx - w / 2,
        top: cy - h / 2,
        width: w,
        height: h,
        borderRadius: 28,
        background: b.foreground,
        overflow: "hidden",
        transform: `scale(${scale})`,
      }}
    >
      <div style={{ position: "absolute", left: 60, top: 50, fontSize: 30, fontWeight: 600, color: alpha(ink, 0.6), opacity: 1 - take, clipPath: `inset(0 ${(1 - labelIn) * 100}% 0 0)` }}>{b.name}</div>
      <div style={{ position: "absolute", left: 60, top: 92, fontSize: 112, fontWeight: 700, letterSpacing: "-0.04em", color: ink, fontVariantNumeric: "tabular-nums", opacity: 1 - take, clipPath: `inset(0 0 ${(1 - statIn) * 100}% 0)` }}>
        {shownStat}
      </div>
      {BARS.map((v, i) => {
        const rise = expOut(seg(t, 8.0 + i * 0.05, 0.3));
        const last = i === BARS.length - 1;
        const fullH = v * chartH * rise;
        const hh = last ? fullH + (h - fullH) * take : fullH * (1 - take);
        const x = startX + i * (barW + gap);
        const ww = last ? barW + (w - x - barW) * take : barW;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: last ? x - (x - 640) * take : x,
              bottom: last ? 60 * (1 - take) : 60,
              width: last ? ww + (x - 640) * take : ww,
              height: hh,
              borderRadius: 14 * (1 - take),
              background: last ? b.primary : alpha(ink, 0.85),
            }}
          />
        );
      })}
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, opacity: 1 - take }}>
        <path d={path} fill="none" stroke={b.accent} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - line} />
      </svg>
    </div>
  );
}

// ---- 6. Build: pull back to a 3×3 grid, cycle, tilt, snap to a strip (10–12s)
const GRID_W = 330;
const GRID_H = 186;
const GAP = 24;
const STRIP_W = 260;
const STRIP_H = 620;
const STRIP_GAP = 12;
// Ring order around the center tile (index 4 is the dashboard).
const RING = [0, 1, 2, 5, 8, 7, 6, 3];
// Which strip slot each grid tile lands in (-1 = merges away).
const TO_STRIP: Record<number, number> = { 0: 0, 1: 1, 2: 4, 3: 2, 4: 3, 5: 5, 6: -1, 7: -1, 8: -1 };

function gridPos(cell: number) {
  const col = cell % 3;
  const row = Math.floor(cell / 3);
  return { x: CX + (col - 1) * (GRID_W + GAP), y: CY + (row - 1) * (GRID_H + GAP) };
}
function stripX(slot: number, gap = STRIP_GAP) {
  return CX + (slot - 2.5) * (STRIP_W + gap);
}

function Grid({ t, b, c }: SceneProps) {
  const pull = kf(t, [[10.0, 0], [10.42, 1]]);
  const step1 = kf(t, [[10.5, 0], [10.85, 1]]);
  const step2 = kf(t, [[11.0, 0], [11.35, 1]]);
  const tiltX = kf(t, [[11.0, 0], [11.35, 18], [11.5, 18], [11.9, 0]]);
  const snap = kf(t, [[11.5, 0], [11.9, 1]]);
  const palette = [b.primary, b.accent, b.foreground, mix(b.primary, b.background, 0.5)];

  const cellAt = (tile: number) => {
    if (tile === 4) return 4;
    const ri = RING.indexOf(tile);
    return ri; // ring index; positions are interpolated below
  };

  const tiles = Array.from({ length: 9 }).map((_, tile) => {
    let x: number;
    let y: number;
    if (tile === 4) {
      x = CX;
      y = CY;
    } else {
      const ri = cellAt(tile);
      const p0 = gridPos(RING[ri]);
      const p1 = gridPos(RING[(ri + 1) % 8]);
      const p2 = gridPos(RING[(ri + 2) % 8]);
      const a = { x: p0.x + (p1.x - p0.x) * step1, y: p0.y + (p1.y - p0.y) * step1 };
      x = a.x + (p2.x - p1.x) * step2;
      y = a.y + (p2.y - p1.y) * step2;
      // slide in from off-frame during the pull back
      const dir = { x: p0.x - CX, y: p0.y - CY };
      const off = (1 - pull) * 2.4;
      x += dir.x * off;
      y += dir.y * off;
    }
    const slot = TO_STRIP[tile];
    const tx = slot >= 0 ? stripX(slot) : stripX(tile === 6 ? 0 : tile === 7 ? 2 : 5);
    const w = GRID_W + ((slot >= 0 ? STRIP_W : 0) - GRID_W) * snap;
    const h = GRID_H + ((slot >= 0 ? STRIP_H : 0) - GRID_H) * snap;
    return { tile, x: x + (tx - x) * snap, y: y + (CY - y) * snap, w, h, color: palette[tile % palette.length] };
  });

  const dashScale = 1 + (GRID_W / 1100 - 1) * pull;

  return (
    <AbsoluteFill style={{ perspective: 2000 }}>
      <AbsoluteFill style={{ transform: `rotateX(${tiltX}deg)`, transformStyle: "preserve-3d" }}>
        {tiles.map((p) => {
          if (p.tile === 4 && pull < 1) return <Dashboard key={p.tile} t={9.99} b={b} c={c} scale={dashScale} />;
          if (p.tile === 4) {
            // same two-tone look as the finished dashboard, then all primary
            const leftFrac = (640 / 1100) * (1 - snap);
            return (
              <Rect key={p.tile} cx={p.x} cy={p.y} w={p.w} h={p.h} color={b.primary} r={8 + 10 * snap} style={{ overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${leftFrac * 100}%`, background: b.foreground }} />
              </Rect>
            );
          }
          return <Rect key={p.tile} cx={p.x} cy={p.y} w={p.w} h={p.h} color={p.color} r={10 + 8 * snap} />;
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ---- 7. Strongest moment: tiles flip to reveal the name (12–14s) -----------
function nameSize(name: string) {
  return Math.min(460, 1500 / Math.max(1, name.length * 0.6));
}

function Flip({ t, b }: SceneProps) {
  const gap = kf(t, [[13.5, STRIP_GAP], [13.88, 0]]);
  const push = kf(t, [[13.5, 1], [13.95, 1.08]]);
  const palette = [b.primary, b.accent, b.foreground, mix(b.primary, b.background, 0.5)];
  const order = [0, 1, 3, 4, 2, 5]; // tile colors carried over from the grid
  const fs = nameSize(b.name);
  const totalW = 6 * STRIP_W + 5 * gap;

  return (
    <AbsoluteFill style={{ perspective: 2400, transform: `scale(${push})` }}>
      {Array.from({ length: 6 }).map((_, i) => {
        const pair = Math.floor(i / 2);
        const flip = expInOut(seg(t, 12.0 + pair * 0.5, 0.36)) * 180;
        const x = CX + (i - 2.5) * (STRIP_W + gap);
        const colorTile = order[i] === 4 ? b.primary : palette[order[i] % palette.length];
        const faceBase: CSSProperties = {
          position: "absolute",
          inset: 0,
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          borderRadius: 18 * (1 - c01((t - 12.0 - pair * 0.5) / 0.36)),
          overflow: "hidden",
        };
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - STRIP_W / 2,
              top: CY - STRIP_H / 2,
              width: STRIP_W + 1.5, // 1.5px overlap hides anti-aliased seams once the gaps close
              height: STRIP_H,
              transformStyle: "preserve-3d",
              transform: `rotateY(${flip}deg)`,
            }}
          >
            <div style={{ ...faceBase, background: colorTile }} />
            <div style={{ ...faceBase, background: b.background, transform: "rotateY(180deg)" }}>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  height: STRIP_H,
                  // the full word, offset so each tile shows its slice
                  left: -(i * (STRIP_W + gap)),
                  width: totalW,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: fs,
                  fontWeight: 700,
                  letterSpacing: "-0.05em",
                  color: b.foreground,
                  whiteSpace: "nowrap",
                }}
              >
                {b.name}
              </div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

// ---- 8. End title, then back to the dot (14–15s) ---------------------------
function EndTitle({ t, b, c }: SceneProps) {
  const fs = nameSize(b.name);
  const shrink = kf(t, [[14.0, 0], [14.32, 1]]);
  const scale = 1.08 + (0.42 - 1.08) * shrink;
  const tag = kf(t, [[14.1, 0], [14.36, 1]]);
  const exit = kf(t, [[14.5, 0], [14.72, 1]], expInOut);
  const titleH = fs * scale * 1.1;
  const estW = Math.min(1500, b.name.length * fs * 0.58) * scale;
  // underline appears under the tagline, then carries the exit
  const lineY = CY + titleH * 0.5 + 92;
  const lineW0 = kf(t, [[14.28, 0], [14.5, Math.max(240, estW)]]);
  const toDot = kf(t, [[14.7, 0], [14.98, 1]]);
  const lw = lineW0 + (20 - lineW0) * toDot;
  const lh = 12 + 8 * toDot;
  const ly = lineY + (CY - lineY) * toDot;
  const fLx = (x: number) => kf(x, [[14.7, 0], [14.98, 1]]) * (CY - lineY);

  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: CY - STRIP_H / 2, height: STRIP_H, overflow: "hidden", clipPath: `inset(0 0 ${exit * 100}% 0)` }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: fs,
            fontWeight: 700,
            letterSpacing: "-0.05em",
            color: b.foreground,
            whiteSpace: "nowrap",
            transform: `translateY(${-shrink * 60}px) scale(${scale})`,
          }}
        >
          {b.name}
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: CY + titleH * 0.5 - 40, height: 80, overflow: "hidden", clipPath: `inset(0 0 ${exit * 100}% 0)` }}>
        <div style={{ textAlign: "center", fontSize: 44, fontWeight: 500, color: alpha(b.foreground, 0.75), transform: `translateY(${(1 - tag) * 90}px)` }}>{c.tagline}</div>
      </div>
      {lineW0 > 1 && <Rect cx={CX} cy={ly} w={lw} h={lh} color={b.primary} r={10 * toDot} blur={speedBlur(fLx, t, 1 / 700, 8)} />}
    </>
  );
}

function Showreel({ brand, content, audio }: TemplateProps<C>) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p: SceneProps = { t, b: brand, c: content };
  const scene =
    t < 2 ? <Hook {...p} /> :
    t < 4 ? <Kinetic {...p} /> :
    t < 6 ? <Morph {...p} /> :
    t < 8 ? <Cube {...p} /> :
    t < 10 ? <Dashboard {...p} /> :
    t < 12 ? <Grid {...p} /> :
    t < 14 ? <Flip {...p} /> :
    <EndTitle {...p} />;

  return (
    <AbsoluteFill style={{ background: brand.background, color: brand.foreground, fontFamily: font(brand), fontSynthesis: "none", overflow: "hidden" }}>
      {scene}
      {audio && <Audio src={staticFile("showreel/showreel-120bpm.wav")} />}
    </AbsoluteFill>
  );
}

export const showreel: Template<C> = {
  id: "showreel",
  title: "Brand Showreel",
  outcome: "A 15-second motion showreel that turns one line into your brand",
  category: "Brand",
  tags: ["showreel", "sizzle", "brand film", "kinetic type", "3d", "loop", "music"],
  width: W,
  height: H,
  fps: 60,
  durationInFrames: 900,
  component: Showreel,
  soundtrack: "showreel/showreel-120bpm.wav",
  defaults: {
    words: "Design, in, motion",
    stat: "+128%",
    tagline: "Launch videos that look like you",
  },
  fields: [
    { key: "words", label: "Three words", type: "text", hint: "Comma separated; the last one gets your primary color" },
    { key: "stat", label: "Dashboard stat", type: "text", hint: "e.g. +128% or 3x" },
    { key: "tagline", label: "End title tagline", type: "text" },
  ],
};

