import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Mark, Phone, Svg, Track, Txt, c01, expOut, fontOf, lerp, nameOf, palette, seg, spring, useT, type Pal } from "../../motion";

type C = { features: string; tagline: string };

// An app reel hosted by an original mascot: a round little character hops
// from phone to phone, each screen lighting up a feature as it lands, then
// it sits on the brand mark and waves.
export function Blob({ x, y, s = 1, squash = 0, look = 0, blink = 0, wave = 0, pal }: { x: number; y: number; s?: number; squash?: number; look?: number; blink?: number; wave?: number; pal: Pal }) {
  const sx = 1 + squash * 0.25;
  const sy = 1 - squash * 0.25;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={6} rx={70} ry={14} fill="#000" opacity={0.18} />
      <g transform={`scale(${sx} ${sy}) translate(0 ${-66})`}>
        <path d="M-70,10 C-70,-50 -40,-70 0,-70 C40,-70 70,-50 70,10 C70,60 40,66 0,66 C-40,66 -70,60 -70,10Z" fill={pal.v} />
        <ellipse cx={-26 + look * 6} cy={-8} rx={16} ry={18 * (1 - blink)} fill="#fff" />
        <ellipse cx={26 + look * 6} cy={-8} rx={16} ry={18 * (1 - blink)} fill="#fff" />
        <circle cx={-24 + look * 10} cy={-4} r={blink > 0.5 ? 0 : 8} fill="#111" />
        <circle cx={28 + look * 10} cy={-4} r={blink > 0.5 ? 0 : 8} fill="#111" />
        <path d="M-16,26 Q0,40 16,26" fill="none" stroke="#111" strokeWidth={6} strokeLinecap="round" />
        <ellipse cx={-48} cy={20} rx={10} ry={6} fill="#fff" opacity={0.25} />
        <path d={`M62,0 Q${86 + wave * 10},${-20 - wave * 30} ${80 + wave * 16},${-50 - wave * 20}`} fill="none" stroke={pal.v} strokeWidth={16} strokeLinecap="round" />
        <path d="M-62,0 Q-84,20 -78,36" fill="none" stroke={pal.v} strokeWidth={16} strokeLinecap="round" />
      </g>
      <rect x={-34} y={-6} width={22} height={12} rx={6} fill={pal.v} />
      <rect x={12} y={-6} width={22} height={12} rx={6} fill={pal.v} />
    </g>
  );
}

function Screen({ k, on, pal, t }: { k: number; on: number; pal: Pal; t: number }) {
  if (k === 0)
    return (
      <div style={{ padding: "84px 22px 0" }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, opacity: c01(on * 4 - i * 0.6), transform: `translateX(${(1 - c01(on * 4 - i * 0.6)) * 40}px)` }}>
            <div style={{ width: 44, height: 44, borderRadius: 22, background: i === 0 ? pal.v : pal.card2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ width: "70%", height: 12, borderRadius: 6, background: pal.fg, opacity: 0.8 }} />
              <div style={{ marginTop: 8, width: "45%", height: 10, borderRadius: 5, background: pal.muted }} />
            </div>
          </div>
        ))}
      </div>
    );
  if (k === 1)
    return (
      <div style={{ padding: "90px 22px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ alignSelf: i % 2 ? "flex-start" : "flex-end", width: `${55 + i * 10}%`, height: 54, borderRadius: 22, background: i % 2 ? pal.card2 : pal.v, opacity: c01(on * 4 - i * 0.7), transform: `scale(${c01(on * 4 - i * 0.7)})` }} />
        ))}
      </div>
    );
  return (
    <div style={{ padding: "90px 22px 0" }}>
      <div style={{ fontSize: 40, fontWeight: 800, color: pal.fg }}>{Math.round(on * 87)}%</div>
      <div style={{ marginTop: 20, display: "flex", alignItems: "flex-end", gap: 10, height: 200 }}>
        {[0.4, 0.6, 0.5, 0.8, 0.7, 1].map((h, i) => (
          <div key={i} style={{ flex: 1, height: `${h * 100 * c01(on * 3 - i * 0.2)}%`, borderRadius: 8, background: i === 5 ? pal.v : pal.card2 }} />
        ))}
      </div>
      <div style={{ opacity: 0 }}>{t}</div>
    </div>
  );
}

export default function MascotReel({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const feats = [...list(c.features || "Your people, Instant replies, Real progress"), "Feature", "Feature", "Feature"].slice(0, 3);
  const PX = [480, 960, 1440];
  const PY = 520;
  const top = PY - 330; // phone top edge, where the mascot lands
  const lands = [1.2, 3.2, 5.2];
  const finalLand = 7.6;
  // mascot path: hops between waypoints, holding on each phone
  const WP: [number, number, number][] = [[0.3, -120, top + 200], [lands[0], PX[0], top], [2.3, PX[0], top], [lands[1], PX[1], top], [4.3, PX[1], top], [lands[2], PX[2], top], [6.7, PX[2], top], [finalLand, 960, 760]];
  let mx = WP[0][1];
  let my = WP[0][2];
  for (let i = 0; i < WP.length - 1; i++) {
    const [t0, x0, y0] = WP[i];
    const [t1, x1, y1] = WP[i + 1];
    if (t >= t0 && t < t1) {
      const u = (t - t0) / (t1 - t0);
      mx = lerp(x0, x1, u);
      my = lerp(y0, y1, u) - (x0 !== x1 ? 240 * 4 * u * (1 - u) : 0);
    }
  }
  if (t >= finalLand) {
    mx = 960;
    my = 760;
  }
  const squash = Math.max(0, ...[...lands, finalLand].map((L) => (t >= L ? 1 - (t - L) / 0.16 : 0))) * 0.8;
  const blink = Math.abs(Math.sin(t * 1.3)) > 0.985 ? 1 : 0;
  const wave = t > finalLand + 0.3 ? Math.sin((t - finalLand) * 10) * 0.5 + 0.5 : 0;
  const phonesOut = expOut(seg(t, 7.0, 0.6));
  const endP = c01((t - 8.0) / 0.8);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      {PX.map((x, i) => {
        const pop = spring(t - 0.1 - i * 0.12, 16, 0.7);
        const on = c01((t - lands[i]) / 0.8);
        return (
          <div key={i} style={{ position: "absolute", inset: 0, opacity: 1 - phonesOut, transform: `translateY(${phonesOut * 200 + (1 - pop) * 400}px)` }}>
            <Phone x={x} y={PY} h={660} pal={pal}>
              <Screen k={i} on={on} pal={pal} t={t} />
            </Phone>
            <div style={{ position: "absolute", left: x, top: 900, transform: "translateX(-50%)", fontSize: 38, fontWeight: 700, color: on > 0 ? pal.fg : pal.faint, whiteSpace: "nowrap", letterSpacing: "-0.02em" }}>{feats[i]}</div>
          </div>
        );
      })}
      {t > finalLand - 0.5 && <Mark x={960} y={760 + 70} size={150} b={b} pal={pal} letter={0} s={spring(t - (finalLand - 0.5), 16, 0.6)} />}
      <Svg>
        <Blob x={mx} y={my} s={1.25} squash={squash} look={t < finalLand ? 1 : Math.sin(t * 2) * 0.5} blink={blink} wave={wave} pal={pal} />
        {endP > 0 && (
          <>
            <Txt text={nameOf(b)} x={960} y={330} size={160} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
            <Txt text={c.tagline || "Your new favorite app."} x={960} y={430} size={50} weight={500} color={pal.muted} font={ff} p={c01((t - 8.4) / 0.6)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/mascot-reel.wav" on={audio} />
    </AbsoluteFill>
  );
}
