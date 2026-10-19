import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Track, c01, fit, fontOf, hash, nameOf, palette, useT } from "../../motion";

type C = { words: string; role: string };

// A glitch showreel: hard cuts between words, each held on screen with RGB
// channel splits, horizontal slice displacement, scanlines and data-mosh
// blocks that spike on the beat; a corrupted timecode ticks in the corner
// and the final cut stabilises cleanly on the name.
export default function GlitchReel({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const words = [...list(c.words || "SIGNAL, NOISE, ERROR, RESET"), "GLITCH", "GLITCH", "GLITCH", "GLITCH"].slice(0, 4);
  const per = 1.4;
  const k = Math.min(4, Math.floor(t / per));
  const u = t - k * per;
  const isEnd = k >= 4;
  const word = isEnd ? nameOf(b).toUpperCase() : words[k];
  const fr = Math.floor(t * 30);
  // glitch intensity: spikes right after each cut and on the off-beat
  const spike = Math.max(0, 1 - u / 0.25) + (Math.abs(u - per / 2) < 0.06 ? 0.8 : 0);
  const settle = isEnd ? Math.max(0, 1 - u / 0.6) : 1;
  const g = Math.min(1, (0.15 + spike) * settle);
  const size = fit(word, 1600, 360, 900, -0.03, ff);
  const slices = 12;
  const layer = (color: string, dx: number, dy: number, blend: "normal" | "screen") => (
    <div style={{ position: "absolute", inset: 0, mixBlendMode: blend }}>
      {Array.from({ length: slices }, (_, i) => {
        const off = hash(i, fr) > 1 - g * 0.6 ? (hash(fr, i) - 0.5) * 260 * g : 0;
        return (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, top: `${(i / slices) * 100}%`, height: `${100 / slices + 0.2}%`, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: dx + off, right: -dx - off, top: `${-i * 100}%`, height: `${slices * 100}%`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size, fontWeight: 900, letterSpacing: "-0.03em", color, whiteSpace: "nowrap", transform: `translateY(${dy}px)` }}>
              {word}
            </div>
          </div>
        );
      })}
    </div>
  );
  const sep = 22 * g;
  const tc = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t) % 60).padStart(2, "0")}:${String(fr % 30).padStart(2, "0")}`;
  const corrupt = tc
    .split("")
    .map((ch, i) => (hash(i, fr) < g * 0.4 ? "#%&$@!"[Math.floor(hash(fr, i) * 6)] : ch))
    .join("");

  return (
    <AbsoluteFill style={{ background: "#050505", overflow: "hidden", fontFamily: ff }}>
      {layer("#ff2a55", -sep, 0, "screen")}
      {layer("#2affd5", sep, sep * 0.3, "screen")}
      {layer(isEnd && g < 0.05 ? "#fff" : "#ffffffd0", 0, 0, "normal")}
      {/* data-mosh blocks */}
      {Array.from({ length: 10 }, (_, i) =>
        hash(i, fr, 3) < g * 0.5 ? (
          <div key={i} style={{ position: "absolute", left: hash(i, fr, 1) * 1800, top: hash(i, fr, 2) * 1000, width: 60 + hash(fr, i) * 300, height: 10 + hash(i, fr) * 60, background: [pal.v, "#ff2a55", "#2affd5", "#fff"][i % 4], mixBlendMode: "difference" }} />
        ) : null,
      )}
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 4px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: 60, top: 50, fontFamily: MONO, fontSize: 28, color: "#fff", opacity: 0.8 }}>{isEnd ? "SIGNAL OK" : `CH ${String(k + 1).padStart(2, "0")} // ${corrupt}`}</div>
      {isEnd && <div style={{ position: "absolute", left: 0, right: 0, top: 760, textAlign: "center", fontSize: 46, fontWeight: 600, color: pal.v, opacity: c01((u - 0.6) * 2) }}>{c.role || "Motion & title design"}</div>}
      <Track src="tracks/glitch-reel.wav" on={audio} />
    </AbsoluteFill>
  );
}
