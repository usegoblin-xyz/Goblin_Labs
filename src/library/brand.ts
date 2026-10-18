// Brand kit: the one set of values every template reads. Templates never
// hard-code a color, font or easing — they take them from here, which is what
// lets one kit restyle the whole library.

export type FontKey = "inter" | "grotesk" | "serif" | "mono";
export type MotionKey = "snappy" | "smooth" | "bouncy";

export type Brand = {
  name: string;
  background: string; // #rrggbb
  foreground: string;
  primary: string;
  accent: string;
  font: FontKey;
  motion: MotionKey;
};

export const FONTS: Record<FontKey, { label: string; stack: string }> = {
  inter: { label: "Inter", stack: 'Inter, "Inter Variable", system-ui, sans-serif' },
  grotesk: { label: "Space Grotesk", stack: '"Space Grotesk", "Space Grotesk Variable", Inter, sans-serif' },
  serif: { label: "Instrument Serif", stack: '"Instrument Serif", Georgia, serif' },
  mono: { label: "JetBrains Mono", stack: '"JetBrains Mono", "JetBrains Mono Variable", ui-monospace, monospace' },
};

export const MOTIONS: Record<
  MotionKey,
  { label: string; config: { damping: number; stiffness: number; mass: number } }
> = {
  snappy: { label: "Snappy", config: { damping: 18, stiffness: 220, mass: 0.6 } },
  smooth: { label: "Smooth", config: { damping: 200, stiffness: 90, mass: 1 } },
  bouncy: { label: "Bouncy", config: { damping: 9, stiffness: 130, mass: 0.8 } },
};

export const PRESETS: Brand[] = [
  {
    name: "Goblin",
    background: "#050505",
    foreground: "#f5f5f2",
    primary: "#22a03a",
    accent: "#b6f09c",
    font: "inter",
    motion: "snappy",
  },
  {
    name: "Northwind",
    background: "#0b1020",
    foreground: "#e8ecff",
    primary: "#7c8cff",
    accent: "#3dd6d0",
    font: "grotesk",
    motion: "smooth",
  },
  {
    name: "Ledger",
    background: "#f4f1ea",
    foreground: "#161513",
    primary: "#e5482b",
    accent: "#1f4bff",
    font: "serif",
    motion: "smooth",
  },
  {
    name: "Stackline",
    background: "#ffffff",
    foreground: "#0a0a0a",
    primary: "#0a0a0a",
    accent: "#ff5c00",
    font: "mono",
    motion: "snappy",
  },
  {
    name: "Bloom",
    background: "#1a0f14",
    foreground: "#ffefe6",
    primary: "#ff7a45",
    accent: "#ffc24b",
    font: "grotesk",
    motion: "bouncy",
  },
];

export const DEFAULT_BRAND = PRESETS[0];

// ---- color helpers ---------------------------------------------------------

function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0");
  const n = parseInt(full.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function alpha(hex: string, a: number): string {
  const [r, g, b] = rgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// Readable text color to sit on top of `hex`.
export function onColor(hex: string): string {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.4 ? "#0a0a0a" : "#ffffff";
}
