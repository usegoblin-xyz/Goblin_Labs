// The sound effects generated templates can use, as <Sfx name="…" at={s} />.
// Plain data, so the API's checks and prompt can import it too. The WAVs are
// synthesised by scripts/audio/sfx.py into public/sfx/; keep the two in step.
export const SFX = {
  whoosh: { seconds: 0.3, about: "short air whoosh for a quick move or wipe" },
  swoosh: { seconds: 0.45, about: "bigger, fuller whoosh for a scene change" },
  swipe: { seconds: 0.16, about: "fast thin swipe for a card or slide sliding in" },
  pop: { seconds: 0.08, about: "bubbly pop for something appearing" },
  click: { seconds: 0.03, about: "UI click or button press" },
  tick: { seconds: 0.03, about: "tiny tick for counters, checkboxes, list items" },
  snap: { seconds: 0.06, about: "crisp snap for text locking into place" },
  typing: { seconds: 1.2, about: "keyboard typing, about 1.2 s" },
  ding: { seconds: 1.0, about: "bright notification ding" },
  chime: { seconds: 1.5, about: "three-note rising chime for a reveal" },
  sparkle: { seconds: 0.9, about: "glittery shimmer for magic or delight" },
  success: { seconds: 0.9, about: "upbeat two-chord success sound" },
  error: { seconds: 0.4, about: "double buzz for a problem or wrong answer" },
  impact: { seconds: 1.2, about: "deep hit for a big title landing" },
  boom: { seconds: 1.8, about: "huge cinematic boom" },
  thud: { seconds: 0.25, about: "soft low thud for something dropping in" },
  "bass-drop": { seconds: 1.6, about: "falling sub-bass drop" },
  riser: { seconds: 1.5, about: "1.5 s rising noise build-up that peaks at its end" },
  glitch: { seconds: 0.4, about: "digital glitch stutter" },
  heartbeat: { seconds: 0.7, about: "two-beat heartbeat thump" },
  camera: { seconds: 0.3, about: "camera shutter" },
  countdown: { seconds: 0.09, about: "short beep for each count of a countdown" },
  drumroll: { seconds: 1.4, about: "1.4 s snare roll building up" },
} as const;

export type SfxName = keyof typeof SFX;
export const SFX_NAMES = Object.keys(SFX) as SfxName[];
export const isSfx = (n: string): n is SfxName => n in SFX;
