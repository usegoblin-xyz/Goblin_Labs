// The homepage chat (the whole main area of the app). Goblin talks the idea
// through first and builds only when asked: a short template (written here,
// previewed in the sandbox) or a longer explainer video (made by the explainer
// agent in the Claude Console, which takes a few minutes). Each result comes
// back as a small card in the conversation; clicking it opens it in a panel on
// the right, where it plays and can be downloaded. Adapted from the
// Ruixen "moon chat" layout, recoloured to Goblin green.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { ArrowUpIcon, BarChart3, Check, Clapperboard, Copy, Download, FileText, Film, ImageIcon, Music2, Paperclip, Lightbulb, ListChecks, Loader2, Megaphone, Plus, Rocket, Scissors, Sparkles, TrendingUp, TriangleAlert, Users, Volume2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { cn } from "./utils";
import { useAuth, useUser } from "@/app/lib/auth";
import { greetingName, pickGreeting } from "@/app/lib/greetings";
import { GeckoMark } from "./gecko-mark";
import { track } from "@/app/lib/analytics";
import type { Brand } from "@/library/brand";
import { buildPrompt } from "@/library/ui/TemplateDialog";
import { SandboxPlayer } from "@/library/studio/SandboxPlayer";
import { GeckoLoader } from "./gecko-loader";
import { exportMp4 } from "@/library/studio/exportMp4";
import { sfxUsedIn } from "@/library/sfx";
import { mediaRef, parseMediaRef, withMix } from "@/library/media";
import { ACCEPT, cachedInfo, checkFile, mediaInfos, probe, uploadMedia, type UploadedMedia } from "@/library/studio/media";
import { cutMp4 } from "@/library/studio/cut";
import { AttachmentChips, MAX_TRIM_SECONDS, MOOD_LIST, MusicControls, SplitDialog, TrimDialog, type ClipRange, type MixState, type Pending, type Use } from "./media-ui";
import { compose, type Mood } from "@/library/studio/compose";
import {
  asTemplate, changeVideo, chat, conversationId, formatOf, generate, getTemplate, getVideo, newConversation, saveDefaults, saveFile, slugOf, startVideo, videoFile,
  type Aspect, type ChatMessage, type ExplainerVideo, type GenEvent, type GenRequest, type StudioTemplate,
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
  video?: ExplainerVideo; // an explainer made by the explainer agent
  error?: string;
  health?: "testing" | "ok" | "error";
};
// A photo or clip sent with a message.
type Sent = { ref: string; kind: "image" | "video" | "audio" | "doc"; use: Use; name: string; preview: string; width: number | null; height: number | null; duration: number | null; trim: { start: number; end: number } | null };
type LinkNote = { url: string; title: string; ok: boolean; text: string };
type Turn = { id: number; role: "user"; text: string; explainer?: boolean; media?: Sent[]; links?: LinkNote[] } | Reply;

const fmtSecs = (s: number) => `${s >= 10 ? Math.round(s) : s.toFixed(1)}s`;
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
const hasSound = (t: StudioTemplate) => sfxUsedIn(t.compiled).length > 0;
const Dot = () => (
  <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#5fd67a]" />
  </span>
);

export default function GoblinChat({ brand, className }: { brand: Brand; className?: string }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  // A fresh pleasantry each visit once signed in ("Golden hour, Obinna"), picked once per page load.
  const name = greetingName(user?.fullName, user?.primaryEmailAddress.emailAddress);
  const greeting = useMemo(() => (isSignedIn ? pickGreeting(name) : null), [isSignedIn, name]);
  const [message, setMessage] = useState(() => {
    try {
      return sessionStorage.getItem(DRAFT_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [aspect, setAspect] = useState<Aspect>("16:9");
  // Explainer mode, turned on only with the Explainer button. Goblin makes
  // explainer videos (with the explainer agent) only while it's on.
  const [explainerMode, setExplainerMode] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const turnsRef = useRef(turns);
  turnsRef.current = turns;
  const [busy, setBusy] = useState(false);
  // Photos and clips attached to the next message.
  const [pending, setPending] = useState<Pending[]>([]);
  const [plusOpen, setPlusOpen] = useState(false);
  const [musicBusy, setMusicBusy] = useState(false);
  const [trimming, setTrimming] = useState<{ src: string; duration: number; initial: { start: number; end: number } | null; done: (t: { start: number; end: number } | null) => void; cancel: () => void } | null>(null);
  const [splitting, setSplitting] = useState<{ kind: "template"; t: StudioTemplate } | { kind: "video"; v: ExplainerVideo; duration: number } | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const renderHost = useRef<HTMLDivElement>(null);
  const uploading = pending.some((p) => p.status === "uploading");
  // Copy edits per template, made without asking Claude ("Text" in the panel).
  const [edits, setEdits] = useState<Record<string, Record<string, string>>>({});
  // The reply whose template is open in the panel.
  const [openTurn, setOpenTurn] = useState<number | null>(null);
  // An MP4 export in progress (rendered in the browser, in its own sandbox).
  const [exporting, setExporting] = useState<{ title: string; progress: number; ctrl: AbortController } | null>(null);
  const exportHost = useRef<HTMLDivElement>(null);
  const [params, setParams] = useSearchParams();
  const openId = params.get("t");
  const openVideoId = params.get("v");
  const nextId = useRef(1);
  const autoFixes = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 52, maxHeight: 160 });

  const latest = [...turns].reverse().find((t): t is Reply => t.role === "assistant" && !!t.template);
  // What follow-up messages change: the newest template or explainer in the chat.
  const lastItem = [...turns].reverse().find((t): t is Reply => t.role === "assistant" && !!(t.template || t.video));
  const current = lastItem?.template ?? null;
  const currentVideo = lastItem?.video ?? null;
  const panel = turns.find((t): t is Reply => t.id === openTurn && t.role === "assistant" && !!(t.template || t.video)) ?? null;
  const running = turns.some((t) => t.role === "assistant" && t.video?.status === "running");

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
      newConversation();
      setTurns([]);
      setOpenTurn(null);
      setExplainerMode(false);
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

  // /?v=<id> reopens an explainer video.
  useEffect(() => {
    if (!isSignedIn || !openVideoId || currentVideo?.id === openVideoId || busy) return;
    getVideo(openVideoId)
      .then((video) => {
        const rid = nextId.current++;
        setTurns([{ id: rid, role: "assistant", text: video.status === "running" ? `I'm still making “${video.title}”.` : `Here's “${video.title}”. Tell me what to change, or open it to play and download it.`, steps: [], chars: 0, video }]);
        if (video.status === "done") setOpenTurn(rid);
        setExplainerMode(true); // reopening an explainer continues it, in explainer mode
      })
      .catch(() => {
        toast.error("Couldn't open that video");
        setParams({}, { replace: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, openVideoId]);

  // Explainers take minutes: check on the ones still being made every few seconds.
  useEffect(() => {
    if (!running) return;
    let stopped = false;
    const tick = async () => {
      const ids = new Set<string>();
      for (const t of turnsRef.current) if (t.role === "assistant" && t.video?.status === "running") ids.add(t.video.id);
      for (const id of ids) {
        try {
          const v = await getVideo(id);
          if (stopped) return;
          setTurns((ts) => ts.map((t) => (t.role === "assistant" && t.video?.id === id && t.video.status === "running" ? { ...t, video: v.steps.length || v.status !== "running" ? v : { ...v, steps: t.video.steps } } : t)));
          if (v.status === "done" && v.files.mp4) track("studio_video_done", {});
        } catch {
          /* try again next tick */
        }
      }
    };
    const timer = window.setInterval(tick, 5000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [running]);

  const patch = (id: number, f: (t: Reply) => Partial<Reply>) =>
    setTurns((ts) => ts.map((t) => (t.id === id && t.role === "assistant" ? { ...t, ...f(t) } : t)));

  const toLogin = () => {
    window.location.href = `/login?redirect=${encodeURIComponent("/")}`;
  };

  // Builds or changes a template inside reply `aid`, showing the steps there.
  const build = async (aid: number, req: GenRequest) => {
    const firstStep: Step[] = req.mode === "repair" ? [{ key: "preview-error", label: "The preview hit an error: fixing it", state: "active" }] : [];
    patch(aid, (t) => ({ building: true, steps: [...t.steps, ...firstStep], chars: 0 }));
    setBusy(true);
    track("studio_generate", { mode: req.mode, conversation_id: conversationId(), ...(req.mode === "create" ? { aspect: req.aspect } : {}) });

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

  // ---- photos and clips ----------------------------------------------------------
  const askTrim = (src: string, duration: number, initial: { start: number; end: number } | null) =>
    new Promise<{ start: number; end: number } | null | undefined>((resolve) =>
      setTrimming({ src, duration, initial, done: (t) => (setTrimming(null), resolve(t)), cancel: () => (setTrimming(null), resolve(undefined)) }),
    );

  const startUpload = (key: string, file: File, meta?: Record<string, unknown>) => {
    if (!user) return;
    uploadMedia(file, user.id, (p) => setPending((xs) => xs.map((x) => (x.key === key ? { ...x, progress: p } : x))), undefined, meta ? { meta } : undefined)
      .then((m) => setPending((xs) => xs.map((x) => (x.key === key ? { ...x, status: "ready", progress: 1, mediaId: m.id, width: m.width, height: m.height } : x))))
      .catch((e) => setPending((xs) => xs.map((x) => (x.key === key ? { ...x, status: "error", error: e instanceof Error ? e.message : "Upload failed" } : x))));
  };

  const pickFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    if (!isSignedIn) return toLogin();
    for (const file of Array.from(files).slice(0, 6 - pending.length)) {
      let info;
      try {
        info = await probe(file);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "That file couldn't be opened.");
        continue;
      }
      const problem = checkFile(file, info);
      if (problem) {
        toast.error(problem);
        continue;
      }
      const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const preview = URL.createObjectURL(file);
      let trim: { start: number; end: number } | null = null;
      // Long clips have to be trimmed before they can go in a video.
      if (info.kind === "video" && (info.durationSeconds ?? 0) > MAX_TRIM_SECONDS) {
        const t = await askTrim(preview, info.durationSeconds!, { start: 0, end: Math.min(15, info.durationSeconds!) });
        if (t === undefined) {
          URL.revokeObjectURL(preview);
          continue;
        }
        trim = t;
      }
      setPending((xs) => [...xs, { key, file, preview, kind: info.kind, use: info.kind === "doc" ? "reference" : info.kind === "audio" ? "video" : "auto", duration: info.durationSeconds, trim, progress: 0, status: "uploading", width: info.width, height: info.height }]);
      track("studio_media_attached", { kind: info.kind, conversation_id: conversationId() });
      setPlusOpen(false);
      startUpload(key, file);
    }
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const trimPending = async (key: string) => {
    const a = pending.find((x) => x.key === key);
    if (!a || !a.duration) return;
    const t = await askTrim(a.preview, a.duration, a.trim);
    if (t !== undefined) setPending((xs) => xs.map((x) => (x.key === key ? { ...x, trim: t } : x)));
  };
  const removePending = (key: string) =>
    setPending((xs) => {
      const a = xs.find((x) => x.key === key);
      if (a) URL.revokeObjectURL(a.preview);
      return xs.filter((x) => x.key !== key);
    });

  const setUse = (key: string, use: Use) => setPending((xs) => xs.map((x) => (x.key === key ? { ...x, use } : x)));

  // Goblin-made music: composed here, then uploaded like any track.
  const makeMusic = async (mood: Mood): Promise<{ file: File; meta: Record<string, unknown>; duration: number }> => {
    const c = await compose(mood, 24, Math.floor(Math.random() * 1000) + 1);
    const label = MOOD_LIST.find((m) => m.id === mood)?.label ?? mood;
    return { file: new File([c.blob], `goblin-${mood}-${c.bpm}bpm.wav`, { type: "audio/wav" }), meta: { bpm: c.bpm, beats: c.beats, downbeats: c.downbeats, energy: c.energy, generated: true, mood: label.toLowerCase() }, duration: c.duration };
  };
  // Attachments to hand the template writer: everything attached in this chat
  // for a new build, or what was attached since the last build for a change.
  const mediaForBuild = (ts: Turn[], mode: "create" | "edit"): { ref: string; use: Use }[] => {
    let since = 0;
    if (mode === "edit") ts.forEach((t, i) => t.role === "assistant" && t.template && (since = i));
    const seen = new Map<string, Use>();
    for (const t of ts.slice(since)) if (t.role === "user") for (const m of t.media ?? []) seen.set(m.ref, m.use);
    return [...seen].map(([ref, use]) => ({ ref, use })).slice(-8);
  };


  // A media field in the panel: swap in another photo or clip, trim it, or clear it.
  const replaceFieldMedia = async (tpl: StudioTemplate, key: string, file: File) => {
    if (!user) return toLogin();
    try {
      const info = await probe(file);
      const problem = checkFile(file, info);
      if (problem) return void toast.error(problem);
      let trim: { start: number; end: number } | null = null;
      if (info.kind === "video" && (info.durationSeconds ?? 0) > MAX_TRIM_SECONDS) {
        const url = URL.createObjectURL(file);
        const t = await askTrim(url, info.durationSeconds!, { start: 0, end: Math.min(15, info.durationSeconds!) });
        URL.revokeObjectURL(url);
        if (t === undefined) return;
        trim = t;
      }
      const id = toast.loading("Uploading…");
      const m = await uploadMedia(file, user.id).finally(() => toast.dismiss(id));
      setEdits((x) => ({ ...x, [tpl.id]: { ...contentFor(tpl), [key]: mediaRef(m.id, trim) } }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
  };
  const trimFieldMedia = async (tpl: StudioTemplate, key: string) => {
    const r = parseMediaRef(contentFor(tpl)[key]);
    if (!r) return;
    const info = (await mediaInfos([r.id]))[r.id];
    if (!info || info.kind !== "video" || !info.durationSeconds) return;
    const t = await askTrim(info.url, info.durationSeconds, r.start !== null && r.end !== null ? { start: r.start, end: r.end } : null);
    if (t !== undefined) setEdits((x) => ({ ...x, [tpl.id]: { ...contentFor(tpl), [key]: mediaRef(r.id, t) } }));
  };

  // An explainer's length comes from the file itself.
  const splitVideo = (v: ExplainerVideo) => {
    const el = document.createElement("video");
    el.preload = "metadata";
    el.onloadedmetadata = () => (Number.isFinite(el.duration) ? setSplitting({ kind: "video", v, duration: el.duration }) : toast.error("Couldn't read the video's length."));
    el.onerror = () => toast.error("Couldn't load the video.");
    el.src = videoFile(v, "mp4");
  };

  // Panel edits (text, photos, clips, music settings) are saved to the template.
  const savedEdits = useRef<Record<string, string>>({});
  useEffect(() => {
    const timer = window.setTimeout(() => {
      for (const [id, values] of Object.entries(edits)) {
        const key = JSON.stringify(values);
        if (savedEdits.current[id] === key) continue;
        savedEdits.current[id] = key;
        saveDefaults(id, values).catch(() => delete savedEdits.current[id]);
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [edits]);

  // The + menu closes on a click anywhere else.
  useEffect(() => {
    if (!plusOpen) return;
    const close = (e: PointerEvent) => !(e.target as HTMLElement).closest?.('[role="menu"], [aria-label="Add files, music or references"]') && setPlusOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [plusOpen]);

  // A music field in the panel.
  const setMusic = (tpl: StudioTemplate, key: string, ref: string) => setEdits((x) => ({ ...x, [tpl.id]: { ...contentFor(tpl), [key]: ref } }));
  const replaceMusic = async (tpl: StudioTemplate, key: string, src: { file: File }) => {
    if (!user) return toLogin();
    setMusicBusy(true);
    try {
      const up = await uploadMedia(src.file, user.id);
      const old = parseMediaRef(contentFor(tpl)[key]);
      setMusic(tpl, key, old ? withMix(up.ref, { start: null, end: null, volume: old.volume, fadeIn: old.fadeIn, fadeOut: old.fadeOut, loop: old.loop, duck: old.duck }) : up.ref);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't add that music");
    } finally {
      setMusicBusy(false);
    }
  };
  // No music field yet: ask Goblin to add the track.
  const addMusicToVideo = async (src: { file: File }) => {
    if (!user) return toLogin();
    setMusicBusy(true);
    try {
      const file = src.file;
      const up = await uploadMedia(file, user.id);
      await send(`Add my track ${file.name} as the soundtrack, and time the cuts and key words to its beats.`, [
        { ref: up.ref, kind: "audio", use: "video", name: file.name, preview: "", width: null, height: null, duration: up.durationSeconds, trim: null },
      ]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't add that music");
    } finally {
      setMusicBusy(false);
    }
  };

  const toggleExplainer = (on = !explainerMode) => {
    setExplainerMode(on);
    track("studio_explainer_mode", { on });
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const brandFor = () => ({ name: brand.name, background: brand.background, foreground: brand.foreground, primary: brand.primary, accent: brand.accent, font: brand.font });

  // Starts (or changes) an explainer in reply `aid`. The agent works for a few
  // minutes; the polling effect above follows it from here.
  const explainer = async (aid: number, start: () => Promise<ExplainerVideo>) => {
    track("studio_video", { conversation_id: conversationId() });
    try {
      const v = await start();
      patch(aid, () => ({ video: v }));
      setParams({ v: v.id }, { replace: true });
    } catch (err) {
      if ((err as { status?: number }).status === 401) return toLogin();
      patch(aid, () => ({ error: err instanceof Error ? err.message : "Couldn't start the explainer." }));
    } finally {
      setBusy(false);
    }
  };

  // The conversation so far, as Goblin sees it.
  // Each user message says when the Explainer button was switched since the last
  // one, so Goblin knows why its answer changes.
  const history = (ts: Turn[]): ChatMessage[] => {
    let mode = false;
    return ts.flatMap((t): ChatMessage[] => {
      if (t.role === "user") {
        const on = !!t.explainer;
        const note = on !== mode ? `[The user turned Explainer ${on ? "on" : "off"} with the button.]\n` : "";
        mode = on;
        // Links read in earlier turns travel as text; attachments by reference.
        const links = (t.links ?? []).map((l) => (l.ok ? `[Read the link ${l.url}${l.title ? ` (“${l.title}”)` : ""}]\n${l.text}` : `[The link ${l.url} couldn't be read]`)).join("\n");
        return [{ role: "user", text: note + [t.text, links].filter(Boolean).join("\n"), media: (t.media ?? []).map((m) => ({ ref: m.ref, use: m.use })) }];
      }
      const parts = [t.text ?? ""];
      if (t.template) parts.push(`[Built template “${t.template.title}” v${t.template.version}, ${formatOf(t.template)}, ${seconds(t.template)}s]`);
      if (t.video) parts.push(`[Explainer video “${t.video.title}”, ${t.video.aspect}: ${t.video.status === "running" ? "still being made" : t.video.files.mp4 ? "finished" : "finished without a video"}]${t.video.message && t.video.status !== "running" ? `\nThe explainer agent said: ${t.video.message}` : ""}`);
      if (t.error) parts.push(`[The build failed: ${t.error}]`);
      const text = parts.filter(Boolean).join("\n");
      return text ? [{ role: "assistant", text }] : [];
    });
  };

  const send = async (override?: string, extra?: Sent[]) => {
    const text = (override ?? message).trim();
    const ready = override ? [] : pending.filter((p) => p.status === "ready" && p.mediaId);
    if ((!text && !ready.length && !extra?.length) || busy || (!override && uploading)) return;
    if (!isSignedIn) return toLogin();
    if (!override) {
      setMessage("");
      adjustHeight(true);
    }
    const aid = nextId.current++;
    const sent: Sent[] = [...ready.map((p): Sent => ({ ref: mediaRef(p.mediaId!, p.trim), kind: p.kind, use: p.use, name: p.label ?? p.file.name, preview: p.preview, width: p.width ?? null, height: p.height ?? null, duration: p.duration, trim: p.trim })), ...(extra ?? [])];
    if (!override) setPending((xs) => xs.filter((x) => x.status !== "ready"));
    const userTurn: Turn = { id: nextId.current++, role: "user", text, explainer: explainerMode, ...(sent.length ? { media: sent } : {}) };
    const before = turns;
    setTurns((ts) => [...ts, userTurn, { id: aid, role: "assistant", thinking: true, steps: [], chars: 0 }]);
    setBusy(true);
    const said = { conversation_id: conversationId(), turn: before.filter((t) => t.role === "user").length + 1, explainer_mode: explainerMode };

    try {
      const r = await chat(history([...before, userTurn]), {
        aspect,
        brand: brand.name,
        template: current
          ? { title: current.title, outcome: current.outcome, version: current.version, format: formatOf(current), seconds: seconds(current), copy: contentFor(current) }
          : undefined,
        video: currentVideo ? { title: currentVideo.title, format: currentVideo.aspect } : undefined,
        mode: explainerMode ? "explainer" : undefined,
      });
      patch(aid, () => ({ thinking: false, text: r.reply }));
      if (r.links?.length) setTurns((ts) => ts.map((t) => (t.id === userTurn.id && t.role === "user" ? { ...t, links: r.links } : t)));
      track("studio_chat", { ...said, action: r.action });
      let all: Turn[] = [...before, userTurn];
      // Goblin wants music and the user hasn't given a track: make one first.
      const hasTrack = all.some((t) => t.role === "user" && t.media?.some((m) => m.kind === "audio"));
      if ((r.action === "build" || (r.action === "change" && current)) && r.music && r.music !== "none" && !hasTrack && user) {
        patch(aid, () => ({ steps: [{ key: "music", label: `Making ${r.music} music`, state: "active" }] }));
        try {
          const m = await makeMusic(r.music as Mood);
          const up = await uploadMedia(m.file, user.id, undefined, undefined, { meta: m.meta });
          const track_: Sent = { ref: up.ref, kind: "audio", use: "video", name: `Goblin-made ${r.music} music`, preview: "", width: null, height: null, duration: m.duration, trim: null };
          const withTrack = { ...userTurn, media: [...(userTurn.media ?? []), track_] };
          all = [...before, withTrack];
          setTurns((ts) => ts.map((t) => (t.id === userTurn.id ? withTrack : t)));
          patch(aid, (x) => ({ steps: x.steps.map((st) => (st.key === "music" ? { ...st, state: "done" as const } : st)) }));
        } catch {
          patch(aid, (x) => ({ steps: x.steps.map((st) => (st.key === "music" ? { ...st, label: "Couldn't make the music, building without it", state: "failed" as const } : st)) }));
        }
      }
      if (r.action === "build") await build(aid, { mode: "create", prompt: r.brief, aspect: r.aspect, media: mediaForBuild(all, "create") });
      else if (r.action === "explainer" && explainerMode) await explainer(aid, () => startVideo({ brief: r.brief, title: r.title, aspect: r.aspect, brand: brandFor() }));
      else if (r.action === "change" && currentVideo && explainerMode) await explainer(aid, () => changeVideo(currentVideo.id, r.brief));
      else if (r.action === "change" && current) await build(aid, { mode: "edit", id: current.id, instruction: r.brief, media: mediaForBuild(all, "edit") });
      else setBusy(false);
    } catch (err) {
      if ((err as { status?: number }).status === 401) return toLogin();
      track("studio_chat", { ...said, action: "error" });
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
    if (exporting) return;
    const ctrl = new AbortController();
    setExporting({ title: t.title, progress: 0, ctrl });
    track("studio_downloaded", {});
    // Wait a frame so the dialog (which hosts the render frame) is mounted.
    requestAnimationFrame(async () => {
      try {
        if (!exportHost.current) throw new Error("Couldn't start the export.");
        const blob = await exportMp4({
          template: t,
          brand,
          content: contentFor(t),
          host: exportHost.current,
          signal: ctrl.signal,
          onProgress: (p) => setExporting((x) => (x && x.ctrl === ctrl ? { ...x, progress: p } : x)),
        });
        saveFile(blob, `${slugOf(t.title)}.mp4`);
        toast.success("MP4 downloaded", { description: `${t.title}, ${formatOf(t)}, ${seconds(t)}s` });
      } catch (err) {
        if (!ctrl.signal.aborted) {
          toast.error("Couldn't export the MP4", { description: err instanceof Error ? err.message : undefined });
          track("studio_export_failed", {});
        }
      } finally {
        setExporting((x) => (x && x.ctrl === ctrl ? null : x));
      }
    });
  };

  // One clip of a finished video: templates re-render just those frames;
  // explainer MP4s are cut as files.
  const clipCount = useRef(0);
  const makeClip = async (what: NonNullable<typeof splitting>, r: ClipRange, onProgress: (p: number) => void, signal: AbortSignal) => {
    clipCount.current++;
    if (what.kind === "template") {
      const t = what.t;
      if (!renderHost.current) throw new Error("Couldn't start the export.");
      const from = Math.max(0, Math.round(r.start * t.fps));
      const to = Math.min(t.durationInFrames - 1, Math.round(r.end * t.fps) - 1);
      const blob = await exportMp4({ template: t, brand, content: contentFor(t), host: renderHost.current, signal, onProgress, frameRange: [from, Math.max(from, to)] });
      track("studio_clips_made", { what: "template", clips: clipCount.current });
      return blob;
    }
    const res = await fetch(videoFile(what.v, "mp4"), { credentials: "same-origin", signal });
    if (!res.ok) throw new Error("Couldn't load the video.");
    const blob = await cutMp4(await res.blob(), r, onProgress, signal);
    track("studio_clips_made", { what: "explainer", clips: clipCount.current });
    return blob;
  };

  const empty = turns.length === 0;

  const input = (
    <div className="w-full">
      <div
        className="relative rounded-2xl border border-white/12 bg-[#0c0c0c]/90 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md transition-colors focus-within:border-[#22A03A]/60"
        onDragOver={(e) => e.dataTransfer.types.includes("Files") && e.preventDefault()}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return;
          e.preventDefault();
          pickFiles(e.dataTransfer.files);
        }}
      >
        <AttachmentChips items={pending} onRemove={removePending} onTrim={trimPending} onUse={setUse} />
        <input
          ref={picker}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            pickFiles(e.target.files);
            e.target.value = "";
          }}
        />
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
          placeholder={explainerMode ? (currentVideo ? "Ask for a change, or describe another explainer…" : "What should the explainer explain?") : empty ? "Tell Goblin what you're launching…" : "Reply to Goblin…"}
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
          <div className="flex min-w-0 items-center gap-2">
          <div className="relative">
            <button
              onClick={() => (isSignedIn ? setPlusOpen((o) => !o) : toLogin())}
              disabled={busy || pending.length >= 6}
              aria-label="Add files, music or references"
              aria-expanded={plusOpen}
              title="Add photos, clips, music, documents or references"
              className={cn("inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg border text-white/55 transition-colors hover:border-white/20 hover:text-white disabled:opacity-40", plusOpen ? "border-white/25 text-white" : "border-white/8")}
            >
              <Plus className={cn("h-4 w-4 transition-transform", plusOpen && "rotate-45")} />
            </button>
            {plusOpen && (
              <div className="absolute bottom-full left-0 z-30 mb-2 w-[270px] rounded-xl border border-white/10 bg-[#161616] p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.55)]" role="menu">
                <button role="menuitem" onClick={() => picker.current?.click()} className="flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-white/[0.07]">
                  <Paperclip className="mt-0.5 h-4 w-4 shrink-0 text-white/60" />
                  <span>
                    <span className="block text-[13.5px] text-white">Upload files</span>
                    <span className="block text-[11.5px] text-white/45">Photos, clips, music, PDFs, Word or text files</span>
                  </span>
                </button>
                <div className="border-t border-white/8 px-2.5 pt-2 pb-1 text-[11px] leading-snug text-white/40">Want music? Just ask in your message, like “upbeat music, cut on the beat”. Paste a link and Goblin reads it.</div>
              </div>
            )}
          </div>
          {/* On the empty page the Explainer chip below does this; in a chat, the toggle lives here. */}
          {!empty && (
          <button
            onClick={() => toggleExplainer()}
            aria-pressed={explainerMode}
            title={explainerMode ? "Explainer is on: Goblin makes 30 to 60 second explainer videos. Click to turn it off." : "Turn on Explainer to make a 30 to 60 second explainer video with captions and music"}
            className={cn(
              "inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] transition-colors",
              explainerMode ? "border-[#22A03A]/60 bg-[#22A03A]/15 text-[#7fe08f]" : "border-white/8 text-white/50 hover:border-white/20 hover:text-white",
            )}
          >
            <Lightbulb className="h-3.5 w-3.5" /> Explainer
            {explainerMode && <X className="h-3 w-3 opacity-70" />}
          </button>
          )}
          {current || currentVideo ? (
            <span className="truncate pl-1 text-[12px] text-white/40">
              Working on <span className="text-white/65">{(current ?? currentVideo)!.title}</span>
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
          </div>
          <Button
            onClick={() => send()}
            disabled={!((message.trim() || pending.some((p) => p.status === "ready")) && !busy && !uploading)}
            aria-label="Send"
            className={cn(
              "h-9 w-9 rounded-full p-0 transition-colors disabled:opacity-100",
              (message.trim() || pending.some((p) => p.status === "ready")) && !busy && !uploading ? "bg-[#22A03A] text-black hover:bg-[#22A03A]/90" : "bg-white/8 text-white/35",
            )}
          >
            {busy || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpIcon className="h-4 w-4" />}
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
              Template · {fmt} · {seconds(tpl)}s{hasSound(tpl) ? " · sound" : ""} · v{tpl.version}
            </span>
          </span>
        </button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => download(tpl)}
          disabled={!!exporting}
          aria-label={`Download ${tpl.title} as MP4`}
          className="h-8 shrink-0 rounded-full border-white/15 bg-transparent px-3 text-[12.5px] text-white/80 hover:bg-white/8 hover:text-white dark:bg-transparent"
        >
          <Download className="h-3.5 w-3.5" /> Download
        </Button>
      </div>
    );
  };

  // The card an explainer video appears as.
  const videoCard = (t: Reply) => {
    const v = t.video!;
    const ready = v.status === "done" && v.files.mp4;
    return (
      <div className={cn("ml-9 flex max-w-[460px] items-center gap-3 rounded-xl border bg-white/[0.03] p-2 pr-2.5 transition-colors", openTurn === t.id ? "border-white/30" : "border-white/10 hover:border-white/25")}>
        <button onClick={() => setOpenTurn(t.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`Open ${v.title}`}>
          <span className="relative flex h-[54px] w-[96px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/8 bg-[#0a0a0a]">
            {ready && v.files.gif ? (
              <img src={videoFile(v, "gif")} alt="" className="h-full w-full object-cover" />
            ) : v.status === "running" ? (
              <span className="h-10 w-10">
                <GeckoLoader small label="Making the video" />
              </span>
            ) : (
              <Clapperboard className="h-5 w-5 text-white/40" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14.5px] font-medium text-white">{v.title}</span>
            <span className="block truncate text-[12.5px] text-white/45">
              Explainer · {v.aspect} · {v.status === "running" ? "being made" : ready ? "MP4 with music" : "no video"}
              {v.turns > 1 ? ` · v${v.turns}` : ""}
            </span>
          </span>
        </button>
        {ready ? (
          <a
            href={videoFile(v, "mp4", true)}
            download
            onClick={() => track("studio_video_downloaded", {})}
            aria-label={`Download ${v.title} as MP4`}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-3 text-[12.5px] text-white/80 hover:bg-white/8 hover:text-white"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </a>
        ) : null}
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
              <h1 className="flex flex-col items-center justify-center gap-2 text-center text-[30px] leading-tight font-semibold tracking-[-0.02em] sm:flex-row sm:gap-4 sm:text-[40px]">
                <GeckoMark label="" className="h-[1.6em] w-[1.6em] shrink-0 sm:h-[1.35em] sm:w-[1.35em]" />
                <span className={cn(!isLoaded && "opacity-0")}>{greeting ?? "What are you launching?"}</span>
              </h1>
              <div className="mt-8">{input}</div>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => toggleExplainer()}
                  aria-pressed={explainerMode}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] transition-colors",
                    explainerMode ? "border-[#22A03A]/60 bg-[#22A03A]/15 text-[#7fe08f]" : "border-white/10 text-white/60 hover:border-white/25 hover:text-white",
                  )}
                >
                  <Lightbulb className={cn("h-4 w-4", explainerMode ? "text-[#7fe08f]" : "text-white/40")} />
                  Explainer
                </button>
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
                      <div key={t.id} className="ml-12 flex flex-col items-end gap-1.5 self-end">
                        {t.media?.length ? (
                          <div className="flex flex-wrap justify-end gap-1.5">
                            {t.media.map((m) => (
                              <span key={m.ref} className="relative h-24 w-24 overflow-hidden rounded-xl border border-white/10 bg-black" title={m.name}>
                                {m.kind === "image" ? (
                                  <img src={m.preview} alt={m.name} className="h-full w-full object-cover" />
                                ) : m.kind === "video" ? (
                                  <video src={m.preview} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                                ) : (
                                  <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-white/[0.05] p-2 text-center">
                                    {m.kind === "audio" ? <Music2 className="h-5 w-5 text-[#5fd67a]" /> : <FileText className="h-5 w-5 text-[#5fd67a]" />}
                                    <span className="line-clamp-2 text-[10.5px] leading-tight text-white/70">{m.name}</span>
                                  </span>
                                )}
                                {m.use === "reference" && m.kind !== "doc" && <span className="absolute top-1 right-1 rounded bg-black/60 px-1 text-[9.5px] text-white/80">ref</span>}
                                {m.kind === "video" && (
                                  <span className="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-black/60 px-1 text-[10.5px] text-white/85">
                                    <Film className="h-3 w-3" />
                                    {m.trim ? fmtSecs(m.trim.end - m.trim.start) : m.duration ? fmtSecs(m.duration) : ""}
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {t.text && <div className="rounded-2xl rounded-br-md bg-white/[0.07] px-4 py-2.5 text-[14.5px] leading-relaxed whitespace-pre-wrap text-white">{t.text}</div>}
                      </div>
                    );
                  const working = !!t.thinking || !!t.building || (!!t.template && t.health === "testing" && t === latest) || t.video?.status === "running";
                  const steps = t.video ? t.video.steps : t.steps;
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
                          {(t.building || steps.length > 0) && (
                            <div className={cn(t.text && "mt-2")}>
                              {t.building && t.steps.length === 0 && (
                                <div className="flex items-center gap-2 py-0.5 text-[14px] text-white/60">
                                  <Dot /> Starting…
                                </div>
                              )}
                              {steps.map((s) => (
                                <div key={s.key} className="flex items-center gap-2 py-0.5 text-[14px]">
                                  {s.state === "active" ? <Dot /> : s.state === "done" ? <Check className="h-3.5 w-3.5 shrink-0 text-[#22A03A]" /> : <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-amber-300" />}
                                  <span className={s.state === "active" ? "text-white" : "text-white/50"}>{s.label}</span>
                                  {s.key === "writing" && s.state === "active" && t.chars > 0 && <span className="text-[12px] tabular-nums text-white/30">{Math.round(t.chars / 1000)}k chars</span>}
                                </div>
                              ))}
                            </div>
                          )}
                          {t.error && <div className="mt-1 text-[14px] text-amber-200">{t.error}</div>}
                          {t.video && t.video.status !== "running" && t.video.message && (
                            <p className={cn("mt-2 text-[14px] leading-relaxed whitespace-pre-wrap", t.video.status === "failed" ? "text-amber-200" : "text-white/70")}>
                              {/* The agent's full report (scenes, choices, review notes) is in the panel; the chat gets its first paragraph. */}
                              {t.video.message.split(/\n\s*\n/)[0]}
                              {t.video.message.includes("\n\n") && t.video.files.mp4 && (
                                <button onClick={() => setOpenTurn(t.id)} className="ml-1 text-[#5fd67a] hover:underline">
                                  Scenes and notes
                                </button>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      {t.template && card(t)}
                      {t.video && videoCard(t)}
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

      {panel?.video && (
        <aside
          aria-label={`${panel.video.title} video`}
          className="fixed inset-0 z-40 flex flex-col bg-[#080808] lg:static lg:z-auto lg:w-[min(48%,680px)] lg:shrink-0 lg:border-l lg:border-white/8 lg:pt-[58px]"
        >
          <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-semibold">{panel.video.title}</div>
              <div className="truncate text-[12px] text-white/45">
                Explainer · {panel.video.aspect} · {panel.video.status === "running" ? "being made" : "MP4 with captions and music"}
              </div>
            </div>
            {panel.video.status === "done" && panel.video.files.mp4 && (
              <button
                onClick={() => splitVideo(panel.video!)}
                title="Cut this video into shorter clips"
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/15 px-3 text-[12.5px] text-white/80 hover:bg-white/8 hover:text-white"
              >
                <Scissors className="h-3.5 w-3.5" /> Clips
              </button>
            )}
            {panel.video.status === "done" && panel.video.files.mp4 && (
              <a
                href={videoFile(panel.video, "mp4", true)}
                download
                onClick={() => track("studio_video_downloaded", {})}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#22A03A] px-3.5 text-[12.5px] font-semibold text-black hover:bg-[#22A03A]/90"
              >
                <Download className="h-3.5 w-3.5" /> Download MP4
              </a>
            )}
            <button onClick={() => setOpenTurn(null)} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/8 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]">
              <div className={cn("relative mx-auto", panel.video.aspect === "16:9" ? "aspect-video" : panel.video.aspect === "1:1" ? "aspect-square max-h-[60vh]" : "aspect-[9/16] max-h-[64vh]")}>
                {panel.video.status === "done" && panel.video.files.mp4 ? (
                  <video key={panel.video.updatedAt} src={videoFile(panel.video, "mp4")} poster={panel.video.files.gif ? videoFile(panel.video, "gif") : undefined} controls playsInline preload="metadata" className="h-full w-full bg-black object-contain" />
                ) : panel.video.status === "running" ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <span className="h-28 w-28">
                      <GeckoLoader label="Making the video" />
                    </span>
                    <span className="text-[13px] text-white/55">The explainer agent is building the scenes. This takes a few minutes; you can keep chatting.</span>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center p-6 text-center text-[13px] text-white/50">No video came back this time.</div>
                )}
              </div>
            </div>
            {panel.video.steps.length > 0 && (
              <div className="mt-3">
                {panel.video.steps.map((s) => (
                  <div key={s.key} className="flex items-center gap-2 py-0.5 text-[13.5px]">
                    {s.state === "active" ? <Dot /> : s.state === "done" ? <Check className="h-3.5 w-3.5 shrink-0 text-[#22A03A]" /> : <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-amber-300" />}
                    <span className={s.state === "active" ? "text-white" : "text-white/50"}>{s.label}</span>
                  </div>
                ))}
              </div>
            )}
            {panel.video.message && panel.video.status !== "running" && <p className="mt-3 text-[13.5px] leading-relaxed whitespace-pre-wrap text-white/60">{panel.video.message}</p>}
            {panel.video.status === "done" && panel.video.files.png && (
              <>
                <div className="mt-6 text-[12px] font-medium text-white/45">Scenes</div>
                <img src={videoFile(panel.video, "png")} alt={`Stills from every scene of ${panel.video.title}`} className="mt-2 w-full rounded-lg border border-white/10" />
              </>
            )}
            <p className="mt-4 text-[11.5px] text-white/35">Made by Goblin's explainer agent. To change it, tell Goblin what to change; it keeps the scenes and redoes only what's needed.</p>
          </div>
        </aside>
      )}

      {panel?.template && (
        <aside
          aria-label={`${panel.template.title} template`}
          className="fixed inset-0 z-40 flex flex-col bg-[#080808] lg:static lg:z-auto lg:w-[min(48%,680px)] lg:shrink-0 lg:border-l lg:border-white/8 lg:pt-[58px]"
        >
          <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-semibold">{panel.template.title}</div>
              <div className="truncate text-[12px] text-white/45">
                Template · {formatOf(panel.template)} · {seconds(panel.template)}s{hasSound(panel.template) ? " · sound" : ""} · v{panel.template.version}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSplitting({ kind: "template", t: panel.template! })}
              disabled={!!exporting}
              title="Cut this video into shorter clips"
              className="h-8 rounded-full border-white/15 bg-transparent px-3 text-[12.5px] text-white/80 hover:bg-white/8 hover:text-white dark:bg-transparent"
            >
              <Scissors className="h-3.5 w-3.5" /> Clips
            </Button>
            <Button size="sm" onClick={() => download(panel.template!)} className="h-8 rounded-full bg-[#22A03A] px-3.5 text-[12.5px] font-semibold text-black hover:bg-[#22A03A]/90">
              <Download className="h-3.5 w-3.5" /> Download MP4
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
            {hasSound(panel.template) && (
              <p className="mt-3 flex items-center gap-2 text-[12.5px] text-white/50">
                <Volume2 className="h-3.5 w-3.5 shrink-0 text-[#5fd67a]" /> Has sound effects. The preview starts muted, so press its speaker button to hear them. The MP4 always has sound.
              </p>
            )}
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

            <div className="mt-6 text-[12px] font-medium text-white/45">Content</div>
            <div className="mt-2 grid gap-3">
              {panel.template.fields.map((f) => {
                const tpl = panel.template!;
                const set = (v: string) => setEdits((x) => ({ ...x, [tpl.id]: { ...contentFor(tpl), [f.key]: v } }));
                if (f.type === "audio")
                  return (
                    <MusicField
                      key={f.key}
                      label={f.label}
                      value={contentFor(tpl)[f.key] ?? ""}
                      busy={musicBusy}
                      onChange={(ref) => setMusic(tpl, f.key, ref)}
                      onReplace={(file) => replaceMusic(tpl, f.key, { file })}
                    />
                  );
                if (f.type === "media") return <MediaField key={f.key} label={f.label} value={contentFor(tpl)[f.key] ?? ""} onPick={(file) => replaceFieldMedia(tpl, f.key, file)} onTrim={() => trimFieldMedia(tpl, f.key)} onClear={() => set("")} />;
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
              {!panel.template.fields.some((f) => f.type === "audio") && <AddMusic busy={musicBusy || busy} onFile={(file) => addMusicToVideo({ file })} />}
              <p className="text-[11.5px] text-white/35">Edits here are saved and change the preview and the MP4. To change the design, ask Goblin.</p>
            </div>
          </div>
        </aside>
      )}

      {trimming && <TrimDialog src={trimming.src} duration={trimming.duration} initial={trimming.initial} onCancel={trimming.cancel} onDone={trimming.done} />}
      {splitting && (
        <SplitDialog
          title={splitting.kind === "template" ? splitting.t.title : splitting.v.title}
          duration={splitting.kind === "template" ? splitting.t.durationInFrames / splitting.t.fps : splitting.duration}
          onClose={() => setSplitting(null)}
          make={(r, onProgress, signal) => makeClip(splitting, r, onProgress, signal)}
          save={(blob, i) => {
            const title = splitting.kind === "template" ? splitting.t.title : splitting.v.title;
            saveFile(blob, `${slugOf(title)}-clip-${i + 1}.mp4`);
          }}
        />
      )}
      {/* Clip renders run in a tiny visible frame here, so the browser doesn't throttle them. */}
      <div ref={renderHost} aria-hidden className="pointer-events-none fixed right-0 bottom-0 h-[2px] w-[2px] overflow-hidden opacity-[0.01]" />

      {exporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Exporting MP4">
          <div className="w-full max-w-[380px] rounded-2xl border border-white/10 bg-[#0c0c0c] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-3">
              <span className="h-12 w-12 shrink-0">
                <GeckoLoader small label="Exporting" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[15px] font-semibold">Exporting “{exporting.title}”</div>
                <div className="text-[12.5px] text-white/50">MP4 with sound, made in your browser</div>
              </div>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/8">
              <div className="h-full rounded-full bg-[#22A03A] transition-[width] duration-200" style={{ width: `${Math.round(exporting.progress * 100)}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-[12px] text-white/45">
              <span>Keep this tab open until it finishes.</span>
              <span className="tabular-nums">{Math.round(exporting.progress * 100)}%</span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              {/* The render frame lives here, visible but tiny, so the browser doesn't throttle it. */}
              <div ref={exportHost} aria-hidden className="h-[2px] w-[2px] overflow-hidden" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => exporting.ctrl.abort()}
                className="h-8 rounded-full border-white/15 bg-transparent px-3.5 text-[12.5px] text-white/80 hover:bg-white/8 hover:text-white dark:bg-transparent"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// A photo or clip field in the panel: shows what's there, and lets the user
// swap it, trim it (clips) or clear it.
function MediaField({ label, value, onPick, onTrim, onClear }: { label: string; value: string; onPick: (file: File) => void; onTrim: () => void; onClear: () => void }) {
  const ref = parseMediaRef(value);
  const [info, setInfo] = useState<UploadedMedia | null>(() => (ref ? cachedInfo(ref.id) : null));
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!ref) return setInfo(null);
    let live = true;
    mediaInfos([ref.id]).then((m) => live && setInfo(m[ref.id] ?? null));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref?.id]);
  const kept = ref && ref.start !== null && ref.end !== null ? ref.end - ref.start : info?.durationSeconds ?? null;
  return (
    <div>
      <span className="mb-1 block text-[12px] text-white/55">{label}</span>
      <div className="flex items-center gap-3 rounded-lg border border-white/12 bg-white/[0.03] p-2">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-black">
          {info ? (
            info.kind === "image" ? <img src={info.url} alt="" className="h-full w-full object-cover" /> : <video src={info.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
          ) : ref ? (
            <Loader2 className="h-4 w-4 animate-spin text-white/40" />
          ) : (
            <ImageIcon className="h-5 w-5 text-white/30" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] text-white/85">{info?.name || (ref ? "Your upload" : "Nothing here yet")}</span>
          <span className="block text-[11.5px] text-white/45">{info ? (info.kind === "image" ? "Photo" : `Clip${kept ? `, ${kept.toFixed(1)}s` : ""}`) : ref ? "Loading…" : "Add a photo or clip"}</span>
        </span>
        <input
          ref={input}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
            e.target.value = "";
          }}
        />
        {info?.kind === "video" && (
          <button onClick={onTrim} title="Trim" aria-label={`Trim ${label}`} className="rounded-full p-1.5 text-white/55 hover:bg-white/10 hover:text-white">
            <Scissors className="h-3.5 w-3.5" />
          </button>
        )}
        <button onClick={() => input.current?.click()} className="h-8 rounded-full border border-white/15 px-3 text-[12px] text-white/80 hover:bg-white/8 hover:text-white">
          {ref ? "Replace" : "Add"}
        </button>
        {ref && (
          <button onClick={onClear} title="Remove" aria-label={`Remove ${label}`} className="rounded-full p-1.5 text-white/55 hover:bg-white/10 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// The music field in the panel: the track's settings, live.
function MusicField({ label, value, busy, onChange, onReplace }: { label: string; value: string; busy?: boolean; onChange: (ref: string) => void; onReplace: (file: File) => void }) {
  const ref = parseMediaRef(value);
  const [info, setInfo] = useState<UploadedMedia | null>(() => (ref ? cachedInfo(ref.id) : null));
  useEffect(() => {
    if (!ref) return setInfo(null);
    let live = true;
    mediaInfos([ref.id]).then((m) => live && setInfo(m[ref.id] ?? null));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref?.id]);
  if (!ref)
    return (
      <div>
        <span className="mb-1 block text-[12px] text-white/55">{label}</span>
        <AddMusic busy={busy} inline onFile={onReplace} />
      </div>
    );
  const mix: MixState = { start: ref.start ?? 0, volume: ref.volume ?? 0.8, fadeIn: ref.fadeIn ?? 0.4, fadeOut: ref.fadeOut ?? 0.8, loop: ref.loop ?? true, duck: ref.duck ?? 0.5 };
  const name = info?.meta?.generated ? `Goblin-made ${info.meta.mood ?? ""} music` : info?.name || "Your track";
  return (
    <div>
      <span className="mb-1 block text-[12px] text-white/55">{label}</span>
      <MusicControls
        name={name}
        bpm={info?.meta?.bpm ?? null}
        duration={info?.durationSeconds ?? null}
        value={mix}
        busy={busy}
        onChange={(m) => onChange(withMix(value, { ...("start" in m ? { start: m.start, end: null } : {}), ...(m.volume !== undefined ? { volume: m.volume } : {}), ...(m.fadeIn !== undefined ? { fadeIn: m.fadeIn } : {}), ...(m.fadeOut !== undefined ? { fadeOut: m.fadeOut } : {}), ...(m.loop !== undefined ? { loop: m.loop } : {}), ...(m.duck !== undefined ? { duck: m.duck } : {}) }))}
        onReplace={onReplace}
        onRemove={() => onChange("")}
      />
    </div>
  );
}

// Adding music: upload a track here, or ask Goblin for music in the chat.
function AddMusic({ busy, inline, onFile }: { busy?: boolean; inline?: boolean; onFile: (file: File) => void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className={cn("rounded-lg border border-dashed border-white/15 p-3", !inline && "mt-1")}>
      <div className="flex items-center gap-2">
        <Music2 className="h-4 w-4 shrink-0 text-[#5fd67a]" />
        <span className="flex-1 text-[12.5px] leading-snug text-white/70">{inline ? "No music in this field." : "No music yet."} Upload a track, or tell Goblin the music you want in the chat.</span>
        {busy && <Loader2 className="h-4 w-4 animate-spin text-white/50" />}
        <input ref={input} type="file" accept="audio/*,.mp3,.wav,.m4a" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
        <button disabled={busy} onClick={() => input.current?.click()} className="h-7 shrink-0 rounded-full border border-white/15 px-2.5 text-[12px] text-white/80 hover:bg-white/8 hover:text-white disabled:opacity-40">Upload a track</button>
      </div>
    </div>
  );
}
