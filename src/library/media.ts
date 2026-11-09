// Photos and clips people upload, as templates see them. A template field of
// type "media" holds a reference like "media:<id>", optionally with a trim for
// clips: "media:<id>#t=2.5,9" (start and end, in seconds of the clip).
// The page looks each one up and hands the file to the sandbox, which turns it
// into a local URL; templates read that URL back through mediaSrc().

export type MediaInfo = { url: string; kind: "image" | "video"; width?: number | null; height?: number | null; durationSeconds?: number | null };
export type MediaRef = { id: string; start: number | null; end: number | null };

const REF = /^media:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:#t=([\d.]+)?,([\d.]+)?)?$/;

export function parseMediaRef(v: unknown): MediaRef | null {
  if (typeof v !== "string") return null;
  const m = REF.exec(v.trim());
  if (!m) return null;
  const n = (s?: string) => (s !== undefined && s !== "" && Number.isFinite(Number(s)) ? Number(s) : null);
  const start = n(m[2]);
  const end = n(m[3]);
  return { id: m[1], start, end: end !== null && start !== null && end <= start ? null : end };
}

export function mediaRef(id: string, trim?: { start: number; end: number } | null) {
  return trim ? `media:${id}#t=${+trim.start.toFixed(2)},${+trim.end.toFixed(2)}` : `media:${id}`;
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
