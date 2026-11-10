// Renders a few frames of a generated template as JPEG stills, in its own
// sandbox iframe like exportMp4, then pairs them with a reference video's
// frames on one sheet (reference left, remake right) so Goblin can compare.
import type { Brand } from "../brand";
import type { FromSandbox, ToSandbox } from "../../sandbox/protocol";
import type { StudioTemplate } from "./api";
import { sfxFiles } from "./sounds";
import { mediaFiles } from "./media";

export async function renderStills(opts: { template: StudioTemplate; brand: Brand; content: Record<string, string>; host: HTMLElement; frames: number[]; signal: AbortSignal }): Promise<Blob[]> {
  const { template: t, brand, content, host, frames, signal } = opts;
  const [sfx, media] = await Promise.all([sfxFiles(t.compiled), mediaFiles(content)]);
  const frame = document.createElement("iframe");
  frame.src = "/sandbox.html";
  frame.setAttribute("sandbox", "allow-scripts");
  frame.title = "Stills";
  frame.style.cssText = "width:2px;height:2px;border:0;opacity:0.01;pointer-events:none;";
  return new Promise<Blob[]>((resolve, reject) => {
    const done = () => {
      window.removeEventListener("message", onMessage);
      signal.removeEventListener("abort", onAbort);
      frame.remove();
    };
    const fail = (message: string) => (done(), reject(new Error(message)));
    const onAbort = () => fail("Cancelled.");
    const onMessage = (e: MessageEvent<FromSandbox>) => {
      if (e.source !== frame.contentWindow || !e.data || typeof e.data !== "object") return;
      const m = e.data;
      if (m.type === "ready") {
        const load: ToSandbox = { type: "load", compiled: t.compiled, width: t.width, height: t.height, fps: t.fps, durationInFrames: t.durationInFrames, brand, content, controls: false, autoplay: false, sfx, media, export: true, stills: frames };
        frame.contentWindow?.postMessage(load, "*");
      } else if (m.type === "stills") {
        done();
        resolve(m.images.map((b) => new Blob([b], { type: "image/jpeg" })));
      } else if (m.type === "export-error") fail(m.message);
      else if (m.type === "error") fail(`The template hit an error while rendering: ${m.message}`);
    };
    if (signal.aborted) return reject(new Error("Cancelled."));
    signal.addEventListener("abort", onAbort);
    window.addEventListener("message", onMessage);
    host.appendChild(frame);
  });
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't load a comparison frame."));
    img.src = src;
  });

// One JPEG: pairs (reference | remake) with the time above each, 4 pairs a row.
export async function compareSheet(pairs: { time: number; reference: string; remake: Blob }[], aspect: number): Promise<Blob> {
  const w = 180;
  const h = Math.round(w / aspect);
  const label = 22;
  const gap = 10;
  const cols = Math.min(4, pairs.length);
  const rows = Math.ceil(pairs.length / cols);
  const canvas = document.createElement("canvas");
  canvas.width = cols * (2 * w + gap) - gap;
  canvas.height = rows * (h + label + gap) - gap;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#808080";
  g.fillRect(0, 0, canvas.width, canvas.height);
  for (const [i, p] of pairs.entries()) {
    const x = (i % cols) * (2 * w + gap);
    const y = Math.floor(i / cols) * (h + label + gap);
    const url = URL.createObjectURL(p.remake);
    try {
      const [a, b] = await Promise.all([loadImage(p.reference), loadImage(url)]);
      g.drawImage(a, x, y + label, w, h);
      g.drawImage(b, x + w, y + label, w, h);
    } finally {
      URL.revokeObjectURL(url);
    }
    g.fillStyle = "#ffffff";
    g.fillRect(x, y, 2 * w, label);
    g.fillStyle = "#c00000";
    g.font = "bold 14px sans-serif";
    g.fillText(`${p.time.toFixed(2)} s   reference | remake`, x + 6, y + 16);
  }
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't make the comparison."))), "image/jpeg", 0.88));
}
