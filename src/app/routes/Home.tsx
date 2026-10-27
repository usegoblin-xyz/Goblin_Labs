import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Bookmark, Search } from "lucide-react";
import goblinLogo from "@/assets/goblin-logo.png";
import { DEFAULT_BRAND, type Brand } from "@/library/brand";
import type { Category, Template } from "@/library/kit";
import { CATEGORIES, TEMPLATES, aspectLabel, matches, seconds } from "@/library/registry";
import { BrandBar } from "@/library/ui/BrandBar";
import { LivePlayer } from "@/library/ui/LivePlayer";
import { TemplateDialog } from "@/library/ui/TemplateDialog";
import { LibrarySidebar, type Format } from "@/library/ui/LibrarySidebar";
import { NewsletterSignup } from "@/library/ui/NewsletterSignup";
import { track } from "@/app/lib/analytics";
import { UserButton, useAuth } from "@/app/lib/auth";

type Content = Record<string, string | number>;
const BRAND_KEY = "goblin_brand_kit";
const SAVED_KEY = "goblin.saved";

function loadSaved(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function loadBrand(): Brand {
  try {
    const raw = localStorage.getItem(BRAND_KEY);
    if (raw) return { ...DEFAULT_BRAND, ...JSON.parse(raw) };
  } catch {
    /* storage blocked — fall back to default */
  }
  return DEFAULT_BRAND;
}

const STEPS = [
  { n: "01", title: "Set your brand once", body: "Name, colors, font and motion feel. Every template reads from the same kit." },
  { n: "02", title: "Pick by outcome", body: "Launch intro, feature drop, changelog, traction post. Fill in your copy." },
  { n: "03", title: "Copy the prompt", body: "Paste it into Claude and get the video, built in your brand, ready to post." },
];

export default function Home() {
  const { isLoaded, isSignedIn } = useAuth();
  const [brand, setBrand] = useState<Brand>(loadBrand);
  const [overrides, setOverrides] = useState<Record<string, Content>>({});
  const [category, setCategory] = useState<"All" | Category>("All");
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState<Format>("any");
  const [savedOnly, setSavedOnly] = useState(false);
  const [saved, setSaved] = useState<string[]>(loadSaved);
  const toggleSave = (id: string) =>
    setSaved((s) => {
      const next = s.includes(id) ? s.filter((x) => x !== id) : [...s, id];
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      } catch {
        /* storage blocked: saved for this visit only */
      }
      return next;
    });
  const [open, setOpen] = useState<Template | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(BRAND_KEY, JSON.stringify(brand));
    } catch {
      /* ignore */
    }
  }, [brand]);

  const contentFor = (t: Template): Content => overrides[t.id] ?? (t.defaults as Content);
  const shown = useMemo(
    () =>
      TEMPLATES.filter(
        (t) =>
          (category === "All" || t.category === category) &&
          (format === "any" || aspectLabel(t) === format) &&
          (!savedOnly || saved.includes(t.id)) &&
          matches(t, query),
      ),
    [category, query, format, savedOnly, saved],
  );
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of TEMPLATES) c[t.category] = (c[t.category] ?? 0) + 1;
    return c;
  }, []);
  const formatCounts = useMemo(() => {
    const c: Record<Format, number> = { any: TEMPLATES.length, "16:9": 0, "9:16": 0, "1:1": 0 };
    for (const t of TEMPLATES) c[aspectLabel(t) as Format]++;
    return c;
  }, []);
  const pickCategory = (c: "All" | Category) => {
    track("category_filtered", { category: c });
    setCategory(c);
    setSavedOnly(false);
  };
  const hero = TEMPLATES[0];
  const PAGE = 24;
  const [limit, setLimit] = useState(PAGE);
  useEffect(() => setLimit(PAGE), [category, query, format, savedOnly]);
  // Changing a filter from far down the grid brings the top of the library back into view.
  useEffect(() => {
    const el = document.getElementById("library");
    if (el && el.getBoundingClientRect().top < 0) window.scrollTo({ top: el.offsetTop - 140, behavior: "smooth" });
  }, [category, format, savedOnly]);

  const openTemplate = (t: Template) => {
    track("template_opened", { template: t.id, category: t.category });
    setOpen(t);
  };

  // Log searches once the visitor pauses typing.
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const id = setTimeout(() => track("library_searched", { query: q.slice(0, 80), results: shown.length }), 900);
    return () => clearTimeout(id);
  }, [query, shown.length]);

  return (
    <div className="min-h-full bg-black text-white" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-white/8 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2.5">
            <img src={goblinLogo} alt="" className="h-7 w-7 rounded-md" />
            <span className="text-[15px] font-semibold tracking-tight">Goblin</span>
          </a>
          <nav className="flex items-center gap-1 sm:gap-2">
            <a href="#library" className="rounded-full px-3 py-1.5 text-[13px] text-white/70 hover:text-white">
              Library
            </a>
            <a href="#how" className="hidden rounded-full px-3 py-1.5 text-[13px] text-white/70 hover:text-white sm:inline">
              How it works
            </a>
            <a
              href="#library"
              className="rounded-full bg-[#22A03A] px-4 py-1.5 text-[13px] font-semibold text-black hover:opacity-90"
            >
              Browse templates
            </a>
            {isLoaded &&
              (isSignedIn ? (
                <span className="ml-1 sm:ml-2">
                  <UserButton />
                </span>
              ) : (
                <a href="/login" className="hidden rounded-full px-3 py-1.5 text-[13px] text-white/70 hover:text-white sm:inline">
                  Sign in
                </a>
              ))}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[320px] w-[70%] rounded-full bg-[#22A03A]/12 blur-[110px]" />
        </div>
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-10 px-4 pt-14 pb-10 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:pt-20">
          <div>
            <h1 className="text-[44px] leading-[1.02] font-semibold tracking-[-0.035em] sm:text-[60px]">
              Launch videos that already look like{" "}
              <span style={{ fontFamily: "Instrument Serif, serif" }} className="font-normal italic text-[#22A03A]">
                your brand.
              </span>
            </h1>
            <p className="mt-5 max-w-[520px] text-[17px] leading-relaxed text-white/65">
              Ready-made motion for launches, feature drops, changelogs and traction posts. Set your colors, font and
              motion feel once, and every template follows.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#library"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-black hover:opacity-90"
              >
                Browse the library <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
          <button
            onClick={() => openTemplate(hero)}
            className="group relative block w-full overflow-hidden rounded-2xl border border-white/12 text-left shadow-[0_40px_120px_rgba(34,160,58,0.15)]"
            aria-label={`Open ${hero.title}`}
          >
            <LivePlayer template={hero} brand={brand} content={contentFor(hero)} className="aspect-video w-full" />
          </button>
        </div>
      </section>

      {/* Brand kit — sticky so every change is visible against the grid */}
      <div id="brand-kit" className="z-30 mx-auto md:sticky md:top-14 max-w-[1240px] px-4 pt-2 sm:px-6">
        <BrandBar brand={brand} onChange={setBrand} />
      </div>

      {/* Library */}
      <section id="library" className="mx-auto max-w-[1240px] scroll-mt-36 px-4 pt-12 pb-20 sm:px-6">
        <div className="flex gap-8">
        <LibrarySidebar
          query={query}
          onQuery={setQuery}
          category={category}
          onCategory={pickCategory}
          categories={CATEGORIES.filter((c): c is Category => c !== "All")}
          counts={counts}
          total={TEMPLATES.length}
          format={format}
          onFormat={setFormat}
          formatCounts={formatCounts}
          savedOnly={savedOnly}
          onSaved={() => {
            setSavedOnly(true);
            setCategory("All");
          }}
          savedCount={saved.length}
          onBrandKit={() => window.scrollTo({ top: (document.getElementById("brand-kit")?.offsetTop ?? 0) - 80, behavior: "smooth" })}
        />
        <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[28px] font-semibold tracking-tight sm:text-[34px]">
              {savedOnly ? "Saved" : category === "All" ? "The library" : category}
            </h2>
            <p className="mt-1 text-[15px] text-white/55">
              {savedOnly
                ? saved.length
                  ? `${shown.length} saved template${shown.length === 1 ? "" : "s"}.`
                  : "Nothing saved yet. Tap the bookmark on any template to keep it here."
                : `${shown.length} template${shown.length === 1 ? "" : "s"}${format !== "any" ? ` in ${format}` : ""}, each restyled live by your brand kit. Click one to edit the copy.`}
            </p>
          </div>
          <label className="relative block sm:w-[300px] lg:hidden">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by what you're making"
              aria-label="Search templates"
              className="h-10 w-full rounded-full border border-white/12 bg-white/[0.04] pr-4 pl-9 text-[14px] outline-none placeholder:text-white/35 focus:border-[#22A03A]"
            />
          </label>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => pickCategory(c)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
                category === c && !savedOnly
                  ? "border-white bg-white font-medium text-black"
                  : "border-white/12 text-white/65 hover:border-white/35 hover:text-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-white/15 p-10 text-center text-white/55">
            {savedOnly && !query ? "Nothing saved yet." : <>Nothing matches “{query}” yet. Try another word, like launch, chart or story.</>}
          </div>
        ) : (
          <>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {shown.slice(0, limit).map((t) => (
              <div key={t.id} className="group relative">
              <button
                onClick={() => openTemplate(t)}
                className="block w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] text-left transition-colors hover:border-white/30"
              >
                <LivePlayer template={t} brand={brand} content={contentFor(t)} className="aspect-video w-full" />
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[15px] font-semibold">{t.title}</h3>
                    <div className="flex shrink-0 gap-1.5 text-[11px] text-white/45">
                      <span>{aspectLabel(t)}</span>
                      <span>·</span>
                      <span>{seconds(t)}s</span>
                    </div>
                  </div>
                  <p className="mt-1 text-[13px] leading-snug text-white/55">{t.outcome}</p>
                </div>
              </button>
              <button
                onClick={() => toggleSave(t.id)}
                aria-label={saved.includes(t.id) ? `Remove ${t.title} from saved` : `Save ${t.title}`}
                className={`absolute top-3 right-3 rounded-lg border p-1.5 backdrop-blur-md transition-opacity ${
                  saved.includes(t.id)
                    ? "border-[#22A03A]/60 bg-black/70 text-[#5fd67a] opacity-100"
                    : "border-white/15 bg-black/60 text-white/80 opacity-0 group-hover:opacity-100 focus:opacity-100"
                }`}
              >
                <Bookmark className="h-4 w-4" fill={saved.includes(t.id) ? "currentColor" : "none"} />
              </button>
              </div>
            ))}
          </div>
          {shown.length > limit && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setLimit((n) => n + PAGE)}
                className="rounded-full border border-white/20 px-6 py-2.5 text-[14px] font-medium text-white/85 hover:border-white/50"
              >
                Show more <span className="text-white/45">({shown.length - limit} left)</span>
              </button>
            </div>
          )}
          </>
        )}
        </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-white/8">
        <div className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6">
          <h2 className="text-[28px] font-semibold tracking-tight sm:text-[34px]">How it works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
                <div className="font-mono text-[12px] text-[#22A03A]">{s.n}</div>
                <h3 className="mt-3 text-[17px] font-semibold">{s.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/60">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-8 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <NewsletterSignup />
          <div className="flex flex-col gap-2 text-[12px] text-white/40 sm:items-end">
            <a href="https://goblinlabs.substack.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              Read the newsletter
            </a>
            <span>© 2026 Goblin Labs</span>
          </div>
        </div>
      </footer>

      <TemplateDialog
        template={open}
        brand={brand}
        content={open ? contentFor(open) : {}}
        onContent={(c) => open && setOverrides((o) => ({ ...o, [open.id]: c }))}
        onClose={() => setOpen(null)}
      />
    </div>
  );
}
