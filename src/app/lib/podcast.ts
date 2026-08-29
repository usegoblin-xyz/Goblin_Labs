// Podcast studio: composite the persona (Ben) and the host's webcam side-by-side
// onto a canvas, mix both audio sources (host mic + persona voice), and record
// the result to a downloadable webm. Deliberately dependency-free — canvas 2D +
// WebAudio + MediaRecorder only — so there's no segmentation model to load and
// no CDN at runtime. Two-up composition means no green-screen/keying is needed.

export type PodcastStudio = {
  /** Begin recording the composited canvas + mixed audio. Safe to call once. */
  startRecording: () => void;
  /** Stop and resolve with the finished webm blob (null if nothing recorded). */
  stopRecording: () => Promise<Blob | null>;
  isRecording: () => boolean;
  /** Tear everything down: RAF loop, webcam tracks, audio graph, DOM nodes. */
  dispose: () => void;
};

type StudioOpts = {
  /** The <canvas> we draw into (owned by the caller / React). */
  canvas: HTMLCanvasElement;
  /** The Anam stage <video> element — its srcObject carries Ben's video+audio. */
  personaVideo: HTMLVideoElement;
  /** Labels burned into each cell. */
  hostLabel?: string;
  personaLabel?: string;
};

// Draw a video frame into a destination cell with object-fit: cover semantics
// (fill the cell, cropping overflow, never letterboxing).
function drawCover(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return; // no frame yet
  const scale = Math.max(dw / vw, dh / vh);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = (vw - sw) / 2;
  const sy = (vh - sh) / 2;
  ctx.drawImage(video, sx, sy, sw, sh, dx, dy, dw, dh);
}

function drawLabel(ctx: CanvasRenderingContext2D, text: string, x: number, bottom: number) {
  ctx.save();
  ctx.font = "600 22px ui-sans-serif, system-ui, sans-serif";
  const padX = 14;
  const w = ctx.measureText(text).width + padX * 2;
  const h = 34;
  const y = bottom - h;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  // rounded pill
  const r = 8;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + padX, y + h / 2 + 1);
  ctx.restore();
}

function pickMime(): string | undefined {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
  }
  return undefined;
}

export async function createPodcastStudio(opts: StudioOpts): Promise<PodcastStudio> {
  const { canvas, personaVideo } = opts;
  const hostLabel = opts.hostLabel ?? "You";
  const personaLabel = opts.personaLabel ?? "Guest";

  const W = 1280;
  const H = 720;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas not supported in this browser.");

  // 1. Host camera + mic. This is a SECOND mic capture alongside Anam's own
  //    input capture; browsers share the device fine. Video is the left cell.
  let camStream: MediaStream;
  try {
    camStream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      audio: { echoCancellation: true, noiseSuppression: true },
    });
  } catch (e) {
    throw new Error(
      "Couldn't access your camera/mic for the recording. Grant permission and try again.",
    );
  }

  const camVideo = document.createElement("video");
  camVideo.srcObject = camStream;
  camVideo.muted = true; // never play host mic to speakers (would echo)
  camVideo.playsInline = true;
  // Keep it in the DOM but out of view; some browsers won't paint a fully
  // detached <video> to canvas.
  camVideo.style.cssText =
    "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px;top:0;";
  document.body.appendChild(camVideo);
  await camVideo.play().catch(() => {});

  // 2. Compositing loop — two portrait cells, thin divider, burned-in labels.
  const CELL = W / 2;
  let raf = 0;
  const render = () => {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);
    drawCover(ctx, camVideo, 0, 0, CELL, H);
    drawCover(ctx, personaVideo, CELL, 0, CELL, H);
    // divider
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(CELL - 1, 0, 2, H);
    drawLabel(ctx, hostLabel, 18, H - 18);
    drawLabel(ctx, personaLabel, CELL + 18, H - 18);
    raf = requestAnimationFrame(render);
  };
  raf = requestAnimationFrame(render);

  // 3. Audio graph: mix host mic + Ben's audio into one destination track.
  //    Ben's audio still reaches the speakers via the <video> element; we only
  //    TAP the streams here for the recording, we don't route them to output.
  const AudioCtx: typeof AudioContext =
    (window as any).AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioCtx();
  const dest = audioCtx.createMediaStreamDestination();

  const hostAudioTracks = camStream.getAudioTracks();
  if (hostAudioTracks.length) {
    audioCtx.createMediaStreamSource(new MediaStream(hostAudioTracks)).connect(dest);
  }
  const benSrc = personaVideo.srcObject as MediaStream | null;
  const benAudioTracks = benSrc?.getAudioTracks?.() ?? [];
  if (benAudioTracks.length) {
    audioCtx.createMediaStreamSource(new MediaStream(benAudioTracks)).connect(dest);
  }
  await audioCtx.resume().catch(() => {});

  // 4. Recording target: canvas video track + mixed audio track.
  let recorder: MediaRecorder | null = null;
  let chunks: BlobData[] = [];
  type BlobData = Blob;
  let recording = false;
  let mime: string | undefined;

  const startRecording = () => {
    if (recording) return;
    const canvasStream = canvas.captureStream(30);
    const mixed = new MediaStream();
    canvasStream.getVideoTracks().forEach((t) => mixed.addTrack(t));
    dest.stream.getAudioTracks().forEach((t) => mixed.addTrack(t));
    mime = pickMime();
    recorder = new MediaRecorder(mixed, mime ? { mimeType: mime } : undefined);
    chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    recorder.start(1000); // gather in 1s slices so a crash still leaves data
    recording = true;
  };

  const stopRecording = () =>
    new Promise<Blob | null>((resolve) => {
      if (!recorder || !recording) {
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        recording = false;
        resolve(chunks.length ? new Blob(chunks, { type: mime ?? "video/webm" }) : null);
      };
      recorder.stop();
    });

  const dispose = () => {
    cancelAnimationFrame(raf);
    try {
      if (recorder && recording) recorder.stop();
    } catch {
      /* ignore */
    }
    camStream.getTracks().forEach((t) => t.stop());
    camVideo.srcObject = null;
    camVideo.remove();
    audioCtx.close().catch(() => {});
  };

  return {
    startRecording,
    stopRecording,
    isRecording: () => recording,
    dispose,
  };
}
