// Goblin's launch film for the chat: a founder talks a launch video through with
// Goblin, it builds one, opens it in the side panel, changes it, makes an
// explainer and exports an MP4. Told as one conversation, like a chat-led
// product film, in Goblin's own dark look. 1920×1080, 30 fps, 58 s.
//   node scripts/render.mjs goblin-chat-launch out/goblin-chat-launch.mp4 --blur 0
// Timings live in render/chat-launch-cues.json, shared with the soundtrack
// (scripts/chat-launch-audio.py → public/launch/chat-launch-mix.wav).
import { useMemo, type CSSProperties, type ReactNode } from "react";
import { AbsoluteFill, Audio, Loop, Sequence, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Brand } from "../src/library/brand";
import PortraitReel from "../src/library/templates/lib/PortraitReel";
import { GECKO_PATH } from "../src/library/gecko";
import { backOut, c01, cubicInOut, expInOut, expOut, lerp, seg, spring } from "../src/library/motion";
import CUES from "./chat-launch-cues.json";

// Fonts load from local files so the render needs no network: Inter from the
// system (or the page's own), Instrument Serif (OFL) from public/launch/fonts.
const INTER = "Inter, system-ui, sans-serif";
const SERIF = '"Instrument Serif", Georgia, serif';
if (typeof document !== "undefined") {
  const wait = delayRender("Loading Instrument Serif");
  const faces = [
    new FontFace("Instrument Serif", `url(${staticFile("launch/fonts/instrument-serif-latin-400-normal.woff2")})`, { style: "normal", weight: "400" }),
    new FontFace("Instrument Serif", `url(${staticFile("launch/fonts/instrument-serif-latin-400-italic.woff2")})`, { style: "italic", weight: "400" }),
  ];
  Promise.all(faces.map((f) => f.load().then((ff) => document.fonts.add(ff))))
    .catch((e) => console.error("font load failed", e))
    .finally(() => continueRender(wait));
}

export const CHAT_LAUNCH_SECONDS = CUES.duration;

const BG = "#050505";
const FG = "#f5f5f2";
const GREEN = "#22a03a";
const MINT = "#b6f09c";
const LEFT = 380; // chat column
const RIGHT = 1540;
type Span = [number, number];
const S = CUES.scenes as unknown as Record<string, Span>;

// ---- helpers ------------------------------------------------------------------
const typed = (s: string, t: number, at: number, cps: number) => s.slice(0, Math.max(0, Math.floor((t - at) * cps)));
const user = (i: number) => CUES.user[i];
const goblin = (i: number) => CUES.goblin[i];
const USER_CPS = 46;
const GOBLIN_CPS = 38;
const doneAt = (m: { at: number; text: string }, cps: number) => m.at + m.text.length / cps;

function fade(t: number, [a, b]: Span, fin = 0.3, fout = 0.3) {
  return Math.min(cubicInOut(seg(t, a, fin)), 1 - cubicInOut(seg(t, b - fout, fout)));
}

function Scene({ t, span, children, style }: { t: number; span: Span; children: ReactNode; style?: CSSProperties }) {
  if (t < span[0] || t > span[1]) return null;
  return <AbsoluteFill style={{ opacity: fade(t, span), ...style }}>{children}</AbsoluteFill>;
}

// ---- the gecko ------------------------------------------------------------------
// "Blink and look", driven by the frame: the head turns, then the eye blinks.
function lookAngle(t: number) {
  const u = (t % 3.2) / 3.2;
  const e = (a: number, b: number, v0: number, v1: number) => lerp(v0, v1, cubicInOut(seg(u, a, b - a)));
  if (u < 0.18) return 0;
  if (u < 0.3) return e(0.18, 0.3, 0, -8);
  if (u < 0.62) return -8;
  if (u < 0.74) return e(0.62, 0.74, -8, 4);
  if (u < 0.88) return 4;
  return e(0.88, 1, 4, 0);
}
function lidScale(t: number) {
  const u = (t % 3.2) / 3.2;
  const tri = (c: number, w: number) => c01(1 - Math.abs(u - c) / w);
  return Math.max(tri(0.435, 0.035), tri(0.825, 0.025));
}
const HEAD = "57,-2 102,-2 102,30 70,28 62,22 56,14";
function Gecko({ t, size, color = "#ffffff", id, style }: { t: number; size: number; color?: string; id: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="-6 -8 112 112" style={{ display: "block", overflow: "visible", ...style }}>
      <defs>
        <path id={`${id}-gk`} d={GECKO_PATH} />
        <clipPath id={`${id}-h`} clipPathUnits="userSpaceOnUse">
          <polygon points={HEAD} />
        </clipPath>
        <mask id={`${id}-b`} maskUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="120">
          <rect x="-10" y="-10" width="120" height="120" fill="#fff" />
          <polygon points={HEAD} fill="#000" stroke="#fff" strokeWidth="1.1" strokeLinejoin="round" />
        </mask>
      </defs>
      <g fill={color}>
        <use href={`#${id}-gk`} mask={`url(#${id}-b)`} />
        <g transform={`rotate(${lookAngle(t)} 64 22)`}>
          <use href={`#${id}-gk`} clipPath={`url(#${id}-h)`} />
          <ellipse cx="82.3" cy="15" rx="4.6" ry="3.9" transform={`translate(0 15) scale(1 ${lidScale(t)}) translate(0 -15)`} />
        </g>
      </g>
    </svg>
  );
}

// The point-cloud gecko (Goblin's loading state), driven by the frame.
type Dot = { x: number; y: number; z: number; sx: number; sy: number; sz: number; ph: number };
function useDots(n: number): Dot[] {
  return useMemo(() => {
    const off = document.createElement("canvas");
    off.width = off.height = 300;
    const oc = off.getContext("2d")!;
    oc.scale(3, 3);
    oc.fill(new Path2D(GECKO_PATH));
    const img = oc.getImageData(0, 0, 300, 300).data;
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const out: Dot[] = [];
    while (out.length < n) {
      const x = rnd() * 100;
      const y = rnd() * 100;
      if (img[(Math.floor(y * 3) * 300 + Math.floor(x * 3)) * 4 + 3] < 128) continue;
      const u = rnd() * 2 - 1;
      const th = rnd() * Math.PI * 2;
      const r = 46 + rnd() * 26;
      const s = Math.sqrt(1 - u * u);
      out.push({ x: x - 50, y: y - 50, z: (rnd() - 0.5) * 7, sx: s * Math.cos(th) * r, sy: u * r, sz: s * Math.sin(th) * r, ph: rnd() });
    }
    return out;
  }, [n]);
}
// As in Goblin: it streams while Goblin works and settles into a still, dotted
// gecko when it's done. `small` uses fewer, bigger dots, like the chat avatar.
function CloudGecko({ t, size, settle = 0, small = size < 120 }: { t: number; size: number; settle?: number; small?: boolean }) {
  const all = useDots(700);
  const pts = small ? all.filter((_, i) => i % 3 === 0) : all;
  const k = (size * 0.72) / 100;
  const rotY = Math.sin(t * 0.55) * 0.5 * (1 - settle);
  const rotX = Math.sin(t * 0.37 + 1) * 0.16 * (1 - settle);
  const cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX);
  const ease = (v: number) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);
  return (
    <svg width={size} height={size} style={{ display: "block", overflow: "visible" }}>
      {pts.map((p, i) => {
        const u = (t / 5.5 + p.ph) % 1;
        let mix = u < 0.18 ? ease(u / 0.18) : u < 0.88 ? 1 : 1 - ease((u - 0.88) / 0.12);
        mix = mix + (1 - mix) * settle;
        const sw = (1 - mix) * 1.6 + t * 0.25;
        const fx = p.sx * Math.cos(sw) - p.sz * Math.sin(sw);
        const fz = p.sx * Math.sin(sw) + p.sz * Math.cos(sw);
        const x = fx + (p.x - fx) * mix;
        const y = p.sy + (p.y - p.sy) * mix;
        const z = fz + (p.z - fz) * mix;
        const rx = x * cy + z * sy;
        const rz0 = -x * sy + z * cy;
        const ry = y * cx - rz0 * sx;
        const rz = y * sx + rz0 * cx;
        const f = 180 / (180 + rz);
        const r = Math.max(small ? 1.7 : 0, (0.5 + 0.45 * mix) * f * k);
        return <rect key={i} x={size / 2 + rx * f * k - r / 2} y={size / 2 + ry * f * k - r / 2} width={r} height={r} fill={MINT} opacity={Math.max(0.06, Math.min(1, (0.12 + 0.88 * mix * mix) * (0.75 + 0.25 * f)))} />;
      })}
    </svg>
  );
}

// ---- chat pieces ------------------------------------------------------------------
function UserBubble({ t, i, top, right = 1920 - RIGHT, size = 34 }: { t: number; i: number; top: number; right?: number; size?: number }) {
  const m = user(i);
  if (t < m.at) return null;
  const p = expOut(seg(t, m.at, 0.4));
  const shown = typed(m.text, t, m.at + 0.05, USER_CPS);
  return (
    <div
      style={{
        position: "absolute", right, top, maxWidth: 1120, opacity: p, transform: `translateY(${(1 - p) * 18}px)`,
        background: "rgba(255,255,255,0.075)", borderRadius: "30px 30px 10px 30px", padding: `${size * 0.55}px ${size * 0.85}px`,
        font: `400 ${size}px/1.38 ${INTER}`, color: FG, whiteSpace: "pre-wrap",
      }}
    >
      {shown || "​"}
    </div>
  );
}

function Thinking({ t, x, y }: { t: number; x: number; y: number }) {
  return (
    <div style={{ position: "absolute", left: x, top: y, display: "flex", gap: 10 }}>
      {[0, 1, 2].map((d) => (
        <div key={d} style={{ width: 12, height: 12, borderRadius: 6, background: MINT, opacity: 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 7 - d * 0.9)) }} />
      ))}
    </div>
  );
}

function GoblinLine({ t, i, top, left = LEFT, width = 1060, size = 34, think = 0.7, busyUntil, children }: { t: number; i: number; top: number; left?: number; width?: number; size?: number; think?: number; busyUntil?: number; children?: ReactNode }) {
  const m = goblin(i);
  if (t < m.at - think) return null;
  // Goblin's avatar is its loading state: streaming while it works (typing,
  // building, testing), then settling into a still gecko.
  const until = busyUntil ?? doneAt(m, GOBLIN_CPS) + 0.2;
  const settle = cubicInOut(seg(t, until, 0.7));
  const shown = typed(m.text, t, m.at, GOBLIN_CPS);
  const p = expOut(seg(t, m.at - think, 0.35));
  return (
    <div style={{ position: "absolute", left, top, width, opacity: p, display: "flex", gap: 26 }}>
      <div style={{ width: 60, height: 60, flexShrink: 0, marginTop: -8 }}>
        <CloudGecko t={Math.min(t, until + 0.7)} size={60} settle={settle} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {t < m.at ? (
          <Thinking t={t} x={0} y={14} />
        ) : (
          <div style={{ font: `400 ${size}px/1.42 ${INTER}`, color: "rgba(245,245,242,0.92)" }}>{shown}</div>
        )}
        {children}
      </div>
    </div>
  );
}

const Check = ({ s = 26 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

function Steps({ t, steps, done, size = 28, counter }: { t: number; steps: { at: number; text: string }[]; done: number; size?: number; counter?: (t: number) => string | null }) {
  return (
    <div style={{ marginTop: 18 }}>
      {steps.map((s, i) => {
        if (t < s.at) return null;
        const next = steps[i + 1]?.at ?? done;
        const active = t < next;
        const p = expOut(seg(t, s.at, 0.3));
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, height: size * 1.7, opacity: p, transform: `translateX(${(1 - p) * -14}px)` }}>
            <div style={{ width: size, display: "flex", justifyContent: "center" }}>
              {active ? <div style={{ width: 11, height: 11, borderRadius: 6, background: "#5fd67a", opacity: 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 6)) }} /> : <Check s={size} />}
            </div>
            <span style={{ font: `400 ${size}px/1 ${INTER}`, color: active ? FG : "rgba(245,245,242,0.5)" }}>{s.text}</span>
            {active && i === 0 && counter?.(t) && <span style={{ font: `400 ${size * 0.78}px/1 ${INTER}`, color: "rgba(245,245,242,0.32)" }}>{counter(t)}</span>}
          </div>
        );
      })}
    </div>
  );
}

function Pill({ children, green, style }: { children: ReactNode; green?: boolean; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: "inline-flex", alignItems: "center", gap: 10, height: 52, padding: "0 24px", borderRadius: 26,
        font: `${green ? 700 : 500} 22px/1 ${INTER}`,
        background: green ? GREEN : "transparent", color: green ? "#000" : "rgba(245,245,242,0.85)", border: green ? "none" : "1.5px solid rgba(255,255,255,0.16)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
const DownloadIcon = ({ c = "currentColor" }: { c?: string }) => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />
  </svg>
);

function Card({ t, at, title, meta, thumb, style }: { t: number; at: number; title: string; meta: string; thumb: ReactNode; style?: CSSProperties }) {
  if (t < at) return null;
  const p = spring(t - at, 16, 0.78);
  return (
    <div
      style={{
        position: "absolute", display: "flex", alignItems: "center", gap: 22, width: 860, padding: 14, paddingRight: 18,
        borderRadius: 22, border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.035)",
        opacity: c01(p * 1.4), transform: `translateY(${(1 - p) * 30}px) scale(${0.96 + 0.04 * p})`, transformOrigin: "left center", ...style,
      }}
    >
      <div style={{ width: 176, height: 100, borderRadius: 14, overflow: "hidden", border: "1.5px solid rgba(255,255,255,0.08)", background: "#0a0a0a", position: "relative", flexShrink: 0 }}>{thumb}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: `600 28px/1.2 ${INTER}`, color: FG }}>{title}</div>
        <div style={{ font: `400 21px/1.4 ${INTER}`, color: "rgba(245,245,242,0.45)", marginTop: 6 }}>{meta}</div>
      </div>
      <Pill>
        <DownloadIcon /> Download
      </Pill>
    </div>
  );
}

function InputBar({ t, explainer = 0, placeholder = "Reply to Goblin…", left = 380, width = 1160, top = 920 }: { t: number; explainer?: number; placeholder?: string; left?: number; width?: number; top?: number }) {
  return (
    <div style={{ position: "absolute", left, top, width, height: 124, borderRadius: 26, border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(12,12,12,0.92)", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
      <div style={{ position: "absolute", left: 30, top: 24, font: `400 26px/1 ${INTER}`, color: "rgba(245,245,242,0.35)" }}>{placeholder}</div>
      <div style={{ position: "absolute", left: 20, bottom: 16, display: "flex", gap: 12 }}>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 9, height: 40, padding: "0 16px", borderRadius: 12, font: `500 19px/1 ${INTER}`,
            border: `1.5px solid ${explainer > 0.5 ? "rgba(34,160,58,0.7)" : "rgba(255,255,255,0.09)"}`,
            background: `rgba(34,160,58,${0.16 * explainer})`, color: explainer > 0.5 ? "#7fe08f" : "rgba(245,245,242,0.5)",
            transform: `scale(${1 + 0.08 * Math.sin(Math.PI * c01(explainer))})`,
          }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" />
          </svg>
          Explainer
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, height: 40, padding: 4, borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.08)" }}>
          {["16:9", "9:16", "1:1"].map((a, i) => (
            <div key={a} style={{ padding: "6px 12px", borderRadius: 8, font: `500 17px/1 ${INTER}`, background: i === 1 ? "rgba(255,255,255,0.1)" : "transparent", color: i === 1 ? FG : "rgba(245,245,242,0.45)" }}>
              {a}
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", right: 18, bottom: 16, width: 52, height: 52, borderRadius: 26, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="rgba(245,245,242,0.4)" strokeWidth={2.4} strokeLinecap="round">
          <path d="M12 19V5M6 11l6-6 6 6" />
        </svg>
      </div>
    </div>
  );
}

function Beat({ t, i }: { t: number; i: number }) {
  const b = CUES.beats[i];
  const end = b.at + 1.75;
  if (t < b.at || t > end) return null;
  const out = cubicInOut(seg(t, end - 0.35, 0.35));
  const words = [...b.lead.split(" ").map((w) => [w, false] as const), ...b.tail.split(" ").map((w) => [w, true] as const)];
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 1 - out }}>
      <div style={{ font: `400 124px/1.1 ${SERIF}`, color: FG, letterSpacing: "-0.01em", display: "flex", gap: "0.26em", transform: `translateY(${-out * 20}px)` }}>
        {words.map(([w, tail], k) => {
          const p = expOut(seg(t, b.at + 0.06 + k * 0.09, 0.55));
          return (
            <span key={k} style={{ display: "inline-block", opacity: p, transform: `translateY(${(1 - p) * 34}px)`, color: tail ? MINT : FG, fontStyle: tail ? "italic" : "normal" }}>
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// The user's template, playing: the library's Portrait Stack Reel in a
// fictional Tidybox brand kit, on its own 1080×1920 canvas, looping.
const TIDYBOX: Brand = { name: "Tidybox", background: "#120f24", foreground: "#ffffff", primary: "#8b7bff", accent: "#ffcf5c", font: "inter", motion: "snappy" };
const TIDY_WORDS = "ONE, INBOX, EVERY, REPLY, ONE, PLACE";
const REEL_FRAMES = 285;
function Thumb916({ lt, cta = "OUT FRIDAY", h = 100 }: { lt: number; cta?: string; big?: boolean; h?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const w = (h * 9) / 16;
  const from = frame - Math.max(0, Math.round(lt * fps));
  return (
    <div style={{ position: "absolute", left: "50%", top: 0, width: w, height: h, marginLeft: -w / 2, overflow: "hidden", background: TIDYBOX.background }}>
      <div style={{ transform: `scale(${h / 1920})`, transformOrigin: "top left", width: 1080, height: 1920, position: "absolute", left: 0, top: 0 }}>
        <Sequence from={from} width={1080} height={1920} layout="none">
          <Loop durationInFrames={REEL_FRAMES} layout="none">
            <PortraitReel brand={TIDYBOX} content={{ words: TIDY_WORDS, role: cta }} audio={false} />
          </Loop>
        </Sequence>
      </div>
    </div>
  );
}

// The explainer's thumbnail: envelopes flowing into one box.
function ExplainerThumb({ t }: { t: number }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 176 100">
      <rect width="176" height="100" fill="#0b0b0b" />
      {[0, 1, 2].map((i) => {
        const u = ((t * 0.6 + i / 3) % 1);
        const x = lerp(20, 112, u);
        const y = lerp(22 + i * 26, 50, u) - 6;
        return <rect key={i} x={x} y={y} width="22" height="14" rx="3" fill="none" stroke={MINT} strokeWidth="2" opacity={1 - u * 0.6} />;
      })}
      <rect x="124" y="36" width="34" height="28" rx="6" fill={GREEN} />
      <text x="88" y="92" fill="rgba(245,245,242,0.6)" fontSize="9" textAnchor="middle" fontFamily={INTER}>
        One inbox, everyone in it
      </text>
    </svg>
  );
}

// ---- scenes ----------------------------------------------------------------------
function Glow({ t }: { t: number }) {
  return (
    <AbsoluteFill style={{ background: BG }}>
      <div style={{ position: "absolute", left: 960 - 900, top: -520, width: 1800, height: 900, borderRadius: "50%", background: `radial-gradient(closest-side, ${GREEN}30, transparent)`, filter: "blur(40px)", transform: `translateX(${Math.sin(t * 0.25) * 40}px)` }} />
    </AbsoluteFill>
  );
}

function Open({ t }: { t: number }) {
  return (
    <Scene t={t} span={S.open}>
      <UserBubble t={t} i={0} top={150} />
      <UserBubble t={t} i={1} top={262} />
      <GoblinLine t={t} i={0} top={430} />
      <InputBar t={t} />
    </Scene>
  );
}

// The title card, after the library's Orbit Rings and Project Carousel reels:
// the four pieces of the product circle the title on a tilted 3D ring (front
// ones pass below it, larger and sharp; back ones drift behind it, small and
// soft), two faint orbit rings spin behind, then the orbit spins up and
// everything is sucked into the centre and bursts out into the next frame.
function Title({ t }: { t: number }) {
  const [a] = S.title;
  const lt = t - a;
  const suck = CUES.titleSuck - a; // collapse starts
  const burst = CUES.titleBurst - a; // everything is gone; the ring bursts out
  const intro = expOut(seg(lt, 0.15, 0.6));
  const name = expOut(seg(lt, 0.45, 0.8));
  const collapse = expInOut(seg(lt, suck, burst - suck));
  const spinUp = Math.pow(seg(lt, suck - 0.35, burst - suck + 0.35), 2.2) * 5.5;
  const CX = 960, CY = 560, RX = 640, RY = 330;

  const items: { key: string; w: number; h: number; node: ReactNode }[] = [
    { key: "card", w: 860, h: 128, node: <Card t={99} at={0} title="Tidybox Launch" meta="Template · 9:16 · 10s · sound · v1" thumb={<Thumb916 lt={lt + 2.6} />} style={{ position: "relative", background: "#0d0d0d" }} /> },
    {
      key: "steps", w: 560, h: 190,
      node: (
        <div style={{ width: 560, padding: "22px 30px", borderRadius: 22, border: "1.5px solid rgba(255,255,255,0.12)", background: "#0d0d0d" }}>
          {CUES.steps.map((st) => (
            <div key={st.text} style={{ display: "flex", alignItems: "center", gap: 14, height: 46, font: `400 23px/1 ${INTER}`, color: "rgba(245,245,242,0.62)" }}>
              <Check s={22} /> {st.text}
            </div>
          ))}
        </div>
      ),
    },
    { key: "input", w: 720, h: 124, node: <div style={{ position: "relative", width: 720, height: 124 }}><InputBar t={t} explainer={1} placeholder="What should the explainer explain?" left={0} top={0} width={720} /></div> },
    {
      key: "preview", w: 420, h: 236,
      node: (
        <div style={{ position: "relative", width: 420, height: 236, borderRadius: 22, overflow: "hidden", border: "1.5px solid rgba(255,255,255,0.12)", background: TIDYBOX.background }}>
          <Thumb916 lt={lt + 3.8} h={236} />
        </div>
      ),
    },
  ];
  const BASE = [-2.55, -0.95, 0.6, 2.2]; // radians around the ring
  const placed = items.map((it, i) => {
    const entry = expOut(seg(lt, 0.05 + i * 0.09, 1.1));
    const th = BASE[i] + lt * 0.42 + spinUp;
    const rf = lerp(1.75, 1, entry) * (1 - collapse);
    const depth = Math.sin(th); // +1 front (lower on screen), -1 back
    const x = CX + Math.cos(th) * RX * rf;
    const y = CY + depth * RY * rf;
    const scale = (0.8 + 0.2 * depth) * lerp(1, 0.06, collapse);
    const fadeOut = 1 - c01((collapse - 0.7) / 0.3);
    const opacity = c01(entry * 1.6) * (0.62 + 0.38 * (depth + 1) / 2) * fadeOut;
    const blur = ((1 - depth) / 2) * 2.2 + collapse * 5;
    const rot = Math.cos(th) * 3 - collapse * 140;
    return { ...it, depth, el: (
      <div key={it.key} style={{ position: "absolute", left: x, top: y, width: it.w, height: it.h, marginLeft: -it.w / 2, marginTop: -it.h / 2, transform: `rotate(${rot}deg) scale(${scale})`, opacity, filter: `blur(${blur.toFixed(2)}px)` }}>
        {it.node}
      </div>
    ) };
  });
  const back = placed.filter((p) => p.depth < 0).map((p) => p.el);
  const front = placed.filter((p) => p.depth >= 0).map((p) => p.el);

  // The title is pulled into the centre with everything else.
  const titleIn = lerp(1, 0.04, expInOut(seg(lt, suck + 0.15, burst - suck - 0.1)));
  const titleOut = 1 - c01((lt - (burst - 0.25)) / 0.25);
  const ringP = expOut(seg(lt, 0.0, 1.2)) * (1 - collapse);
  const bp = 1 - Math.pow(1 - seg(lt, burst - 0.05, 0.9), 2.4);
  const dot = collapse * (1 - seg(lt, burst - 0.05, 0.12));
  return (
    <Scene t={t} span={S.title}>
      {/* two faint orbit rings, spinning opposite ways */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {[
          [RX, RY, 1, 0.22],
          [RX * 1.28, RY * 1.28, -1, 0.12],
        ].map(([rx, ry, dir, o], i) => (
          <ellipse key={i} cx={CX} cy={CY} rx={rx * ringP} ry={ry * ringP} fill="none" stroke={MINT} strokeOpacity={o * c01(ringP * 2)} strokeWidth={1.6} strokeDasharray="2 14" strokeDashoffset={lt * 60 * dir} />
        ))}
        {dot > 0 && <circle cx={CX} cy={CY} r={6 + dot * 22} fill={MINT} opacity={0.9 * dot} />}
        {bp > 0 && bp < 1 && (
          <>
            <circle cx={CX} cy={CY} r={bp * 1150} fill="none" stroke={MINT} strokeWidth={16 * (1 - bp) + 2} opacity={Math.pow(1 - bp, 0.7)} />
            <circle cx={CX} cy={CY} r={bp * 1050} fill="none" stroke={GREEN} strokeWidth={6 * (1 - bp)} opacity={0.8 * (1 - bp)} />
            <circle cx={CX} cy={CY} r={bp * 950} fill={GREEN} opacity={0.22 * (1 - bp)} />
          </>
        )}
      </svg>
      {back}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `translateY(${CY - 540}px) scale(${titleIn}) rotate(${(1 - titleIn) * -25}deg)`, opacity: titleOut }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: -40 }}>
          <div style={{ opacity: intro, transform: `translateY(${(1 - intro) * 16}px)` }}>
            <Gecko t={lt} size={110} id="title" />
          </div>
          <div style={{ font: `500 34px/1 ${INTER}`, color: "rgba(245,245,242,0.6)", marginTop: 26, opacity: intro }}>Introducing</div>
          <div style={{ font: `400 150px/1.05 ${SERIF}`, color: FG, marginTop: 14, opacity: name, transform: `translateY(${(1 - name) * 30}px) scale(${1.06 - 0.06 * name})`, letterSpacing: "-0.01em" }}>
            Chat in <span style={{ color: MINT, fontStyle: "italic" }}>Goblin</span>
          </div>
        </div>
      </AbsoluteFill>
      {front}
    </Scene>
  );
}

function Talk({ t }: { t: number }) {
  const chat: Span = [CUES.beats[0].at + 1.75, S.talk[1]];
  return (
    <>
      <Beat t={t} i={0} />
      <Scene t={t} span={chat}>
        <UserBubble t={t} i={2} top={160} />
        <GoblinLine t={t} i={1} top={290} />
        <UserBubble t={t} i={3} top={510} />
        <InputBar t={t} />
      </Scene>
    </>
  );
}

const STEP_DONE = CUES.card1 - 0.15;
function Build({ t }: { t: number }) {
  const chat: Span = [CUES.beats[1].at + 1.75, S.build[1]];
  const writing = CUES.steps[0];
  return (
    <>
      <Beat t={t} i={1} />
      <Scene t={t} span={chat}>
        <UserBubble t={t} i={3} top={150} />
        <GoblinLine t={t} i={2} top={280} think={0.15} busyUntil={CUES.card1 + 0.7}>
          <Steps t={t} steps={CUES.steps} done={STEP_DONE} counter={(tt) => (tt >= writing.at ? `${Math.min(9, Math.max(1, Math.floor((tt - writing.at) * 6)))}k chars` : null)} />
        </GoblinLine>
        <Card t={t} at={CUES.card1} title="Tidybox Launch" meta="Template · 9:16 · 10s · sound · v1" thumb={<Thumb916 lt={t - CUES.card1} />} style={{ left: LEFT + 86, top: 640 }} />
      </Scene>
    </>
  );
}

function Panel({ t }: { t: number }) {
  const [a, b] = S.panel;
  const open = expInOut(seg(t, CUES.panelOpen, 0.7));
  const lt = t - (CUES.panelOpen + 0.3);
  // The text field edit: the template's role line, "OUT FRIDAY" typed over "LIVE TODAY".
  const edit = CUES.fieldEdit;
  const cta = t < edit ? "LIVE TODAY" : t < edit + 0.5 ? "LIVE TODAY".slice(0, Math.max(0, 10 - Math.floor((t - edit) * 24))) || " " : "OUT FRIDAY".slice(0, Math.max(1, Math.floor((t - edit - 0.5) * 16)));
  const shift = lerp(0, -300, open);
  return (
    <Scene t={t} span={[a, b]}>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${shift}px)` }}>
        <GoblinLine t={t} i={2} top={150} think={0} busyUntil={CUES.card1 + 0.7}>
          <Steps t={t} steps={CUES.steps} done={STEP_DONE} />
        </GoblinLine>
        <Card t={t} at={CUES.card1} title="Tidybox Launch" meta="Template · 9:16 · 10s · sound · v1" thumb={<Thumb916 lt={t - CUES.card1} cta={cta} />} style={{ left: LEFT + 86, top: 510, borderColor: "rgba(255,255,255,0.3)" }} />
      </div>
      {/* the side panel */}
      <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: 760, transform: `translateX(${(1 - open) * 780}px)`, background: "#080808", borderLeft: "1.5px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "34px 36px 26px", borderBottom: "1.5px solid rgba(255,255,255,0.08)" }}>
          <div style={{ flex: 1 }}>
            <div style={{ font: `600 30px/1.2 ${INTER}`, color: FG }}>Tidybox Launch</div>
            <div style={{ font: `400 20px/1.4 ${INTER}`, color: "rgba(245,245,242,0.45)" }}>Template · 9:16 · 10s · sound · v1</div>
          </div>
          <Pill green>
            <DownloadIcon c="#000" /> Download MP4
          </Pill>
        </div>
        <div style={{ padding: 36 }}>
          <div style={{ position: "relative", height: 560, borderRadius: 20, overflow: "hidden", border: "1.5px solid rgba(255,255,255,0.1)", background: "#0a0a0a" }}>
            <Thumb916 lt={Math.max(0, lt)} cta={cta} h={560} />
          </div>
          <div style={{ font: `500 20px/1 ${INTER}`, color: "rgba(245,245,242,0.45)", marginTop: 30 }}>Text</div>
          {[
            ["Six words", TIDY_WORDS],
            ["Role line", cta],
          ].map(([label, value], i) => {
            const focus = i === 1 && t > edit - 0.3 && t < edit + 1.6;
            return (
              <div key={label} style={{ marginTop: 16 }}>
                <div style={{ font: `400 18px/1 ${INTER}`, color: "rgba(245,245,242,0.55)", marginBottom: 8 }}>{label}</div>
                <div style={{ height: 54, borderRadius: 14, border: `1.5px solid ${focus ? GREEN : "rgba(255,255,255,0.12)"}`, background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", padding: "0 18px", font: `400 22px/1 ${INTER}`, color: FG }}>
                  {value}
                  {focus && <span style={{ width: 2, height: 26, background: FG, marginLeft: 2, opacity: Math.sin(t * 12) > 0 ? 1 : 0 }} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Scene>
  );
}

function Change({ t }: { t: number }) {
  const chat: Span = [CUES.beats[2].at + 1.75, S.change[1]];
  const reply = goblin(3);
  const quick = [
    { at: reply.at - 0.5 + 0.0, text: "Applying your change" },
    { at: CUES.card2 - 0.75, text: "Checking it follows your brand kit" },
    { at: CUES.card2 - 0.4, text: "Testing it in the preview" },
  ];
  return (
    <>
      <Beat t={t} i={2} />
      <Scene t={t} span={chat}>
        <UserBubble t={t} i={4} top={150} />
        <GoblinLine t={t} i={3} top={280} think={0.5} busyUntil={CUES.card2 + 0.5}>
          <Steps t={t} steps={quick} done={CUES.card2 - 0.1} />
        </GoblinLine>
        <Card t={t} at={CUES.card2} title="Tidybox Launch" meta="Template · 9:16 · 10s · sound · v2" thumb={<Thumb916 lt={t - CUES.card2 + 3.3} big />} style={{ left: LEFT + 86, top: 640 }} />
        {/* a ding, drawn */}
        {t > CUES.card2 + 0.3 && (
          <div style={{ position: "absolute", left: LEFT + 86 + 890, top: 668, opacity: 1 - seg(t, CUES.card2 + 1.2, 0.6) }}>
            {[0, 1, 2].map((k) => {
              const p = seg(t, CUES.card2 + 0.3 + k * 0.12, 0.7);
              return <div key={k} style={{ position: "absolute", left: -p * 40, top: -p * 40, width: 40 + p * 80, height: 40 + p * 80, borderRadius: "50%", border: `3px solid ${MINT}`, opacity: 1 - p }} />;
            })}
          </div>
        )}
      </Scene>
    </>
  );
}

function Explainer({ t }: { t: number }) {
  const chat: Span = [CUES.beats[3].at + 1.75, S.explainer[1]];
  const on = expOut(seg(t, CUES.explainerToggle, 0.35));
  const startPoll = goblin(4).at + 0.6;
  const phases = CUES.phases;
  return (
    <>
      <Beat t={t} i={3} />
      <Scene t={t} span={chat}>
        <UserBubble t={t} i={5} top={150} />
        <GoblinLine t={t} i={4} top={280} think={0.4} busyUntil={CUES.videoCard}>
          {t > startPoll && <Steps t={t} steps={phases} done={CUES.videoCard - 0.1} />}
        </GoblinLine>
        <Card t={t} at={CUES.videoCard} title="How a Shared Inbox Works" meta="Explainer · 16:9 · MP4 with music" thumb={<ExplainerThumb t={t} />} style={{ left: LEFT + 86, top: 700 }} />
        <InputBar t={t} explainer={on} placeholder={on > 0.5 ? "What should the explainer explain?" : "Reply to Goblin…"} />
      </Scene>
    </>
  );
}

function Export({ t }: { t: number }) {
  const chat: Span = [CUES.beats[4].at + 1.75, S.export[1]];
  const dlg = expOut(seg(t, chat[0] + 0.05, 0.4));
  const prog = c01((t - CUES.exportStart) / (CUES.exportDone - CUES.exportStart));
  const done = t > CUES.exportDone;
  const toast = expOut(seg(t, CUES.exportDone + 0.15, 0.4));
  return (
    <>
      <Beat t={t} i={4} />
      <Scene t={t} span={chat}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
          <Card t={99} at={0} title="Tidybox Launch" meta="Template · 9:16 · 10s · sound · v2" thumb={<Thumb916 lt={t} big />} style={{ left: LEFT + 86, top: 340 }} />
        </div>
        <AbsoluteFill style={{ background: `rgba(0,0,0,${0.45 * dlg})` }} />
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 760, padding: 40, borderRadius: 30, border: "1.5px solid rgba(255,255,255,0.1)", background: "#0c0c0c", boxShadow: "0 40px 120px rgba(0,0,0,0.6)", opacity: dlg, transform: `translateY(${(1 - dlg) * 30}px) scale(${0.96 + 0.04 * dlg})` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ width: 84, height: 84 }}><CloudGecko t={Math.min(t, CUES.exportDone + 0.7)} size={84} settle={cubicInOut(seg(t, CUES.exportDone, 0.7))} /></div>
              <div>
                <div style={{ font: `600 32px/1.2 ${INTER}`, color: FG }}>{done ? "Exported “Tidybox Launch”" : "Exporting “Tidybox Launch”"}</div>
                <div style={{ font: `400 22px/1.4 ${INTER}`, color: "rgba(245,245,242,0.5)" }}>MP4 with sound, made in your browser</div>
              </div>
            </div>
            <div style={{ marginTop: 34, height: 12, borderRadius: 6, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div style={{ width: `${prog * 100}%`, height: "100%", borderRadius: 6, background: GREEN }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, font: `400 20px/1 ${INTER}`, color: "rgba(245,245,242,0.45)" }}>
              <span>1080 × 1920 · 30 fps · H.264 + AAC</span>
              <span>{Math.round(prog * 100)}%</span>
            </div>
          </div>
        </AbsoluteFill>
        <div style={{ position: "absolute", right: 70, bottom: 70, display: "flex", alignItems: "center", gap: 16, padding: "22px 28px", borderRadius: 18, background: "#111", border: "1.5px solid rgba(255,255,255,0.1)", opacity: toast, transform: `translateY(${(1 - toast) * 30}px)` }}>
          <Check s={26} />
          <div>
            <div style={{ font: `600 24px/1.2 ${INTER}`, color: FG }}>MP4 downloaded</div>
            <div style={{ font: `400 19px/1.4 ${INTER}`, color: "rgba(245,245,242,0.5)" }}>tidybox-launch.mp4 · 9:16 · 10s</div>
          </div>
        </div>
      </Scene>
    </>
  );
}

function End({ t }: { t: number }) {
  const [a, b] = S.end;
  const tag = CUES.tagline;
  const lock = CUES.lockup;
  const tagOut = cubicInOut(seg(t, lock - 0.4, 0.4));
  const l1 = expOut(seg(t, tag, 0.7));
  const l2 = expOut(seg(t, tag + 0.55, 0.7));
  const g = backOut(seg(t, lock, 0.6), 1.2);
  const w = expOut(seg(t, lock + 0.2, 0.7));
  const url = expOut(seg(t, lock + 0.7, 0.6));
  return (
    <Scene t={t} span={[a, b + 0.01]}>
      {t < lock && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 1 - tagOut }}>
          <div style={{ font: `400 132px/1.1 ${SERIF}`, color: FG, textAlign: "center", letterSpacing: "-0.01em" }}>
            <div style={{ opacity: l1, transform: `translateY(${(1 - l1) * 30}px)` }}>Launch videos,</div>
            <div style={{ opacity: l2, transform: `translateY(${(1 - l2) * 30}px)`, color: MINT, fontStyle: "italic" }}>by conversation.</div>
          </div>
        </AbsoluteFill>
      )}
      {t >= lock - 0.05 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <div style={{ transform: `scale(${g})`, opacity: c01(g * 2) }}>
              <Gecko t={t - lock} size={190} id="end" />
            </div>
            <div style={{ font: `800 190px/1 ${INTER}`, color: FG, letterSpacing: "-0.045em", opacity: w, transform: `translateX(${(1 - w) * -30}px)` }}>Goblin</div>
          </div>
          <div style={{ position: "absolute", top: 540 + 180, font: `500 38px/1 ${INTER}`, color: "rgba(245,245,242,0.55)", opacity: url, letterSpacing: "0.01em" }}>usegoblin.xyz</div>
        </AbsoluteFill>
      )}
    </Scene>
  );
}

export function ChatLaunch({ audio = true }: { audio?: boolean }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ background: BG, fontFamily: INTER }}>
      <Glow t={t} />
      <Open t={t} />
      <Title t={t} />
      <Talk t={t} />
      <Build t={t} />
      <Panel t={t} />
      <Change t={t} />
      <Explainer t={t} />
      <Export t={t} />
      <End t={t} />
      {audio && <Audio src={staticFile("launch/chat-launch-mix.wav")} />}
    </AbsoluteFill>
  );
}
