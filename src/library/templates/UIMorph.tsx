import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { onColor, type Brand } from "../brand";
import { font, list, type Template, type TemplateProps } from "../kit";

// One shape, never cut. A single rounded element morphs through 14 UI states
// on a 120 BPM grid (beat = 0.5 s, 28 beats, 14 s) while a cursor drives every
// change. Every value is a pure function of t: springs are closed-form step
// responses, and a value that changes target many times is the sum of one
// spring per change. The last frame equals the first, cursor included.

type C = { button: string; track: string; artist: string; tabs: string; command: string; toast: string };

const S = 1440; // square canvas
const CANVAS = "#ebe8e3"; // light warm gray
const INK = "#0b0b0c";
const PAPER = "#ffffff";
const MUTED = "#d6d3cd";

// ---- springs ----------------------------------------------------------------
// Under-damped step response (zeta 0.78 → ~2% overshoot: "tiny at most").
function step(tau: number, w = 24, z = 0.78) {
  if (tau <= 0) return 0;
  if (z >= 0.999) return 1 - (1 + w * tau) * Math.exp(-w * tau); // critically damped
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + (z / Math.sqrt(1 - z * z)) * Math.sin(wd * tau));
}
type Key = [number, number];
// Sum of springs: each key retargets from the previous value.
function sv(t: number, keys: Key[], w?: number, z?: number) {
  let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) v += (keys[i][1] - keys[i - 1][1]) * step(t - keys[i][0], w, z);
  return v;
}
function hex(c: string) {
  const h = c.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function svColor(t: number, keys: [number, string][], w = 20) {
  const ch = [0, 1, 2].map((k) => Math.round(Math.min(255, Math.max(0, sv(t, keys.map(([tt, c]) => [tt, hex(c)[k]] as Key), w, 0.95)))));
  return `rgb(${ch[0]}, ${ch[1]}, ${ch[2]})`;
}
const c01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = (x: number) => 1 - Math.pow(1 - c01(x), 3);

// Content visibility: own enter/exit timing so swapped text never overlaps.
function vis(t: number, tin: number, tout: number) {
  const a = tin === -Infinity ? 1 : easeOut((t - tin - 0.07) / 0.16);
  const b = tout === Infinity ? 1 : 1 - easeOut((t - tout + 0.02) / 0.1);
  return Math.min(a, b);
}
function Layer({ v, children }: { v: number; children: ReactNode }) {
  if (v <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        opacity: v,
        filter: v < 0.99 ? `blur(${((1 - v) * 9).toFixed(1)}px)` : undefined,
        transform: `scale(${0.96 + 0.04 * v})`,
      }}
    >
      {children}
    </div>
  );
}
// Absolutely place a child by its center, in world px (origin = element center).
function At({ x, y, w, h, style, children }: { x: number; y: number; w?: number; h?: number; style?: CSSProperties; children?: ReactNode }) {
  const sized = w !== undefined && h !== undefined;
  return (
    <div
      style={{
        position: "absolute",
        left: sized ? x - w / 2 : x,
        top: sized ? y - h / 2 : y,
        width: w,
        height: h,
        transform: sized ? undefined : "translate(-50%, -50%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function neutral(c: string) {
  const [r, g, b] = hex(c);
  return Math.max(r, g, b) - Math.min(r, g, b) < 28;
}

// ---- timeline (seconds) ----------------------------------------------------
const B = (n: number) => n * 0.5; // beat n → seconds
const T = {
  loader: B(1), check: B(3), island: B(4), player: B(5), play: B(6), grab: B(8), scrubEnd: B(10),
  slider: B(11), vGrab: B(12), vMax: B(12.8), vOver: B(13.5), vRelease: B(14), toggle: B(15), flip: B(16),
  tabs: B(17), tab2: B(18), tab3: B(19), chart: B(20), draw: B(21), hover: B(22), cmdk: B(23),
  type: B(24), filtered: B(25), enter: B(26), button: B(27), end: B(28),
};
// The click instants (cursor press dips around these)
const CLICKS = [T.loader, T.play, T.flip, T.tab2, T.tab3, T.hover];
const HOLDS: [number, number][] = [[T.grab, T.scrubEnd], [T.vGrab, T.vRelease]];

// Player geometry (world px)
const PROG_X0 = -270;
const PROG_W = 540;
const PROG_Y = 92;
// Volume slider geometry
const VOL_X0 = -200;
const VOL_W = 450;

// Cursor path in world px; the last key returns to the first so the loop is seamless.
const P0: [number, number] = [229, 254];
const CURSOR_X: Key[] = [
  [0, P0[0]], [0.05, 40], [0.75, 120], [2.6, 230], [3.35, 300], [3.7, PROG_X0 + PROG_W * 0.214], [4.1, PROG_X0 + PROG_W * 0.74],
  [5.15, 300], [5.8, VOL_X0 + VOL_W * 0.38], [6.1, VOL_X0 + VOL_W], [6.55, VOL_X0 + VOL_W + 90], [7.05, 300],
  [7.7, 22], [8.3, 160], [8.75, 0], [9.25, 200], [9.75, 330], [10.75, 170], [11.25, 360], [11.8, 300], [13.25, P0[0]],
];
const CURSOR_Y: Key[] = [
  [0, P0[1]], [0.05, 14], [0.75, 120], [2.6, -48], [3.35, 160], [3.7, PROG_Y], [5.15, 150],
  [5.8, 2], [7.05, 150], [7.7, 12], [8.3, 130], [8.75, 6], [9.75, 140], [10.75, -64], [11.25, 230], [11.8, 160], [13.25, P0[1]],
];
const cursorAt = (t: number) => [sv(t, CURSOR_X, 15, 0.9), sv(t, CURSOR_Y, 15, 0.9)] as const;

// ---- the one shape -----------------------------------------------------------
type Geo = { t: number; w: number; h: number; r: number };
const GEO: Geo[] = [
  { t: 0, w: 360, h: 110, r: 55 },
  { t: T.loader, w: 112, h: 112, r: 56 },
  { t: T.island, w: 400, h: 104, r: 52 },
  { t: T.player, w: 640, h: 300, r: 52 },
  { t: T.slider, w: 580, h: 100, r: 50 },
  { t: T.toggle, w: 220, h: 120, r: 60 },
  { t: T.tabs, w: 620, h: 104, r: 52 },
  { t: T.chart, w: 780, h: 560, r: 44 },
  { t: T.cmdk, w: 640, h: 112, r: 32 },
  { t: T.type, w: 640, h: 400, r: 32 },
  { t: T.type + 0.32, w: 640, h: 272, r: 32 },
  { t: T.enter, w: 540, h: 100, r: 50 },
  { t: T.button, w: 360, h: 110, r: 55 },
];
const keysOf = (f: (g: Geo) => number): Key[] => GEO.map((g) => [g.t, f(g)]);
const camOf = (g: Geo) => Math.min(2.4, (0.6 * S) / g.w, (0.6 * S) / g.h);

// ---- state contents ---------------------------------------------------------
function Loader({ t }: { t: number }) {
  const rot = t * 540;
  const len = 0.28 + 0.12 * Math.sin((t / 0.5) * Math.PI); // breathes on the beat
  return (
    <At x={0} y={0} w={64} h={64}>
      <svg width={64} height={64} viewBox="0 0 64 64" style={{ transform: `rotate(${rot}deg)` }}>
        <circle cx={32} cy={32} r={24} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={6} />
        <circle cx={32} cy={32} r={24} fill="none" stroke={PAPER} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={`${len} 1`} />
      </svg>
    </At>
  );
}

function Check({ t, on }: { t: number; on: string }) {
  const p = c01((t - T.check - 0.06) / 0.22);
  return (
    <At x={0} y={0} w={64} h={64}>
      <svg width={64} height={64} viewBox="0 0 64 64">
        <path d="M18 33 L28 43 L47 22" fill="none" stroke={on} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - easeOut(p)} />
      </svg>
    </At>
  );
}

function Island({ t, accent, c }: { t: number; accent: string; c: C }) {
  return (
    <>
      <At x={-152} y={0} w={48} h={48} style={{ borderRadius: 14, background: accent }} />
      <div style={{ position: "absolute", left: -116, top: -15, color: PAPER, fontSize: 24, fontWeight: 600, whiteSpace: "nowrap" }}>{c.track}</div>
      {[0, 1, 2, 3].map((i) => {
        const hgt = 10 + 16 * Math.abs(Math.sin(t * 7 + i * 1.3));
        return <At key={i} x={120 + i * 14} y={0} w={6} h={hgt} style={{ borderRadius: 3, background: accent }} />;
      })}
    </>
  );
}

function progressAt(t: number) {
  const base = (x: number) => 0.18 + Math.max(0, x - T.play) * 0.04;
  if (t < T.grab) return base(t);
  if (t <= T.scrubEnd) {
    const [cx] = cursorAt(t);
    return c01((cx - PROG_X0) / PROG_W); // direct manipulation while held
  }
  const [cx] = cursorAt(T.scrubEnd);
  return c01((cx - PROG_X0) / PROG_W) + (t - T.scrubEnd) * 0.04;
}

function PlayPause({ t }: { t: number }) {
  // play triangle → pause bars, as two morphing quads
  const m = step(t - T.play, 26, 0.85);
  const L = (a: number, b: number) => a + (b - a) * m;
  const left = `M${L(30, 27)},${L(24, 24)} L${L(46, 35)},${L(32, 24)} L${L(46, 35)},${L(32, 48)} L${L(30, 27)},${L(48, 48)} Z`;
  const right = `M${L(46, 41)},${L(32, 24)} L${L(56, 49)},${L(36, 24)} L${L(56, 49)},${L(36, 48)} L${L(46, 41)},${L(32, 48)} Z`;
  return (
    <svg width={72} height={72} viewBox="0 0 72 72">
      <path d={left} fill={INK} />
      <path d={right} fill={INK} />
    </svg>
  );
}

function Player({ t, accent, c }: { t: number; accent: string; c: C }) {
  const p = progressAt(t);
  const held = t >= T.grab && t <= T.scrubEnd;
  const knob = 22 * (held ? 1.35 : 1 + 0.35 * (1 - step(t - T.scrubEnd)) * (t > T.scrubEnd ? 1 : 0));
  const pulse = 1 + 0.035 * Math.pow(Math.max(0, Math.cos(((t - T.play) / 0.5) * Math.PI * 2)), 12) * (t > T.play ? 1 : 0);
  const secs = Math.round(p * 220);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return (
    <>
      <At x={-218} y={-48} w={140} h={140} style={{ borderRadius: 24, background: accent, transform: `scale(${pulse})` }}>
        <div style={{ width: 52, height: 52, borderRadius: 99, border: `8px solid ${onColor(accent)}`, opacity: 0.85 }} />
      </At>
      <div style={{ position: "absolute", whiteSpace: "nowrap", left: -128, top: -100, color: PAPER }}>
        <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.01em" }}>{c.track}</div>
        <div style={{ fontSize: 24, marginTop: 6, color: "rgba(255,255,255,0.55)" }}>{c.artist}</div>
      </div>
      <At x={228} y={-48} w={88} h={88} style={{ borderRadius: 99, background: PAPER }}>
        <PlayPause t={t} />
      </At>
      <At x={0} y={PROG_Y} w={PROG_W} h={8} style={{ borderRadius: 4, background: "rgba(255,255,255,0.18)", justifyContent: "flex-start" }}>
        <div style={{ width: `${p * 100}%`, height: "100%", borderRadius: 4, background: PAPER }} />
      </At>
      <At x={PROG_X0 + PROG_W * p} y={PROG_Y} w={knob} h={knob} style={{ borderRadius: 99, background: PAPER }} />
      <div style={{ position: "absolute", left: PROG_X0, top: PROG_Y + 18, fontSize: 18, color: "rgba(255,255,255,0.5)", fontVariantNumeric: "tabular-nums" }}>{fmt(secs)}</div>
      <div style={{ position: "absolute", left: PROG_X0 + PROG_W - 40, top: PROG_Y + 18, fontSize: 18, color: "rgba(255,255,255,0.5)" }}>3:40</div>
    </>
  );
}

function volumeAt(t: number) {
  const v0 = 0.38;
  if (t < T.vGrab) return { v: v0, over: 0 };
  const [cx] = cursorAt(Math.min(t, T.vRelease));
  const v = c01((cx - VOL_X0) / VOL_W);
  const overHeld = Math.max(0, cx - (VOL_X0 + VOL_W));
  if (t <= T.vRelease) return { v, over: overHeld };
  return { v, over: overHeld * (1 - step(t - T.vRelease, 22, 0.7)) }; // spring back from where it was
}

function Speaker() {
  return (
    <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

function Slider({ t, shift }: { t: number; shift: number }) {
  const { v, over } = volumeAt(t);
  const stretch = over * 0.5;
  const held = t >= T.vGrab && t <= T.vRelease;
  const fillW = v * VOL_W + stretch;
  return (
    <div style={{ position: "absolute", left: -shift, top: 0 }}>
      <At x={-245} y={0} w={44} h={44}>
        <Speaker />
      </At>
      <div style={{ position: "absolute", left: VOL_X0, top: -6, width: VOL_W + stretch, height: 12, borderRadius: 6, background: "#e4e1dc" }} />
      <div style={{ position: "absolute", left: VOL_X0, top: -6 - stretch * 0.04, width: fillW, height: 12 + stretch * 0.08, borderRadius: 6, background: INK }} />
      <At x={VOL_X0 + fillW} y={0} w={held ? 38 : 32} h={held ? 38 : 32} style={{ borderRadius: 99, background: INK }} />
    </div>
  );
}

// Two edges on different springs: the leading edge runs ahead of the trailing one.
function edgePair(t: number, moves: { t: number; l: number; r: number }[]) {
  let l = moves[0].l;
  let r = moves[0].r;
  for (let i = 1; i < moves.length; i++) {
    const m = moves[i];
    const prev = moves[i - 1];
    const goingRight = m.l + m.r > prev.l + prev.r;
    const fast = 34;
    const slow = 17;
    l += (m.l - prev.l) * step(t - m.t, goingRight ? slow : fast, 0.82);
    r += (m.r - prev.r) * step(t - m.t, goingRight ? fast : slow, 0.82);
  }
  return [l, r] as const;
}
// Toggle knob (96 tall) → tab indicator (80 tall): one object, edges sprung separately.
const KNOB_MOVES = [
  { t: 0, l: -98, r: -2 },
  { t: T.flip, l: 2, r: 98 },
  { t: T.tabs, l: -296, r: -110 },
  { t: T.tab2, l: -96, r: 96 },
  { t: T.tab3, l: 110, r: 296 },
];

function Toggle({ t }: { t: number }) {
  const [l, r] = edgePair(t, KNOB_MOVES);
  return <div style={{ position: "absolute", left: l, top: -48, width: r - l, height: 96, borderRadius: 48, background: PAPER, boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }} />;
}

function Tabs({ t, labels, y, part }: { t: number; labels: string[]; y: number; part: "indicator" | "labels" }) {
  const [l, r] = edgePair(t, KNOB_MOVES);
  const xs = [-203, 0, 203];
  if (part === "indicator") {
    // continues the toggle knob without a cut: same edges, height and color spring
    const h = 96 + (80 - 96) * step(t - T.tabs);
    const bg = svColor(t, [[0, PAPER], [T.tabs, INK]]);
    return <div style={{ position: "absolute", left: l, top: y - h / 2, width: r - l, height: h, borderRadius: h / 2, background: bg }} />;
  }
  return (
    <div style={{ position: "absolute", left: 0, top: y }}>
      {labels.map((s, i) => {
        const cover = c01(Math.min(xs[i] - l, r - xs[i]) / 40);
        return (
          <At key={i} x={xs[i]} y={0} style={{ fontSize: 30, fontWeight: 600, color: cover > 0.5 ? PAPER : INK }}>
            {s}
          </At>
        );
      })}
    </div>
  );
}

const CHART = [0.32, 0.38, 0.34, 0.5, 0.46, 0.66, 0.6, 0.82];
function Chart({ t, accent }: { t: number; accent: string }) {
  const x0 = -330;
  const w = 660;
  const y0 = -110;
  const h = 330;
  const pts = CHART.map((v, i) => [x0 + (i / (CHART.length - 1)) * w, y0 + h - v * h] as const);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${path} L${x0 + w},${y0 + h} L${x0},${y0 + h} Z`;
  const draw = step(t - T.draw, 9, 1);
  const hov = step(t - T.hover, 26, 0.8);
  const hp = pts[5];
  return (
    <>
      <svg width={w + 80} height={h + 40} viewBox={`${x0 - 40} ${y0 - 20} ${w + 80} ${h + 40}`} style={{ position: "absolute", left: x0 - 40, top: y0 - 20, overflow: "visible" }}>
        {[0, 1, 2, 3].map((g) => (
          <line key={g} x1={x0} x2={x0 + w} y1={y0 + (g / 3) * h} y2={y0 + (g / 3) * h} stroke="#ebe8e3" strokeWidth={2} />
        ))}
        <path d={area} fill={accent} opacity={0.12 * draw} />
        <path d={path} fill="none" stroke={accent} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
        <line x1={hp[0]} x2={hp[0]} y1={y0} y2={y0 + h} stroke={INK} strokeWidth={2} strokeDasharray="6 8" opacity={hov} />
        <circle cx={hp[0]} cy={hp[1]} r={11 * hov} fill={PAPER} stroke={accent} strokeWidth={5} />
      </svg>
      <At x={hp[0]} y={hp[1] - 66} w={150} h={64} style={{ borderRadius: 16, background: INK, color: PAPER, fontSize: 28, fontWeight: 600, transform: `scale(${hov})`, transformOrigin: "50% 100%" }}>
        +24%
      </At>
    </>
  );
}

function Search({ color }: { color: string }) {
  return (
    <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <circle cx={11} cy={11} r={7} />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function Palette({ t, accent, c }: { t: number; accent: string; c: C }) {
  const items = [c.command, "Export frames", "Share link", "Duplicate scene"];
  const q = c.command.slice(0, 3).toLowerCase();
  const typed = q.slice(0, [0.0, 0.12, 0.24].filter((d) => t >= T.type + d).length);
  const headerY = sv(t, [[0, 0], [T.type, -144], [T.type + 0.32, -80]]);
  const caretOn = Math.floor((t - T.cmdk) / 0.25) % 2 === 0;
  const keep = (s: string) => s.toLowerCase().startsWith(q);
  const sel = step(t - T.filtered, 26, 0.85);
  const press = t >= T.enter - 0.04 && t <= T.enter + 0.08 ? 0.96 : 1;
  let y = headerY + 66;
  return (
    <>
      <At x={-272} y={headerY} w={34} h={34}>
        <Search color="#8a877f" />
      </At>
      <div style={{ position: "absolute", left: -236, top: headerY - 20, fontSize: 32, fontWeight: 500, color: typed ? INK : "#9b978e", display: "flex", alignItems: "center", height: 40, whiteSpace: "nowrap" }}>
        {typed || "Search commands"}
        {typed && <span style={{ width: 3, height: 34, marginLeft: 3, background: caretOn ? INK : "transparent" }} />}
      </div>
      <At x={262} y={headerY} w={64} h={40} style={{ borderRadius: 10, border: "2px solid #dedad3", fontSize: 22, fontWeight: 600, color: "#6f6c65" }}>
        ⌘K
      </At>
      {t >= T.type &&
        items.map((s, i) => {
          // rows that don't match collapse as the query is typed
          const goneAt = keep(s) ? Infinity : T.type + 0.12 + (i % 2) * 0.12;
          const k = t < goneAt ? 1 : 1 - step(t - goneAt, 30, 1);
          const rowH = 64 * k;
          const top = y;
          y += rowH;
          if (rowH < 1) return null;
          const isSel = i === 0;
          const bg = isSel ? `rgba(11,11,12,${0.06 * sel})` : "transparent";
          return (
            <div key={s} style={{ position: "absolute", left: -300, top, width: 600, height: rowH, overflow: "hidden", borderRadius: 16, background: bg, opacity: k, transform: isSel ? `scale(${press})` : undefined }}>
              <div style={{ position: "absolute", left: 20, top: 16, width: 32, height: 32, borderRadius: 9, background: isSel ? accent : "#e8e5e0" }} />
              <div style={{ position: "absolute", whiteSpace: "nowrap", left: 70, top: 14, fontSize: 28, fontWeight: 500, color: INK }}>{s}</div>
              {isSel && (
                <div style={{ position: "absolute", right: 18, top: 14, width: 44, height: 36, borderRadius: 9, border: "2px solid #dedad3", fontSize: 22, color: "#6f6c65", display: "flex", alignItems: "center", justifyContent: "center", opacity: sel }}>
                  ↵
                </div>
              )}
            </div>
          );
        })}
    </>
  );
}

function Toast({ t, accent, c }: { t: number; accent: string; c: C }) {
  const p = c01((t - T.enter - 0.1) / 0.22);
  return (
    <>
      <At x={-214} y={0} w={52} h={52} style={{ borderRadius: 99, background: accent }}>
        <svg width={30} height={30} viewBox="0 0 30 30">
          <path d="M8 15.5 L13 20.5 L22 10" fill="none" stroke={onColor(accent)} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - easeOut(p)} />
        </svg>
      </At>
      <div style={{ position: "absolute", whiteSpace: "nowrap", left: -172, top: -20, fontSize: 30, fontWeight: 600, color: PAPER }}>{c.toast}</div>
      <At x={196} y={0} style={{ fontSize: 26, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>
        Undo
      </At>
    </>
  );
}

// ---- cursor -----------------------------------------------------------------
function pressAt(t: number) {
  let d = 0;
  for (const c of CLICKS) d = Math.max(d, Math.exp(-Math.pow((t - c) / 0.05, 2)));
  for (const [a, b] of HOLDS) if (t >= a - 0.04 && t <= b) d = 1;
  return d;
}
function Cursor({ x, y, t }: { x: number; y: number; t: number }) {
  const s = 1 - 0.14 * pressAt(t);
  return (
    <svg
      width={54}
      height={54}
      viewBox="0 0 24 24"
      style={{ position: "absolute", left: x - 6, top: y - 4, transform: `scale(${s})`, transformOrigin: "6px 4px", filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.22))" }}
    >
      <path d="M4.5 2.5 L4.5 19 L9 15 L12 21.5 L14.6 20.3 L11.7 14 L18 14 Z" fill={INK} stroke={PAPER} strokeWidth={1.4} strokeLinejoin="round" />
    </svg>
  );
}

// ---- composition --------------------------------------------------------------
function UIMorph({ brand, content, audio }: TemplateProps<C>) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const accent = neutral(brand.primary) ? brand.accent : brand.primary;
  const onAccent = onColor(accent);
  const labels = list(content.tabs).slice(0, 3);
  while (labels.length < 3) labels.push("—");

  const vol = volumeAt(t);
  const extra = vol.over * 0.5; // the slider stretches past max
  const w = sv(t, keysOf((g) => g.w)) + extra;
  const h = sv(t, keysOf((g) => g.h));
  const r = sv(t, keysOf((g) => g.r));
  const shift = extra / 2; // grow to the right, left edge stays put
  const color = svColor(t, [
    [0, INK], [T.check, accent], [T.island, INK], [T.slider, PAPER], [T.toggle, MUTED], [T.flip, accent], [T.tabs, PAPER], [T.enter, INK],
  ]);
  const cam = sv(t, keysOf(camOf), 13, 0.92);
  const [cx, cy] = cursorAt(t);
  const tabsY = sv(t, [[0, 0], [T.chart, -205]]);

  const content2 = (
    <>
      <Layer v={Math.max(vis(t, -Infinity, T.loader), vis(t, T.button, Infinity))}>
        <At x={0} y={0} style={{ color: PAPER, fontSize: 36, fontWeight: 600, letterSpacing: "-0.01em" }}>
          {content.button}
        </At>
      </Layer>
      <Layer v={vis(t, T.loader, T.check)}>
        <Loader t={t} />
      </Layer>
      <Layer v={vis(t, T.check, T.island)}>
        <Check t={t} on={onAccent} />
      </Layer>
      <Layer v={vis(t, T.island, T.player)}>
        <Island t={t} accent={accent} c={content} />
      </Layer>
      <Layer v={vis(t, T.player, T.slider)}>
        <Player t={t} accent={accent} c={content} />
      </Layer>
      <Layer v={vis(t, T.slider, T.toggle)}>
        <Slider t={t} shift={shift} />
      </Layer>
      {/* toggle knob → tab indicator is one continuous object, no swap */}
      {t >= T.toggle - 0.02 && t < T.tabs && <Toggle t={t} />}
      {t >= T.tabs && (
        <Layer v={vis(t, -Infinity, T.cmdk)}>
          <Tabs t={t} labels={labels} y={tabsY} part="indicator" />
        </Layer>
      )}
      <Layer v={vis(t, T.tabs, T.cmdk)}>
        <Tabs t={t} labels={labels} y={tabsY} part="labels" />
      </Layer>
      <Layer v={vis(t, T.chart, T.cmdk)}>
        <Chart t={t} accent={accent} />
      </Layer>
      <Layer v={vis(t, T.cmdk, T.enter)}>
        <Palette t={t} accent={accent} c={content} />
      </Layer>
      <Layer v={vis(t, T.enter, T.button)}>
        <Toast t={t} accent={accent} c={content} />
      </Layer>
    </>
  );

  return (
    <AbsoluteFill style={{ background: CANVAS, fontFamily: font(brand), fontSynthesis: "none", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: S / 2, top: S / 2, width: 0, height: 0, transform: `scale(${cam})` }}>
        <div
          style={{
            position: "absolute",
            left: -w / 2 + shift,
            top: -h / 2,
            width: w,
            height: h,
            borderRadius: r,
            background: color,
            overflow: "hidden",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ position: "absolute", left: w / 2 - shift, top: h / 2, width: 0, height: 0 }}>{content2}</div>
        </div>
      </div>
      <Cursor x={S / 2 + cx * cam} y={S / 2 + cy * cam} t={t} />
      {audio && <Audio src={staticFile("ui-morph/ui-morph-120bpm.wav")} />}
    </AbsoluteFill>
  );
}

export const uiMorph: Template<C> = {
  id: "ui-morph",
  title: "UI Morph",
  outcome: "One shape morphs through 14 product UI states, driven by a cursor",
  category: "Product",
  tags: ["ui motion", "micro-interactions", "dribbble", "cursor", "morph", "square", "loop", "music"],
  width: S,
  height: S,
  fps: 60,
  durationInFrames: 840,
  component: UIMorph,
  soundtrack: "ui-morph/ui-morph-120bpm.wav",
  defaults: {
    button: "Get started",
    track: "Late Shift",
    artist: "Northbound",
    tabs: "Day, Week, Month",
    command: "Export video",
    toast: "Video exported",
  },
  fields: [
    { key: "button", label: "Button label", type: "text" },
    { key: "track", label: "Track title", type: "text" },
    { key: "artist", label: "Artist", type: "text" },
    { key: "tabs", label: "Tabs", type: "text", hint: "Three, comma separated" },
    { key: "command", label: "Command", type: "text", hint: "Its first three letters get typed into ⌘K" },
    { key: "toast", label: "Toast message", type: "text" },
  ],
};
