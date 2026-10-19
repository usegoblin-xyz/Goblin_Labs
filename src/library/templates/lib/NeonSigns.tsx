import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Track, c01, expInOut, fit, fontOf, hash, nameOf, palette, seg, useT } from "../../motion";

type C = { words: string; role: string };

// A neon-sign showreel on a dark brick wall: each word's tube buzzes on with
// stuttering flickers, glows with a bloom that lights the bricks around it,
// then fades as the next sign (different colour, position) flickers on;
// the last sign is the name and stays lit.
export default function NeonSigns({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const words = [...list(c.words || "open late, good vibes, make it glow"), "neon", "neon", "neon"].slice(0, 3);
  const signs = [...words, nameOf(b)];
  const colors = ["#ff3ea5", "#39f3ff", "#ffe14d", pal.v];
  const per = 2.0;
  const k = Math.min(3, Math.floor(t / per));
  const u = t - k * per;
  const fr = Math.floor(t * 30);
  // flicker: random on/off for the first 0.5s, then steady with rare blips
  const flick = u < 0.5 ? (hash(fr, k) > 0.45 ? 1 : 0.15) : hash(fr, k, 7) > 0.985 ? 0.4 : 1;
  const fadeOut = k < 3 ? 1 - c01((u - per + 0.3) / 0.3) : 1;
  const on = flick * fadeOut;
  const col = colors[k];
  const outro = expInOut(seg(t, 9.4, 0.5));
  const pos = [
    [960, 420],
    [900, 560],
    [1000, 460],
    [960, 500],
  ][k];
  const word = signs[k];
  const size = fit(word, 1400, 220, 300, 0, ff);

  return (
    <AbsoluteFill style={{ background: "#120c10", overflow: "hidden", fontFamily: ff }}>
      {/* bricks */}
      <AbsoluteFill
        style={{
          backgroundImage: "linear-gradient(#0a0609 3px, transparent 3px), linear-gradient(90deg, #0a0609 3px, transparent 3px)",
          backgroundSize: "120px 60px, 120px 60px",
          backgroundPosition: "0 0, 0 0",
          opacity: 0.9,
        }}
      />
      <AbsoluteFill style={{ backgroundImage: "linear-gradient(90deg, #0a0609 3px, transparent 3px)", backgroundSize: "120px 60px", backgroundPosition: "60px 30px", maskImage: "repeating-linear-gradient(#000 0 30px, transparent 30px 60px)", WebkitMaskImage: "repeating-linear-gradient(transparent 0 30px, #000 30px 60px)" }} />
      {/* wall light from the sign */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at ${pos[0]}px ${pos[1]}px, ${col}${Math.round(on * 80).toString(16).padStart(2, "0")}, transparent 60%)`, opacity: 1 - outro }} />
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <div style={{ position: "absolute", left: pos[0], top: pos[1], transform: "translate(-50%, -50%) rotate(-3deg)", fontFamily: ff, fontWeight: 300, fontSize: size, color: on > 0.5 ? "#fff" : `${col}55`, textShadow: on > 0.5 ? `0 0 6px #fff, 0 0 18px ${col}, 0 0 40px ${col}, 0 0 90px ${col}` : "none", WebkitTextStroke: on > 0.5 ? `2px ${col}` : `2px ${col}55`, whiteSpace: "nowrap" }}>
          {word}
        </div>
        {/* mounting wires */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <path d={`M${pos[0] - 300},0 L${pos[0] - 300},${pos[1] - size * 0.6}`} stroke="#333" strokeWidth={3} />
          <path d={`M${pos[0] + 300},0 L${pos[0] + 300},${pos[1] - size * 0.6}`} stroke="#333" strokeWidth={3} />
        </svg>
        {k === 3 && (
          <div style={{ position: "absolute", left: 0, right: 0, top: 760, textAlign: "center", fontSize: 40, fontWeight: 700, letterSpacing: "0.3em", color: "#fff", opacity: c01((u - 0.8) * 2), textShadow: `0 0 12px ${col}` }}>{(c.role || "Lights & motion").toUpperCase()}</div>
        )}
      </div>
      <Track src="tracks/neon-signs.wav" on={audio} />
    </AbsoluteFill>
  );
}
