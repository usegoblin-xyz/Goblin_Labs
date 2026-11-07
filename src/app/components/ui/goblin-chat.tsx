// The homepage chat (the whole main area of the app): describe a video, Goblin builds it as a template in the
// visitor's brand kit, and follow-up messages change it. Adapted from the
// Ruixen "moon chat" layout (centered title, auto-growing input, quick
// actions), recoloured to Goblin green and wired to the template generator.
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { ArrowUpIcon, BarChart3, Check, Copy, ListChecks, Loader2, Megaphone, PencilLine, Rocket, Sparkles, TrendingUp, TriangleAlert, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { cn } from "./utils";
import { useAuth } from "@/app/lib/auth";
import { track } from "@/app/lib/analytics";
import type { Brand } from "@/library/brand";
import { buildPrompt } from "@/library/ui/TemplateDialog";
import { SandboxPlayer } from "@/library/studio/SandboxPlayer";
import { GeckoLoader } from "./gecko-loader";
import { asTemplate, generate, getTemplate, type Aspect, type GenEvent, type GenRequest, type StudioTemplate } from "@/library/studio/api";

const GREEN = "#22A03A";
const DRAFT_KEY = "goblin.chatDraft";
const MAX_AUTO_FIXES = 2;

function useAutoResizeTextarea({ minHeight, maxHeight }: { minHeight: number; maxHeight?: number }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = `${minHeight}px`;
      if (reset) return;
      el.style.height = `${Math.max(minHeight, Math.min(el.scrollHeight, maxHeight ?? Infinity))}px`;
    },
    [minHeight, maxHeight],
  );
  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`;
  }, [minHeight]);
  return { textareaRef, adjustHeight };
}

type Step = { key: string; label: string; state: "active" | "done" | "failed" };
const shapeOf = (a: string) => (a === "9:16" ? "aspect-[9/16] max-h-[520px]" : a === "1:1" ? "aspect-square max-h-[520px]" : "aspect-video");

type Turn =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "assistant"; steps: Step[]; chars: number; template?: StudioTemplate; error?: string; health?: "testing" | "ok" | "error" };

const QUICK: { icon: ReactNode; label: string; prompt: string }[] = [
  { icon: <Rocket className="h-4 w-4" />, label: "Product launch", prompt: "A 10-second launch video: our product name slams in, three features tick off a checklist, then a big 'Live today' and the logo" },
  { icon: <Sparkles className="h-4 w-4" />, label: "Feature drop", prompt: "Announce a new feature: show the problem in one line, then the feature name reveals with a short benefit, end on the logo" },
  { icon: <ListChecks className="h-4 w-4" />, label: "Changelog", prompt: "A changelog video: the version number, four updates sliding up as cards, end on the brand" },
  { icon: <TrendingUp className="h-4 w-4" />, label: "Milestone", prompt: "Celebrate hitting 10,000 users: a counter races up, shapes burst in brand colours, then a thank-you line" },
  { icon: <BarChart3 className="h-4 w-4" />, label: "Stat reveal", prompt: "Reveal one big stat with a short label, then three supporting numbers, end on the logo" },
  { icon: <Users className="h-4 w-4" />, label: "We're hiring", prompt: "A hiring post: 'We're hiring' headline, three open roles appear one by one, then where to apply" },
  { icon: <Megaphone className="h-4 w-4" />, label: "Event promo", prompt: "Promote a live demo: the event title, date and time, two speakers' names, and a 'Save your seat' button" },
];

const stageLabel = (req: GenRequest) => (req.mode === "repair" ? "Rewriting the broken part" : req.mode === "edit" ? "Applying your change" : "Writing the template");

export default function GoblinChat({ brand, className }: { brand: Brand; className?: string }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [message, setMessage] = useState(() => {
    try {
      return sessionStorage.getItem(DRAFT_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [aspect, setAspect] = useState<Aspect>("16:9");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  // Copy edits per template, made without asking Claude ("Edit text").
  const [edits, setEdits] = useState<Record<string, Record<string, string>>>({});
  const [editing, setEditing] = useState(false);
  const [params, setParams] = useSearchParams();
  const openId = params.get("t");
  const nextId = useRef(1);
  const autoFixes = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 52, maxHeight: 160 });

  const latest = [...turns].reverse().find((t): t is Extract<Turn, { role: "assistant" }> => t.role === "assistant" && !!t.template);
  const current = latest?.template ?? null;

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, message);
    } catch {
      /* ignore */
    }
  }, [message]);
  useEffect(() => adjustHeight(), [adjustHeight]);
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [turns]);

  // The sidebar's "New chat" clears the conversation.
  useEffect(() => {
    const onNew = () => {
      if (busy) return;
      setTurns([]);
      setEditing(false);
      autoFixes.current = 0;
      requestAnimationFrame(() => textareaRef.current?.focus());
    };
    window.addEventListener("goblin:new-chat", onNew);
    return () => window.removeEventListener("goblin:new-chat", onNew);
  }, [busy, textareaRef]);

  const contentFor = (t: StudioTemplate) => edits[t.id] ?? t.defaults;

  // /?t=<id> reopens a saved template (from "Your creations") so follow-ups keep changing it.
  useEffect(() => {
    if (!isSignedIn || !openId || current?.id === openId || busy) return;
    getTemplate(openId)
      .then(({ template }) => {
        autoFixes.current = MAX_AUTO_FIXES; // don't spend a generation on a saved template unasked
        setEditing(false);
        setTurns([
          { id: nextId.current++, role: "user", text: template.prompt },
          { id: nextId.current++, role: "assistant", steps: [], chars: 0, template, health: "testing" },
        ]);
      })
      .catch(() => {
        toast.error("Couldn't open that template");
        setParams({}, { replace: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, openId]);

  const patch = (id: number, f: (t: Extract<Turn, { role: "assistant" }>) => Partial<Extract<Turn, { role: "assistant" }>>) =>
    setTurns((ts) => ts.map((t) => (t.id === id && t.role === "assistant" ? { ...t, ...f(t) } : t)));

  const run = async (req: GenRequest, userText?: string) => {
    if (!isSignedIn) {
      window.location.href = `/login?redirect=${encodeURIComponent("/")}`;
      return;
    }
    const aid = nextId.current++;
    const firstStep: Step[] = req.mode === "repair" ? [{ key: "preview-error", label: "The preview hit an error: fixing it", state: "active" }] : [];
    setTurns((ts) => [...ts, ...(userText ? [{ id: nextId.current++, role: "user" as const, text: userText }] : []), { id: aid, role: "assistant", steps: firstStep, chars: 0 }]);
    setBusy(true);
    track("studio_generate", { mode: req.mode, ...(req.mode === "create" ? { aspect: req.aspect } : {}) });

    const step = (key: string, label: string) =>
      patch(aid, (t) => ({ steps: [...t.steps.map((s) => (s.state === "active" ? { ...s, state: "done" as const } : s)), { key, label, state: "active" }] }));
    const onEvent = (e: GenEvent) => {
      if (e.type === "progress") patch(aid, () => ({ chars: e.chars }));
      if (e.type === "stage" && e.stage === "writing") step("writing", stageLabel(req));
      if (e.type === "stage" && e.stage === "checking") step(`check-${e.attempt}`, "Checking it follows your brand kit");
      if (e.type === "stage" && e.stage === "fixing") step(`fix-${e.attempt}`, `Fixing ${e.problems?.length ?? 1} problem${e.problems?.length === 1 ? "" : "s"} the checks found`);
    };

    try {
      const t = await generate(req, onEvent);
      if (req.mode !== "repair") autoFixes.current = 0;
      setParams({ t: t.id }, { replace: true });
      patch(aid, (x) => ({
        template: t,
        health: "testing",
        steps: [...x.steps.map((s) => ({ ...s, state: "done" as const })), { key: "preview", label: "Testing it in the preview", state: "active" }],
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed.";
      patch(aid, (x) => ({ error: msg, steps: x.steps.map((s) => (s.state === "active" ? { ...s, state: "failed" as const } : s)) }));
      track("studio_generate_failed", { mode: req.mode, status: (err as { status?: number }).status ?? -1 });
    } finally {
      setBusy(false);
    }
  };

  const send = () => {
    const text = message.trim();
    if (!text || busy) return;
    if (!isSignedIn) {
      window.location.href = `/login?redirect=${encodeURIComponent("/")}`;
      return;
    }
    setMessage("");
    adjustHeight(true);
    if (current) run({ mode: "edit", id: current.id, instruction: text }, text);
    else run({ mode: "create", prompt: text, aspect }, text);
  };

  const onPreviewError = (turnId: number, t: StudioTemplate, error: string) => {
    patch(turnId, (x) => ({ health: "error", steps: x.steps.map((s) => (s.key === "preview" ? { ...s, state: "failed" as const } : s)) }));
    track("studio_preview_error", { auto: autoFixes.current < MAX_AUTO_FIXES });
    if (autoFixes.current < MAX_AUTO_FIXES && !busy) {
      autoFixes.current += 1;
      run({ mode: "repair", id: t.id, error });
    }
  };

  const copy = async (t: StudioTemplate) => {
    try {
      await navigator.clipboard.writeText(buildPrompt(asTemplate(t), brand, contentFor(t)));
      toast.success("Prompt copied", { description: "Paste it into Claude to make this video." });
      track("studio_copied", { what: "Prompt" });
    } catch {
      toast.error("Couldn't copy to the clipboard");
    }
  };

  const empty = turns.length === 0;

  const input = (
    <div className="w-full">
      <div className="relative rounded-2xl border border-white/12 bg-[#0c0c0c]/90 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md transition-colors focus-within:border-[#22A03A]/60">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            adjustHeight();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          maxLength={1200}
          disabled={busy}
          placeholder={current ? `Ask for a change to “${current.title}”…` : "Describe the video you want…"}
          aria-label={current ? "Ask for a change" : "Describe the video you want"}
          className={cn(
            "w-full resize-none border-none px-4 pt-4 pb-2",
            "bg-transparent text-[15px] text-white md:text-[15px] dark:bg-transparent",
            "focus-visible:ring-0 focus-visible:ring-offset-0",
            "min-h-[56px] placeholder:text-white/35",
          )}
          style={{ overflow: "hidden" }}
        />
        <div className="flex items-center justify-between gap-2 px-3 pb-3">
          {current ? (
            <span className="truncate pl-1 text-[12px] text-white/40">
              Editing <span className="text-white/65">{current.title}</span>
            </span>
          ) : (
            <div className="flex items-center gap-0.5 rounded-lg border border-white/8 p-0.5" role="group" aria-label="Format">
              {(["16:9", "9:16", "1:1"] as Aspect[]).map((a) => (
                <button
                  key={a}
                  onClick={() => setAspect(a)}
                  aria-pressed={aspect === a}
                  className={cn("rounded-md px-2.5 py-1 text-[12px] transition-colors", aspect === a ? "bg-white/10 text-white" : "text-white/45 hover:text-white")}
                >
                  {a}
                </button>
              ))}
            </div>
          )}
          <Button
            onClick={send}
            disabled={busy || !message.trim()}
            aria-label="Send"
            className={cn(
              "h-9 w-9 rounded-full p-0 transition-colors disabled:opacity-100",
              message.trim() && !busy ? "bg-[#22A03A] text-black hover:bg-[#22A03A]/90" : "bg-white/8 text-white/35",
            )}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpIcon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      {isLoaded && !isSignedIn && <p className="mt-2 text-center text-[12px] text-white/35">Free with a Goblin account. You'll sign in when you send.</p>}
    </div>
  );

  return (
    <div className={cn("relative flex h-full w-full flex-col", className)}>
      {/* One soft green glow in place of the original's moon backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden">
        <div className="absolute -top-48 left-1/2 h-[420px] w-[900px] max-w-[140%] -translate-x-1/2 rounded-[50%] blur-[100px]" style={{ background: `radial-gradient(closest-side, ${GREEN}30, transparent)` }} />
      </div>

      {empty ? (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pt-16 pb-[12vh]">
          <div className="w-full max-w-[720px]">
            <h1 className="text-center text-[30px] leading-tight font-semibold tracking-[-0.02em] sm:text-[40px]">What are you launching?</h1>
            <p className="mx-auto mt-3 max-w-[460px] text-center text-[15px] leading-relaxed text-white/55">
              Describe a video. Goblin builds it as a template in your brand, then keeps changing it until it's right.
            </p>
            <div className="mt-8">{input}</div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {QUICK.map((q) => (
                <button
                  key={q.label}
                  onClick={() => {
                    setMessage(q.prompt);
                    requestAnimationFrame(() => {
                      adjustHeight();
                      textareaRef.current?.focus();
                    });
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 px-3 text-[12.5px] text-white/60 transition-colors hover:border-white/25 hover:text-white"
                >
                  <span className="text-white/40">{q.icon}</span>
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div ref={scroller} className="relative z-10 flex-1 overflow-y-auto px-4 pt-16">
            <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5 pb-6">
              {turns.map((t) =>
                t.role === "user" ? (
                  <div key={t.id} className="ml-12 self-end rounded-2xl rounded-br-md bg-white/[0.07] px-4 py-2.5 text-[14.5px] leading-relaxed text-white">
                    {t.text}
                  </div>
                ) : (
                  <div key={t.id} className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <span className="-mt-1 -ml-1 h-8 w-8 shrink-0">
                        <GeckoLoader small done={!((busy && t === turns[turns.length - 1]) || (!!t.template && t.health === "testing" && !t.error))} label={busy && t === turns[turns.length - 1] ? "Goblin is working" : "Goblin"} />
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        {t.steps.length === 0 && !t.error && !t.template && (
                          <div className="flex items-center gap-2 text-[14px] text-white/60">
                            <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#5fd67a]" /></span> Starting…
                          </div>
                        )}
                        {t.steps.map((s) => (
                          <div key={s.key} className="flex items-center gap-2 py-0.5 text-[14px]">
                            {s.state === "active" ? <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#5fd67a]" /></span> : s.state === "done" ? <Check className="h-3.5 w-3.5 shrink-0 text-[#22A03A]" /> : <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-amber-300" />}
                            <span className={s.state === "active" ? "text-white" : "text-white/50"}>{s.label}</span>
                            {s.key === "writing" && s.state === "active" && t.chars > 0 && <span className="text-[12px] tabular-nums text-white/30">{Math.round(t.chars / 1000)}k chars</span>}
                          </div>
                        ))}
                        {t.error && <div className="mt-1 text-[14px] text-amber-200">{t.error}</div>}
                      </div>
                    </div>

                    {t.template &&
                      (t === latest ? (
                        <div className="ml-9 overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]">
                          <div className={cn("mx-auto", shapeOf(t.template.width < t.template.height ? "9:16" : t.template.width === t.template.height ? "1:1" : "16:9"))}>
                            <SandboxPlayer
                              key={`${t.template.id}-${t.template.version}`}
                              compiled={t.template.compiled}
                              width={t.template.width}
                              height={t.template.height}
                              fps={t.template.fps}
                              durationInFrames={t.template.durationInFrames}
                              brand={brand}
                              content={contentFor(t.template)}
                              className="h-full w-full"
                              onChecked={() => patch(t.id, (x) => ({ health: "ok", steps: x.steps.map((s) => (s.key === "preview" ? { ...s, state: "done" as const } : s)) }))}
                              onError={(e) => onPreviewError(t.id, t.template!, e)}
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-3 p-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline gap-2">
                                <span className="truncate text-[15px] font-semibold">{t.template.title}</span>
                                <span className="shrink-0 text-[12px] text-white/40">
                                  {Math.round(t.template.durationInFrames / t.template.fps)}s · v{t.template.version}
                                </span>
                              </div>
                              <div className="mt-0.5 text-[13px] leading-snug text-white/50">{t.template.outcome}</div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => copy(t.template!)} className="h-8 rounded-full bg-[#22A03A] px-3.5 text-[12.5px] font-semibold text-black hover:bg-[#22A03A]/90">
                                <Copy className="h-3.5 w-3.5" /> Copy prompt
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditing((v) => !v)}
                                aria-expanded={editing}
                                className={cn("h-8 rounded-full border-white/15 bg-transparent px-3.5 text-[12.5px] text-white/80 hover:bg-white/8 hover:text-white dark:bg-transparent", editing && "border-white/35 text-white")}
                              >
                                <PencilLine className="h-3.5 w-3.5" /> Edit text
                              </Button>
                            </div>
                          </div>
                          {editing && (
                            <div className="grid gap-3 border-t border-white/8 p-4 sm:grid-cols-2">
                              {t.template.fields.map((f) => (
                                <label key={f.key} className={cn("block", f.type === "textarea" && "sm:col-span-2")}>
                                  <span className="mb-1 block text-[12px] text-white/55">{f.label}</span>
                                  {f.type === "textarea" ? (
                                    <textarea
                                      rows={3}
                                      value={contentFor(t.template!)[f.key] ?? ""}
                                      onChange={(e) => setEdits((x) => ({ ...x, [t.template!.id]: { ...contentFor(t.template!), [f.key]: e.target.value } }))}
                                      className="w-full resize-none rounded-lg border border-white/12 bg-white/[0.03] px-3 py-2 text-[13.5px] outline-none focus:border-[#22A03A]"
                                    />
                                  ) : (
                                    <input
                                      value={contentFor(t.template!)[f.key] ?? ""}
                                      onChange={(e) => setEdits((x) => ({ ...x, [t.template!.id]: { ...contentFor(t.template!), [f.key]: e.target.value } }))}
                                      className="h-9 w-full rounded-lg border border-white/12 bg-white/[0.03] px-3 text-[13.5px] outline-none focus:border-[#22A03A]"
                                    />
                                  )}
                                  {f.hint && <span className="mt-1 block text-[11px] text-white/35">{f.hint}</span>}
                                </label>
                              ))}
                              <p className="text-[11.5px] text-white/35 sm:col-span-2">Text edits change the preview and the copied prompt. To change the design, ask in the chat.</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="ml-9 text-[12.5px] text-white/35">
                          {t.template.title} · v{t.template.version}
                        </div>
                      ))}
                  </div>
                ),
              )}
            </div>
          </div>
          <div className="relative z-10 px-4 pb-5">
            <div className="mx-auto w-full max-w-[720px]">{input}</div>
          </div>
        </>
      )}
    </div>
  );
}
