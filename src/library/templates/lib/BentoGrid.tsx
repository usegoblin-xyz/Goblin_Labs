import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Mark, Svg, Track, Txt, c01, cubicInOut, expInOut, fontOf, hash, kf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { headline: string; tiles: string; stat: string; tagline: string };

// A bento-grid product video: tiles drop into a grid one by one, each with a
// live mini-widget (chart, toggle, avatars, stat, mark, search); the camera
// pushes into each tile in turn, then pulls back to the full board.
export default function BentoGrid({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const labels = [...list(c.tiles || "Analytics, Automations, Team, Uptime, Search"), "Feature", "Feature", "Feature", "Feature", "Feature"].slice(0, 5);
  const stat = c.stat || "99.99%";
  // grid cells in a 1700×860 board at (110,110): [x,y,w,h]
  const cells: [number, number, number, number][] = [
    [0, 0, 760, 520],
    [780, 0, 440, 250],
    [1240, 0, 460, 520],
    [780, 270, 440, 250],
    [0, 540, 560, 320],
    [580, 540, 1120, 320],
  ];
  // focus sequence: camera pushes into tiles
  const foci = [0, 2, 5, 1];
  const fz = (i: number) => {
    const [x, y, w, h] = cells[i];
    const s = Math.min(1500 / w, 820 / h, 2.2);
    return { cx: 110 + x + w / 2, cy: 110 + y + h / 2, s };
  };
  const keyCam = (k: "cx" | "cy" | "s") => {
    const base = { cx: 960, cy: 540, s: 1 };
    const arr: [number, number][] = [[3.0, base[k]]];
    foci.forEach((f, j) => {
      const a = 3.4 + j * 1.5;
      arr.push([a, fz(f)[k]], [a + 0.9, fz(f)[k]]);
    });
    arr.push([3.4 + foci.length * 1.5 + 0.2, base[k]]);
    return kf(t, arr, cubicInOut);
  };
  const cx = keyCam("cx");
  const cy = keyCam("cy");
  const cs = keyCam("s");
  const outro = expInOut(seg(t, 10.4, 0.5));
  const endP = c01((t - 10.8) / 0.8);
  const bars = Array.from({ length: 12 }, (_, i) => 0.25 + 0.7 * hash(i, 4));
  const on = t > 5.6;

  const content = (i: number, w: number, h: number) => {
    switch (i) {
      case 0:
        return (
          <svg width={w} height={h - 120} viewBox={`0 0 ${w} ${h - 120}`}>
            {bars.map((v, j) => {
              const bw = (w - 80) / 12 - 12;
              const bh = (h - 180) * v * cubicInOut(c01((t - 1.0 - j * 0.04) / 0.8));
              return <rect key={j} x={40 + j * (bw + 12)} y={h - 160 - bh} width={bw} height={bh} rx={8} fill={j === 9 ? pal.v : pal.card2} />;
            })}
          </svg>
        );
      case 1:
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 30 }}>
            <div style={{ width: 120, height: 66, borderRadius: 33, background: on ? pal.v : pal.card2, position: "relative" }}>
              <div style={{ position: "absolute", top: 8, left: lerp(8, 62, cubicInOut(c01((t - 5.4) / 0.3))), width: 50, height: 50, borderRadius: 25, background: "#fff" }} />
            </div>
            <div style={{ fontSize: 30, color: pal.muted }}>{on ? "Running" : "Paused"}</div>
          </div>
        );
      case 2:
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 30 }}>
            {Array.from({ length: 9 }, (_, j) => (
              <div key={j} style={{ width: 110, height: 110, borderRadius: 55, background: [pal.v, pal.a, pal.card2, "#38a3ff", "#f28ab2"][j % 5], transform: `scale(${spring(t - 1.6 - j * 0.07, 16, 0.55)})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, fontWeight: 800, color: "#fff" }}>
                {"ABCDEFGHJ"[j]}
              </div>
            ))}
          </div>
        );
      case 3:
        return <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: "-0.04em", color: pal.fg, marginTop: 10 }}>{stat}</div>;
      case 4:
        return (
          <div style={{ position: "relative", height: 180 }}>
            <Mark x={w / 2 - 40} y={100} size={150} b={b} pal={pal} rot={Math.sin(t * 1.5) * 8} />
          </div>
        );
      default: {
        const q = "find the onboarding doc";
        const typed = q.slice(0, Math.floor(c01((t - 6.2) / 0.9) * q.length));
        return (
          <div>
            <div style={{ marginTop: 20, padding: "22px 30px", borderRadius: 20, background: pal.card2, fontSize: 34, color: pal.fg }}>
              ⌕ {typed || <span style={{ color: pal.muted }}>Search everything</span>}
            </div>
            {t > 7.2 && (
              <div style={{ marginTop: 14, padding: "16px 30px", fontSize: 28, color: pal.muted, opacity: c01((t - 7.2) * 4) }}>
                📄 Onboarding · updated today
              </div>
            )}
          </div>
        );
      }
    }
  };

  return (
    <AbsoluteFill style={{ background: pal.dark ? "#0b0b0d" : "#efefec", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro, transformOrigin: "0 0", transform: `translate(960px, 540px) scale(${cs}) translate(${-cx}px, ${-cy}px)` }}>
        {cells.map(([x, y, w, h], i) => {
          const s = spring(t - 0.2 - i * 0.16, 14, 0.62);
          const label = i === 4 ? nameOf(b) : labels[i > 4 ? 4 : i];
          return (
            <div key={i} style={{ position: "absolute", left: 110 + x, top: 110 + y, width: w, height: h, borderRadius: 34, background: pal.card, padding: 34, boxSizing: "border-box", overflow: "hidden", transform: `translateY(${(1 - s) * 140}px) scale(${0.9 + 0.1 * s})`, opacity: c01(s * 2) }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: pal.muted }}>{label}</div>
              {content(i, w, h)}
            </div>
          );
        })}
      </div>
      {t < 3.2 && (
        <Svg>
          <Txt text={c.headline || "Everything, in one place."} x={960} y={1050} size={34} weight={700} color={pal.muted} font={ff} p={c01((t - 1.2) / 0.5)} out={c01((t - 2.8) / 0.3)} mode="fade" />
        </Svg>
      )}
      {endP > 0 && (
        <Svg>
          <Txt text={c.headline || "Everything, in one place."} x={960} y={520} size={110} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={`${nameOf(b)} · ${c.tagline || "try it free"}`} x={960} y={640} size={48} weight={600} color={pal.v} font={ff} p={c01((t - 11.2) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/bento-grid.wav" on={audio} />
    </AbsoluteFill>
  );
}

