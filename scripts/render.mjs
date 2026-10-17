// Render a library template to MP4.
//   node scripts/render.mjs showreel out/showreel.mp4 [--blur 3] [--frames 0-120]
// Uses the same template code as the homepage preview, so the file matches it.
// Set BROWSER_EXECUTABLE to use a specific Chrome/Chromium.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [id = "showreel", out = `out/${id}.mp4`] = process.argv.slice(2).filter((a, i, all) => !a.startsWith("--") && !all[i - 1]?.startsWith("--"));
const flag = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const blur = Number(flag("blur", "3"));
const frames = flag("frames", null);

const serveUrl = await bundle({
  entryPoint: path.join(root, "render/index.ts"),
  publicDir: path.join(root, "public"),
  webpackOverride: (config) => ({
    ...config,
    resolve: { ...config.resolve, alias: { ...(config.resolve?.alias ?? {}), "@": path.join(root, "src") } },
  }),
});

const browserExecutable = process.env.BROWSER_EXECUTABLE || null;
const comp = await selectComposition({ serveUrl, id, inputProps: { blur }, browserExecutable });
const inputProps = { ...comp.defaultProps, blur };

let last = -1;
await renderMedia({
  serveUrl,
  composition: comp,
  inputProps,
  codec: "h264",
  outputLocation: path.resolve(root, out),
  browserExecutable,
  concurrency: process.env.CONCURRENCY ? Number(process.env.CONCURRENCY) : null,
  frameRange: frames ? frames.split("-").map(Number) : null,
  audioCodec: "aac",
  audioBitrate: "192k",
  crf: 16,
  onProgress: ({ progress }) => {
    const p = Math.floor(progress * 10);
    if (p !== last) {
      last = p;
      console.log(`render ${Math.round(progress * 100)}%`);
    }
  },
});
console.log("wrote", out);
