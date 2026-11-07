import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Brand } from "../brand";
import type { FromSandbox, ToSandbox } from "../../sandbox/protocol";

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
  const cb = useRef({ onChecked, onError });
  cb.current = { onChecked, onError };
  const latest = useRef({ brand, content });
  latest.current = { brand, content };

  const send = (m: ToSandbox) => frame.current?.contentWindow?.postMessage(m, "*");

  useEffect(() => {
    const onMessage = (e: MessageEvent<FromSandbox>) => {
      if (!frame.current || e.source !== frame.current.contentWindow || !e.data || typeof e.data !== "object") return;
      if (e.data.type === "ready") setReady(true);
      else if (e.data.type === "checked") cb.current.onChecked?.();
      else if (e.data.type === "error") cb.current.onError?.(String(e.data.message).slice(0, 800));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // New code (or a fresh sandbox): load it.
  useEffect(() => {
    if (!ready) return;
    send({ type: "load", compiled, width, height, fps, durationInFrames, controls, autoplay, ...latest.current });
  }, [ready, compiled, width, height, fps, durationInFrames, controls, autoplay]);

  // Brand or copy edits: restyle without reloading the code.
  useEffect(() => {
    if (ready) send({ type: "props", brand, content });
  }, [ready, brand, content]);

  return (
    <iframe
      ref={frame}
      src="/sandbox.html"
      sandbox="allow-scripts"
      // Lets a click on this page (like Send) count for autoplay inside the frame.
      allow="autoplay"
      title="Template preview"
      className={className}
      style={{ border: 0, display: "block", background: brand.background, ...style }}
    />
  );
}
