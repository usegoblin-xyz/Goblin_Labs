import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { role: string };

// Motion written in code: an editor types six lines on the left and the
// canvas on the right obeys each one as it lands (draw, fill, repeat, morph,
// spin, gather). Then the editor slides away and the canvas takes the frame.
const LINES = [
  { code: "shape = circle({ r: 120 })", at: 0.5 },
  { code: "shape.fill(brand.primary)", at: 1.6 },
  { code: "shape.repeat(6, { orbit: 230 })", at: 2.7 },
  { code: 'shape.morph("square")', at: 3.8 },
  { code: "shape.spin(360)", at: 4.9 },
  { code: "shape.gather().say(name)", at: 6.0 },
];
const TYPE_DUR = 0.55;

export default function CodeCanvas({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);

  const panelIn = expOut(seg(t, 0, 0.5));
  const panelOut = expInOut(seg(t, 7.2, 0.6));
  const cx = lerp(1300, 960, panelOut);
  const cy = 540;

  // Shape state, each step driven by its line landing.
  const done = (i: number) => LINES[i].at + TYPE_DUR;
  const draw = expOut(seg(t, done(0), 0.5));
  const fill = expOut(seg(t, done(1), 0.4));
  const split = spring(t - done(2), 12, 0.75);
  const square = expInOut(seg(t, done(3), 0.45));
  const spin = expInOut(seg(t, done(4), 0.8));
  const gather = expInOut(seg(t, done(5), 0.5));
  const nameP = c01((t - done(5) - 0.35) / 0.6);
  const roleP = c01((t - 7.9) / 0.6);

  const n = 6;
  const r = lerp(120, 56, split);
  const orbit = 230 * split * (1 - gather);
  const rot = spin * 360 + split * 30;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      {/* dotted canvas grid */}
      <Svg>
        {Array.from({ length: 19 }).map((_, i) =>
          Array.from({ length: 11 }).map((__, j) => <circle key={`${i}-${j}`} cx={60 + i * 100} cy={40 + j * 100} r={2} fill={pal.line} />),
        )}
      </Svg>

      {/* the canvas object */}
      <Svg>
        <g transform={`translate(${cx} ${cy}) rotate(${rot})`}>
          {Array.from({ length: split > 0.001 ? n : 1 }).map((_, i) => {
            const a = (i / n) * Math.PI * 2;
            const x = Math.cos(a) * orbit;
            const y = Math.sin(a) * orbit;
            const s = r * 2;
            const sz = s * (1 - gather * 0.6);
            return (
              <rect
                key={i}
                x={x - sz / 2}
                y={y - sz / 2}
                width={sz}
                height={sz}
                rx={lerp(sz / 2, sz * 0.28, square)}
                fill={fill > 0 ? (i % 2 && split > 0.5 ? pal.a : pal.p) : "none"}
                fillOpacity={fill * (1 - c01((nameP - 0.2) * 3))}
                stroke={pal.p}
                strokeWidth={6}
                strokeOpacity={1 - c01((nameP - 0.2) * 3)}
                pathLength={1}
                strokeDasharray={`${draw} 2`}
              />
            );
          })}
        </g>
        {nameP > 0 && (
          <Txt text={name} x={cx} y={cy + 40} size={fit(name, 1100, 180, 800)} weight={800} color={pal.fg} font={ff} p={nameP} mode="scale" tracking={-0.04} />
        )}
        {roleP > 0 && <Txt text={c.role || "Motion, written in code"} x={cx} y={cy + 150} size={44} weight={500} color={pal.muted} font={ff} p={roleP} mode="fade" />}
      </Svg>

      {/* editor */}
      <div
        style={{
          position: "absolute",
          left: 70,
          top: 170,
          width: 760,
          height: 740,
          borderRadius: 24,
          background: pal.dark ? "#0d0f12" : "#111317",
          boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
          transform: `translateX(${(1 - panelIn) * -900 - panelOut * 900}px)`,
          overflow: "hidden",
        }}
      >
        <div style={{ height: 54, display: "flex", alignItems: "center", gap: 10, padding: "0 22px", borderBottom: "1.5px solid rgba(255,255,255,0.08)" }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((col) => (
            <div key={col} style={{ width: 14, height: 14, borderRadius: 99, background: col }} />
          ))}
          <div style={{ marginLeft: 16, fontFamily: MONO, fontSize: 20, color: "rgba(255,255,255,0.45)" }}>reel.ts</div>
        </div>
        <div style={{ padding: "30px 0" }}>
          {LINES.map((l, i) => {
            const typed = Math.floor(c01((t - l.at) / TYPE_DUR) * l.code.length);
            const active = t >= l.at && (i === LINES.length - 1 || t < LINES[i + 1].at);
            if (t < l.at) return null;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", height: 64, background: active ? "rgba(255,255,255,0.05)" : "transparent", fontFamily: MONO, fontSize: 26, whiteSpace: "pre" }}>
                <div style={{ width: 70, textAlign: "right", paddingRight: 22, color: "rgba(255,255,255,0.28)" }}>{i + 1}</div>
                <Highlight text={l.code.slice(0, typed)} primary={b.primary} accent={b.accent} />
                {active && Math.floor(t * 3) % 2 === 0 && <div style={{ width: 3, height: 32, background: "#fff", marginLeft: 2 }} />}
              </div>
            );
          })}
        </div>
      </div>
      <Track src="tracks/code-canvas.wav" on={audio} />
    </AbsoluteFill>
  );
}

// Tiny syntax colouring: strings, numbers, method names.
function Highlight({ text, primary, accent }: { text: string; primary: string; accent: string }) {
  const parts = text.split(/("[^"]*"?|\d+|\.[a-z]+)/g).filter(Boolean);
  return (
    <span>
      {parts.map((p, i) => {
        const color = p.startsWith('"') ? accent : /^\d+$/.test(p) ? "#f2b45a" : p.startsWith(".") ? primary : "rgba(255,255,255,0.88)";
        return (
          <span key={i} style={{ color }}>
            {p}
          </span>
        );
      })}
    </span>
  );
}

