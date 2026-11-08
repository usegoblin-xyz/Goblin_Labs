// Fetches the sound-effect files a compiled template uses, for handing to the
// sandbox (which has no network). Each file is fetched once per page.
import { sfxUsedIn } from "../sfx";

const cache = new Map<string, Promise<ArrayBuffer | null>>();
const load = (name: string) => {
  let p = cache.get(name);
  if (!p) {
    p = fetch(`/sfx/${name}.wav`)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .catch(() => null);
    cache.set(name, p);
  }
  return p;
};

export async function sfxFiles(compiled: string): Promise<Record<string, ArrayBuffer>> {
  const names = sfxUsedIn(compiled);
  const bufs = await Promise.all(names.map(load));
  const out: Record<string, ArrayBuffer> = {};
  names.forEach((n, i) => {
    if (bufs[i]) out[n] = bufs[i]!;
  });
  return out;
}
