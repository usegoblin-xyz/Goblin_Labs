import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Paint, Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, hash, mix, nameOf, palette, spring, useT } from "../../motion";

type C = { lines: string };

// A vertical anime-style hype edit with an original character: an eye snaps
// open, impact frames flip to stark black and white, manga panels slam in,
// an aura charges up, three lines hit on the beat and a brush stroke lands
// your name. Cuts sit on a 128 BPM grid.
const W = 1080;
const H = 1920;
const BEAT = 60 / 128;

function SpeedLines({ n = 60, color, t, inner = 260 }: { n?: number; color: string; t: number; inner?: number }) {
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * Math.PI * 2 + hash(i, 1) * 0.08;
        const r1 = inner + hash(i, 2) * 200 + ((t * 900 + hash(i, 3) * 400) % 300);
        const w = 4 + hash(i, 4) * 14;
        const x1 = 540 + Math.cos(a) * r1;
        const y1 = 960 + Math.sin(a) * r1;
        const x2 = 540 + Math.cos(a) * 1600;
        const y2 = 960 + Math.sin(a) * 1600;
        const px = -Math.sin(a) * w;
        const py = Math.cos(a) * w;
        return <path key={i} d={`M${x1},${y1} L${x2 + px},${y2 + py} L${x2 - px},${y2 - py} Z`} fill={color} />;
      })}
    </g>
  );
}

// An original hero silhouette: spiky hair, flared coat, one arm raised.
function Hero({ x, y, s, fill, arm = 0 }: { x: number; y: number; s: number; fill: string; arm?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill}>
      <path d="M-70,-330 L-110,-380 L-60,-372 L-80,-430 L-30,-390 L-10,-450 L20,-392 L60,-440 L58,-376 L110,-392 L74,-340 L60,-290 C40,-250 -40,-250 -60,-290 Z" />
      <path d="M-40,-270 L40,-270 L52,-230 L-52,-230 Z" />
      <path d="M-110,-230 L110,-230 L150,20 L240,320 L60,300 L20,60 L-20,60 L-60,300 L-250,330 L-150,20 Z" />
      <path d={`M100,-220 L${150 + arm * 40},${-330 - arm * 160} L${180 + arm * 40},${-320 - arm * 160} L130,-200 Z`} />
      <path d="M-100,-220 L-170,-60 L-140,-50 L-80,-190 Z" />
      <path d="M-30,60 L-60,330 L-20,330 L0,90 L20,330 L60,330 L30,60 Z" />
    </g>
  );
}

export default function AnimeHype({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const lines = (c.lines || "Awaken / Rise above / Unstoppable").split("/").map((s) => s.trim().toUpperCase());
  while (lines.length < 3) lines.push("GO");
  const beat = Math.floor(t / BEAT);
  const bt = (t - beat * BEAT) / BEAT;
  const kick = Math.exp(-bt * 5);
  const impact = beat === 3 || beat === 10 || beat === 15;
  const bg = impact ? "#ffffff" : "#07070a";
  const ink = impact ? "#07070a" : "#ffffff";

  let scene: ReactNode = null;
  if (beat < 3) {
    const open = expOut(c01((t - 0.35) / 0.5));
    const zoom = 1 + t * 0.08;
    scene = (
      <g transform={`translate(540 960) scale(${zoom}) translate(-540 -960)`}>
        <defs>
          <clipPath id="ah-eye">
            <path d={`M140,960 Q540,${960 - 330 * open} 940,960 Q540,${960 + 220 * open} 140,960 Z`} />
          </clipPath>
          <radialGradient id="ah-iris">
            <stop offset="0" stopColor={pal.a} />
            <stop offset="0.7" stopColor={pal.p} />
            <stop offset="1" stopColor={mix(pal.p, "#000000", 0.6)} />
          </radialGradient>
        </defs>
        <path d={`M120,960 Q540,${930 - 330 * open} 960,940`} stroke="#fff" strokeWidth={16} fill="none" strokeLinecap="round" />
        <g clipPath="url(#ah-eye)">
          <rect x={100} y={600} width={880} height={700} fill="#f3f3f6" />
          <circle cx={540} cy={950} r={190} fill="url(#ah-iris)" />
          <circle cx={540} cy={950} r={70} fill="#050507" />
          <ellipse cx={600} cy={880} rx={44} ry={30} fill="#fff" />
          <circle cx={470} cy={1010} r={14} fill="#fff" opacity={0.8} />
        </g>
      </g>
    );
  } else if (beat === 3 || beat === 10) {
    scene = (
      <>
        <SpeedLines color="#07070a" t={t} inner={380} />
        <Hero x={540} y={1100} s={1.6 + kick * 0.1} fill="#07070a" arm={beat === 10 ? 1 : 0} />
      </>
    );
  } else if (beat < 7) {
    const panels = [0, 1, 2].map((i) => {
      const s = expOut(c01((t - (4 + i * 0.6) * BEAT) / (0.35 * BEAT)));
      const y0 = 120 + i * 580;
      const dir = i % 2 ? 1 : -1;
      return (
        <g key={i} transform={`translate(${(1 - s) * dir * 1200} 0)`}>
          <clipPath id={`ah-p${i}`}>
            <path d={`M40,${y0 + 40} L1040,${y0} L1040,${y0 + 520} L40,${y0 + 560} Z`} />
          </clipPath>
          <g clipPath={`url(#ah-p${i})`}>
            <rect x={0} y={y0 - 40} width={W} height={640} fill={i === 1 ? pal.p : "#121218"} />
            <g transform={`translate(0 ${y0 - 660})`}>
              <SpeedLines n={40} color={i === 1 ? mix(pal.p, "#000000", 0.35) : "#26262f"} t={t + i} inner={160} />
            </g>
            <Hero x={i === 0 ? 700 : i === 1 ? 380 : 560} y={y0 + 520 + i * 40} s={i === 2 ? 0.6 : 0.9} fill={i === 1 ? "#07070a" : "#000000"} arm={i === 2 ? 1 : 0} />
          </g>
          <path d={`M40,${y0 + 40} L1040,${y0} L1040,${y0 + 520} L40,${y0 + 560} Z`} fill="none" stroke="#fff" strokeWidth={10} />
        </g>
      );
    });
    scene = (
      <>
        {panels}
        <Txt text={lines[0]} x={540} y={1840} size={fit(lines[0], 960, 150, 900)} weight={900} color={pal.p} font={ff} p={c01((t - 5.5 * BEAT) / 0.3)} mode="scale" tracking={-0.03} />
      </>
    );
  } else if (beat < 10) {
    const charge = c01((t - 7 * BEAT) / (3 * BEAT));
    scene = (
      <>
        {[0, 1, 2, 3].map((k) => (
          <ellipse key={k} cx={540} cy={1000} rx={300 + k * 80 + charge * 120 + Math.sin(t * 20 + k) * 14} ry={620 + k * 70 + charge * 120} fill="none" stroke={k % 2 ? pal.a : pal.p} strokeWidth={14 - k * 2} opacity={0.75 - k * 0.12} />
        ))}
        {Array.from({ length: 40 }).map((_, i) => {
          const x = 540 + (hash(i, 1) - 0.5) * 760;
          const y = 1500 - ((t * 700 + hash(i, 2) * 1300) % 1300);
          return <rect key={i} x={x} y={y} width={8} height={40} rx={4} fill={i % 3 ? pal.p : "#fff"} opacity={0.7} />;
        })}
        <Hero x={540} y={1220} s={1.05} fill="#000000" arm={charge} />
        <Txt text={lines[1]} x={540} y={300} size={fit(lines[1], 960, 160, 900)} weight={900} color="#fff" font={ff} p={c01((t - 7.6 * BEAT) / 0.3)} tracking={-0.03} />
      </>
    );
  } else if (beat < 15) {
    const w = lines[2];
    const shake = kick * 14;
    scene = (
      <g transform={`translate(${Math.sin(beat * 9) * shake} ${Math.cos(beat * 7) * shake})`}>
        <SpeedLines color={beat % 2 ? "#1d1d26" : mix(pal.p, "#000000", 0.5)} t={t} inner={300} />
        {w.split(" ").map((part, i, arr) => (
          <Txt key={i} text={part} x={540} y={960 + (i - (arr.length - 1) / 2) * 230 + 70} size={fit(part, 980, 240, 900)} weight={900} color={i === arr.length - 1 ? pal.p : "#fff"} font={ff} p={1} mode="fade" stagger={0} tracking={-0.04} />
        ))}
      </g>
    );
  } else {
    const k = c01((t - 15.4 * BEAT) / 0.35);
    scene = (
      <>
        <Paint d="M90,1000 C300,900 700,1080 1000,930" color={pal.p} width={220} p={expInOut(k)} />
        <Txt text={name} x={540} y={1010} size={fit(name, 900, 200, 900)} weight={900} color="#07070a" font={ff} p={c01((t - 15.8 * BEAT) / 0.35)} mode="scale" tracking={-0.04} />
        <Txt text="OUT NOW" x={540} y={1180} size={60} weight={800} color="#fff" font={ff} p={c01((t - 16.6 * BEAT) / 0.3)} mode="fade" tracking={0.2} />
      </>
    );
  }

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden", fontFamily: ff }}>
      <Svg w={W} h={H}>
        <g transform={`translate(540 960) scale(${1 + kick * 0.03 * (beat < 15 ? 1 : 0)}) translate(-540 -960)`}>{scene}</g>
        {impact && beat < 15 && <rect width={W} height={H} fill="none" stroke={ink} strokeWidth={40} />}
      </Svg>
      <Track src="tracks/anime-hype.wav" on={audio} />
    </AbsoluteFill>
  );
}

