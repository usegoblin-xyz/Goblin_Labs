import { AbsoluteFill, Img, staticFile } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Box, Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fontOf, kf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { adjustments: string; tagline: string };

// A photo-editing app promo: a portrait sits under a before/after handle,
// adjustment sliders slide into place one by one and the "after" side picks
// up each change live, then the handle sweeps across for the full reveal.
export default function RetouchSlider({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const adj = [...list(c.adjustments || "Light, Contrast, Warmth, Clarity"), "Light", "Contrast", "Warmth", "Clarity"].slice(0, 4);
  const at = [1.4, 2.4, 3.4, 4.4];
  const v = at.map((a) => expInOut(seg(t, a, 0.7)));
  const handle = kf(t, [[0.6, 0.5], [5.4, 0.5], [6.2, 1.0], [6.8, 1.0]], cubicInOut);
  const outro = expInOut(seg(t, 7.6, 0.5));
  const endP = c01((t - 8.0) / 0.8);
  const PX = 700;
  const PY = 540;
  const PW = 760;
  const PH = 900;
  const filterAfter = `brightness(${1 + v[0] * 0.18}) contrast(${1 + v[1] * 0.35}) sepia(${v[2] * 0.35}) saturate(${1 + v[2] * 0.8}) drop-shadow(0 0 0 transparent)`;
  const photo = (filter: string) => (
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg, ${pal.card2}, ${pal.card})` }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 70% 25%, ${pal.v}55, transparent 55%)`, filter }} />
      <Img src={staticFile("editorial-ad/head-aphrodite.webp")} style={{ position: "absolute", left: "50%", bottom: -40, height: "96%", transform: "translateX(-50%)", filter }} />
    </div>
  );

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <Box x={PX} y={PY} w={PW} h={PH} r={30} style={{ overflow: "hidden", transform: `scale(${lerp(0.92, 1, expOut(seg(t, 0, 0.7)))})`, boxShadow: "0 40px 90px rgba(0,0,0,0.35)" }}>
          {photo("grayscale(0.35) brightness(0.9) contrast(0.9)")}
          <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 0 ${handle * 100}%)` }}>{photo(filterAfter)}</div>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: `${handle * 100}%`, width: 4, background: "#fff", transform: "translateX(-2px)" }} />
          <div style={{ position: "absolute", top: "50%", left: `${handle * 100}%`, width: 64, height: 64, borderRadius: 32, background: "#fff", transform: "translate(-50%, -50%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#111", fontSize: 28, fontWeight: 800 }}>↔</div>
          <div style={{ position: "absolute", left: 24, top: 24, padding: "8px 16px", borderRadius: 99, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 22, fontWeight: 700, opacity: 1 - c01((t - 5.4) * 3) }}>Before</div>
          <div style={{ position: "absolute", right: 24, top: 24, padding: "8px 16px", borderRadius: 99, background: pal.v, color: pal.onV, fontSize: 22, fontWeight: 700 }}>After</div>
        </Box>
        {/* adjustment panel */}
        {adj.map((name, i) => {
          const p = spring(t - 0.6 - i * 0.12, 16, 0.7);
          const y = 300 + i * 150;
          return (
            <div key={i} style={{ position: "absolute", left: 1260, top: y, width: 520, transform: `translateX(${(1 - p) * 200}px)`, opacity: c01(p * 2) }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 32, fontWeight: 600, color: v[i] > 0 ? pal.fg : pal.muted }}>
                <span>{name}</span>
                <span style={{ fontVariantNumeric: "tabular-nums", color: pal.v }}>+{Math.round(v[i] * [18, 35, 22, 40][i])}</span>
              </div>
              <div style={{ position: "relative", marginTop: 18, height: 8, borderRadius: 4, background: pal.card2 }}>
                <div style={{ position: "absolute", left: "50%", height: 8, width: `${v[i] * 40}%`, borderRadius: 4, background: pal.v }} />
                <div style={{ position: "absolute", top: -14, left: `${50 + v[i] * 40}%`, width: 36, height: 36, borderRadius: 18, background: pal.fg, transform: "translateX(-50%)", boxShadow: "0 6px 16px rgba(0,0,0,0.35)" }} />
              </div>
            </div>
          );
        })}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Edits that look like you."} x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - 8.4) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/retouch-slider.wav" on={audio} />
    </AbsoluteFill>
  );
}
