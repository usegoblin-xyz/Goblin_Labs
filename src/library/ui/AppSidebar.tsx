import { useEffect, useRef, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { BarChart3, Bookmark, BookOpen, Clapperboard, LayoutGrid, Lightbulb, Monitor, Rocket, Search, Smartphone, Sparkles, SquarePen, Square } from "lucide-react";
import goblinLogo from "@/assets/goblin-logo.png";
import { useAuth } from "@/app/lib/auth";
import { AccountMenu } from "@/app/lib/AccountMenu";
import { openCookieSettings } from "@/app/lib/CookieBanner";
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

export const slugOf = (c: Category) => c.toLowerCase();

type Props = {
  categories: Category[];
  counts: Record<string, number>;
  total: number;
  formatCounts: Record<Format, number>;
  savedCount: number;
  onNavigate?: () => void; // closes the mobile drawer
};

function Item({ to, icon, label, count, active, onClick }: { to: string; icon: ReactNode; label: string; count?: number; active?: boolean; onClick?: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-[7px] text-[14px] transition-colors ${
        active ? "bg-white/[0.08] font-medium text-white" : "text-white/65 hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      <span className={active ? "text-white" : "text-white/55"}>{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && <span className="text-[12px] tabular-nums text-white/45">{count}</span>}
    </Link>
  );
}

const Heading = ({ children }: { children: ReactNode }) => <div className="mt-5 mb-1 px-3 text-[12px] font-medium text-white/45">{children}</div>;

// The app's left panel: new chat, search, and a link to every part of the library.
export function AppSidebar(p: Props) {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();
  const searchRef = useRef<HTMLInputElement>(null);
  const format = (params.get("format") as Format) || "any";
  const inLibrary = pathname.startsWith("/library");
  const q = inLibrary ? params.get("q") ?? "" : "";

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

  // Searching always searches the whole library.
  const search = (value: string) => {
    const next = new URLSearchParams();
    if (value) next.set("q", value);
    navigate(`/library${next.toString() ? `?${next}` : ""}`, { replace: inLibrary && pathname === "/library" });
  };

  const ic = "h-[17px] w-[17px]";
  const done = p.onNavigate;
  const formatTo = (f: Format) => (format === f ? "/library" : `/library?format=${encodeURIComponent(f)}`);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
        <Link to="/" onClick={done} className="flex items-center gap-2.5">
          <img src={goblinLogo} alt="" className="h-7 w-7 rounded-md" />
          <span className="text-[15px] font-semibold tracking-tight">Goblin</span>
        </Link>
      </div>

      <div className="px-3">
        <Link
          to="/"
          onClick={() => {
            window.dispatchEvent(new Event("goblin:new-chat"));
            done?.();
          }}
          className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-[14px] font-medium transition-colors ${
            pathname === "/" ? "border-white/15 bg-white/[0.06] text-white" : "border-white/10 text-white/80 hover:border-white/20 hover:text-white"
          }`}
        >
          <SquarePen className="h-4 w-4 text-[#5fd67a]" /> New chat
        </Link>
        <label className="relative mt-2 block">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/45" />
          <input
            ref={searchRef}
            value={q}
            onChange={(e) => search(e.target.value)}
            placeholder="Search templates"
            aria-label="Search templates"
            className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] pr-11 pl-9 text-[13.5px] outline-none placeholder:text-white/40 focus:border-[#22A03A]"
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] text-white/35">⌘K</span>
        </label>
      </div>

      <nav className="mt-2 min-h-0 flex-1 overflow-y-auto px-3 pb-4" aria-label="Library">
        <div className="space-y-0.5">
          <Item to="/library" icon={<LayoutGrid className={ic} />} label="All templates" count={p.total} active={pathname === "/library" && format === "any" && !q} onClick={done} />
          <Item to="/library/saved" icon={<Bookmark className={ic} />} label="Saved" count={p.savedCount} active={pathname === "/library/saved"} onClick={done} />
          {isSignedIn && <Item to="/library/creations" icon={<Sparkles className={ic} />} label="Your creations" active={pathname === "/library/creations"} onClick={done} />}
        </div>

        <Heading>Explore</Heading>
        <div className="space-y-0.5">
          {p.categories.map((c) => {
            const Icon = CATEGORY_ICONS[c];
            return <Item key={c} to={`/library/${slugOf(c)}`} icon={<Icon className={ic} />} label={c} count={p.counts[c] ?? 0} active={pathname === `/library/${slugOf(c)}`} onClick={done} />;
          })}
        </div>

        <Heading>Format</Heading>
        <div className="space-y-0.5">
          <Item to={formatTo("16:9")} icon={<Monitor className={ic} />} label="Landscape 16:9" count={p.formatCounts["16:9"]} active={inLibrary && format === "16:9"} onClick={done} />
          <Item to={formatTo("9:16")} icon={<Smartphone className={ic} />} label="Vertical 9:16" count={p.formatCounts["9:16"]} active={inLibrary && format === "9:16"} onClick={done} />
          {p.formatCounts["1:1"] > 0 && <Item to={formatTo("1:1")} icon={<Square className={ic} />} label="Square 1:1" count={p.formatCounts["1:1"]} active={inLibrary && format === "1:1"} onClick={done} />}
        </div>
      </nav>

      <div className="border-t border-white/8 px-3 py-3">
        {isLoaded && isSignedIn ? (
          <AccountMenu />
        ) : (
          <div>
            {/* Signed out: one clear call to sign in, then a quiet line of links. */}
            <Link
              to="/login"
              onClick={done}
              className={`flex h-9 w-full items-center justify-center rounded-lg bg-white text-[13.5px] font-semibold text-black transition hover:opacity-90 ${isLoaded ? "" : "invisible"}`}
            >
              Sign in
            </Link>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 px-1 text-[11.5px] text-white/40">
              <a href="https://goblinlabs.substack.com" target="_blank" rel="noreferrer" className="hover:text-white/75">Newsletter</a>
              <span aria-hidden>·</span>
              <Link to="/terms" className="hover:text-white/75">Terms</Link>
              <span aria-hidden>·</span>
              <Link to="/privacy" className="hover:text-white/75">Privacy</Link>
              <span aria-hidden>·</span>
              <button onClick={openCookieSettings} className="text-[11.5px] leading-normal font-normal text-white/40 hover:text-white/75">Cookies</button>
            </div>
            <div className="mt-1 text-center text-[11px] text-white/25">© 2026 GoblinLabs Inc.</div>
          </div>
        )}
      </div>
    </div>
  );
}
