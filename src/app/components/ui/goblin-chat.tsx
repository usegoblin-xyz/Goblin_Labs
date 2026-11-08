// The homepage chat (the whole main area of the app). Goblin talks the idea
// through first and builds a template only when asked. Each template comes
// back as a small card in the conversation; clicking it opens the template in
// a panel on the right, where it plays and can be downloaded. Adapted from the
// Ruixen "moon chat" layout, recoloured to Goblin green.
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { ArrowUpIcon, BarChart3, Check, Clapperboard, Copy, Download, ListChecks, Loader2, Megaphone, Rocket, Sparkles, TrendingUp, TriangleAlert, Users, X } from "lucide-react";
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
import {
  asTemplate, chat, downloadTemplate, formatOf, generate, getTemplate,
  type Aspect, type ChatMessage, type GenEvent, type GenRequest, type StudioTemplate,
} from "@/library/studio/api";

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
type Reply = {
  id: number;
  role: "assistant";
  text?: string; // what Goblin said
  thinking?: boolean; // waiting for Goblin's reply
  building?: boolean; // a template is being generated in this turn
  steps: Step[];
  chars: number;
  template?: StudioTemplate;
  error?: string;
  health?: "testing" | "ok" | "error";
};
type Turn = { id: number; role: "user"; text: string } | Reply;

const QUICK: { icon: ReactNode; label: string; prompt: string }[] = [
  { icon: <Rocket className="h-4 w-4" />, label: "Product launch", prompt: "I'm launching a product and want a short video for it" },
  { icon: <Sparkles className="h-4 w-4" />, label: "Feature drop", prompt: "We just shipped a new feature. Can you help me announce it?" },
  { icon: <ListChecks className="h-4 w-4" />, label: "Changelog", prompt: "I want a changelog video for this week's updates" },
  { icon: <TrendingUp className="h-4 w-4" />, label: "Milestone", prompt: "We hit a milestone and want to celebrate it" },
  { icon: <BarChart3 className="h-4 w-4" />, label: "Stat reveal", prompt: "I have one big number I want to show off" },
  { icon: <Users className="h-4 w-4" />, label: "We're hiring", prompt: "We're hiring and need a short post for it" },
  { icon: <Megaphone className="h-4 w-4" />, label: "Event promo", prompt: "Help me promote an upcoming live demo" },
];

const stageLabel = (req: GenRequest) => (req.mode === "repair" ? "Rewriting the broken part" : req.mode === "edit" ? "Applying your change" : "Writing the template");
const seconds = (t: StudioTemplate) => Math.round(t.durationInFrames / t.fps);
const Dot = () => (
  <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#5fd67a]" />
  </span>
);

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
  // Copy edits per template, made without asking Claude ("Text" in the panel).
  const [edits, setEdits] = useState<Record<string, Record<string, string>>>({});
  // The reply whose template is open in the panel.
  const [openTurn, setOpenTurn] = useState<number | null>(null);
  const [params, setParams] = useSearchParams();
  const openId = params.get("t");
  const nextId = useRef(1);
  const autoFixes = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 52, maxHeight: 160 });

  const latest = [...turns].reverse().find((t): t is Reply => t.role === "assistant" && !!t.template);
  const current = latest?.template ?? null;
  const panel = turns.find((t): t is Reply => t.id === openTurn && t.role === "assistant" && !!t.template) ?? null;

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

  // Esc closes the panel.
  useEffect(() => {
    if (openTurn === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenTurn(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openTurn]);

  // The sidebar's "New chat" clears the conversation.
  useEffect(() => {
    const onNew = () => {
      if (busy) return;
      setTurns([]);
      setOpenTurn(null);
      autoFixes.current = 0;
      setParams({}, { replace: true });
      requestAnimationFrame(() => textareaRef.current?.focus());
    };
    window.addEventListener("goblin:new-chat", onNew);
    return () => window.removeEventListener("goblin:new-chat", onNew);
  }, [busy, textareaRef, setParams]);

  const contentFor = (t: StudioTemplate) => edits[t.id] ?? t.defaults;

  // /?t=<id> reopens a saved template (from "Your creations") so the chat can keep changing it.
  useEffect(() => {
    if (!isSignedIn || !openId || current?.id === openId || busy) return;
    getTemplate(openId)
      .then(({ template }) => {
        autoFixes.current = MAX_AUTO_FIXES; // don't spend a generation on a saved template unasked
        const rid = nextId.current++;
        setTurns([
          { id: nextId.current++, role: "user", text: template.prompt },
          { id: rid, role: "assistant", text: `Here's “${template.title}”. Tell me what to change, or open it to play and download it.`, steps: [], chars: 0, template, health: "testing" },
        ]);
        setOpenTurn(rid);
      })
      .catch(() => {
        toast.error("Couldn't open that template");
        setParams({}, { replace: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, openId]);

  const patch = (id: number, f: (t: Reply) => Partial<Reply>) =>
    setTurns((ts) => ts.map((t) => (t.id === id && t.role === "assistant" ? { ...t, ...f(t) } : t)));

  const toLogin = () => {
    window.location.href = `/login?redirect=${encodeURIComponent("/")}`;
  };

  // Builds or changes a template inside reply `aid`, showing the steps there.
  const build = async (aid: number, req: GenRequest) => {
    const firstStep: Step[] = req.mode === "repair" ? [{ key: "preview-error", label: "The preview hit an error: fixing it", state: "active" }] : [];
    patch(aid, () => ({ building: true, steps: firstStep, chars: 0 }));
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
        building: false,
        health: "testing",
        steps: [...x.steps.map((s) => ({ ...s, state: "done" as const })), { key: "preview", label: "Testing it in the preview", state: "active" }],
      }));
      // An open panel follows the newest version.
      setOpenTurn((o) => (o === null ? o : aid));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed.";
      patch(aid, (x) => ({ building: false, error: msg, steps: x.steps.map((s) => (s.state === "active" ? { ...s, state: "failed" as const } : s)) }));
      track("studio_generate_failed", { mode: req.mode, status: (err as { status?: number }).status ?? -1 });
    } finally {
      setBusy(false);
    }
  };

  // The conversation so far, as Goblin sees it.
  const history = (ts: Turn[]): ChatMessage[] =>
    ts.flatMap((t): ChatMessage[] => {
      if (t.role === "user") return [{ role: "user", text: t.text }];
      const parts = [t.text ?? ""];
      if (t.template) parts.push(`[Built template “${t.template.title}” v${t.template.version}, ${formatOf(t.template)}, ${seconds(t.template)}s]`);
      if (t.error) parts.push(`[The build failed: ${t.error}]`);
      const text = parts.filter(Boolean).join("\n");
      return text ? [{ role: "assistant", text }] : [];
    });

  const send = async (override?: string) => {
    const text = (override ?? message).trim();
    if (!text || busy) return;
    if (!isSignedIn) return toLogin();
    if (!override) {
      setMessage("");
      adjustHeight(true);
    }
    const aid = nextId.current++;
    const userTurn: Turn = { id: nextId.current++, role: "user", text };
    const before = turns;
    setTurns((ts) => [...ts, userTurn, { id: aid, role: "assistant", thinking: true, steps: [], chars: 0 }]);
    setBusy(true);
    track("studio_chat", {});

    try {
      const r = await chat([...history(before), { role: "user", text }], {
        aspect,
        brand: brand.name,
        template: current
          ? { title: current.title, outcome: current.outcome, version: current.version, format: formatOf(current), seconds: seconds(current), copy: contentFor(current) }
          : undefined,
      });
      patch(aid, () => ({ thinking: false, text: r.reply }));
      if (r.action === "build") await build(aid, { mode: "create", prompt: r.brief, aspect: r.aspect });
      else if (r.action === "change" && current) await build(aid, { mode: "edit", id: current.id, instruction: r.brief });
      else setBusy(false);
    } catch (err) {
      if ((err as { status?: number }).status === 401) return toLogin();
      patch(aid, () => ({ thinking: false, error: err instanceof Error ? err.message : "Goblin couldn't reply just now." }));
      setBusy(false);
    }
  };

  const onPreviewError = (turnId: number, t: StudioTemplate, error: string) => {
    patch(turnId, (x) => ({ health: "error", steps: x.steps.map((s) => (s.key === "preview" ? { ...s, state: "failed" as const } : s)) }));
    track("studio_preview_error", { auto: autoFixes.current < MAX_AUTO_FIXES });
    if (autoFixes.current < MAX_AUTO_FIXES && !busy) {
      autoFixes.current += 1;
      const aid = nextId.current++;
      setTurns((ts) => [...ts, { id: aid, role: "assistant", text: "That one broke in the preview, so I'm fixing it.", steps: [], chars: 0 }]);
      build(aid, { mode: "repair", id: t.id, error });
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

  const download = (t: StudioTemplate) => {
    downloadTemplate(t, contentFor(t));
    track("studio_downloaded", {});
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
          placeholder={empty ? "Tell Goblin what you're launching…" : "Reply to Goblin…"}
          aria-label="Message Goblin"
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
              Working on <span className="text-white/65">{current.title}</span>
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
            onClick={() => send()}
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

  // The small card a template appears as in the conversation.
  const card = (t: Reply) => {
    const tpl = t.template!;
    const live = t === latest; // the newest one plays (and is checked) in its thumbnail
    const fmt = formatOf(tpl);
    return (
      <div className={cn("ml-9 flex max-w-[460px] items-center gap-3 rounded-xl border bg-white/[0.03] p-2 pr-2.5 transition-colors", openTurn === t.id ? "border-white/30" : "border-white/10 hover:border-white/25")}>
        <button onClick={() => setOpenTurn(t.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`Open ${tpl.title}`}>
          <span className="relative flex h-[54px] w-[96px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/8 bg-[#0a0a0a]">
            {live ? (
              <span className={cn("pointer-events-none block h-full", fmt === "16:9" ? "w-full" : fmt === "1:1" ? "aspect-square" : "aspect-[9/16]")}>
                <SandboxPlayer
                  key={`${tpl.id}-${tpl.version}`}
                  compiled={tpl.compiled}
                  width={tpl.width}
                  height={tpl.height}
                  fps={tpl.fps}
                  durationInFrames={tpl.durationInFrames}
                  brand={brand}
                  content={contentFor(tpl)}
                  controls={false}
                  className="h-full w-full"
                  onChecked={() => patch(t.id, (x) => ({ health: "ok", steps: x.steps.map((s) => (s.key === "preview" ? { ...s, state: "done" as const } : s)) }))}
                  onError={(e) => onPreviewError(t.id, tpl, e)}
                />
              </span>
            ) : (
              <Clapperboard className="h-5 w-5 text-white/40" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14.5px] font-medium text-white">{tpl.title}</span>
            <span className="block truncate text-[12.5px] text-white/45">
              Template · {fmt} · {seconds(tpl)}s · v{tpl.version}
            </span>
          </span>
        </button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => download(tpl)}
          className="h-8 shrink-0 rounded-full border-white/15 bg-transparent px-3 text-[12.5px] text-white/80 hover:bg-white/8 hover:text-white dark:bg-transparent"
        >
          <Download className="h-3.5 w-3.5" /> Download
        </Button>
      </div>
    );
  };

  return (
    <div className={cn("relative flex h-full w-full", className)}>
      <div className="relative flex h-full min-w-0 flex-1 flex-col">
        {/* One soft green glow in place of the original's moon backdrop */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden">
          <div className="absolute -top-48 left-1/2 h-[420px] w-[900px] max-w-[140%] -translate-x-1/2 rounded-[50%] blur-[100px]" style={{ background: `radial-gradient(closest-side, ${GREEN}30, transparent)` }} />
        </div>

        {empty ? (
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pt-16 pb-[12vh]">
            <div className="w-full max-w-[720px]">
              <h1 className="text-center text-[30px] leading-tight font-semibold tracking-[-0.02em] sm:text-[40px]">What are you launching?</h1>
              <p className="mx-auto mt-3 max-w-[480px] text-center text-[15px] leading-relaxed text-white/55">
                Talk it through with Goblin. When you're ready, ask it to build the video as a template in your brand.
              </p>
              <div className="mt-8">{input}</div>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {QUICK.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => send(q.prompt)}
                    disabled={busy}
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
                {turns.map((t) => {
                  if (t.role === "user")
                    return (
                      <div key={t.id} className="ml-12 self-end rounded-2xl rounded-br-md bg-white/[0.07] px-4 py-2.5 text-[14.5px] leading-relaxed whitespace-pre-wrap text-white">
                        {t.text}
                      </div>
                    );
                  const working = !!t.thinking || !!t.building || (!!t.template && t.health === "testing" && t === latest);
                  return (
                    <div key={t.id} className="flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <span className="-mt-1 -ml-1 h-8 w-8 shrink-0">
                          <GeckoLoader small done={!working} label={working ? "Goblin is working" : "Goblin"} />
                        </span>
                        <div className="min-w-0 flex-1 pt-0.5">
                          {t.thinking && (
                            <div className="flex items-center gap-2 text-[14px] text-white/55">
                              <Dot /> Thinking…
                            </div>
                          )}
                          {t.text && <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap text-white/90">{t.text}</p>}
                          {(t.building || t.steps.length > 0) && (
                            <div className={cn(t.text && "mt-2")}>
                              {t.building && t.steps.length === 0 && (
                                <div className="flex items-center gap-2 py-0.5 text-[14px] text-white/60">
                                  <Dot /> Starting…
                                </div>
                              )}
                              {t.steps.map((s) => (
                                <div key={s.key} className="flex items-center gap-2 py-0.5 text-[14px]">
                                  {s.state === "active" ? <Dot /> : s.state === "done" ? <Check className="h-3.5 w-3.5 shrink-0 text-[#22A03A]" /> : <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-amber-300" />}
                                  <span className={s.state === "active" ? "text-white" : "text-white/50"}>{s.label}</span>
                                  {s.key === "writing" && s.state === "active" && t.chars > 0 && <span className="text-[12px] tabular-nums text-white/30">{Math.round(t.chars / 1000)}k chars</span>}
                                </div>
                              ))}
                            </div>
                          )}
                          {t.error && <div className="mt-1 text-[14px] text-amber-200">{t.error}</div>}
                        </div>
                      </div>
                      {t.template && card(t)}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="relative z-10 px-4 pb-5">
              <div className="mx-auto w-full max-w-[720px]">{input}</div>
            </div>
          </>
        )}
      </div>

      {panel?.template && (
        <aside
          aria-label={`${panel.template.title} template`}
          className="fixed inset-0 z-40 flex flex-col bg-[#080808] lg:static lg:z-auto lg:w-[min(48%,680px)] lg:shrink-0 lg:border-l lg:border-white/8 lg:pt-[58px]"
        >
          <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-semibold">{panel.template.title}</div>
              <div className="truncate text-[12px] text-white/45">
                Template · {formatOf(panel.template)} · {seconds(panel.template)}s · v{panel.template.version}
              </div>
            </div>
            <Button size="sm" onClick={() => download(panel.template!)} className="h-8 rounded-full bg-[#22A03A] px-3.5 text-[12.5px] font-semibold text-black hover:bg-[#22A03A]/90">
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
            <button onClick={() => setOpenTurn(null)} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/8 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]">
              <div className={cn("mx-auto", formatOf(panel.template) === "16:9" ? "aspect-video" : formatOf(panel.template) === "1:1" ? "aspect-square max-h-[60vh]" : "aspect-[9/16] max-h-[64vh]")}>
                <SandboxPlayer
                  key={`panel-${panel.template.id}-${panel.template.version}`}
                  compiled={panel.template.compiled}
                  width={panel.template.width}
                  height={panel.template.height}
                  fps={panel.template.fps}
                  durationInFrames={panel.template.durationInFrames}
                  brand={brand}
                  content={contentFor(panel.template)}
                  className="h-full w-full"
                />
              </div>
            </div>
            <p className="mt-3 text-[13.5px] leading-snug text-white/55">{panel.template.outcome}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copy(panel.template!)}
                className="h-8 rounded-full border-white/15 bg-transparent px-3.5 text-[12.5px] text-white/80 hover:bg-white/8 hover:text-white dark:bg-transparent"
              >
                <Copy className="h-3.5 w-3.5" /> Copy prompt
              </Button>
            </div>

            <div className="mt-6 text-[12px] font-medium text-white/45">Text</div>
            <div className="mt-2 grid gap-3">
              {panel.template.fields.map((f) => {
                const tpl = panel.template!;
                const set = (v: string) => setEdits((x) => ({ ...x, [tpl.id]: { ...contentFor(tpl), [f.key]: v } }));
                return (
                  <label key={f.key} className="block">
                    <span className="mb-1 block text-[12px] text-white/55">{f.label}</span>
                    {f.type === "textarea" ? (
                      <textarea
                        rows={3}
                        value={contentFor(tpl)[f.key] ?? ""}
                        onChange={(e) => set(e.target.value)}
                        className="w-full resize-none rounded-lg border border-white/12 bg-white/[0.03] px-3 py-2 text-[13.5px] outline-none focus:border-[#22A03A]"
                      />
                    ) : (
                      <input
                        value={contentFor(tpl)[f.key] ?? ""}
                        onChange={(e) => set(e.target.value)}
                        className="h-9 w-full rounded-lg border border-white/12 bg-white/[0.03] px-3 text-[13.5px] outline-none focus:border-[#22A03A]"
                      />
                    )}
                    {f.hint && <span className="mt-1 block text-[11px] text-white/35">{f.hint}</span>}
                  </label>
                );
              })}
              <p className="text-[11.5px] text-white/35">Text edits change the preview, the copied prompt and the download. To change the design, ask Goblin.</p>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
