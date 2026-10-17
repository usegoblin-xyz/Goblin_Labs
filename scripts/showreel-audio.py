"""Soundtrack for the Brand Showreel template, generated in code (no samples).

120 BPM, 15 s, 48 kHz stereo:
- kick on every beat
- riser through bar 6 (10-12 s) into the strongest bar
- hit on every scene change (every bar line, 2 s apart)
- first and last 50 ms silent, 0.3 s fade at the end, peak below -1 dBFS

The timings are the same beat grid the video uses (beat = 0.5 s), so picture
and sound share one clock. Run: python3 scripts/showreel-audio.py
"""
import wave
import numpy as np

SR = 48_000
DUR = 15.0
BEAT = 0.5
N = int(SR * DUR)
rng = np.random.default_rng(7)  # fixed seed: same file every run
out = np.zeros(N)


def add(sig, at, gain=1.0):
    i = int(at * SR)
    j = min(N, i + len(sig))
    if i < N:
        out[i:j] += sig[: j - i] * gain


def kick():
    t = np.arange(int(0.35 * SR)) / SR
    freq = 45 + 95 * np.exp(-t * 28)  # pitch drop 140 -> 45 Hz
    phase = 2 * np.pi * np.cumsum(freq) / SR
    body = np.sin(phase) * np.exp(-t * 9)
    click = rng.standard_normal(len(t)) * np.exp(-t * 400) * 0.25
    return body + click


def hit():
    t = np.arange(int(0.6 * SR)) / SR
    noise = rng.standard_normal(len(t))
    # simple one-pole lowpass for a dark, wide hit
    lp = np.zeros_like(noise)
    a = 0.12
    for k in range(1, len(noise)):
        lp[k] = lp[k - 1] + a * (noise[k] - lp[k - 1])
    thump = np.sin(2 * np.pi * 70 * t) * np.exp(-t * 7)
    return (lp * 2.2 + thump) * np.exp(-t * 6)


def riser(length):
    t = np.arange(int(length * SR)) / SR
    p = t / length
    freq = 180 * (8 ** p)  # 180 Hz -> 1440 Hz, exponential sweep
    tone = np.sin(2 * np.pi * np.cumsum(freq) / SR)
    noise = rng.standard_normal(len(t)) * 0.35
    env = p ** 2.2
    return (tone * 0.6 + noise) * env


k = kick()
for b in range(int(DUR / BEAT)):
    add(k, b * BEAT, 0.9)

h = hit()
for bar_line in (2, 4, 6, 8, 10, 12, 14):
    add(h, bar_line, 0.55)

add(riser(2.0), 10.0, 0.35)

# end: fade over the last 0.3 s; first/last 50 ms silent (no clicks at the loop)
fade = int(0.3 * SR)
out[-fade:] *= np.linspace(1, 0, fade) ** 1.5
out[: int(0.05 * SR)] = 0
out[-int(0.05 * SR):] = 0

# normalize to a -1.5 dBFS peak
peak = np.max(np.abs(out)) or 1
out = out / peak * (10 ** (-1.5 / 20))

stereo = np.stack([out, out], axis=1)
pcm = (stereo * 32767).astype("<i2")
path = "public/showreel/showreel-120bpm.wav"
with wave.open(path, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", path, f"{DUR}s", "peak dBFS:", round(20 * np.log10(np.max(np.abs(out))), 2))
