// Cuts part of an existing MP4 (an explainer video) into its own MP4, in the
// browser, with Mediabunny. Templates don't need this: they re-render just the
// frames of each clip (see exportMp4's frameRange).
import { ALL_FORMATS, BlobSource, BufferTarget, Conversion, Input, Mp4OutputFormat, Output } from "mediabunny";

export async function cutMp4(file: Blob, range: { start: number; end: number }, onProgress: (p: number) => void, signal: AbortSignal): Promise<Blob> {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: "in-memory" }), target: new BufferTarget() });
  const conversion = await Conversion.init({ input, output, trim: { start: range.start, end: range.end } });
  if (!conversion.isValid) throw new Error("This video can't be cut in this browser.");
  const stop = () => void conversion.cancel();
  signal.addEventListener("abort", stop);
  conversion.onProgress = (p) => onProgress(p);
  try {
    await conversion.execute();
  } finally {
    signal.removeEventListener("abort", stop);
  }
  const buf = output.target.buffer;
  if (!buf) throw new Error("The clip came out empty.");
  return new Blob([buf], { type: "video/mp4" });
}
