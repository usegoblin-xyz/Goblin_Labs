import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fit, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { word: string; tagline: string };

// Six techniques, one word: the same word is shown through a mask reveal, a
// 3D card flip, a shape morph, a particle scatter, a motion path and a split
// screen, each tagged with a numbered chip, then the name.
const TECH = ["Mask reveal", "3D flip", "Morph", "Particles", "Motion path", "Split screen"];
const PER = 1.4;

export default function TechniqueSampler({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const word = (c.word || "Motion").slice(0, 12);
  const k = Math.min(5, Math.floor(t / PER));
  const u = t - k * PER;
  const p = c01(u / PER);
  const size = fit(word, 1400, 280, 900, -0.05, ff);
  const endAt = PER * 6;
  const endP = c01((t - endAt) / 0.8);
  const bg = k % 2 ? pal.v : pal.bg;
  const fg = k % 2 ? pal.onV : pal.fg;
  const W = (
    <div style={{ fontSize: size, fontWeight: 900, letterSpacing: "-0.05em", color: fg, lineHeight: 1, whiteSpace: "nowrap" }}>{word}</div>
  );

  let scene: JSX.Element | null = null;
  if (k === 0) {
    const r = expInOut(c01(u / 0.7));
    scene = <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", clipPath: `inset(${(1 - r) * 50}% 0 ${(1 - r) * 50}% 0)` }}>{W}</div>;
  } else if (k === 1) {
    const f = expInOut(c01((u - 0.2) / 0.7));
    scene = (
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%, -50%) perspective(1600px) rotateX(${lerp(-90, 0, f) + Math.sin(u * 3) * 4}deg)`, transformOrigin: "50% 100%" }}>{W}</div>
    );
  } else if (k === 2) {
    const m = cubicInOut(c01((u - 0.1) / 0.8));
    const r = lerp(260, 40, m);
    scene = (
      <>
        <div style={{ position: "absolute", left: "50%", top: "50%", width: lerp(520, 1500, m), height: lerp(520, 360, m), borderRadius: r, background: pal.v, transform: "translate(-50%, -50%)", opacity: 1 - c01((u - 0.9) * 4) }} />
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", opacity: c01((u - 0.8) * 4) }}>{W}</div>
      </>
    );
  } else if (k === 3) {
    const s = expInOut(c01((u - 0.2) / 0.8));
    scene = (
      <Svg>
        {Array.from({ length: 220 }, (_, i) => {
          const a = hash(i, 1) * Math.PI * 2;
          const r0 = 500 + hash(i, 2) * 500;
          const tx = 960 + (hash(i, 3) - 0.5) * size * word.length * 0.55;
          const ty = 540 + (hash(i, 4) - 0.5) * size * 0.7;
          return <circle key={i} cx={lerp(960 + Math.cos(a) * r0, tx, s)} cy={lerp(540 + Math.sin(a) * r0, ty, s)} r={lerp(8, 3, s)} fill={fg} opacity={1 - c01((u - 0.9) * 3)} />;
        })}
        <foreignObject x={0} y={0} width={1920} height={1080} opacity={c01((u - 0.85) * 4)}>
          <div style={{ width: 1920, height: 1080, display: "flex", alignItems: "center", justifyContent: "center" }}>{W}</div>
        </foreignObject>
      </Svg>
    );
  } else if (k === 4) {
    const q = cubicInOut(c01(u / 1.1));
    const path = (x: number) => 540 + Math.sin(x * Math.PI * 2) * 200;
    const x = lerp(-200, 2120, q);
    scene = (
      <>
        <Svg>
          <path d={"M" + Array.from({ length: 60 }, (_, i) => `${-200 + (i / 59) * 2320},${path(i / 59)}`).join(" L")} fill="none" stroke={pal.faint} strokeWidth={4} strokeDasharray="10 14" />
        </Svg>
        <div style={{ position: "absolute", left: x, top: path(q), transform: `translate(-50%, -50%) rotate(${Math.cos(q * Math.PI * 2) * 18}deg) scale(0.4)` }}>{W}</div>
      </>
    );
  } else {
    const sp = expInOut(c01((u - 0.1) / 0.6));
    scene = (
      <>
        {[0, 1].map((h) => (
          <div key={h} style={{ position: "absolute", left: 0, top: h ? 540 : 0, width: 1920, height: 540, overflow: "hidden", background: h ? pal.bg : pal.v, transform: `translateX(${(h ? 1 : -1) * (1 - sp) * 1920}px)` }}>
            <div style={{ position: "absolute", left: "50%", top: h ? 0 : 540, transform: "translate(-50%, -50%)" }}>
              <div style={{ fontSize: size, fontWeight: 900, letterSpacing: "-0.05em", color: h ? pal.fg : pal.onV, lineHeight: 1, whiteSpace: "nowrap" }}>{word}</div>
            </div>
          </div>
        ))}
      </>
    );
  }

  return (
    <AbsoluteFill style={{ background: t < endAt ? bg : pal.bg, overflow: "hidden", fontFamily: ff }}>
      {t < endAt && scene}
      {t < endAt && (
        <div style={{ position: "absolute", left: 80, bottom: 70, display: "flex", alignItems: "center", gap: 16, padding: "14px 26px", borderRadius: 40, background: k % 2 ? pal.bg : pal.card2, color: k % 2 ? pal.fg : pal.fg, fontFamily: MONO, fontSize: 28, transform: `translateY(${(1 - spring(u, 20, 0.7)) * 80}px)` }}>
          <span style={{ color: pal.v }}>{String(k + 1).padStart(2, "0")}</span>
          {TECH[k]}
        </div>
      )}
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Six ways to say one word."} x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - endAt - 0.4) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/technique-sampler.wav" on={audio} />
    </AbsoluteFill>
  );
}

