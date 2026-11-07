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
    }
  | { type: "props"; brand: Brand; content: Record<string, string | number> };

export type FromSandbox =
  | { type: "ready" }
  | { type: "checked" }
  | { type: "error"; phase: "load" | "render" | "play"; message: string };
