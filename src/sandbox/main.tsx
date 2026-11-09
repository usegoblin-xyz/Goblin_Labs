// The preview sandbox (sandbox.html). Receives a compiled template over
// postMessage, runs it with only the modules templates may import, plays it
// in a Remotion Player, and reports errors back to the parent page. In export
// mode it renders the template to an MP4 in the browser instead and hands the
// file back.
import "./storage-shim";
import * as React from "react";
import { Component, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode, type Ref } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { createRoot } from "react-dom/client";
import * as Remotion from "remotion";
import { Player as RemotionPlayer, type PlayerRef } from "@remotion/player";
import * as kit from "../library/kit";
import * as motion from "../library/motion";
import type { Brand } from "../library/brand";
import { setSfxResolver, isSfx } from "../library/sfx";
import { setMediaResolver, type MediaInfo } from "../library/media";
import type { ToSandbox, FromSandbox, MediaFile } from "./protocol";

const Player = RemotionPlayer as unknown as ComponentType<Record<string, unknown> & { ref?: Ref<PlayerRef> }>;

const MODULES: Record<string, unknown> = {
  react: React,
  "react/jsx-runtime": jsxRuntime,
  remotion: Remotion,
  "../../kit": kit,
  "../../motion": motion,
};

const post = (m: FromSandbox) => window.parent.postMessage(m, "*");
const describe = (e: unknown) => (e instanceof Error ? `${e.name}: ${e.message}` : String(e)).slice(0, 800);

type Props = { brand: Brand; content: Record<string, string | number>; audio?: boolean };

function evaluate(compiled: string): ComponentType<Props> {
  const module = { exports: {} as Record<string, unknown> };
  const require = (name: string) => {
    if (!(name in MODULES)) throw new Error(`Cannot import "${name}"`);
    return MODULES[name];
  };
  new Function("require", "module", "exports", compiled)(require, module, module.exports);
  const C = module.exports.default;
  if (typeof C !== "function") throw new Error("The template has no default-exported component.");
  return C as ComponentType<Props>;
}

// Catches errors thrown while a frame renders and reports the first one.
class Boundary extends Component<{ children: ReactNode; onError: (e: unknown) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(e: unknown) {
    this.props.onError(e);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// Sound effects arrive as files from the page; templates find them by name.
let sfxUrls: Record<string, string> = {};
function useSounds(files: Record<string, ArrayBuffer>) {
  for (const u of Object.values(sfxUrls)) URL.revokeObjectURL(u);
  sfxUrls = {};
  for (const [name, buf] of Object.entries(files ?? {})) if (isSfx(name)) sfxUrls[name] = URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
  setSfxResolver((name) => sfxUrls[name] ?? null);
}

// Photos and clips arrive as files too; templates find them by media id.
const mediaUrls = new Map<string, MediaInfo>();
function addMedia(files: Record<string, MediaFile> | undefined) {
  let added = false;
  for (const [id, f] of Object.entries(files ?? {})) {
    if (mediaUrls.has(id) || !f?.data) continue;
    mediaUrls.set(id, { url: URL.createObjectURL(new Blob([f.data], { type: f.mime })), kind: f.kind, width: f.width, height: f.height, durationSeconds: f.durationSeconds, meta: f.meta });
    added = true;
  }
  return added;
}
setMediaResolver((id) => mediaUrls.get(id) ?? null);

// The renderer only embeds fonts loaded this way (CSS @font-face isn't
// carried into SVG text), so the brand fonts load through @remotion/google-fonts.
async function loadExportFonts() {
  const [inter, grotesk, serif, mono] = await Promise.all([
    import("@remotion/google-fonts/Inter"),
    import("@remotion/google-fonts/SpaceGrotesk"),
    import("@remotion/google-fonts/InstrumentSerif"),
    import("@remotion/google-fonts/JetBrainsMono"),
  ]);
  const opts = { subsets: ["latin"] as ["latin"], ignoreTooManyRequestsWarning: true };
  await Promise.all([
    inter.loadFont("normal", { ...opts, weights: ["400", "500", "600", "700", "800", "900"] }).waitUntilDone(),
    grotesk.loadFont("normal", { ...opts, weights: ["400", "500", "600", "700"] }).waitUntilDone(),
    serif.loadFont("normal", { ...opts, weights: ["400"] }).waitUntilDone(),
    serif.loadFont("italic", { ...opts, weights: ["400"] }).waitUntilDone(),
    mono.loadFont("normal", { ...opts, weights: ["400", "500", "600", "700"] }).waitUntilDone(),
  ]);
}

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

function App() {
  const [job, setJob] = useState<Extract<ToSandbox, { type: "load" }> | null>(null);
  const [props, setProps] = useState<Props | null>(null);
  const [Comp, setComp] = useState<ComponentType<Props> | null>(null);
  const [nonce, setNonce] = useState(0);
  const failed = useRef(false);
  const player = useRef<PlayerRef>(null);

  useEffect(() => {
    const onMessage = (e: MessageEvent<ToSandbox>) => {
      if (e.source !== window.parent || !e.data || typeof e.data !== "object") return;
      const m = e.data;
      if (m.type === "load") {
        failed.current = false;
        try {
          useSounds(m.sfx);
          addMedia(m.media);
          const C = evaluate(m.compiled);
          setComp(() => C);
          setJob(m);
          setProps({ brand: m.brand, content: m.content, audio: false });
          setNonce((n) => n + 1);
        } catch (err) {
          setComp(null);
          post({ type: "error", phase: "load", message: describe(err) });
        }
      } else if (m.type === "props") {
        setProps({ brand: m.brand, content: m.content, audio: false });
      } else if (m.type === "media") {
        // Remount the player so frames pick up the new files.
        if (addMedia(m.media)) setNonce((n) => n + 1);
      }
    };
    window.addEventListener("message", onMessage);
    window.addEventListener("error", (e) => post({ type: "error", phase: "play", message: describe(e.error ?? e.message) }));
    post({ type: "ready" });
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const report = (e: unknown) => {
    if (failed.current) return;
    failed.current = true;
    post({ type: "error", phase: "render", message: describe(e) });
  };

  // The wrapped component, so render errors are caught inside the player.
  const Safe = useMemo(() => {
    if (!Comp) return null;
    return function Safe(p: Props) {
      return (
        <Boundary onError={report}>
          <Comp {...p} />
        </Boundary>
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Comp, nonce]);

  // Export mode: render every frame (and the sound effects) to an MP4.
  useEffect(() => {
    if (!Safe || !job || !job.export || !props) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        const { renderMediaOnWeb, canRenderMediaOnWeb } = await import("@remotion/web-renderer");
        const sound = Object.keys(sfxUrls).length > 0 || [...mediaUrls.values()].some((m) => m.kind === "video" || m.kind === "audio");
        const settings = { container: "mp4" as const, videoCodec: "h264" as const, audioCodec: sound ? ("aac" as const) : null, muted: !sound };
        const can = await canRenderMediaOnWeb({ ...settings, width: job.width, height: job.height } as never);
        if (!(can as { canRender?: boolean }).canRender) {
          const issues = ((can as { issues?: { message: string }[] }).issues ?? []).map((i) => i.message).join(" ");
          throw new Error(`This browser can't make MP4 files${issues ? ` (${issues})` : ""}. Try the latest Chrome, Edge or Safari.`);
        }
        await loadExportFonts();
        const res = await renderMediaOnWeb({
          composition: { component: Safe as never, id: "goblin", durationInFrames: job.durationInFrames, fps: job.fps, width: job.width, height: job.height },
          inputProps: props as never,
          ...settings,
          ...(job.frameRange ? { frameRange: job.frameRange } : {}),
          videoBitrate: "high",
          licenseKey: "free-license",
          signal: ctrl.signal,
          onProgress: (p: { progress: number }) => post({ type: "export-progress", progress: p.progress }),
        } as never);
        if (failed.current) return;
        const blob = await res.getBlob();
        const data = await blob.arrayBuffer();
        window.parent.postMessage({ type: "exported", data, mime: blob.type || "video/mp4" } satisfies FromSandbox, "*", [data]);
      } catch (err) {
        if (!ctrl.signal.aborted) post({ type: "export-error", message: describe(err) });
      }
    })();
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Safe, job]);

  // Smoke test: render a spread of frames before playing; any throw is reported.
  useEffect(() => {
    if (!Safe || !job || job.export) return;
    let cancelled = false;
    (async () => {
      await nextFrame();
      const last = job.durationInFrames - 1;
      for (const f of [0, Math.round(last * 0.25), Math.round(last * 0.5), Math.round(last * 0.75), last]) {
        if (cancelled || failed.current) return;
        player.current?.seekTo(f);
        await nextFrame();
      }
      if (cancelled || failed.current) return;
      post({ type: "checked" });
      // The player starts muted (sound effects play once the viewer unmutes),
      // which lets browsers autoplay it. If playback is still blocked, the
      // paused frame is one from the middle, not a blank first frame.
      const middle = Math.round(last * 0.55);
      const p = player.current;
      if (!p) return;
      if (!job.autoplay) return void p.seekTo(middle);
      p.seekTo(0);
      p.play();
      // Browsers can hold playback until the viewer interacts (the player's
      // clock waits on a suspended AudioContext). If the frame hasn't moved
      // after a moment, pause on a frame from the middle instead of a blank
      // first frame; the play button still works.
      let moved = false;
      const onFrame = () => (moved = true);
      p.addEventListener("frameupdate", onFrame);
      await new Promise((r) => setTimeout(r, 600));
      p.removeEventListener("frameupdate", onFrame);
      if (!cancelled && !moved) {
        p.pause();
        p.seekTo(middle);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [Safe, job]);

  if (!Safe || !job || !props || job.export) return null;
  const landscape = job.width / job.height >= 1;
  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: props.brand.background }}>
      <Player
        key={nonce}
        ref={player}
        component={Safe as never}
        inputProps={props as never}
        durationInFrames={job.durationInFrames}
        fps={job.fps}
        compositionWidth={job.width}
        compositionHeight={job.height}
        loop
        // Starts muted so it can autoplay; the volume button turns the sound
        // effects on.
        initiallyMuted
        // Sound effects use @remotion/media, not shared <audio> tags.
        numberOfSharedAudioTags={0}
        controls={job.controls}
        clickToPlay={job.controls}
        acknowledgeRemotionLicense
        style={{ aspectRatio: `${job.width} / ${job.height}`, width: landscape ? "100%" : "auto", height: landscape ? "auto" : "100%", maxWidth: "100%", maxHeight: "100%" }}
      />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
