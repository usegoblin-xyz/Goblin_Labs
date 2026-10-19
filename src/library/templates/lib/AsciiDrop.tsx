import { AbsoluteFill } from "remotion";
import type { TemplateProps } from "../../kit";
import { MONO, Track, c01, mix, nameOf, palette, useT } from "../../motion";

type C = { title: string };

// A 140 BPM half-time bass track drawn in ASCII: a shaded torus spins and
// pulses on the kick through the build, the drop flips to wobbling block-
// character bars locked to the LFO, the torus comes back glitching, and your
// name lands as a block-letter banner.
const COLS = 145;
const ROWS = 44;
const CW = 13.2;
const CH = 24.5;
const BPM = 140;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const DROP = BAR * 2;
const SHADES = ".,-~:;=!*#$@";

const FONT: Record<string, string[]> = {
  A: [" ### ", "#   #", "#####", "#   #", "#   #"], B: ["#### ", "#   #", "#### ", "#   #", "#### "], C: [" ####", "#    ", "#    ", "#    ", " ####"],
  D: ["#### ", "#   #", "#   #", "#   #", "#### "], E: ["#####", "#    ", "#### ", "#    ", "#####"], F: ["#####", "#    ", "#### ", "#    ", "#    "],
  G: [" ####", "#    ", "#  ##", "#   #", " ####"], H: ["#   #", "#   #", "#####", "#   #", "#   #"], I: ["#####", "  #  ", "  #  ", "  #  ", "#####"],
  J: ["#####", "   # ", "   # ", "#  # ", " ##  "], K: ["#   #", "#  # ", "###  ", "#  # ", "#   #"], L: ["#    ", "#    ", "#    ", "#    ", "#####"],
  M: ["#   #", "## ##", "# # #", "#   #", "#   #"], N: ["#   #", "##  #", "# # #", "#  ##", "#   #"], O: [" ### ", "#   #", "#   #", "#   #", " ### "],
  P: ["#### ", "#   #", "#### ", "#    ", "#    "], Q: [" ### ", "#   #", "# # #", "#  # ", " ## #"], R: ["#### ", "#   #", "#### ", "#  # ", "#   #"],
  S: [" ####", "#    ", " ### ", "    #", "#### "], T: ["#####", "  #  ", "  #  ", "  #  ", "  #  "], U: ["#   #", "#   #", "#   #", "#   #", " ### "],
  V: ["#   #", "#   #", "#   #", " # # ", "  #  "], W: ["#   #", "#   #", "# # #", "## ##", "#   #"], X: ["#   #", " # # ", "  #  ", " # # ", "#   #"],
  Y: ["#   #", " # # ", "  #  ", "  #  ", "  #  "], Z: ["#####", "   # ", "  #  ", " #   ", "#####"], " ": ["   ", "   ", "   ", "   ", "   "],
  "0": [" ### ", "#  ##", "# # #", "##  #", " ### "], "1": ["  #  ", " ##  ", "  #  ", "  #  ", " ### "], "2": ["#### ", "    #", " ### ", "#    ", "#####"],
  "3": ["#### ", "    #", " ### ", "    #", "#### "], "4": ["#   #", "#   #", "#####", "    #", "    #"], "5": ["#####", "#    ", "#### ", "    #", "#### "],
};

function donut(A: number, B: number, scale: number, glitch: number, seed: number) {
  const out: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(" "));
  const zb: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  const cA = Math.cos(A);
  const sA = Math.sin(A);
  const cB = Math.cos(B);
  const sB = Math.sin(B);
  const K2 = 5;
  const K1 = ((COLS * K2 * 3) / (8 * 3)) * 0.3 * scale;
  for (let th = 0; th < Math.PI * 2; th += 0.09) {
    const ct = Math.cos(th);
    const st = Math.sin(th);
    for (let ph = 0; ph < Math.PI * 2; ph += 0.03) {
      const cp = Math.cos(ph);
      const sp = Math.sin(ph);
      const cx = 2 + ct;
      const cy = st;
      const x = cx * (cB * cp + sA * sB * sp) - cy * cA * sB;
      const y = cx * (sB * cp - sA * cB * sp) + cy * cA * cB;
      const z = K2 + cA * cx * sp + cy * sA;
      const ooz = 1 / z;
      const xp = Math.floor(COLS / 2 + K1 * ooz * x);
      const yp = Math.floor(ROWS / 2 - K1 * ooz * y * (CW / CH));
      const L = cp * ct * sB - cA * ct * sp - sA * st + cB * (cA * st - ct * sA * sp);
      if (L > 0 && xp >= 0 && xp < COLS && yp >= 0 && yp < ROWS && ooz > zb[yp][xp]) {
        zb[yp][xp] = ooz;
        out[yp][xp] = SHADES[Math.min(11, Math.floor(L * 8))];
      }
    }
  }
  if (glitch > 0) {
    for (let r = 0; r < ROWS; r++) {
      const g = Math.sin(r * 12.9 + seed * 78.2) * 43758.5453;
      const f = g - Math.floor(g);
      if (f < glitch * 0.25) {
        const shift = Math.floor(f * 40) - 10;
        out[r] = [...out[r].slice(shift), ...out[r].slice(0, shift)];
      }
    }
  }
  return out.map((r) => r.join(""));
}

function banner(text: string) {
  const s = text.toUpperCase().replace(/[^A-Z0-9 ]/g, "");
  const width = s.split("").reduce((w, ch) => w + (FONT[ch] ?? FONT[" "])[0].length + 1, 0);
  const k = Math.max(1, Math.min(3, Math.floor((COLS - 4) / width)));
  const rows = Array.from({ length: 5 * k }, () => "");
  for (const ch of s) {
    const g = FONT[ch] ?? FONT[" "];
    for (let r = 0; r < 5; r++) {
      const line = g[r].replace(/#/g, "█") + " ";
      const wide = line.split("").map((q) => q.repeat(k)).join("");
      for (let j = 0; j < k; j++) rows[r * k + j] += wide;
    }
  }
  return rows;
}

export default function AsciiDrop({ brand: b, content: c, audio }: TemplateProps<C>) {
  const { t } = useT();
  const pal = palette(b);
  const name = nameOf(b);
  const beatPh = (t % BEAT) / BEAT;
  const kick = Math.exp(-beatPh * 5) * (Math.floor(t / BEAT) % 2 === 0 ? 1 : 0.4);
  let lines: string[];
  let label = "BUILD";
  const flash = Math.exp(-Math.max(0, t - DROP) * 6) * (t >= DROP ? 1 : 0);

  if (t < DROP) {
    lines = donut(t * 1.1, t * 0.6, 1 + kick * 0.12 + (t / DROP) * 0.15, 0, 0);
  } else if (t < DROP + BAR * 2) {
    label = "DROP";
    const lt = t - DROP;
    const lfo = 0.5 + 0.5 * Math.sin(lt * Math.PI * 2 * (BPM / 60) * 0.75);
    const grid: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(" "));
    for (let col = 0; col < COLS; col++) {
      const h = ROWS * (0.12 + 0.75 * lfo * Math.abs(Math.sin(col * 0.21 + lt * 2.2)) * (0.6 + 0.4 * Math.sin(col * 0.07 + lt * 9)));
      for (let r = 0; r < ROWS; r++) {
        const fromBottom = ROWS - 1 - r;
        if (fromBottom < h) {
          const k = fromBottom / Math.max(1, h);
          grid[r][col] = k > 0.85 ? "░" : k > 0.6 ? "▒" : k > 0.3 ? "▓" : "█";
        }
      }
    }
    if (Math.floor(lt / BEAT) % 4 === 3) {
      const wub = banner("WUB");
      const r0 = 4;
      wub.forEach((row, i) => {
        const c0 = Math.floor((COLS - row.length) / 2);
        for (let j = 0; j < row.length; j++) if (row[j] !== " " && grid[r0 + i]) grid[r0 + i][c0 + j] = row[j];
      });
    }
    lines = grid.map((r) => r.join(""));
  } else if (t < 8.57) {
    label = "BREAK";
    const g = c01((t - DROP - BAR * 2) / 1.0);
    lines = donut(t * 2.4, t * 1.3, 1.25 + kick * 0.2, 1 - g * 0.5, Math.floor(t * 12));
  } else {
    label = "OUTRO";
    const rows = banner(name);
    const top = Math.floor((ROWS - rows.length) / 2) - 2;
    const reveal = c01((t - 8.57) / 0.5);
    lines = Array.from({ length: ROWS }, (_, r) => {
      const i = r - top;
      if (i < 0 || i >= rows.length) return "";
      const row = rows[i];
      const pad = Math.floor((COLS - row.length) / 2);
      const n = Math.floor(row.length * reveal);
      return " ".repeat(Math.max(0, pad)) + row.slice(0, n);
    });
    const sub = (c.title || "140 BPM · bass music").toUpperCase();
    lines[top + rows.length + 3] = " ".repeat(Math.max(0, Math.floor((COLS - sub.length) / 2))) + sub.slice(0, Math.floor(sub.length * c01((t - 9.0) / 0.5)));
  }

  const ink = pal.p;
  return (
    <AbsoluteFill style={{ background: mix("#050505", ink, flash * 0.6), overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: COLS * CW, fontFamily: MONO, fontSize: 22, lineHeight: `${CH}px`, whiteSpace: "pre", color: ink }}>
        {lines.map((l, i) => (
          <div key={i} style={{ height: CH, color: mix(ink, "#ffffff", (i / ROWS) * 0.35), opacity: 0.75 + 0.25 * kick }}>
            {l}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 24, top: 18, fontFamily: MONO, fontSize: 22, color: "#ffffff", opacity: 0.55, whiteSpace: "pre" }}>
        {`▶ ${label.padEnd(6)}  ${BPM} BPM  ${"■".repeat(1 + (Math.floor(t / BEAT) % 4))}${"□".repeat(3 - (Math.floor(t / BEAT) % 4))}`}
      </div>
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0 2px, transparent 2px 4px)" }} />
      <Track src="tracks/ascii-drop.wav" on={audio} />
    </AbsoluteFill>
  );
}
