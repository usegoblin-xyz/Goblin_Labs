import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { MONO, Track, c01, hash, mix, nameOf, palette, useT } from "../../motion";

type C = { line: string };

// Pixel art at 10×: a wizard under a starry sky raises his staff, charges the
// orb and fires a bolt into the night. Coins rain down spinning into a chest,
// a green candle chart climbs behind it, the chest bursts open, the wizard
// hops for joy and an RPG dialog box gives the line.
const PX = 10;
const GW = 192;
const GH = 108;

const WIZARD = [
  ".....hhh......",
  "....hhhhh.....",
  "...hhhhhhh....",
  "..hhhhhhhhh...",
  ".hhhhhhhhhhh..",
  "hhhhhhhhhhhhh.",
  "....ffff......",
  "...fefeff.....",
  "...ffffff.....",
  "...bbbbbb.....",
  "..bbbbbbbb....",
  "..rrbbbbrr....",
  ".rrrrbbrrrr...",
  ".rrrrrrrrrr...",
  "rrrrrrrrrrrr..",
  "rrrrrrrrrrrr..",
  "rrrrrrrrrrrr..",
  ".rrr....rrr...",
  ".ss.....ss....",
];
const COIN = [
  ["..yyyy..", ".yYYYYy.", "yYyyyyYy", "yYyYYyYy", "yYyYYyYy", "yYyyyyYy", ".yYYYYy.", "..yyyy.."],
  ["...yy...", "..yYYy..", "..yYyy..", "..yYyy..", "..yYyy..", "..yYyy..", "..yYYy..", "...yy..."],
  ["...y....", "...y....", "...y....", "...y....", "...y....", "...y....", "...y....", "...y...."],
];
const CHEST = ["wwwwwwwwwwwwwwww", "wddddddddddddddw", "wddddddyydddddw.", "wwwwwwwyywwwwwww", "wddddddddddddddw", "wddddddddddddddw", "wddddddddddddddw", "wwwwwwwwwwwwwwww"];
const LID = ["..wwwwwwwwwwww..", ".wddddddddddddw.", "wddddddddddddddw", "wwwwwwwwwwwwwwww"];

function Sprite({ rows, x, y, colors }: { rows: string[]; x: number; y: number; colors: Record<string, string> }) {
  const out: ReactNode[] = [];
  rows.forEach((row, j) =>
    row.split("").forEach((ch, i) => {
      const col = colors[ch];
      if (col) out.push(<rect key={`${i}-${j}`} x={(x + i) * PX} y={(y + j) * PX} width={PX} height={PX} fill={col} />);
    }),
  );
  return <g>{out}</g>;
}

export default function PixelCoinWizard({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const name = nameOf(b);
  const q = (v: number) => Math.round(v); // snap to the pixel grid
  const hop = t > 7.0 && t < 7.8 ? Math.sin(((t - 7.0) / 0.8) * Math.PI) * 8 : 0;
  const bob = q(Math.sin(t * 4) * 0.6 - hop);
  const raise = c01((t - 1.5) / 0.4);
  const charge = c01((t - 1.9) / 0.6);
  const bolt = c01((t - 2.5) / 0.35);
  const lidOpen = c01((t - 6.0) / 0.3);
  const dialog = c01((t - 8.0) / 0.3);
  const line = c.line || "The wizard's coins are minted. Adventure awaits!";
  const typed = Math.floor(c01((t - 8.2) / 1.0) * line.length);

  const wx = 40;
  const wy = 60 + bob;
  const staffTop = q(wy - 2 - raise * 8);
  const orb = mix(pal.a, "#ffffff", charge * 0.5);
  const colors = { h: pal.p, f: "#f2c9a0", e: "#1b1b2a", b: "#f4f4f4", r: mix(pal.p, "#1b1030", 0.55), s: "#4a2f1f" };

  const coins: ReactNode[] = [];
  for (let i = 0; i < 22; i++) {
    const start = 3.3 + i * 0.12;
    const k = c01((t - start) / 0.9);
    if (k <= 0 || k >= 1) continue;
    const x = q(126 + hash(i, 1) * 34 + Math.sin(i) * 2);
    const y = q(-10 + k * k * 86);
    const frame = Math.floor(t * 12 + i) % 4;
    coins.push(<Sprite key={i} rows={COIN[frame === 3 ? 1 : frame]} x={x} y={y} colors={{ y: "#f2b632", Y: "#ffe27a" }} />);
  }
  const bars = Array.from({ length: 8 }, (_, i) => {
    const h = q(c01((t - 3.6 - i * 0.25) / 0.4) * (8 + i * 4 + hash(i, 5) * 4));
    return h > 0 ? <rect key={i} x={(100 + i * 9) * PX} y={(78 - h) * PX} width={5 * PX} height={h * PX} fill={i % 3 === 2 ? "#e05a5a" : "#3ecf6a"} opacity={0.75} /> : null;
  });

  return (
    <AbsoluteFill style={{ background: "#120f2a", overflow: "hidden", imageRendering: "pixelated" }}>
      <svg width={GW * PX} height={GH * PX} viewBox={`0 0 ${GW * PX} ${GH * PX}`} shapeRendering="crispEdges" style={{ position: "absolute", inset: 0 }}>
        {/* stars */}
        {Array.from({ length: 70 }).map((_, i) => {
          const tw = Math.sin(t * 3 + i * 1.7) > 0.2 ? 1 : 0.3;
          return <rect key={i} x={q(hash(i, 1) * GW) * PX} y={q(hash(i, 2) * 70) * PX} width={PX} height={PX} fill="#fff" opacity={tw * (0.4 + hash(i, 3) * 0.6)} />;
        })}
        <rect x={150 * PX} y={10 * PX} width={10 * PX} height={10 * PX} fill="#f6f0c8" />
        {/* ground */}
        <rect x={0} y={80 * PX} width={GW * PX} height={28 * PX} fill="#2a5a2e" />
        <rect x={0} y={80 * PX} width={GW * PX} height={2 * PX} fill="#3f8a46" />
        {bars}
        {/* staff + orb */}
        <rect x={(wx + 13) * PX} y={staffTop * PX} width={PX} height={(wy + 18 - staffTop) * PX} fill="#8a5a33" />
        <rect x={(wx + 12) * PX} y={(staffTop - 3) * PX} width={3 * PX} height={3 * PX} fill={orb} />
        {charge > 0 && t < 3.0 &&
          [0, 1, 2, 3].map((k) => {
            const rr = q(2 + charge * 6 + k * 2);
            return <rect key={k} x={(wx + 13 - rr) * PX} y={(staffTop - 2 - rr) * PX} width={(rr * 2 + 1) * PX} height={(rr * 2 + 1) * PX} fill="none" stroke={pal.a} strokeWidth={PX / 2} opacity={0.6 - k * 0.12} />;
          })}
        <Sprite rows={WIZARD} x={wx} y={wy} colors={colors} />
        {/* bolt */}
        {bolt > 0 && bolt < 1 &&
          Array.from({ length: 30 }).map((_, k) => {
            if (k / 30 > bolt) return null;
            const x = wx + 14 + k * 3;
            const y = staffTop - 3 - k * 1.4 + (k % 2 ? 1 : -1);
            return <rect key={k} x={q(x) * PX} y={q(y) * PX} width={2 * PX} height={2 * PX} fill={k % 3 ? pal.a : "#fff"} />;
          })}
        {t > 2.85 && t < 3.5 &&
          Array.from({ length: 16 }).map((_, k) => {
            const a = (k / 16) * Math.PI * 2;
            const r = (t - 2.85) * 40;
            return <rect key={k} x={q(wx + 104 + Math.cos(a) * r) * PX} y={q(staffTop - 44 + Math.sin(a) * r) * PX} width={PX} height={PX} fill="#ffe27a" />;
          })}
        {/* chest */}
        <Sprite rows={CHEST} x={140} y={72} colors={{ w: "#6b3f1f", d: "#a8682f", y: "#ffd34a" }} />
        <g transform={`translate(0 ${-lidOpen * 6 * PX})`}>
          <Sprite rows={LID} x={140} y={68} colors={{ w: "#6b3f1f", d: "#c27a36" }} />
        </g>
        {lidOpen > 0 && <rect x={142 * PX} y={(70 - lidOpen * 14) * PX} width={12 * PX} height={lidOpen * 14 * PX} fill="#ffe27a" opacity={0.45} />}
        {coins}
        {/* dialog */}
        {dialog > 0 && (
          <g opacity={dialog}>
            <rect x={20 * PX} y={86 * PX} width={152 * PX} height={18 * PX} fill="#0b0b18" stroke="#ffffff" strokeWidth={PX} />
            <text x={26 * PX} y={94 * PX} fontFamily={MONO} fontSize={4.2 * PX} fontWeight={700} fill="#ffffff">
              {line.slice(0, typed)}
            </text>
            <text x={26 * PX} y={101 * PX} fontFamily={MONO} fontSize={3.4 * PX} fill={pal.p}>
              {`— ${name}`}
            </text>
          </g>
        )}
      </svg>
      <Track src="tracks/pixel-coin-wizard.wav" on={audio} />
    </AbsoluteFill>
  );
}
