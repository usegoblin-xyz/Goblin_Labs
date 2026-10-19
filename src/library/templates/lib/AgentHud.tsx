import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, expInOut, fontOf, hash, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { agents: string; tagline: string };

// A mission-control HUD for running agents: corner brackets and scanlines
// boot, four agent panels open with live logs, progress rings and token
// meters; one agent flags for review, gets approved, and all panels go green.
export default function AgentHud({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const agents = [...list(c.agents || "Research, Code, Review, Deploy"), "Agent", "Agent", "Agent", "Agent"].slice(0, 4);
  const cyan = pal.v;
  const amber = "#f2b64a";
  const green = "#2fbf71";
  const boot = c01(t / 0.8);
  const flagged = t > 4.0 && t < 5.4;
  const approved = t > 5.4;
  const allDone = t > 6.6;
  const outro = expInOut(seg(t, 8.4, 0.5));
  const endP = c01((t - 8.8) / 0.8);
  const logs = [
    ["fetch 14 sources", "rank by relevance", "summarise findings", "write brief.md"],
    ["open repo", "edit auth.ts", "run tests: 48 passed", "commit 3f9a2c"],
    ["diff +212 -40", "check edge cases", "needs approval ⚠", "approved ✓"],
    ["build image", "push to registry", "roll out 25%", "roll out 100% ✓"],
  ];
  const panel = (i: number) => {
    const x = 120 + (i % 2) * 860;
    const y = 160 + Math.floor(i / 2) * 420;
    const open = spring(t - 0.8 - i * 0.2, 16, 0.7);
    const prog = allDone ? 1 : Math.min(i === 2 && !approved ? 0.66 : 1, c01((t - 1.2 - i * 0.2) / (4.8 + i * 0.3)));
    const col = allDone || prog >= 1 ? green : i === 2 && flagged ? amber : cyan;
    const nLines = Math.min(4, Math.floor(prog * 4 + 1));
    const tokens = Math.round(prog * (8000 + hash(i, 1) * 30000));
    return (
      <div key={i} style={{ position: "absolute", left: x, top: y, width: 820, height: 380, transform: `scaleY(${open})`, transformOrigin: "50% 0", border: `2px solid ${col}88`, background: `${col}0d`, boxShadow: i === 2 && flagged ? `0 0 ${20 + Math.sin(t * 12) * 10}px ${amber}` : "none", fontFamily: MONO, color: col }}>
        <div style={{ display: "flex", alignItems: "center", padding: "16px 22px", borderBottom: `2px solid ${col}44` }}>
          <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.15em" }}>AGENT_{String(i + 1).padStart(2, "0")} · {agents[i].toUpperCase()}</span>
          <span style={{ marginLeft: "auto", fontSize: 22 }}>{allDone || prog >= 1 ? "DONE" : i === 2 && flagged ? "REVIEW" : "RUNNING"}</span>
        </div>
        <div style={{ display: "flex", padding: 22, gap: 30 }}>
          <svg width={150} height={150}>
            <circle cx={75} cy={75} r={62} fill="none" stroke={`${col}33`} strokeWidth={10} />
            <circle cx={75} cy={75} r={62} fill="none" stroke={col} strokeWidth={10} pathLength={1} strokeDasharray={`${prog} 2`} transform="rotate(-90 75 75)" />
            <text x={75} y={85} textAnchor="middle" fontFamily={MONO} fontSize={30} fill={col}>
              {Math.round(prog * 100)}%
            </text>
          </svg>
          <div style={{ flex: 1, fontSize: 24, lineHeight: 1.6 }}>
            {logs[i].slice(0, nLines).map((l, j) => (
              <div key={j} style={{ opacity: j === nLines - 1 ? 1 : 0.6 }}>
                › {i === 2 && j === 3 && !approved ? "" : l}
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: "absolute", left: 22, right: 22, bottom: 18, display: "flex", alignItems: "center", gap: 12, fontSize: 20 }}>
          <span>TOKENS</span>
          <div style={{ flex: 1, height: 8, background: `${col}22` }}>
            <div style={{ width: `${prog * 100}%`, height: "100%", background: col }} />
          </div>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{tokens.toLocaleString("en-US")}</span>
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: "#05070a", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: (1 - outro) * boot }}>
        <AbsoluteFill style={{ backgroundImage: `repeating-linear-gradient(0deg, ${cyan}08 0 2px, transparent 2px 6px)` }} />
        <Svg>
          {[
            [40, 40, 1, 1],
            [1880, 40, -1, 1],
            [40, 1040, 1, -1],
            [1880, 1040, -1, -1],
          ].map(([x, y, sx, sy], i) => (
            <path key={i} d={`M${x},${y + sy * 80} V${y} H${x + sx * 80}`} fill="none" stroke={cyan} strokeWidth={4} />
          ))}
          <Txt text={`${nameOf(b).toUpperCase()} // AGENT HUD`} x={120} y={110} size={30} weight={700} color={cyan} font={MONO} p={c01((t - 0.3) / 0.5)} anchor="start" mode="type" />
        </Svg>
        <div style={{ position: "absolute", right: 120, top: 80, fontFamily: MONO, fontSize: 26, color: cyan }}>T+{t.toFixed(2)}s</div>
        {agents.map((_, i) => panel(i))}
        {flagged && (
          <div style={{ position: "absolute", left: 980, top: 1000, display: "flex", gap: 16, fontFamily: MONO }}>
            <div style={{ padding: "10px 24px", border: `2px solid ${amber}`, color: amber, fontSize: 24 }}>HUMAN REVIEW REQUESTED</div>
            <div style={{ padding: "10px 24px", background: t > 5.1 ? green : "transparent", border: `2px solid ${green}`, color: t > 5.1 ? "#05070a" : green, fontSize: 24 }}>APPROVE</div>
          </div>
        )}
        {allDone && (
          <div style={{ position: "absolute", left: 0, right: 0, top: 1000, textAlign: "center", fontFamily: MONO, fontSize: 30, color: green, letterSpacing: "0.2em", opacity: c01((t - 6.6) * 3) }}>ALL AGENTS COMPLETE</div>
        )}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="See every agent. Steer any of them." x={960} y={500} size={86} weight={800} color="#fff" font={ff} p={endP} tracking={-0.03} />
          <Txt text={`${nameOf(b)} · ${c.tagline || "mission control for agents"}`} x={960} y={610} size={44} weight={600} color={cyan} font={ff} p={c01((t - 9.2) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/agent-hud.wav" on={audio} />
    </AbsoluteFill>
  );
}
