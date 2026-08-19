import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { useAuth, useUser, UserButton } from "@clerk/clerk-react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Cpu,
  Loader2,
  MessageSquare,
  Mic,
  Phone,
  Play,
  Plus,
  Sparkles,
  Upload,
  User,
  Wrench,
  X,
} from "lucide-react";
import { EtherealShadow } from "@/app/components/ui/etheral-shadow";
import {
  createAvatarFromFile,
  createAvatarFromUrl,
  createPersona,
  listAvatars,
  listVoices,
  listLlms,
  startPreview,
  DEFAULT_AVATAR_ID,
  DEFAULT_VOICE_ID,
  DEFAULT_LLM_ID,
  DEFAULT_AVATAR_MODEL,
  type Avatar,
  type Voice,
  type Llm,
  type PersonaConfig,
  type SessionTimings,
} from "@/app/lib/anam";

// Goblin green — the brand accent used for the primary call-to-action (Start
// call / Publish) and the active-tab underline. Matches the landing-page CTAs
// (#22A03A on black text). Kept as a constant so every accent stays in lockstep.
const ACCENT = "#22A03A";

// Shown in the system-prompt editor by default and restored by "Default prompt".
const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful, embodied AI persona.\n\nUse a balanced register. Be measured in length. Be friendly but professional.";

// One-click starting points. Selecting one drops its prompt straight into the
// editable system-prompt field — the prompt stays fully visible and editable,
// unlike the old wizard where it was compiled from hidden sliders.
type Preset = { label: string; blurb: string; systemPrompt: string };
const PRESETS: Preset[] = [
  {
    label: "Healthcare",
    blurb: "Triage & follow-up",
    systemPrompt:
      "You are a healthcare persona. You triage symptoms, run structured follow-ups, and accompany patients through care plans. You speak clearly, never give a diagnosis without uncertainty, and always recommend escalation to a clinician for anything ambiguous.",
  },
  {
    label: "Education",
    blurb: "Socratic tutor",
    systemPrompt:
      "You are an educational persona. You watch the learner's work as it happens, ask Socratic questions before giving answers, and adapt vocabulary to the learner's level. You never just hand out solutions; you guide.",
  },
  {
    label: "Engineering",
    blurb: "Pair programmer",
    systemPrompt:
      "You are an engineering persona. You read code diffs, reason about the actual system being built, and prefer concrete suggestions over generic advice. You're terse, direct, and you say 'I don't know' when you don't.",
  },
  {
    label: "Receptionist",
    blurb: "Front desk",
    systemPrompt:
      "You are a professional front-desk receptionist. You greet visitors warmly, answer questions about the business, book and confirm appointments, and route anything you can't handle to the right person. You are calm, concise, and unfailingly polite.",
  },
];

// Expand a one-line description into a usable starter system prompt. Local and
// deterministic — no external call — so "Generate" is instant and offline-safe.
function generateStarterPrompt(description: string): string {
  const d = description.trim().replace(/\.$/, "");
  if (!d) return DEFAULT_SYSTEM_PROMPT;
  const subject = /^(a|an|the)\s/i.test(d) ? d : `a ${d}`;
  return `You are ${subject}.\n\nStay in character throughout the conversation. Be warm, concise, and genuinely useful. Ask a clarifying question when a request is ambiguous, and never invent facts — say so plainly when you are unsure. Keep spoken replies short and conversational.`;
}

type Tab = "prompt" | "avatar" | "voice" | "llm";

export default function Studio() {
  // --- Core persona fields (all live on one dashboard now) ---
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [initialMessage, setInitialMessage] = useState("");
  const [directorNotes, setDirectorNotes] = useState("");
  const [skipGreeting, setSkipGreeting] = useState(false);
  const [interruptible, setInterruptible] = useState(true);
  const [describe, setDescribe] = useState("");
  const [category, setCategory] = useState("Custom");

  const [tab, setTab] = useState<Tab>("prompt");

  // --- Catalogs ---
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [llms, setLlms] = useState<Llm[]>([]);
  const [avatarId, setAvatarId] = useState<string>(DEFAULT_AVATAR_ID);
  const [voiceId, setVoiceId] = useState<string>(DEFAULT_VOICE_ID);
  const [llmId, setLlmId] = useState<string>(DEFAULT_LLM_ID);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogErr, setCatalogErr] = useState<string | null>(null);

  // --- Custom avatar upload ---
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customMode, setCustomMode] = useState<"file" | "url">("file");
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customUrl, setCustomUrl] = useState("");
  const [customUploading, setCustomUploading] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  // --- Live preview + deploy ---
  const [previewing, setPreviewing] = useState(false);
  const [previewLive, setPreviewLive] = useState(false);
  const [previewTimings, setPreviewTimings] = useState<SessionTimings | null>(null);
  const [previewErr, setPreviewErr] = useState<string | null>(null);
  const [deployId, setDeployId] = useState<string | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "failed" | "anon">("idle");
  const [copied, setCopied] = useState(false);

  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const displayName =
    user?.firstName ||
    user?.fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Account";

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewHandleRef = useRef<{ stop: () => Promise<void>; talk: (s: string) => Promise<void> } | null>(null);
  const personaCacheRef = useRef<{ sig: string; promise: Promise<{ id: string }> } | null>(null);

  // Restore an in-progress config saved before a login redirect.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("studio-draft");
      if (!raw) return;
      localStorage.removeItem("studio-draft");
      const d = JSON.parse(raw) as Partial<{
        name: string; systemPrompt: string; initialMessage: string;
        avatarId: string; voiceId: string; llmId: string; category: string;
      }>;
      if (d.name) setName(d.name);
      if (d.systemPrompt) setSystemPrompt(d.systemPrompt);
      if (d.initialMessage) setInitialMessage(d.initialMessage);
      if (d.avatarId) setAvatarId(d.avatarId);
      if (d.voiceId) setVoiceId(d.voiceId);
      if (d.llmId) setLlmId(d.llmId);
      if (d.category) setCategory(d.category);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load avatar + voice + llm catalogs on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [a, v, l] = await Promise.all([listAvatars(), listVoices(), listLlms().catch(() => [] as Llm[])]);
        if (cancelled) return;
        setAvatars(a);
        setVoices(v);
        setLlms(l);
        if (a[0] && avatarId === DEFAULT_AVATAR_ID) setAvatarId(a[0].id);
        if (v[0] && voiceId === DEFAULT_VOICE_ID) setVoiceId(v[0].id);
        // Prefer the platform default if it's in the list; otherwise first.
        if (l.length && llmId === DEFAULT_LLM_ID) {
          setLlmId(l.find((x) => x.id === DEFAULT_LLM_ID)?.id ?? l[0].id);
        }
      } catch (e: any) {
        if (!cancelled) setCatalogErr(e.message ?? String(e));
      } finally {
        if (!cancelled) setLoadingCatalog(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stop preview on unmount.
  useEffect(() => {
    return () => {
      previewHandleRef.current?.stop().catch(() => {});
    };
  }, []);

  const selectedAvatar = useMemo(() => avatars.find((a) => a.id === avatarId), [avatars, avatarId]);
  const selectedVoice = useMemo(() => voices.find((v) => v.id === voiceId), [voices, voiceId]);
  const selectedLlm = useMemo(() => llms.find((l) => l.id === llmId), [llms, llmId]);

  // The prompt sent to Anam: the visible system prompt plus optional director
  // notes appended under a clear heading (runtime steering that stays legible).
  const compiledPrompt = useMemo(() => {
    const base = systemPrompt.trim() || DEFAULT_SYSTEM_PROMPT;
    const notes = directorNotes.trim();
    return notes ? `${base}\n\nDirector notes: ${notes}` : base;
  }, [systemPrompt, directorNotes]);

  const config: PersonaConfig = useMemo(
    () => ({
      name: name.trim() || "Custom Persona",
      avatarId: avatarId || DEFAULT_AVATAR_ID,
      voiceId: voiceId || DEFAULT_VOICE_ID,
      llmId: llmId || DEFAULT_LLM_ID,
      avatarModel: selectedAvatar?.model ?? DEFAULT_AVATAR_MODEL,
      systemPrompt: compiledPrompt,
      ...(initialMessage.trim() ? { initialMessage: initialMessage.trim() } : {}),
      skipGreeting,
      uninterruptibleGreeting: !interruptible,
    }),
    [name, avatarId, voiceId, llmId, selectedAvatar, compiledPrompt, initialMessage, skipGreeting, interruptible],
  );

  async function submitCustomAvatar() {
    setCustomError(null);
    const nm = customName.trim();
    if (!nm) {
      setCustomError("Give your avatar a name (3+ characters).");
      return;
    }
    if (customMode === "file" && !customFile) {
      setCustomError("Pick an image file (JPEG, PNG, or WebP, under 4.5MB).");
      return;
    }
    if (customMode === "url" && !customUrl.trim()) {
      setCustomError("Paste an image URL.");
      return;
    }
    setCustomUploading(true);
    try {
      const created =
        customMode === "file"
          ? await createAvatarFromFile(nm, customFile!)
          : await createAvatarFromUrl(nm, customUrl.trim());
      setAvatars((prev) => [created, ...prev]);
      setAvatarId(created.id);
      setCustomOpen(false);
      setCustomName("");
      setCustomFile(null);
      setCustomUrl("");
    } catch (e: any) {
      setCustomError(e.message ?? String(e));
    } finally {
      setCustomUploading(false);
    }
  }

  // Create the persona at most once per unique config; reuse the in-flight or
  // completed promise so a good preview pre-warms the eventual Publish.
  function ensurePersona(cfg: PersonaConfig): Promise<{ id: string }> {
    const sig = JSON.stringify(cfg);
    if (personaCacheRef.current?.sig === sig) return personaCacheRef.current.promise;
    const promise = createPersona(cfg);
    personaCacheRef.current = { sig, promise };
    promise.catch(() => {
      if (personaCacheRef.current?.sig === sig) personaCacheRef.current = null;
    });
    return promise;
  }

  async function startLivePreview() {
    if (!videoRef.current) return;
    setPreviewErr(null);
    setPreviewing(true);
    setPreviewLive(false);
    try {
      previewHandleRef.current?.stop().catch(() => {});
      const handle = await startPreview(videoRef.current, config);
      previewHandleRef.current = handle;
      setPreviewTimings(handle.timings);
      setPreviewLive(true);
      // Config is proven good — pre-warm the deploy so Publish is instant.
      void ensurePersona(config).catch(() => {});
      // Anam speaks the greeting itself from initialMessage / skipGreeting, so
      // there's no manual talk() here — it would double up the opener.
    } catch (e: any) {
      setPreviewErr(e.message ?? String(e));
      setPreviewing(false);
      setPreviewLive(false);
    }
  }

  async function stopPreview() {
    await previewHandleRef.current?.stop().catch(() => {});
    previewHandleRef.current = null;
    setPreviewing(false);
    setPreviewLive(false);
  }

  async function deploy() {
    setDeploying(true);
    try {
      const { id } = await ensurePersona(config);
      setDeployId(id);
      if (!isSignedIn) {
        setSaveState("anon");
      } else {
        try {
          const token = await getToken();
          const r = await fetch("/api/personas-mine", {
            method: "POST",
            headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
            body: JSON.stringify({ anamPersonaId: id, name: config.name, vertical: category }),
          });
          setSaveState(r.ok ? "saved" : "failed");
        } catch {
          setSaveState("failed");
        }
      }
    } catch (e: any) {
      setPreviewErr(e.message ?? String(e));
    } finally {
      setDeploying(false);
    }
  }

  const shareUrl = deployId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/p/${deployId}`
    : "";

  async function copyShareUrl() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the field is selectable as a fallback */
    }
  }

  const TABS: { id: Tab; label: string; icon: typeof User }[] = [
    { id: "prompt", label: "Prompt", icon: MessageSquare },
    { id: "avatar", label: "Avatar", icon: User },
    { id: "voice", label: "Voice", icon: Mic },
    { id: "llm", label: "LLM", icon: Cpu },
  ];

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <EtherealShadow color="rgba(160, 160, 160, 1)" noise={{ opacity: 0.4, scale: 1.2 }} sizing="fill" />
        <div className="absolute inset-0 bg-background/70" />
      </div>

      {/* Top bar: breadcrumb · account · Publish */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 text-[12px]">
            <Link to="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Link
              to="/personas"
              className="uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
            >
              Personas
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span className="truncate font-medium uppercase tracking-[0.14em]">
              {name.trim() || "Custom Persona"}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/docs"
              className="hidden text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground sm:block"
            >
              Docs
            </Link>
            {isSignedIn ? (
              <>
                <Link
                  to="/personas"
                  className="hidden max-w-[130px] truncate text-[12px] font-medium text-foreground/90 hover:text-foreground sm:block"
                  title={`${displayName} — your personas`}
                >
                  {displayName}
                </Link>
                <UserButton />
              </>
            ) : null}
            <button
              onClick={deploy}
              disabled={deploying}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: ACCENT }}
            >
              {deploying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {deployId ? "Published" : deploying ? "Publishing…" : "Publish"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,540px)_minmax(0,1fr)]">
        {/* ===================== LEFT: builder rail ===================== */}
        <section className="liquid-glass flex min-h-[70vh] flex-col overflow-hidden rounded-3xl">
          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-border/40 px-3">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-3.5 text-[12px] font-medium uppercase tracking-[0.12em] transition-colors ${
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                  {active && (
                    <motion.span
                      layoutId="studio-tab"
                      className="absolute inset-x-2 -bottom-px h-0.5 rounded-full"
                      style={{ backgroundColor: ACCENT }}
                    />
                  )}
                </button>
              );
            })}
            <div className="ml-auto flex items-center gap-1.5 px-3 py-3.5 text-[12px] font-medium uppercase tracking-[0.12em] text-muted-foreground/50">
              <Wrench className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tools</span>
              <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-[8.5px] tracking-[0.1em]">soon</span>
            </div>
          </div>

          {/* Tab content */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            {catalogErr && (
              <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-[12px] text-destructive">
                Couldn't load Anam catalog: {catalogErr}. Check that ANAM_API_KEY is set in Vercel.
              </div>
            )}

            {/* ---------- PROMPT ---------- */}
            {tab === "prompt" && (
              <div className="space-y-5">
                {/* Persona name */}
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Persona name — e.g. Front Desk"
                  className="w-full rounded-xl border border-border/60 bg-background/60 px-4 py-2.5 text-[15px] font-medium outline-none focus:border-foreground/50"
                />

                {/* Describe → generate */}
                <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-2 py-2">
                  <input
                    value={describe}
                    onChange={(e) => setDescribe(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setSystemPrompt(generateStarterPrompt(describe));
                    }}
                    placeholder="A professional medical receptionist"
                    className="min-w-0 flex-1 bg-transparent px-2 text-[14px] outline-none placeholder:text-muted-foreground/70"
                  />
                  <button
                    onClick={() => setSystemPrompt(generateStarterPrompt(describe))}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-[12px] font-medium hover:border-foreground/50"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate
                  </button>
                </div>

                {/* Preset chips */}
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => {
                        setSystemPrompt(p.systemPrompt);
                        setCategory(p.label);
                      }}
                      className="rounded-full border border-border/60 px-3 py-1.5 text-[11.5px] text-muted-foreground transition-colors hover:border-foreground/50 hover:text-foreground"
                      title={p.blurb}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* 01 System prompt */}
                <NumberedSection index="01" title="System prompt">
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={9}
                    placeholder="Describe who the persona is and how it should behave…"
                    className="w-full resize-y rounded-lg border border-border/50 bg-background/60 p-3 text-[13.5px] leading-relaxed outline-none focus:border-foreground/50"
                  />
                  <ToggleRow
                    label="Default prompt"
                    checked={systemPrompt.trim() === DEFAULT_SYSTEM_PROMPT}
                    onChange={(on) => on && setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
                  />
                </NumberedSection>

                {/* 02 First greeting */}
                <NumberedSection index="02" title="First greeting">
                  <textarea
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    rows={3}
                    placeholder="Leave blank to let the persona generate its own greeting, or type the exact opening line you want it to say."
                    className="w-full resize-y rounded-lg border border-border/50 bg-background/60 p-3 text-[13.5px] leading-relaxed outline-none focus:border-foreground/50"
                  />
                  <ToggleRow label="Skip greeting" checked={skipGreeting} onChange={setSkipGreeting} />
                  <ToggleRow label="Interruptible" checked={interruptible} onChange={setInterruptible} />
                </NumberedSection>

                {/* 03 Director notes (beta) */}
                <NumberedSection index="03" title="Director notes" badge="beta">
                  <textarea
                    value={directorNotes}
                    onChange={(e) => setDirectorNotes(e.target.value)}
                    rows={2}
                    placeholder="Extra steering appended to the prompt — e.g. Always greet by name. Hand off to a human when unsure."
                    className="w-full resize-y rounded-lg border border-border/50 bg-background/60 p-3 text-[13.5px] leading-relaxed outline-none focus:border-foreground/50"
                  />
                </NumberedSection>
              </div>
            )}

            {/* ---------- AVATAR ---------- */}
            {tab === "avatar" && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-[15px] font-medium">Choose an avatar</h2>
                  <button
                    onClick={() => setCustomOpen((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] hover:border-foreground/60"
                  >
                    {customOpen ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    {customOpen ? "Cancel" : "Create your own"}
                  </button>
                </div>

                {customOpen && (
                  <CustomAvatarPanel
                    name={customName}
                    setName={setCustomName}
                    mode={customMode}
                    setMode={setCustomMode}
                    file={customFile}
                    setFile={setCustomFile}
                    url={customUrl}
                    setUrl={setCustomUrl}
                    uploading={customUploading}
                    error={customError}
                    onSubmit={submitCustomAvatar}
                  />
                )}

                {loadingCatalog ? (
                  <AvatarSkeletonGrid />
                ) : avatars.length === 0 ? (
                  <CatalogEmpty kind="avatars" />
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {avatars.map((a) => (
                      <AvatarCard key={a.id} avatar={a} selected={a.id === avatarId} onSelect={() => setAvatarId(a.id)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ---------- VOICE ---------- */}
            {tab === "voice" && (
              <div>
                <h2 className="text-[15px] font-medium">Choose a voice</h2>
                {loadingCatalog ? (
                  <VoiceSkeletonGrid />
                ) : voices.length === 0 ? (
                  <CatalogEmpty kind="voices" />
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-2.5">
                    {voices.map((v) => (
                      <VoiceCard key={v.id} voice={v} selected={v.id === voiceId} onSelect={() => setVoiceId(v.id)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ---------- LLM ---------- */}
            {tab === "llm" && (
              <div>
                <h2 className="text-[15px] font-medium">Choose a model</h2>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  The language model that reasons behind the avatar. Faster models feel snappier; larger ones reason deeper.
                </p>
                {loadingCatalog ? (
                  <LlmSkeletonGrid />
                ) : llms.length === 0 ? (
                  <div className="mt-4 rounded-lg border border-border/40 bg-background/40 p-4 text-[13px] text-muted-foreground">
                    Using the default model. No selectable LLMs were returned from Anam for this account.
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {llms.map((l) => (
                      <LlmCard key={l.id} llm={l} selected={l.id === llmId} onSelect={() => setLlmId(l.id)} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ===================== RIGHT: live preview dashboard ===================== */}
        <section className="lg:sticky lg:top-[76px] lg:self-start">
          <div className="liquid-glass overflow-hidden rounded-3xl p-3 sm:p-4">
            {/* Stage */}
            <div className="grid-bg relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/50 bg-black">
              <video
                ref={videoRef}
                id="anam-preview"
                autoPlay
                playsInline
                muted={false}
                poster={selectedAvatar?.imageUrl}
                className="absolute inset-0 h-full w-full object-cover"
              />

              {/* Connecting */}
              {previewing && !previewLive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/40 text-center backdrop-blur-[1px]">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Connecting…</div>
                </div>
              )}

              {/* Idle — Start call */}
              {!previewing && (
                <div className="absolute inset-x-0 bottom-0 flex justify-center p-5">
                  <button
                    onClick={startLivePreview}
                    className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[13px] font-semibold text-black shadow-lg transition-transform hover:scale-[1.02]"
                    style={{ backgroundColor: ACCENT }}
                  >
                    <Phone className="h-4 w-4" />
                    Start call
                  </button>
                </div>
              )}

              {/* Live — end control */}
              {previewLive && (
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-gradient-to-t from-black/60 to-transparent p-5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-white backdrop-blur">
                    <Mic className="h-3.5 w-3.5" /> Live
                  </span>
                  <button
                    onClick={stopPreview}
                    className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur hover:bg-black/80"
                  >
                    End
                  </button>
                </div>
              )}
            </div>

            {previewErr && (
              <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-[12px] text-destructive">
                {previewErr}
              </div>
            )}
            {previewTimings && previewLive && (
              <div className="mt-2 text-center text-[10.5px] text-muted-foreground">
                token {previewTimings.tokenMs}ms · first frame {previewTimings.firstFrameMs}ms · total {previewTimings.totalMs}ms
              </div>
            )}

            {/* Summary strip — every choice on one dashboard */}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <SummaryChip label="Avatar" value={selectedAvatar?.name ?? "—"} onClick={() => setTab("avatar")} />
              <SummaryChip label="Avatar model" value={selectedAvatar?.model ?? DEFAULT_AVATAR_MODEL} onClick={() => setTab("avatar")} />
              <SummaryChip label="Voice" value={selectedVoice?.name ?? "—"} onClick={() => setTab("voice")} />
              <SummaryChip label="LLM" value={selectedLlm?.name ?? "Default"} onClick={() => setTab("llm")} />
            </div>
          </div>

          {/* Deploy result */}
          {deployId && (
            <div className="liquid-glass mt-4 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <span className="flex h-2 w-2 items-center justify-center">
                  <span className="h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: ACCENT }} />
                </span>
                Published · live
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 truncate rounded-lg border border-border/60 bg-background px-3 py-2 text-[13px]"
                />
                <button
                  onClick={copyShareUrl}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-[12px] font-semibold text-background"
                >
                  {copied ? <Check className="h-4 w-4" /> : null}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.14em] text-foreground"
                >
                  Open talk page <ArrowRight className="h-3.5 w-3.5" />
                </a>
                {saveState === "saved" ? (
                  <Link to="/personas" className="text-[12px] text-muted-foreground hover:text-foreground">
                    Saved to your personas →
                  </Link>
                ) : saveState === "anon" ? (
                  <span className="text-[12px] text-muted-foreground">
                    <Link to="/login?redirect=/personas" className="text-foreground underline">Sign in</Link> to save it.
                  </span>
                ) : saveState === "failed" ? (
                  <span className="text-[12px] text-muted-foreground">Share link works; couldn't save to library.</span>
                ) : null}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/* ============================ sub-components ============================ */

function NumberedSection({
  index, title, badge, children,
}: {
  index: string; title: string; badge?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-background/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5" style={{ color: ACCENT }} />
        <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{index}</span>
        <span className="text-[12px] font-semibold uppercase tracking-[0.14em]">{title}</span>
        {badge && (
          <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-[8.5px] uppercase tracking-[0.1em] text-muted-foreground">
            {badge}
          </span>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between border-t border-border/40 pt-3">
      <span className="text-[11.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "" : "bg-foreground/15"}`}
        style={checked ? { backgroundColor: ACCENT } : undefined}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function SummaryChip({ label, value, onClick }: { label: string; value: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-left transition-colors hover:border-foreground/40"
    >
      <div className="text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-[13px] font-medium">{value}</div>
    </button>
  );
}

function AvatarSkeletonGrid() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="liquid-glass relative aspect-[3/4] overflow-hidden rounded-2xl">
          <div className="absolute inset-0 animate-pulse bg-foreground/[0.04]" />
        </div>
      ))}
    </div>
  );
}

function VoiceSkeletonGrid() {
  return (
    <div className="mt-4 grid grid-cols-1 gap-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="liquid-glass flex items-center gap-4 rounded-2xl p-4">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-foreground/[0.06]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded-full bg-foreground/10" />
            <div className="h-2 w-2/3 animate-pulse rounded-full bg-foreground/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function LlmSkeletonGrid() {
  return (
    <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="liquid-glass rounded-2xl p-4">
          <div className="h-3 w-1/2 animate-pulse rounded-full bg-foreground/10" />
          <div className="mt-2 h-2 w-1/3 animate-pulse rounded-full bg-foreground/[0.06]" />
        </div>
      ))}
    </div>
  );
}

function CustomAvatarPanel(props: {
  name: string;
  setName: (s: string) => void;
  mode: "file" | "url";
  setMode: (m: "file" | "url") => void;
  file: File | null;
  setFile: (f: File | null) => void;
  url: string;
  setUrl: (s: string) => void;
  uploading: boolean;
  error: string | null;
  onSubmit: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useMemo(() => (props.file ? URL.createObjectURL(props.file) : null), [props.file]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="mt-4 rounded-2xl border border-foreground/30 bg-foreground/[0.04] p-4">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="w-full shrink-0 md:w-40">
          <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border border-border/60 bg-background/40">
            {props.mode === "file" && previewUrl ? (
              <img src={previewUrl} alt="preview" className="h-full w-full object-cover" />
            ) : props.mode === "url" && props.url ? (
              <img src={props.url} alt="preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Preview
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Avatar name</label>
            <input
              value={props.name}
              onChange={(e) => props.setName(e.target.value)}
              placeholder="e.g. Dr. Reyes"
              className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-[14px] outline-none focus:border-foreground/60"
            />
          </div>

          <div>
            <div className="mb-2 inline-flex rounded-full border border-border/60 p-0.5 text-[11px] uppercase tracking-[0.12em]">
              <button
                onClick={() => props.setMode("file")}
                className={`rounded-full px-3 py-1.5 ${props.mode === "file" ? "bg-foreground text-background" : "text-muted-foreground"}`}
              >
                Upload file
              </button>
              <button
                onClick={() => props.setMode("url")}
                className={`rounded-full px-3 py-1.5 ${props.mode === "url" ? "bg-foreground text-background" : "text-muted-foreground"}`}
              >
                Image URL
              </button>
            </div>

            {props.mode === "file" ? (
              <div>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => props.setFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <button
                  onClick={() => inputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 px-4 py-5 text-[12.5px] text-muted-foreground hover:border-foreground/50 hover:text-foreground"
                >
                  <Upload className="h-4 w-4" />
                  {props.file ? props.file.name : "Pick an image (JPEG, PNG, WebP · max 4.5MB)"}
                </button>
              </div>
            ) : (
              <input
                value={props.url}
                onChange={(e) => props.setUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-[14px] outline-none focus:border-foreground/60"
              />
            )}
          </div>

          {props.error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-[12px] text-destructive">
              {props.error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={props.onSubmit}
              disabled={props.uploading}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-background disabled:opacity-50"
            >
              {props.uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {props.uploading ? "Creating…" : "Create avatar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AvatarCard({ avatar, selected, onSelect }: { avatar: Avatar; selected: boolean; onSelect: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => {
        const v = videoRef.current;
        if (v) void v.play().catch(() => {});
      }}
      onMouseLeave={() => {
        const v = videoRef.current;
        if (v) {
          v.pause();
          v.currentTime = 0;
        }
      }}
      className={`group relative flex flex-col overflow-hidden rounded-xl border transition-colors ${
        selected ? "border-foreground" : "border-border/60 hover:border-foreground/40"
      }`}
    >
      <div className="relative aspect-[3/4] w-full bg-foreground/[0.04]">
        {avatar.imageUrl ? (
          <img src={avatar.imageUrl} alt={avatar.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            No preview
          </div>
        )}
        {avatar.videoUrl && (
          <video
            ref={videoRef}
            src={avatar.videoUrl}
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        )}
        {selected && (
          <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background">
            <Check className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2 text-[12px]">
        <div className="min-w-0 text-left">
          <div className="truncate font-medium">{avatar.name}</div>
          {avatar.model && (
            <div className="truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{avatar.model}</div>
          )}
        </div>
      </div>
    </button>
  );
}

function VoiceCard({ voice, selected, onSelect }: { voice: Voice; selected: boolean; onSelect: () => void }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  function togglePlay(e: React.MouseEvent) {
    e.stopPropagation();
    if (!voice.sampleUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(voice.sampleUrl);
      audioRef.current.addEventListener("ended", () => setPlaying(false));
    }
    if (playing) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    } else {
      void audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }

  return (
    <button
      onClick={onSelect}
      className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 text-left transition-colors ${
        selected ? "border-foreground bg-foreground/5" : "border-border/60 hover:border-foreground/40"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[14px] font-medium">{voice.name}</span>
          {voice.gender && (
            <span className="rounded-full border border-border/60 px-1.5 py-0.5 text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
              {voice.gender.toLowerCase()}
            </span>
          )}
          {voice.country && (
            <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">{voice.country}</span>
          )}
        </div>
        {voice.description && <div className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">{voice.description}</div>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {voice.sampleUrl && (
          <span
            role="button"
            onClick={togglePlay}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 hover:border-foreground/60"
          >
            <Play className={`h-3.5 w-3.5 ${playing ? "opacity-50" : ""}`} />
          </span>
        )}
        {selected && <Check className="mt-1 h-4 w-4" />}
      </div>
    </button>
  );
}

function LlmCard({ llm, selected, onSelect }: { llm: Llm; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 text-left transition-colors ${
        selected ? "border-foreground bg-foreground/5" : "border-border/60 hover:border-foreground/40"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Cpu className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-[14px] font-medium">{llm.name}</span>
        </div>
        {llm.model && (
          <div className="mt-1 truncate text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{llm.model}</div>
        )}
        {llm.description && <div className="mt-1 line-clamp-2 text-[12px] text-muted-foreground">{llm.description}</div>}
      </div>
      {selected && <Check className="mt-0.5 h-4 w-4 shrink-0" />}
    </button>
  );
}

function CatalogEmpty({ kind }: { kind: string }) {
  return (
    <div className="mt-4 rounded-lg border border-border/40 bg-background/40 p-6 text-center text-[13px] text-muted-foreground">
      No {kind} returned from Anam. Confirm <code>ANAM_API_KEY</code> is set in Vercel and the account has access.
    </div>
  );
}
