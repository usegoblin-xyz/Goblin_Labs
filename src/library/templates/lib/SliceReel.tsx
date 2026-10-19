import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Track, c01, expInOut, fit, fontOf, nameOf, palette, seg, useT } from "../../motion";

type C = { words: string; role: string };

// A slice-cut showreel: each scene is a full-bleed colour with a big word;
// transitions slash the frame into diagonal strips that slide off in
// alternating directions to reveal the next scene underneath, with the
// slice angle changing each cut.
export default function SliceReel({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const words = [...list(c.words || "CUT, SLICE, SHIFT, REVEAL"), "CUT", "CUT", "CUT", "CUT"].slice(0, 4);
  const scenes = [...words, nameOf(b)];
  const bgs = [pal.v, pal.fg, pal.a, "#38a3ff", pal.bg];
  const fgs = [pal.onV, pal.bg, pal.onA, "#fff", pal.fg];
  const per = 1.5;
  const start = 0.5;
  const k = Math.min(4, Math.max(0, Math.floor((t - start) / per)));
  const u = t - start - k * per;
  const cut = k < 4 ? expInOut(c01((u - per + 0.45) / 0.45)) : 0;
  const angle = [-20, 25, -35, 15][Math.min(3, k)];
  const strips = 5;
  const outro = expInOut(seg(t, start + per * 4 + 1.6, 0.5));
  const Scene = ({ i }: { i: number }) => (
    <div style={{ position: "absolute", inset: 0, background: bgs[i], display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div style={{ fontSize: fit(scenes[i], 1600, 320, 900, -0.04, ff), fontWeight: 900, letterSpacing: "-0.04em", color: fgs[i], transform: `scale(${1 + (i === k ? u * 0.03 : 0)})` }}>{scenes[i]}</div>
      {i === 4 && <div style={{ fontSize: 46, fontWeight: 600, color: pal.v, opacity: c01((t - start - per * 4 - 0.4) * 2) }}>{c.role || "Editing & motion"}</div>}
    </div>
  );

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {k < 4 && <Scene i={k + 1} />}
        {Array.from({ length: strips }, (_, s) => {
          const dir = s % 2 ? 1 : -1;
          const p = k < 4 ? expInOut(c01((u - per + 0.45 - s * 0.05) / 0.45)) : 0;
          const ar = (angle * Math.PI) / 180;
          const dx = Math.cos(ar);
          const dy = Math.sin(ar);
          const nx = -dy;
          const ny = dx;
          const span = 1400;
          const n0 = -span + (s / strips) * span * 2;
          const n1 = -span + ((s + 1) / strips) * span * 2 + 4;
          const pt = (n: number, m: number) => `${(960 + nx * n + dx * m).toFixed(0)}px ${(540 + ny * n + dy * m).toFixed(0)}px`;
          const poly = `polygon(${pt(n0, -3000)}, ${pt(n0, 3000)}, ${pt(n1, 3000)}, ${pt(n1, -3000)})`;
          const off = dir * p * 3000;
          return (
            <div key={s} style={{ position: "absolute", inset: 0, clipPath: poly, transform: `translate(${dx * off}px, ${dy * off}px)` }}>
              <Scene i={k} />
            </div>
          );
        })}
        {cut > 0 && cut < 1 && <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: (1 - cut) * 0.15 }} />}
      </div>
      <Track src="tracks/slice-reel.wav" on={audio} />
    </AbsoluteFill>
  );
}
