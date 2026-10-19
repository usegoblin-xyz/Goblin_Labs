import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fontOf, hash, lerp, nameOf, palette, seg, useT } from "../../motion";

type C = { a: string; b: string; c: string; role: string };

// A three-chapter showreel. TYPE: letters scatter and reassemble on a
// baseline grid. FORM: a circle morphs through square, triangle and star.
// SPACE: a perspective grid floor flies toward the camera with pillars.
export default function TypeFormSpace({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const words = [(c.a || "TYPE").toUpperCase(), (c.b || "FORM").toUpperCase(), (c.c || "SPACE").toUpperCase()];
  const ch = t < 3.3 ? 0 : t < 6.6 ? 1 : 2;
  const u = t - ch * 3.3;
  const wipe = (k: number) => expInOut(seg(t, 3.3 * k - 0.35, 0.5));
  const endP = c01((t - 10.1) / 0.8);

  // chapter 1: letters
  const ch1 = () => {
    const word = words[0];
    const size = 360;
    const gap = size * 0.68;
    const x0 = 960 - ((word.length - 1) * gap) / 2;
    const gather = expOut(c01((u - 0.2) / 0.9));
    const scatter2 = expInOut(seg(u, 2.3, 0.8));
    return (
      <Svg>
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1={0} x2={1920} y1={180 + i * 70} y2={180 + i * 70} stroke={pal.line} strokeWidth={2} />
        ))}
        {word.split("").map((L, i) => {
          const sx = (hash(i, 1) - 0.5) * 1800;
          const sy = (hash(i, 2) - 0.5) * 1000;
          const sr = (hash(i, 3) - 0.5) * 360;
          const p = gather - scatter2 * 0.3;
          const x = lerp(960 + sx, x0 + i * gap, p);
          const y = lerp(540 + sy, 670, p) + (scatter2 > 0 ? Math.sin(i + u * 5) * 40 * scatter2 : 0);
          return (
            <text key={i} x={x} y={y} textAnchor="middle" fontFamily={ff} fontSize={size} fontWeight={900} fill={i % 2 ? pal.v : pal.fg} transform={`rotate(${sr * (1 - p)} ${x} ${y - 120})`}>
              {L}
            </text>
          );
        })}
      </Svg>
    );
  };

  // chapter 2: morphing shape (polar radius blend)
  const ch2 = () => {
    const N = 120;
    const shapes = [
      () => 1,
      (a: number) => 1 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a))) * 0.82,
      (a: number) => {
        const k = Math.PI / 3;
        const m = ((a + Math.PI / 2) % (2 * k) + 2 * k) % (2 * k) - k;
        return 0.62 / Math.cos(m);
      },
      (a: number) => 0.62 + 0.38 * Math.cos(5 * (a + Math.PI / 2)),
    ];
    const f = c01((u - 0.3) / 2.6) * 3;
    const i0 = Math.min(2, Math.floor(f));
    const mix = cubicInOut(f - i0);
    const R = 330;
    const pts = Array.from({ length: N }, (_, j) => {
      const a = (j / N) * Math.PI * 2;
      const r = lerp(shapes[i0](a), shapes[i0 + 1](a), mix) * R * expOut(c01(u / 0.5));
      return `${960 + Math.cos(a) * r},${540 + Math.sin(a) * r}`;
    });
    return (
      <Svg>
        <g transform={`rotate(${u * 20} 960 540)`}>
          <polygon points={pts.join(" ")} fill={pal.v} />
          <polygon points={pts.join(" ")} fill="none" stroke={pal.fg} strokeWidth={4} transform="translate(30 30)" opacity={0.4} />
        </g>
      </Svg>
    );
  };

  // chapter 3: perspective grid floor
  const ch3 = () => {
    const hz = 470;
    const fly = u * 2.2;
    const lines = [] as JSX.Element[];
    for (let i = 0; i < 18; i++) {
      const z = 1 + ((i - fly) % 18 + 18) % 18;
      const y = hz + 600 / z;
      lines.push(<line key={`h${i}`} x1={0} x2={1920} y1={y} y2={y} stroke={pal.v} strokeWidth={Math.max(1, 6 / z)} opacity={c01(1.4 - z / 14)} />);
    }
    for (let i = -12; i <= 12; i++) lines.push(<line key={`v${i}`} x1={960 + i * 30} y1={hz} x2={960 + i * 600} y2={1080} stroke={pal.v} strokeWidth={2} opacity={0.6} />);
    const pillars = [-3, 3, -5, 5].map((xi, j) => {
      const z = 1 + (((j * 4.5 - fly * 0.9) % 18) + 18) % 18;
      const x = 960 + (xi * 420) / z;
      const hgt = 900 / z;
      const y = hz + 600 / z;
      return <rect key={j} x={x - 160 / z} y={y - hgt} width={320 / z} height={hgt} fill={pal.fg} opacity={c01(1.4 - z / 14)} />;
    });
    return (
      <Svg>
        <rect x={0} y={0} width={1920} height={hz} fill={pal.card} />
        {lines}
        {pillars}
      </Svg>
    );
  };

  const chapters = [ch1, ch2, ch3];
  const isEnd = t > 9.9;
  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      {!isEnd && chapters[ch]()}
      {!isEnd && (
        <>
          <div style={{ position: "absolute", left: 80, top: 70, fontSize: 30, fontWeight: 800, letterSpacing: "0.2em", color: pal.fg }}>
            {String(ch + 1).padStart(2, "0")} — {words[ch]}
          </div>
          {ch > 0 && (
            <Svg>
              <Txt text={words[ch]} x={960} y={ch === 1 ? 1000 : 300} size={ch === 1 ? 110 : 200} weight={900} color={pal.fg} font={ff} p={c01((u - 0.2) / 0.5)} tracking={ch === 2 ? 0.3 : -0.03} />
            </Svg>
          )}
        </>
      )}
      {/* chapter wipes */}
      {[1, 2, 3].map((k) => {
        const w = wipe(k);
        if (w <= 0 || w >= 1) return null;
        return <div key={k} style={{ position: "absolute", top: 0, bottom: 0, left: `${(w * 2 - 1) * 100}%`, width: "100%", background: k % 2 ? pal.v : pal.fg }} />;
      })}
      {endP > 0 && (
        <Svg>
          <Txt text={words.join(" · ")} x={960} y={480} size={64} weight={800} color={pal.muted} font={ff} p={endP} tracking={0.1} mode="fade" />
          <Txt text={nameOf(b)} x={960} y={620} size={150} weight={900} color={pal.fg} font={ff} p={c01((t - 10.3) / 0.7)} tracking={-0.04} />
          <Txt text={c.role || "Motion & visual design"} x={960} y={720} size={44} weight={600} color={pal.v} font={ff} p={c01((t - 10.7) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/type-form-space.wav" on={audio} />
    </AbsoluteFill>
  );
}
