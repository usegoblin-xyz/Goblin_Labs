import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { chaos: string; family: string; tagline: string };

// A parenting-app hype spot: a storm of to-dos (pickups, forms, snacks,
// birthday gifts) whirls around the frame shaking; one tap and they all
// slot into a tidy shared weekly calendar with family avatars, colour per
// person; a reminder pops and the line lands: "You've got this."
export default function ParentHype({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const chaos = [...list(c.chaos || "School pickup, Sign the form, Pack snacks, Swim lessons, Dentist, Buy a gift, Bake sale, Parents' night"), "To-do", "To-do", "To-do", "To-do", "To-do", "To-do", "To-do", "To-do"].slice(0, 8);
  const family = [...list(c.family || "Mum, Dad, Ava, Leo"), "A", "B", "C", "D"].slice(0, 4);
  const fcol = [pal.v, pal.a, "#f28ab2", "#38a3ff"];
  const tidy = cubicInOut(c01((t - 2.6) / 1.0));
  const remind = spring(t - 5.4, 14, 0.6);
  const outro = expInOut(seg(t, 8.0, 0.5));
  const endP = c01((t - 8.4) / 0.8);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const CX = 330;
  const CY = 260;
  const cw = 280;
  const ch = 120;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* calendar frame */}
        <div style={{ position: "absolute", left: CX - 30, top: CY - 90, width: cw * 5 + 60, height: ch * 4 + 120, borderRadius: 30, background: pal.card, opacity: tidy }}>
          <div style={{ display: "flex", padding: "26px 30px 0" }}>
            {days.map((d) => (
              <div key={d} style={{ width: cw, fontSize: 26, fontWeight: 800, color: pal.muted }}>
                {d}
              </div>
            ))}
          </div>
        </div>
        {chaos.map((x, i) => {
          const a = hash(i, 1) * Math.PI * 2 + t * (1.2 + hash(i, 2));
          const r = 260 + hash(i, 3) * 260;
          const sx = 960 + Math.cos(a) * r * 1.4;
          const sy = 540 + Math.sin(a) * r * 0.75;
          const shake = (1 - tidy) * Math.sin(t * 40 + i) * 6;
          const d = i % 5;
          const row = Math.floor(i / 5) + (i % 2);
          const tx = CX + d * cw;
          const ty = CY + row * ch;
          const owner = i % 4;
          const s = spring(t - 0.1 - i * 0.12, 18, 0.5);
          return (
            <div key={i} style={{ position: "absolute", left: lerp(sx, tx, tidy) + shake, top: lerp(sy, ty, tidy), width: lerp(300, cw - 16, tidy), padding: "18px 20px", borderRadius: 16, background: tidy > 0.5 ? fcol[owner] : pal.card2, color: tidy > 0.5 ? "#fff" : pal.fg, fontSize: 26, fontWeight: 700, transform: `scale(${s}) rotate(${(1 - tidy) * (hash(i, 4) - 0.5) * 40}deg)`, boxSizing: "border-box", boxShadow: "0 10px 24px rgba(0,0,0,0.2)" }}>
              {x}
            </div>
          );
        })}
        {/* family avatars */}
        <div style={{ position: "absolute", left: CX, top: CY + ch * 3 + 40, display: "flex", gap: 20, opacity: c01((t - 3.4) * 3) }}>
          {family.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, transform: `scale(${spring(t - 3.4 - i * 0.1, 16, 0.5)})` }}>
              <div style={{ width: 50, height: 50, borderRadius: 25, background: fcol[i], color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 24 }}>{f[0]}</div>
              <span style={{ fontSize: 26, color: pal.fg, fontWeight: 600 }}>{f}</span>
            </div>
          ))}
        </div>
        {t < 2.6 && (
          <Svg>
            <Txt text="Too much?" x={960} y={560} size={140} weight={900} color={pal.fg} font={ff} p={c01((t - 0.8) / 0.3)} out={c01((t - 2.3) / 0.3)} mode="scale" />
          </Svg>
        )}
        {remind > 0.01 && (
          <div style={{ position: "absolute", right: 120, top: 80, width: 520, padding: "24px 30px", borderRadius: 24, background: pal.fg, color: pal.bg, transform: `translateY(${(1 - remind) * -300}px)`, display: "flex", gap: 18, alignItems: "center" }}>
            <span style={{ fontSize: 40 }}>🔔</span>
            <div>
              <div style={{ fontSize: 24, opacity: 0.7 }}>in 30 min</div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{family[1]}: {chaos[0]}</div>
            </div>
          </div>
        )}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="You've got this." x={960} y={500} size={140} weight={900} color={pal.fg} font={ff} p={endP} tracking={-0.04} mode="scale" />
          <Txt text={`${nameOf(b)} · ${c.tagline || "the family planner"}`} x={960} y={620} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 8.8) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/parent-hype.wav" on={audio} />
    </AbsoluteFill>
  );
}
