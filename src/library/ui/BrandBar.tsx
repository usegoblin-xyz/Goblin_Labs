import { FONTS, MOTIONS, PRESETS, type Brand, type FontKey, type MotionKey } from "../brand";

type Props = { brand: Brand; onChange: (b: Brand) => void };

const COLOR_FIELDS: { key: keyof Brand; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "accent", label: "Accent" },
  { key: "background", label: "Background" },
  { key: "foreground", label: "Text" },
];

function Swatch({ value, label, onChange }: { value: string; label: string; onChange: (v: string) => void }) {
  return (
    <label className="group flex cursor-pointer items-center gap-2" title={label}>
      <span
        className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-white/20 transition-transform group-hover:scale-110"
        style={{ background: value }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={`${label} color`}
        />
      </span>
      <span className="hidden text-[12px] text-white/60 2xl:inline">{label}</span>
    </label>
  );
}

// The brand kit editor. Every preview on the page reads from this one object.
export function BrandBar({ brand, onChange }: Props) {
  const set = <K extends keyof Brand>(k: K, v: Brand[K]) => onChange({ ...brand, [k]: v });

  return (
    <div className="rounded-2xl border border-white/12 bg-[#0b0b0b]/90 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-md sm:p-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#22A03A]">Your brand</span>
        </div>

        <input
          value={brand.name}
          onChange={(e) => set("name", e.target.value.slice(0, 24))}
          placeholder="Product name"
          aria-label="Product name"
          className="h-9 w-[150px] rounded-lg border border-white/12 bg-white/[0.04] px-3 text-[14px] text-white outline-none placeholder:text-white/35 focus:border-[#22A03A]"
        />

        <div className="flex items-center gap-3">
          {COLOR_FIELDS.map((f) => (
            <Swatch key={f.key} label={f.label} value={brand[f.key] as string} onChange={(v) => set(f.key, v as never)} />
          ))}
        </div>

        <select
          value={brand.font}
          onChange={(e) => set("font", e.target.value as FontKey)}
          aria-label="Font"
          className="h-9 rounded-lg border border-white/12 bg-white/[0.04] px-2 text-[14px] text-white outline-none focus:border-[#22A03A]"
        >
          {(Object.keys(FONTS) as FontKey[]).map((k) => (
            <option key={k} value={k} className="bg-black">
              {FONTS[k].label}
            </option>
          ))}
        </select>

        <div className="flex rounded-lg border border-white/12 p-0.5" role="radiogroup" aria-label="Motion feel">
          {(Object.keys(MOTIONS) as MotionKey[]).map((k) => (
            <button
              key={k}
              role="radio"
              aria-checked={brand.motion === k}
              onClick={() => set("motion", k)}
              className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                brand.motion === k ? "bg-white text-black" : "text-white/60 hover:text-white"
              }`}
            >
              {MOTIONS[k].label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 lg:ml-auto">
          <span className="mr-1 text-[12px] text-white/45">Try</span>
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => onChange(p)}
              title={p.name}
              aria-label={`Use ${p.name} preset`}
              className={`h-7 w-7 rounded-full border transition-transform hover:scale-110 ${
                brand.name === p.name && brand.primary === p.primary ? "border-white" : "border-white/20"
              }`}
              style={{ background: `linear-gradient(135deg, ${p.background} 50%, ${p.primary} 50%)` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
