// Messages between the page and the preview sandbox (sandbox.html).
import type { Brand } from "../library/brand";

export type ToSandbox =
  | {
      type: "load";
      compiled: string;
      width: number;
      height: number;
      fps: number;
      durationInFrames: number;
      brand: Brand;
      content: Record<string, string | number>;
      controls: boolean;
      autoplay: boolean;
      // The sound-effect files the template uses, by name. The sandbox has no
      // network, so the page fetches them and hands them over.
      sfx: Record<string, ArrayBuffer>;
      // Render the template to an MP4 instead of playing it.
      export?: boolean;
    }
  | { type: "props"; brand: Brand; content: Record<string, string | number> };

export type FromSandbox =
  | { type: "ready" }
  | { type: "checked" }
  | { type: "error"; phase: "load" | "render" | "play"; message: string }
  | { type: "export-progress"; progress: number }
  | { type: "exported"; data: ArrayBuffer; mime: string }
  | { type: "export-error"; message: string };
