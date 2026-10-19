import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, hash, lerp, nameOf, palette, seg, useT } from "../../motion";

type C = { thoughts: string; resolve: string };

// A motion study of overthinking: a single line leaves a small head outline
// and starts to loop; each new worry adds tighter, faster scribble loops and
// a floating thought tag; the tangle fills the frame and vibrates, then one
// breath (a slow pulse) and the whole knot pulls straight into one calm line.
const N = 600;
export default function Overthinking({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const thoughts = [...list(c.thoughts || "what if, did I say that wrong, should I have, but then again, what if not"), "what if", "what if", "what if", "what if", "what if"].slice(0, 5);
  const grow = c01((t - 0.6) / 4.6);
  const chaos = cubicInOut(grow);
  const breath = c01((t - 5.6) / 1.0);
  const untangle = expInOut(seg(t, 6.6, 1.4));
  const jitter = chaos * (1 - breath) * 6;
  const pts = Array.from({ length: N }, (_, i) => {
    const u = i / (N - 1);
    // tangled curve: sum of loops whose radius and frequency grow with chaos
    const a1 = u * Math.PI * 2 * (3 + chaos * 14);
    const a2 = u * Math.PI * 2 * (5 + chaos * 23);
    const rr = 60 + chaos * 380;
    const x = 960 + Math.cos(a1) * rr * (0.4 + 0.6 * hash(Math.floor(u * 20), 1)) + Math.sin(a2) * rr * 0.35 + (hash(i, Math.floor(t * 24)) - 0.5) * jitter;
    const y = 470 + Math.sin(a1 * 1.3) * rr * 0.55 + Math.cos(a2) * rr * 0.25 + (hash(Math.floor(t * 24), i) - 0.5) * jitter;
    // calm target: straight line
    const tx = 260 + u * 1400;
    const ty = 540;
    return [lerp(x, tx, untangle), lerp(y, ty, untangle)];
  });
  const vis = Math.max(2, Math.floor(c01((t - 0.3) / 1.2 + grow) * N));
  const d = pts.slice(0, vis).map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const pulse = 1 + Math.sin(breath * Math.PI) * 0.06;
  const outro = expInOut(seg(t, 9.6, 0.5));
  const headOp = 1 - c01((t - 1.2) * 2);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          {headOp > 0 && <circle cx={960} cy={470} r={70} fill="none" stroke={pal.fg} strokeWidth={6} opacity={headOp} />}
          <g transform={`translate(960 540) scale(${pulse}) translate(-960 -540)`}>
            <path d={d} fill="none" stroke={untangle > 0.5 ? pal.v : pal.fg} strokeWidth={lerp(3 + chaos * 1.5, 8, untangle)} strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />
          </g>
          {thoughts.map((th, i) => {
            const at = 1.0 + i * 0.85;
            const p = c01((t - at) / 0.4);
            const out = c01((t - 5.6) / 0.5);
            const x = 260 + hash(i, 4) * 1400;
            const y = 140 + hash(i, 5) * 800;
            return <Txt key={i} text={`${th}?`} x={x + Math.sin(t * 3 + i) * 8} y={y} size={38 + i * 4} weight={600} color={pal.muted} font={ff} p={p} out={out} mode="fade" italic />;
          })}
          {breath > 0 && breath < 1 && <Txt text="breathe" x={960} y={900} size={40} weight={400} color={pal.muted} font={ff} p={Math.sin(breath * Math.PI)} mode="fade" tracking={0.3} />}
          <Txt text={c.resolve || "One thing at a time."} x={960} y={660} size={72} weight={800} color={pal.fg} font={ff} p={c01((t - 7.8) / 0.7)} tracking={-0.03} mode="blur" />
          <Txt text={nameOf(b)} x={960} y={760} size={40} weight={600} color={pal.v} font={ff} p={c01((t - 8.4) / 0.6)} mode="fade" />
        </Svg>
      </div>
      <Track src="tracks/overthinking.wav" on={audio} />
    </AbsoluteFill>
  );
}
