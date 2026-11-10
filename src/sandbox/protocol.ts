// Messages between the page and the preview sandbox (sandbox.html).
import type { Brand } from "../library/brand";
import type { MediaInfo } from "../library/media";

// An uploaded photo or clip, handed over as its bytes (the sandbox has no network).
export type MediaFile = Omit<MediaInfo, "url"> & { data: ArrayBuffer; mime: string };

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
      // The user's photos and clips the content refers to, by media id.
      media?: Record<string, MediaFile>;
      // Render the template to an MP4 instead of playing it.
      export?: boolean;
      // Export only these frames (inclusive), for splitting a video into clips.
      frameRange?: [number, number];
      // Render these frames as JPEG stills instead (for comparing a remake with its reference).
      stills?: number[];
    }
  | { type: "props"; brand: Brand; content: Record<string, string | number> }
  // New photos or clips (for example after one is swapped in the side panel).
  | { type: "media"; media: Record<string, MediaFile> };

export type FromSandbox =
  | { type: "ready" }
  | { type: "checked" }
  | { type: "error"; phase: "load" | "render" | "play"; message: string }
  | { type: "export-progress"; progress: number }
  | { type: "exported"; data: ArrayBuffer; mime: string }
  | { type: "stills"; images: ArrayBuffer[] }
  | { type: "export-error"; message: string };
