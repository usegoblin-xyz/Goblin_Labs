import { useEffect, useRef, type ReactNode } from "react";
import {
  BarChart3,
  Bookmark,
  BookOpen,
  Clapperboard,
  Film,
  LayoutGrid,
  Lightbulb,
  Monitor,
  Palette,
  Rocket,
  Search,
  Smartphone,
  Sparkles,
  Square,
  Wand2,
} from "lucide-react";
import type { Category } from "../kit";

export type Format = "any" | "16:9" | "9:16" | "1:1";

export const CATEGORY_ICONS: Record<Category, typeof Rocket> = {
  Launch: Rocket,
  Product: LayoutGrid,
  Data: BarChart3,
  Explainer: Lightbulb,
  Social: Smartphone,
  Brand: Sparkles,
  Showreel: Clapperboard,
  Story: BookOpen,
};

type Props = {
  query: string;
  onQuery: (q: string) => void;
  category: "All" | Category;
  onCategory: (c: "All" | Category) => void;
  categories: Category[];
  counts: Record<string, number>;
  total: number;
  format: Format;
  onFormat: (f: Format) => void;
  formatCounts: Record<Format, number>;
  savedOnly: boolean;
  onSaved: () => void;
  savedCount: number;
  onBrandKit: () => void;
  onRender: () => void;
};

function Item({ icon, label, count, active, onClick, badge }: { icon: ReactNode; label: string; count?: number; active?: boolean; onClick: () => void; badge?: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[14px] transition-colors ${
        active ? "bg-white/[0.08] font-medium text-white" : "text-white/65 hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      <span className={active ? "text-white" : "text-white/50"}>{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge && <span className="rounded-md bg-[#22A03A]/15 px-1.5 py-0.5 text-[11px] font-medium text-[#5fd67a]">{badge}</span>}
      {count !== undefined && <span className="text-[12px] tabular-nums text-white/35">{count}</span>}
    </button>
  );
}

const Heading = ({ children }: { children: ReactNode }) => (
  <div className="mt-5 mb-1 px-3 text-[12px] font-medium text-white/40">{children}</div>
);

// 21st.dev-style left rail for the library: search, sections, formats, saved.
export function LibrarySidebar(p: Props) {
  const searchRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K focuses the search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ic = "h-[17px] w-[17px]";
  return (
    <aside className="hidden w-[232px] shrink-0 lg:block">
      <div className="sticky top-[150px] max-h-[calc(100vh-170px)] overflow-y-auto pr-1 pb-6">
        <label className="relative block">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            ref={searchRef}
            value={p.query}
            onChange={(e) => p.onQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search templates"
            className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] pr-12 pl-9 text-[14px] outline-none placeholder:text-white/35 focus:border-[#22A03A]"
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[12px] text-white/30">⌘K</span>
        </label>

        <div className="mt-3 space-y-0.5">
          <Item icon={<LayoutGrid className={ic} />} label="All templates" count={p.total} active={p.category === "All" && !p.savedOnly && p.format === "any"} onClick={() => { p.onCategory("All"); p.onFormat("any"); }} />
          <Item icon={<Bookmark className={ic} />} label="Saved" count={p.savedCount} active={p.savedOnly} onClick={p.onSaved} />
        </div>

        <Heading>Explore</Heading>
        <div className="space-y-0.5">
          {p.categories.map((c) => {
            const Icon = CATEGORY_ICONS[c];
            return <Item key={c} icon={<Icon className={ic} />} label={c} count={p.counts[c] ?? 0} active={!p.savedOnly && p.category === c} onClick={() => p.onCategory(c)} />;
          })}
        </div>

        <Heading>Format</Heading>
        <div className="space-y-0.5">
          <Item icon={<Monitor className={ic} />} label="Landscape 16:9" count={p.formatCounts["16:9"]} active={p.format === "16:9"} onClick={() => p.onFormat(p.format === "16:9" ? "any" : "16:9")} />
          <Item icon={<Smartphone className={ic} />} label="Vertical 9:16" count={p.formatCounts["9:16"]} active={p.format === "9:16"} onClick={() => p.onFormat(p.format === "9:16" ? "any" : "9:16")} />
          {p.formatCounts["1:1"] > 0 && <Item icon={<Square className={ic} />} label="Square 1:1" count={p.formatCounts["1:1"]} active={p.format === "1:1"} onClick={() => p.onFormat(p.format === "1:1" ? "any" : "1:1")} />}
        </div>

        <Heading>Build</Heading>
        <div className="space-y-0.5">
          <Item icon={<Palette className={ic} />} label="Brand kit" onClick={p.onBrandKit} />
          <Item icon={<Film className={ic} />} label="Render MP4" badge="Soon" onClick={p.onRender} />
          <Item icon={<Wand2 className={ic} />} label="How it works" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })} />
        </div>
      </div>
    </aside>
  );
}
