import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { skills: string; levels: string; tools: string; role: string };

// A personal skills reel: a radar chart's axes draw from the centre, the
// skill polygon inflates to its levels while each axis label lands, then the
// polygon morphs to a "growing" target set; a tool belt of chips slides in.
export default function SkillRadar({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const skills = [...list(c.skills || "Motion, Typography, 3D, Illustration, Code, Strategy"), "Skill", "Skill", "Skill", "Skill", "Skill", "Skill"].slice(0, 6);
  const levels = [...list(c.levels || "95, 85, 60, 70, 75, 65").map(Number), 50, 50, 50, 50, 50, 50].slice(0, 6);
  const growth = levels.map((v) => Math.min(100, v + 12));
  const tools = list(c.tools || "After Effects, Figma, Blender, Remotion, Cinema 4D, Illustrator");
  const N = 6;
  const R = 330;
  const CX = 1240;
  const CY = 560;
  const axes = cubicInOut(c01((t - 0.3) / 0.8));
  const inflate = spring(t - 1.3, 10, 0.55);
  const grow = cubicInOut(c01((t - 4.4) / 1.0));
  const outro = expInOut(seg(t, 8.4, 0.5));
  const endP = c01((t - 8.8) / 0.8);
  const P = (i: number, r: number) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    return [CX + Math.cos(a) * r, CY + Math.sin(a) * r];
  };
  const poly = levels.map((v, i) => P(i, (lerp(v, growth[i], grow) / 100) * R * inflate).join(",")).join(" ");
  const active = Math.min(N - 1, Math.floor(c01((t - 1.6) / 2.4) * N));

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          {[0.25, 0.5, 0.75, 1].map((k) => (
            <polygon key={k} points={Array.from({ length: N }, (_, i) => P(i, R * k * axes).join(",")).join(" ")} fill="none" stroke={pal.line} strokeWidth={2} />
          ))}
          {Array.from({ length: N }, (_, i) => {
            const [x, y] = P(i, R * axes);
            return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke={pal.line} strokeWidth={2} />;
          })}
          <polygon points={poly} fill={pal.v} fillOpacity={0.35} stroke={pal.v} strokeWidth={6} strokeLinejoin="round" />
          {levels.map((v, i) => {
            const [x, y] = P(i, (lerp(v, growth[i], grow) / 100) * R * inflate);
            return <circle key={i} cx={x} cy={y} r={i === active && t < 4.2 ? 16 : 10} fill={pal.v} />;
          })}
          {skills.map((s, i) => {
            const [x, y] = P(i, R + 70);
            return <Txt key={i} text={s} x={x} y={y + 14} size={i === active && t < 4.2 ? 40 : 34} weight={i === active && t < 4.2 ? 800 : 600} color={i === active && t < 4.2 ? pal.v : pal.fg} font={ff} p={c01((t - 1.0 - i * 0.12) / 0.4)} mode="fade" />;
          })}
        </Svg>
        {/* left column */}
        <div style={{ position: "absolute", left: 110, top: 200, width: 600 }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: pal.muted, letterSpacing: "0.15em", opacity: c01(t * 2) }}>SKILLS</div>
          <div style={{ fontSize: 110, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1, color: pal.fg, marginTop: 10, clipPath: `inset(0 ${(1 - c01((t - 0.2) / 0.6)) * 100}% 0 0)` }}>{nameOf(b)}</div>
          <div style={{ fontSize: 40, color: pal.muted, marginTop: 14 }}>{c.role || "Designer who codes"}</div>
          <div style={{ marginTop: 50, fontSize: 64, fontWeight: 900, color: pal.v, fontVariantNumeric: "tabular-nums", minHeight: 80 }}>
            {t > 1.6 && t < 4.2 ? `${skills[active]} ${levels[active]}` : t >= 4.4 ? `Always +${Math.round(grow * 12)}` : ""}
          </div>
        </div>
        {/* tool belt */}
        <div style={{ position: "absolute", left: 110, bottom: 90, display: "flex", gap: 16, flexWrap: "wrap", width: 640 }}>
          {tools.map((tl, i) => (
            <div key={i} style={{ padding: "14px 26px", borderRadius: 30, background: pal.card, fontSize: 28, fontWeight: 700, color: pal.fg, transform: `translateY(${(1 - spring(t - 5.6 - i * 0.12, 16, 0.6)) * 400}px)` }}>
              {tl}
            </div>
          ))}
        </div>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={520} size={150} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.role || "Designer who codes"} x={960} y={630} size={48} weight={600} color={pal.v} font={ff} p={c01((t - 9.2) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/skill-radar.wav" on={audio} />
    </AbsoluteFill>
  );
}
