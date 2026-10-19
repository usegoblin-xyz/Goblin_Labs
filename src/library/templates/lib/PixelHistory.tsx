import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { MONO, Track, c01, expInOut, fontOf, kf, nameOf, palette, seg, useT } from "../../motion";

type C = { eras: string; years: string; outro: string };

// A pixel-art history scroller: a little pixel walker strolls right along a
// ground line past five era signposts, each with its own 8-bit sprite (a
// punch card, a chat bubble, a neural net, a stack of books, a glowing
// brain); a dialog box narrates each stop in a typewriter font.
const SPR: Record<string, string[]> = {
  card: ["XXXXXXXXXX", "X.X.X..X.X", "XX.X.XX..X", "X..X.X.X.X", "X.X..X.X.X", "XXXXXXXXXX"],
  chat: [".XXXXXXXX.", "X........X", "X.X.X.X..X", "X........X", ".XXXXXXXX.", "..XX......", ".X........"],
  net: ["X...X...X.", ".X.X.X.X..", "..X...X...", ".X.X.X.X..", "X...X...X.", "....X....."],
  books: ["XX.XX.XXX.", "XX.XX.XXX.", "XX.XX.XXX.", "XX.XX.XXX.", "XXXXXXXXXX", "XXXXXXXXXX"],
  brain: ["..XXXXX...", ".X.X.X.X..", "X.X.X.X.X.", "X.XX.XX.X.", ".X.X.X.X..", "..XXXXX...", "....X....."],
  walk0: ["..XX..", "..XX..", ".XXXX.", "X.XX.X", "..XX..", ".X..X.", ".X..X."],
  walk1: ["..XX..", "..XX..", ".XXXX.", "X.XX.X", "..XX..", "..XX..", ".X.X.."],
};
function Sprite({ name, x, y, px, color }: { name: string; x: number; y: number; px: number; color: string }) {
  const rows = SPR[name];
  return (
    <g transform={`translate(${x} ${y})`}>
      {rows.flatMap((r, j) => r.split("").map((ch, i) => (ch === "X" ? <rect key={`${i}-${j}`} x={i * px} y={j * px} width={px} height={px} fill={color} /> : null)))}
    </g>
  );
}

export default function PixelHistory({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const eras = [...list(c.eras || "Rules and punch cards, The first chatbots, Neural networks, Reading the internet, Models that reason"), "Era", "Era", "Era", "Era", "Era"].slice(0, 5);
  const years = [...list(c.years || "1950s, 1966, 1980s, 2018, Today"), "", "", "", "", ""].slice(0, 5);
  const sprites = ["card", "chat", "net", "books", "brain"];
  const colors = ["#9bbc0f", "#f8b800", "#3cbcfc", "#f878f8", "#fc7460"];
  const P = 8; // pixel size
  const stopAt = (i: number) => 0.6 + i * 1.8;
  // camera x follows the walker; walker stops at each post for a moment
  const keys: [number, number][] = [[0, 0]];
  for (let i = 0; i < 5; i++) keys.push([stopAt(i), i * 900], [stopAt(i) + 1.1, i * 900]);
  const camX = kf(t, keys, (u) => u);
  const walking = keys.some((_, k) => k > 0 && k % 2 === 1 && false) || ![0, 1, 2, 3, 4].some((i) => t > stopAt(i) && t < stopAt(i) + 1.1);
  const frameW = Math.floor(t * 8) % 2 ? "walk0" : "walk1";
  const cur = Math.max(0, Math.min(4, [0, 1, 2, 3, 4].filter((i) => t > stopAt(i) - 0.1).length - 1));
  const txt = `${years[cur]} — ${eras[cur]}`;
  const typed = txt.slice(0, Math.floor(c01((t - stopAt(cur)) / 0.6) * txt.length));
  const outro = expInOut(seg(t, 9.9, 0.5));
  const endP = c01((t - 10.2) / 0.6);
  const sky = "#1a1c2c";

  return (
    <AbsoluteFill style={{ background: sky, overflow: "hidden", fontFamily: ff, imageRendering: "pixelated" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - outro }}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" shapeRendering="crispEdges" style={{ position: "absolute", inset: 0 }}>
          {/* stars */}
          {Array.from({ length: 60 }, (_, i) => (
            <rect key={i} x={((i * 173) % 1920 - camX * 0.1 + 3840) % 1920} y={(i * 97) % 520} width={P / 2} height={P / 2} fill="#f4f4f4" opacity={(Math.floor(t * 3 + i) % 4) / 4 + 0.2} />
          ))}
          {/* far hills */}
          {Array.from({ length: 30 }, (_, i) => {
            const x = ((i * 200 - camX * 0.4) % 6000 + 6000) % 6000 - 400;
            return <rect key={i} x={x} y={640 - (i % 3) * 40} width={240} height={400} fill="#333c57" />;
          })}
          {/* ground */}
          <rect x={0} y={800} width={1920} height={280} fill="#38b764" />
          <rect x={0} y={800} width={1920} height={P * 2} fill="#a7f070" />
          {Array.from({ length: 40 }, (_, i) => (
            <rect key={i} x={((i * 96 - camX) % 1920 + 1920) % 1920} y={850 + (i % 3) * 40} width={P * 2} height={P} fill="#257179" />
          ))}
          {/* signposts and sprites */}
          {eras.map((_, i) => {
            const x = 960 + i * 900 - camX + 260;
            if (x < -400 || x > 2300) return null;
            return (
              <g key={i}>
                <rect x={x - P} y={640} width={P * 2} height={160} fill="#8b5a2b" />
                <rect x={x - 70} y={600} width={140} height={60} fill="#c08040" />
                <text x={x} y={642} textAnchor="middle" fontFamily={MONO} fontSize={28} fontWeight={700} fill="#1a1c2c">
                  {years[i]}
                </text>
                <Sprite name={sprites[i]} x={x - 5 * P * 2} y={380 + Math.round(Math.sin(t * 3 + i) * 2) * P} px={P * 2} color={colors[i]} />
              </g>
            );
          })}
          {/* walker */}
          <Sprite name={walking ? frameW : "walk0"} x={960 - 3 * P * 2 - 120} y={800 - 7 * P * 2} px={P * 2} color={pal.v} />
        </svg>
        {/* dialog box */}
        <div style={{ position: "absolute", left: 120, right: 120, top: 70, padding: "30px 40px", border: "8px solid #f4f4f4", background: "#1a1c2c", fontFamily: MONO, fontSize: 44, color: "#f4f4f4", lineHeight: 1.3, boxShadow: "8px 8px 0 #000" }}>
          {typed}
          <span style={{ opacity: Math.floor(t * 3) % 2 }}>▮</span>
        </div>
        <div style={{ position: "absolute", right: 140, top: 210, fontFamily: MONO, fontSize: 26, color: "#94b0c2" }}>
          STAGE {cur + 1}/5
        </div>
      </div>
      {endP > 0 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: MONO }}>
          <div style={{ fontSize: 76, color: "#f4f4f4", opacity: endP, letterSpacing: "0.04em" }}>{c.outro || "TO BE CONTINUED..."}</div>
          <div style={{ fontSize: 40, color: pal.v, marginTop: 30, opacity: c01((t - 10.5) / 0.4) }}>{nameOf(b).toUpperCase()}</div>
        </AbsoluteFill>
      )}
      <Track src="tracks/pixel-history.wav" on={audio} />
    </AbsoluteFill>
  );
}
