// The pieces of the chat that handle the user's own photos and clips: the
// trim dialog for clips, the chips that show what's attached, and the dialog
// that cuts a finished video into shorter clips.
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Download, FileText, Film, ImageIcon, Loader2, Music2, Scissors, TriangleAlert, X } from "lucide-react";
import { cn } from "./utils";

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return m ? `${m}:${r.toFixed(1).padStart(4, "0")}` : `${r.toFixed(1)}s`;
};

function Modal({ label, onClose, children, wide }: { label: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        className={cn("max-h-[92vh] w-full overflow-y-auto rounded-2xl border border-white/12 bg-[#0c0c0c] p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.6)]", wide ? "max-w-[620px]" : "max-w-[460px]")}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

// ---- trimming a clip ------------------------------------------------------------
export const MAX_TRIM_SECONDS = 60;

// Two handles on one track, for the start and end of the part to keep.
function RangeTrack({ duration, start, end, onChange, playhead }: { duration: number; start: number; end: number; onChange: (s: number, e: number) => void; playhead?: number }) {
  const track = useRef<HTMLDivElement>(null);
  const drag = (which: "start" | "end") => (e: React.PointerEvent) => {
    e.preventDefault();
    const el = track.current;
    if (!el) return;
    const move = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const t = Math.min(duration, Math.max(0, ((ev.clientX - r.left) / r.width) * duration));
      if (which === "start") onChange(Math.min(t, end - 0.5), end);
      else onChange(start, Math.max(t, start + 0.5));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const pct = (t: number) => `${(t / duration) * 100}%`;
  return (
    <div ref={track} className="relative mt-4 h-10 rounded-lg bg-white/[0.06]">
      <div className="absolute inset-y-0 rounded-lg border-2 border-[#22A03A] bg-[#22A03A]/15" style={{ left: pct(start), width: `calc(${pct(end)} - ${pct(start)})` }} />
      {playhead !== undefined && <div className="pointer-events-none absolute inset-y-1 w-0.5 rounded bg-white/80" style={{ left: pct(playhead) }} />}
      {(["start", "end"] as const).map((w) => (
        <button
          key={w}
          type="button"
          aria-label={w === "start" ? "Start of the part to keep" : "End of the part to keep"}
          onPointerDown={drag(w)}
          onKeyDown={(e) => {
            const d = e.key === "ArrowLeft" ? -0.1 : e.key === "ArrowRight" ? 0.1 : 0;
            if (!d) return;
            e.preventDefault();
            if (w === "start") onChange(Math.min(Math.max(0, start + d), end - 0.5), end);
            else onChange(start, Math.max(Math.min(duration, end + d), start + 0.5));
          }}
          className="absolute top-1/2 h-12 w-4 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-md bg-[#22A03A] shadow focus:ring-2 focus:ring-white focus:outline-none"
          style={{ left: pct(w === "start" ? start : end) }}
        />
      ))}
    </div>
  );
}

export function TrimDialog({ src, duration, initial, onCancel, onDone }: { src: string; duration: number; initial?: { start: number; end: number } | null; onCancel: () => void; onDone: (trim: { start: number; end: number } | null) => void }) {
  const [start, setStart] = useState(initial?.start ?? 0);
  const [end, setEnd] = useState(initial?.end ?? Math.min(duration, 15));
  const [now, setNow] = useState(start);
  const video = useRef<HTMLVideoElement>(null);
  const tooLong = end - start > MAX_TRIM_SECONDS;

  // Play just the kept part, on a loop.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const onTime = () => {
      setNow(v.currentTime);
      if (v.currentTime >= end || v.currentTime < start - 0.05) v.currentTime = start;
    };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [start, end]);
  const change = (s: number, e: number) => {
    const moved = s !== start ? s : e - 0.3;
    setStart(+s.toFixed(2));
    setEnd(+e.toFixed(2));
    if (video.current) video.current.currentTime = Math.max(0, moved);
  };
  const whole = start <= 0.05 && end >= duration - 0.05;

  return (
    <Modal label="Trim your clip" onClose={onCancel}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[17px] font-semibold"><Scissors className="h-4 w-4 text-[#5fd67a]" /> Trim your clip</h2>
        <button onClick={onCancel} aria-label="Close" className="rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <p className="mt-1 text-[13px] text-white/50">Drag the green handles to keep just the part you want{duration > MAX_TRIM_SECONDS ? `, up to ${MAX_TRIM_SECONDS} seconds` : ""}.</p>
      <video ref={video} src={src} muted playsInline autoPlay loop className="mt-4 max-h-[46vh] w-full rounded-xl bg-black object-contain" onLoadedMetadata={(e) => (e.currentTarget.currentTime = start)} />
      <RangeTrack duration={duration} start={start} end={end} onChange={change} playhead={now} />
      <div className="mt-2 flex justify-between text-[12.5px] tabular-nums text-white/55">
        <span>{fmt(start)}</span>
        <span className={cn(tooLong ? "text-amber-300" : "text-white")}>Keeping {fmt(end - start)}{tooLong ? ` (max ${MAX_TRIM_SECONDS}s)` : ""}</span>
        <span>{fmt(end)}</span>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} className="h-9 rounded-full px-4 text-[13px] text-white/70 hover:bg-white/8 hover:text-white">Cancel</button>
        <button
          disabled={tooLong}
          onClick={() => onDone(whole ? null : { start, end })}
          className="h-9 rounded-full bg-[#22A03A] px-4 text-[13px] font-semibold text-black hover:bg-[#22A03A]/90 disabled:opacity-40"
        >
          Use this part
        </button>
      </div>
    </Modal>
  );
}

// ---- what's attached to the next message ---------------------------------------------------
// What an attachment is for: Goblin decides, it goes in the video, or it's
// only something for Goblin to look at.
export type Use = "auto" | "video" | "reference";
export type Pending = {
  key: string;
  file: File;
  preview: string; // a local URL for the thumbnail
  kind: "image" | "video" | "audio" | "doc";
  use: Use;
  label?: string; // e.g. "Goblin-made · upbeat"
  duration: number | null;
  trim: { start: number; end: number } | null;
  progress: number; // 0..1
  status: "uploading" | "ready" | "error";
  error?: string;
  mediaId?: string;
  width?: number | null;
  height?: number | null;
};

const USE_LABEL: Record<Use, string> = { auto: "Goblin decides", video: "In the video", reference: "Reference only" };
export function AttachmentChips({ items, onRemove, onTrim, onUse }: { items: Pending[]; onRemove: (key: string) => void; onTrim: (key: string) => void; onUse: (key: string, use: Use) => void }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-2 px-3 pt-3">
      {items.map((a) => (
        <div key={a.key} className={cn("relative flex items-center gap-2 rounded-xl border bg-white/[0.04] p-1.5 pr-2", a.status === "error" ? "border-amber-300/50" : "border-white/10")}>
          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-black">
            {a.kind === "image" ? (
              <img src={a.preview} alt="" className="h-full w-full object-cover" />
            ) : a.kind === "video" ? (
              <video src={a.preview} muted playsInline preload="metadata" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-white/[0.06] text-[#5fd67a]">{a.kind === "audio" ? <Music2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}</span>
            )}
            {a.status === "uploading" && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-[10.5px] font-semibold tabular-nums">{Math.round(a.progress * 100)}%</span>
            )}
          </span>
          <span className="min-w-0 max-w-[150px]">
            <span className="block truncate text-[12.5px] text-white/85">{a.label ?? a.file.name}</span>
            <span className={cn("flex items-center gap-1 text-[11px]", a.status === "error" ? "text-amber-300" : "text-white/45")}>
              {a.status === "error" ? (
                <><TriangleAlert className="h-3 w-3" /> {a.error ?? "Upload failed"}</>
              ) : a.kind === "video" ? (
                <><Film className="h-3 w-3" /> {a.trim ? `${fmt(a.trim.end - a.trim.start)} kept` : a.duration ? fmt(a.duration) : "Clip"}</>
              ) : a.kind === "audio" ? (
                <><Music2 className="h-3 w-3" /> {a.status === "uploading" && a.progress === 0 ? "Finding the beat…" : `Music${a.duration ? ` · ${fmt(a.duration)}` : ""}`}</>
              ) : a.kind === "doc" ? (
                <><FileText className="h-3 w-3" /> Reference</>
              ) : (
                <><ImageIcon className="h-3 w-3" /> Photo</>
              )}
            </span>
            {(a.kind === "image" || a.kind === "video") && a.status !== "error" && (
              <select
                value={a.use}
                onChange={(e) => onUse(a.key, e.target.value as Use)}
                aria-label={`How Goblin should use ${a.file.name}`}
                className="mt-0.5 block max-w-full cursor-pointer rounded border-0 bg-transparent p-0 text-[11px] text-[#7fe08f] outline-none hover:text-white"
              >
                {(Object.keys(USE_LABEL) as Use[]).map((u) => (
                  <option key={u} value={u} className="bg-[#111] text-white">{USE_LABEL[u]}</option>
                ))}
              </select>
            )}
          </span>
          {a.kind === "video" && a.status !== "error" && (
            <button onClick={() => onTrim(a.key)} aria-label={`Trim ${a.file.name}`} title="Trim" className="rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white">
              <Scissors className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={() => onRemove(a.key)} aria-label={`Remove ${a.file.name}`} className="rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ---- cutting a finished video into clips --------------------------------------------------
export type ClipRange = { start: number; end: number };
type ClipState = { status: "waiting" | "making" | "done" | "error"; progress: number; blob?: Blob; error?: string };

export function evenly(total: number, parts: number): ClipRange[] {
  const n = Math.max(1, Math.min(10, Math.round(parts)));
  const len = total / n;
  return Array.from({ length: n }, (_, i) => ({ start: +(i * len).toFixed(2), end: +(i === n - 1 ? total : (i + 1) * len).toFixed(2) }));
}
export function every(total: number, seconds: number): ClipRange[] {
  const len = Math.max(1, seconds);
  const out: ClipRange[] = [];
  for (let s = 0; s < total - 0.25; s += len) out.push({ start: +s.toFixed(2), end: +Math.min(total, s + len).toFixed(2) });
  return out.slice(0, 20);
}

export function SplitDialog({
  title,
  duration,
  onClose,
  make,
  save,
}: {
  title: string;
  duration: number;
  onClose: () => void;
  // Makes one clip as an MP4.
  make: (range: ClipRange, onProgress: (p: number) => void, signal: AbortSignal) => Promise<Blob>;
  save: (blob: Blob, index: number) => void;
}) {
  const [mode, setMode] = useState<"parts" | "every">(duration > 20 ? "every" : "parts");
  const [parts, setParts] = useState(duration > 8 ? 3 : 2);
  const [secs, setSecs] = useState(Math.min(15, Math.max(2, Math.round(duration / 3))));
  const ranges = useMemo(() => (mode === "parts" ? evenly(duration, parts) : every(duration, secs)), [mode, parts, secs, duration]);
  const [jobs, setJobs] = useState<ClipState[] | null>(null);
  const ctrl = useRef<AbortController | null>(null);
  const working = !!jobs && jobs.some((j) => j.status === "waiting" || j.status === "making");

  useEffect(() => () => ctrl.current?.abort(), []);

  const run = async () => {
    const c = new AbortController();
    ctrl.current = c;
    const list: ClipState[] = ranges.map(() => ({ status: "waiting", progress: 0 }));
    setJobs([...list]);
    for (let i = 0; i < ranges.length; i++) {
      if (c.signal.aborted) return;
      list[i] = { status: "making", progress: 0 };
      setJobs([...list]);
      try {
        const blob = await make(ranges[i], (p) => {
          list[i] = { ...list[i], progress: p };
          setJobs([...list]);
        }, c.signal);
        list[i] = { status: "done", progress: 1, blob };
      } catch (e) {
        if (c.signal.aborted) return;
        list[i] = { status: "error", progress: 0, error: e instanceof Error ? e.message : "Couldn't make this clip." };
      }
      setJobs([...list]);
    }
  };
  const close = () => {
    ctrl.current?.abort();
    onClose();
  };
  const done = jobs?.filter((j) => j.status === "done").length ?? 0;

  return (
    <Modal label="Cut into clips" onClose={close} wide>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[17px] font-semibold"><Scissors className="h-4 w-4 text-[#5fd67a]" /> Cut “{title}” into clips</h2>
        <button onClick={close} aria-label="Close" className="rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <p className="mt-1 text-[13px] text-white/50">The video is {fmt(duration)}. Each clip downloads as its own MP4, ready for Reels, TikTok or Shorts.</p>

      {!jobs && (
        <>
          <div className="mt-4 flex gap-1 rounded-xl border border-white/10 p-1 text-[13px]">
            {(["parts", "every"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m} className={cn("flex-1 rounded-lg py-1.5", mode === m ? "bg-white/10 text-white" : "text-white/55 hover:text-white")}>
                {m === "parts" ? "Equal parts" : "Every few seconds"}
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3 text-[13.5px]">
            {mode === "parts" ? (
              <>
                <span className="text-white/60">Number of clips</span>
                <input type="range" min={2} max={Math.max(2, Math.min(10, Math.floor(duration)))} value={parts} onChange={(e) => setParts(Number(e.target.value))} className="flex-1 accent-[#22A03A]" />
                <span className="w-6 text-right tabular-nums">{parts}</span>
              </>
            ) : (
              <>
                <span className="text-white/60">Clip length</span>
                <input type="range" min={2} max={Math.max(2, Math.min(60, Math.floor(duration)))} value={secs} onChange={(e) => setSecs(Number(e.target.value))} className="flex-1 accent-[#22A03A]" />
                <span className="w-10 text-right tabular-nums">{secs}s</span>
              </>
            )}
          </div>
          <div className="mt-4 flex h-9 overflow-hidden rounded-lg border border-white/10">
            {ranges.map((r, i) => (
              <div key={i} className="flex items-center justify-center border-r border-black/60 bg-[#22A03A]/20 text-[11px] text-[#9be8a8] last:border-r-0" style={{ width: `${((r.end - r.start) / duration) * 100}%` }}>
                {i + 1}
              </div>
            ))}
          </div>
          <ol className="mt-3 grid gap-1 text-[12.5px] text-white/55 sm:grid-cols-2">
            {ranges.map((r, i) => (
              <li key={i} className="tabular-nums">Clip {i + 1}: {fmt(r.start)} to {fmt(r.end)} ({fmt(r.end - r.start)})</li>
            ))}
          </ol>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={close} className="h-9 rounded-full px-4 text-[13px] text-white/70 hover:bg-white/8 hover:text-white">Cancel</button>
            <button onClick={run} className="h-9 rounded-full bg-[#22A03A] px-4 text-[13px] font-semibold text-black hover:bg-[#22A03A]/90">
              Make {ranges.length} clips
            </button>
          </div>
        </>
      )}

      {jobs && (
        <>
          <ul className="mt-4 grid gap-2">
            {jobs.map((j, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <span className="w-14 text-[13px] font-medium">Clip {i + 1}</span>
                <span className="flex-1 text-[12px] tabular-nums text-white/45">{fmt(ranges[i].start)} to {fmt(ranges[i].end)}</span>
                {j.status === "making" && <span className="flex items-center gap-1.5 text-[12px] text-white/60"><Loader2 className="h-3.5 w-3.5 animate-spin" />{Math.round(j.progress * 100)}%</span>}
                {j.status === "waiting" && <span className="text-[12px] text-white/35">Waiting</span>}
                {j.status === "error" && <span className="flex items-center gap-1 text-[12px] text-amber-300" title={j.error}><TriangleAlert className="h-3.5 w-3.5" /> Failed</span>}
                {j.status === "done" && (
                  <button onClick={() => save(j.blob!, i)} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/15 px-3 text-[12px] text-white/85 hover:bg-white/8">
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[12px] text-white/45">{working ? "Keep this tab open while the clips are made." : `${done} of ${jobs.length} clips ready.`}</span>
            <div className="flex gap-2">
              {!working && done > 1 && (
                <button
                  onClick={() => jobs.forEach((j, i) => j.blob && setTimeout(() => save(j.blob!, i), i * 400))}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#22A03A] px-4 text-[13px] font-semibold text-black hover:bg-[#22A03A]/90"
                >
                  <Download className="h-3.5 w-3.5" /> Download all
                </button>
              )}
              <button onClick={close} className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] text-white/70 hover:bg-white/8 hover:text-white">
                {working ? "Cancel" : <><Check className="h-3.5 w-3.5" /> Done</>}
              </button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

// ---- music --------------------------------------------------------------------------
export const MOOD_LIST = [
  { id: "calm", label: "Calm" },
  { id: "upbeat", label: "Upbeat" },
  { id: "cinematic", label: "Cinematic" },
  { id: "lofi", label: "Lo-fi" },
  { id: "epic", label: "Epic" },
  { id: "playful", label: "Playful" },
  { id: "corporate", label: "Corporate" },
] as const;

// The music controls in the panel: where the track starts, how loud, fades,
// looping and how far it dips under sound effects. Changes apply live.
export type MixState = { start: number; volume: number; fadeIn: number; fadeOut: number; loop: boolean; duck: number };
export function MusicControls({ name, bpm, duration, value, onChange, onReplace, onRemove, busy }: {
  name: string;
  bpm: number | null;
  duration: number | null;
  value: MixState;
  onChange: (m: Partial<MixState>) => void;
  onReplace: (file: File) => void;
  onRemove: () => void;
  busy?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const row = (label: string, el: React.ReactNode, shown: string) => (
    <label className="grid grid-cols-[92px_1fr_44px] items-center gap-2 text-[12px] text-white/55">
      <span>{label}</span>
      {el}
      <span className="text-right tabular-nums text-white/70">{shown}</span>
    </label>
  );
  const slider = (v: number, min: number, max: number, step: number, set: (x: number) => void) => (
    <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(Number(e.target.value))} className="w-full accent-[#22A03A]" />
  );
  return (
    <div className="rounded-lg border border-white/12 bg-white/[0.03] p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#22A03A]/15 text-[#5fd67a]"><Music2 className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] text-white/85">{name}</span>
          <span className="block text-[11.5px] text-white/45">{[bpm ? `${Math.round(bpm)} BPM` : null, duration ? fmt(duration) : null, "motion follows the beat"].filter(Boolean).join(" · ")}</span>
        </span>
        {busy && <Loader2 className="h-4 w-4 animate-spin text-white/50" />}
        <input ref={input} type="file" accept="audio/*,.mp3,.wav,.m4a" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onReplace(f); e.target.value = ""; }} />
        <button onClick={() => input.current?.click()} className="h-8 rounded-full border border-white/15 px-3 text-[12px] text-white/80 hover:bg-white/8 hover:text-white">Replace</button>
        <button onClick={onRemove} title="Remove music" aria-label="Remove music" className="rounded-full p-1.5 text-white/55 hover:bg-white/10 hover:text-white"><X className="h-3.5 w-3.5" /></button>
      </div>
      <div className="mt-3 grid gap-2">
        {duration && duration > 1 && row("Start at", slider(value.start, 0, Math.max(0, duration - 1), 0.1, (x) => onChange({ start: x })), fmt(value.start))}
        {row("Volume", slider(value.volume, 0, 1, 0.01, (x) => onChange({ volume: x })), `${Math.round(value.volume * 100)}%`)}
        {row("Fade in", slider(value.fadeIn, 0, 4, 0.1, (x) => onChange({ fadeIn: x })), fmt(value.fadeIn))}
        {row("Fade out", slider(value.fadeOut, 0, 4, 0.1, (x) => onChange({ fadeOut: x })), fmt(value.fadeOut))}
        {row("Dip under SFX", slider(value.duck, 0, 1, 0.05, (x) => onChange({ duck: x })), `${Math.round(value.duck * 100)}%`)}
        <label className="flex items-center gap-2 text-[12px] text-white/55">
          <input type="checkbox" checked={value.loop} onChange={(e) => onChange({ loop: e.target.checked })} className="accent-[#22A03A]" /> Loop the track if the video is longer
        </label>
      </div>
    </div>
  );
}
