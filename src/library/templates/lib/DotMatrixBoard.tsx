import { AbsoluteFill } from "remotion";
import { list, type TemplateProps } from "../../kit";
import { Track, c01, expInOut, nameOf, palette, seg, useT } from "../../motion";

type C = { messages: string; role: string };

// An LED dot-matrix board reel: a wide board of unlit dots powers on in a
// sweep; messages scroll across in glowing dots, one flips in row by row like
// a split-flap, one sparkles in randomly; the last message is the name.
const GL: Record<string, string> = {
  A: "01110100011000111111100011000110001", B: "11110100011000111110100011000111110", C: "01110100011000010000100001000101110", D: "11110100011000110001100011000111110",
  E: "11111100001000011110100001000011111", F: "11111100001000011110100001000010000", G: "01110100011000010111100011000101111", H: "10001100011000111111100011000110001",
  I: "01110001000010000100001000010001110", J: "00111000100001000010000101001001100", K: "10001100101010011000101001001010001", L: "10000100001000010000100001000011111",
  M: "10001110111010110101100011000110001", N: "10001100011100110101100111000110001", O: "01110100011000110001100011000101110", P: "11110100011000111110100001000010000",
  Q: "01110100011000110001101011001001101", R: "11110100011000111110101001001010001", S: "01111100001000001110000010000111110", T: "11111001000010000100001000010000100",
  U: "10001100011000110001100011000101110", V: "10001100011000110001100010101000100", W: "10001100011000110101101011101110001", X: "10001100010101000100010101000110001",
  Y: "10001100010101000100001000010000100", Z: "11111000010001000100010001000011111", "0": "01110100011001110101110011000101110", "1": "00100011000010000100001000010001110",
  "2": "01110100010000100010001000100011111", "3": "11111000100010000010000011000101110", "4": "00010001100101010010111110001000010", "5": "11111100001111000001000011000101110",
  "6": "00110010001000011110100011000101110", "7": "11111000010001000100010000100001000", "8": "01110100011000101110100011000101110", "9": "01110100011000101111000010001001100",
  "!": "00100001000010000100001000000000100", ".": "00000000000000000000000000000000100", "-": "00000000000000011111000000000000000", " ": "00000000000000000000000000000000000",
};
const COLS = 96;
const ROWS = 9;
function bitmap(msg: string) {
  const s = msg.toUpperCase();
  const w = s.length * 6;
  const m: boolean[][] = Array.from({ length: ROWS }, () => Array(w).fill(false));
  [...s].forEach((ch, ci) => {
    const g = GL[ch] ?? GL[" "];
    for (let r = 0; r < 7; r++) for (let q = 0; q < 5; q++) if (g[r * 5 + q] === "1") m[r + 1][ci * 6 + q] = true;
  });
  return { m, w };
}

export default function DotMatrixBoard({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const msgs = [...list(c.messages || "NOW BOARDING, ALL WORK - NO NOISE, MADE WITH LIGHT"), "HELLO", "HELLO", "HELLO"].slice(0, 3);
  const name = nameOf(b).toUpperCase().slice(0, 15);
  const cell = 1800 / COLS;
  const r = cell * 0.36;
  const power = c01(t / 0.9);
  // segments: 0 scroll, 1 split-flap rows, 2 sparkle, 3 name (centred)
  const segAt = [1.0, 4.0, 5.8, 7.6];
  const s = t < segAt[1] ? 0 : t < segAt[2] ? 1 : t < segAt[3] ? 2 : 3;
  const u = t - segAt[s];
  const text = s === 3 ? name : msgs[s];
  const { m, w } = bitmap(text);
  const centred = Math.floor((COLS - w) / 2);
  const off = s === 0 ? Math.round(COLS - u * 34) : centred;
  const lit = (q: number, row: number) => {
    if (t < segAt[0]) return false;
    const x = q - off;
    if (x < 0 || x >= w || !m[row][x]) return false;
    if (s === 1) return row < c01(u / 0.8) * ROWS;
    if (s === 2) return ((q * 7 + row * 13) % 23) / 23 < c01(u / 0.9);
    if (s === 3) return c01(u / 0.5) > ((q + row) % 10) / 10;
    return true;
  };
  const outro = expInOut(seg(t, 9.6, 0.5));
  const amber = pal.v;

  return (
    <AbsoluteFill style={{ background: "#0b0b0d", overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
      <div style={{ opacity: 1 - outro, position: "relative", width: 1860, height: ROWS * cell + 60, borderRadius: 24, background: "#141416", boxShadow: "inset 0 0 0 6px #222, 0 30px 80px rgba(0,0,0,0.6)" }}>
        <svg width={1860} height={ROWS * cell + 60} viewBox={`0 0 1860 ${ROWS * cell + 60}`}>
          <defs>
            <filter id="dm-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {Array.from({ length: ROWS }, (_, row) =>
            Array.from({ length: COLS }, (_, q) => {
              const on = lit(q, row);
              const pw = q / COLS < power;
              return <circle key={`${row}-${q}`} cx={30 + q * cell + cell / 2} cy={30 + row * cell + cell / 2} r={r} fill={on ? amber : pw ? "#26262a" : "#18181b"} filter={on ? "url(#dm-glow)" : undefined} />;
            }),
          )}
        </svg>
      </div>
      {s === 3 && (
        <div style={{ position: "absolute", top: 760, color: "#8a8a90", fontSize: 40, letterSpacing: "0.2em", fontFamily: "monospace", opacity: c01((u - 0.6) * 2) * (1 - outro) }}>{(c.role || "Signs, screens & motion").toUpperCase()}</div>
      )}
      <Track src="tracks/dot-matrix-board.wav" on={audio} />
    </AbsoluteFill>
  );
}
