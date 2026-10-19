import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { MONO, Track, c01, expInOut, hash, nameOf, palette, seg, useT } from "../../motion";

type C = { greeting: string; sub: string };

// A pixel-art harvest-moon night: a huge full moon rises over pixel hills
// and a little village; paper lanterns light one by one and drift upward,
// a pixel rabbit hops along the ridge, fireflies blink, and a warm pixel
// greeting types into a dialog box.
const RABBIT = [
  ["..X..X..", "..X..X..", "..XXXX..", ".XXXXXX.", ".XOXXOX.", ".XXXXXX.", "..XXXX..", ".XX..XX."],
  ["..X..X..", "..X..X..", "..XXXX..", ".XXXXXX.", ".XOXXOX.", ".XXXXXX.", "..XXXX..", "XX....XX"],
];
export default function PixelMoonNight({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const P = 10;
  const rise = expInOut(c01(t / 3.0));
  const moonY = 820 - rise * 520;
  const greeting = c.greeting || "Happy harvest moon!";
  const typed = greeting.slice(0, Math.floor(c01((t - 5.2) / 1.2) * greeting.length));
  const outro = expInOut(seg(t, 9.4, 0.5));
  const hop = Math.abs(Math.sin(t * 5)) * 30;
  const rx = -100 + ((t * 160) % 2200);
  const px = (v: number) => Math.round(v / P) * P;

  return (
    <AbsoluteFill style={{ background: "#0e1030", overflow: "hidden", imageRendering: "pixelated" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" shapeRendering="crispEdges" style={{ position: "absolute", inset: 0 }}>
          {/* sky bands */}
          {["#0e1030", "#151a45", "#1d2457", "#28306a"].map((col, i) => (
            <rect key={i} x={0} y={i * 180} width={1920} height={180 + (i === 3 ? 400 : 0)} fill={col} />
          ))}
          {/* stars */}
          {Array.from({ length: 70 }, (_, i) => (
            <rect key={i} x={px(hash(i, 1) * 1920)} y={px(hash(i, 2) * 560)} width={P / 2 + (i % 3 === 0 ? P / 2 : 0)} height={P / 2 + (i % 3 === 0 ? P / 2 : 0)} fill="#fff6d8" opacity={(Math.floor(t * 3 + i) % 5) / 5 + 0.2} />
          ))}
          {/* moon: pixel disk */}
          {Array.from({ length: 34 }, (_, j) =>
            Array.from({ length: 34 }, (_, i) => {
              const dx = i - 16.5;
              const dy = j - 16.5;
              const d = Math.hypot(dx, dy);
              if (d > 16.5) return null;
              const crater = (Math.hypot(i - 10, j - 12) < 3 || Math.hypot(i - 22, j - 20) < 4 || Math.hypot(i - 14, j - 25) < 2) ? "#e8d48a" : d > 15 ? "#ffe9a8" : "#fff2c2";
              return <rect key={`${i}-${j}`} x={960 - 170 + i * P} y={px(moonY) - 170 + j * P} width={P} height={P} fill={crater} />;
            }),
          )}
          {/* moon glow ring */}
          <circle cx={960} cy={moonY} r={240} fill="#fff2c2" opacity={0.06 + rise * 0.06} />
          {/* hills */}
          {Array.from({ length: 96 }, (_, i) => {
            const h = 200 + Math.round((Math.sin(i * 0.18) * 60 + Math.sin(i * 0.05) * 80) / P) * P;
            return <rect key={i} x={i * 20} y={1080 - h} width={20} height={h} fill="#1b2a3a" />;
          })}
          {Array.from({ length: 96 }, (_, i) => {
            const h = 120 + Math.round((Math.sin(i * 0.11 + 2) * 40) / P) * P;
            return <rect key={i} x={i * 20} y={1080 - h} width={20} height={h} fill="#14202c" />;
          })}
          {/* village houses */}
          {[260, 420, 1380, 1560].map((x, i) => (
            <g key={i}>
              <rect x={x} y={900} width={100} height={80} fill="#2b2238" />
              <path d={`M${x - 10},900 L${x + 50},850 L${x + 110},900 Z`} fill="#3a2a2a" />
              <rect x={x + 36} y={925} width={26} height={26} fill={t > 1 + i * 0.3 ? "#ffcf6b" : "#2b2238"} />
            </g>
          ))}
          {/* rabbit on the ridge */}
          {(() => {
            const fr = RABBIT[Math.floor(t * 5) % 2];
            const by = 1080 - (120 + Math.round((Math.sin((rx / 20) * 0.11 + 2) * 40) / P) * P) - 8 * P - hop;
            return fr.flatMap((r, j) => r.split("").map((ch, i) => (ch === "." ? null : <rect key={`r${i}-${j}`} x={px(rx) + i * P} y={px(by) + j * P} width={P} height={P} fill={ch === "O" ? "#e86a8a" : "#f4f4f4"} />)));
          })()}
          {/* lanterns */}
          {Array.from({ length: 9 }, (_, i) => {
            const at = 2.6 + i * 0.3;
            if (t < at) return null;
            const u = t - at;
            const x = px(120 + i * 210 + Math.sin(u + i) * 20);
            const y = px(980 - u * 70 - (i % 3) * 40);
            return (
              <g key={i}>
                <rect x={x} y={y} width={P * 3} height={P * 4} fill="#ff8a3d" />
                <rect x={x + P} y={y + P} width={P} height={P * 2} fill="#ffe08a" />
                <rect x={x - P} y={y - P} width={P * 5} height={P} fill="#c4452f" />
                <rect x={x - P * 2} y={y - P * 2} width={P * 7} height={P * 7} fill="#ffb04a" opacity={0.15} />
              </g>
            );
          })}
          {/* fireflies */}
          {Array.from({ length: 16 }, (_, i) => (
            <rect key={i} x={px(hash(i, 5) * 1920 + Math.sin(t + i) * 30)} y={px(760 + hash(i, 6) * 220 + Math.cos(t * 1.3 + i) * 20)} width={P / 2} height={P / 2} fill="#d6ff7a" opacity={Math.max(0, Math.sin(t * 3 + i * 1.7))} />
          ))}
        </svg>
        {t > 5.0 && (
          <div style={{ position: "absolute", left: 360, right: 360, top: 600, padding: "28px 36px", border: "8px solid #fff6d8", background: "#0e1030", fontFamily: MONO, fontSize: 46, color: "#fff6d8", boxShadow: "8px 8px 0 #000", textAlign: "center" }}>
            {typed}
            <span style={{ opacity: Math.floor(t * 3) % 2 }}>▮</span>
            <div style={{ fontSize: 26, color: pal.v, marginTop: 12, opacity: c01((t - 6.6) * 2) }}>{c.sub || `from all of us at ${nameOf(b)}`}</div>
          </div>
        )}
      </div>
      <Track src="tracks/pixel-moon-night.wav" on={audio} />
    </AbsoluteFill>
  );
}
