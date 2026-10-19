import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, countStat, cubicInOut, expInOut, expOut, fit, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { person: string; role: string; milestones: string; mrr: string; tagline: string };

// A founder's page assembles fast: avatar and name, a role line, a
// milestones timeline, an MRR chart that climbs, and link chips, each block
// snapping into a clean one-page layout before the camera pulls out.
export default function FounderPage({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const person = c.person || "Ava Chen";
  const role = c.role || "Building tools for small teams";
  const ms = [...list(c.milestones || "Launched, First 100 users, Profitable, Team of 5"), "", "", "", ""].slice(0, 4);
  const mrr = c.mrr || "$18,400";
  const blk = (i: number) => spring(t - 0.3 - i * 0.55, 16, 0.65);
  const chart = cubicInOut(seg(t, 2.6, 2.0));
  const pull = expInOut(seg(t, 6.4, 0.9));
  const endP = c01((t - 7.6) / 0.8);
  const initials = person.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: "960px 540px", transform: `scale(${lerp(1, 0.55, pull)}) translateY(${-pull * 120}px)`, opacity: 1 - c01((t - 7.3) * 3) }}>
        <div style={{ position: "absolute", left: 360, top: 70, width: 1200, height: 940, borderRadius: 36, background: pal.card, boxShadow: pull > 0 ? "0 40px 100px rgba(0,0,0,0.4)" : undefined }}>
          {/* header */}
          <div style={{ position: "absolute", left: 70, top: 70, display: "flex", alignItems: "center", gap: 30, transform: `translateY(${(1 - blk(0)) * 60}px)`, opacity: c01(blk(0) * 2) }}>
            <div style={{ width: 150, height: 150, borderRadius: 75, background: `linear-gradient(135deg, ${pal.v}, ${pal.a})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60, fontWeight: 800, color: pal.onV }}>{initials}</div>
            <div>
              <div style={{ fontSize: fit(person, 760, 84, 800, -0.03, ff), fontWeight: 800, color: pal.fg, letterSpacing: "-0.03em" }}>{person}</div>
              <div style={{ fontSize: 32, color: pal.muted, marginTop: 6 }}>{role}</div>
            </div>
          </div>
          {/* milestones */}
          <div style={{ position: "absolute", left: 70, top: 300, width: 480, transform: `translateX(${(1 - blk(1)) * -80}px)`, opacity: c01(blk(1) * 2) }}>
            <div style={{ fontSize: 26, color: pal.muted, marginBottom: 20 }}>Milestones</div>
            {ms.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22, opacity: c01((t - 1.2 - i * 0.2) * 3) }}>
                <div style={{ width: 20, height: 20, borderRadius: 10, background: i === ms.length - 1 ? pal.v : pal.fg }} />
                <div style={{ fontSize: 34, fontWeight: 700, color: pal.fg }}>{m}</div>
              </div>
            ))}
          </div>
          {/* chart */}
          <div style={{ position: "absolute", left: 600, top: 300, width: 530, height: 360, borderRadius: 26, background: pal.card2, padding: 28, boxSizing: "border-box", transform: `translateY(${(1 - blk(2)) * 80}px)`, opacity: c01(blk(2) * 2) }}>
            <div style={{ fontSize: 24, color: pal.muted }}>MRR</div>
            <div style={{ fontSize: 60, fontWeight: 800, color: pal.fg, letterSpacing: "-0.03em" }}>{countStat(mrr, chart)}</div>
            <svg width={474} height={170} style={{ marginTop: 10 }}>
              <polyline points={Array.from({ length: 24 }, (_, i) => `${i * 20.6},${165 - Math.pow(i / 23, 1.9) * 150 * chart - Math.sin(i) * 4}`).join(" ")} fill="none" stroke={pal.v} strokeWidth={6} strokeLinejoin="round" />
            </svg>
          </div>
          {/* links */}
          <div style={{ position: "absolute", left: 70, top: 760, display: "flex", gap: 20 }}>
            {["Website", "Newsletter", "X", "Book a call"].map((l, i) => (
              <div key={l} style={{ padding: "18px 30px", borderRadius: 40, background: i === 3 ? pal.v : pal.card2, color: i === 3 ? pal.onV : pal.fg, fontSize: 28, fontWeight: 700, transform: `scale(${spring(t - 2.0 - i * 0.12, 18, 0.55)})` }}>{l}</div>
            ))}
          </div>
        </div>
      </div>
      {endP > 0 && (
        <Svg>
          <Txt text={nameOf(b)} x={960} y={530} size={170} weight={800} color={pal.fg} font={ff} p={endP} tracking={-0.04} />
          <Txt text={c.tagline || "Your story, one page."} x={960} y={650} size={50} weight={500} color={pal.v} font={ff} p={c01((t - 8.0) / 0.6)} mode="fade" />
        </Svg>
      )}
      <Track src="tracks/founder-page.wav" on={audio} />
    </AbsoluteFill>
  );
}

export const _ = expOut;
