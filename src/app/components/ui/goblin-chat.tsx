// The homepage chat: describe a video, Goblin builds it as a template in the
// visitor's brand kit, and follow-up messages change it. Adapted from the
// Ruixen "moon chat" layout (centered title, auto-growing input, quick
// actions), recoloured to Goblin green and wired to the template generator.
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpIcon, BarChart3, Check, Copy, ExternalLink, ListChecks, Loader2, Megaphone, RotateCcw, Rocket, Sparkles, TrendingUp, TriangleAlert, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { cn } from "./utils";
import { useAuth } from "@/app/lib/auth";
import { track } from "@/app/lib/analytics";
import type { Brand } from "@/library/brand";
import { buildPrompt } from "@/library/ui/TemplateDialog";
import { SandboxPlayer } from "@/library/studio/SandboxPlayer";
import { asTemplate, generate, type Aspect, type GenEvent, type GenRequest, type StudioTemplate } from "@/library/studio/api";

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

  // Other parts of the page (the library's "Create a template" item) focus the chat.
  useEffect(() => {
    const focus = () => textareaRef.current?.focus();
    window.addEventListener("goblin:focus-chat", focus);
    return () => window.removeEventListener("goblin:focus-chat", focus);
  }, [textareaRef]);

  const patch = (id: number, f: (t: Extract<Turn, { role: "assistant" }>) => Partial<Extract<Turn, { role: "assistant" }>>) =>
    setTurns((ts) => ts.map((t) => (t.id === id && t.role === "assistant" ? { ...t, ...f(t) } : t)));

  const run = async (req: GenRequest, userText?: string) => {
    if (!isSignedIn) {
      window.location.href = `/login?redirect=${encodeURIComponent("/#create")}`;
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
      window.location.href = `/login?redirect=${encodeURIComponent("/#create")}`;
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

  const reset = () => {
    setTurns([]);
    autoFixes.current = 0;
    setMessage("");
    adjustHeight(true);
  };

  const copy = async (t: StudioTemplate) => {
    try {
      await navigator.clipboard.writeText(buildPrompt(asTemplate(t), brand, t.defaults));
      toast.success("Prompt copied", { description: "Paste it into Claude to make this video." });
      track("studio_copied", { what: "Prompt" });
    } catch {
      toast.error("Couldn't copy to the clipboard");
    }
  };

  const empty = turns.length === 0;

  return (
    <div id="create" className={cn("relative flex h-full w-full flex-col overflow-hidden bg-[#050505]", className)}>
      {/* Green glow in place of the original's moon backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[460px] w-[140%] -translate-x-1/2 rounded-[50%] opacity-60 blur-[90px]" style={{ background: `radial-gradient(closest-side, ${GREEN}55, transparent)` }} />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#22A03A]/10 to-transparent" />
      </div>

      {!empty && (
        <div className="relative z-10 flex items-center justify-between border-b border-white/8 px-4 py-3">
          <div className="flex items-center gap-2 text-[13px] font-medium text-white">
            <Sparkles className="h-4 w-4 text-[#5fd67a]" /> Create with Goblin
          </div>
          <Button variant="ghost" size="sm" onClick={reset} disabled={busy} className="h-7 text-[12px] text-white/60 hover:bg-white/8 hover:text-white">
            <RotateCcw className="h-3.5 w-3.5" /> New chat
          </Button>
        </div>
      )}

      {/* Conversation, or the centered title when empty */}
      <div ref={scroller} className="relative z-10 flex flex-1 flex-col overflow-y-auto px-4">
        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#22A03A]/40 bg-[#22A03A]/10 px-3 py-1 text-[11px] font-semibold tracking-[0.12em] text-[#5fd67a] uppercase">
              <Sparkles className="h-3.5 w-3.5" /> Create
            </div>
            <h2 className="text-[28px] leading-tight font-semibold tracking-tight text-white drop-shadow-sm">What are you launching?</h2>
            <p className="mt-2 max-w-[320px] text-[14px] leading-relaxed text-neutral-300">
              Describe a video and Goblin builds it as a template in your brand. Then ask for changes.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-4">
            {turns.map((t) =>
              t.role === "user" ? (
                <div key={t.id} className="ml-8 self-end rounded-2xl rounded-br-md bg-[#22A03A]/15 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white ring-1 ring-[#22A03A]/30">
                  {t.text}
                </div>
              ) : (
                <div key={t.id} className="mr-4 flex flex-col gap-2">
                  <div className="rounded-2xl rounded-bl-md border border-white/8 bg-white/[0.03] px-3.5 py-2.5">
                    {t.steps.length === 0 && !t.error && (
                      <div className="flex items-center gap-2 text-[13px] text-white/70">
                        <Loader2 className="h-4 w-4 animate-spin text-[#22A03A]" /> Starting…
                      </div>
                    )}
                    {t.steps.map((s) => (
                      <div key={s.key} className="flex items-center gap-2 py-0.5 text-[13px]">
                        {s.state === "active" ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#22A03A]" /> : s.state === "done" ? <Check className="h-3.5 w-3.5 shrink-0 text-[#22A03A]" /> : <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-amber-300" />}
                        <span className={s.state === "active" ? "text-white" : "text-white/55"}>{s.label}</span>
                        {s.key === "writing" && s.state === "active" && t.chars > 0 && <span className="text-[11px] tabular-nums text-white/35">{Math.round(t.chars / 1000)}k chars</span>}
                      </div>
                    ))}
                    {t.error && <div className="mt-1 text-[13px] text-amber-200">{t.error}</div>}
                  </div>

                  {t.template &&
                    (t === latest ? (
                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/60">
                        <div className={cn("mx-auto", t.template.width < t.template.height ? "aspect-[9/16] max-h-[420px]" : t.template.width === t.template.height ? "aspect-square" : "aspect-video")}>
                          <SandboxPlayer
                            key={`${t.template.id}-${t.template.version}`}
                            compiled={t.template.compiled}
                            width={t.template.width}
                            height={t.template.height}
                            fps={t.template.fps}
                            durationInFrames={t.template.durationInFrames}
                            brand={brand}
                            content={t.template.defaults}
                            className="h-full w-full"
                            onChecked={() => patch(t.id, (x) => ({ health: "ok", steps: x.steps.map((s) => (s.key === "preview" ? { ...s, state: "done" as const } : s)) }))}
                            onError={(e) => onPreviewError(t.id, t.template!, e)}
                          />
                        </div>
                        <div className="p-3">
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="text-[14px] font-semibold text-white">{t.template.title}</div>
                            <div className="shrink-0 text-[11px] text-white/45">
                              {Math.round(t.template.durationInFrames / t.template.fps)}s · v{t.template.version}
                            </div>
                          </div>
                          <div className="mt-0.5 text-[12.5px] leading-snug text-white/55">{t.template.outcome}</div>
                          <div className="mt-3 flex gap-2">
                            <Button size="sm" onClick={() => copy(t.template!)} className="h-8 flex-1 rounded-full bg-[#22A03A] text-[12.5px] font-semibold text-black hover:bg-[#22A03A]/90">
                              <Copy className="h-3.5 w-3.5" /> Copy prompt
                            </Button>
                            <Button asChild size="sm" variant="outline" className="h-8 rounded-full border-white/15 bg-transparent text-[12.5px] text-white/85 hover:bg-white/8 hover:text-white">
                              <a href={`/create?t=${t.template.id}`}>
                                <ExternalLink className="h-3.5 w-3.5" /> Edit copy
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[12px] text-white/40">
                        {t.template.title} · v{t.template.version}
                      </div>
                    ))}
                </div>
              ),
            )}
          </div>
        )}
      </div>

      {/* Input box */}
      <div className="relative z-10 w-full px-4 pb-4">
        <div className="relative rounded-xl border border-neutral-700 bg-black/60 backdrop-blur-md focus-within:border-[#22A03A]/70">
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
              "w-full resize-none border-none px-4 py-3",
              "bg-transparent text-sm text-white dark:bg-transparent",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "min-h-[52px] placeholder:text-neutral-400",
            )}
            style={{ overflow: "hidden" }}
          />
          <div className="flex items-center justify-between gap-2 p-3 pt-0">
            {current ? (
              <span className="truncate text-[11.5px] text-white/45">
                Editing <span className="text-white/70">{current.title}</span>
              </span>
            ) : (
              <div className="flex items-center gap-1" role="group" aria-label="Format">
                {(["16:9", "9:16", "1:1"] as Aspect[]).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAspect(a)}
                    aria-pressed={aspect === a}
                    className={cn("rounded-full px-2.5 py-1 text-[11.5px] transition-colors", aspect === a ? "bg-[#22A03A]/20 text-[#7be08f] ring-1 ring-[#22A03A]/50" : "text-white/50 hover:text-white")}
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
                "h-9 rounded-lg px-3 transition-colors",
                message.trim() && !busy ? "bg-[#22A03A] text-black hover:bg-[#22A03A]/90" : "cursor-not-allowed bg-neutral-800 text-neutral-500",
              )}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpIcon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        {isLoaded && !isSignedIn && <p className="mt-2 text-center text-[11.5px] text-white/45">Free with a Goblin account. You'll sign in when you send.</p>}

        {/* Quick actions */}
        {empty && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {QUICK.map((q) => (
              <Button
                key={q.label}
                variant="outline"
                onClick={() => {
                  setMessage(q.prompt);
                  requestAnimationFrame(() => {
                    adjustHeight();
                    textareaRef.current?.focus();
                  });
                }}
                className="h-8 gap-1.5 rounded-full border-neutral-700 bg-black/50 px-3 text-neutral-300 hover:border-[#22A03A]/60 hover:bg-[#22A03A]/10 hover:text-white dark:bg-black/50"
              >
                <span className="text-[#5fd67a]">{q.icon}</span>
                <span className="text-xs">{q.label}</span>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
