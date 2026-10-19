import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fit, fontOf, hash, lerp, mix, nameOf, palette, seg, useT, type Pal } from "../../motion";

type C = { projects: string; disciplines: string; tagline: string };

// A studio showreel built from case-study cards: a 3D deck fans out, each
// card flies forward in turn and fills the frame with its project, the
// discipline tags tick past, and the deck re-stacks into the studio name.
function Cover({ k, pal }: { k: number; pal: Pal }) {
  const A = [pal.v, pal.a, pal.fg, pal.p][k % 4];
  const B = mix(pal.bg, pal.fg, 0.08);
  return (
    <svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <rect width={160} height={100} fill={k % 2 ? A : B} />
      {k % 4 === 0 && <circle cx={110} cy={50} r={34} fill={pal.bg} />}
      {k % 4 === 1 && Array.from({ length: 8 }, (_, i) => <rect key={i} x={i * 22} y={0} width={10} height={100} fill={pal.bg} opacity={0.6} transform={`skewX(-20)`} />)}
      {k % 4 === 2 && <path d="M0,100 L60,30 L100,70 L160,20 L160,100Z" fill={A} />}
      {k % 4 === 3 && Array.from({ length: 12 }, (_, i) => <circle key={i} cx={20 + (i % 6) * 24} cy={30 + Math.floor(i / 6) * 40} r={8 + hash(k, i) * 6} fill={pal.bg} opacity={0.7} />)}
    </svg>
  );
}

export default function CaseStack({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const projects = [...list(c.projects || "Northwind rebrand, Atlas app, Field notes, Bloom campaign"), "Project", "Project", "Project", "Project"].slice(0, 4);
  const disc = [...list(c.disciplines || "Brand, Product, Motion, Web"), "Design", "Design", "Design", "Design"].slice(0, 4);
  const fan = expOut(seg(t, 0.2, 0.8));
  const per = 1.5;
  const start = 1.3;
  const cur = Math.floor((t - start) / per);
  const local = t - start - cur * per;
  const restack = expInOut(seg(t, start + 4 * per - 0.4, 0.8));
  const endP = c01((t - (start + 4 * per + 0.5)) / 0.8);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff, perspective: 2000 }}>
      {projects.map((p, i) => {
        // resting place in the fanned deck
        const rx = 960 + (i - 1.5) * 120 * fan;
        const ry = 560 + Math.abs(i - 1.5) * 20 * fan;
        const rr = (i - 1.5) * 8 * fan;
        // when it's this card's turn it flies to full frame and then away
        const mine = cur === i;
        const done = cur > i || (cur >= 4);
        const fly = mine ? cubicInOut(c01(local / 0.45)) : done ? 1 : 0;
        const away = mine ? expInOut(c01((local - per + 0.35) / 0.35)) : done ? 1 : 0;
        const w = lerp(560, 1920, fly);
        const h = lerp(350, 1080, fly);
        let x = lerp(rx, 960, fly);
        let y = lerp(ry, 540, fly);
        let rot = lerp(rr, 0, fly);
        if (away > 0) {
          y = lerp(540, -800, away);
          rot = lerp(0, -12, away);
        }
        if (restack > 0) {
          x = lerp(x, 960 + (i - 1.5) * 18, restack);
          y = lerp(done ? -800 : y, 400 + (i - 1.5) * 10, restack);
          rot = lerp(rot, (i - 1.5) * 4, restack);
        }
        const fw = restack > 0 ? lerp(w, 640, restack) : w;
        const fh = restack > 0 ? lerp(h, 400, restack) : h;
        return (
          <div key={i} style={{ position: "absolute", left: x - fw / 2, top: y - fh / 2, width: fw, height: fh, borderRadius: restack > 0 ? lerp(0, 28, restack) : lerp(28, 0, fly * (1 - away)), overflow: "hidden", transform: `rotate(${rot}deg)`, zIndex: mine ? 10 : i, boxShadow: "0 30px 80px rgba(0,0,0,0.35)", opacity: 1 }}>
            <Cover k={i} pal={pal} />
            <div style={{ position: "absolute", left: lerp(30, 120, fly), bottom: lerp(26, 110, fly), fontSize: lerp(30, fit(p, 1500, 140, 800, -0.04, ff), fly), fontWeight: 800, color: i % 2 ? pal.bg : pal.fg, letterSpacing: "-0.03em", whiteSpace: "nowrap", opacity: restack > 0 ? 1 - restack : 1 }}>{p}</div>
            {mine && fly > 0.6 && (
              <div style={{ position: "absolute", left: 120, top: 100, padding: "12px 26px", borderRadius: 99, background: pal.bg, color: pal.fg, fontSize: 32, fontWeight: 700, opacity: c01((local - 0.4) * 4) }}>
                {String(i + 1).padStart(2, "0")} · {disc[i]}
              </div>
            )}
          </div>
        );
      })}
      {endP > 0 && (
        <Svg style={{ zIndex: 20 }}>
          <Txt text={nameOf(b)} x={960} y={800} size={150} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.05} />
          <Txt text={c.tagline || disc.join(" · ")} x={960} y={890} size={42} weight={600} color={pal.muted} font={ff} p={c01((t - (start + 4 * per + 0.9)) / 0.6)} mode="fade" opacity={0.8} />
        </Svg>
      )}
      <Track src="tracks/case-stack.wav" on={audio} />
    </AbsoluteFill>
  );
}
