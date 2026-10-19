import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expOut, fit, fontOf, hash, initialOf, nameOf, onColor, palette, spring, useT } from "../../motion";

type C = { lines: string; ticker: string };

// A vertical hype edit for a crypto community: hard cuts on every beat at
// 128 BPM, a token spinning in 3D, a candle rally, slammed words with
// inverted flash frames, speed lines, a wall of tokens, and the ticker to end.
const W = 1080;
const H = 1920;
const BEAT = 60 / 128;

function Token({ x, y, size, spin, pal, letter }: { x: number; y: number; size: number; spin: number; pal: ReturnType<typeof palette>; letter: string }) {
  const sx = Math.cos(spin);
  const face = sx >= 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${Math.max(0.04, Math.abs(sx))} 1)`}>
      <circle r={size / 2 + size * 0.06} fill={pal.a} />
      <circle r={size / 2} fill={face ? pal.p : pal.a} stroke={onColor(pal.p)} strokeOpacity={0.25} strokeWidth={size * 0.03} />
      <circle r={size * 0.38} fill="none" stroke={onColor(pal.p)} strokeOpacity={0.35} strokeWidth={size * 0.015} strokeDasharray={`${size * 0.03} ${size * 0.03}`} />
      {face && (
        <text y={size * 0.2} textAnchor="middle" fontSize={size * 0.56} fontWeight={900} fill={onColor(pal.p)} fontFamily="Inter, sans-serif">
          {letter}
        </text>
      )}
    </g>
  );
}

export default function CryptoHype({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const letter = initialOf(b);
  const lines = (c.lines || "Built different / Fully on-chain / Join the community").split("/").map((s) => s.trim().toUpperCase());
  while (lines.length < 3) lines.push("LFG");
  const ticker = (c.ticker || `$${name.slice(0, 4).toUpperCase()}`).toUpperCase();
  const beat = Math.floor(t / BEAT);
  const bt = (t % BEAT) / BEAT; // phase within beat
  const kick = Math.exp(-bt * 6); // punch at each beat
  const sec = (a: number, z: number) => beat >= a && beat < z;
  const invert = beat === 5 || beat === 11 || beat === 17;
  const bg = invert ? pal.fg : "#050505";
  const ink = invert ? "#050505" : "#ffffff";

  const stackWords = (line: string) => {
    const ws = line.split(/\s+/);
    const gap = Math.min(260, 1100 / ws.length);
    return ws.map((w, i) => {
      const s = spring(t - Math.floor(t / BEAT) * BEAT - i * 0.06, 22, 0.6);
      return (
        <g key={i} transform={`translate(540 ${960 - ((ws.length - 1) * gap) / 2 + i * gap}) scale(${1.4 - 0.4 * s}) translate(-540 0)`}>
          <Txt text={w} x={540} y={gap * 0.36} size={fit(w, 960, gap * 1.05, 900)} weight={900} color={i === ws.length - 1 ? pal.p : ink} font={ff} tracking={-0.05} mode="fade" stagger={0} />
        </g>
      );
    });
  };

  let scene = null;
  if (sec(0, 3)) {
    const s = expOut(c01(t / 0.5));
    scene = <Token x={540} y={900} size={560 * s * (1 + kick * 0.06)} spin={t * 7} pal={pal} letter={letter} />;
  } else if (sec(3, 5)) {
    const k = c01((t - 3 * BEAT) / (2 * BEAT));
    const n = 12;
    scene = (
      <>
        {Array.from({ length: n }).map((_, i) => {
          if (i / n > k) return null;
          const base = 1300 - i * 75 - hash(i, 2) * 40;
          const h = 60 + hash(i, 1) * 110;
          const up = hash(i, 3) > 0.22;
          return (
            <g key={i}>
              <line x1={130 + i * 72} x2={130 + i * 72} y1={base - h - 40} y2={base + 30} stroke={up ? pal.p : "#ff4d5e"} strokeWidth={4} />
              <rect x={130 + i * 72 - 22} y={base - h} width={44} height={h} fill={up ? pal.p : "#ff4d5e"} />
            </g>
          );
        })}
        <Txt text={`+${Math.round(k * 420)}%`} x={540} y={420} size={190} weight={900} color={pal.p} font={ff} tracking={-0.04} />
      </>
    );
  } else if (sec(5, 7)) {
    scene = <>{stackWords(lines[0])}</>;
  } else if (sec(7, 10)) {
    const z = 1 + (t - 7 * BEAT) * 1.4;
    scene = (
      <>
        {Array.from({ length: 40 }).map((_, i) => {
          const a = hash(i, 1) * Math.PI * 2;
          const r1 = 200 + ((hash(i, 2) * 900 + t * 2600) % 900);
          return <line key={i} x1={540 + Math.cos(a) * r1} y1={960 + Math.sin(a) * r1} x2={540 + Math.cos(a) * (r1 + 160)} y2={960 + Math.sin(a) * (r1 + 160)} stroke={i % 3 ? "#ffffff" : pal.p} strokeWidth={4} opacity={0.6} />;
        })}
        <Token x={540} y={960} size={420 * z} spin={t * 10} pal={pal} letter={letter} />
      </>
    );
  } else if (sec(10, 14)) {
    const w = lines[1];
    const size = fit(w, 980, 170, 900);
    scene = (
      <>
        {Array.from({ length: 9 }).map((_, i) => (
          <text key={i} x={540} y={300 + i * 180 + ((t * 300) % 180)} textAnchor="middle" fontFamily={ff} fontSize={size} fontWeight={900} letterSpacing="-0.04em" fill={i === 4 ? pal.p : "none"} stroke={i === 4 ? "none" : ink} strokeWidth={3} opacity={i === 4 ? 1 : 0.5}>
            {w}
          </text>
        ))}
      </>
    );
  } else if (sec(14, 17)) {
    scene = (
      <>
        {Array.from({ length: 15 }).map((_, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const s = spring(t - 14 * BEAT - i * 0.04, 20, 0.55);
          return <Token key={i} x={200 + col * 340} y={360 + row * 300} size={230 * s} spin={t * 5 + i} pal={pal} letter={letter} />;
        })}
      </>
    );
  } else if (sec(17, 19)) {
    scene = <>{stackWords(lines[2])}</>;
  } else {
    const s = spring(t - 19 * BEAT, 14, 0.7);
    scene = (
      <>
        <Token x={540} y={760} size={440 * s} spin={Math.max(0, 1 - s) * 6} pal={pal} letter={letter} />
        <Txt text={ticker} x={540} y={1180} size={fit(ticker, 900, 200, 900)} weight={900} color={pal.p} font={ff} p={c01((t - 19.4 * BEAT) / 0.4)} tracking={-0.04} />
        <Txt text={name} x={540} y={1290} size={64} weight={700} color="#ffffff" font={ff} p={c01((t - 20 * BEAT) / 0.4)} mode="fade" />
        <Txt text="Not financial advice" x={540} y={1800} size={30} weight={500} color="rgba(255,255,255,0.45)" font={ff} p={c01((t - 20.5 * BEAT) / 0.4)} mode="fade" />
      </>
    );
  }

  const shake = kick * 10 * (beat < 19 ? 1 : 0);
  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden", fontFamily: ff }}>
      <Svg w={W} h={H}>
        <g transform={`translate(${Math.sin(beat * 7) * shake} ${Math.cos(beat * 5) * shake}) translate(540 960) scale(${1 + kick * 0.04}) translate(-540 -960)`}>{scene}</g>
        {/* flash on the downbeats */}
        <rect width={W} height={H} fill="#ffffff" opacity={beat % 4 === 0 && beat > 0 && beat < 19 ? kick * 0.5 : 0} />
      </Svg>
      {/* beat ticks */}
      <div style={{ position: "absolute", left: 60, right: 60, bottom: 60, height: 8, display: "flex", gap: 8 }}>
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} style={{ flex: 1, background: i === beat % 16 ? pal.p : "rgba(255,255,255,0.15)", borderRadius: 4 }} />
        ))}
      </div>
      <Track src="tracks/crypto-hype.wav" on={audio} />
    </AbsoluteFill>
  );
}
