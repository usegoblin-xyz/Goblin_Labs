import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Cursor, MONO, Track, alpha, c01, cubicInOut, expInOut, expOut, fontOf, hash, kf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";
import { MiniReel } from "./MiniReels";

type C = { tagline1: string; tagline2: string; url: string; title: string; prompt: string; phrase: string };

// A promo for a gallery site in one continuous camera: a reel pulls back into
// the grid, the grid scrolls, the camera whips into a tile, three reels cut on
// the drop, a match cut back, a click opens an entry page, a prompt is
// highlighted and copied, and the poster lands.
const BEAT = 0.5;
const b = (n: number) => n * BEAT;
const COLS = [70, 70 + 600, 70 + 1200];
const TW = 560;
const HEAD = 140;
const HEIGHTS = [[340, 420, 300, 380, 340], [420, 300, 380, 340, 420], [300, 380, 420, 300, 360]];
const HANDLES = ["@lena.moves", "@kiro_studio", "@paperplane", "@m.ortiz", "@dotgrid", "@juniper", "@halfstep", "@north.co", "@tilde", "@ada_loops", "@spline.kid", "@quietframe", "@okto", "@ruler", "@vesper"];

type Tile = { x: number; y: number; w: number; h: number; k: number; handle: string };
const TILES: Tile[] = (() => {
  const out: Tile[] = [];
  COLS.forEach((x, ci) => {
    let y = HEAD + 120;
    HEIGHTS[ci].forEach((h, ri) => {
      const k = ci * 5 + ri;
      out.push({ x, y, w: TW, h, k, handle: HANDLES[k % HANDLES.length] });
      y += h + 40;
    });
  });
  return out;
})();
const FIRST = TILES[0];
const WHIP = TILES[7]; // middle column, third row
const CLICKED = TILES[11];
const PO = { x: 1460, y: 470 }; // push origin: the prompt block
const PS = 1.35;
const COPY = { x: 1200, y: 542 }; // copy button on the entry page

export default function GalleryPromo({ brand: br, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(br);
  const ff = fontOf(br);
  const site = c.url || "gallery.example";
  const page = pal.dark ? pal.bg : "#fbfbfa";
  const ink = pal.dark ? "#f4f4f2" : "#111113";
  const acc = pal.v;

  // camera: focus (x, y) and log scale over the world
  const full = (tl: Tile) => ({ x: tl.x + tl.w / 2, y: tl.y + tl.h / 2, z: Math.max(1920 / tl.w, 1080 / tl.h) });
  const F0 = full(FIRST);
  const FW = full(WHIP);
  const scroll = kf(t, [[b(9), 0], [b(11), 520]], cubicInOut);
  const lz = Math.log;
  const camX = kf(t, [[0, F0.x], [b(2), 960], [b(9), 960], [b(11), 960], [b(13), FW.x], [b(16), FW.x], [b(17.5), 960]], cubicInOut);
  const camY = kf(t, [[0, F0.y], [b(2), 540], [b(9), 540 + 30], [b(11), 540 + scroll], [b(13), FW.y], [b(16), FW.y], [b(17.5), 540 + 520]], cubicInOut);
  const camZ = Math.exp(kf(t, [[0, lz(F0.z)], [b(2), 0], [b(9), lz(1.03)], [b(11), 0], [b(13), lz(FW.z)], [b(16), lz(FW.z)], [b(17.5), 0]], cubicInOut));
  const inBurst = t >= b(13) && t < b(16);
  const burstIdx = Math.floor((t - b(13)) / BEAT);

  // entry page
  const bloom = expInOut(seg(t, b(21), b(1.6)));
  const push = expInOut(seg(t, b(26), b(2.4)));
  const hl = expOut(seg(t, b(28.4), b(1.2)));
  const copyT = b(30.6);
  const slideOff = expInOut(seg(t, b(32), b(1.4)));
  const dock = expInOut(seg(t, b(33.2), b(1.6)));
  const poster = t >= b(33);

  const tileRadius = (tl: Tile) => {
    const z = camZ;
    const fullness = c01((z * tl.w - 1500) / 600);
    return lerp(18, 0, fullness);
  };
  const clickedScreen = { x: 960 + (CLICKED.x - camX) * camZ, y: 540 + (CLICKED.y - camY) * camZ, w: CLICKED.w * camZ, h: CLICKED.h * camZ };
  const cursorTarget = { x: clickedScreen.x + clickedScreen.w * 0.6, y: clickedScreen.y + clickedScreen.h * 0.55 };
  const clickT = b(20);

  const prompt = c.prompt || "A 15 second film in one take. One dot carries every scene, springs settle with a small overshoot, and the last frame matches the first so it loops.";
  const phrase = c.phrase || "the last frame matches the first";

  return (
    <AbsoluteFill style={{ background: page, overflow: "hidden", fontFamily: ff }}>
      {/* ===== world ===== */}
      {!inBurst && bloom < 1 && (
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0 0", transform: `translate(960px, 540px) scale(${camZ}) translate(${-camX}px, ${-camY}px)` }}>
          {/* header */}
          <div style={{ position: "absolute", left: 70, top: 40, width: 1780, height: 70, display: "flex", alignItems: "center", gap: 18, opacity: expOut(seg(t, b(1), 0.4)) }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: ink }} />
            <div style={{ fontSize: 28, fontWeight: 700, color: ink }}>{nameOf(br)}</div>
            <div style={{ flex: 1 }} />
            {["Gallery", "Submit", "About"].map((x, i) => (
              <div key={x} style={{ padding: "10px 20px", borderRadius: 99, background: i === 0 ? ink : "transparent", color: i === 0 ? page : ink, fontSize: 20, fontWeight: 600, boxShadow: i ? `inset 0 0 0 1.5px ${alpha(ink, 0.15)}` : undefined }}>{x}</div>
            ))}
          </div>
          <div style={{ position: "absolute", left: 70, top: HEAD, fontSize: 56, fontWeight: 700, letterSpacing: "-0.035em", color: ink, opacity: expOut(seg(t, b(1), 0.5)), transform: `translateY(${(1 - expOut(seg(t, b(1), 0.5))) * 20}px)` }}>
            {c.tagline1 || "Motion made by prompts."} <span style={{ color: alpha(ink, 0.45) }}>{c.tagline2 || "Copy any of them."}</span>
          </div>
          {/* tiles */}
          {TILES.map((tl) => (
            <div key={tl.k} style={{ position: "absolute", left: tl.x, top: tl.y, width: tl.w, height: tl.h, borderRadius: tileRadius(tl), overflow: "hidden", boxShadow: `0 0 0 1px ${alpha(ink, 0.08)}` }}>
              <MiniReel k={tl.k} t={t + hash(tl.k) * 3} pal={pal} font={ff} />
              <div style={{ position: "absolute", left: 14, bottom: 14, padding: "6px 12px", borderRadius: 99, background: "rgba(10,10,12,0.72)", color: "#fff", fontSize: 16, fontWeight: 600 }}>{tl.handle}</div>
            </div>
          ))}
        </div>
      )}
      {/* ===== the drop: three full-bleed reels, hard cuts ===== */}
      {inBurst && (
        <div style={{ position: "absolute", inset: 0 }}>
          <MiniReel k={[WHIP.k, 2, 6][Math.min(2, burstIdx)]} t={t * 1.4} pal={pal} font={ff} />
          <div style={{ position: "absolute", left: 90, bottom: 80, padding: "12px 22px", borderRadius: 99, background: "rgba(10,10,12,0.78)", color: "#fff", fontSize: 30, fontWeight: 600 }}>{[WHIP.handle, HANDLES[2], HANDLES[6]][Math.min(2, burstIdx)]}</div>
        </div>
      )}
      {/* cursor with halo */}
      {t > b(17.6) && t < b(21.4) && (() => {
        const k = cubicInOut(seg(t, b(17.6), b(2.2)));
        const x = lerp(1500, cursorTarget.x, k);
        const y = lerp(950, cursorTarget.y, k);
        const press = t > clickT - 0.06 && t < clickT + 0.1 ? 1 : 0;
        return (
          <>
            <div style={{ position: "absolute", left: x - 34, top: y - 34, width: 68, height: 68, borderRadius: 34, background: alpha(acc, 0.28), transform: `scale(${1 + press * 0.4})` }} />
            <Cursor x={x} y={y} press={press} color={ink} size={44} />
          </>
        );
      })()}
      {/* ===== entry page, blooming out of the clicked tile ===== */}
      {t >= b(21) && (
        <div style={{ position: "absolute", left: lerp(clickedScreen.x, 0, bloom) - slideOff * 1920, top: lerp(clickedScreen.y, 0, bloom), width: lerp(clickedScreen.w, 1920, bloom), height: lerp(clickedScreen.h, 1080, bloom), borderRadius: lerp(18, 0, bloom), overflow: "hidden", background: page }}>
          <div style={{ position: "absolute", inset: 0, transformOrigin: `${PO.x}px ${PO.y}px`, transform: `translate(${(960 - PO.x) * push}px, ${(540 - PO.y) * push}px) scale(${lerp(1, PS, push)})` }}>
            <div style={{ position: "absolute", left: lerp(0, 80, bloom) - push * 1100, top: lerp(0, 150, bloom), width: lerp(1920, 940, bloom), height: lerp(1080, 780, bloom), borderRadius: lerp(0, 22, bloom), overflow: "hidden" }}>
              <MiniReel k={CLICKED.k} t={t} pal={pal} font={ff} />
            </div>
            <div style={{ position: "absolute", left: 1080, top: 150, width: 760, opacity: c01((bloom - 0.6) / 0.4) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 22, background: alpha(ink, 0.12) }} />
                <div style={{ fontSize: 22, fontWeight: 600, color: ink }}>{CLICKED.handle}</div>
              </div>
              <div style={{ marginTop: 18, fontSize: 46, fontWeight: 700, letterSpacing: "-0.03em", color: ink }}>{c.title || "One dot, every scene"}</div>
              <div style={{ marginTop: 18, display: "flex", gap: 30, fontSize: 18, color: alpha(ink, 0.55) }}>
                <span>Model · Motion</span>
                <span>Stack · HTML</span>
                <span>Posted · Today</span>
              </div>
              <div style={{ marginTop: 30, padding: 26, borderRadius: 18, background: alpha(ink, 0.05), fontFamily: MONO, fontSize: 21, lineHeight: 1.55, color: ink }}>
                {(() => {
                  const i = prompt.indexOf(phrase);
                  if (i < 0) return prompt;
                  return (
                    <>
                      {prompt.slice(0, i)}
                      <span style={{ backgroundImage: `linear-gradient(${acc}, ${acc})`, backgroundRepeat: "no-repeat", backgroundSize: `${hl * 100}% 100%`, boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone", color: hl > 0.5 ? pal.onV : ink, padding: "0 2px" }}>{phrase}</span>
                      {prompt.slice(i + phrase.length)}
                    </>
                  );
                })()}
              </div>
              <div style={{ marginTop: 24, display: "inline-flex", padding: "14px 28px", borderRadius: 99, background: ink, color: page, fontSize: 22, fontWeight: 700, opacity: dock > 0 ? 0 : 1 }}>{t >= copyT ? "Copied" : "Copy prompt"}</div>
            </div>
          </div>
        </div>
      )}
      {t > b(29) && t < b(31.4) && (() => {
        const k = cubicInOut(seg(t, b(29), b(1.4)));
        const press = t > copyT - 0.06 && t < copyT + 0.1 ? 1 : 0;
        const sc = lerp(1, PS, push);
        const tx = PO.x + (COPY.x - PO.x) * sc + (960 - PO.x) * push;
        const ty = PO.y + (COPY.y - PO.y) * sc + (540 - PO.y) * push;
        const x = lerp(1500, tx + 20, k);
        const y = lerp(1000, ty + 10, k);
        return (
          <>
            <div style={{ position: "absolute", left: x - 34, top: y - 34, width: 68, height: 68, borderRadius: 34, background: alpha(acc, 0.28), transform: `scale(${1 + press * 0.4})` }} />
            <Cursor x={x} y={y} press={press} color={ink} size={44} />
          </>
        );
      })()}
      {/* ===== poster ===== */}
      {poster && (() => {
        const pillX = lerp(1460, 300, dock);
        const pillY = lerp(965, 300, dock);
        const label = dock > 0.5;
        const title = expOut(seg(t, b(35), 0.6));
        const tag = expOut(seg(t, b(36), 0.6));
        const rail = expOut(seg(t, b(36.5), 1.2));
        return (
          <>
            <div style={{ position: "absolute", left: pillX - 10, top: pillY - 34, height: 68, padding: "0 30px", borderRadius: 99, background: ink, color: page, fontSize: 26, fontWeight: 700, display: "flex", alignItems: "center", gap: 12, transform: `translateY(${-Math.sin(dock * Math.PI) * 60}px)` }}>
              {label ? <><span style={{ width: 12, height: 12, borderRadius: 6, background: acc }} />{site}</> : "Copied"}
            </div>
            <div style={{ position: "absolute", left: 290, top: 400, fontSize: 112, fontWeight: 800, letterSpacing: "-0.05em", color: ink, opacity: title, transform: `translateY(${(1 - title) * 30}px)` }}>{nameOf(br)}</div>
            <div style={{ position: "absolute", left: 296, top: 560, width: 820, fontSize: 40, fontWeight: 600, lineHeight: 1.2, color: ink, opacity: tag, transform: `translateY(${(1 - tag) * 24}px)` }}>
              {c.tagline1 || "Motion made by prompts."} <span style={{ color: alpha(ink, 0.45) }}>{c.tagline2 || "Copy any of them."}</span>
            </div>
            {[0, 1].map((i) => (
              <div key={i} style={{ position: "absolute", left: 1220 + i * 330, top: lerp(1100, i ? 300 : 200, rail), width: 300, height: 560, borderRadius: 20, overflow: "hidden", boxShadow: `0 0 0 1px ${alpha(ink, 0.08)}`, transform: `translateY(${spring(t - b(36.5) - i * 0.1, 14, 0.8) * 0}px)` }}>
                <MiniReel k={[3, 8][i]} t={t} pal={pal} font={ff} />
                <div style={{ position: "absolute", left: 14, bottom: 14, padding: "6px 12px", borderRadius: 99, background: "rgba(10,10,12,0.72)", color: "#fff", fontSize: 16, fontWeight: 600 }}>{HANDLES[[3, 8][i]]}</div>
              </div>
            ))}
          </>
        );
      })()}
      <Track src="tracks/gallery-promo.wav" on={audio} />
    </AbsoluteFill>
  );
}
