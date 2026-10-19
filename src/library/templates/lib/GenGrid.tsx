import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, expInOut, fit, fontOf, hash, lerp, mix, nameOf, palette, seg, useT, type Pal } from "../../motion";

type C = { prompts: string; speed: string; tagline: string };

// A generation showreel: prompts type into a bar and tiles resolve out of
// noise, first one at a time, then a few, then a whole wall at once, while
// three words count the pace up. Ends by zooming into one tile.
function Art({ v, pal }: { v: number; pal: Pal }) {
  const k = Math.floor(hash(v, 7) * 6);
  const A = [pal.v, pal.a, pal.fg][v % 3];
  const B = mix(pal.bg, pal.fg, 0.1);
  switch (k) {
    case 0:
      return (
        <>
          <rect width={100} height={100} fill={B} />
          <circle cx={30 + hash(v, 1) * 40} cy={38} r={18} fill={A} />
          <path d="M0,78 L30,52 L52,70 L74,46 L100,72 L100,100 L0,100Z" fill={pal.fg} opacity={0.85} />
        </>
      );
    case 1:
      return (
        <>
          <rect width={100} height={100} fill={A} />
          {Array.from({ length: 6 }, (_, i) => (
            <rect key={i} x={-20 + i * 24} y={-10} width={9} height={130} fill={pal.bg} transform="rotate(24 50 50)" />
          ))}
        </>
      );
    case 2:
      return (
        <>
          <rect width={100} height={100} fill={pal.bg} />
          {[40, 30, 20, 10].map((r, i) => (
            <circle key={r} cx={50} cy={60} r={r} fill={i % 2 ? pal.bg : A} />
          ))}
        </>
      );
    case 3:
      return (
        <>
          <rect width={100} height={100} fill={B} />
          {Array.from({ length: 16 }, (_, i) => (
            <rect key={i} x={10 + (i % 4) * 21} y={10 + Math.floor(i / 4) * 21} width={16} height={16} rx={4} fill={hash(v, i) > 0.7 ? A : pal.fg} opacity={hash(v, i) > 0.7 ? 1 : 0.25} />
          ))}
        </>
      );
    case 4:
      return (
        <>
          <rect width={100} height={100} fill={A} />
          <path d="M0,60 Q25,40 50,60 T100,60 L100,100 L0,100Z" fill={pal.bg} />
          <path d="M0,72 Q25,52 50,72 T100,72 L100,100 L0,100Z" fill={pal.fg} opacity={0.6} />
        </>
      );
    default:
      return (
        <>
          <rect width={100} height={100} fill={pal.fg} />
          <path d="M50,14 L86,82 L14,82Z" fill={A} />
          <circle cx={50} cy={60} r={10} fill={pal.bg} />
        </>
      );
  }
}

function Tile({ x, y, s, v, p, t, pal }: { x: number; y: number; s: number; v: number; p: number; t: number; pal: Pal }) {
  const N = 8;
  return (
    <g transform={`translate(${x} ${y}) scale(${s / 100})`}>
      <clipPath id={`gg${v}`}>
        <rect width={100} height={100} rx={8} />
      </clipPath>
      <g clipPath={`url(#gg${v})`}>
        <Art v={v} pal={pal} />
        {Array.from({ length: N * N }, (_, i) => {
          const th = hash(v, i, 3);
          if (p > th) return null;
          const g = hash(v, i, Math.floor(t * 12));
          return <rect key={i} x={(i % N) * (100 / N)} y={Math.floor(i / N) * (100 / N)} width={100 / N + 0.5} height={100 / N + 0.5} fill={mix(pal.bg, pal.fg, g * 0.5)} />;
        })}
      </g>
    </g>
  );
}

export default function GenGrid({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const prompts = [...list(c.prompts || "a lighthouse in fog, a red kite at noon, waves in ink"), "a quiet street", "a bright idea", "a fast car"];
  const words = ["Fast.", "Faster.", "All at once."];
  const zoom = expInOut(seg(t, 8.0, 1.0));
  const endP = c01((t - 8.6) / 0.8);
  // phase 1: one tile per prompt (0.3–3.2); phase 2: a 4×2 row (3.2–5); phase 3: a 10×5 wall (5–8)
  const phase = t < 3.2 ? 0 : t < 5.0 ? 1 : 2;
  const pi = Math.min(2, Math.floor((t - 0.3) / 0.95));
  const ptxt = prompts[pi] ?? prompts[0];
  const typed = ptxt.slice(0, Math.floor(c01((t - 0.3 - pi * 0.95) / 0.45) * ptxt.length));
  const tiles: { x: number; y: number; s: number; v: number; p: number }[] = [];
  if (phase === 0) {
    const p = c01((t - 0.75 - pi * 0.95) / 0.45);
    tiles.push({ x: 960 - 260, y: 330, s: 520, v: pi, p });
  } else if (phase === 1) {
    for (let i = 0; i < 8; i++) tiles.push({ x: 960 - 2 * 250 + (i % 4) * 250 - 110, y: 300 + Math.floor(i / 4) * 250, s: 220, v: 10 + i, p: c01((t - 3.3 - i * 0.12) / 0.4) });
  } else {
    for (let i = 0; i < 50; i++) tiles.push({ x: 960 - 5 * 172 + (i % 10) * 172 + 6, y: 150 + Math.floor(i / 10) * 172, s: 160, v: 30 + i, p: c01((t - 5.1 - hash(i, 9) * 1.4) / 0.35) });
  }
  const focus = tiles.length > 12 ? tiles[22] : tiles[0];
  const zs = lerp(1, 1080 / focus.s * 1.05, zoom);
  const fx = focus.x + focus.s / 2;
  const fy = focus.y + focus.s / 2;
  const word = words[phase];
  const ws = fit(word, 900, 130, 800, -0.04, ff);
  const speed = c.speed || "0.4s per image";

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <Svg>
        <g transform={`translate(${lerp(fx, 960, zoom)} ${lerp(fy, 540, zoom)}) scale(${zs}) translate(${-fx} ${-fy})`} opacity={1 - c01((t - 8.6) * 3)}>
          {tiles.map((k) => (
            <Tile key={k.v} {...k} t={t} pal={pal} />
          ))}
        </g>
        {phase === 0 && (
          <g>
            <rect x={960 - 520} y={890} width={1040} height={96} rx={48} fill={pal.card2} />
            <text x={960 - 470} y={952} fontFamily={MONO} fontSize={36} fill={pal.fg}>
              {typed}
              {Math.floor(t * 3) % 2 === 0 ? "▍" : ""}
            </text>
            <circle cx={960 + 470} cy={938} r={30} fill={pal.v} />
          </g>
        )}
        {zoom < 0.2 && (
          <>
            <Txt text={word} x={phase === 2 ? 960 : 1500} y={phase === 2 ? 1040 : 420} size={phase === 2 ? 70 : ws} weight={800} color={pal.v} font={ff} p={c01((t - [0.4, 3.25, 5.1][phase]) / 0.5)} tracking={-0.04} />
            {phase === 1 && <Txt text={speed} x={1500} y={520} size={40} weight={600} color={pal.muted} font={ff} p={c01((t - 3.6) / 0.5)} mode="fade" />}
          </>
        )}
      </Svg>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={540} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Imagine it. It is already there."} x={960} y={660} size={50} weight={500} color={pal.muted} font={ff} p={c01((t - 9.0) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/gen-grid.wav" on={audio} />
    </AbsoluteFill>
  );
}

