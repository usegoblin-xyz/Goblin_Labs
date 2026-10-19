import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, hash, nameOf, palette, seg, useT } from "../../motion";

type C = { projects: string; years: string; role: string };

// A motion portfolio reel: project cards orbit on a 3D carousel; each one in
// turn swings to the front, scales up full-frame with its own generative
// cover, shows title and year, then drops back into the ring.
export default function ProjectCarousel({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const projects = [...list(c.projects || "Northwind rebrand, Orbit app, Field notes, Tidal identity, Loop campaign, Ember launch"), "Project", "Project", "Project", "Project", "Project", "Project"].slice(0, 6);
  const years = [...list(c.years || "2026, 2025, 2025, 2024, 2024, 2023"), "", "", "", "", "", ""];
  const N = 6;
  const per = 1.5;
  const start = 1.2;
  const step = c01((t - start) / (per * 4)) * 4; // features 4 projects
  const k = Math.floor(step);
  const frac = step - k;
  // rotate to project k smoothly, hold, then rotate on
  const rotP = k + cubicInOut(c01((frac - 0.55) / 0.45));
  const spin = (1 - expInOut(c01(t / 1.4))) * -2;
  const ang = (i: number) => ((i - rotP - spin) / N) * Math.PI * 2;
  const feat = cubicInOut(c01((frac - 0.02) / 0.14)) * (1 - cubicInOut(c01((frac - 0.44) / 0.12))); // rise, hold, fall within each slot
  const showFeat = t > start && step < 4;
  const outro = expInOut(seg(t, start + per * 4 + 0.3, 0.6));
  const endP = c01((t - start - per * 4 - 0.7) / 0.8);
  const cols = [pal.v, pal.a, "#38a3ff", "#f28ab2", "#2fbf71", "#f2b64a"];
  const Cover = ({ i, w, h }: { i: number; w: number; h: number }) => (
    <svg width={w} height={h} viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" style={{ display: "block" }}>
      <rect width={400} height={260} fill={cols[i]} />
      {i % 3 === 0 && Array.from({ length: 6 }, (_, j) => <circle key={j} cx={60 + j * 60} cy={130 + Math.sin(t * 2 + j) * 40} r={26} fill="#fff" opacity={0.85} />)}
      {i % 3 === 1 && Array.from({ length: 8 }, (_, j) => <rect key={j} x={j * 50} y={260 - (60 + hash(i, j) * 160)} width={40} height={60 + hash(i, j) * 160} fill="#000" opacity={0.25} />)}
      {i % 3 === 2 && <path d={`M0,200 C100,${100 + Math.sin(t) * 40} 300,${260 - Math.cos(t) * 60} 400,120 L400,260 L0,260 Z`} fill="#fff" opacity={0.6} />}
      <text x={24} y={50} fontFamily={ff} fontSize={30} fontWeight={900} fill="#fff">
        {projects[i].split(" ")[0]}
      </text>
    </svg>
  );

  return (
    <AbsoluteFill style={{ background: pal.dark ? "#09090b" : pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro, perspective: 2000 }}>
        {projects
          .map((_, i) => ({ i, z: Math.cos(ang(i)) }))
          .sort((a, b2) => a.z - b2.z)
          .map(({ i }) => {
            const a = ang(i);
            const x = 960 + Math.sin(a) * 720;
            const z = Math.cos(a);
            const front = showFeat && i === k % N ? feat : 0;
            const sc = (0.55 + 0.3 * (z + 1) / 2) * (1 + front * 1.25);
            const w = 520;
            const h = 340;
            return (
              <div key={i} style={{ position: "absolute", left: x - w / 2, top: 470 - h / 2 - front * 40, width: w, height: h, borderRadius: 22, overflow: "hidden", transform: `rotateY(${(-a * 180) / Math.PI * (1 - front)}deg) scale(${sc})`, opacity: 0.35 + 0.65 * ((z + 1) / 2) + front, boxShadow: "0 30px 60px rgba(0,0,0,0.35)", zIndex: front > 0.01 ? 99 : 1 }}>
                <Cover i={i} w={w} h={h} />
              </div>
            );
          })}
        {showFeat && (
          <div style={{ position: "absolute", left: 0, right: 0, top: 860, textAlign: "center", opacity: feat, transform: `translateY(${(1 - feat) * 40}px)` }}>
            <div style={{ fontSize: 70, fontWeight: 900, letterSpacing: "-0.03em", color: pal.fg }}>{projects[k % N]}</div>
            <div style={{ fontSize: 32, color: pal.muted, marginTop: 6 }}>{years[k % N]}</div>
          </div>
        )}
        <div style={{ position: "absolute", left: 80, top: 60, fontSize: 28, fontWeight: 800, letterSpacing: "0.18em", color: pal.fg }}>SELECTED WORK</div>
        <div style={{ position: "absolute", right: 80, top: 60, fontSize: 28, fontWeight: 700, color: pal.muted }}>{showFeat ? `${String(k + 1).padStart(2, "0")} / 04` : ""}</div>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={540} size={160} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.role || "Motion portfolio"} x={960} y={650} size={48} weight={600} color={pal.v} font={ff} p={c01((t - start - per * 4 - 1.1) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/project-carousel.wav" on={audio} />
    </AbsoluteFill>
  );
}
