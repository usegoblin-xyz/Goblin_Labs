import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, fit, fontOf, hash, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { name: string; facts: string; contact: string };

// A sticker-style self-intro: a big waving hand pops in with "Hi, I'm …",
// then fact stickers (role, city, hobbies) slap onto the frame one by one
// with a squash, a little rotation and a white die-cut border, and a
// contact sticker lands last.
export default function HelloIntro({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = c.name || nameOf(b);
  const facts = [...list(c.facts || "Product designer, Based in Lisbon, 6 years shipping, Coffee snob, Plays bass"), "Fact", "Fact", "Fact", "Fact", "Fact"].slice(0, 5);
  const wave = Math.sin(t * 9) * 18 * c01((t - 0.3) * 3) * (1 - c01((t - 1.8) * 2));
  const hand = spring(t - 0.1, 16, 0.5);
  const hi = `Hi, I'm ${name}.`;
  const cols = [pal.v, pal.a, "#38a3ff", "#f28ab2", "#f2b64a"];
  const spots = [
    [380, 640, -8],
    [1500, 300, 6],
    [1480, 760, -4],
    [520, 300, 5],
    [960, 880, -3],
  ];
  const outro = expInOut(seg(t, 8.0, 0.5));
  const contact = spring(t - 6.4, 14, 0.5);

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden", fontFamily: ff }}>
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(${pal.line} 2px, transparent 2px)`, backgroundSize: "44px 44px" }} />
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <div style={{ position: "absolute", left: 960 - 110, top: 300, fontSize: 200, transform: `scale(${hand}) rotate(${wave}deg)`, transformOrigin: "70% 90%" }}>👋</div>
        <Svg>
          <Txt text={hi} x={960} y={620} size={fit(hi, 1300, 130, 900, -0.04, ff)} weight={900} color={pal.fg} font={ff} p={c01((t - 0.6) / 0.6)} tracking={-0.04} />
        </Svg>
        {facts.map((f, i) => {
          const at = 1.8 + i * 0.75;
          const s = spring(t - at, 20, 0.45);
          if (t < at) return null;
          const [x, y, r] = spots[i];
          const squash = 1 + (1 - c01((t - at) / 0.15)) * 0.25;
          return (
            <div key={i} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${r + (1 - s) * 30}deg) scale(${s * squash}, ${s / squash})`, padding: "22px 36px", borderRadius: 40, background: cols[i], color: "#fff", fontSize: 44, fontWeight: 900, whiteSpace: "nowrap", boxShadow: `0 0 0 10px #fff, 0 14px 30px rgba(0,0,0,${0.15 + hash(i) * 0.1})` }}>
              {f}
            </div>
          );
        })}
        {contact > 0.01 && (
          <div style={{ position: "absolute", left: 960, top: 1000, transform: `translate(-50%,-50%) rotate(${2 - (1 - contact) * 20}deg) scale(${contact})`, padding: "18px 34px", borderRadius: 18, background: pal.fg, color: pal.bg, fontSize: 38, fontWeight: 800, boxShadow: "0 0 0 10px #fff" }}>
            ✉ {c.contact || "say hi any time"}
          </div>
        )}
      </div>
      {outro > 0 && (
        <Svg>
          <Txt text={name} x={960} y={540} size={150} weight={900} color={pal.fg} font={ff} p={c01((t - 8.4) / 0.6)} tracking={-0.04} mode="scale" />
        </Svg>
      )}
      <Track src="tracks/hello-intro.wav" on={audio} />
    </AbsoluteFill>
  );
}
