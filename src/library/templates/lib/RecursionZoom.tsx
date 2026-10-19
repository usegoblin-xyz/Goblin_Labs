import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { MONO, SERIF, Svg, Track, Txt, c01, expInOut, fontOf, nameOf, palette, seg, useT, type Pal } from "../../motion";

type C = { line: string };

// Recursion, explained recursively: every frame contains a smaller copy of
// itself, and the camera zooms into it forever. Each level tells the same
// idea in a different style (terminal, newspaper, cartoon, blueprint),
// until the base case stops the fall.
const STYLES = ["terminal", "paper", "cartoon", "blueprint", "base"] as const;
const CAPS = ["recurse(n) calls recurse(n - 1)", "LOCAL FUNCTION CALLS ITSELF, AGAIN", "it's turtles all the way down!", "FIG. 4 — A PROBLEM INSIDE A SMALLER PROBLEM", "n = 0. Stop."];

function Level({ k, pal, ff, size }: { k: number; pal: Pal; ff: string; size: number }) {
  const st = STYLES[Math.min(4, k)];
  const bg = st === "terminal" ? "#0c0d10" : st === "paper" ? "#f1ece0" : st === "cartoon" ? "#ffe66b" : st === "blueprint" ? "#1d4fa8" : pal.v;
  const fg = st === "terminal" ? "#39ff88" : st === "paper" ? "#1a1a1a" : st === "cartoon" ? "#1a1a1a" : st === "blueprint" ? "#e8f0ff" : pal.onV;
  const font = st === "terminal" ? MONO : st === "paper" ? SERIF : st === "blueprint" ? MONO : ff;
  return (
    <div style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden" }}>
      {st === "blueprint" && <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.15) 2px, transparent 2px)", backgroundSize: `${size / 24}px ${size / 24}px` }} />}
      {st === "cartoon" && <div style={{ position: "absolute", inset: size * 0.02, border: `${size * 0.008}px solid #1a1a1a`, borderRadius: size * 0.03 }} />}
      <div style={{ position: "absolute", left: "8%", top: "10%", right: "8%", fontFamily: font, fontSize: size * 0.045, fontWeight: st === "paper" ? 400 : 800, color: fg, lineHeight: 1.1, fontStyle: st === "paper" ? "italic" : undefined, textTransform: st === "paper" ? undefined : undefined }}>
        {st === "paper" && <div style={{ fontSize: size * 0.02, letterSpacing: "0.3em", fontStyle: "normal", marginBottom: size * 0.01 }}>THE DAILY STACK</div>}
        {CAPS[Math.min(4, k)]}
      </div>
    </div>
  );
}

export default function RecursionZoom({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const S = 0.32; // child frame scale
  const CX = 0.66; // child centre, as fractions of the parent frame
  const CY = 0.66;
  // the zoom: one level every 1.7 s, holding briefly on each
  const per = 1.7;
  const z = Math.min(4, Math.max(0, (t - 0.8) / per));
  const lvl = Math.floor(z);
  const f = expInOut(c01((z - lvl - 0.45) / 0.55));
  const depth = Math.min(4, lvl + f);
  const endP = c01((t - 9.6) / 0.8);
  // Zoom about the fixed point P of the map that takes a frame to its child,
  // so every level hands off to the next seamlessly.
  const W = 1920;
  const H = 1080;
  const base = Math.floor(depth);
  const frac = depth - base;
  const m = Math.pow(1 / S, frac);
  const d = { x: (CX - 0.5) * W, y: (CY - 0.5) * H };
  const P = { x: (W / 2 + d.x - S * (W / 2)) / (1 - S), y: (H / 2 + d.y - S * (H / 2)) / (1 - S) };
  const levels = [] as JSX.Element[];
  let cx = W / 2;
  let cy = H / 2;
  let sc = 1;
  for (let k = base; k <= Math.min(4, base + 3); k++) {
    const sx = P.x + m * (cx - P.x);
    const sy = P.y + m * (cy - P.y);
    const w = W * sc * m;
    const h = H * sc * m;
    levels.push(
      <div key={k} style={{ position: "absolute", left: sx - w / 2, top: sy - h / 2, width: w, height: h, boxShadow: k > base ? "0 20px 50px rgba(0,0,0,0.4)" : undefined, borderRadius: k > base ? Math.max(4, w * 0.008) : 0, overflow: "hidden" }}>
        <Level k={k} pal={pal} ff={ff} size={w} />
      </div>,
    );
    cx += d.x * sc;
    cy += d.y * sc;
    sc *= S;
  }

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      {endP < 1 && <div style={{ position: "absolute", inset: 0, opacity: 1 - c01((t - 9.4) * 3) }}>{levels}</div>}
      {endP > 0 && (
        <AbsoluteFill style={{ background: pal.bg }}>
          <Svg>
            <Txt text={c.line || "To understand recursion, see: recursion."} x={960} y={530} size={70} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.03} />
            <Txt text={nameOf(b)} x={960} y={640} size={48} weight={600} color={pal.v} font={ff} p={c01((t - 10.0) / 0.6)} mode="fade" />
          </Svg>
        </AbsoluteFill>
      )}
      <Track src="tracks/recursion-zoom.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _s = seg;
