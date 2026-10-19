import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Phone, Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { text: string; translated: string; lang: string; tagline: string };

// A scanner app launch: a page sits crooked in the viewfinder, corner guides
// hunt and lock on, the shutter fires, the page flattens and a scan line reads
// it. The words lift out of the phone as editable text, Translate swaps the
// language in place and Copy confirms with a toast.
export default function ScanToText({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);
  const text = c.text || "Launch is Tuesday. Budget approved. Demo at 3 pm, room 4.";
  const trans = c.translated || "El lanzamiento es el martes. Presupuesto aprobado. Demo a las 15 h, sala 4.";

  const rise = spring(t - 0.05, 13, 0.82);
  const lockOn = expInOut(seg(t, 1.1, 0.5));
  const shutter = t > 1.8 && t < 1.95 ? 1 : 0;
  const flash = c01(1 - (t - 1.85) / 0.25) * (t > 1.85 ? 1 : 0);
  const flat = expInOut(seg(t, 2.0, 0.6));
  const scan = c01((t - 2.25) / 0.75);
  const out = expOut(seg(t, 3.0, 0.6));
  const chips = spring(t - 4.5, 16, 0.75);
  const tapT = t > 5.3 && t < 5.6;
  const swap = expInOut(seg(t, 5.55, 0.7));
  const copied = c01((t - 6.9) / 0.2) * (1 - c01((t - 7.7) / 0.2));
  const endShift = expInOut(seg(t, 7.8, 0.7));
  const nameP = c01((t - 8.1) / 0.6);
  const tagP = c01((t - 8.5) / 0.6);

  const PX = lerp(640, 520, out) - endShift * 120;
  const PH = 860;
  const sw = PH * 0.49 - PH * 0.036;
  const docW = lerp(270, 330, flat);
  const docH = lerp(360, 470, flat);
  const docRot = lerp(-9, 0, flat);
  const persp = lerp(14, 0, flat);

  const words = (s: string) => s.split(" ");
  const cardX = lerp(PX + 120, 1280, out) - endShift * 120;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - rise) * 900}px)` }}>
        <Phone x={PX} y={560} h={PH} pal={pal} screen="#1a1b1e">
          {/* viewfinder: desk + page */}
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 40% 30%, #3a3328, #17150f)` }} />
          <div
            style={{
              position: "absolute",
              left: sw / 2 - docW / 2,
              top: 380 - docH / 2,
              width: docW,
              height: docH,
              background: "#f6f4ee",
              borderRadius: 4,
              transform: `perspective(700px) rotateX(${persp}deg) rotate(${docRot}deg)`,
              boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
              padding: 26,
              boxSizing: "border-box",
            }}
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} style={{ height: 9, width: `${[90, 70, 84, 60, 92, 76, 50, 88, 40][i]}%`, background: "#54524c", borderRadius: 4, margin: i === 0 ? "0 0 26px" : "0 0 18px", opacity: i === 0 ? 1 : 0.7 }} />
            ))}
            {scan > 0 && scan < 1 && <div style={{ position: "absolute", left: 0, right: 0, top: `${scan * 100}%`, height: 6, background: pal.p, boxShadow: `0 0 24px ${pal.p}` }} />}
            {scan > 0 && <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: `${scan * 100}%`, background: pal.p, opacity: 0.12 }} />}
          </div>
          {/* corner guides */}
          <Svg w={sw} h={PH}>
            {[
              [-1, -1],
              [1, -1],
              [1, 1],
              [-1, 1],
            ].map(([sx, sy], i) => {
              const hunt = Math.sin(t * 5 + i) * 18 * (1 - lockOn);
              const x = sw / 2 + sx * lerp(160, docW / 2 + 8, lockOn) + hunt;
              const y = 380 + sy * lerp(230, docH / 2 + 8, lockOn) - hunt * 0.6;
              return <path key={i} d={`M${x},${y - sy * 34} L${x},${y} L${x - sx * 34},${y}`} stroke={lockOn > 0.98 ? pal.p : "#fff"} strokeWidth={6} fill="none" strokeLinecap="round" />;
            })}
            {/* shutter */}
            <circle cx={sw / 2} cy={PH - 120} r={shutter ? 36 : 42} fill="#fff" opacity={1 - flat} />
            <circle cx={sw / 2} cy={PH - 120} r={52} fill="none" stroke="#fff" strokeWidth={5} opacity={1 - flat} />
          </Svg>
          <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: flash * 0.8 }} />
        </Phone>
      </div>

      {/* extracted text card */}
      {out > 0 && (
        <div style={{ position: "absolute", left: cardX - 340, top: 270, width: 680, padding: "36px 40px", borderRadius: 28, background: pal.card, border: `1.5px solid ${pal.line}`, opacity: out, transform: `scale(${lerp(0.6, 1, out)})`, transformOrigin: "0 50%" }}>
          <div style={{ fontSize: 22, letterSpacing: "0.1em", textTransform: "uppercase", color: pal.v, marginBottom: 16 }}>{swap > 0.5 ? c.lang || "Español" : "Scanned text"}</div>
          <div style={{ position: "relative", fontSize: 42, lineHeight: 1.32, color: pal.fg, fontWeight: 600, minHeight: 230 }}>
            {words(text).map((w, i) => {
              const inP = c01((t - 3.1 - i * 0.06) / 0.3);
              const gone = c01((swap - i * 0.03) * 3);
              return (
                <span key={i} style={{ opacity: inP * (1 - gone), filter: gone > 0 && gone < 1 ? `blur(${gone * 8}px)` : undefined }}>
                  {w}{" "}
                </span>
              );
            })}
            <div style={{ position: "absolute", inset: 0 }}>
              {words(trans).map((w, i) => {
                const inP = c01((swap - 0.3 - i * 0.03) * 3);
                return (
                  <span key={i} style={{ opacity: inP }}>
                    {w}{" "}
                  </span>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 26 }}>
            {["Copy", "Translate", "Share"].map((l, i) => {
              const s = c01(chips * 1.2 - i * 0.12);
              const tapped = (l === "Translate" && tapT) || (l === "Copy" && t > 6.75 && t < 7.0);
              return (
                <div key={l} style={{ padding: "14px 26px", borderRadius: 99, fontSize: 26, fontWeight: 700, background: l === "Translate" && swap > 0.5 ? pal.p : pal.card2, color: l === "Translate" && swap > 0.5 ? pal.onP : pal.fg, transform: `scale(${s * (tapped ? 0.92 : 1)})` }}>
                  {l}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {copied > 0 && (
        <div style={{ position: "absolute", left: cardX - 130, top: 760, width: 260, padding: "16px 0", textAlign: "center", borderRadius: 99, background: pal.fg, color: pal.bg, fontSize: 28, fontWeight: 700, opacity: copied, transform: `translateY(${(1 - copied) * 30}px)` }}>
          Copied
        </div>
      )}
      <Svg>
        {nameP > 0 && <Txt text={name} x={cardX} y={890} size={fit(name, 700, 110, 800)} weight={800} color={pal.fg} font={ff} p={nameP} tracking={-0.04} />}
        {tagP > 0 && <Txt text={c.tagline || "Scan anything. Edit everything."} x={cardX} y={970} size={38} weight={500} color={pal.muted} font={ff} p={tagP} mode="fade" />}
      </Svg>
      <Track src="tracks/scan-to-text.wav" on={audio} />
    </AbsoluteFill>
  );
}
