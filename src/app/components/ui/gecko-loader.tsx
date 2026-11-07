// Goblin's loading state: about 1,700 dots stream through the gecko in 3D.
// Each dot drifts in, settles into place and drifts out on its own loop, so
// the shape is always there but never still. Set `done` and every dot settles
// into the gecko, then `onSettled` fires (for fading into whatever loaded).
//
// Every loader on the page shares one clock and one set of dots, so swapping
// one loader for another in the same spot carries on without a jump.
import { useEffect, useRef } from "react";
import { GECKO_PATH } from "@/library/gecko";
import { cn } from "./utils";

type Props = {
  className?: string;
  /** Dot colour. Defaults to Goblin's light green. */
  color?: string;
  /** Size of the gecko relative to the shorter side of the box. */
  scale?: number;
  /** When true, every dot settles into the gecko. */
  done?: boolean;
  onSettled?: () => void;
  label?: string;
  /** Avatar size: a lighter set of bigger dots so the shape still reads at ~32px. */
  small?: boolean;
};

type Dot = { x: number; y: number; z: number; sx: number; sy: number; sz: number; ph: number };

const N = 1700;
const LOOP = 5.5; // seconds for one dot's in–settle–out loop
let DOTS: Dot[] | null = null;

// Points inside the real silhouette, plus a far-away start for each.
function dots(): Dot[] {
  if (DOTS) return DOTS;
  const off = document.createElement("canvas");
  off.width = off.height = 300;
  const oc = off.getContext("2d", { willReadFrequently: true })!;
  oc.scale(3, 3);
  oc.fill(new Path2D(GECKO_PATH));
  const img = oc.getImageData(0, 0, 300, 300).data;
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const out: Dot[] = [];
  while (out.length < N) {
    const x = rnd() * 100;
    const y = rnd() * 100;
    if (img[(Math.floor(y * 3) * 300 + Math.floor(x * 3)) * 4 + 3] < 128) continue;
    const u = rnd() * 2 - 1;
    const th = rnd() * Math.PI * 2;
    const r = 46 + rnd() * 26;
    const s = Math.sqrt(1 - u * u);
    out.push({ x: x - 50, y: y - 50, z: (rnd() - 0.5) * 7, sx: s * Math.cos(th) * r, sy: u * r, sz: s * Math.sin(th) * r, ph: rnd() });
  }
  return (DOTS = out);
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clock = () => performance.now() / 1000;

export function GeckoLoader({ className, color = "#b6f09c", scale = 0.62, done = false, onSettled, label = "Loading", small = false }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const doneAt = useRef<number | null>(null);
  const settled = useRef(onSettled);
  settled.current = onSettled;

  useEffect(() => {
    if (done && doneAt.current === null) doneAt.current = clock();
    if (!done) doneAt.current = null;
  }, [done]);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const pts = dots();
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let visible = true;
    let fired = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (!w || !h) return;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const t = reduce.matches ? 0 : clock();
      // Settling: every dot eases the rest of the way home over 0.7 s.
      const settle = doneAt.current === null ? 0 : ease(Math.min(1, (clock() - doneAt.current) / 0.7));
      if (settle >= 1 && !fired) {
        fired = true;
        settled.current?.();
      }

      const k = (Math.min(w, h) * (small ? 0.92 : scale)) / 100;
      const ox = w / 2;
      const oy = h / 2;
      const rotY = Math.sin(t * 0.55) * 0.5 * (1 - settle);
      const rotX = Math.sin(t * 0.37 + 1) * 0.16 * (1 - settle);
      const cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      const step = small ? 4 : 1;
      const minDot = small ? 1.1 * dpr : 0;
      for (let i = 0; i < pts.length; i += step) {
        const p = pts[i];
        let mix: number;
        if (reduce.matches) mix = 1;
        else {
          const u = (t / LOOP + p.ph) % 1;
          mix = u < 0.18 ? ease(u / 0.18) : u < 0.88 ? 1 : 1 - ease((u - 0.88) / 0.12);
        }
        mix = mix + (1 - mix) * settle;
        const sw = (1 - mix) * 1.6 + t * 0.25;
        const fx = p.sx * Math.cos(sw) - p.sz * Math.sin(sw);
        const fz = p.sx * Math.sin(sw) + p.sz * Math.cos(sw);
        const breathe = Math.sin(t * 2 + p.ph * 6.283) * 0.35 * mix * (1 - settle);
        const x = fx + (p.x - fx) * mix;
        const y = p.sy + (p.y - p.sy) * mix;
        const z = fz + (p.z + breathe - fz) * mix;
        const rx = x * cy + z * sy;
        const rz0 = -x * sy + z * cy;
        const ry = y * cx - rz0 * sx;
        const rz = y * sx + rz0 * cx;
        const f = 180 / (180 + rz);
        const r = Math.max(minDot, (0.45 + 0.4 * mix) * f * k);
        ctx.globalAlpha = Math.max(0.06, Math.min(1, (0.12 + 0.88 * mix * mix) * (0.75 + 0.25 * f)));
        ctx.fillRect(ox + rx * f * k - r / 2, oy + ry * f * k - r / 2, r, r);
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [color, scale, small]);

  return <canvas ref={ref} role="img" aria-label={label} className={cn("block h-full w-full", className)} />;
}

// A full-area loader for whole pages and route changes.
export function PageLoader() {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-[#050505]">
      <div className="h-40 w-40">
        <GeckoLoader label="Loading page" />
      </div>
    </div>
  );
}
