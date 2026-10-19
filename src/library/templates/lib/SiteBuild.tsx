import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Browser, Cursor, Phone, Svg, Track, Txt, c01, cubicInOut, expInOut, expOut, fit, fontOf, kf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { headline: string; url: string; tagline: string };

// A website builds itself: wireframe blocks drop into a browser, a color pass
// sweeps across and turns them into the real page, a cursor hits Publish, and
// the site lands on desktop and phone.
type Blk = { x: number; y: number; w: number; h: number; kind: "nav" | "hero" | "btn" | "img" | "card" | "foot" };
const BLOCKS: Blk[] = [
  { x: 40, y: 30, w: 1340, h: 60, kind: "nav" },
  { x: 40, y: 130, w: 760, h: 150, kind: "hero" },
  { x: 40, y: 310, w: 260, h: 70, kind: "btn" },
  { x: 860, y: 130, w: 520, h: 300, kind: "img" },
  { x: 40, y: 470, w: 420, h: 200, kind: "card" },
  { x: 500, y: 470, w: 420, h: 200, kind: "card" },
  { x: 960, y: 470, w: 420, h: 200, kind: "card" },
];

export default function SiteBuild({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const sweep = cubicInOut(seg(t, 3.0, 1.2)); // color pass x 0..1
  const click = seg(t, 5.2, 0.15);
  const published = t > 5.35;
  const zoomOut = expInOut(seg(t, 6.4, 0.9));
  const endP = c01((t - 8.1) / 0.7);
  const fade = expInOut(seg(t, 7.8, 0.5));
  const url = c.url || "studio.site";
  const headline = c.headline || "Make something people love";
  const BW = 1420;
  const BH = 780;
  const bx = 960 - BW / 2;
  const by = 540 - BH / 2;
  const cx = kf(t, [[4.2, 1500], [5.1, 1740], [5.6, 1760]], cubicInOut);
  const cy = kf(t, [[4.2, 900], [5.1, 205], [5.6, 210]], cubicInOut);
  const hs = fit(headline, 700, 64, 800, -0.03, ff);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${-zoomOut * 260}px) scale(${lerp(1, 0.62, zoomOut)})`, opacity: 1 - fade }}>
        <Browser x={960} y={540} w={BW} h={BH} pal={pal} url={url} s={lerp(0.9, 1, expOut(seg(t, 0, 0.6)))}>
          {BLOCKS.map((k, i) => {
            const drop = spring(t - 0.4 - i * 0.22, 15, 0.6);
            const lit = sweep * (BW + 300) - 150 > k.x + k.w / 2;
            const bg = !lit ? pal.card2 : k.kind === "nav" ? "transparent" : k.kind === "btn" ? pal.v : k.kind === "img" ? pal.v : k.kind === "hero" ? "transparent" : pal.card2;
            return (
              <div key={i} style={{ position: "absolute", left: k.x, top: k.y, width: k.w, height: k.h, borderRadius: k.kind === "btn" ? 99 : 18, background: bg, transform: `translateY(${(1 - drop) * -120}px)`, opacity: c01(drop * 2), overflow: "hidden", boxShadow: lit ? undefined : `inset 0 0 0 2px ${pal.line}` }}>
                {lit && k.kind === "nav" && (
                  <div style={{ display: "flex", alignItems: "center", height: "100%", gap: 36, fontSize: 24, color: pal.muted }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: pal.v }} />
                    <span style={{ color: pal.fg, fontWeight: 700 }}>{nameOf(b)}</span>
                    <span style={{ marginLeft: "auto" }}>Product</span>
                    <span>Pricing</span>
                    <span style={{ padding: "8px 22px", borderRadius: 99, background: published ? pal.v : pal.fg, color: published ? pal.onV : pal.bg, fontWeight: 700, transform: `scale(${1 - click * 0.1 + (published ? 0.1 * (1 - c01((t - 5.35) * 4)) : 0)})` }}>{published ? "Live ✓" : "Publish"}</span>
                  </div>
                )}
                {lit && k.kind === "hero" && <div style={{ fontSize: hs, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05, color: pal.fg }}>{headline}</div>}
                {lit && k.kind === "btn" && <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, color: pal.onV }}>Get started</div>}
                {lit && k.kind === "img" && (
                  <>
                    <div style={{ position: "absolute", left: 60, top: 60, width: 180, height: 180, borderRadius: "50%", background: pal.a }} />
                    <div style={{ position: "absolute", right: 50, bottom: 40, width: 220, height: 120, borderRadius: 20, background: pal.bg, transform: `rotate(${-8 + Math.sin(t * 2) * 4}deg)` }} />
                  </>
                )}
                {lit && k.kind === "card" && (
                  <div style={{ padding: 28 }}>
                    <div style={{ width: 54, height: 54, borderRadius: 14, background: [pal.v, pal.a, pal.fg][i % 3] }} />
                    <div style={{ marginTop: 22, width: "70%", height: 18, borderRadius: 9, background: pal.fg, opacity: 0.8 }} />
                    <div style={{ marginTop: 14, width: "90%", height: 14, borderRadius: 7, background: pal.muted, opacity: 0.6 }} />
                  </div>
                )}
              </div>
            );
          })}
        </Browser>
        {/* color pass bar */}
        {sweep > 0 && sweep < 1 && <div style={{ position: "absolute", left: bx + sweep * (BW + 300) - 150, top: by, width: 6, height: BH, background: pal.v, boxShadow: `0 0 40px ${pal.v}` }} />}
        {t > 4.2 && t < 6.4 && <Cursor x={cx} y={cy} press={click} color={pal.fg} size={44} />}
      </div>
      {/* devices */}
      {zoomOut > 0 && (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - fade }}>
          <Phone x={lerp(2200, 1520, zoomOut)} y={560} h={720} pal={pal}>
            <div style={{ padding: "70px 22px", fontFamily: ff }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: pal.v }} />
              <div style={{ marginTop: 26, fontSize: 40, fontWeight: 800, color: pal.fg, letterSpacing: "-0.03em", lineHeight: 1.05 }}>{headline}</div>
              <div style={{ marginTop: 26, height: 200, borderRadius: 20, background: pal.v }} />
              <div style={{ marginTop: 22, height: 60, borderRadius: 99, background: pal.fg }} />
            </div>
          </Phone>
        </div>
      )}
      {published && t < 7.9 && (
        <div style={{ position: "absolute", left: 960, top: 980, transform: `translate(-50%, 0) translateY(${(1 - spring(t - 5.4, 16, 0.7)) * 140}px)`, padding: "18px 34px", borderRadius: 99, background: pal.fg, color: pal.bg, fontSize: 30, fontWeight: 700, whiteSpace: "nowrap" }}>
          Live at {url}
        </div>
      )}
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={540} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Your site, live in minutes."} x={960} y={660} size={52} weight={500} color={pal.muted} font={ff} p={c01((t - 8.4) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/site-build.wav" on={audio} />
    </AbsoluteFill>
  );
}
