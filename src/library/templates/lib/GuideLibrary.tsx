import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, hash, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { query: string; guide: string; steps: string; tagline: string };

// A visual-guides library launch: a wall of 24 illustrated guide tiles pops
// into a grid, a search narrows them with a filter shuffle, one tile expands
// full screen into a step-by-step visual guide whose diagram draws itself,
// then it closes back into the grid and the count ticks up.
export default function GuideLibrary({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const query = c.query || "onboarding";
  const guide = c.guide || "Onboarding in 4 steps";
  const steps = [...list(c.steps || "Welcome, Set up profile, First project, Invite team"), "Step", "Step", "Step", "Step"].slice(0, 4);
  const COLS = 6;
  const tw = 260;
  const th = 190;
  const gx = (1920 - COLS * tw - (COLS - 1) * 24) / 2;
  const typed = query.slice(0, Math.floor(c01((t - 1.8) / 0.6) * query.length));
  const filter = cubicInOut(c01((t - 2.5) / 0.6));
  const match = (i: number) => [2, 7, 9, 15].includes(i);
  const open = expInOut(seg(t, 3.4, 0.6)) * (1 - expInOut(seg(t, 7.2, 0.5)));
  const stepP = (i: number) => c01((t - 4.1 - i * 0.6) / 0.4);
  const outro = expInOut(seg(t, 8.6, 0.5));
  const endP = c01((t - 9.0) / 0.8);
  const cols = [pal.v, pal.a, "#38a3ff", "#f28ab2", "#f2b64a", "#2fbf71"];
  const thumb = (i: number) => (
    <svg width="100%" height="100%" viewBox="0 0 260 190">
      <rect width={260} height={190} fill={pal.card} />
      {hash(i, 1) > 0.5 ? (
        <>
          <circle cx={70} cy={95} r={34} fill={cols[i % 6]} />
          <path d="M110,95 H180" stroke={pal.faint} strokeWidth={6} />
          <rect x={185} y={70} width={50} height={50} rx={10} fill={cols[(i + 2) % 6]} />
        </>
      ) : (
        <>
          {[0, 1, 2].map((k) => (
            <rect key={k} x={40} y={40 + k * 40} width={60 + hash(i, k) * 140} height={22} rx={11} fill={k ? pal.faint : cols[i % 6]} />
          ))}
        </>
      )}
    </svg>
  );
  let shownIdx = 0;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: (1 - outro) * (1 - open * 0.85) }}>
        <div style={{ position: "absolute", left: gx, top: 70, width: 900, height: 90, borderRadius: 45, background: pal.card, display: "flex", alignItems: "center", padding: "0 34px", fontSize: 34, color: typed ? pal.fg : pal.muted, transform: `translateY(${(1 - spring(t - 1.4, 16, 0.7)) * -200}px)` }}>
          ⌕ {typed || "Search 240 guides"}
        </div>
        {Array.from({ length: 24 }, (_, i) => {
          const m = match(i);
          const target = m ? shownIdx++ : -1;
          const gi = filter > 0 && m ? target : i;
          const x = gx + (gi % COLS) * (tw + 24);
          const y = 200 + Math.floor(gi / COLS) * (th + 24);
          const ox = gx + (i % COLS) * (tw + 24);
          const oy = 200 + Math.floor(i / COLS) * (th + 24);
          const s = spring(t - 0.1 - (i % COLS) * 0.05 - Math.floor(i / COLS) * 0.08, 16, 0.6);
          const fade = m ? 1 : 1 - filter;
          return (
            <div key={i} style={{ position: "absolute", left: ox + (x - ox) * filter, top: oy + (y - oy) * filter, width: tw, height: th, borderRadius: 18, overflow: "hidden", transform: `scale(${s * (m ? 1 : 1 - filter * 0.3)})`, opacity: fade, boxShadow: m && filter > 0.5 ? `0 0 0 4px ${pal.v}` : "none" }}>
              {thumb(i)}
            </div>
          );
        })}
      </div>
      {open > 0 && (
        <div style={{ position: "absolute", left: 960 - 800 * open, top: 540 - 440 * open, width: 1600 * open, height: 880 * open, borderRadius: 36, background: pal.card, overflow: "hidden", opacity: c01(open * 3) }}>
          <div style={{ position: "absolute", left: 60, top: 50, fontSize: 56, fontWeight: 900, color: pal.fg }}>{guide}</div>
          <Svg w={1600} h={880}>
            {steps.map((s, i) => {
              const x = 200 + i * 400;
              const p = stepP(i);
              return (
                <g key={i}>
                  {i < 3 && <line x1={x + 90} x2={x + 90 + 220 * c01((t - 4.3 - i * 0.6) / 0.4)} y1={420} y2={420} stroke={pal.v} strokeWidth={8} strokeLinecap="round" />}
                  <g transform={`translate(${x} 420) scale(${spring(t - 4.1 - i * 0.6, 16, 0.5)})`}>
                    <circle r={86} fill={cols[i]} />
                    <text y={22} textAnchor="middle" fontFamily={ff} fontSize={64} fontWeight={900} fill="#fff">
                      {i + 1}
                    </text>
                  </g>
                  <text x={x} y={580} textAnchor="middle" fontFamily={ff} fontSize={38} fontWeight={700} fill={pal.fg} opacity={p}>
                    {s}
                  </text>
                </g>
              );
            })}
          </Svg>
        </div>
      )}
      {endP > 0 && (
        <Svg>
          <Txt text="See it. Then do it." x={960} y={500} size={120} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={`${nameOf(b)} · ${c.tagline || "240 visual guides, free"}`} x={960} y={620} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 9.4) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/guide-library.wav" on={audio} />
    </AbsoluteFill>
  );
}
