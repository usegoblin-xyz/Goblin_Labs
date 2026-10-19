import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Paint, Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, lerp, mix, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { title: string; steps: string; yard: string; outro: string };

// How a broadcast draws a line that isn't there: the field is mapped in 3D,
// one yard line is picked, and the line is painted only on turf colors so
// players walk over it. Told in three numbered steps on a live field.
const HOR = 300; // horizon
const F = 900; // focal length
const CAMH = 18; // camera height
function proj(X: number, Z: number) {
  const d = Z + 12;
  return { x: 1140 + (F * X) / d, y: HOR + (F * CAMH) / d };
}

export default function OverlayExplainer({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const steps = [...list(c.steps || "Map the field, Pick the yard, Paint under players"), "Map", "Pick", "Paint"].slice(0, 3);
  const title = c.title || "How the line appears";
  const turf = mix(pal.bg, pal.v, pal.dark ? 0.16 : 0.12);
  const fieldIn = expOut(seg(t, 1.0, 0.8));
  const lineZ = 34;
  const stepAt = [3.0, 5.2, 7.4];
  const step = t < stepAt[0] ? -1 : t < stepAt[1] ? 0 : t < stepAt[2] ? 1 : 2;
  const grid = expOut(seg(t, 3.2, 1.0)) * (1 - expInOut(seg(t, 5.4, 0.5)));
  const lineP = expInOut(seg(t, 5.6, 0.8));
  const outro = expInOut(seg(t, 10.0, 0.6));
  const endP = c01((t - 10.4) / 0.8);
  const ts = fit(title, 1500, 110, 800, -0.04, ff);

  const corners = [proj(-30, 0), proj(30, 0), proj(30, 70), proj(-30, 70)];
  const yards = Array.from({ length: 8 }, (_, i) => i * 10);
  const L0 = proj(-30, lineZ);
  const L1 = proj(30, lineZ);
  // players cross the line during step 3
  const players = [
    { z: 30, x0: -26, x1: 18, at: 7.4 },
    { z: 38, x0: 24, x1: -14, at: 7.6 },
    { z: 34, x0: -6, x1: 26, at: 7.9 },
  ];

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          <Txt text={title} x={960} y={540 + ts * 0.36} size={ts} weight={800} color={pal.fg} font={ff} p={c01((t - 0.1) / 0.6)} out={c01((t - 0.9) / 0.4)} tracking={-0.04} />
          <g opacity={fieldIn} transform={`translate(0 ${(1 - fieldIn) * 120})`}>
            <path d={`M${corners.map((p) => `${p.x},${p.y}`).join(" L")} Z`} fill={turf} />
            {yards.map((z, i) => {
              const a = proj(-30, z);
              const e = proj(30, z);
              return <Paint key={z} d={`M${a.x},${a.y} L${e.x},${e.y}`} color={pal.faint} width={3} p={expOut(seg(t, 1.2 + i * 0.08, 0.5))} />;
            })}
            {[-30, 30].map((x) => {
              const a = proj(x, 0);
              const e = proj(x, 70);
              return <line key={x} x1={a.x} y1={a.y} x2={e.x} y2={e.y} stroke={pal.faint} strokeWidth={4} />;
            })}
            {yards.slice(1, 7).map((z, i) => {
              const p = proj(-25, z);
              return (
                <text key={z} x={p.x} y={p.y - 6} fontFamily={ff} fontSize={Math.max(14, 900 / (z + 12))} fontWeight={700} fill={pal.faint} textAnchor="middle">
                  {[10, 20, 30, 40, 30, 20][i]}
                </text>
              );
            })}
            {/* calibration mesh */}
            {grid > 0 &&
              Array.from({ length: 13 }, (_, i) => {
                const x = -30 + i * 5;
                const a = proj(x, 0);
                const e = proj(x, 70);
                return <line key={i} x1={a.x} y1={a.y} x2={lerp(a.x, e.x, grid)} y2={lerp(a.y, e.y, grid)} stroke={pal.v} strokeWidth={1.5} opacity={0.6} />;
              })}
            {grid > 0 &&
              Array.from({ length: 13 * 8 }, (_, k) => {
                const x = -30 + (k % 13) * 5;
                const z = Math.floor(k / 13) * 10;
                const p = proj(x, z);
                const s = spring(t - 3.4 - k * 0.006, 20, 0.5) * grid;
                return <circle key={k} cx={p.x} cy={p.y} r={Math.max(0, 5 * s * (40 / (z + 12)) * 0.5 + 1.5 * s)} fill={pal.v} />;
              })}
            {/* the virtual line, painted under everything else */}
            <Paint d={`M${L0.x},${L0.y} L${L1.x},${L1.y}`} color={pal.v} width={22} p={lineP} />
            {/* players */}
            {players.map((pl, i) => {
              const u = c01((t - pl.at) / 2.0);
              const x = lerp(pl.x0, pl.x1, u);
              const p = proj(x, pl.z);
              const sc = 80 / (pl.z + 12);
              const bob = Math.abs(Math.sin(u * 22)) * 6 * sc;
              const show = t > pl.at - 0.4;
              return show ? (
                <g key={i} transform={`translate(${p.x} ${p.y - bob}) scale(${sc})`} opacity={c01((t - pl.at + 0.4) * 3)}>
                  <ellipse cx={0} cy={4} rx={26} ry={8} fill="#000" opacity={0.2} />
                  <rect x={-18} y={-92} width={36} height={60} rx={14} fill={pal.fg} />
                  <circle cx={0} cy={-108} r={16} fill={pal.fg} />
                  <rect x={-14} y={-34} width={11} height={36} rx={5} fill={pal.fg} />
                  <rect x={3} y={-34} width={11} height={36} rx={5} fill={pal.fg} />
                  <text x={0} y={-52} textAnchor="middle" fontFamily={ff} fontSize={26} fontWeight={800} fill={pal.bg}>
                    {[12, 7, 24][i]}
                  </text>
                </g>
              ) : null;
            })}
          </g>
          {/* yard tag */}
          {lineP > 0.9 && (
            <g transform={`translate(${L1.x + 30} ${L1.y}) scale(${spring(t - 6.4, 16, 0.6)})`}>
              <rect x={0} y={-34} width={150} height={68} rx={34} fill={pal.v} />
              <text x={75} y={12} textAnchor="middle" fontFamily={ff} fontSize={34} fontWeight={800} fill={pal.onV}>
                {c.yard || "35"}
              </text>
            </g>
          )}
        </Svg>
        {/* steps */}
        {steps.map((s, i) => {
          const on = step >= i;
          const active = step === i;
          const p = spring(t - stepAt[i], 18, 0.7);
          return t > stepAt[i] - 0.1 ? (
            <div key={i} style={{ position: "absolute", left: 90, top: 470 + i * 120, display: "flex", alignItems: "center", gap: 22, opacity: c01(p * 2) * (on ? (active ? 1 : 0.45) : 0), transform: `translateX(${(1 - p) * -60}px)` }}>
              <div style={{ width: 70, height: 70, borderRadius: 35, background: active ? pal.v : pal.card2, color: active ? pal.onV : pal.fg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, fontWeight: 800 }}>{i + 1}</div>
              <div style={{ fontSize: 44, fontWeight: 700, color: pal.fg, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>{s}</div>
            </div>
          ) : null;
        })}
        {/* color key chips during step 3 */}
        {t > 7.6 &&
          [
            [turf, "Paint"],
            [pal.fg, "Skip"],
          ].map(([col, lab], i) => (
            <div key={i} style={{ position: "absolute", left: 182 + i * 210, top: 860, display: "flex", alignItems: "center", gap: 12, opacity: c01((t - 7.8 - i * 0.2) * 3) }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: col, boxShadow: `inset 0 0 0 2px ${pal.line}` }} />
              <div style={{ fontSize: 30, fontWeight: 600, color: i ? pal.muted : pal.v }}>{lab}</div>
            </div>
          ))}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={c.outro || "A line that was never there."} x={960} y={520} size={fit(c.outro || "A line that was never there.", 1500, 96, 800, -0.04, ff)} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.03} />
          <Txt text={nameOf(b)} x={960} y={640} size={48} weight={600} color={pal.v} font={ff} p={c01((t - 10.9) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/overlay-explainer.wav" on={audio} />
    </AbsoluteFill>
  );
}
