import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, fontOf, hash, nameOf, palette, seg, useT, type Pal } from "../../motion";

type C = { levels: string; outro: string };

// A powers-of-ten zoom out: from a single transistor to a chip, a GPU board,
// a rack, a hall and the whole site; each level is drawn inside the next, and
// a label and scale bar update as the camera pulls back continuously.
const S = 0.18; // each level is drawn this much smaller inside the next
function Level({ k, pal }: { k: number; pal: Pal }) {
  // every level is a 1000×1000 drawing centred on 0,0
  switch (k) {
    case 0:
      return (
        <g>
          <rect x={-500} y={-500} width={1000} height={1000} fill={pal.card} />
          <rect x={-300} y={-80} width={600} height={160} fill={pal.a} />
          <rect x={-60} y={-260} width={120} height={520} fill={pal.v} />
          <rect x={-400} y={-120} width={100} height={240} fill={pal.faint} />
          <rect x={300} y={-120} width={100} height={240} fill={pal.faint} />
        </g>
      );
    case 1:
      return (
        <g>
          <rect x={-500} y={-500} width={1000} height={1000} rx={30} fill={pal.card2} />
          {Array.from({ length: 64 }, (_, i) => (
            <rect key={i} x={-440 + (i % 8) * 110} y={-440 + Math.floor(i / 8) * 110} width={100} height={100} fill={hash(i, 1) > 0.6 ? pal.v : pal.card} opacity={0.85} />
          ))}
        </g>
      );
    case 2:
      return (
        <g>
          <rect x={-500} y={-500} width={1000} height={1000} rx={20} fill="#1d4b35" />
          {Array.from({ length: 20 }, (_, i) => (
            <line key={i} x1={-480} x2={480} y1={-480 + i * 50} y2={-480 + i * 50} stroke="#e8c26a" strokeWidth={2} opacity={0.3} />
          ))}
          <rect x={-200} y={-200} width={400} height={400} fill="#222" />
          {[-380, 260].map((x) => [-380, 260].map((y) => <rect key={`${x}${y}`} x={x} y={y} width={120} height={120} fill="#333" />))}
        </g>
      );
    case 3:
      return (
        <g>
          <rect x={-500} y={-500} width={1000} height={1000} fill="#141418" />
          {Array.from({ length: 5 }, (_, i) => (
            <rect key={i} x={-380} y={-440 + i * 180} width={760} height={150} rx={8} fill="#26262c" stroke="#3a3a40" strokeWidth={4} />
          ))}
          {Array.from({ length: 30 }, (_, i) => (
            <circle key={i} cx={-340 + (i % 6) * 30} cy={-400 + Math.floor(i / 6) * 180} r={6} fill={pal.v} />
          ))}
        </g>
      );
    case 4:
      return (
        <g>
          <rect x={-500} y={-500} width={1000} height={1000} fill={pal.card} />
          {Array.from({ length: 24 }, (_, i) => (
            <rect key={i} x={-460 + (i % 12) * 78} y={-300 + Math.floor(i / 12) * 420} width={60} height={200} rx={6} fill="#1d1d22" />
          ))}
          <path d="M-480,0 H480" stroke="#38a3ff" strokeWidth={10} strokeDasharray="20 14" />
        </g>
      );
    default:
      return (
        <g>
          <rect x={-500} y={-500} width={1000} height={1000} fill="#1f3326" />
          <rect x={-300} y={-200} width={600} height={400} fill="#2c2c33" />
          {Array.from({ length: 6 }, (_, i) => (
            <rect key={i} x={-280 + i * 95} y={-180} width={80} height={360} fill="#3a3a42" />
          ))}
          <rect x={-450} y={260} width={240} height={160} fill={pal.a} opacity={0.8} />
          <path d="M-330,260 V200" stroke={pal.a} strokeWidth={6} />
        </g>
      );
  }
}

export default function PowersZoom({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const labels = [...list(c.levels || "Transistor, Chip, GPU board, Rack, Hall, Data centre"), "", "", "", "", "", ""].slice(0, 6);
  const scales = ["10 nm", "1 cm", "10 cm", "2 m", "50 m", "500 m"];
  // continuous depth 0 → 5 over ~9 s (logarithmic zoom)
  const depth = Math.min(5, Math.max(0, (t - 0.8) / 1.7));
  const lvl = Math.min(5, Math.floor(depth + 0.15));
  const outro = expInOut(seg(t, 10.2, 0.5));
  const endP = c01((t - 10.6) / 0.8);
  // camera scale: level k fills the screen at depth k
  const base = Math.floor(depth);
  const f = depth - base;
  const zoom = Math.pow(S, f); // shrink factor going outward
  const levels = [] as JSX.Element[];
  for (let k = Math.max(0, base - 1); k <= Math.min(5, base + 1); k++) {
    // size of level k relative to level `base`: S^(base-k)
    const sc = Math.pow(S, base - k) * zoom * 2.2;
    levels.push(
      <g key={k} transform={`translate(960 540) scale(${sc})`}>
        <Level k={k} pal={pal} />
      </g>,
    );
  }

  return (
    <AbsoluteFill style={{ background: "#0a0a0c", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>{levels.reverse()}</Svg>
        <div style={{ position: "absolute", left: 90, bottom: 80, color: "#fff" }}>
          <div key={lvl} style={{ fontSize: 80, fontWeight: 800, letterSpacing: "-0.03em" }}>{labels[lvl]}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 10 }}>
            <div style={{ width: 200, height: 8, background: pal.v, borderRadius: 4 }} />
            <div style={{ fontSize: 34, fontWeight: 700, color: pal.v }}>{scales[lvl]}</div>
          </div>
        </div>
        <div style={{ position: "absolute", right: 90, top: 70, fontSize: 30, color: "rgba(255,255,255,0.6)", fontVariantNumeric: "tabular-nums" }}>×{Math.round(Math.pow(1 / S, depth)).toLocaleString("en-US")}</div>
      </div>
      {endP > 0 && (
        <AbsoluteFill style={{ background: pal.bg }}>
          <Svg>
            <Txt text={c.outro || "Every answer starts this small."} x={960} y={520} size={90} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.03} />
            <Txt text={nameOf(b)} x={960} y={640} size={48} weight={600} color={pal.v} font={ff} p={c01((t - 11.0) / 0.6)} mode="fade" />
          </Svg>
        </AbsoluteFill>
      )}
      <Track src="tracks/powers-zoom.wav" on={audio} />
    </AbsoluteFill>
  );
}
