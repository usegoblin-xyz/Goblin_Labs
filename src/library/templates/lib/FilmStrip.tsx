import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, cubicInOut, expInOut, fit, fontOf, kf, lerp, nameOf, palette, seg, useT, type Pal } from "../../motion";

type C = { prompt: string; features: string; tagline: string };

// Frame by frame: the launch plays on a strip of film. The strip advances a
// frame per beat with a mechanical snap; each frame holds one moment of the
// product (prompt, thinking, result, two features), and the last frame
// pushes in to fill the screen.
function FrameArt({ k, pal, ff, prompt, features }: { k: number; pal: Pal; ff: string; prompt: string; features: string[] }) {
  if (k === 0)
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "82%", height: 90, borderRadius: 45, background: pal.card2, display: "flex", alignItems: "center", padding: "0 36px", fontFamily: MONO, fontSize: 32, color: pal.fg, boxSizing: "border-box", whiteSpace: "nowrap", overflow: "hidden" }}>{prompt}</div>
      </div>
    );
  if (k === 1)
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 34, height: 34, borderRadius: 17, background: i === 1 ? pal.v : pal.fg, opacity: 0.8 }} />
        ))}
      </div>
    );
  if (k === 2)
    return (
      <div style={{ position: "absolute", inset: 40 }}>
        <div style={{ width: "60%", height: 28, borderRadius: 14, background: pal.fg }} />
        <div style={{ marginTop: 22, width: "90%", height: 16, borderRadius: 8, background: pal.muted }} />
        <div style={{ marginTop: 14, width: "80%", height: 16, borderRadius: 8, background: pal.muted }} />
        <div style={{ marginTop: 14, width: "45%", height: 16, borderRadius: 8, background: pal.v }} />
        <div style={{ marginTop: 26, height: 120, borderRadius: 20, background: pal.card2 }} />
      </div>
    );
  return (
    <div style={{ position: "absolute", inset: 40, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ fontSize: fit(features[k - 3], 560, 64, 800, -0.03, ff), fontWeight: 800, color: k === 3 ? pal.fg : pal.onV, letterSpacing: "-0.03em" }}>{features[k - 3]}</div>
      <div style={{ marginTop: 18, width: 140, height: 10, borderRadius: 5, background: k === 3 ? pal.v : pal.onV }} />
    </div>
  );
}

export default function FilmStrip({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const prompt = c.prompt || "turn my notes into a launch page";
  const features = [...list(c.features || "One prompt, Ready to ship"), "Fast", "Simple"].slice(0, 2);
  const FW = 640;
  const FH = 400;
  const GAP = 60;
  const frames = 5;
  // advance one frame per 0.9 s with a snappy pull-down
  const step = (time: number) => {
    const n = Math.max(0, Math.min(frames - 1, Math.floor((time - 1.2) / 0.9) + 1));
    const local = c01(((time - 1.2) % 0.9) / 0.25);
    const prev = Math.max(0, n - 1);
    return time < 1.2 ? 0 : lerp(prev, n, n === prev ? 1 : cubicInOut(local));
  };
  const pos = step(t);
  const push = expInOut(seg(t, 6.0, 0.9));
  const endP = c01((t - 7.2) / 0.8);
  const fade = expInOut(seg(t, 6.9, 0.4));
  const shake = Math.sin(t * 120) * 1.5 * (pos % 1 > 0.01 && pos % 1 < 0.99 ? 1 : 0);
  const stripX = 960 - FW / 2 - pos * (FW + GAP);
  const zoom = lerp(1, 1920 / FW, push);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: "960px 540px", transform: `scale(${zoom})`, opacity: 1 - fade }}>
        <div style={{ position: "absolute", left: stripX - 400, top: 540 - FH / 2 - 90 + shake, width: frames * (FW + GAP) + 800, height: FH + 180, background: "#0c0c0e" }}>
          {Array.from({ length: Math.ceil((frames * (FW + GAP) + 800) / 60) }, (_, i) => (
            <div key={i}>
              <div style={{ position: "absolute", left: i * 60 + 18, top: 24, width: 28, height: 36, borderRadius: 6, background: pal.bg }} />
              <div style={{ position: "absolute", left: i * 60 + 18, bottom: 24, width: 28, height: 36, borderRadius: 6, background: pal.bg }} />
            </div>
          ))}
          {Array.from({ length: frames }, (_, k) => (
            <div key={k} style={{ position: "absolute", left: 400 + k * (FW + GAP), top: 90, width: FW, height: FH, borderRadius: 10, overflow: "hidden", background: k === 4 ? pal.v : pal.card }}>
              <FrameArt k={k} pal={pal} ff={ff} prompt={prompt} features={features} />
            </div>
          ))}
        </div>
      </div>
      <Svg>
        <text x={120} y={150} fontFamily={MONO} fontSize={32} fill={pal.muted} opacity={(1 - fade) * c01(t * 2)}>
          FRAME {String(Math.round(pos) + 1).padStart(2, "0")} / {String(frames).padStart(2, "0")}
        </text>
        {endP > 0 && (
          <>
            <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
            <Txt text={c.tagline || "Launch, frame by frame."} x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - 7.6) / 0.6)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/film-strip.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _k = kf;
