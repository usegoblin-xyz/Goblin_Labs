import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { onColor, type Brand } from "../brand";
import { font, list, type Template, type TemplateProps } from "../kit";
import { charX, textWidth } from "../metrics";

// Editorial ad: a fast, light-mode brand film built on museum engravings and
// sculpture with the brand painted on top. 14.5 s on a 128 BPM grid; one brand
// dot is the pen that carries every shot into the next:
//   word morph → zoom into the period → mark drawn from construction lines →
//   dot → 3D mark → mark passed between hands and heads (8 cuts) → spiral drawn
//   across 7 cuts → Muybridge gallop → contact sheet → 3D flips → zoom →
//   kinetic headline → square → word cube → mark → logo lockup.
// Images: public domain, The Met Open Access (see scripts/editorial-ad-assets.py).

type C = { word1: string; word2: string; line1: string; line2: string; steps: string };

const W = 1920;
const H = 1080;
const CX = W / 2;
const CY = H / 2;
const PAPER = "#ffffff";
const INK = "#0b0b0c";
const BEAT = 60 / 128;
const b = (n: number) => n * BEAT;

// ---- motion toolkit ----------------------------------------------------------
const c01 = (x: number) => Math.min(1, Math.max(0, x));
const expOut = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * c01(x)));
const expIn = (x: number) => (x <= 0 ? 0 : Math.pow(2, 10 * (c01(x) - 1)));
const expInOut = (x: number) => {
  const v = c01(x);
  if (v === 0 || v === 1) return v;
  return v < 0.5 ? Math.pow(2, 20 * v - 10) / 2 : (2 - Math.pow(2, -20 * v + 10)) / 2;
};
const sineInOut = (x: number) => (1 - Math.cos(Math.PI * c01(x))) / 2;
function spring(tau: number, w = 22, z = 0.8) {
  if (tau <= 0) return 0;
  if (z >= 1) return 1 - Math.exp(-w * tau) * (1 + w * tau);
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
function rgb(c: string) {
  const h = c.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
const neutral = (c: string) => {
  const [r, g, bl] = rgb(c);
  return Math.max(r, g, bl) - Math.min(r, g, bl) < 28;
};
function shade(c: string, k: number) {
  const [r, g, bl] = rgb(c).map((v) => Math.round(v * k));
  return `rgb(${r}, ${g}, ${bl})`;
}

// ---- images --------------------------------------------------------------------
const AR: Record<string, number> = {"arm": 2.736, "butterfly": 0.504, "egret": 0.861, "eye": 1.534, "fist": 0.547, "globe": 1.019, "hand-bend": 0.925, "hand-hold": 0.593, "hand-open": 1.821, "hand-reach-l": 2.254, "hand-reach-r": 3.134, "hand-two": 0.493, "hands-sketch": 1.606, "head-aphrodite": 0.748, "head-apollo": 0.793, "head-athena": 0.623, "head-herakles": 0.809, "moon": 0.901, "palm-tree": 1.288, "palm": 2.386, "rhino": 1.488, "shell": 1.112, "skeleton": 0.555, "tulip": 0.727, "wave-sketch": 0.726, "wave": 1.440};
const INKED = new Set(["arm", "butterfly", "egret", "eye", "globe", "hands-sketch", "palm-tree", "rhino", "shell", "skeleton", "tulip", "wave-sketch", "wave"]);
const HORSE_W = [589, 600, 606, 600, 605, 597, 589, 600, 606, 600, 605, 597];
const HORSE_H = [451, 451, 451, 451, 451, 451, 443, 443, 443, 443, 443, 443];
const src = (n: string) => staticFile(`editorial-ad/${n}.webp`);

// Places image `n` so that its anchor (ax, ay as fractions) lands on (x, y).
function Pic({ n, x, y, h, w, ax = 0.5, ay = 0.5, s = 1, rot = 0, op = 1, style }: { n: string; x: number; y: number; h?: number; w?: number; ax?: number; ay?: number; s?: number; rot?: number; op?: number; style?: CSSProperties }) {
  const ar = AR[n] ?? 1;
  const hh = h ?? (w ?? 600) / ar;
  const ww = w ?? hh * ar;
  if (op <= 0) return null;
  return (
    <Img
      src={src(n)}
      style={{
        position: "absolute",
        left: x - ww * ax,
        top: y - hh * ay,
        width: ww,
        height: hh,
        opacity: op,
        transformOrigin: `${ax * 100}% ${ay * 100}%`,
        transform: `rotate(${rot}deg) scale(${s})`,
        mixBlendMode: INKED.has(n) ? "multiply" : undefined,
        ...style,
      }}
    />
  );
}

// Every image stays mounted (invisible) so cuts never wait on a download.
function Preload() {
  const names = [...Object.keys(AR), ...HORSE_W.map((_, i) => `horse-${String(i).padStart(2, "0")}`)];
  return (
    <div style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0, pointerEvents: "none" }}>
      {names.map((n) => (
        <Img key={n} src={src(n)} style={{ width: 1, height: 1 }} />
      ))}
    </div>
  );
}

// ---- paint -----------------------------------------------------------------------
// A stroke drawn on with a round brush; the visible part runs from `out` to `p`.
function Paint({ d, color, width, p, out = 0, dash }: { d: string; color: string; width: number; p: number; out?: number; dash?: string }) {
  if (p - out < 0.006 || out > 0.985) return null;
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={dash ?? `${p - out} 2`}
      strokeDashoffset={-out}
    />
  );
}
const Svg = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible", ...style }}>
    {children}
  </svg>
);

// Doodles, all built around a point.
const doodle = {
  arrow: (x: number, y: number, s = 1) =>
    `M${x - 300 * s},${y - 210 * s} C${x - 250 * s},${y - 60 * s} ${x - 160 * s},${y - 40 * s} ${x - 78 * s},${y - 30 * s} M${x - 112 * s},${y - 62 * s} L${x - 74 * s},${y - 30 * s} L${x - 114 * s},${y - 4 * s}`,
  ring: (x: number, y: number, rx: number, ry: number, a = -12) => {
    const pts: string[] = [];
    for (let i = 0; i <= 64; i++) {
      const th = (i / 64) * Math.PI * 2.18 - 0.4;
      const r = 1 + 0.06 * Math.sin(i * 0.37);
      const px = Math.cos(th) * rx * r;
      const py = Math.sin(th) * ry * r;
      const ca = Math.cos((a * Math.PI) / 180);
      const sa = Math.sin((a * Math.PI) / 180);
      pts.push(`${(x + px * ca - py * sa).toFixed(1)},${(y + px * sa + py * ca).toFixed(1)}`);
    }
    return `M${pts.join(" L")}`;
  },
  burst: (x: number, y: number, r1: number, r2: number, n = 9) =>
    Array.from({ length: n })
      .map((_, i) => {
        const a = -Math.PI / 2 + ((i - (n - 1) / 2) / n) * Math.PI * 1.25;
        return `M${(x + Math.cos(a) * r1).toFixed(1)},${(y + Math.sin(a) * r1).toFixed(1)} L${(x + Math.cos(a) * r2).toFixed(1)},${(y + Math.sin(a) * r2).toFixed(1)}`;
      })
      .join(" "),
  brackets: (x: number, y: number, w: number, h: number) =>
    `M${x - w + 30},${y - h} L${x - w},${y - h} L${x - w},${y + h} L${x - w + 30},${y + h} M${x + w - 30},${y - h} L${x + w},${y - h} L${x + w},${y + h} L${x + w - 30},${y + h}`,
  swoosh: (x0: number, x1: number, y: number, lift = 26) =>
    `M${x0},${y} C${lift ? x0 + (x1 - x0) * 0.3 : x0},${y + lift} ${x0 + (x1 - x0) * 0.7},${y - lift} ${x1},${y - lift * 0.4}`,
  zigzag: (x: number, y: number, w: number, n = 5) =>
    `M${x - w / 2},${y}` + Array.from({ length: n }).map((_, i) => ` L${x - w / 2 + ((i + 1) * w) / n},${y + (i % 2 ? 0 : -28)}`).join(""),
  orbit: (x: number, y: number, rx: number, ry: number) =>
    `M${x - rx},${y} A${rx},${ry} 0 1 0 ${x + rx},${y} A${rx},${ry} 0 0 0 ${x - rx * 0.6},${y - ry * 0.8}`,
};

type Pal = { p: string; on: string; side: string };
type P = { t: number; b: Brand; c: C; pal: Pal; ff: string; initial: string };

// Brand mark: rounded square with the brand initial.
function Mark({ x, y, size, r, pal, initial, ff, letter = 1, rot = 0, s = 1 }: { x: number; y: number; size: number; r: number; pal: Pal; initial: string; ff: string; letter?: number; rot?: number; s?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: r,
        background: pal.p,
        transform: `rotate(${rot}deg) scale(${s})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {letter > 0 && (
        <span style={{ fontFamily: ff, fontWeight: 800, fontSize: size * 0.62, lineHeight: 1, color: pal.on, opacity: letter, transform: "translateY(-2%)" }}>{initial}</span>
      )}
    </div>
  );
}

// LCS alignment of two words → slots that stay, leave or arrive.
type Slot = { ch: string; kind: "keep" | "del" | "ins" };
function align(a: string, z: string): Slot[] {
  const n = a.length;
  const m = z.length;
  const L = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === z[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out: Slot[] = [];
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === z[j]) {
      out.push({ ch: a[i], kind: "keep" });
      i++;
      j++;
    } else if (j < m && (i >= n || L[i][j + 1] >= L[i + 1][j])) {
      out.push({ ch: z[j], kind: "ins" });
      j++;
    } else {
      out.push({ ch: a[i], kind: "del" });
      i++;
    }
  }
  return out;
}

// ---- 1. word morph, then zoom into the period (0 – 1.875) --------------------------
function WordMorph({ t, c, pal, ff }: P) {
  const size = 250;
  const BY = CY + 92;
  const slots = align(c.word1.trim() || "flat", c.word2.trim() || "float");
  const weight = kf(t, [[0.92, 320], [1.32, 860]]);
  const k = slots.map((s) => (s.kind === "keep" ? 1 : s.kind === "ins" ? expOut(seg(t, 0.64, 0.34)) : 1 - expInOut(seg(t, 0.7, 0.3))));
  const periodK = expOut(seg(t, 1.26, 0.3));
  const widths = slots.map((s, i) => textWidth(s.ch, size, weight) * k[i]);
  const gap = 0.07 * size * periodK;
  const dotR = 0.085 * size;
  const total = widths.reduce((a, v) => a + v, 0) + (gap + dotR * 2) * periodK;
  const left = CX - total / 2;
  const xs: number[] = [];
  widths.reduce((acc, v) => (xs.push(acc), acc + v), left);
  const end = left + widths.reduce((a, v) => a + v, 0);
  const pdx = end + gap + dotR;
  const pdy = BY - dotR;

  // where the pen dot lands: the first arriving letter, else the first leaving one
  const target = slots.findIndex((s) => s.kind === "ins") >= 0 ? slots.findIndex((s) => s.kind === "ins") : slots.findIndex((s) => s.kind === "del");
  const tx = target >= 0 ? xs[target] + Math.max(widths[target], 6) / 2 : CX;
  const fall = seg(t, 0.3, 0.3);
  const dotY = fall < 1 ? lerp(BY - 520, BY - dotR, fall * fall) : BY - dotR - 46 * Math.abs(Math.sin(seg(t, 0.6, 0.12) * Math.PI)) * (1 - seg(t, 0.6, 0.12));
  const dotS = 1 - expIn(seg(t, 0.66, 0.2));

  const zoom = Math.exp(Math.log(95) * expIn(seg(t, 1.6, 0.275)));
  const ruled = expOut(seg(t, 0, 0.32));
  const ruledOut = seg(t, 0.95, 0.3);
  const under = expOut(seg(t, 1.12, 0.3));
  const underOut = expInOut(seg(t, 1.5, 0.15));

  return (
    <Svg>
      <g transform={`translate(${pdx} ${pdy}) scale(${zoom}) translate(${-pdx} ${-pdy})`}>
        <g opacity={1 - ruledOut}>
          {[0, 0.55, 0.73].map((f, i) => (
            <line key={i} x1={CX - 600 * ruled} x2={CX + 600 * ruled} y1={BY - f * size} y2={BY - f * size} stroke={INK} strokeWidth={2} opacity={i === 0 ? 0.9 : 0.35} />
          ))}
          {[-600, 600].map((dx) => (
            <line key={dx} x1={CX + dx * ruled} x2={CX + dx * ruled} y1={BY - 0.73 * size - 18} y2={BY + 18} stroke={INK} strokeWidth={2} opacity={0.35} />
          ))}
        </g>
        <defs>
          <clipPath id="ea-rise">
            <rect x={0} y={BY - size * 1.2} width={W} height={size * 1.48} />
          </clipPath>
        </defs>
        <g clipPath="url(#ea-rise)">
          {slots.map((s, i) => {
            const rise = 1 - expOut(seg(t, 0.04 + i * 0.035, 0.36));
            if (s.kind === "ins" && k[i] <= 0.001) return null;
            if (s.kind === "del" && k[i] <= 0.001) return null;
            const bob = Math.sin(2 * Math.PI * 1.7 * (t - 1.0) - i * 0.7) * 18 * seg(t, 1.0, 0.2) * (1 - seg(t, 1.5, 0.12));
            const drop = s.kind === "del" ? expIn(seg(t, 0.7, 0.3)) * 120 : 0;
            const sc = s.kind === "keep" ? 1 : k[i];
            const cx = xs[i] + widths[i] / 2;
            return (
              <text
                key={i}
                x={xs[i]}
                y={BY}
                fontFamily={ff}
                fontSize={size}
                style={{ fontWeight: weight }}
                fill={s.kind === "ins" ? pal.p : INK}
                transform={`translate(0 ${rise * size * 1.1 - bob + drop}) translate(${cx} ${BY}) scale(${sc}) translate(${-cx} ${-BY})`}
              >
                {s.ch}
              </text>
            );
          })}
        </g>
        {slots.map((s, i) =>
          s.kind === "del" ? (
            <Paint key={`x${i}`} d={`M${xs[i] - 10},${BY - size * 0.36} L${xs[i] + widths[i] + 10},${BY - size * 0.3}`} color={pal.p} width={16} p={expOut(seg(t, 0.58, 0.14))} />
          ) : null
        )}
        {dotS > 0 && t > 0.3 && <circle cx={tx} cy={dotY} r={dotR * dotS} fill={pal.p} />}
        <Paint d={doodle.swoosh(left + 10, end - 10, BY + 56, 18)} color={pal.p} width={18} p={under} out={underOut} />
        {periodK > 0 && <circle cx={pdx} cy={pdy} r={dotR * spring(t - 1.26, 26, 0.55)} fill={pal.p} />}
      </g>
    </Svg>
  );
}

// ---- 2. mark from construction lines → dot → 3D mark (1.875 – 3.75) ---------------
const M2 = 340;
const M3 = 110; // mark size while it travels through the images

function Construct({ t, pal, initial, ff }: P) {
  const u = t - b(4);
  const iris = kf(u, [[0, 1400], [0.32, M2 / 2]]);
  const sq = expInOut(seg(u, 0.3, 0.32));
  const collapse = expInOut(seg(u, 0.94, 0.22));
  const size = u < 0.32 ? iris * 2 : lerp(M2, 34, collapse);
  const radius = u < 0.32 ? iris : lerp(lerp(M2 / 2, M2 * 0.26, sq), 17, collapse);
  const out = expInOut(seg(u, 0.86, 0.24));
  const L = (d0: number, dur: number) => expOut(seg(u, d0, dur));
  const h = M2 / 2;
  const pop = spring(u - 0.62, 26, 0.5);
  const letterDraw = seg(u, 0.46, 0.34);
  const letterFill = seg(u, 0.74, 0.14) * (1 - seg(u, 0.94, 0.06));
  const showFlat = u < 1.16;

  // 3D phase
  const pu = u - 1.16;
  const grow = spring(pu, 17, 0.6);
  const flat = expInOut(seg(u, 1.56, 0.29));
  const size3 = lerp(lerp(34, 300, grow), M3, flat);
  const ry = lerp(lerp(-140, -26, expOut(seg(pu, 0, 0.5))), 0, flat);
  const rx = lerp(lerp(38, 16, expOut(seg(pu, 0, 0.45))), 0, flat);
  const depth = lerp(70, 0, flat) * c01(grow * 1.2);
  const slices = 14;

  return (
    <>
      {showFlat && (
        <>
          <Svg>
            <g stroke={INK} strokeWidth={2} fill="none">
              <Paint d={`M${CX - 430},${CY} L${CX + 430},${CY} M${CX},${CY - 330} L${CX},${CY + 330}`} color={INK} width={2} p={L(0.24, 0.32)} out={out} />
              <Paint d={`M${CX - h},${CY - h} L${CX + h},${CY - h} L${CX + h},${CY + h} L${CX - h},${CY + h} Z`} color={INK} width={2} p={L(0.28, 0.32)} out={out} />
              <Paint d={`M${CX - 260},${CY - 260} L${CX + 260},${CY + 260} M${CX + 260},${CY - 260} L${CX - 260},${CY + 260}`} color={INK} width={2} p={L(0.32, 0.32)} out={out} />
              <Paint d={`M${CX + 245},${CY} A245,245 0 1 1 ${CX + 244.9},${CY - 3}`} color={INK} width={2} p={L(0.3, 0.42)} out={out} />
              <Paint
                d={[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => `M${CX + sx * (h - 88) + 88},${CY + sy * (h - 88)} A88,88 0 1 1 ${CX + sx * (h - 88) + 87.9},${CY + sy * (h - 88) - 2}`).join(" ")}
                color={INK}
                width={2}
                p={L(0.44, 0.3)}
                out={out}
              />
              <Paint d={`M${CX - h},${CY - h - 70} L${CX + h},${CY - h - 70} M${CX - h},${CY - h - 86} L${CX - h},${CY - h - 54} M${CX + h},${CY - h - 86} L${CX + h},${CY - h - 54}`} color={INK} width={2} p={L(0.4, 0.26)} out={out} />
            </g>
            {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy], i) => (
              <circle key={i} cx={CX + sx * 260} cy={CY + sy * 260} r={8 * pop * (1 - out)} fill={pal.p} />
            ))}
          </Svg>
          <div style={{ position: "absolute", left: CX - size / 2, top: CY - size / 2, width: size, height: size, borderRadius: radius, background: pal.p }} />
          {letterFill > 0 && (
            <Svg>
              <text x={CX} y={CY + M2 * 0.62 * 0.36} textAnchor="middle" fontFamily={ff} fontSize={M2 * 0.62} style={{ fontWeight: 800 }} fill={pal.on} opacity={letterFill}>
                {initial}
              </text>
            </Svg>
          )}
          {letterDraw > 0 && letterFill < 1 && collapse < 0.3 && (
            <Svg>
              <text x={CX} y={CY + M2 * 0.62 * 0.36} textAnchor="middle" fontFamily={ff} fontSize={M2 * 0.62} style={{ fontWeight: 800 }} fill="none" stroke={pal.on} strokeWidth={4} strokeDasharray={1400} strokeDashoffset={1400 * (1 - letterDraw)} opacity={1 - collapse * 3}>
                {initial}
              </text>
            </Svg>
          )}
        </>
      )}
      {!showFlat && (
        <>
          <div
            style={{
              position: "absolute",
              left: CX - size3 * 0.6,
              top: CY + size3 * 0.62,
              width: size3 * 1.2,
              height: size3 * 0.16,
              borderRadius: "50%",
              background: "rgba(11,11,12,0.16)",
              filter: "blur(14px)",
              opacity: (1 - flat) * grow,
            }}
          />
          <div style={{ position: "absolute", left: CX, top: CY, perspective: 1400, transformStyle: "preserve-3d" }}>
            <div style={{ position: "absolute", transformStyle: "preserve-3d", transform: `rotateX(${rx}deg) rotateY(${ry}deg)` }}>
              {Array.from({ length: slices }).map((_, n) => {
                const i = slices - 1 - n; // back to front, so the face paints last
                const z = depth / 2 - (i / (slices - 1)) * depth;
                const front = i === 0;
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: -size3 / 2,
                      top: -size3 / 2,
                      width: size3,
                      height: size3,
                      borderRadius: size3 * 0.26,
                      background: front ? pal.p : pal.side,
                      transform: `translateZ(${z}px)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {front && <span style={{ fontFamily: ff, fontWeight: 800, fontSize: size3 * 0.62, lineHeight: 1, color: pal.on, transform: "translateY(-2%)" }}>{initial}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ---- 3. the mark passed between hands and heads: 8 cuts (3.75 – 5.625) -----------
type Shot = { pics: { n: string; h?: number; w?: number; ax: number; ay: number; dx?: number; dy?: number }[]; d: (x: number, y: number) => string; rot: number };
const SHOTS: Shot[] = [
  { pics: [{ n: "hand-hold", h: 940, ax: 0.43, ay: 0.06 }], d: (x, y) => doodle.arrow(x, y, 1.1), rot: -8 },
  { pics: [{ n: "head-athena", h: 1180, ax: 0.7, ay: 0.47 }], d: (x, y) => doodle.ring(x, y, 120, 96, -14), rot: 6 },
  {
    pics: [
      { n: "hand-reach-r", w: 900, ax: 0.985, ay: 0.62, dx: -70 },
      { n: "hand-reach-l", w: 820, ax: 0.02, ay: 0.58, dx: 70 },
    ],
    d: (x, y) => `M${x - 330},${y - 120} Q${x},${y - 300} ${x + 330},${y - 120}`,
    rot: 0,
  },
  { pics: [{ n: "hand-bend", h: 760, ax: 0.2, ay: 0.12 }], d: (x, y) => doodle.orbit(x, y + 40, 200, 46), rot: 10 },
  { pics: [{ n: "eye", w: 1720, ax: 0.478, ay: 0.519 }], d: (x, y) => doodle.burst(x, y, 120, 190, 9), rot: 0 },
  { pics: [{ n: "fist", h: 860, ax: 0.47, ay: 0.03 }], d: (x, y) => doodle.brackets(x, y, 120, 92), rot: -6 },
  { pics: [{ n: "hand-open", w: 1100, ax: 0.22, ay: 0.4 }], d: (x, y) => doodle.swoosh(x - 160, x + 170, y + 110, 22), rot: 4 },
  { pics: [{ n: "head-aphrodite", h: 1300, ax: 0.5, ay: 0.3 }], d: (x, y) => doodle.zigzag(x, y - 130, 260, 6), rot: 0 },
];
const CUT = b(0.5);

function Hands({ t, pal, initial, ff }: P) {
  const u = t - b(8);
  const shot = Math.min(SHOTS.length - 1, Math.floor(u / CUT));
  const su = u - shot * CUT;
  const S = SHOTS[shot];
  const push = 1.07 - 0.07 * (su / CUT);
  const pop = 1 + 0.2 * (1 - expOut(su / 0.12));
  const toDot = expInOut(seg(u, 1.72, 0.155));
  const eye = shot === 4;
  const size = lerp(eye ? 96 : M3, 30, toDot);
  const r = lerp(eye ? 48 : M3 * 0.26, 15, toDot);
  const mx = lerp(CX, CX + 18, toDot);
  return (
    <>
      {toDot < 1 &&
        S.pics.map((p, i) => (
          <Pic key={`${shot}-${i}`} n={p.n} x={CX + (p.dx ?? 0)} y={CY + (p.dy ?? 0)} h={p.h} w={p.w} ax={p.ax} ay={p.ay} s={push} op={1 - toDot} />
        ))}
      <Svg>
        <Paint d={S.d(CX, CY)} color={pal.p} width={10} p={expOut(seg(su, 0.02, 0.16))} out={toDot} />
      </Svg>
      <Mark x={mx} y={CY} size={size} r={r} pal={pal} initial={initial} ff={ff} letter={eye ? 0 : 1 - toDot * 2} rot={S.rot * (1 - toDot)} s={pop} />
    </>
  );
}

// ---- 4. one spiral drawn across 7 cuts (5.625 – 7.5) --------------------------------
const SPIRAL = (() => {
  const pts: { x: number; y: number; l: number }[] = [];
  const TH = 4.75 * Math.PI;
  let l = 0;
  for (let th = 0; th <= TH + 1e-6; th += 0.035) {
    const r = 18 + 30 * th;
    const x = CX + r * Math.cos(th);
    const y = CY + r * Math.sin(th);
    if (pts.length) l += Math.hypot(x - pts[pts.length - 1].x, y - pts[pts.length - 1].y);
    pts.push({ x, y, l });
  }
  const total = l;
  return { d: "M" + pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L"), pts: pts.map((p) => ({ ...p, f: p.l / total })) };
})();
function spiralAt(f: number) {
  const P = SPIRAL.pts;
  let lo = 0;
  let hi = P.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (P[mid].f < f) lo = mid;
    else hi = mid;
  }
  const a = P[lo];
  const z = P[hi];
  const k = z.f === a.f ? 0 : (f - a.f) / (z.f - a.f);
  return { x: lerp(a.x, z.x, k), y: lerp(a.y, z.y, k) };
}
const GROUND = SPIRAL.pts[SPIRAL.pts.length - 1];

const SPIRAL_SHOTS: { n: string; h?: number; w?: number; x: number; y: number; tone?: boolean }[] = [
  { n: "rhino", w: 1260, x: CX + 40, y: CY + 30 },
  { n: "globe", h: 900, x: CX, y: CY },
  { n: "wave", w: 1440, x: CX, y: CY + 10 },
  { n: "moon", h: 700, x: CX, y: CY, tone: true },
  { n: "tulip", h: 1040, x: CX - 140, y: CY + 30 },
  { n: "shell", w: 1000, x: CX + 90, y: CY },
  { n: "skeleton", h: 1040, x: CX + 170, y: CY + 30 },
];

function Spiral({ t, pal }: P) {
  const u = t - b(12);
  const p = kf(u, [[0, 0], [1.62, 1]], (x) => 0.12 * x + 0.88 * sineInOut(x));
  const out = expInOut(seg(u, 1.5, 0.32));
  const shot = Math.floor(u / CUT);
  const su = u - shot * CUT;
  const rot = lerp(-28, 0, expOut(seg(u, 0, 1.875)));
  const zoom = lerp(1.14, 1, expOut(seg(u, 0, 1.875)));
  const head = spiralAt(p);
  const S = shot < SPIRAL_SHOTS.length ? SPIRAL_SHOTS[shot] : null;
  const push = 1.06 - 0.06 * (su / CUT);
  return (
    <>
      {S && !S.tone && <Pic key={S.n} n={S.n} x={S.x} y={S.y} h={S.h} w={S.w} s={push} />}
      {S && S.tone && (
        <div style={{ position: "absolute", left: S.x - 330, top: S.y - 330, width: 660, height: 660, borderRadius: "50%", overflow: "hidden", transform: `scale(${push})` }}>
          <Pic n={S.n} x={330} y={330} h={760} ay={0.5} />
        </div>
      )}
      <Svg>
        <g transform={`rotate(${rot} ${CX} ${CY}) translate(${CX} ${CY}) scale(${zoom}) translate(${-CX} ${-CY})`}>
          <Paint d={SPIRAL.d} color={pal.p} width={16} p={p} out={out} />
          <circle cx={head.x} cy={head.y} r={15} fill={pal.p} />
        </g>
      </Svg>
    </>
  );
}

// ---- 5. Muybridge gallop → contact sheet → 3D flips → zoom (7.5 – 9.375) ------------
const CELL_W = 330;
const CELL_H = 248;
const CELL_GAP = 22;
const BACKS = ["head-herakles", "wave-sketch", "", "egret", "butterfly"];

function Horse({ frame, x, y, w, op = 1 }: { frame: number; x: number; y: number; w: number; op?: number }) {
  const f = ((frame % 12) + 12) % 12;
  const k = w / 600;
  return (
    <Img
      src={src(`horse-${String(f).padStart(2, "0")}`)}
      style={{ position: "absolute", left: x - (600 * k) / 2, top: y - HORSE_H[f] * k, width: HORSE_W[f] * k, height: HORSE_H[f] * k, opacity: op }}
    />
  );
}

function Gallop({ t, pal }: P) {
  const u = t - b(16);
  const gy = GROUND.y;
  const line = expOut(seg(u, 0, 0.28));
  const run = Math.floor(u * 20);
  const enter = expOut(seg(u, 0.04, 0.42));
  const sheet = expInOut(seg(u, 0.7, 0.3)); // single horse → contact sheet
  const lineOut = expInOut(seg(u, 0.68, 0.2));
  const hx = lerp(W + 520, CX, enter);
  const big = 820;
  const flipAt = (i: number) => 0.98 + Math.abs(i - 2) * 0.06;
  const zoom = Math.exp(Math.log(9) * expIn(seg(u, 1.42, 0.455)));
  const cells = [-2, -1, 0, 1, 2];
  const speed = expOut(seg(u, 0.18, 0.3)) * (1 - lineOut);

  return (
    <>
      <Svg>
        <line x1={lerp(GROUND.x, 200, line)} x2={lerp(GROUND.x, 1720, line)} y1={gy} y2={gy} stroke={INK} strokeWidth={3} opacity={1 - lineOut} />
        {Array.from({ length: 14 }).map((_, i) => {
          const x = 200 + ((i * 118 + u * 1500) % 1520);
          return <line key={i} x1={x} x2={x - 26} y1={gy + 18} y2={gy + 18} stroke={INK} strokeWidth={3} opacity={line * (1 - lineOut) * 0.5} />;
        })}
        {u < 0.2 && <circle cx={lerp(GROUND.x, 1720, expOut(seg(u, 0, 0.2)))} cy={gy} r={15 * (1 - seg(u, 0.12, 0.08))} fill={pal.p} />}
        {[0, 1, 2].map((i) => {
          const y = gy - 420 + i * 120;
          const x0 = hx + 300 + i * 40;
          const len = (380 - i * 80) * speed;
          return <Paint key={i} d={`M${x0},${y} L${x0 + 420},${y}`} color={pal.p} width={16 - i * 3} p={c01(len / 420)} />;
        })}
      </Svg>
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${CX}px ${CY}px`, transform: `scale(${zoom})` }}>
        {sheet > 0 &&
          cells.map((ci, i) => {
            const flip = expInOut(seg(u, flipAt(i), 0.3));
            const x = CX + ci * (CELL_W + CELL_GAP) * sheet;
            const back = BACKS[i];
            const showBack = flip > 0.5;
            return (
              <div key={ci} style={{ position: "absolute", left: x - CELL_W / 2, top: CY - CELL_H / 2, width: CELL_W, height: CELL_H, perspective: 1200 }}>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 22,
                    overflow: "hidden",
                    background: showBack ? (back ? PAPER : PAPER) : "#f2f2f2",
                    boxShadow: showBack && back ? "inset 0 0 0 2px #0b0b0c" : undefined,
                    transform: `rotateY(${flip * 180}deg) ${showBack ? "rotateY(180deg)" : ""}`,
                    opacity: sheet,
                  }}
                >
                  {!showBack && <Horse frame={run + i * 2} x={CELL_W / 2} y={CELL_H - 12} w={300} op={ci === 0 && sheet < 1 ? 0 : 1} />}
                  {showBack && back && <Pic n={back} x={CELL_W / 2} y={CELL_H / 2 + (back.startsWith("head") ? 30 : 0)} h={back.startsWith("head") ? CELL_H * 1.3 : CELL_H * 0.9} />}
                  {showBack && !back && <div style={{ position: "absolute", left: CELL_W / 2 - 10, top: CELL_H / 2 - 10, width: 20, height: 20, borderRadius: 10, background: pal.p }} />}
                </div>
              </div>
            );
          })}
        {sheet < 1 && <Horse frame={run} x={lerp(hx, CX, sheet)} y={lerp(gy + 6, CY + CELL_H / 2 - 12, sheet)} w={lerp(big, 300, sheet)} />}
      </div>
    </>
  );
}

// ---- 6. kinetic headline (9.375 – 11.1) ----------------------------------------------
function Headline({ t, c, pal, ff }: P) {
  const u = t - b(20);
  const l1 = c.line1.trim() || "Make it";
  const l2 = c.line2.trim() || "move";
  const s2 = Math.min(330, 1300 / Math.max(1, textWidth(l2 + ".", 1, 900)));
  const s1 = Math.min(140, 1300 / Math.max(1, textWidth(l1, 1, 600)));
  const y2 = CY + 190;
  const y1 = CY - 120;
  const xs2 = charX(l2, s2, 900);
  const w2 = xs2[xs2.length - 1];
  const dotR = 0.085 * s2;
  const gap = 0.07 * s2;
  const total2 = w2 + gap + dotR * 2;
  const x2 = CX - total2 / 2;
  const px = x2 + w2 + gap + dotR;
  const py = y2 - dotR;

  // open: the dot at the centre is the period, zoomed; zoom out to the layout
  const z0 = 60 / dotR;
  const e = expOut(seg(u, 0, 0.62));
  const zoom = lerp(z0, 1, e);
  const ox = lerp(CX, px, e);
  const oy = lerp(CY, py, e);
  const tex = 1 - seg(u, 0.42, 0.25);

  // line 1 types in with the dot as cursor
  const typed = Math.floor(c01((u - 0.5) / 0.4) * l1.length + 1e-6);
  const xs1 = charX(l1, s1, 620);
  const x1 = CX - xs1[xs1.length - 1] / 2;
  const cursor = u > 0.46 && u < 1.0;

  // collapse into the cube's front face
  const col = expInOut(seg(u, 1.34, 0.24));
  const sq = expInOut(seg(u, 1.42, 0.305));
  const sqSize = lerp(dotR * 2, 420, sq);
  const sqX = lerp(px, CX, sq);
  const sqY = lerp(py, CY - 10, sq);
  const textScale = 1 - col;

  const ring = expOut(seg(u, 0.92, 0.32));
  return (
    <>
      <Svg>
        <defs>
          <pattern id="ea-tex" patternUnits="userSpaceOnUse" x={x2} y={y2 - s2} width={w2 + 40} height={s2 * 1.2}>
            <rect width={w2 + 40} height={s2 * 1.2} fill={pal.p} />
            <image href={src("wave")} x={0} y={-s2 * 0.2} width={w2 + 40} height={(w2 + 40) / AR.wave} preserveAspectRatio="xMidYMid slice" style={{ mixBlendMode: "multiply" }} />
          </pattern>
        </defs>
        <g transform={`translate(${ox} ${oy}) scale(${zoom * textScale}) translate(${-px} ${-py})`} opacity={1 - col}>
          {l2.split("").map((ch, i) => {
            const rise = 1 - expOut(seg(u, 0.02 + i * 0.03, 0.3));
            const wave = Math.sin(2 * Math.PI * 1.8 * (u - 0.62) - i * 0.85) * 26 * seg(u, 0.62, 0.15) * (1 - seg(u, 1.28, 0.12));
            return (
              <g key={i} transform={`translate(0 ${rise * s2 * 0.9 - wave})`}>
                <text x={x2 + xs2[i]} y={y2} fontFamily={ff} fontSize={s2} style={{ fontWeight: 900 }} fill={INK}>
                  {ch}
                </text>
                {tex > 0 && (
                  <text x={x2 + xs2[i]} y={y2} fontFamily={ff} fontSize={s2} style={{ fontWeight: 900 }} fill="url(#ea-tex)" opacity={tex}>
                    {ch}
                  </text>
                )}
              </g>
            );
          })}
          {sq <= 0 && <circle cx={px} cy={py} r={dotR} fill={pal.p} />}
          <Paint d={doodle.ring(CX, y2 - s2 * 0.27, total2 / 2 + 70, s2 * 0.46, -3)} color={pal.p} width={14} p={ring} out={expInOut(seg(u, 1.3, 0.12))} />
        </g>
        <g transform={`translate(${CX} ${CY}) scale(${textScale}) translate(${-CX} ${-CY})`} opacity={1 - col}>
          {l1.split("").map((ch, i) =>
            i < typed ? (
              <text key={i} x={x1 + xs1[i]} y={y1} fontFamily={ff} fontSize={s1} style={{ fontWeight: 620 }} fill={INK}>
                {ch}
              </text>
            ) : null
          )}
          {cursor && <circle cx={x1 + xs1[typed] + 22} cy={y1 - s1 * 0.32} r={13 * (1 - seg(u, 0.92, 0.08))} fill={pal.p} />}
        </g>
      </Svg>
      {sq > 0 && <div style={{ position: "absolute", left: sqX - sqSize / 2, top: sqY - sqSize / 2, width: sqSize, height: sqSize, borderRadius: lerp(dotR, 0, sq), background: pal.p }} />}
    </>
  );
}

// ---- 7. word cube (11.1 – 12.66) ----------------------------------------------------
const CUBE = 420;
const TURNS = [0.38, 0.62, 0.85, 1.09, 1.32];

function Cube({ t, c, pal, ff, initial }: P) {
  const u = t - 11.1;
  const s = TURNS.reduce((a, t0) => a + expInOut(seg(u, t0, 0.2)), 0);
  const tilt = kf(u, [[0.02, 0], [0.34, -16], [1.3, -16], [1.52, 0]]);
  const yaw = kf(u, [[0.02, 0], [0.34, -18], [1.3, -18], [1.52, 0]]);
  const steps = list(c.steps);
  const [w1, w2, w3] = [steps[0] ?? "Design", steps[1] ?? "Animate", steps[2] ?? "Ship"];
  const states: ({ word: string } | { img: string } | { mark: true })[] = [{ word: w1 }, { img: "head-apollo" }, { word: w2 }, { img: "hand-two" }, { word: w3 }, { mark: true }];
  const fl = Math.floor(s + 1e-6);
  const face = (j: number) => {
    for (let k = fl - 1; k <= fl + 2; k++) if (((k % 4) + 4) % 4 === j) return states[Math.max(0, Math.min(states.length - 1, k))];
    return states[0];
  };
  const wordSize = (w: string) => Math.min(108, (CUBE - 80) / Math.max(0.1, textWidth(w, 1, 800)));
  return (
    <>
      <div style={{ position: "absolute", left: CX - CUBE * 0.6, top: CY + CUBE * 0.62, width: CUBE * 1.2, height: 60, borderRadius: "50%", background: "rgba(11,11,12,0.14)", filter: "blur(18px)", opacity: c01(-tilt / 16) }} />
      <div style={{ position: "absolute", left: CX, top: CY - 10, perspective: 1800, transformStyle: "preserve-3d" }}>
        <div style={{ position: "absolute", transformStyle: "preserve-3d", transform: `translateZ(${-CUBE / 2}px) rotateX(${tilt}deg) rotateY(${yaw - 90 * s}deg)` }}>
          {[0, 1, 2, 3].map((j) => {
            const st = face(j);
            const brandFace = !("img" in st);
            return (
              <div
                key={j}
                style={{
                  position: "absolute",
                  left: -CUBE / 2,
                  top: -CUBE / 2,
                  width: CUBE,
                  height: CUBE,
                  background: brandFace ? pal.p : PAPER,
                  boxShadow: brandFace ? undefined : `inset 0 0 0 3px ${INK}`,
                  transform: `rotateY(${90 * j}deg) translateZ(${CUBE / 2}px)`,
                  backfaceVisibility: "hidden",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {"word" in st && (
                  <span
                    style={{
                      fontFamily: ff,
                      fontWeight: 800,
                      fontSize: wordSize(st.word),
                      letterSpacing: "-0.03em",
                      color: pal.on,
                      whiteSpace: "nowrap",
                      opacity: st === states[0] ? expOut(seg(u, 0, 0.16)) : 1,
                      transform: st === states[0] ? `translateY(${(1 - expOut(seg(u, 0, 0.22))) * 40}px)` : undefined,
                    }}
                  >
                    {st.word}
                  </span>
                )}
                {"img" in st && <Pic n={st.img} x={CUBE / 2} y={CUBE + 4} h={CUBE * 1.05} ay={1} />}
                {"mark" in st && <span style={{ fontFamily: ff, fontWeight: 800, fontSize: CUBE * 0.62, lineHeight: 1, color: pal.on, transform: "translateY(-2%)" }}>{initial}</span>}
              </div>
            );
          })}
          {/* top and bottom caps so the cube reads solid while tilted */}
          {[-1, 1].map((d) => (
            <div key={d} style={{ position: "absolute", left: -CUBE / 2, top: -CUBE / 2, width: CUBE, height: CUBE, background: pal.side, transform: `rotateX(${90 * d}deg) translateZ(${CUBE / 2}px)` }} />
          ))}
        </div>
      </div>
    </>
  );
}

// ---- 8. logo lockup (12.66 – end) -----------------------------------------------------
function Lockup({ t, b: brand, pal, ff, initial }: P) {
  const u = t - 12.66;
  const name = brand.name.trim() || "Goblin";
  const fs = Math.min(150, 980 / Math.max(0.1, textWidth(name, 1, 800)));
  const xs = charX(name, fs, 800, -0.02);
  const nameW = xs[xs.length - 1];
  const m = 210;
  const gap = 46;
  const total = m + gap + nameW;
  const move = expInOut(seg(u, 0, 0.42));
  const mx = lerp(CX, CX - total / 2 + m / 2, move);
  const my = lerp(CY - 10, CY, move);
  const size = lerp(CUBE, m, move);
  const r = lerp(0, m * 0.26, move);
  const hit = 1 + 0.06 * Math.sin(seg(u, 0.47, 0.3) * Math.PI) * (1 - seg(u, 0.47, 0.3));
  const tx = CX - total / 2 + m + gap;
  const by = CY + fs * 0.36;
  const typed = Math.floor(c01((u - 0.44) / (0.05 * name.length)) * name.length + 1e-6);
  const cursor = u > 0.4 && u < 0.6 + 0.05 * name.length;
  return (
    <>
      <Mark x={mx} y={my} size={size} r={r} pal={pal} initial={initial} ff={ff} s={hit} />
      <Svg>
        {name.split("").map((ch, i) =>
          i < typed ? (
            <text key={i} x={tx + xs[i]} y={by} fontFamily={ff} fontSize={fs} style={{ fontWeight: 800 }} fill={INK}>
              {ch}
            </text>
          ) : null
        )}
        {cursor && <circle cx={tx + xs[typed] + 20} cy={by - fs * 0.3} r={14 * (1 - seg(u, 0.5 + 0.05 * name.length, 0.1))} fill={pal.p} />}
      </Svg>
    </>
  );
}

// ---- composition ---------------------------------------------------------------------
export function EditorialAd({ brand, content, audio }: TemplateProps<C>) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p = neutral(brand.primary) ? brand.accent : brand.primary;
  const pal: Pal = { p, on: onColor(p), side: shade(p, 0.62) };
  const ff = brand.font === "inter" ? '"Inter Variable", Inter, system-ui, sans-serif' : font(brand);
  const initial = (brand.name.trim()[0] ?? "G").toUpperCase();
  const props: P = { t, b: brand, c: content, pal, ff, initial };

  let scene: ReactNode;
  if (t < b(4)) scene = <WordMorph {...props} />;
  else if (t < b(8)) scene = <Construct {...props} />;
  else if (t < b(12)) scene = <Hands {...props} />;
  else if (t < b(16)) scene = <Spiral {...props} />;
  else if (t < b(20)) scene = <Gallop {...props} />;
  else if (t < 11.1) scene = <Headline {...props} />;
  else if (t < 12.66) scene = <Cube {...props} />;
  else scene = <Lockup {...props} />;

  return (
    <AbsoluteFill style={{ background: PAPER, overflow: "hidden", fontFamily: ff }}>
      <Preload />
      {scene}
      {audio && <Audio src={staticFile("editorial-ad/editorial-ad-128bpm.wav")} />}
    </AbsoluteFill>
  );
}

export const editorialAd: Template<C> = {
  id: "editorial-ad",
  title: "Editorial Brand Film",
  outcome: "An art-led brand film that ends on your logo",
  category: "Brand",
  tags: ["ad", "editorial", "art", "3D", "kinetic type", "logo"],
  width: W,
  height: H,
  fps: 60,
  durationInFrames: 870,
  component: EditorialAd,
  defaults: { word1: "flat", word2: "float", line1: "Make it", line2: "move", steps: "Design, Animate, Ship" },
  fields: [
    { key: "word1", label: "Word (before)", type: "text", hint: "Morphs into the next word" },
    { key: "word2", label: "Word (after)", type: "text" },
    { key: "line1", label: "Headline line 1", type: "text" },
    { key: "line2", label: "Headline line 2", type: "text", hint: "Big word, ends with your brand dot" },
    { key: "steps", label: "Cube words", type: "text", hint: "Three words, comma separated" },
  ],
  soundtrack: "editorial-ad/editorial-ad-128bpm.wav",
};
