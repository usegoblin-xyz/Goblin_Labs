import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, nameOf, palette, seg, useT } from "../../motion";

type C = { apps: string; tagline: string };

// A tiling window manager promo: windows open one by one and the screen
// auto-splits around them (binary-space partition), each split animating
// with a spring; keyboard shortcut chips flash as a window is swapped and
// one is zoomed to fullscreen and back.
export default function TilingWindows({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const apps = [...list(c.apps || "Editor, Terminal, Browser, Notes, Music"), "App", "App", "App", "App", "App"].slice(0, 5);
  const cols = [pal.v, pal.a, "#38a3ff", "#f28ab2", "#f2b64a"];
  const G = 16;
  const SX = 60;
  const SY = 90;
  const SW = 1800;
  const SH = 900;
  const openAt = [0.4, 1.2, 2.0, 2.8, 3.6];
  const p = (i: number) => cubicInOut(c01((t - openAt[i]) / 0.5));
  // layouts interpolate as each window opens
  const n = openAt.filter((a) => t > a).length;
  const swap = cubicInOut(c01((t - 4.6) / 0.5));
  const zoom = expInOut(seg(t, 5.6, 0.5)) * (1 - expInOut(seg(t, 6.8, 0.5)));
  const outro = expInOut(seg(t, 8.2, 0.5));
  const endP = c01((t - 8.6) / 0.8);
  // rect for window i given count k (fractions)
  const layout = (k: number): [number, number, number, number][] => {
    if (k <= 1) return [[0, 0, 1, 1]];
    if (k === 2) return [[0, 0, 0.5, 1], [0.5, 0, 0.5, 1]];
    if (k === 3) return [[0, 0, 0.5, 1], [0.5, 0, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]];
    if (k === 4) return [[0, 0, 0.5, 1], [0.5, 0, 0.5, 0.5], [0.5, 0.5, 0.25, 0.5], [0.75, 0.5, 0.25, 0.5]];
    return [[0, 0, 0.5, 1], [0.5, 0, 0.5, 0.5], [0.5, 0.5, 0.25, 0.5], [0.75, 0.5, 0.25, 0.25], [0.75, 0.75, 0.25, 0.25]];
  };
  const rectAt = (i: number) => {
    const k = Math.max(1, n);
    const prev = layout(Math.max(1, k - 1));
    const cur = layout(k);
    const q = p(k - 1);
    const a = prev[i] ?? cur[i];
    const bb = cur[i];
    let r = a.map((v, j) => v + (bb[j] - v) * q) as [number, number, number, number];
    // swap window 0 and 1 positions
    if (swap > 0 && (i === 0 || i === 1)) {
      const other = cur[i === 0 ? 1 : 0];
      r = r.map((v, j) => v + (other[j] - v) * swap) as [number, number, number, number];
    }
    if (i === 2 && zoom > 0) r = r.map((v, j) => v + ([0, 0, 1, 1][j] - v) * zoom) as [number, number, number, number];
    return r;
  };
  const shortcut = t > 4.5 && t < 5.4 ? "⌘ ⇧ ←  swap" : t > 5.5 && t < 7.4 ? "⌘ ↵  zoom" : t > 0.3 && t < 4.2 ? "⌘ N  new window" : "";

  return (
    <AbsoluteFill style={{ background: "#0e0f14", overflow: "hidden", fontFamily: ff }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 30% 20%, ${pal.v}33, transparent 60%), radial-gradient(circle at 80% 90%, ${pal.a}33, transparent 60%)` }} />
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 50, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", padding: "0 30px", fontFamily: MONO, fontSize: 22, color: "#aaa", gap: 20 }}>
          {[1, 2, 3, 4].map((w) => (
            <span key={w} style={{ color: w === 1 ? pal.v : "#666" }}>{w}</span>
          ))}
          <span style={{ marginLeft: "auto" }}>{nameOf(b)} · {n} windows</span>
        </div>
        {apps.map((a, i) => {
          if (t < openAt[i]) return null;
          const [fx, fy, fw, fh] = rectAt(i);
          const appear = p(i);
          return (
            <div key={i} style={{ position: "absolute", left: SX + fx * SW + G / 2, top: SY + fy * SH + G / 2, width: fw * SW - G, height: fh * SH - G, borderRadius: 18, background: "#16171d", boxShadow: i === 2 && zoom > 0.5 ? `0 0 0 3px ${pal.v}` : "0 0 0 1px #2a2b33", overflow: "hidden", opacity: c01(appear * 2), transform: `scale(${0.85 + 0.15 * appear})`, zIndex: i === 2 && zoom > 0 ? 10 : 1 }}>
              <div style={{ height: 40, background: cols[i], display: "flex", alignItems: "center", padding: "0 16px", fontSize: 20, fontWeight: 800, color: "#111" }}>{a}</div>
              <div style={{ padding: 18 }}>
                {Array.from({ length: 10 }, (_, j) => (
                  <div key={j} style={{ height: 10, borderRadius: 5, background: "#2a2b33", marginTop: 12, width: `${40 + ((j * 37 + i * 11) % 55)}%` }} />
                ))}
              </div>
            </div>
          );
        })}
        {shortcut && (
          <div style={{ position: "absolute", left: "50%", bottom: 40, transform: "translateX(-50%)", padding: "16px 30px", borderRadius: 16, background: "rgba(0,0,0,0.75)", fontFamily: MONO, fontSize: 30, color: "#fff", zIndex: 20 }}>{shortcut}</div>
        )}
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text="Windows that tile themselves." x={960} y={500} size={100} weight={800} color="#fff" font={ff} p={endP} tracking={-0.03} />
          <Txt text={`${nameOf(b)} · ${c.tagline || "a tiling window manager"}`} x={960} y={620} size={46} weight={600} color={pal.v} font={ff} p={c01((t - 9.0) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/tiling-windows.wav" on={audio} />
    </AbsoluteFill>
  );
}
