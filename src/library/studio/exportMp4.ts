// Renders a generated template to an MP4 in the browser. The render runs in
// its own sandbox iframe (the same opaque-origin sandbox as the preview), so
// generated code never runs on this page; the sandbox hands back the file.
import type { Brand } from "../brand";
import type { FromSandbox, ToSandbox } from "../../sandbox/protocol";
import type { StudioTemplate } from "./api";
import { sfxFiles } from "./sounds";

export async function exportMp4(opts: {
  template: StudioTemplate;
  brand: Brand;
  content: Record<string, string>;
  host: HTMLElement; // where the (tiny, visible) render frame lives; keeps the browser from throttling it
  onProgress: (p: number) => void;
  signal: AbortSignal;
}): Promise<Blob> {
  const { template: t, brand, content, host, onProgress, signal } = opts;
  const sfx = await sfxFiles(t.compiled);
  const frame = document.createElement("iframe");
  frame.src = "/sandbox.html";
  frame.setAttribute("sandbox", "allow-scripts");
  frame.title = "Video export";
  frame.style.cssText = "width:2px;height:2px;border:0;opacity:0.01;pointer-events:none;";
  return new Promise<Blob>((resolve, reject) => {
    const done = () => {
      window.removeEventListener("message", onMessage);
      signal.removeEventListener("abort", onAbort);
      frame.remove();
    };
    const fail = (message: string) => {
      done();
      reject(new Error(message));
    };
    const onAbort = () => fail("Export cancelled.");
    const onMessage = (e: MessageEvent<FromSandbox>) => {
      if (e.source !== frame.contentWindow || !e.data || typeof e.data !== "object") return;
      const m = e.data;
      if (m.type === "ready") {
        const load: ToSandbox = { type: "load", compiled: t.compiled, width: t.width, height: t.height, fps: t.fps, durationInFrames: t.durationInFrames, brand, content, controls: false, autoplay: false, sfx, export: true };
        frame.contentWindow?.postMessage(load, "*");
      } else if (m.type === "export-progress") onProgress(m.progress);
      else if (m.type === "exported") {
        done();
        resolve(new Blob([m.data], { type: m.mime || "video/mp4" }));
      } else if (m.type === "export-error") fail(m.message);
      else if (m.type === "error") fail(`The template hit an error while rendering: ${m.message}`);
    };
    if (signal.aborted) return reject(new Error("Export cancelled."));
    signal.addEventListener("abort", onAbort);
    window.addEventListener("message", onMessage);
    host.appendChild(frame);
  });
}
