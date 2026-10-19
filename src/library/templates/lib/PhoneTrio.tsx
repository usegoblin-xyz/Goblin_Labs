import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Phone, Svg, Track, Txt, c01, countStat, cubicInOut, expInOut, expOut, fit, fontOf, lerp, nameOf, palette, seg, spring, useT, type Pal } from "../../motion";

type C = { balance: string; captions: string; tagline: string };

// Three phones in a 3D staircase: the camera orbits as each one takes the
// front, showing balance, a portfolio chart and a card wallet, with a
// kinetic caption for each. Ends with all three side by side.
function Screen({ k, p, pal, balance, ff }: { k: number; p: number; pal: Pal; balance: string; ff: string }) {
  if (k === 0)
    return (
      <div style={{ padding: "90px 26px", fontFamily: ff }}>
        <div style={{ fontSize: 24, color: pal.muted }}>Total balance</div>
        <div style={{ fontSize: 58, fontWeight: 800, color: pal.fg, letterSpacing: "-0.03em", marginTop: 6 }}>{countStat(balance, cubicInOut(p))}</div>
        <div style={{ marginTop: 30, display: "flex", gap: 12 }}>
          {["Send", "Add", "Swap"].map((s, i) => (
            <div key={s} style={{ flex: 1, height: 64, borderRadius: 18, background: i === 0 ? pal.v : pal.card2, color: i === 0 ? pal.onV : pal.fg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700 }}>{s}</div>
          ))}
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ marginTop: 20, height: 70, borderRadius: 16, background: pal.card, opacity: c01(p * 3 - i * 0.4) }} />
        ))}
      </div>
    );
  if (k === 1) {
    const pts = Array.from({ length: 24 }, (_, i) => `${20 + i * 15},${260 - (i / 23) * 160 * p - Math.sin(i * 1.3) * 18}`).join(" ");
    return (
      <div style={{ padding: "90px 26px", fontFamily: ff }}>
        <div style={{ fontSize: 24, color: pal.muted }}>Portfolio</div>
        <div style={{ fontSize: 50, fontWeight: 800, color: pal.v }}>+{(p * 24.6).toFixed(1)}%</div>
        <svg width={380} height={300} style={{ marginTop: 20 }}>
          <polyline points={pts} fill="none" stroke={pal.v} strokeWidth={6} strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  return (
    <div style={{ padding: "100px 26px", fontFamily: ff, position: "relative", height: "100%" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: "absolute", left: 26, right: 26, top: 100 + i * lerp(150, 60, 1 - p), height: 210, borderRadius: 24, background: [pal.v, pal.a, pal.fg][i], boxShadow: "0 10px 30px rgba(0,0,0,0.3)", padding: 24, boxSizing: "border-box", color: [pal.onV, pal.onA, pal.bg][i], fontSize: 22, fontWeight: 700 }}>
          •••• {4021 + i * 1111}
        </div>
      ))}
    </div>
  );
}

export default function PhoneTrio({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const caps = [...list(c.captions || "See everything., Watch it grow., Spend anywhere."), "One.", "Two.", "Three."].slice(0, 3);
  const per = 2.2;
  const focus = Math.min(2, Math.max(0, (t - 0.6) / per));
  const k = Math.min(2, Math.floor(focus));
  const smooth = Math.min(2, Math.floor(focus) + cubicInOut(c01(((focus % 1) - 0.82) / 0.18)));
  const lineup = expInOut(seg(t, 7.3, 0.9));
  const endP = c01((t - 8.0) / 0.8);
  const local = t - 0.6 - k * per;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff, perspective: 2200 }}>
      {[0, 1, 2].map((i) => {
        const d = i - Math.min(2, smooth);
        // orbit pose
        const ox = 1180 + Math.abs(d) * 330;
        const oz = -Math.abs(d) * 420;
        const ry = -Math.abs(d) * 26;
        // line-up pose
        const lx = 960 + (i - 1) * 470;
        const x = lerp(ox, lx, lineup);
        const z = lerp(oz, -300, lineup);
        const rotY = lerp(ry, 0, lineup);
        const appear = spring(t - 0.1 - i * 0.1, 15, 0.7);
        return (
          <div key={i} style={{ position: "absolute", inset: 0, transform: `translate3d(${x - 960}px, ${(1 - appear) * 600}px, ${z}px) rotateY(${rotY}deg)`, zIndex: 10 - Math.round(Math.abs(d) * 2) }}>
            <Phone x={960} y={560} h={880} pal={pal}>
              <Screen k={i} p={c01((t - 0.6 - i * per) / 1.2)} pal={pal} balance={c.balance || "$12,480"} ff={ff} />
            </Phone>
          </div>
        );
      })}
      <Svg style={{ zIndex: 20 }}>
        {t < 7.3 && <Txt key={k} text={caps[k]} x={440} y={560} size={fit(caps[k], 700, 110, 800, -0.04, ff)} weight={800} color={pal.fg} font={ff} p={c01((local - 0.1) / 0.6)} out={c01((local - per + 0.35) / 0.3)} tracking={-0.04} />}
        {endP > 0 && (
          <>
            <Txt text={nameOf(b)} x={960} y={110} size={90} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
            <Txt text={c.tagline || "Money, all in one place."} x={960} y={1050} size={40} weight={600} color={pal.v} font={ff} p={c01((t - 8.4) / 0.6)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/phone-trio.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _e = expOut;
