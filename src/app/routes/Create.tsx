import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Check, Code2, Copy, History, Loader2, Plus, Sparkles, Trash2, TriangleAlert, Wand2 } from "lucide-react";
import goblinLogo from "@/assets/goblin-logo.png";
import { UserButton, useAuth } from "@/app/lib/auth";
import { track } from "@/app/lib/analytics";
import { BrandBar } from "@/library/ui/BrandBar";
import { buildPrompt } from "@/library/ui/TemplateDialog";
import { loadBrand, saveBrand } from "@/library/brandStore";
import { SandboxPlayer } from "@/library/studio/SandboxPlayer";
import {
  asTemplate,
  deleteTemplate,
  generate,
  getTemplate,
  listTemplates,
  restoreVersion,
  StudioError,
  type Aspect,
  type GenEvent,
  type GenRequest,
  type StudioTemplate,
  type Version,
} from "@/library/studio/api";
import type { Brand } from "@/library/brand";

const DRAFT_KEY = "goblin.createDraft";
const MAX_AUTO_FIXES = 2;
const EXAMPLES = [
  "A product launch: our app name slams in, three features tick off a checklist, then a big 'Live today' and the logo",
  "A vertical changelog video for TikTok: version number, four updates sliding up as cards, end on the brand",
  "Celebrate hitting 10,000 users: a counter races up, confetti made of brand-coloured shapes, thank-you line",
];

const inputCls =
  "w-full rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-[14px] text-white outline-none placeholder:text-white/35 focus:border-[#22A03A]";

type Step = { key: string; label: string; state: "active" | "done" | "failed" };
type Health = "testing" | "ok" | { error: string };

export default function Create() {
  const { isLoaded, isSignedIn } = useAuth();
  const [params, setParams] = useSearchParams();
  const openId = params.get("t");

  const [brand, setBrandState] = useState<Brand>(loadBrand);
  const setBrand = (b: Brand) => {
    setBrandState(b);
    saveBrand(b);
  };

  const [prompt, setPrompt] = useState(() => {
    try {
      return sessionStorage.getItem(DRAFT_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [aspect, setAspect] = useState<Aspect>("16:9");
  const [instruction, setInstruction] = useState("");

  const [mine, setMine] = useState<StudioTemplate[] | null>(null);
  const [current, setCurrent] = useState<StudioTemplate | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [content, setContent] = useState<Record<string, string | number>>({});
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [chars, setChars] = useState(0);
  const [health, setHealth] = useState<Health>("testing");
  const [showCode, setShowCode] = useState(false);
  const autoFixes = useRef(0);
  const shownId = useRef<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  // Keep the prompt across a sign-in redirect.
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, prompt);
    } catch {
      /* ignore */
    }
  }, [prompt]);

  const refreshMine = useCallback(() => {
    listTemplates()
      .then(setMine)
      .catch(() => setMine([]));
  }, []);
  useEffect(() => {
    if (isSignedIn) refreshMine();
  }, [isSignedIn, refreshMine]);

  const show = (t: StudioTemplate, v?: Version[]) => {
    shownId.current = t.id;
    setCurrent(t);
    setContent({ ...t.defaults });
    setHealth("testing");
    if (v) setVersions(v);
  };

  // Open the template named in the URL.
  useEffect(() => {
    if (!openId) {
      shownId.current = null;
      setCurrent(null);
      return;
    }
    if (!isSignedIn || shownId.current === openId) return;
    getTemplate(openId)
      .then(({ template, versions }) => {
        autoFixes.current = MAX_AUTO_FIXES; // saved templates aren't fixed automatically
        show(template, versions);
      })
      .catch(() => {
        toast.error("Couldn't open that template");
        setParams({});
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, openId]);

  const step = (key: string, label: string) =>
    setSteps((s) => [...s.map((x) => (x.state === "active" ? { ...x, state: "done" as const } : x)), { key, label, state: "active" }]);

  const onEvent = (req: GenRequest) => (e: GenEvent) => {
    if (e.type === "progress") setChars(e.chars);
    if (e.type === "stage") {
      if (e.stage === "writing") step("writing", req.mode === "repair" ? "Rewriting the broken part" : req.mode === "edit" ? "Applying your change" : "Writing the template");
      if (e.stage === "checking") step(`check-${e.attempt}`, "Checking it follows your brand kit");
      if (e.stage === "fixing") step(`fix-${e.attempt}`, `Fixing ${e.problems?.length ?? 1} problem${e.problems?.length === 1 ? "" : "s"} the checks found`);
    }
  };

  const run = async (req: GenRequest) => {
    if (!isSignedIn) {
      window.location.href = `/login?redirect=${encodeURIComponent("/create")}`;
      return;
    }
    setBusy(true);
    setChars(0);
    setSteps(req.mode === "repair" ? [{ key: "preview-error", label: "The preview hit an error: fixing it", state: "active" }] : []);
    abort.current = new AbortController();
    track("studio_generate", { mode: req.mode, ...(req.mode === "create" ? { aspect: req.aspect } : {}) });
    try {
      const t = await generate(req, onEvent(req), abort.current.signal);
      setSteps((s) => [...s.map((x) => ({ ...x, state: "done" as const })), { key: "preview", label: "Testing it in the preview", state: "active" }]);
      if (req.mode !== "repair") autoFixes.current = 0;
      const { versions } = await getTemplate(t.id).catch(() => ({ versions: [] as Version[] }));
      show(t, versions);
      setParams({ t: t.id });
      if (req.mode === "create") setPrompt("");
      if (req.mode === "edit") setInstruction("");
      refreshMine();
    } catch (err) {
      setSteps((s) => s.map((x) => (x.state === "active" ? { ...x, state: "failed" } : x)));
      const msg = err instanceof Error ? err.message : "Generation failed";
      if ((err as Error).name !== "AbortError") toast.error(msg);
      track("studio_generate_failed", { mode: req.mode, status: err instanceof StudioError ? err.status : -1 });
    } finally {
      setBusy(false);
    }
  };

  // The sandbox rendered a spread of frames without errors.
  const onChecked = () => {
    setHealth("ok");
    setSteps((s) => s.map((x) => (x.key === "preview" ? { ...x, state: "done" } : x)));
  };

  // The preview hit an error: fix it automatically a couple of times.
  const onPreviewError = (message: string) => {
    if (!current) return;
    setHealth({ error: message });
    track("studio_preview_error", { auto: autoFixes.current < MAX_AUTO_FIXES });
    if (autoFixes.current < MAX_AUTO_FIXES && !busy) {
      autoFixes.current += 1;
      run({ mode: "repair", id: current.id, error: message });
    } else {
      setSteps((s) => s.map((x) => (x.key === "preview" ? { ...x, state: "failed" } : x)));
    }
  };

  const restore = async (v: number) => {
    if (!current) return;
    try {
      const r = await restoreVersion(current.id, v);
      autoFixes.current = MAX_AUTO_FIXES;
      show(r.template, r.versions);
      refreshMine();
      toast.success(`Restored version ${v}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const remove = async () => {
    if (!current || !window.confirm(`Delete “${current.title}”? This can't be undone.`)) return;
    try {
      await deleteTemplate(current.id);
      setParams({});
      refreshMine();
      toast.success("Template deleted");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${what} copied`);
      track("studio_copied", { what });
    } catch {
      toast.error("Couldn't copy to the clipboard");
    }
  };

  const newTemplate = () => {
    setSteps([]);
    setParams({});
  };

  const landscape = current ? current.width >= current.height : aspect !== "9:16";

  return (
    <div className="min-h-full bg-black text-white" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <header className="sticky top-0 z-40 border-b border-white/8 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2.5">
            <img src={goblinLogo} alt="" className="h-7 w-7 rounded-md" />
            <span className="text-[15px] font-semibold tracking-tight">Goblin</span>
          </a>
          <nav className="flex items-center gap-1 sm:gap-2">
            <a href="/#library" className="rounded-full px-3 py-1.5 text-[13px] text-white/70 hover:text-white">
              Library
            </a>
            {isLoaded &&
              (isSignedIn ? (
                <span className="ml-1 sm:ml-2">
                  <UserButton />
                </span>
              ) : (
                <a href={`/login?redirect=${encodeURIComponent("/create")}`} className="rounded-full px-3 py-1.5 text-[13px] text-white/70 hover:text-white">
                  Sign in
                </a>
              ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 pt-3 sm:px-6">
        <BrandBar brand={brand} onChange={setBrand} />
      </div>

      <main className="mx-auto grid max-w-[1400px] gap-6 px-4 pt-5 pb-16 sm:px-6 lg:grid-cols-[400px_minmax(0,1fr)]">
        {/* Left: prompt or editor */}
        <section className="order-2 flex min-w-0 flex-col gap-5 lg:order-1">
          {!current ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#22A03A]">
                <Sparkles className="h-3.5 w-3.5" /> Create
              </div>
              <h1 className="mt-2 text-[24px] font-semibold tracking-tight">Describe your video</h1>
              <p className="mt-1.5 text-[14px] leading-relaxed text-white/60">
                Claude designs a new template from your description, in your brand kit. You can edit the copy, ask for changes, and copy the prompt like any other template.
              </p>
              <textarea
                rows={5}
                value={prompt}
                maxLength={1200}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A 10-second launch video for our AI note-taker: the problem in one line, three features, end on the logo"
                className={`${inputCls} mt-4 resize-none`}
                disabled={busy}
              />
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[12px] text-white/55">Format</span>
                {(["16:9", "9:16", "1:1"] as Aspect[]).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAspect(a)}
                    disabled={busy}
                    className={`rounded-full px-3 py-1 text-[12px] transition-colors ${aspect === a ? "bg-white text-black" : "border border-white/15 text-white/70 hover:border-white/40"}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <button
                onClick={() => run({ mode: "create", prompt, aspect })}
                disabled={busy || prompt.trim().length < 8}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#22A03A] px-5 py-2.5 text-[14px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {busy ? "Creating…" : isSignedIn || !isLoaded ? "Create template" : "Sign in to create"}
              </button>
              {!busy && (
                <div className="mt-4 space-y-2">
                  <div className="text-[12px] text-white/50">Try one</div>
                  {EXAMPLES.map((ex) => (
                    <button key={ex} onClick={() => setPrompt(ex)} className="block w-full rounded-lg border border-white/8 px-3 py-2 text-left text-[12.5px] leading-snug text-white/65 hover:border-white/25 hover:text-white">
                      {ex}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <button onClick={newTemplate} className="inline-flex items-center gap-1.5 text-[12px] text-white/55 hover:text-white">
                <ArrowLeft className="h-3.5 w-3.5" /> New template
              </button>
              <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#22A03A]">{current.category}</div>
              <h1 className="mt-1.5 text-[22px] font-semibold tracking-tight">{current.title}</h1>
              <p className="mt-1 text-[14px] leading-relaxed text-white/60">{current.outcome}</p>
              <div className="mt-3 flex gap-2 text-[12px] text-white/50">
                <span className="rounded-full border border-white/12 px-2.5 py-0.5">{current.width === current.height ? "1:1" : current.width > current.height ? "16:9" : "9:16"}</span>
                <span className="rounded-full border border-white/12 px-2.5 py-0.5">{Math.round(current.durationInFrames / current.fps)}s</span>
                <span className="rounded-full border border-white/12 px-2.5 py-0.5">v{current.version}</span>
              </div>

              <div className="mt-5 space-y-3.5">
                {current.fields.map((f) => (
                  <label key={f.key} className="block">
                    <span className="mb-1.5 block text-[12px] font-medium text-white/70">{f.label}</span>
                    {f.type === "textarea" ? (
                      <textarea rows={3} value={String(content[f.key] ?? "")} onChange={(e) => setContent({ ...content, [f.key]: e.target.value })} className={`${inputCls} resize-none`} />
                    ) : (
                      <input value={String(content[f.key] ?? "")} onChange={(e) => setContent({ ...content, [f.key]: e.target.value })} className={inputCls} />
                    )}
                    {f.hint && <span className="mt-1 block text-[11px] text-white/40">{f.hint}</span>}
                  </label>
                ))}
              </div>

              <div className="mt-5 flex gap-2">
                <button onClick={() => copy(buildPrompt(asTemplate(current), brand, content), "Prompt")} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#22A03A] px-4 py-2.5 text-[13px] font-semibold text-black hover:opacity-90">
                  <Copy className="h-4 w-4" /> Copy prompt
                </button>
                <button onClick={() => setShowCode((v) => !v)} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[13px] text-white/80 hover:border-white/40" title="Show the Remotion code">
                  <Code2 className="h-4 w-4" /> Code
                </button>
              </div>

              <div className="mt-6 border-t border-white/8 pt-5">
                <div className="text-[13px] font-medium">Change something</div>
                <textarea
                  rows={3}
                  value={instruction}
                  maxLength={1200}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="Make the headline bigger and add a fourth feature"
                  className={`${inputCls} mt-2 resize-none`}
                  disabled={busy}
                />
                <button
                  onClick={() => run({ mode: "edit", id: current.id, instruction })}
                  disabled={busy || !instruction.trim()}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[13px] font-medium text-white hover:border-white/40 disabled:opacity-40"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Apply change
                </button>
              </div>

              {versions.length > 1 && (
                <div className="mt-6 border-t border-white/8 pt-5">
                  <div className="flex items-center gap-2 text-[13px] font-medium">
                    <History className="h-4 w-4 text-white/60" /> Versions
                  </div>
                  <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                    {versions.map((v) => (
                      <div key={v.version} className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-[12.5px] hover:bg-white/[0.04]">
                        <span className="w-7 shrink-0 tabular-nums text-white/45">v{v.version}</span>
                        <span className="flex-1 leading-snug text-white/70">{v.instruction}</span>
                        {v.version === current.version ? (
                          <span className="text-[11px] text-[#5fd67a]">current</span>
                        ) : (
                          <button onClick={() => restore(v.version)} disabled={busy} className="text-[11px] text-white/55 underline-offset-2 hover:text-white hover:underline">
                            Restore
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={remove} className="mt-6 inline-flex items-center gap-1.5 text-[12px] text-white/45 hover:text-red-300">
                <Trash2 className="h-3.5 w-3.5" /> Delete template
              </button>
            </div>
          )}

          {isSignedIn && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-medium">Your templates</div>
                {current && (
                  <button onClick={newTemplate} className="inline-flex items-center gap-1 text-[12px] text-white/55 hover:text-white">
                    <Plus className="h-3.5 w-3.5" /> New
                  </button>
                )}
              </div>
              {mine === null ? (
                <div className="mt-3 text-[12.5px] text-white/45">Loading…</div>
              ) : mine.length === 0 ? (
                <div className="mt-3 text-[12.5px] text-white/45">Templates you create are saved here.</div>
              ) : (
                <div className="mt-2 space-y-0.5">
                  {mine.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setParams({ t: t.id })}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] ${current?.id === t.id ? "bg-white/[0.08] text-white" : "text-white/70 hover:bg-white/[0.04] hover:text-white"}`}
                    >
                      <span className="flex-1 truncate">{t.title}</span>
                      <span className="text-[11px] text-white/40">{t.width === t.height ? "1:1" : t.width > t.height ? "16:9" : "9:16"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right: preview */}
        <section className="order-1 min-w-0 lg:order-2">
          <div className="sticky top-[76px]">
            <div className={`overflow-hidden rounded-2xl border border-white/10 ${landscape ? "aspect-video" : "mx-auto aspect-[9/16] max-h-[78vh]"}`} style={{ background: brand.background }}>
              {current ? (
                <SandboxPlayer
                  key={current.id}
                  compiled={current.compiled}
                  width={current.width}
                  height={current.height}
                  fps={current.fps}
                  durationInFrames={current.durationInFrames}
                  brand={brand}
                  content={content}
                  className="h-full w-full"
                  onChecked={onChecked}
                  onError={onPreviewError}
                />
              ) : (
                <div className="flex h-full items-center justify-center p-8 text-center text-[14px] text-white/40">
                  {busy ? "Your template is being written…" : "Your template will play here."}
                </div>
              )}
            </div>

            {(busy || steps.length > 0) && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                {steps.map((s) => (
                  <div key={s.key} className="flex items-center gap-2.5 py-1 text-[13px]">
                    {s.state === "active" ? <Loader2 className="h-4 w-4 animate-spin text-[#22A03A]" /> : s.state === "done" ? <Check className="h-4 w-4 text-[#22A03A]" /> : <TriangleAlert className="h-4 w-4 text-amber-300" />}
                    <span className={s.state === "active" ? "text-white" : "text-white/60"}>{s.label}</span>
                    {s.key === "writing" && s.state === "active" && chars > 0 && <span className="text-[12px] tabular-nums text-white/40">{Math.round(chars / 1000)}k characters</span>}
                  </div>
                ))}
                {busy && steps.length === 0 && (
                  <div className="flex items-center gap-2.5 py-1 text-[13px] text-white/70">
                    <Loader2 className="h-4 w-4 animate-spin text-[#22A03A]" /> Starting…
                  </div>
                )}
              </div>
            )}

            {current && typeof health === "object" && !busy && (
              <div className="mt-4 rounded-xl border border-amber-300/30 bg-amber-300/[0.06] px-4 py-3 text-[13px]">
                <div className="flex items-center gap-2 font-medium text-amber-200">
                  <TriangleAlert className="h-4 w-4" /> The preview hit an error
                </div>
                <div className="mt-1 font-mono text-[12px] break-words text-white/60">{health.error}</div>
                <button onClick={() => run({ mode: "repair", id: current.id, error: health.error })} className="mt-2 rounded-full border border-white/20 px-3 py-1 text-[12px] hover:border-white/50">
                  Ask Claude to fix it
                </button>
              </div>
            )}

            {current && showCode && (
              <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-2 text-[12px] text-white/60">
                  <span>Template.tsx (Remotion, uses Goblin's kit and motion helpers)</span>
                  <button onClick={() => copy(current.code, "Code")} className="inline-flex items-center gap-1 hover:text-white">
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </button>
                </div>
                <pre className="max-h-[460px] overflow-auto p-4 text-[12px] leading-relaxed text-white/75">{current.code}</pre>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
