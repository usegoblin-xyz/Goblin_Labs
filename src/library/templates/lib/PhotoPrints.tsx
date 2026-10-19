import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Phone, Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fontOf, hash, lerp, mix, nameOf, palette, seg, spring, useT, type Pal } from "../../motion";

type C = { verb: string; tagline: string };

// From camera roll to wall: a phone grid of photos, nine get ticked, they
// lift off the screen, print out as white-bordered cards and settle into a
// gallery wall that the camera pulls back from.
function Photo({ k, pal }: { k: number; pal: Pal }) {
  const sky = [mix(pal.v, "#ffffff", 0.3), mix(pal.a, "#ffffff", 0.2), "#f2b880", "#9fc3e8", "#d7c4f0", "#bfe3c0"][k % 6];
  const ground = mix(sky, "#000000", 0.45);
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <rect width={100} height={100} fill={sky} />
      <circle cx={25 + hash(k, 1) * 50} cy={30 + hash(k, 2) * 15} r={10 + hash(k, 3) * 8} fill="#fff" opacity={0.85} />
      <path d={`M0,${65 + hash(k, 4) * 10} Q30,${45 + hash(k, 5) * 15} 55,${62} T100,${55 + hash(k, 6) * 15} L100,100 L0,100Z`} fill={ground} />
      {k % 3 === 0 && <rect x={60} y={50} width={10} height={20} fill={mix(ground, "#000", 0.3)} />}
    </svg>
  );
}

export default function PhotoPrints({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const verb = c.verb || "Print";
  const picked = [0, 2, 3, 5, 7, 8, 10, 13, 14];
  const phoneIn = expOut(seg(t, 0, 0.7));
  const lift = (i: number) => cubicInOut(c01((t - 3.0 - i * 0.12) / 1.0));
  const pull = expInOut(seg(t, 5.2, 1.4));
  const outro = expInOut(seg(t, 7.6, 0.5));
  const endP = c01((t - 8.0) / 0.8);
  // phone grid geometry in screen space
  const PX = 600;
  const PY = 560;
  const cell = 118;
  const gx = (i: number) => PX - 1.5 * cell + (i % 4) * cell + cell / 2 - 4;
  const gy = (i: number) => PY - 300 + Math.floor(i / 4) * cell + cell / 2;
  // wall layout: 3×3 on the right
  const wx = (k: number) => 1240 + (k % 3) * 250;
  const wy = (k: number) => 300 + Math.floor(k / 3) * 250;
  const camS = lerp(1, 0.72, pull);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: "1490px 550px", transform: `scale(${camS}) translateX(${pull * -260}px)`, opacity: 1 - outro }}>
        <div style={{ position: "absolute", inset: 0, opacity: 1 - pull }}>
          <Phone x={PX} y={lerp(1300, PY, phoneIn)} h={900} pal={pal}>
            <div style={{ position: "absolute", left: 10, top: 70, right: 10, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
              {Array.from({ length: 20 }, (_, i) => {
                const k = picked.indexOf(i);
                const sel = k >= 0 && t > 1.2 + k * 0.18;
                return (
                  <div key={i} style={{ position: "relative", aspectRatio: "1", overflow: "hidden", borderRadius: 4, opacity: k >= 0 && lift(k) > 0 ? 0.25 : 1 }}>
                    <Photo k={i} pal={pal} />
                    {sel && <div style={{ position: "absolute", right: 6, top: 6, width: 26, height: 26, borderRadius: 13, background: pal.v, color: pal.onV, fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${spring(t - 1.2 - k * 0.18, 20, 0.5)})` }}>✓</div>}
                  </div>
                );
              })}
            </div>
            <div style={{ position: "absolute", left: 30, right: 30, bottom: 50, height: 80, borderRadius: 40, background: t > 2.8 ? pal.v : pal.card2, color: t > 2.8 ? pal.onV : pal.fg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800, transform: `scale(${t > 2.8 && t < 3.0 ? 0.94 : 1})` }}>
              {verb} 9 photos
            </div>
          </Phone>
        </div>
        {picked.map((i, k) => {
          const p = lift(k);
          if (p <= 0) return null;
          const x = lerp(gx(i), wx(k), p);
          const y = lerp(gy(i), wy(k), p) - Math.sin(p * Math.PI) * 200;
          const s = lerp(110, 220, p);
          const border = lerp(0, 14, p);
          const rot = lerp(0, (hash(k, 9) - 0.5) * 8, p);
          return (
            <div key={k} style={{ position: "absolute", left: x - s / 2, top: y - s / 2, width: s, height: s * 1.12, background: "#fbfbf8", padding: border, paddingBottom: border * 3, boxSizing: "border-box", transform: `rotate(${rot}deg)`, boxShadow: `0 ${10 + p * 20}px ${20 + p * 30}px rgba(0,0,0,0.35)` }}>
              <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
                <Photo k={i} pal={pal} />
              </div>
            </div>
          );
        })}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Your best shots, on your wall."} x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - 8.4) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/photo-prints.wav" on={audio} />
    </AbsoluteFill>
  );
}
