import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Icon, MONO, Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fit, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { task: string; agents: string; result: string; tagline: string };

// A multi-agent workflow: a task card drops in, splits into agent nodes
// (research, draft, review, ship) along a pipeline; each node spins up,
// works with a live status line, and hands a glowing packet to the next,
// until the finished deliverable lands.
export default function AgentPipeline({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const task = c.task || "Write this week's customer update";
  const agents = [...list(c.agents || "Research, Draft, Review, Ship"), "Agent", "Agent", "Agent", "Agent"].slice(0, 4);
  const result = c.result || "Update sent to 2,400 customers";
  const icons = ["search", "doc", "check", "rocket"];
  const statuses = [["reading 14 tickets", "found 3 themes"], ["writing 420 words", "draft ready"], ["checking tone", "2 edits applied"], ["scheduling", "sent"]];
  const X = (i: number) => 330 + i * 420;
  const Y = 560;
  const taskIn = spring(t - 0.2, 16, 0.65);
  const split = expInOut(seg(t, 1.3, 0.7));
  const workAt = (i: number) => 2.0 + i * 1.3;
  const outro = expInOut(seg(t, 8.4, 0.5));
  const endP = c01((t - 8.8) / 0.8);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* task card */}
        <div style={{ position: "absolute", left: 960, top: lerp(540, 180, split), transform: `translate(-50%, -50%) scale(${lerp(taskIn, 0.8, split)})`, padding: "30px 44px", borderRadius: 28, background: pal.card2, fontSize: fit(task, 1100, 48, 700, -0.02, ff), fontWeight: 700, color: pal.fg, whiteSpace: "nowrap", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
          <span style={{ fontFamily: MONO, fontSize: 26, color: pal.v, marginRight: 20 }}>TASK</span>
          {task}
        </div>
        <Svg>
          {agents.map((_, i) =>
            i < 3 ? (
              <line key={i} x1={X(i) + 110} x2={lerp(X(i) + 110, X(i + 1) - 110, split)} y1={Y} y2={Y} stroke={t > workAt(i) + 1.0 ? pal.v : pal.line} strokeWidth={6} />
            ) : null,
          )}
          {/* packets */}
          {agents.map((_, i) => {
            if (i >= 3) return null;
            const u = cubicInOut(c01((t - workAt(i) - 1.0) / 0.3));
            if (u <= 0 || u >= 1) return null;
            return <circle key={i} cx={lerp(X(i) + 110, X(i + 1) - 110, u)} cy={Y} r={16} fill={pal.v} />;
          })}
          {agents.map((a, i) => {
            const p = spring(t - 1.4 - i * 0.12, 16, 0.6) * split;
            const working = t > workAt(i) && t < workAt(i) + 1.0;
            const done = t >= workAt(i) + 1.0;
            const spin = working ? (t - workAt(i)) * 360 : 0;
            return (
              <g key={i} transform={`translate(${X(i)} ${Y}) scale(${Math.max(0, p)})`}>
                <circle r={100} fill={done ? pal.v : pal.card2} />
                {working && <circle r={112} fill="none" stroke={pal.v} strokeWidth={8} strokeDasharray="120 600" transform={`rotate(${spin})`} />}
                <Icon name={icons[i]} x={0} y={0} size={84} color={done ? pal.onV : pal.fg} width={2.4} />
                <text y={170} textAnchor="middle" fontFamily={ff} fontSize={40} fontWeight={800} fill={pal.fg}>
                  {a}
                </text>
                <text y={215} textAnchor="middle" fontFamily={MONO} fontSize={22} fill={done ? pal.v : pal.muted}>
                  {t < workAt(i) ? "waiting" : working ? statuses[i][0] : statuses[i][1]}
                </text>
              </g>
            );
          })}
        </Svg>
        {t > workAt(3) + 1.1 && (
          <div style={{ position: "absolute", left: 960, top: 900, transform: `translate(-50%, -50%) scale(${spring(t - workAt(3) - 1.1, 16, 0.55)})`, padding: "26px 44px", borderRadius: 30, background: pal.v, color: pal.onV, fontSize: 44, fontWeight: 800, whiteSpace: "nowrap" }}>
            ✓ {result}
          </div>
        )}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "A team of agents, on every task."} x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - 9.2) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/agent-pipeline.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = expOut;
