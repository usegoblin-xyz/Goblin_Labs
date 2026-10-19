import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fit, fontOf, nameOf, palette, seg, useT } from "../../motion";

type C = { words: string; role: string };

// An aperture showreel: a camera iris of eight blades opens on each beat to
// reveal a new coloured scene with a word, then snaps shut, rotating a few
// degrees each time; the final opening reveals the name.
export default function ApertureReel({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const words = [...list(c.words || "Focus, Frame, Light, Story"), "Shot", "Shot", "Shot", "Shot"].slice(0, 4);
  const scenes = [...words, nameOf(b)];
  const per = 1.6;
  const start = 0.3;
  const k = Math.min(4, Math.max(0, Math.floor((t - start) / per)));
  const u = (t - start - k * per) / per;
  const last = k === 4;
  // open 0→1 in the first 30%, hold, close in the last 20% (except last scene)
  const open = cubicInOut(c01(u / 0.3)) * (last ? 1 : 1 - cubicInOut(c01((u - 0.8) / 0.2)));
  const bg = [pal.v, pal.a, pal.fg, "#38a3ff", pal.bg][k];
  const fg = [pal.onV, pal.onA, pal.bg, "#fff", pal.fg][k];
  const blades = 8;
  const R = 1300;
  const rot = k * 22 + open * 30;
  const outro = expInOut(seg(t, start + per * 5 + 0.4, 0.5));
  const word = scenes[k];

  return (
    <AbsoluteFill style={{ background: "#0b0b0d", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <AbsoluteFill style={{ background: bg, alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: fit(word, 1500, 300, 900, -0.04, ff), fontWeight: 900, letterSpacing: "-0.04em", color: fg, transform: `scale(${1.15 - open * 0.15})` }}>{word}</div>
          {last && <div style={{ marginTop: 20, fontSize: 46, fontWeight: 600, color: pal.v, opacity: c01((u - 0.3) * 3) }}>{c.role || "Film & motion"}</div>}
        </AbsoluteFill>
        <Svg>
          <g transform={`translate(960 540) rotate(${rot})`}>
            {Array.from({ length: blades }, (_, i) => {
              const a = (i / blades) * Math.PI * 2;
              // each blade is a big quad that slides outward as the iris opens
              const inner = (1 - open) * 0 + open * 900;
              const p = (ang: number, r: number) => `${Math.cos(ang) * r},${Math.sin(ang) * r}`;
              const step = (Math.PI * 2) / blades;
              const d = `M${p(a, inner)} L${p(a + step * 1.6, inner + 40)} L${p(a + step * 1.6, R)} L${p(a, R)} Z`;
              return <path key={i} d={d} fill={i % 2 ? "#161618" : "#1d1d20"} stroke="#000" strokeWidth={4} transform={`rotate(${open * 18})`} />;
            })}
          </g>
          <circle cx={960} cy={540} r={1150} fill="none" stroke="#0b0b0d" strokeWidth={600} />
          <Txt text={`f/${[1.4, 2, 2.8, 4, 5.6][k]}`} x={1820} y={1040} size={30} weight={700} color="#fff" font={ff} p={1} anchor="end" />
        </Svg>
      </div>
      <Track src="tracks/aperture-reel.wav" on={audio} />
    </AbsoluteFill>
  );
}
