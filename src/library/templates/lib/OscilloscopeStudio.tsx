import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, c01, expInOut, expOut, fit, fontOf, lerp, nameOf, palette, seg, Track, useT } from "../../motion";

type C = { services: string; role: string };

// A studio intro on an oscilloscope: the CRT powers on, the beam draws a sine
// for the first service, a drifting Lissajous for the second, a square wave
// for the third, spirals into a dot in XY mode, and the dot blooms into your
// name in phosphor with a slow afterglow.
const SW = 1400;
const SH = 860;
const DIVX = 10;
const DIVY = 8;

function wave(kind: number, s: number, t: number, amp: number): [number, number] {
  // s in [0,1] across the screen; returns screen-space point
  const x = (s - 0.5) * SW * 0.92;
  if (kind === 0) return [x, -Math.sin(s * Math.PI * 6 - t * 9) * amp];
  if (kind === 2) {
    const ph = (s * 5 - t * 1.6) % 1;
    const v = ph < 0 ? ph + 1 : ph;
    return [x, (v < 0.5 ? -1 : 1) * amp];
  }
  return [x, 0];
}

export default function OscilloscopeStudio({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const services = [...list(c.services || "Sound, Motion, Code"), "Signal", "Signal", "Signal"].slice(0, 3);
  const beam = pal.p;

  const powerH = expOut(seg(t, 0.1, 0.25));
  const powerV = expOut(seg(t, 0.35, 0.3));
  const mode = t < 2.4 ? 0 : t < 4.0 ? 1 : t < 5.6 ? 2 : t < 7.2 ? 3 : 4;
  const local = t - [0.6, 2.4, 4.0, 5.6, 7.2][mode];
  const amp = 200 * expOut(seg(local, 0, 0.5));

  const N = 420;
  const pts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    let p: [number, number];
    if (mode === 0 || mode === 2) p = wave(mode, s, t, amp);
    else if (mode === 1) {
      const th = s * Math.PI * 2;
      const ph = local * 1.4;
      p = [Math.sin(3 * th + ph) * 320 * expOut(seg(local, 0, 0.4)), Math.sin(2 * th) * 300 * expOut(seg(local, 0, 0.4))];
    } else if (mode === 3) {
      const th = s * Math.PI * 2 * 6;
      const shrink = 1 - expInOut(seg(local, 0.4, 1.1));
      const r = 320 * (0.25 + 0.75 * (1 - s)) * shrink + 6;
      p = [Math.cos(th + local * 4) * r, Math.sin(th + local * 4) * r];
    } else p = [0, 0];
    pts.push(`${p[0].toFixed(1)},${p[1].toFixed(1)}`);
  }
  const bloom = expOut(seg(t, 7.3, 0.6));
  const flicker = 0.9 + 0.1 * Math.sin(t * 60) * Math.sin(t * 13);
  const roleP = c01((t - 8.1) / 0.6);
  const label = mode < 3 ? `CH1 · ${services[mode].toUpperCase()}` : mode === 3 ? "XY MODE" : "";
  const knob = (k: number) => [0, 60, 150, 240, 300][mode] + k * 40;

  return (
    <AbsoluteFill style={{ background: "#141412", overflow: "hidden", fontFamily: ff }}>
      {/* bezel */}
      <div style={{ position: "absolute", left: 960 - SW / 2 - 40, top: 540 - SH / 2 - 40, width: SW + 360, height: SH + 80, borderRadius: 36, background: "linear-gradient(180deg, #2a2a26, #1b1b18)", boxShadow: "inset 0 2px 0 rgba(255,255,255,0.06)" }} />
      {/* knobs */}
      {[0, 1, 2].map((k) => (
        <div key={k} style={{ position: "absolute", left: 960 + SW / 2 + 70, top: 240 + k * 230, width: 150, height: 150, borderRadius: 99, background: "radial-gradient(circle at 35% 30%, #4a4a44, #222)", transform: `rotate(${knob(k)}deg)`, boxShadow: "0 6px 14px rgba(0,0,0,0.5)" }}>
          <div style={{ position: "absolute", left: 71, top: 12, width: 8, height: 40, borderRadius: 4, background: beam }} />
          <div style={{ position: "absolute", left: -20, right: -20, top: 160, textAlign: "center", fontFamily: MONO, fontSize: 18, color: "rgba(255,255,255,0.4)", transform: `rotate(${-knob(k)}deg)` }}>{["TIME/DIV", "VOLTS", "MODE"][k]}</div>
        </div>
      ))}
      {/* screen */}
      <div style={{ position: "absolute", left: 960 - SW / 2 + 20, top: 540 - SH / 2, width: SW - 40, height: SH, borderRadius: 40, overflow: "hidden", background: "radial-gradient(ellipse at 50% 45%, #0f1a12, #050806 75%)", boxShadow: "inset 0 0 80px rgba(0,0,0,0.9)" }}>
        <svg width={SW - 40} height={SH} viewBox={`${-(SW - 40) / 2} ${-SH / 2} ${SW - 40} ${SH}`} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="osc-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="7" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* graticule */}
          <g opacity={0.22 * powerV} stroke={beam} strokeWidth={1.5}>
            {Array.from({ length: DIVX + 1 }).map((_, i) => (
              <line key={`v${i}`} x1={-SW * 0.46 + (i * SW * 0.92) / DIVX} x2={-SW * 0.46 + (i * SW * 0.92) / DIVX} y1={-SH * 0.44} y2={SH * 0.44} strokeDasharray={i === DIVX / 2 ? undefined : "2 10"} />
            ))}
            {Array.from({ length: DIVY + 1 }).map((_, j) => (
              <line key={`h${j}`} y1={-SH * 0.44 + (j * SH * 0.88) / DIVY} y2={-SH * 0.44 + (j * SH * 0.88) / DIVY} x1={-SW * 0.46} x2={SW * 0.46} strokeDasharray={j === DIVY / 2 ? undefined : "2 10"} />
            ))}
          </g>
          {/* power-on line */}
          {t < 0.7 && <rect x={(-SW / 2) * powerH} y={-3 - powerV * 0} width={SW * powerH} height={6} fill={beam} filter="url(#osc-glow)" opacity={1 - c01((t - 0.55) / 0.15)} />}
          {t >= 0.6 && mode < 4 && <polyline points={pts.join(" ")} fill="none" stroke={beam} strokeWidth={4} strokeLinejoin="round" filter="url(#osc-glow)" opacity={flicker} />}
          {mode === 3 && local > 1.3 && <circle r={10 + 40 * c01((local - 1.3) / 0.3)} fill={beam} filter="url(#osc-glow)" opacity={1 - c01((local - 1.5) / 0.2)} />}
          {mode === 4 && (
            <g filter="url(#osc-glow)" opacity={flicker}>
              <text y={30} textAnchor="middle" fontFamily={ff} fontSize={fit(name, SW * 0.8, 200, 800) * lerp(0.4, 1, bloom)} fontWeight={800} fill="none" stroke={beam} strokeWidth={3} letterSpacing="-0.02em">
                {name}
              </text>
              <text y={130} textAnchor="middle" fontFamily={MONO} fontSize={34} fill={beam} opacity={roleP}>
                {c.role || "Sound · Motion · Code studio"}
              </text>
            </g>
          )}
          <text x={-SW * 0.44} y={SH * 0.42} fontFamily={MONO} fontSize={24} fill={beam} opacity={0.7 * powerV}>
            {label}
          </text>
          <text x={SW * 0.3} y={-SH * 0.38} fontFamily={MONO} fontSize={22} fill={beam} opacity={0.55 * powerV}>
            {mode === 1 ? "3:2" : "500 µs/div"}
          </text>
        </svg>
        {/* scanlines + curvature */}
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 2px, transparent 2px 5px)" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: 40, boxShadow: "inset 0 0 120px rgba(0,0,0,0.7)" }} />
        <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: Math.max(0, 0.3 - t * 1.5) * (t > 0.1 ? 1 : 0) }} />
      </div>
      <Track src="tracks/oscilloscope-studio.wav" on={audio} />
    </AbsoluteFill>
  );
}
