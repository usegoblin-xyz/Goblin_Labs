import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Track, c01, cubicInOut, expInOut, fit, fontOf, nameOf, palette, seg, useT } from "../../motion";

type C = { words: string; role: string };

// A tile-flip showreel: the frame is a 12×7 grid of tiles; waves of flips
// travel across it (diagonal, radial, from the centre, random) and each wave
// reveals the next full-frame word printed across the backs of the tiles,
// ending on the name.
export default function TileFlipReel({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const words = [...list(c.words || "THINK, SKETCH, BUILD, SHIP"), "MAKE", "MAKE", "MAKE", "MAKE"].slice(0, 4);
  const faces = [...words, nameOf(b)];
  const COLS = 12;
  const ROWS = 7;
  const tw = 1920 / COLS;
  const th = 1080 / ROWS;
  const per = 1.8;
  const start = 0.4;
  const fields = [
    [pal.bg, pal.fg],
    [pal.v, pal.onV],
    [pal.fg, pal.bg],
    [pal.a, pal.onA],
    [pal.v, pal.onV],
    [pal.bg, pal.fg],
  ];
  const outro = expInOut(seg(t, start + per * 5 + 0.6, 0.5));
  // delay pattern per wave, 0..1
  const delay = (w: number, i: number, j: number) => {
    const cx = (i + 0.5) / COLS - 0.5;
    const cy = (j + 0.5) / ROWS - 0.5;
    switch (w % 4) {
      case 0:
        return (i / COLS + j / ROWS) / 2;
      case 1:
        return Math.min(1, Math.hypot(cx, cy) * 1.4);
      case 2:
        return 1 - Math.min(1, Math.hypot(cx, cy) * 1.4);
      default:
        return ((i * 7 + j * 13) % 17) / 17;
    }
  };
  const faceSize = (s: string) => fit(s, 1700, 380, 900, -0.04, ff);
  const face = (idx: number, i: number, j: number) => {
    const [bg, fg] = fields[Math.min(idx + 1, fields.length - 1)];
    const s = idx < 0 ? "" : faces[idx];
    return (
      <div style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden", backfaceVisibility: "hidden" }}>
        <div style={{ position: "absolute", left: -i * tw, top: -j * th, width: 1920, height: 1080, display: "flex", alignItems: "center", justifyContent: "center", fontSize: s ? faceSize(s) : 0, fontWeight: 900, letterSpacing: "-0.04em", color: fg, whiteSpace: "nowrap" }}>{s}</div>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff, perspective: 3000 }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {Array.from({ length: COLS * ROWS }, (_, n) => {
          const i = n % COLS;
          const j = Math.floor(n / COLS);
          // which wave are we in for this tile?
          let shown = -1;
          let rot = 0;
          for (let w = 0; w < faces.length; w++) {
            const ts = start + w * per + delay(w, i, j) * 0.7;
            const p = cubicInOut(c01((t - ts) / 0.45));
            if (p >= 1) shown = w;
            else if (p > 0) {
              rot = p * 180;
              shown = w - 1;
              const front = p < 0.5 ? shown : w;
              return (
                <div key={n} style={{ position: "absolute", left: i * tw, top: j * th, width: tw + 1, height: th + 1, transform: `rotateY(${p < 0.5 ? rot : rot - 180}deg)` }}>
                  {face(front, i, j)}
                </div>
              );
            }
          }
          return (
            <div key={n} style={{ position: "absolute", left: i * tw, top: j * th, width: tw + 1, height: th + 1 }}>
              {face(shown, i, j)}
            </div>
          );
        })}
      </div>
      {t > start + per * 4 + 1.0 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 760, textAlign: "center", fontSize: 50, fontWeight: 600, color: fields[5][1], opacity: c01((t - start - per * 4 - 1.0) * 2) * (1 - outro) }}>{c.role || "Motion design studio"}</div>
      )}
      <Track src="tracks/tile-flip-reel.wav" on={audio} />
    </AbsoluteFill>
  );
}
