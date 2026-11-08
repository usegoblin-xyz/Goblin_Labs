// The sandbox has an opaque origin, so reading localStorage throws. Remotion
// reads it for small settings, so give it an in-memory stand-in that lasts
// only as long as this frame.
function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v)),
  };
}
for (const name of ["localStorage", "sessionStorage"] as const) {
  try {
    void window[name];
  } catch {
    Object.defineProperty(window, name, { value: memoryStorage(), configurable: true });
  }
}
export {};
