// Photos and clips people upload, as templates see them. A template field of
// type "media" holds a reference like "media:<id>", optionally with a trim for
// clips: "media:<id>#t=2.5,9" (start and end, in seconds of the clip).
// The page looks each one up and hands the file to the sandbox, which turns it
// into a local URL; templates read that URL back through mediaSrc().

export type MediaInfo = {
  url: string;
  kind: "image" | "video" | "audio" | "doc";
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  // Music: what the browser measured on upload (tempo, beat times in seconds
  // of the track, bar starts, a loudness curve at 10 points per second).
  meta?: { bpm?: number | null; beats?: number[]; downbeats?: number[]; energy?: number[]; generated?: boolean; mood?: string } | null;
};
// start/end: the part of a clip or track that plays (seconds of the file).
// Music also carries its mix: volume, fade in and out (seconds), whether it
// loops, and how far it dips under sound effects (0 = not at all).
export type MediaRef = { id: string; start: number | null; end: number | null; volume: number | null; fadeIn: number | null; fadeOut: number | null; loop: boolean | null; duck: number | null };
export type MediaMix = Partial<Pick<MediaRef, "volume" | "fadeIn" | "fadeOut" | "loop" | "duck">>;

const REF = /^media:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:#(.*))?$/;
const n = (s?: string) => (s !== undefined && s !== "" && Number.isFinite(Number(s)) && Number(s) >= 0 ? Number(s) : null);

export function parseMediaRef(v: unknown): MediaRef | null {
  if (typeof v !== "string") return null;
  const m = REF.exec(v.trim());
  if (!m) return null;
  const q = new Map((m[2] ?? "").split("&").filter(Boolean).map((p) => p.split("=") as [string, string]));
  if ([...q.keys()].some((k) => !["t", "v", "fi", "fo", "loop", "duck"].includes(k))) return null;
  const [a, b] = (q.get("t") ?? ",").split(",");
  const start = n(a);
  const end = n(b);
  const clamp = (x: number | null, hi: number) => (x === null ? null : Math.min(hi, x));
  return {
    id: m[1],
    start,
    end: end !== null && start !== null && end <= start ? null : end,
    volume: clamp(n(q.get("v")), 1),
    fadeIn: clamp(n(q.get("fi")), 30),
    fadeOut: clamp(n(q.get("fo")), 30),
    loop: q.has("loop") ? q.get("loop") !== "0" : null,
    duck: clamp(n(q.get("duck")), 1),
  };
}

const r2 = (x: number) => +x.toFixed(2);
export function mediaRef(id: string, trim?: { start: number; end?: number | null } | null, mix?: MediaMix) {
  const q: string[] = [];
  if (trim) q.push(`t=${r2(trim.start)},${trim.end != null ? r2(trim.end) : ""}`);
  if (mix?.volume != null) q.push(`v=${r2(mix.volume)}`);
  if (mix?.fadeIn != null) q.push(`fi=${r2(mix.fadeIn)}`);
  if (mix?.fadeOut != null) q.push(`fo=${r2(mix.fadeOut)}`);
  if (mix?.loop != null) q.push(`loop=${mix.loop ? 1 : 0}`);
  if (mix?.duck != null) q.push(`duck=${r2(mix.duck)}`);
  return `media:${id}${q.length ? "#" + q.join("&") : ""}`;
}
// The same media with some settings changed.
export function withMix(ref: string, change: { start?: number | null; end?: number | null } & MediaMix): string {
  const r = parseMediaRef(ref);
  if (!r) return ref;
  const start = change.start !== undefined ? change.start : r.start;
  const end = change.end !== undefined ? change.end : r.end;
  const pick = <K extends keyof MediaMix>(k: K) => (change[k] !== undefined ? change[k] : r[k]);
  return mediaRef(r.id, start !== null || end !== null ? { start: start ?? 0, end } : null, { volume: pick("volume"), fadeIn: pick("fadeIn"), fadeOut: pick("fadeOut"), loop: pick("loop"), duck: pick("duck") });
}

export const isMediaRef = (v: unknown) => parseMediaRef(v) !== null;

// The media ids used by a set of field values.
export function mediaIdsIn(values: Record<string, unknown>): string[] {
  const ids = new Set<string>();
  for (const v of Object.values(values ?? {})) {
    const r = parseMediaRef(v);
    if (r) ids.add(r.id);
  }
  return [...ids];
}

let resolve: (id: string) => MediaInfo | null = () => null;
export const setMediaResolver = (f: (id: string) => MediaInfo | null) => {
  resolve = f;
};
export const mediaInfo = (ref: unknown): (MediaInfo & MediaRef) | null => {
  const r = parseMediaRef(ref);
  if (!r) return null;
  const info = resolve(r.id);
  return info ? { ...info, ...r } : null;
};
