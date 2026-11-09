import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams, Link } from "react-router";
import { Bookmark, Menu, Trash2 } from "lucide-react";
import goblinLogo from "@/assets/goblin-logo.png";
import { FONTS, type Brand } from "@/library/brand";
import { loadBrand, saveBrand } from "@/library/brandStore";
import type { Category, Template } from "@/library/kit";
import { CATEGORIES, TEMPLATES, aspectLabel, matches, seconds } from "@/library/registry";
import { BrandBar } from "@/library/ui/BrandBar";
import { LivePlayer } from "@/library/ui/LivePlayer";
import { TemplateDialog } from "@/library/ui/TemplateDialog";
import { AppSidebar, slugOf, type Format } from "@/library/ui/AppSidebar";
import GoblinChat from "@/app/components/ui/goblin-chat";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Sheet, SheetContent, SheetTitle } from "@/app/components/ui/sheet";
import { track } from "@/app/lib/analytics";
import { useAuth } from "@/app/lib/auth";
import { SandboxPlayer } from "@/library/studio/SandboxPlayer";
import { deleteTemplate, listTemplates, listVideos, videoFile, type ExplainerVideo, type StudioTemplate } from "@/library/studio/api";

type Content = Record<string, string | number>;
const SAVED_KEY = "goblin.saved";
const PAGE = 24;
const CATS = CATEGORIES.filter((c): c is Category => c !== "All");

function loadSaved(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

// The brand kit as a compact chip; the full editor opens in a popover.
function BrandChip({ brand, onChange }: { brand: Brand; onChange: (b: Brand) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-white/12 bg-black/60 py-1.5 pr-3 pl-2 text-[12.5px] text-white/80 backdrop-blur-md hover:border-white/30 hover:text-white" aria-label="Edit brand kit">
          <span className="flex -space-x-1">
            {[brand.primary, brand.accent, brand.background, brand.foreground].map((c, i) => (
              <span key={i} className="h-4 w-4 rounded-full border border-white/25" style={{ background: c }} />
            ))}
          </span>
          <span className="max-w-[120px] truncate font-medium">{brand.name || "Your brand"}</span>
          <span className="hidden text-white/45 sm:inline">· {FONTS[brand.font].label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[min(92vw,640px)] border-0 bg-transparent p-0 shadow-none">
        <BrandBar brand={brand} onChange={onChange} />
      </PopoverContent>
    </Popover>
  );
}

export default function Home() {
  const { pathname } = useLocation();
  const { section } = useParams();
  const [params] = useSearchParams();
  const [brand, setBrand] = useState<Brand>(loadBrand);
  const [overrides, setOverrides] = useState<Record<string, Content>>({});
  const [saved, setSaved] = useState<string[]>(loadSaved);
  const [open, setOpen] = useState<Template | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  useEffect(() => saveBrand(brand), [brand]);

  const inLibrary = pathname.startsWith("/library");
  const savedOnly = section === "saved";
  const creationsView = section === "creations";
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();
  const [creations, setCreations] = useState<StudioTemplate[] | null>(null);
  const [videos, setVideos] = useState<ExplainerVideo[]>([]);

  // The signed-in user's generated templates, for "Your creations".
  useEffect(() => {
    if (!creationsView || !isSignedIn) return;
    let live = true;
    listTemplates()
      .then((ts) => live && setCreations(ts))
      .catch(() => live && setCreations([]));
    listVideos()
      .then((vs) => live && setVideos(vs))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [creationsView, isSignedIn]);

  const removeCreation = async (t: StudioTemplate) => {
    if (!window.confirm(`Delete “${t.title}”? This can't be undone.`)) return;
    try {
      await deleteTemplate(t.id);
      setCreations((cs) => cs?.filter((x) => x.id !== t.id) ?? null);
    } catch (e) {
      alert((e as Error).message);
    }
  };
  const category = (CATS.find((c) => slugOf(c) === section) ?? "All") as "All" | Category;
  const format = (["16:9", "9:16", "1:1"].includes(params.get("format") ?? "") ? params.get("format") : "any") as Format;
  const query = params.get("q") ?? "";

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

  // Each library view starts at the top with the first page.
  useEffect(() => {
    setLimit(PAGE);
    document.getElementById("main")?.scrollTo({ top: 0 });
    if (inLibrary && category !== "All") track("category_filtered", { category });
  }, [pathname, format, savedOnly, category, inLibrary]);
  useEffect(() => setLimit(PAGE), [query]);
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const id = setTimeout(() => track("library_searched", { query: q.slice(0, 80), results: shown.length }), 900);
    return () => clearTimeout(id);
  }, [query, shown.length]);

  const openTemplate = (t: Template) => {
    track("template_opened", { template: t.id, category: t.category });
    setOpen(t);
  };

  const title = creationsView ? "Your creations" : query ? `Results for “${query}”` : savedOnly ? "Saved" : category !== "All" ? category : format !== "any" ? `${format === "16:9" ? "Landscape" : format === "9:16" ? "Vertical" : "Square"} ${format}` : "All templates";
  const sidebar = (onNavigate?: () => void) => (
    <AppSidebar categories={CATS} counts={counts} total={TEMPLATES.length} formatCounts={formatCounts} savedCount={saved.length} onNavigate={onNavigate} />
  );

  return (
    <div className="flex h-dvh bg-[#050505] text-white" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Left panel */}
      <aside className="hidden w-[264px] shrink-0 border-r border-white/8 bg-[#080808] lg:block">{sidebar()}</aside>
      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent side="left" className="w-[280px] border-white/10 bg-[#080808] p-0 text-white">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          {sidebar(() => setDrawer(false))}
        </SheetContent>
      </Sheet>

      {/* Main */}
      <main id="main" className="relative flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:justify-end">
          <div className="flex items-center gap-2 lg:hidden">
            <button onClick={() => setDrawer(true)} aria-label="Open menu" className="rounded-lg p-1.5 text-white/75 hover:bg-white/8 hover:text-white">
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <img src={goblinLogo} alt="" className="h-6 w-6 rounded-md" />
              <span className="text-[14px] font-semibold">Goblin</span>
            </Link>
          </div>
          <BrandChip brand={brand} onChange={setBrand} />
        </div>

        {!inLibrary ? (
          <div className="-mt-[58px] flex min-h-0 flex-1">
            <GoblinChat brand={brand} />
          </div>
        ) : creationsView ? (
          <section className="mx-auto w-full max-w-[1280px] px-4 pb-20 sm:px-6" aria-labelledby="library-title">
            <h1 id="library-title" className="text-[26px] font-semibold tracking-tight sm:text-[30px]">
              Your creations
            </h1>
            <p className="mt-1 text-[14px] text-white/50">
              {!isLoaded || (isSignedIn && creations === null)
                ? "Loading…"
                : !isSignedIn
                  ? "Sign in to see the templates you've created."
                  : creations!.length || videos.length
                    ? [
                        creations!.length ? `${creations!.length} template${creations!.length === 1 ? "" : "s"}` : "",
                        videos.length ? `${videos.length} video${videos.length === 1 ? "" : "s"}` : "",
                      ].filter(Boolean).join(" and ") + " you made in the chat. Open one to keep changing it."
                    : "Nothing yet. Templates you create in the chat are saved here."}
            </p>
            {isLoaded && !isSignedIn && (
              <Link to="/login?redirect=%2Flibrary%2Fcreations" className="mt-5 inline-block rounded-full bg-white px-5 py-2 text-[14px] font-semibold text-black hover:opacity-90">
                Sign in
              </Link>
            )}
            {isSignedIn && creations?.length === 0 && videos.length === 0 && (
              <Link to="/" className="mt-5 inline-block rounded-full bg-[#22A03A] px-5 py-2 text-[14px] font-semibold text-black hover:opacity-90">
                Start a chat
              </Link>
            )}
            {videos.length > 0 && (
              <>
                <h2 className="mt-8 text-[15px] font-semibold text-white/80">Explainers and edits</h2>
                <div className="mt-3 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {videos.map((v) => (
                    <button key={v.id} onClick={() => navigate(`/?v=${v.id}`)} className="block w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] text-left transition-colors hover:border-white/30">
                      <div className="flex aspect-video w-full items-center justify-center bg-black">
                        {v.files.gif ? <img src={videoFile(v, "gif")} alt="" className="h-full w-full object-contain" loading="lazy" /> : <span className="text-[13px] text-white/40">{v.status === "running" ? "Being made…" : "No video"}</span>}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="truncate text-[15px] font-semibold">{v.title}</h3>
                          <div className="flex shrink-0 gap-1.5 text-[11px] text-white/55">
                            <span>{v.aspect}</span>
                            <span>·</span>
                            <span>{v.kind === "edit" ? "Edit" : "Explainer"}</span>
                            {v.turns > 1 && (
                              <>
                                <span>·</span>
                                <span>v{v.turns}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
            {!!creations?.length && videos.length > 0 && <h2 className="mt-8 text-[15px] font-semibold text-white/80">Templates</h2>}
            {!!creations?.length && (
              <div className={videos.length ? "mt-3 grid gap-5 sm:grid-cols-2 xl:grid-cols-3" : "mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3"}>
                {creations.map((t) => (
                  <div key={t.id} className="group relative">
                    <button onClick={() => navigate(`/?t=${t.id}`)} className="block w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] text-left transition-colors hover:border-white/30">
                      {/* The preview is decoration here; clicks go to the card. */}
                      <div className="pointer-events-none aspect-video w-full" style={{ background: brand.background }}>
                        <SandboxPlayer
                          compiled={t.compiled}
                          width={t.width}
                          height={t.height}
                          fps={t.fps}
                          durationInFrames={t.durationInFrames}
                          brand={brand}
                          content={t.defaults}
                          controls={false}
                          className="h-full w-full"
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="truncate text-[15px] font-semibold">{t.title}</h3>
                          <div className="flex shrink-0 gap-1.5 text-[11px] text-white/55">
                            <span>{t.width === t.height ? "1:1" : t.width > t.height ? "16:9" : "9:16"}</span>
                            <span>·</span>
                            <span>{Math.round(t.durationInFrames / t.fps)}s</span>
                            <span>·</span>
                            <span>v{t.version}</span>
                          </div>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-white/50">{t.outcome || t.prompt}</p>
                      </div>
                    </button>
                    <button
                      onClick={() => removeCreation(t)}
                      aria-label={`Delete ${t.title}`}
                      className="absolute top-3 right-3 rounded-lg border border-white/15 bg-black/60 p-1.5 text-white/75 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100 hover:text-red-300 focus:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="mx-auto w-full max-w-[1280px] px-4 pb-20 sm:px-6" aria-labelledby="library-title">
            <h1 id="library-title" className="text-[26px] font-semibold tracking-tight sm:text-[30px]">
              {title}
            </h1>
            <p className="mt-1 text-[14px] text-white/50">
              {savedOnly && !saved.length
                ? "Nothing saved yet. Tap the bookmark on any template to keep it here."
                : `${shown.length} template${shown.length === 1 ? "" : "s"}, each restyled live by your brand kit. Click one to edit the copy.`}
            </p>

            {shown.length === 0 ? (
              savedOnly && !query ? null : (
                <div className="mt-10 rounded-2xl border border-dashed border-white/15 p-10 text-center text-white/55">
                  Nothing matches “{query}”. Try another word, like launch, chart or story, or describe it in a{" "}
                  <Link to="/" className="text-[#5fd67a] underline-offset-2 hover:underline">new chat</Link>.
                </div>
              )
            ) : (
              <>
                <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {shown.slice(0, limit).map((t) => (
                    <div key={t.id} className="group relative">
                      <button onClick={() => openTemplate(t)} className="block w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] text-left transition-colors hover:border-white/30">
                        <LivePlayer template={t} brand={brand} content={contentFor(t)} className="aspect-video w-full" />
                        <div className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-[15px] font-semibold">{t.title}</h3>
                            <div className="flex shrink-0 gap-1.5 text-[11px] text-white/55">
                              <span>{aspectLabel(t)}</span>
                              <span>·</span>
                              <span>{seconds(t)}s</span>
                            </div>
                          </div>
                          <p className="mt-1 text-[13px] leading-snug text-white/50">{t.outcome}</p>
                        </div>
                      </button>
                      <button
                        onClick={() => toggleSave(t.id)}
                        aria-label={saved.includes(t.id) ? `Remove ${t.title} from saved` : `Save ${t.title}`}
                        className={`absolute top-3 right-3 rounded-lg border p-1.5 backdrop-blur-md transition-opacity ${
                          saved.includes(t.id) ? "border-[#22A03A]/60 bg-black/70 text-[#5fd67a] opacity-100" : "border-white/15 bg-black/60 text-white/80 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        }`}
                      >
                        <Bookmark className="h-4 w-4" fill={saved.includes(t.id) ? "currentColor" : "none"} />
                      </button>
                    </div>
                  ))}
                </div>
                {shown.length > limit && (
                  <div className="mt-8 flex justify-center">
                    <button onClick={() => setLimit((n) => n + PAGE)} className="rounded-full border border-white/20 px-6 py-2.5 text-[14px] font-medium text-white/85 hover:border-white/50">
                      Show more <span className="text-white/55">({shown.length - limit} left)</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </main>

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
