import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, lerp, mix, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { words: string; role: string };

// Six monoliths rise out of the floor in a row while the camera orbits.
// Each turns a quarter on the beat to show another word, the row bends into
// a ring seen from above, the ring spins and pulses, then everything slides
// into one big monolith that turns to face you with your name.
const N = 6;
const MW = 170;
const MH = 430;

export default function MonolithReel({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const words = list(c.words || "Depth, Light, Form, Space, Time, Mass");
  while (words.length < 4) words.push("Form");

  const yaw = lerp(-34, 26, expInOut(seg(t, 0.4, 3.4))) + lerp(0, 120, expInOut(seg(t, 5.2, 2.0)));
  const pitch = lerp(-14, -38, expInOut(seg(t, 3.6, 1.4))) * (1 - expInOut(seg(t, 7.2, 1.0))) + -8 * expInOut(seg(t, 7.2, 1.0));
  const toRing = expInOut(seg(t, 3.6, 1.4));
  const merge = expInOut(seg(t, 7.2, 1.0));
  const big = spring(t - 8.0, 12, 0.8);
  const roleP = c01((t - 9.0) / 0.6);

  const front = mix(pal.card2, pal.fg, 0.08);
  const sideA = mix(pal.card2, "#000000", 0.25);
  const sideB = mix(pal.card2, "#000000", 0.45);
  const top = mix(pal.card2, pal.fg, 0.2);

  const prism = (key: string | number, x: number, z: number, h: number, spin: number, faces: ReactNode[], scale = 1, colorFront = front): ReactNode => {
    const face = (st: CSSProperties, child: ReactNode, bg: string) => (
      <div style={{ position: "absolute", left: -MW / 2, top: -h, width: MW, height: h, background: bg, overflow: "hidden", ...st }}>{child}</div>
    );
    return (
      <div key={key} style={{ position: "absolute", left: 0, top: 0, transformStyle: "preserve-3d", transform: `translate3d(${x}px, 0px, ${z}px) rotateY(${spin}deg) scale3d(${scale}, ${scale}, ${scale})` }}>
        {face({ transform: `translateZ(${MW / 2}px)` }, faces[0], colorFront)}
        {face({ transform: `rotateY(90deg) translateZ(${MW / 2}px)` }, faces[1], sideA)}
        {face({ transform: `rotateY(180deg) translateZ(${MW / 2}px)` }, faces[2], sideB)}
        {face({ transform: `rotateY(-90deg) translateZ(${MW / 2}px)` }, faces[3], sideA)}
        <div style={{ position: "absolute", left: -MW / 2, top: -h - MW / 2, width: MW, height: MW, background: top, transform: "rotateX(90deg)", transformOrigin: "50% 50%" }} />
      </div>
    );
  };

  const vword = (w: string, color: string, size = 0) => (
    <svg width={MW} height={MH} viewBox={`0 0 ${MW} ${MH}`}>
      <text x={0} y={0} transform={`translate(${MW / 2 + 22} ${MH - 40}) rotate(-90)`} fontFamily={ff} fontSize={size || fit(w, MH - 80, 74, 800)} fontWeight={800} fill={color} letterSpacing="-0.02em">
        {w}
      </text>
    </svg>
  );

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 70%, ${mix(pal.bg, pal.p, 0.14)}, ${pal.bg} 60%)` }} />
      <div style={{ position: "absolute", inset: 0, perspective: 1900, perspectiveOrigin: "50% 40%" }}>
        <div style={{ position: "absolute", left: 960, top: 760, transformStyle: "preserve-3d", transform: `rotateX(${pitch}deg) rotateY(${yaw}deg)` }}>
          {/* floor ring */}
          <div style={{ position: "absolute", left: -700, top: -700, width: 1400, height: 1400, borderRadius: "50%", border: `2px solid ${pal.line}`, transform: "rotateX(90deg)", opacity: 1 - merge }} />
          {merge < 1 &&
            Array.from({ length: N }).map((_, i) => {
              const rise = expOut(seg(t, 0.1 + i * 0.12, 0.7));
              const lineX = (i - (N - 1) / 2) * 280;
              const a = (i / N) * Math.PI * 2 + t * 0.6 * c01((t - 5.0) / 0.5);
              const rx = Math.cos(a) * 520;
              const rz = Math.sin(a) * 520;
              const x = lerp(lerp(lineX, rx, toRing), 0, merge);
              const z = lerp(lerp(0, rz, toRing), 0, merge);
              let spin = 0;
              for (let k = 0; k < 6; k++) if ((k + i) % 2 === 0 || k < 2) spin += 90 * spring(t - (1.3 + k * 0.38) - i * 0.03, 16, 0.75);
              const pulse = 1 + 0.18 * Math.pow(Math.max(0, Math.cos(((t - 5.4) / 0.5) * Math.PI)), 8) * c01((t - 5.4) / 0.2) * (1 - merge);
              const h = MH * rise * pulse;
              const faces = [0, 1, 2, 3].map((k) => vword(words[(i + k) % words.length], k === 0 && i % 3 === 0 ? pal.v : pal.fg));
              return prism(i, x, z, h, spin + (toRing * -((i / N) * 360)), faces, 1, i % 3 === 0 ? mix(front, pal.p, 0.15) : front);
            })}
          {merge > 0.6 && prism("big", 0, 0, MH, -yaw + lerp(-90, 0, big), [<div key="0" />, <div key="1" />, <div key="2" />, <div key="3" />], lerp(0.6, 1.6, big), pal.p)}
        </div>
      </div>
      <Svg>
        {big > 0.3 && <Txt text={name} x={960} y={920} size={fit(name, 1500, 150, 900)} weight={900} color={pal.fg} font={ff} p={c01((big - 0.3) * 1.6)} tracking={-0.05} />}
        {roleP > 0 && <Txt text={c.role || "Built in three dimensions"} x={960} y={1000} size={38} weight={500} color={pal.muted} font={ff} p={roleP} mode="fade" />}
      </Svg>
      <Track src="tracks/monolith-reel.wav" on={audio} />
    </AbsoluteFill>
  );
}
