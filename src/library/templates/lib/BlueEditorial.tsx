import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { SERIF, Track, c01, cubicInOut, expInOut, fit, fontOf, hash, nameOf, seg, useT } from "../../motion";

type C = { headlines: string; quote: string; color: string };

// A monochrome editorial showreel: every frame is one ink colour on paper.
// Three magazine spreads build in turn: a giant serif headline wipes in,
// columns of body text flow, a pull quote slides between rules, a page
// number ticks; each spread slides away like a page turn.
export default function BlueEditorial({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const ff = fontOf(b);
  const ink = c.color || "#1f3dff";
  const paper = "#f4f1ea";
  const heads = [...list(c.headlines || "The Long Now, Notes on Craft, After Hours"), "Feature", "Feature", "Feature"].slice(0, 3);
  const quote = c.quote || "Good work is quiet. It just keeps being good.";
  const per = 2.6;
  const k = Math.min(2, Math.floor(t / per));
  const u = t - k * per;
  const turn = k < 2 ? cubicInOut(c01((u - per + 0.45) / 0.45)) : 0;
  const endP = c01((t - per * 3 - 0.2) / 0.8);
  const outro = expInOut(seg(t, 9.6, 0.5));
  const head = heads[k];
  const hW = c01((u - 0.1) / 0.5);
  const body = (n: number, w: number) =>
    Array.from({ length: n }, (_, j) => (
      <div key={j} style={{ height: 9, borderRadius: 2, background: ink, opacity: 0.85, marginTop: 13, width: `${j % 7 === 6 ? 55 : 92 + hash(j, w) * 8}%`, transform: `scaleX(${c01((u - 0.5 - j * 0.03) / 0.3)})`, transformOrigin: "0 50%" }} />
    ));
  const layouts = [
    // spread 0: headline across top, three columns
    () => (
      <>
        <div style={{ position: "absolute", left: 100, top: 90, fontFamily: SERIF, fontSize: fit(head, 1700, 260, 400, -0.02, SERIF), lineHeight: 0.95, color: ink, clipPath: `inset(0 ${(1 - hW) * 100}% 0 0)` }}>{head}</div>
        {[0, 1, 2].map((col) => (
          <div key={col} style={{ position: "absolute", left: 100 + col * 590, top: 480, width: 540 }}>
            {body(18, col)}
          </div>
        ))}
      </>
    ),
    // spread 1: pull quote centre, columns each side
    () => (
      <>
        <div style={{ position: "absolute", left: 100, top: 90, fontFamily: SERIF, fontStyle: "italic", fontSize: 120, color: ink, clipPath: `inset(0 ${(1 - hW) * 100}% 0 0)` }}>{head}</div>
        <div style={{ position: "absolute", left: 100, top: 300, width: 480 }}>{body(22, 4)}</div>
        <div style={{ position: "absolute", left: 1340, top: 300, width: 480 }}>{body(22, 5)}</div>
        <div style={{ position: "absolute", left: 660, top: 360, width: 600, textAlign: "center", transform: `translateY(${(1 - cubicInOut(c01((u - 0.8) / 0.5))) * 60}px)`, opacity: c01((u - 0.8) / 0.4) }}>
          <div style={{ height: 4, background: ink }} />
          <div style={{ fontFamily: SERIF, fontSize: 64, lineHeight: 1.1, color: ink, padding: "40px 0" }}>“{quote}”</div>
          <div style={{ height: 4, background: ink }} />
        </div>
      </>
    ),
    // spread 2: big block of ink with reversed headline, sidebar text
    () => (
      <>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${hW * 62}%`, background: ink }} />
        <div style={{ position: "absolute", left: 100, top: 600, fontFamily: SERIF, fontSize: fit(head, 1000, 200, 400, -0.02, SERIF), lineHeight: 0.95, color: paper, opacity: c01((u - 0.4) * 3) }}>{head}</div>
        <div style={{ position: "absolute", left: 1290, top: 120, width: 520 }}>{body(30, 9)}</div>
      </>
    ),
  ];

  return (
    <AbsoluteFill style={{ background: paper, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        {t < per * 3 && (
          <div style={{ position: "absolute", inset: 0, transform: `translateX(${-turn * 1920}px)`, boxShadow: turn > 0 ? "20px 0 60px rgba(0,0,0,0.2)" : "none", background: paper }}>
            {layouts[k]()}
            <div style={{ position: "absolute", left: 100, bottom: 40, fontSize: 22, fontWeight: 700, color: ink, letterSpacing: "0.2em" }}>{nameOf(b).toUpperCase()} · NO. {String(k + 1).padStart(2, "0")}</div>
            <div style={{ position: "absolute", right: 100, bottom: 40, fontFamily: SERIF, fontSize: 30, color: ink }}>{12 + k * 8}</div>
          </div>
        )}
        {endP > 0 && (
          <div style={{ position: "absolute", inset: 0, background: ink, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", clipPath: `inset(0 0 ${(1 - endP) * 100}% 0)` }}>
            <div style={{ fontFamily: SERIF, fontSize: 220, color: paper, lineHeight: 1 }}>{nameOf(b)}</div>
            <div style={{ fontSize: 34, fontWeight: 700, color: paper, letterSpacing: "0.3em", marginTop: 20, opacity: c01((t - per * 3 - 0.8) * 2) }}>EDITORIAL DESIGN</div>
          </div>
        )}
      </div>
      <Track src="tracks/blue-editorial.wav" on={audio} />
    </AbsoluteFill>
  );
}
