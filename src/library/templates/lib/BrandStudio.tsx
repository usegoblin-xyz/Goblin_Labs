import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { SERIF, Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fit, fontOf, lerp, mix, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { clients: string; services: string; tagline: string };

// A branding studio's reel: invented marks morph from one to the next on a
// grid, palettes sweep in as swatches, a type specimen breathes between
// weights, the work lands on mockups (a card, a tote, a sign), then the
// studio signs off.
function MarkShape({ k, size, col, on }: { k: number; size: number; col: string; on: string }) {
  const s = size;
  switch (k % 6) {
    case 0:
      return <svg width={s} height={s} viewBox="0 0 100 100"><circle cx={50} cy={50} r={46} fill={col} /><circle cx={64} cy={36} r={16} fill={on} /></svg>;
    case 1:
      return <svg width={s} height={s} viewBox="0 0 100 100"><path d="M8,92 L50,8 L92,92Z" fill={col} /><path d="M36,92 L50,62 L64,92Z" fill={on} /></svg>;
    case 2:
      return <svg width={s} height={s} viewBox="0 0 100 100"><rect x={6} y={6} width={88} height={88} rx={26} fill={col} /><rect x={30} y={30} width={40} height={40} rx={20} fill={on} /></svg>;
    case 3:
      return <svg width={s} height={s} viewBox="0 0 100 100"><path d="M50,4 A46,46 0 0,1 50,96 A23,23 0 0,1 50,50 A23,23 0 0,0 50,4Z" fill={col} /></svg>;
    case 4:
      return <svg width={s} height={s} viewBox="0 0 100 100">{[0, 1, 2].map((i) => <rect key={i} x={8 + i * 30} y={8 + i * 12} width={24} height={84 - i * 24} rx={12} fill={col} />)}</svg>;
    default:
      return <svg width={s} height={s} viewBox="0 0 100 100"><path d="M50,6 L60,40 L94,50 L60,60 L50,94 L40,60 L6,50 L40,40Z" fill={col} /></svg>;
  }
}

export default function BrandStudio({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const clients = [...list(c.clients || "Fern, Orbit, Kiln, Halo, Tide, Nova"), "Brand", "Brand", "Brand", "Brand", "Brand", "Brand"].slice(0, 6);
  const services = [...list(c.services || "Identity, Type, Color, Systems"), "Design"].slice(0, 4);
  const s1 = t < 3.0; // marks grid
  const s2 = t >= 3.0 && t < 5.0; // palettes
  const s3 = t >= 5.0 && t < 7.0; // type specimen
  const s4 = t >= 7.0 && t < 9.2; // mockups
  const endP = c01((t - 9.4) / 0.8);
  const swatches = [
    [pal.v, pal.a, pal.fg, pal.card2],
    ["#1f3b2d", "#e9c46a", "#f4f1de", "#e76f51"],
    ["#22223b", "#9a8c98", "#f2e9e4", "#c9ada7"],
  ];
  const weight = Math.round(lerp(200, 900, (Math.sin(t * 2.2) + 1) / 2));

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      {s1 &&
        clients.map((cl, i) => {
          const x = 420 + (i % 3) * 540;
          const y = 330 + Math.floor(i / 3) * 420;
          const pop = spring(t - 0.15 - i * 0.12, 16, 0.6);
          const morph = Math.floor(t * 1.6 + i) % 6;
          const col = [pal.v, pal.a, pal.fg][i % 3];
          return (
            <div key={i} style={{ position: "absolute", left: x - 110, top: y - 150, width: 220, textAlign: "center", transform: `scale(${pop})`, opacity: 1 - c01((t - 2.7) * 4) }}>
              <MarkShape k={morph} size={220} col={col} on={pal.bg} />
              <div style={{ marginTop: 20, fontSize: 40, fontWeight: 800, color: pal.fg, letterSpacing: "-0.02em" }}>{cl}</div>
            </div>
          );
        })}
      {s2 &&
        swatches.map((row, r) =>
          row.map((col, k) => {
            const p = expOut(seg(t, 3.0 + r * 0.25 + k * 0.08, 0.6));
            return (
              <div key={`${r}-${k}`} style={{ position: "absolute", left: 160 + k * 410, top: 150 + r * 270, width: 380 * p, height: 230, borderRadius: 26, background: col, boxShadow: `inset 0 0 0 2px ${pal.line}`, opacity: 1 - c01((t - 4.75) * 4) }}>
                <div style={{ position: "absolute", left: 24, bottom: 20, fontFamily: "monospace", fontSize: 22, color: mix(col, "#000000", 0.5) === col ? "#fff" : "rgba(127,127,127,0.9)" }}>{col.startsWith("#") ? col.toUpperCase() : ""}</div>
              </div>
            );
          }),
        )}
      {s3 && (
        <>
          <div style={{ position: "absolute", left: 160, top: 160, fontSize: 520, fontWeight: weight, letterSpacing: "-0.05em", color: pal.fg, lineHeight: 1, opacity: c01((t - 5.0) * 4) * (1 - c01((t - 6.75) * 4)) }}>Aa</div>
          <div style={{ position: "absolute", left: 1080, top: 260, width: 700, fontFamily: SERIF, fontSize: 72, fontStyle: "italic", color: pal.v, lineHeight: 1.1, opacity: c01((t - 5.3) * 3) * (1 - c01((t - 6.75) * 4)) }}>
            The quick brown fox, set with care.
          </div>
          <div style={{ position: "absolute", left: 1080, top: 640, fontSize: 30, color: pal.muted, fontFamily: "monospace", opacity: c01((t - 5.5) * 3) * (1 - c01((t - 6.75) * 4)) }}>wght {weight}</div>
        </>
      )}
      {s4 &&
        [0, 1, 2].map((k) => {
          const p = spring(t - 7.0 - k * 0.2, 14, 0.65);
          const x = 360 + k * 600;
          const col = [pal.v, pal.card2, pal.a][k];
          const shape = k === 0 ? { w: 420, h: 260, r: 22 } : k === 1 ? { w: 360, h: 440, r: 10 } : { w: 380, h: 380, r: 190 };
          return (
            <div key={k} style={{ position: "absolute", left: x - shape.w / 2, top: 540 - shape.h / 2, width: shape.w, height: shape.h, borderRadius: shape.r, background: col, transform: `translateY(${(1 - p) * 500}px) rotate(${(k - 1) * 5 * p}deg)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 30px 70px rgba(0,0,0,0.35)", opacity: 1 - c01((t - 9.0) * 5) }}>
              {k === 1 && <div style={{ position: "absolute", top: -60, left: "50%", width: 160, height: 120, border: `14px solid ${col}`, borderBottom: "none", borderRadius: "80px 80px 0 0", transform: "translateX(-50%)" }} />}
              <MarkShape k={k + 2} size={140} col={k === 1 ? pal.v : pal.bg} on={k === 1 ? pal.card2 : col} />
            </div>
          );
        })}
      <Svg>
        {!s1 && !s4 && endP === 0 && <Txt text={s2 ? services[1] : services[2]} x={960} y={1010} size={44} weight={700} color={pal.muted} font={ff} p={1} />}
        {s1 && <Txt text={services[0]} x={960} y={1010} size={44} weight={700} color={pal.muted} font={ff} p={c01((t - 0.3) * 2)} />}
        {s4 && <Txt text={services[3]} x={960} y={1010} size={44} weight={700} color={pal.muted} font={ff} p={c01((t - 7.2) * 2)} />}
        {endP > 0 && (
          <>
            <Txt text={nameOf(b)} x={960} y={530} size={fit(nameOf(b), 1500, 200, 800, -0.05, ff)} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.05} />
            <Txt text={c.tagline || "Brands people remember."} x={960} y={660} size={50} weight={500} color={pal.v} font={ff} p={c01((t - 9.8) / 0.6)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/brand-studio.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = [cubicInOut, expInOut];
