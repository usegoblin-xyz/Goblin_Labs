import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Brand } from "../brand";
import { GeckoLoader } from "@/app/components/ui/gecko-loader";
import type { FromSandbox, ToSandbox } from "../../sandbox/protocol";
import { sfxFiles } from "./sounds";

type Props = {
  compiled: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  brand: Brand;
  content: Record<string, string | number>;
  controls?: boolean;
  autoplay?: boolean;
  className?: string;
  style?: CSSProperties;
  // Called once the sandbox has rendered a spread of frames without errors,
  // or with the first error it hit.
  onChecked?: () => void;
  onError?: (message: string) => void;
};

// Plays a generated template inside the sandbox iframe. The iframe has
// sandbox="allow-scripts" and no allow-same-origin, so the generated code
// runs on an opaque origin with no access to this page, its cookies or
// storage. Messages from it are only trusted if they come from that frame.
export function SandboxPlayer({ compiled, width, height, fps, durationInFrames, brand, content, controls = true, autoplay = true, className, style, onChecked, onError }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  // The gecko covers the frame until the preview passes its check (or fails),
  // then settles and fades out.
  const [loaded, setLoaded] = useState(false);
  const [gone, setGone] = useState(false);
  const cb = useRef({ onChecked, onError });
  cb.current = { onChecked, onError };
  const latest = useRef({ brand, content });
  latest.current = { brand, content };

  const send = (m: ToSandbox) => frame.current?.contentWindow?.postMessage(m, "*");

  useEffect(() => {
    const onMessage = (e: MessageEvent<FromSandbox>) => {
      if (!frame.current || e.source !== frame.current.contentWindow || !e.data || typeof e.data !== "object") return;
      if (e.data.type === "ready") setReady(true);
      else if (e.data.type === "checked") {
        setLoaded(true);
        cb.current.onChecked?.();
      } else if (e.data.type === "error") {
        setLoaded(true);
        cb.current.onError?.(String(e.data.message).slice(0, 800));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // New code (or a fresh sandbox): load it.
  useEffect(() => {
    if (!ready) return;
    setLoaded(false);
    setGone(false);
    let stale = false;
    sfxFiles(compiled).then((sfx) => !stale && send({ type: "load", sfx, compiled, width, height, fps, durationInFrames, controls, autoplay, ...latest.current }));
    return () => {
      stale = true;
    };
  }, [ready, compiled, width, height, fps, durationInFrames, controls, autoplay]);

  // Brand or copy edits: restyle without reloading the code.
  useEffect(() => {
    if (ready) send({ type: "props", brand, content });
  }, [ready, brand, content]);

  return (
    <div className={className} style={{ position: "relative", ...style }}>
      <iframe
        ref={frame}
        src="/sandbox.html"
        sandbox="allow-scripts"
        // Lets a click on this page (like Send) count for autoplay inside the frame.
        allow="autoplay"
        title="Template preview"
        style={{ border: 0, display: "block", width: "100%", height: "100%", background: brand.background }}
      />
      {!gone && (
        <div
          aria-hidden={loaded}
          onTransitionEnd={() => loaded && setGone(true)}
          style={{ position: "absolute", inset: 0, background: "#0a0a0a", pointerEvents: loaded ? "none" : "auto", opacity: loaded ? 0 : 1, transition: "opacity 450ms ease 650ms" }}
        >
          <GeckoLoader done={loaded} label="Loading preview" />
        </div>
      )}
    </div>
  );
}
