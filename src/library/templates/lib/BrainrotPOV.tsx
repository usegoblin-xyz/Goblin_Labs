import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, fit, fontOf, hash, lerp, nameOf, palette, useT } from "../../motion";

type C = { pov: string; thoughts: string; tagline: string };

// A vertical, deliberately chaotic POV: "POV: you are a language model".
// Tokens rain, thoughts slam in at odd angles every half-beat, the screen
// glitches and splits, a probability bar flickers between options, and it
// snaps to calm on the final line.
export default function BrainrotPOV({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const pov = c.pov || "POV: you are a language model";
  const thoughts = [...list(c.thoughts || "next token?, the?, a?, banana??, focus., be helpful, 50 tabs open, someone said please, 99% sure, wait no")].slice(0, 10);
  const W = 1080;
  const H = 1920;
  const BEAT = 60 / 140;
  const half = BEAT / 2;
  const k = Math.floor(t / half);
  const calm = t > 8.6;
  const endP = c01((t - 9.0) / 0.6);
  const glitch = !calm && hash(k, 7) > 0.7;
  const shakeX = calm ? 0 : (hash(k, 1) - 0.5) * 30;
  const shakeY = calm ? 0 : (hash(k, 2) - 0.5) * 30;
  const bg = calm ? pal.bg : [pal.bg, pal.v, "#111", pal.a][k % 4];
  const fgOn = (col: string) => (col === pal.v ? pal.onV : col === pal.a ? pal.onA : pal.fg);
  const thought = thoughts[k % thoughts.length];
  const opts = ["the", "a", "banana", "focus"];
  const probs = opts.map((_, i) => 0.1 + hash(k, i + 10) * 0.9);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden", fontFamily: ff }}>
      {/* token rain */}
      {!calm && (
        <Svg w={W} h={H}>
          {Array.from({ length: 60 }, (_, i) => {
            const x = hash(i, 3) * W;
            const y = ((hash(i, 4) * H + t * (400 + hash(i, 5) * 900)) % (H + 200)) - 100;
            return (
              <text key={i} x={x} y={y} fontFamily={MONO} fontSize={26 + hash(i, 6) * 20} fill={fgOn(bg)} opacity={0.25}>
                {["tok", "<s>", "the", "##ing", "0.98", "▍", "attn", "∑"][i % 8]}
              </text>
            );
          })}
        </Svg>
      )}
      <div style={{ position: "absolute", inset: 0, transform: `translate(${shakeX}px, ${shakeY}px)` }}>
        {!calm && (
          <>
            <div style={{ position: "absolute", left: 60, right: 60, top: 140, padding: "26px 34px", borderRadius: 30, background: "#000", color: "#fff", fontSize: fit(pov, 900, 58, 800, -0.02, ff), fontWeight: 800, textAlign: "center" }}>{pov}</div>
            <div key={k} style={{ position: "absolute", left: "50%", top: 820 + (hash(k, 3) - 0.5) * 300, transform: `translate(-50%, -50%) rotate(${(hash(k, 4) - 0.5) * 24}deg) scale(${1 + Math.exp(-((t % half) / half) * 6) * 0.4})`, fontSize: fit(thought, 960, 200, 900, -0.04, ff), fontWeight: 900, color: fgOn(bg), letterSpacing: "-0.04em", whiteSpace: "nowrap", textShadow: glitch ? `8px 0 ${pal.a}, -8px 0 ${pal.v}` : undefined }}>
              {thought}
            </div>
            {/* probability bars */}
            <div style={{ position: "absolute", left: 90, right: 90, top: 1300 }}>
              {opts.map((o, i) => (
                <div key={o} style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
                  <div style={{ width: 170, fontFamily: MONO, fontSize: 34, color: fgOn(bg) }}>{o}</div>
                  <div style={{ flex: 1, height: 40, borderRadius: 20, background: "rgba(0,0,0,0.25)" }}>
                    <div style={{ width: `${probs[i] * 100}%`, height: "100%", borderRadius: 20, background: i === 0 ? fgOn(bg) : "rgba(255,255,255,0.5)" }} />
                  </div>
                </div>
              ))}
            </div>
            {glitch && (
              <div style={{ position: "absolute", left: 0, right: 0, top: 600 + hash(k, 9) * 600, height: 80, background: pal.v, mixBlendMode: "difference", opacity: 0.8 }} />
            )}
          </>
        )}
      </div>
      {calm && (
        <Svg w={W} h={H}>
          <Txt text="Anyway." x={540} y={860} size={140} weight={800} color={pal.fg} font={ff} p={c01((t - 8.6) / 0.4)} tracking={-0.04} />
          <Txt text={nameOf(b)} x={540} y={1060} size={110} weight={800} color={pal.v} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Thinking out loud."} x={540} y={1160} size={46} weight={500} color={pal.muted} font={ff} p={c01((t - 9.3) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/brainrot-pov.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = lerp;
