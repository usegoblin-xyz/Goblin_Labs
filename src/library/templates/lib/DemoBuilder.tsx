import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Browser, Cursor, Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, kf, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { tips: string; link: string; tagline: string };

// An interactive-demo builder launch: a browser records clicks (red dot),
// the captured screens fan out as a filmstrip, hotspots pulse on each frame
// with tooltip steps, a share link copies, and a viewer clicks through the
// demo on their own.
export default function DemoBuilder({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const tips = [...list(c.tips || "Start a new project, Pick a template, Invite your team"), "Click here", "Click here", "Click here"].slice(0, 3);
  const link = c.link || "demo.example.com/tour";
  const rec = t > 0.4 && t < 2.6;
  const cx = kf(t, [[0.6, 1300], [1.1, 560], [1.6, 1000], [2.1, 1400], [2.5, 1400]], cubicInOut);
  const cy = kf(t, [[0.6, 800], [1.1, 300], [1.6, 600], [2.1, 470], [2.5, 470]], cubicInOut);
  const press = [1.1, 1.6, 2.1].reduce((a, at) => a + Math.max(0, 1 - Math.abs(t - at) * 8), 0);
  const fanP = expInOut(seg(t, 2.7, 0.7));
  const tipAt = (i: number) => 3.6 + i * 0.7;
  const share = spring(t - 5.9, 14, 0.6);
  const copied = t > 6.5;
  const outro = expInOut(seg(t, 8.4, 0.5));
  const endP = c01((t - 8.8) / 0.8);
  const hot = [
    [0.18, 0.2],
    [0.48, 0.55],
    [0.75, 0.4],
  ];
  const Screen = ({ k }: { k: number }) => (
    <div style={{ position: "absolute", inset: 0, background: pal.bg }}>
      <div style={{ position: "absolute", left: "6%", top: "8%", width: "26%", height: "84%", borderRadius: 14, background: pal.card }} />
      {[0, 1, 2].map((r) => (
        <div key={r} style={{ position: "absolute", left: "36%", top: `${10 + r * 26}%`, width: `${50 - r * 8}%`, height: "18%", borderRadius: 14, background: r === k ? pal.card2 : pal.card }} />
      ))}
    </div>
  );

  return (
    <AbsoluteFill style={{ background: pal.dark ? "#0c0c0f" : "#f4f4f6", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* recording browser */}
        {fanP < 1 && (
          <div style={{ position: "absolute", inset: 0, opacity: 1 - fanP, transform: `scale(${1 - fanP * 0.4})` }}>
            <Svg>
              <Browser x={360} y={140} w={1200} h={760} pal={pal} url="app.example.com" />
            </Svg>
            <div style={{ position: "absolute", left: 360, top: 210, width: 1200, height: 690, overflow: "hidden", borderRadius: "0 0 24px 24px" }}>
              <Screen k={Math.min(2, Math.max(0, Math.floor((t - 1.1) / 0.5)))} />
            </div>
            {rec && (
              <div style={{ position: "absolute", left: 1380, top: 160, display: "flex", alignItems: "center", gap: 10, padding: "8px 18px", borderRadius: 20, background: "#e5484d", color: "#fff", fontSize: 24, fontWeight: 800 }}>
                <span style={{ width: 14, height: 14, borderRadius: 7, background: "#fff", opacity: Math.floor(t * 3) % 2 ? 1 : 0.3 }} /> REC
              </div>
            )}
            {[1.1, 1.6, 2.1].map((at, i) =>
              t > at && t < at + 0.5 ? <div key={i} style={{ position: "absolute", left: [560, 1000, 1400][i] - 40 * (1 + (t - at) * 2), top: [300, 600, 470][i] - 40 * (1 + (t - at) * 2), width: 80 * (1 + (t - at) * 2), height: 80 * (1 + (t - at) * 2), borderRadius: "50%", border: `4px solid ${pal.v}`, opacity: 1 - (t - at) * 2 }} /> : null,
            )}
            <Cursor x={cx} y={cy} press={press} color={pal.fg} size={44} />
          </div>
        )}
        {/* filmstrip of steps with hotspots */}
        {fanP > 0 &&
          [0, 1, 2].map((k) => {
            const x = 140 + k * 570;
            const s = spring(t - 2.8 - k * 0.12, 14, 0.65);
            const tp = c01((t - tipAt(k)) / 0.3);
            return (
              <div key={k} style={{ position: "absolute", left: x, top: 260, width: 520, height: 340, borderRadius: 22, overflow: "visible", transform: `translateY(${(1 - s) * 300}px)`, opacity: c01(s * 2) }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: 22, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
                  <Screen k={k} />
                </div>
                <div style={{ position: "absolute", left: `${hot[k][0] * 100}%`, top: `${hot[k][1] * 100}%`, width: 34, height: 34, marginLeft: -17, marginTop: -17, borderRadius: 17, background: pal.v, boxShadow: `0 0 0 ${8 + Math.sin(t * 6 + k) * 6}px ${pal.v}55`, transform: `scale(${spring(t - tipAt(k) + 0.3, 16, 0.5)})` }} />
                {tp > 0 && (
                  <div style={{ position: "absolute", left: `${hot[k][0] * 100}%`, top: `calc(${hot[k][1] * 100}% + 34px)`, padding: "16px 22px", borderRadius: 16, background: pal.fg, color: pal.bg, fontSize: 24, fontWeight: 700, whiteSpace: "nowrap", opacity: tp, transform: `translate(${k === 2 ? -100 : 0}%, ${(1 - tp) * 20}px)` }}>
                    {k + 1}/3 · {tips[k]}
                  </div>
                )}
                <div style={{ position: "absolute", left: 0, top: 360, fontSize: 26, color: pal.muted, fontWeight: 700 }}>Step {k + 1}</div>
              </div>
            );
          })}
        {/* share bar */}
        {share > 0.01 && (
          <div style={{ position: "absolute", left: 560, top: 780, width: 800, height: 100, borderRadius: 50, background: pal.card, display: "flex", alignItems: "center", padding: "0 14px 0 40px", gap: 20, transform: `scale(${share})` }}>
            <span style={{ fontSize: 30, color: pal.fg }}>🔗 {link}</span>
            <span style={{ marginLeft: "auto", padding: "18px 34px", borderRadius: 40, background: copied ? pal.v : pal.fg, color: copied ? pal.onV : pal.bg, fontSize: 28, fontWeight: 800 }}>{copied ? "Copied ✓" : "Copy link"}</span>
          </div>
        )}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="Show, don't schedule a call." x={960} y={500} size={100} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={`${nameOf(b)} · ${c.tagline || "interactive demos in minutes"}`} x={960} y={620} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 9.2) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/demo-builder.wav" on={audio} />
    </AbsoluteFill>
  );
}
