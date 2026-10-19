import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Paint, Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, lerp, palette, seg, txtW, useT } from "../../motion";

type C = { day: string; date: string; line: string };

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// "What day is it?" answered like a slot machine: the week spins past in a
// window, decelerates onto the day, the date drops in under it, then a brand
// color wipe carries the line for the day.
export default function TodayIs({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const day = c.day?.trim() || "Friday";
  const idx = Math.max(0, DAYS.findIndex((d) => d.toLowerCase() === day.toLowerCase()));
  const label = idx >= 0 ? DAYS[idx] : day;
  const size = 210;
  const row = 250;
  const target = 21 + idx; // three full weeks, then the day
  const spin = expOut(seg(t, 0.25, 2.5));
  const pos = target * spin;
  const vel = (target * (expOut(seg(t + 1 / 30, 0.25, 2.5)) - spin)) * 30; // rows per second
  const blur = Math.min(18, Math.abs(vel) * 0.9);
  const settle = c01((t - 2.6) / 0.4);
  const wipe = expInOut(seg(t, 5.2, 0.7));
  const lineP = c01((t - 5.7) / 0.9);
  const date = c.date || "October 17";
  const dw = txtW(label, size, 800, -0.04, ff);
  const lineSize = fit(c.line || "Make it count.", 1500, 170, 800, -0.04, ff);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      {/* the reel */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 540 - row / 2 - row, height: row * 3, overflow: "hidden", maskImage: "linear-gradient(transparent, #000 30%, #000 70%, transparent)", WebkitMaskImage: "linear-gradient(transparent, #000 30%, #000 70%, transparent)" }}>
        {Array.from({ length: 5 }, (_, j) => {
          const n = Math.floor(pos) - 2 + j;
          const y = row + (n - pos) * row;
          const name = DAYS[((n % 7) + 7) % 7];
          const center = Math.abs(n - pos) < 0.5;
          return (
            <div key={n} style={{ position: "absolute", left: 0, right: 0, top: y, height: row, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size, fontWeight: 800, letterSpacing: "-0.04em", color: center && settle > 0 ? pal.fg : pal.faint, opacity: center ? 1 : 1 - settle, filter: blur > 0.5 ? `blur(${blur}px)` : undefined, transform: `scaleY(${1 + Math.min(0.5, Math.abs(vel) * 0.02)})` }}>
              {name}
            </div>
          );
        })}
      </div>
      {/* window rules */}
      <Svg>
        {[-1, 1].map((d) => (
          <line key={d} x1={lerp(960, 160, expOut(seg(t, 0, 0.6)))} x2={lerp(960, 1760, expOut(seg(t, 0, 0.6)))} y1={540 + (d * row) / 2} y2={540 + (d * row) / 2} stroke={pal.line} strokeWidth={3} />
        ))}
        <Txt text="Today is" x={960} y={330} size={56} weight={600} color={pal.muted} font={ff} p={c01((t - 2.7) / 0.6)} mode="drop" />
        <Txt text={date} x={960} y={790} size={72} weight={700} color={pal.v} font={ff} p={c01((t - 3.0) / 0.7)} mode="drop" stagger={0.05} />
        <Paint d={`M${960 - dw / 2},${640} C${960 - dw / 4},${660} ${960 + dw / 4},${628} ${960 + dw / 2 + 20},${646}`} color={pal.v} width={14} p={expOut(seg(t, 3.4, 0.5))} />
      </Svg>
      {/* brand wipe with the line */}
      {wipe > 0 && (
        <div style={{ position: "absolute", left: 960, top: 540, width: 4000 * wipe, height: 4000 * wipe, borderRadius: "50%", background: pal.v, transform: "translate(-50%, -50%)" }} />
      )}
      {wipe > 0.9 && (
        <Svg>
          <Txt text={c.line || "Make it count."} x={960} y={540 + lineSize * 0.36} size={lineSize} weight={800} color={pal.onV} font={ff} p={lineP} stagger={0.04} tracking={-0.04} />
          <Txt text={label.toUpperCase()} x={960} y={380} size={36} weight={700} color={pal.onV} font={ff} p={c01((t - 6.2) / 0.5)} tracking={0.3} mode="fade" opacity={0.7} />
        </Svg>
      )}
      <Track src="tracks/today-is.wav" on={audio} />
    </AbsoluteFill>
  );
}
