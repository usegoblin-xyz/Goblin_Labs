import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fit, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { words: string; role: string };

// A vertical showreel: blocks of color and words drop one by one and stack
// into a tower like a poster being composed; the tower then splits, slides
// and re-stacks into a second arrangement, and resolves into the name.
export default function PortraitReel({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const words = [...list(c.words || "BOLD, TYPE, SHAPE, COLOR, MOTION, RHYTHM"), "MOVE"].slice(0, 6);
  const W = 1080;
  const H = 1920;
  const cols = [pal.v, pal.a, pal.fg, pal.card2, pal.v, pal.a];
  const blockH = 225;
  const resh = expInOut(seg(t, 5.2, 1.0));
  const outro = expInOut(seg(t, 8.0, 0.6));
  const endP = c01((t - 8.4) / 0.8);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {words.map((w, i) => {
          const at = 0.3 + i * 0.6;
          const drop = spring(t - at, 13, 0.55);
          // stacked position (A): bottom up
          const yA = H - 240 - (i + 1) * blockH;
          // rearranged (B): two columns, alternating
          const xB = i % 2 ? W / 2 + 10 : 40;
          const yB = 300 + Math.floor(i / 2) * 470;
          const x = lerp(40, xB, resh);
          const y = lerp(yA, yB, resh);
          const w2 = lerp(W - 80, W / 2 - 50, resh);
          const h2 = lerp(blockH - 16, 450, resh);
          const rot = lerp((hash(i, 1) - 0.5) * 6, 0, cubicInOut(c01((t - at - 0.2) / 0.5)));
          const col = cols[i];
          const on = col === pal.v ? pal.onV : col === pal.a ? pal.onA : col === pal.fg ? pal.bg : pal.fg;
          return (
            <div key={i} style={{ position: "absolute", left: x, top: y - (1 - drop) * 1800, width: w2, height: h2, borderRadius: lerp(18, 36, resh), background: col, transform: `rotate(${rot}deg)`, display: "flex", alignItems: resh > 0.5 ? "flex-end" : "center", padding: resh > 0.5 ? 30 : "0 40px", boxSizing: "border-box", overflow: "hidden" }}>
              <div style={{ fontSize: fit(w, w2 - 80, resh > 0.5 ? 120 : 210, 900, -0.04, ff), fontWeight: 900, letterSpacing: "-0.04em", color: on, lineHeight: 1, whiteSpace: "nowrap" }}>{w}</div>
            </div>
          );
        })}
        <Svg w={W} h={H}>
          <Txt text={c.role || "MOTION DESIGNER"} x={540} y={170} size={48} weight={800} color={pal.fg} font={ff} p={c01((t - 0.2) / 0.6)} tracking={0.2} />
        </Svg>
      </div>
      {endP > 0 && (
        <Svg w={W} h={H}>
          <Txt text={nameOf(b)} x={540} y={940} size={fit(nameOf(b), 900, 190, 800, -0.04, ff)} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={(c.role || "Motion designer").toLowerCase()} x={540} y={1050} size={50} weight={600} color={pal.v} font={ff} p={c01((t - 8.8) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/portrait-reel.wav" on={audio} />
    </AbsoluteFill>
  );
}
