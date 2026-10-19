import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { Svg, Track, Txt, c01, expInOut, expOut, fit, fontOf, hash, lerp, nameOf, palette, seg, spring, useT } from "../../motion";

type C = { tagline: string };

// A little story for a word-puzzle app: a lonely wooden "A" tile looks
// around, then C and T hop in to make CAT, M and P drop in to cross it with
// MAP, U and P land to spell CUP and UP, the whole grid cheers, and the
// camera pulls back to reveal it was today's puzzle on a phone.
const CELL = 168;
type Tile = { ch: string; gx: number; gy: number; at: number; from: "left" | "right" | "top" | "bottom" | "here" };
const TILES: Tile[] = [
  { ch: "A", gx: 0, gy: 0, at: 0, from: "here" },
  { ch: "C", gx: -1, gy: 0, at: 1.6, from: "left" },
  { ch: "T", gx: 1, gy: 0, at: 1.85, from: "right" },
  { ch: "M", gx: 0, gy: -1, at: 3.2, from: "top" },
  { ch: "P", gx: 0, gy: 1, at: 3.45, from: "bottom" },
  { ch: "U", gx: -1, gy: 1, at: 4.6, from: "left" },
  { ch: "P", gx: -1, gy: 2, at: 4.85, from: "bottom" },
];
const WORDS = [
  { cells: [[-1, 0], [0, 0], [1, 0]], at: 2.3 },
  { cells: [[0, -1], [0, 0], [0, 1]], at: 3.9 },
  { cells: [[-1, 0], [-1, 1], [-1, 2]], at: 5.3 },
  { cells: [[-1, 1], [0, 1]], at: 5.6 },
];

export default function LetterTileFriends({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const ff = fontOf(b);
  const name = nameOf(b);

  const zoom = lerp(1, 0.52, expInOut(seg(t, 7.4, 0.9)));
  const phone = expOut(seg(t, 7.6, 0.7));
  const nameP = c01((t - 8.3) / 0.6);
  const cheer = (i: number) => (t > 6.2 && t < 7.4 ? Math.abs(Math.sin((t - 6.2) * 9 - i * 0.6)) * 40 : 0);
  const lit = (gx: number, gy: number) => WORDS.some((w) => t > w.at && w.cells.some(([x, y]) => x === gx && y === gy));

  const OX = 960;
  const OY = 440;

  return (
    <AbsoluteFill style={{ background: pal.dark ? "#1d2a24" : "#dff0e6", overflow: "hidden", fontFamily: ff }}>
      {/* phone frame reveals as the camera pulls back */}
      <div style={{ position: "absolute", left: 960 - 270, top: 120, width: 540, height: 900, borderRadius: 60, border: "16px solid #111", background: pal.dark ? "#14201a" : "#f5fbf7", opacity: phone, transform: `scale(${lerp(1.6, 1, phone)})` }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 40, textAlign: "center", fontSize: 30, fontWeight: 800, color: pal.fg }}>Daily puzzle</div>
        <div style={{ position: "absolute", left: 40, right: 40, bottom: 60, padding: "18px 0", borderRadius: 20, background: pal.p, color: pal.onP, textAlign: "center", fontSize: 28, fontWeight: 800, opacity: c01((t - 8.0) / 0.4) }}>Solved in 1:42 ✓</div>
      </div>
      <Svg>
        <g transform={`translate(${OX} ${OY + (1 - zoom) * 120}) scale(${zoom}) translate(${-OX} ${-OY})`}>
          {/* table shadow under the grid */}
          <ellipse cx={OX} cy={OY + 520} rx={520} ry={40} fill="#000" opacity={0.08 * (1 - phone)} />
          {TILES.map((tile, i) => {
            const land = tile.from === "here" ? 1 : spring(t - tile.at, 13, 0.62);
            const fx = tile.from === "left" ? -1200 : tile.from === "right" ? 1200 : 0;
            const fy = tile.from === "top" ? -1000 : tile.from === "bottom" ? 1000 : 0;
            const hop = tile.from === "left" || tile.from === "right" ? Math.sin(c01((t - tile.at) / 0.5) * Math.PI) * 120 : 0;
            const x = OX + tile.gx * CELL + fx * (1 - land);
            const y = OY + tile.gy * CELL + fy * (1 - land) - hop - cheer(i);
            // the lonely A looks around, then sighs; later everyone smiles
            const alone = i === 0 && t < 1.6;
            const look = alone ? Math.sin(t * 2.6) * 10 : t > 1.6 && t < 2.3 ? -8 : 0;
            const squash = alone && t > 0.9 && t < 1.4 ? 1 - Math.sin(((t - 0.9) / 0.5) * Math.PI) * 0.12 : 1;
            const happy = lit(tile.gx, tile.gy) || t > 6.2;
            const glow = happy ? 1 : 0;
            return (
              <g key={i} transform={`translate(${x} ${y}) scale(${1 / squash} ${squash})`}>
                <rect x={-72} y={-68} width={144} height={144} rx={20} fill="#000" opacity={0.18} />
                <rect x={-74} y={-76} width={148} height={148} rx={22} fill={glow ? pal.p : "#e8c48a"} />
                <rect x={-66} y={-70} width={132} height={132} rx={18} fill={glow ? pal.a : "#f3d9a8"} />
                {/* wood grain */}
                {[0, 1, 2].map((k) => (
                  <path key={k} d={`M-60,${-40 + k * 34} C-20,${-50 + k * 34 + hash(i, k) * 10} 20,${-30 + k * 34} 60,${-42 + k * 34}`} stroke="#c9a46a" strokeWidth={2} fill="none" opacity={0.5} />
                ))}
                <text x={0} y={42} textAnchor="middle" fontFamily={ff} fontSize={96} fontWeight={900} fill="#3a2a16">
                  {tile.ch}
                </text>
                <circle cx={-22 + look} cy={-38} r={8} fill="#3a2a16" />
                <circle cx={22 + look} cy={-38} r={8} fill="#3a2a16" />
                {happy ? <path d="M-14,-18 Q0,-6 14,-18" stroke="#3a2a16" strokeWidth={4} fill="none" strokeLinecap="round" /> : <path d="M-10,-14 L10,-14" stroke="#3a2a16" strokeWidth={4} strokeLinecap="round" />}
              </g>
            );
          })}
          {/* word sparkles */}
          {WORDS.map((w, k) => {
            const p = c01((t - w.at) / 0.6);
            if (p <= 0 || p >= 1) return null;
            const [x0, y0] = w.cells[0];
            const [x1, y1] = w.cells[w.cells.length - 1];
            return <rect key={k} x={OX + Math.min(x0, x1) * CELL - 90} y={OY + Math.min(y0, y1) * CELL - 92} width={(Math.abs(x1 - x0) + 1) * CELL + 12} height={(Math.abs(y1 - y0) + 1) * CELL + 12} rx={30} fill="none" stroke={pal.p} strokeWidth={8} opacity={1 - p} />;
          })}
          {/* confetti letters */}
          {t > 6.2 &&
            Array.from({ length: 30 }).map((_, i) => {
              const k = c01((t - 6.2 - hash(i, 1) * 0.4) / 1.4);
              const a = hash(i, 2) * Math.PI * 2;
              return (
                <text key={i} x={OX + Math.cos(a) * 600 * k} y={OY + 200 + Math.sin(a) * 300 * k - 300 * k + 400 * k * k} fontFamily={ff} fontSize={40} fontWeight={900} fill={[pal.p, pal.a, "#e8a33a"][i % 3]} opacity={1 - k} textAnchor="middle">
                  {"ABCDEFGHIJKLMNOPRSTUW"[i % 21]}
                </text>
              );
            })}
        </g>
        {nameP > 0 && (
          <>
            <Txt text={name} x={1500} y={480} size={fit(name, 640, 120, 900)} weight={900} color={pal.fg} font={ff} p={nameP} tracking={-0.04} />
            <Txt text={c.tagline || "Every word needs a friend"} x={1500} y={560} size={36} weight={600} color={pal.muted} font={ff} p={c01((t - 8.7) / 0.5)} mode="fade" />
          </>
        )}
      </Svg>
      <Track src="tracks/letter-tile-friends.wav" on={audio} />
    </AbsoluteFill>
  );
}
