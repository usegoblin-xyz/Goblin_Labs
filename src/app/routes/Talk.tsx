import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router";
import { Loader2, Mic, PhoneOff, Sparkles, Circle, Square, Download } from "lucide-react";
import {
  startTalk,
  getPersona,
  LEAD_GEN_PERSONA_IDS,
  type SessionHandle,
  type DeployedPersona,
  type PrefillArgs,
} from "@/app/lib/anam";
import { createPodcastStudio, type PodcastStudio } from "@/app/lib/podcast";
import { captureVisit, getVisitorId } from "@/app/lib/leads";
import LeadCard from "@/app/components/LeadCard";

type Phase = "idle" | "connecting" | "live" | "ended" | "error";

// Master switch for the on-screen capture card. Set false to hide it without
// touching the persona wiring. NOTE: this only hides the card — a lead-gen
// persona still gets the prefill tool and will talk about a form the visitor
// can't see. To turn the whole feature off, empty LEAD_GEN_PERSONA_IDS instead.
const SHOW_LEAD_CARD = true;

export default function Talk({ embed = false }: { embed?: boolean }) {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  // Podcast mode: side-by-side host webcam + persona, recordable to a webm.
  // Opt-in via ?room=1 so the normal Talk page is completely unaffected.
  const roomMode = searchParams.get("room") === "1";
  const [phase, setPhase] = useState<Phase>("idle");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [persona, setPersona] = useState<DeployedPersona | null>(null);
  // Values Gabriel calls prefill_contact with, one field at a time. Merged so a
  // later call for `email` doesn't drop the `name` he sent a moment earlier.
  const [prefill, setPrefill] = useState<PrefillArgs>({});

  const videoRef = useRef<HTMLVideoElement>(null);
  const handleRef = useRef<SessionHandle | null>(null);

  // Podcast-studio state (only used when roomMode).
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const studioRef = useRef<PodcastStudio | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [studioErr, setStudioErr] = useState<string | null>(null);
  // Explicit readiness flag: studioRef is a ref (no re-render on change), so the
  // record controls gate on this instead, guaranteeing they appear once ready.
  const [studioReady, setStudioReady] = useState(false);

  const name = persona?.name ?? "Persona";
  // Only lead-gen personas mint with the prefill tool, so only they get a card,
  // and only once the session is under way — never behind the idle overlay.
  const showLeadCard =
    !embed && SHOW_LEAD_CARD && !!id && LEAD_GEN_PERSONA_IDS.has(id) && phase !== "idle";

  // Resolve the persona (name + config) up front so "Start" is instant — and
  // so a bad link fails visibly here instead of rendering the wrong persona.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getPersona(id)
      .then((p) => {
        if (cancelled) return;
        if (p) {
          setPersona(p);
        } else {
          setErr("This persona link is invalid, or the persona was changed or deleted. Ask for a fresh link.");
          setPhase("error");
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Log the landing immediately — before any click, so even a bounce during
  // avatar warmup is captured as a sourced lead.
  useEffect(() => {
    if (id) captureVisit(id);
  }, [id]);

  // Tear the session down on unmount.
  useEffect(() => {
    return () => {
      handleRef.current?.stop().catch(() => {});
      studioRef.current?.dispose();
      studioRef.current = null;
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    if (!id || !videoRef.current) return;
    setErr(null);
    setBusy(false);
    setPhase("connecting");
    try {
      // Ensure we have the persona's config (in case the mount fetch is still in flight).
      let p = persona;
      if (!p) {
        p = await getPersona(id);
        if (p) setPersona(p);
      }
      if (!p) throw new Error("This persona could not be found.");
      handleRef.current = await startTalk(
        videoRef.current,
        p.id,
        p.config,
        getVisitorId(),
        (args: PrefillArgs) => setPrefill((prev: PrefillArgs) => ({ ...prev, ...args })),
      );
      setPhase("live");

      // Spin up the podcast studio once Ben's stream is live and painting.
      // A studio failure (e.g. camera denied) must NOT kill the conversation,
      // so it's caught and surfaced separately.
      if (roomMode && canvasRef.current) {
        try {
          studioRef.current = await createPodcastStudio({
            canvas: canvasRef.current,
            personaVideo: videoRef.current,
            hostLabel: "You",
            personaLabel: name,
          });
          setStudioErr(null);
          setStudioReady(true);
        } catch (e: any) {
          setStudioErr(e?.message ?? "Couldn't start the recording studio.");
        }
      }
    } catch (e: any) {
      setBusy(Boolean(e?.busy));
      setErr(e?.message ?? String(e));
      setPhase("error");
    }
  }

  async function end() {
    // If a recording is still rolling, finalize it so the take isn't lost.
    if (studioRef.current?.isRecording()) {
      await finishRecording();
    }
    studioRef.current?.dispose();
    studioRef.current = null;
    setStudioReady(false);
    await handleRef.current?.stop().catch(() => {});
    handleRef.current = null;
    setPhase("ended");
  }

  function beginRecording() {
    if (!studioRef.current) return;
    // Drop any previous take's object URL before starting a fresh one.
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    studioRef.current.startRecording();
    setRecording(true);
  }

  async function finishRecording() {
    const blob = await studioRef.current?.stopRecording();
    setRecording(false);
    if (blob) setRecordedUrl(URL.createObjectURL(blob));
  }

  if (!id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-[14px] text-muted-foreground">No persona specified.</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-background text-foreground">
      {/* Header */}
      {!embed && (
        <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="text-[14px] font-semibold tracking-tight">
            Goblin Labs
          </Link>
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {roomMode
              ? `Rooms${phase === "live" ? " · Recording session" : ""}`
              : phase === "live"
                ? "Live"
                : "Persona"}
          </span>
        </header>
      )}

      {/* Stage */}
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pt-24 pb-20 lg:flex-row lg:items-center lg:gap-8">
        <div
          className={
            (roomMode
              ? "aspect-video w-full max-w-[960px]"
              : "aspect-[3/4] w-full max-w-[460px]") +
            " relative overflow-hidden rounded-3xl border border-border/60 bg-black shadow-2xl"
          }
        >
          {/* Ben's stream. In room mode it stays mounted but transparent — the
              canvas samples it as the right-hand cell and draws the composite. */}
          <video
            ref={videoRef}
            id="anam-talk-stage"
            autoPlay
            playsInline
            className={
              "absolute inset-0 h-full w-full object-cover" +
              (roomMode ? " opacity-0" : "")
            }
          />
          {roomMode && (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full bg-black object-contain"
            />
          )}

          {/* Pre-start / connecting / ended overlays */}
          {phase !== "live" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/70 px-6 text-center backdrop-blur-sm">
              <div className="text-[1.6rem] font-medium tracking-tight">{name}</div>

              {phase === "idle" && (
                <>
                  <p className="max-w-[280px] text-[13px] leading-relaxed text-muted-foreground">
                    {roomMode ? (
                      <>
                        <span className="font-medium text-foreground">Rooms</span>{" "}
                        — sit down for a podcast-style conversation with {name}.
                        Your camera and microphone join the room; press{" "}
                        <span className="font-medium text-foreground">Record</span>{" "}
                        to capture the session and download it when you're done.
                      </>
                    ) : (
                      <>
                        A real-time persona from Goblin Labs. It sees and hears
                        you, and talks back. Your mic stays on while the call is
                        live.
                      </>
                    )}
                  </p>
                  <button
                    onClick={start}
                    className="mt-2 inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-background"
                  >
                    <Sparkles className="h-4 w-4" />
                    {roomMode ? "Enter the room" : "Start conversation"}
                  </button>
                  <p className="text-[11px] text-muted-foreground">
                    {roomMode
                      ? "Allow camera and microphone when prompted."
                      : "Allow microphone access when prompted."}
                  </p>
                </>
              )}

              {phase === "connecting" && (
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Connecting…
                </div>
              )}

              {phase === "ended" && (
                <>
                  <button
                    onClick={start}
                    className="mt-2 inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-background"
                  >
                    Start again
                  </button>
                  {roomMode && recordedUrl && (
                    <a
                      href={recordedUrl}
                      download="goblin-podcast.webm"
                      className="inline-flex items-center gap-2 rounded-full border border-border/60 px-6 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em]"
                    >
                      <Download className="h-4 w-4" /> Download recording
                    </a>
                  )}
                </>
              )}

              {phase === "error" && (
                <>
                  <div
                    className={
                      busy
                        ? "max-w-[300px] rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-[12px] text-amber-500"
                        : "max-w-[300px] rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-[12px] text-destructive"
                    }
                  >
                    {busy ? "The line is busy. " : null}
                    {err ?? "Couldn't start the session."}
                  </div>
                  <button
                    onClick={start}
                    className="mt-1 inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-background"
                  >
                    Try again
                  </button>
                </>
              )}
            </div>
          )}

          {/* Live controls */}
          {phase === "live" && (
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-center gap-3 bg-gradient-to-t from-black/70 to-transparent px-4 pb-5 pt-12">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-white backdrop-blur">
                <Mic className="h-3.5 w-3.5" /> Listening
              </span>

              {/* Podcast recording controls (room mode only) */}
              {roomMode && studioReady && (
                recording ? (
                  <button
                    onClick={finishRecording}
                    aria-label="Stop recording"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-black"
                  >
                    <Square className="h-3.5 w-3.5 fill-current" /> Stop
                  </button>
                ) : (
                  <button
                    onClick={beginRecording}
                    aria-label="Start recording"
                    className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white"
                  >
                    <Circle className="h-3.5 w-3.5 fill-current" /> Record
                  </button>
                )
              )}

              {roomMode && recordedUrl && !recording && (
                <a
                  href={recordedUrl}
                  download="goblin-podcast.webm"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur"
                >
                  <Download className="h-4 w-4" /> Download
                </a>
              )}

              <button
                onClick={end}
                aria-label="End conversation"
                className="inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white"
              >
                <PhoneOff className="h-4 w-4" /> End
              </button>

              {roomMode && studioErr && (
                <p className="w-full text-center text-[11px] text-amber-400">{studioErr}</p>
              )}
            </div>
          )}
        </div>

        {/* Typed capture running alongside the voice conversation. Gabriel fills
            it via prefill_contact as he learns each detail; the visitor confirms
            by tapping Send, so an email never has to be spoken back. */}
        {showLeadCard && (
          <LeadCard
            personaId={id}
            personaName={name}
            prefill={prefill}
            className="w-full max-w-[460px] lg:max-w-[340px]"
          />
        )}
      </main>

      {!embed && (
        <footer className="absolute inset-x-0 bottom-0 z-10 px-5 py-4 text-center text-[11px] text-muted-foreground">
          Built with Goblin Labs · real-time AI personas
        </footer>
      )}
    </div>
  );
}
