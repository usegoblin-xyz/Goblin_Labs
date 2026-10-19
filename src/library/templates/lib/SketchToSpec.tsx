import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Paint, Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { title: string; button: string; tagline: string };

// A design pad: a pen scribbles a wireframe, a sweep turns every scribble into
// a clean component, redlines measure it, then the pad shrinks and the design
// reflows onto desktop, tablet and phone.
const PAD_W = 900;
const PAD_H = 780;

// Wobbly hand-drawn rectangle (closed), jitter seeded per shape.
function roughRect(x: number, y: number, w: number, h: number, seed: number) {
  const j = (k: number) => (hash(seed, k) - 0.5) * 10;
  return `M${x + j(1)},${y + j(2)} C${x + w * 0.4},${y + j(3)} ${x + w * 0.7},${y + j(4)} ${x + w + j(5)},${y + j(6)} C${x + w + j(7)},${y + h * 0.4} ${x + w + j(8)},${y + h * 0.7} ${x + w + j(9)},${y + h + j(10)} C${x + w * 0.6},${y + h + j(11)} ${x + w * 0.3},${y + h + j(12)} ${x + j(13)},${y + h + j(14)} C${x + j(15)},${y + h * 0.6} ${x + j(16)},${y + h * 0.3} ${x + j(17) + 4},${y + j(18) - 4}`;
}
function roughCircle(cx: number, cy: number, r: number, seed: number) {
  const pts = Array.from({ length: 26 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2 - 0.3;
    const rr = r + (hash(seed, i) - 0.5) * 8;
    return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
  });
  return `M${pts.join(" L")}`;
}
function squiggle(x: number, y: number, w: number, seed: number) {
  let d = `M${x},${y}`;
  for (let i = 1; i <= 8; i++) d += ` Q${x + (w / 8) * (i - 0.5)},${y + (i % 2 ? -10 : 10) + (hash(seed, i) - 0.5) * 6} ${x + (w / 8) * i},${y}`;
  return d;
}

export default function SketchToSpec({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const title = c.title || "Weekend in Lisbon";
  const btn = c.button || "Book now";

  const padIn = spring(t - 0.05, 14, 0.85);
  const shrink = expInOut(seg(t, 5.6, 0.8));
  const px = lerp(960, 960, shrink);
  const py = lerp(540, 470, shrink);
  const ps = lerp(1, 0.0, shrink);
  const x0 = -PAD_W / 2;
  const y0 = -PAD_H / 2;

  // element boxes in pad coordinates
  const E = {
    head: [x0 + 60, y0 + 60, PAD_W - 120, 70],
    avatar: [x0 + 120, y0 + 220, 50],
    img: [x0 + 60, y0 + 300, PAD_W - 120, 260],
    btn: [x0 + 60, y0 + 610, 280, 80],
  };
  const sk = (a: number, d = 0.4) => expOut(seg(t, a, d));
  const sweep = c01((t - 2.8) / 0.8); // 0..1 top to bottom
  const clean = (y: number) => spring(t - 2.8 - ((y - y0) / PAD_H) * 0.8, 16, 0.75);
  const red = (i: number) => expOut(seg(t, 3.9 + i * 0.3, 0.35));
  const dev = (i: number) => spring(t - 6.0 - i * 0.2, 14, 0.78);
  const devOut = expInOut(seg(t, 7.6, 0.5));
  const nameP = c01((t - 8.0) / 0.6);
  const tagP = c01((t - 8.4) / 0.6);
  const ink = "#2b2b2b";

  const design = (w: number, h: number, scale: number) => (
    <div style={{ position: "absolute", inset: 0, background: "#fff", overflow: "hidden", fontFamily: ff }}>
      <div style={{ height: 56 * scale, background: pal.p, margin: 14 * scale, borderRadius: 12 * scale }} />
      <div style={{ display: "flex", gap: 14 * scale, alignItems: "center", margin: `0 ${14 * scale}px` }}>
        <div style={{ width: 54 * scale, height: 54 * scale, borderRadius: 99, background: pal.a }} />
        <div style={{ fontSize: 26 * scale, fontWeight: 800, color: "#111" }}>{title}</div>
      </div>
      <div style={{ height: h * 0.34, margin: 14 * scale, borderRadius: 14 * scale, background: `linear-gradient(135deg, ${pal.p}, ${pal.a})` }} />
      <div style={{ display: "inline-block", margin: `0 ${14 * scale}px`, padding: `${12 * scale}px ${26 * scale}px`, borderRadius: 99, background: "#111", color: "#fff", fontSize: 20 * scale, fontWeight: 700 }}>{btn}</div>
    </div>
  );

  return (
    <AbsoluteFill style={{ background: pal.dark ? "#16171a" : "#eceae5", overflow: "hidden", fontFamily: ff }}>
      {/* the pad */}
      {ps > 0.01 && (
        <div style={{ position: "absolute", left: px, top: py, width: 0, height: 0, transform: `translateY(${(1 - padIn) * 900}px) scale(${ps})` }}>
          <div style={{ position: "absolute", left: x0, top: y0, width: PAD_W, height: PAD_H, borderRadius: 26, background: "#fbfaf6", boxShadow: "0 30px 80px rgba(0,0,0,0.3)", backgroundImage: "repeating-linear-gradient(0deg, transparent 0 39px, rgba(60,90,160,0.12) 39px 40px)" }} />
          {/* clean components (under the sketch, revealed by the sweep) */}
          <div style={{ position: "absolute", left: E.head[0], top: E.head[1], width: E.head[2], height: E.head[3], borderRadius: 14, background: pal.p, transform: `scale(${clean(E.head[1])})` }} />
          <div style={{ position: "absolute", left: E.avatar[0] - 50, top: E.avatar[1] - 50, width: 100, height: 100, borderRadius: 99, background: pal.a, transform: `scale(${clean(E.avatar[1])})` }} />
          <div style={{ position: "absolute", left: x0 + 200, top: y0 + 180, fontSize: 40, fontWeight: 800, color: "#111", opacity: clean(y0 + 200), whiteSpace: "nowrap" }}>{title}</div>
          <div style={{ position: "absolute", left: x0 + 200, top: y0 + 236, fontSize: 24, color: "#666", opacity: clean(y0 + 245) }}>3 nights · from $420</div>
          <div style={{ position: "absolute", left: E.img[0], top: E.img[1], width: E.img[2], height: E.img[3], borderRadius: 18, background: `linear-gradient(135deg, ${pal.p}, ${pal.a})`, transform: `scale(${clean(E.img[1])})` }} />
          <div style={{ position: "absolute", left: E.btn[0], top: E.btn[1], width: E.btn[2], height: E.btn[3], borderRadius: 99, background: "#111", color: "#fff", fontSize: 30, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${clean(E.btn[1])})` }}>{btn}</div>
          {/* the sketch, erased by the sweep */}
          <Svg w={PAD_W} h={PAD_H} style={{ left: x0, top: y0, clipPath: `inset(${sweep * 100}% 0 0 0)` }}>
            <g transform={`translate(${-x0} ${-y0})`}>
              <Paint d={roughRect(E.head[0], E.head[1], E.head[2], E.head[3], 1)} color={ink} width={5} p={sk(0.5)} />
              <Paint d={roughCircle(E.avatar[0], E.avatar[1], 50, 2)} color={ink} width={5} p={sk(0.9, 0.3)} />
              <Paint d={squiggle(x0 + 200, y0 + 205, 400, 3)} color={ink} width={5} p={sk(1.15, 0.3)} />
              <Paint d={squiggle(x0 + 200, y0 + 250, 260, 4)} color={ink} width={4} p={sk(1.4, 0.25)} />
              <Paint d={roughRect(E.img[0], E.img[1], E.img[2], E.img[3], 5)} color={ink} width={5} p={sk(1.6, 0.35)} />
              <Paint d={`M${E.img[0]},${E.img[1]} L${E.img[0] + E.img[2]},${E.img[1] + E.img[3]} M${E.img[0] + E.img[2]},${E.img[1]} L${E.img[0]},${E.img[1] + E.img[3]}`} color={ink} width={4} p={sk(1.95, 0.3)} />
              <Paint d={roughRect(E.btn[0], E.btn[1], E.btn[2], E.btn[3], 6)} color={ink} width={5} p={sk(2.25, 0.25)} />
              <Paint d={squiggle(E.btn[0] + 70, E.btn[1] + 40, 140, 7)} color={ink} width={4} p={sk(2.45, 0.2)} />
            </g>
          </Svg>
          {/* sweep line */}
          {sweep > 0 && sweep < 1 && <div style={{ position: "absolute", left: x0, top: y0 + sweep * PAD_H - 3, width: PAD_W, height: 6, background: pal.p, boxShadow: `0 0 20px ${pal.p}` }} />}
          {/* redlines */}
          <Svg w={PAD_W + 400} h={PAD_H + 200} style={{ left: x0 - 200, top: y0 - 100 }}>
            <g transform={`translate(${-x0 + 200} ${-y0 + 100})`} fontFamily={ff} fontSize={22} fontWeight={700}>
              {[
                { d: `M${E.head[0]},${E.head[1] - 22} L${E.head[0] + E.head[2]},${E.head[1] - 22}`, l: `${E.head[2]}`, x: 0, y: E.head[1] - 34 },
                { d: `M${E.img[0] - 24},${E.img[1]} L${E.img[0] - 24},${E.img[1] + E.img[3]}`, l: `${E.img[3]}`, x: E.img[0] - 60, y: E.img[1] + E.img[3] / 2 },
                { d: `M${E.btn[0] + E.btn[2] + 18},${E.btn[1] + 40} L${E.btn[0] + E.btn[2] + 120},${E.btn[1] + 40}`, l: "r 40", x: E.btn[0] + E.btn[2] + 170, y: E.btn[1] + 48 },
                { d: `M${E.img[0]},${E.img[1] + E.img[3] + 16} L${E.img[0]},${E.btn[1] - 6}`, l: "24", x: E.img[0] + 30, y: E.img[1] + E.img[3] + 40 },
              ].map((r, i) => (
                <g key={i} opacity={c01(red(i) * 2)}>
                  <Paint d={r.d} color="#ff3b5c" width={3} p={red(i)} />
                  <text x={r.x} y={r.y} fill="#ff3b5c" textAnchor="middle" opacity={red(i)}>
                    {r.l}
                  </text>
                </g>
              ))}
            </g>
          </Svg>
        </div>
      )}
      {/* devices */}
      {[
        { w: 760, h: 470, x: 650, label: "Desktop" },
        { w: 380, h: 500, x: 1260, label: "Tablet" },
        { w: 230, h: 470, x: 1620, label: "Phone" },
      ].map((d, i) => {
        const s = dev(i) * (1 - devOut);
        if (s <= 0.01) return null;
        return (
          <div key={i} style={{ position: "absolute", left: d.x - d.w / 2, top: 470 - d.h / 2, width: d.w, height: d.h, borderRadius: i === 2 ? 34 : 18, border: "10px solid #111", overflow: "hidden", transform: `scale(${s}) translateY(${devOut * -60}px)`, boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
            {design(d.w, d.h, i === 0 ? 1 : i === 1 ? 0.75 : 0.55)}
          </div>
        );
      })}
      <Svg>
        {nameP > 0 && <Txt text={name} x={960} y={520} size={fit(name, 1300, 190, 900)} weight={900} color={pal.fg} font={ff} p={nameP} tracking={-0.05} />}
        {tagP > 0 && <Txt text={c.tagline || "From scribble to spec"} x={960} y={630} size={44} weight={500} color={pal.muted} font={ff} p={tagP} mode="fade" />}
      </Svg>
      <Track src="tracks/sketch-to-spec.wav" on={audio} />
    </AbsoluteFill>
  );
}

