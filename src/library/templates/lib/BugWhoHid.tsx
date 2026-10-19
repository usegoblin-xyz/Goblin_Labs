import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, expInOut, expOut, fontOf, kf, lerp, nameOf, palette, seg, useT } from "../../motion";

type C = { tagline: string };

// A tiny animated short: a bug lives in line 7 of someone's code and does not
// want to be fixed. A failing test goes red, the search highlight hunts it,
// it scurries between lines, disguises itself as a semicolon, sneezes and is
// caught, holds up a "please" sign, and the developer spares it with a
// comment. The test goes green and the bug cheers.
const CODE = [
  "function total(cart) {",
  "  let sum = 0;",
  "  for (const item of cart) {",
  "    sum += item.price",
  "      * item.qty;",
  "  }",
  "  return sum + shipping(cart)",
  "}",
  "",
  "test(\"adds shipping\", () => {",
  "  expect(total(demo)).toBe(42);",
  "});",
];
const LH = 58;
const X0 = 300;
const Y0 = 220;
const CW = 22.2;

function Bug({ x, y, s, t, mood, sign }: { x: number; y: number; s: number; t: number; mood: "happy" | "scared" | "sad" | "hidden"; sign?: number }) {
  const legs = Math.sin(t * 30) * 6;
  if (mood === "hidden") {
    return (
      <g transform={`translate(${x} ${y})`}>
        <text x={-6} y={14} fontFamily={MONO} fontSize={40} fill="#c9d1d9">
          ;
        </text>
        <circle cx={4} cy={-14} r={2.4} fill="#0d1117" />
        <circle cx={10} cy={-14} r={2.4} fill="#0d1117" />
      </g>
    );
  }
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[-1, 0, 1].map((k) => (
        <g key={k} stroke="#1c1c1c" strokeWidth={3} strokeLinecap="round">
          <line x1={k * 10} y1={0} x2={k * 14 - 6} y2={20 + (k % 2 ? legs : -legs)} />
          <line x1={k * 10} y1={0} x2={k * 14 + 6} y2={-20 + (k % 2 ? -legs : legs)} />
        </g>
      ))}
      <ellipse cx={0} cy={0} rx={24} ry={18} fill="#e5484d" />
      <line x1={0} y1={-18} x2={0} y2={18} stroke="#1c1c1c" strokeWidth={2} />
      <circle cx={-8} cy={-6} r={4} fill="#1c1c1c" />
      <circle cx={10} cy={6} r={4} fill="#1c1c1c" />
      <circle cx={26} cy={0} r={12} fill="#1c1c1c" />
      <circle cx={30} cy={-4} r={4} fill="#fff" />
      <circle cx={31 + (mood === "scared" ? -2 : 1)} cy={-4} r={2} fill="#1c1c1c" />
      <path d="M32,-10 q8,-16 18,-14 M26,-10 q2,-18 10,-22" stroke="#1c1c1c" strokeWidth={2} fill="none" />
      {mood === "sad" && <circle cx={34} cy={4} r={2.5} fill="#7cc4ff" />}
      {mood === "happy" && <path d="M26,5 q5,5 10,0" stroke="#fff" strokeWidth={2} fill="none" />}
      {sign !== undefined && sign > 0 && (
        <g opacity={sign} transform="translate(-10 -70)">
          <line x1={20} y1={30} x2={20} y2={60} stroke="#8a6a3a" strokeWidth={4} />
          <rect x={-30} y={-6} width={110} height={40} rx={6} fill="#fff8e6" stroke="#8a6a3a" strokeWidth={3} />
          <text x={25} y={22} textAnchor="middle" fontFamily={MONO} fontSize={20} fill="#3a2a16">
            please
          </text>
        </g>
      )}
    </g>
  );
}

export default function BugWhoHid({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const pos = (line: number, col: number) => [X0 + 70 + col * CW, Y0 + line * LH - 14] as const;

  // bug path through the code
  const bx = kf(t, [[1.2, pos(3, 22)[0]], [2.6, pos(3, 22)[0]], [3.0, pos(1, 16)[0]], [3.4, pos(5, 6)[0]], [3.8, pos(6, 30)[0]], [4.1, pos(1, 13)[0]], [6.6, pos(1, 13)[0]], [7.0, pos(3, 22)[0]]]);
  const by = kf(t, [[1.2, pos(3, 22)[1]], [2.6, pos(3, 22)[1]], [3.0, pos(1, 16)[1]], [3.4, pos(5, 6)[1]], [3.8, pos(6, 30)[1]], [4.1, pos(1, 13)[1]], [6.6, pos(1, 13)[1]], [7.0, pos(3, 22)[1]]]);
  const appear = expOut(seg(t, 1.2, 0.4));
  const disguised = t > 4.2 && t < 5.3;
  const sneeze = t > 5.3 && t < 5.6;
  const caught = expOut(seg(t, 5.6, 0.4));
  const fixed = t > 7.6;
  const mood = disguised ? "hidden" : t < 2.6 ? "happy" : t < 5.6 ? "scared" : t < 7.7 ? "sad" : "happy";
  const cheer = fixed ? Math.abs(Math.sin((t - 7.6) * 10)) * 26 : 0;

  // search highlight that chases
  const hl = (() => {
    if (t < 2.4 || t > 5.6) return null;
    const lag = 0.25;
    const lx = kf(t - lag, [[2.6, pos(3, 22)[0]], [3.0, pos(1, 16)[0]], [3.4, pos(5, 6)[0]], [3.8, pos(6, 30)[0]], [4.1, pos(1, 13)[0]], [4.6, pos(1, 13)[0]], [5.0, pos(9, 4)[0]]]);
    const ly = kf(t - lag, [[2.6, pos(3, 22)[1]], [3.0, pos(1, 16)[1]], [3.4, pos(5, 6)[1]], [3.8, pos(6, 30)[1]], [4.1, pos(1, 13)[1]], [4.6, pos(1, 13)[1]], [5.0, pos(9, 4)[1]]]);
    return [lx, ly] as const;
  })();
  const typed = "  // not a bug. a feature.";
  const nType = Math.floor(c01((t - 6.8) / 0.7) * typed.length);
  const endP = c01((t - 8.6) / 0.5);

  return (
    <AbsoluteFill style={{ background: "#0d1117", overflow: "hidden", fontFamily: ff }}>
      <Svg>
        <g opacity={1 - endP * 0.85}>
          {/* window */}
          <rect x={X0 - 60} y={100} width={1320} height={880} rx={22} fill="#161b22" stroke="#30363d" strokeWidth={2} />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={X0 - 20 + i * 30} cy={134} r={9} fill={["#ff5f57", "#febc2e", "#28c840"][i]} />
          ))}
          <text x={X0 + 100} y={142} fontFamily={MONO} fontSize={22} fill="#8b949e">
            cart.js
          </text>
          {CODE.map((ln, i) => (
            <g key={i}>
              <text x={X0} y={Y0 + i * LH} fontFamily={MONO} fontSize={24} fill="#484f58" textAnchor="end">
                {i + 1}
              </text>
              <text x={X0 + 70} y={Y0 + i * LH} fontFamily={MONO} fontSize={36} fill={i === 3 && !fixed ? "#ffa198" : "#c9d1d9"}>
                {ln}
              </text>
            </g>
          ))}
          {t > 6.8 && (
            <text x={X0 + 70 + 23 * CW} y={Y0 + 3 * LH} fontFamily={MONO} fontSize={36} fill="#7ee787">
              {typed.slice(0, nType)}
            </text>
          )}
          {hl && <rect x={hl[0] - 40} y={hl[1] - 30} width={110} height={56} rx={8} fill="#f2cc60" opacity={0.28} stroke="#f2cc60" strokeWidth={2} />}
          {/* find box */}
          {t > 2.2 && t < 5.9 && (
            <g transform="translate(1120 170)" opacity={c01((t - 2.2) / 0.2)}>
              <rect width={360} height={56} rx={10} fill="#0d1117" stroke="#30363d" strokeWidth={2} />
              <text x={20} y={37} fontFamily={MONO} fontSize={26} fill="#c9d1d9">{`find: bug${t < 4.2 ? "" : " (0 results)"}`.slice(0, t < 4.2 ? 9 : 22)}</text>
            </g>
          )}
          {/* the net (selection box) */}
          {caught > 0 && t < 7.6 && <rect x={pos(1, 13)[0] - 60} y={lerp(pos(1, 13)[1] - 260, pos(1, 13)[1] - 50, caught)} width={120} height={90} rx={10} fill="#388bfd" opacity={0.28} stroke="#388bfd" strokeWidth={3} />}
          {/* test panel */}
          <g transform={`translate(${X0 + 820} 820)`}>
            <rect width={420} height={120} rx={16} fill={fixed ? "#12361f" : t > 0.4 ? "#3a1518" : "#161b22"} stroke={fixed ? "#2ea043" : "#f85149"} strokeWidth={2} opacity={c01((t - 0.3) / 0.3)} />
            <text x={30} y={72} fontFamily={MONO} fontSize={32} fill={fixed ? "#7ee787" : "#ff7b72"} opacity={c01((t - 0.3) / 0.3)}>
              {fixed ? "✓ 1 passing" : "✕ 1 failing"}
            </text>
          </g>
          {/* the bug */}
          {appear > 0 && <Bug x={bx} y={by - cheer} s={appear * 1.1} t={t} mood={mood} sign={t > 6.0 && t < 7.6 ? c01((t - 6.0) / 0.3) : undefined} />}
          {sneeze && <Txt text="achoo!" x={pos(1, 13)[0] + 40} y={pos(1, 13)[1] - 60} size={40} weight={900} color="#f2cc60" font={ff} p={c01((t - 5.3) / 0.15)} mode="scale" />}
          {fixed && <Txt text="yay!" x={bx + 60} y={by - 90} size={44} weight={900} color="#7ee787" font={ff} p={c01((t - 7.7) / 0.3)} mode="scale" />}
        </g>
        {endP > 0 && (
          <>
            <Txt text="The Bug Who Hid" x={960} y={500} size={130} weight={900} color="#ffffff" font={ff} p={endP} tracking={-0.04} />
            <Txt text={`${c.tagline || "A tiny short"} · ${name}`} x={960} y={600} size={42} weight={500} color="#8b949e" font={ff} p={c01((t - 8.9) / 0.5)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/bug-who-hid.wav" on={audio} />
    </AbsoluteFill>
  );
}
