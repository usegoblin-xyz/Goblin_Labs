import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { jobs: string; people: string; tagline: string };

// A job-ownership explainer: a board of task cards floats with no owners;
// two of them drift down and fall through a crack in the floor ("nobody
// owned it"); then rewind, avatars drop in and snap a line to each card,
// the crack seals, and every card turns from grey to on-track green.
export default function OwnershipMap({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const jobs = [...list(c.jobs || "Renewals, Onboarding, Bug triage, Pricing page, Hiring loop, Weekly report"), "Job", "Job", "Job", "Job", "Job", "Job"].slice(0, 6);
  const people = [...list(c.people || "Ana, Ben, Chloe"), "A", "B", "C"].slice(0, 3);
  const pcols = [pal.v, pal.a, "#38a3ff"];
  const red = "#e5484d";
  const green = "#2fbf71";
  const fall = c01((t - 1.8) / 1.2);
  const rewind = expInOut(seg(t, 3.6, 0.7));
  const fallP = fall * (1 - rewind);
  const assign = (i: number) => c01((t - 4.6 - i * 0.25) / 0.4);
  const seal = c01((t - 6.4) / 0.5);
  const outro = expInOut(seg(t, 8.6, 0.5));
  const endP = c01((t - 9.0) / 0.8);
  const pos = (i: number) => ({ x: 180 + (i % 3) * 420, y: 200 + Math.floor(i / 3) * 260 });
  const falling = [1, 4];
  const owner = (i: number) => i % 3;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Svg>
          {/* floor and crack */}
          <line x1={80} x2={1460} y1={820} y2={820} stroke={pal.fg} strokeWidth={6} />
          <path d={`M640,820 L${680 - seal * 40},${820 + (1 - seal) * 60} L${720 - seal * 80},820`} fill={pal.bg} stroke={pal.fg} strokeWidth={6} opacity={c01((t - 1.6) * 3)} />
          {/* assignment lines */}
          {jobs.map((_, i) => {
            const a = assign(i);
            if (a <= 0) return null;
            const p = pos(i);
            const o = owner(i);
            const ox = 1660;
            const oy = 280 + o * 220;
            return <line key={i} x1={ox - 70} y1={oy} x2={lerp(ox - 70, p.x + 340, cubicInOut(a))} y2={lerp(oy, p.y + 60, cubicInOut(a))} stroke={pcols[o]} strokeWidth={4} opacity={0.7} />;
          })}
        </Svg>
        {jobs.map((j, i) => {
          const p = pos(i);
          const isFall = falling.includes(i);
          const drift = isFall ? fallP : 0;
          const s = spring(t - 0.2 - i * 0.08, 15, 0.65);
          const a = assign(i);
          const st = a > 0.9 ? "On track" : isFall && fall > 0.2 && rewind < 1 ? "Dropped" : "No owner";
          const stCol = st === "On track" ? green : st === "Dropped" ? red : pal.muted;
          const fx = lerp(p.x, 520 + (i === 1 ? 0 : 80), drift);
          const fy = lerp(p.y, 1100, drift * drift);
          return (
            <div key={i} style={{ position: "absolute", left: fx, top: fy, width: 340, height: 120, borderRadius: 22, background: pal.card, padding: "20px 26px", boxSizing: "border-box", transform: `scale(${s}) rotate(${drift * (i === 1 ? -25 : 30) + Math.sin(t * 1.5 + i) * (a > 0.9 ? 0 : 1.2)}deg)`, borderLeft: `8px solid ${a > 0.9 ? pcols[owner(i)] : pal.faint}` }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: pal.fg }}>{j}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 22, fontWeight: 700, color: stCol }}>
                <span style={{ width: 12, height: 12, borderRadius: 6, background: stCol }} />
                {st}
                {a > 0.9 && <span style={{ marginLeft: "auto", color: pal.muted, fontWeight: 600 }}>{people[owner(i)]}</span>}
              </div>
            </div>
          );
        })}
        {/* people */}
        {people.map((pp, o) => {
          const s = spring(t - 4.2 - o * 0.15, 14, 0.5);
          return (
            <div key={o} style={{ position: "absolute", left: 1600, top: 220 + o * 220, width: 120, height: 120, borderRadius: 60, background: pcols[o], color: "#fff", fontSize: 50, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", transform: `translateY(${(1 - s) * -800}px)` }}>
              {pp[0]}
            </div>
          );
        })}
        <Svg>
          {t > 2.0 && t < 3.6 && <Txt text="Nobody owned it." x={760} y={970} size={56} weight={800} color={red} font={ff} p={c01((t - 2.0) / 0.4)} />}
          {t > 3.6 && t < 4.4 && <Txt text="◀◀ rewind" x={760} y={970} size={44} weight={700} color={pal.muted} font={ff} p={1} />}
          {t > 5.8 && <Txt text="Every job has one owner." x={760} y={970} size={56} weight={800} color={green} font={ff} p={c01((t - 5.8) / 0.4)} />}
        </Svg>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="One job. One owner." x={960} y={500} size={120} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={`${nameOf(b)} · ${c.tagline || "clear ownership for every team"}`} x={960} y={620} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 9.4) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/ownership-map.wav" on={audio} />
    </AbsoluteFill>
  );
}
