// The preview sandbox (sandbox.html). Receives a compiled template over
// postMessage, runs it with only the modules templates may import, plays it
// in a Remotion Player, and reports errors back to the parent page.
import * as React from "react";
import { Component, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode, type Ref } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { createRoot } from "react-dom/client";
import * as Remotion from "remotion";
import { Player as RemotionPlayer, type PlayerRef } from "@remotion/player";
import * as kit from "../library/kit";
import * as motion from "../library/motion";
import type { Brand } from "../library/brand";
import type { ToSandbox, FromSandbox } from "./protocol";

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

  // Smoke test: render a spread of frames before playing; any throw is reported.
  useEffect(() => {
    if (!Safe || !job) return;
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
      player.current?.seekTo(0);
      if (job.autoplay) player.current?.play();
    })();
    return () => {
      cancelled = true;
    };
  }, [Safe, job]);

  if (!Safe || !job || !props) return null;
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
        controls={job.controls}
        clickToPlay={job.controls}
        acknowledgeRemotionLicense
        style={{ aspectRatio: `${job.width} / ${job.height}`, width: landscape ? "100%" : "auto", height: landscape ? "auto" : "100%", maxWidth: "100%", maxHeight: "100%" }}
      />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
