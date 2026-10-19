import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { target: string; label: string; months: string; thanks: string };

// A milestone counter: odometer digits roll up to the number, a dotted globe
// lights a dot for every visit wave, a monthly bar chart builds underneath,
// and confetti falls when the counter clicks over.
function Digit({ v, size, col }: { v: number; size: number; col: string }) {
  // v is a continuous digit value (e.g. 7.4 → between 7 and 8)
  const base = Math.floor(v);
  const f = v - base;
  return (
    <div style={{ position: "relative", width: size * 0.62, height: size, overflow: "hidden" }}>
      {[0, 1].map((k) => (
        <div key={k} style={{ position: "absolute", left: 0, right: 0, top: (k - f) * size, height: size, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size, fontWeight: 800, color: col, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {(base + k) % 10}
        </div>
      ))}
    </div>
  );
}

export default function MillionMilestone({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const target = Number(String(c.target || "1000000").replace(/\D/g, "")) || 1000000;
  const months = Number(c.months || 8);
  const p = cubicInOut(seg(t, 0.6, 4.0));
  const value = target * p;
  const digits = String(target).length;
  const done = t > 4.6;
  const outro = expInOut(seg(t, 7.6, 0.5));
  const endP = c01((t - 8.0) / 0.8);
  const size = 170;
  // each digit position rolls as a continuous value: floor(value / 10^k) with the fractional carry
  const digitVals = Array.from({ length: digits }, (_, i) => {
    const k = digits - 1 - i;
    const q = value / Math.pow(10, k);
    const whole = Math.floor(q);
    const frac = k === 0 ? 0 : Math.max(0, (q - whole - 0.9) * 10); // roll only near the carry
    return (whole % 10) + Math.min(1, frac);
  });

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {/* dotted globe */}
        <Svg>
          {Array.from({ length: 700 }, (_, i) => {
            const lat = Math.asin(2 * hash(i, 1) - 1);
            const lon = hash(i, 2) * Math.PI * 2 + t * 0.15;
            const x = Math.cos(lat) * Math.sin(lon);
            const z = Math.cos(lat) * Math.cos(lon);
            const y = Math.sin(lat);
            if (z < 0) return null;
            const lit = hash(i, 3) < p * 0.9;
            const pulse = lit ? Math.exp(-((t * 1.5 + hash(i, 4) * 5) % 5) * 3) : 0;
            return <circle key={i} cx={1450 + x * 330} cy={430 + y * 330} r={2.5 + z * 2.5 + pulse * 6} fill={lit ? pal.v : pal.faint} opacity={0.4 + z * 0.6} />;
          })}
        </Svg>
        {/* odometer */}
        <div style={{ position: "absolute", left: 150, top: 300, display: "flex", alignItems: "center", gap: 4, transform: `scale(${done ? 1 + 0.06 * Math.exp(-(t - 4.6) * 4) : 1})`, transformOrigin: "0 50%" }}>
          {digitVals.map((v, i) => (
            <div key={i} style={{ display: "flex", opacity: value >= Math.pow(10, digits - 1 - i) || i === digits - 1 ? 1 : 0.15 }}>
              <Digit v={v} size={size} col={done ? pal.v : pal.fg} />
              {(digits - 1 - i) % 3 === 0 && i < digits - 1 && <div style={{ width: size * 0.25, fontSize: size, fontWeight: 800, color: done ? pal.v : pal.fg, lineHeight: 1 }}>,</div>}
            </div>
          ))}
        </div>
        <Svg>
          <Txt text={c.label || "monthly visitors"} x={160} y={560} size={52} weight={600} color={pal.muted} font={ff} anchor="start" p={c01((t - 0.8) / 0.5)} mode="fade" />
          {/* monthly bars */}
          {Array.from({ length: months }, (_, i) => {
            const h = Math.pow((i + 1) / months, 2.2) * 260 * expOut(seg(t, 1.0 + i * 0.25, 0.6));
            return (
              <g key={i}>
                <rect x={160 + i * 90} y={940 - h} width={60} height={h} rx={10} fill={i === months - 1 ? pal.v : pal.card2} />
                <text x={190 + i * 90} y={985} textAnchor="middle" fontFamily={ff} fontSize={22} fill={pal.faint}>
                  M{i + 1}
                </text>
              </g>
            );
          })}
          {/* confetti */}
          {done &&
            Array.from({ length: 80 }, (_, i) => {
              const u = t - 4.6 - hash(i, 5) * 0.3;
              if (u < 0) return null;
              const x = 960 + (hash(i, 6) - 0.5) * 1900 + Math.sin(u * 3 + i) * 30;
              const y = -40 + u * (300 + hash(i, 7) * 300);
              return <rect key={i} x={x} y={y} width={14} height={22} rx={3} fill={[pal.v, pal.a, pal.fg][i % 3]} transform={`rotate(${u * 300 * (hash(i, 8) - 0.5)} ${x + 7} ${y + 11})`} />;
            })}
        </Svg>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={c.thanks || "Thank you, all of you."} x={960} y={500} size={110} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={nameOf(b)} x={960} y={620} size={52} weight={600} color={pal.v} font={ff} p={c01((t - 8.4) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/million-milestone.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = [lerp, spring];
