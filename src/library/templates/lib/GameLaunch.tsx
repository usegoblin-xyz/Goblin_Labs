import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Browser, Phone, Svg, Track, Txt, c01, countStat, expInOut, expOut, fit, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { game: string; players: string; matches: string; tagline: string };

// A browser game launch: live stats slam in and count up, a top-down rally
// plays in a browser, the same match jumps onto a phone, the court flips
// through three themes on the beat, and it ends on "play free" with your name.
const THEMES = [
  { court: "#3f8f4e", lines: "#ffffff", out: "#2f6b3a", name: "Grass" },
  { court: "#c46a3c", lines: "#ffffff", out: "#9c5230", name: "Clay" },
  { court: "#151030", lines: "#ff4fd8", out: "#0a0820", name: "Neon" },
];

function Court({ w, h, t, theme }: { w: number; h: number; t: number; theme: (typeof THEMES)[number] }) {
  // ball bounces between two paddles; x sweeps across, y bounces off the walls
  const period = 1.2;
  const ph = (t % period) / period;
  const dir = Math.floor(t / period) % 2;
  const bx = lerp(0.12, 0.88, dir ? 1 - ph : ph) * w;
  const by = (0.5 + 0.32 * Math.sin(t * 3.1)) * h;
  const p1 = (0.5 + 0.32 * Math.sin((t - 0.08) * 3.1)) * h;
  const p2 = (0.5 + 0.32 * Math.sin((t - 0.12) * 3.1)) * h;
  return (
    <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
      <rect width={w} height={h} fill={theme.out} />
      <rect x={w * 0.06} y={h * 0.08} width={w * 0.88} height={h * 0.84} fill={theme.court} stroke={theme.lines} strokeWidth={4} />
      <line x1={w / 2} x2={w / 2} y1={h * 0.08} y2={h * 0.92} stroke={theme.lines} strokeWidth={6} strokeDasharray="10 8" />
      <line x1={w * 0.06} x2={w * 0.94} y1={h * 0.3} y2={h * 0.3} stroke={theme.lines} strokeWidth={3} />
      <line x1={w * 0.06} x2={w * 0.94} y1={h * 0.7} y2={h * 0.7} stroke={theme.lines} strokeWidth={3} />
      <rect x={w * 0.08} y={p1 - h * 0.09} width={w * 0.025} height={h * 0.18} rx={6} fill="#fff" />
      <rect x={w * 0.895} y={p2 - h * 0.09} width={w * 0.025} height={h * 0.18} rx={6} fill="#fff" />
      <ellipse cx={bx} cy={by + h * 0.03} rx={w * 0.016} ry={h * 0.012} fill="#000" opacity={0.25} />
      <circle cx={bx} cy={by} r={Math.max(6, w * 0.016)} fill="#e8ff4a" />
    </svg>
  );
}

export default function GameLaunch({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const game = c.game || "Rally";

  const stats = [
    { v: c.players || "12,480", l: "playing now" },
    { v: c.matches || "86,214", l: "matches today" },
    { v: "14", l: "avg rally" },
  ];
  const statOut = expInOut(seg(t, 2.3, 0.4));
  const desk = spring(t - 2.5, 13, 0.8);
  const phone = spring(t - 4.4, 13, 0.75);
  const themeIdx = t < 5.8 ? 0 : t < 6.5 ? 1 : 2;
  const flip = [5.8, 6.5].reduce((m, a) => Math.max(m, Math.exp(-Math.pow((t - a) / 0.08, 2))), 0);
  const endP = expInOut(seg(t, 7.6, 0.5));
  const nameP = c01((t - 7.9) / 0.6);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      {/* stats */}
      {statOut < 1 && (
        <Svg>
          <g opacity={1 - statOut}>
            <Txt text={`${game} is live`} x={960} y={250} size={fit(`${game} is live`, 1500, 120, 900)} weight={900} color={pal.fg} font={ff} p={c01((t - 0.1) / 0.4)} tracking={-0.04} />
            {stats.map((s, i) => {
              const at = 0.5 + i * 0.35;
              const pop = spring(t - at, 18, 0.55);
              return (
                <g key={i} transform={`translate(${480 + i * 480} 600) scale(${pop})`}>
                  <text textAnchor="middle" fontFamily={ff} fontSize={130} fontWeight={900} fill={i === 0 ? pal.p : pal.fg} letterSpacing="-0.04em">
                    {countStat(s.v, expOut(c01((t - at) / 1.0)))}
                  </text>
                  <text y={70} textAnchor="middle" fontFamily={ff} fontSize={36} fill={pal.muted}>
                    {s.l}
                  </text>
                  {i === 0 && <circle cx={-230} cy={-45} r={12} fill="#ff3b5c" opacity={0.5 + 0.5 * Math.sin(t * 8)} />}
                </g>
              );
            })}
          </g>
        </Svg>
      )}
      {/* desktop */}
      {desk > 0.01 && endP < 1 && (
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${lerp(0, -260, phone)}px) scale(${lerp(0.8, 1, desk) * (1 - endP * 0.3)})`, opacity: c01(desk * 2) * (1 - endP) }}>
          <Browser x={960} y={560} w={1240} h={760} pal={pal} url={`${game.toLowerCase()}.game`}>
            <Court w={1240} h={760 - 53} t={t} theme={THEMES[themeIdx]} />
            <div style={{ position: "absolute", left: 30, top: 24, padding: "8px 18px", borderRadius: 99, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 22, fontWeight: 700 }}>
              {Math.floor(t * 1.4)} – {Math.floor(t * 1.1)}
            </div>
            <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: flip * 0.8 }} />
          </Browser>
        </div>
      )}
      {phone > 0.01 && endP < 1 && (
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${(1 - phone) * 900}px)`, opacity: 1 - endP }}>
          <Phone x={1500} y={600} h={760} pal={pal}>
            <div style={{ position: "absolute", left: 0, top: 60, width: 345, height: 620 }}>
              <Court w={345} h={620} t={t + 0.3} theme={THEMES[themeIdx]} />
            </div>
          </Phone>
        </div>
      )}
      {/* theme chips */}
      {t > 5.4 && endP < 1 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 980, display: "flex", justifyContent: "center", gap: 18, opacity: 1 - endP }}>
          {THEMES.map((th, i) => (
            <div key={th.name} style={{ padding: "12px 26px", borderRadius: 99, fontSize: 26, fontWeight: 800, background: i === themeIdx ? th.court : pal.card, color: i === themeIdx ? "#fff" : pal.fg, border: `2px solid ${th.lines}` }}>
              {th.name}
            </div>
          ))}
        </div>
      )}
      <Svg>
        {nameP > 0 && (
          <>
            <Txt text={c.tagline || "Play free in your browser"} x={960} y={500} size={fit(c.tagline || "Play free in your browser", 1500, 110, 900)} weight={900} color={pal.fg} font={ff} p={nameP} tracking={-0.04} />
            <Txt text={name} x={960} y={620} size={56} weight={700} color={pal.p} font={ff} p={c01((t - 8.3) / 0.5)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/game-launch.wav" on={audio} />
    </AbsoluteFill>
  );
}
