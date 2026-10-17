"""Original soundtrack for the UI Morph template, generated in code.

120 BPM, 7 bars (14 s), 48 kHz stereo.
Music bed: kick on beats 1 and 3, soft hat on off-beats, bass and pad on
I-V-vi-IV in C (C, G, Am, F, C, G, Am). UI sounds sit on the same event times
the animation uses (see T in src/library/templates/UIMorph.tsx).
Music peaks around -18 dBFS, UI sounds around -10 dBFS, master below -1 dBFS.
Run: python3 scripts/ui-morph-audio.py
"""
import wave
import numpy as np

SR = 48_000
BEAT = 0.5
DUR = 14.0
N = int(SR * DUR)
rng = np.random.default_rng(11)
music = np.zeros((N, 2))
fx = np.zeros((N, 2))


def place(buf, sig, at, gain=1.0, pan=0.0):
    i = int(round(at * SR))
    if i >= N:
        return
    j = min(N, i + len(sig))
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    buf[i:j, 0] += sig[: j - i] * gain * l
    buf[i:j, 1] += sig[: j - i] * gain * r


def env(n, a=0.005, d=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


def tone(freq, length, a=0.005, d=0.3, partials=(1.0,)):
    n = int(length * SR)
    t = np.arange(n) / SR
    s = sum(amp * np.sin(2 * np.pi * freq * (k + 1) * t) for k, amp in enumerate(partials))
    return s * env(n, a, d)


def lowpass(x, a):
    y = np.zeros_like(x)
    for k in range(1, len(x)):
        y[k] = y[k - 1] + a * (x[k] - y[k - 1])
    return y


# ---- music bed ---------------------------------------------------------------
def kick():
    t = np.arange(int(0.3 * SR)) / SR
    f = 48 + 80 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)


def hat():
    n = int(0.05 * SR)
    x = rng.standard_normal(n)
    x = x - lowpass(x, 0.35)  # crude highpass
    return x * env(n, 0.001, 0.012)


NOTE = {"C2": 65.41, "G1": 49.0, "A1": 55.0, "F1": 43.65}
CHORDS = [  # bass root, pad triad (Hz)
    ("C2", [261.6, 329.6, 392.0]),
    ("G1", [246.9, 293.7, 392.0]),
    ("A1", [261.6, 329.6, 440.0]),
    ("F1", [261.6, 349.2, 440.0]),
]
k = kick()
h = hat()
for b in range(int(DUR / BEAT)):
    t0 = b * BEAT
    if b % 2 == 0:
        place(music, k, t0, 0.9)
    place(music, h, t0 + BEAT / 2, 0.18, pan=0.25)
for bar in range(7):
    root, triad = CHORDS[bar % 4]
    t0 = bar * 4 * BEAT
    bass = tone(NOTE[root], 2.0, a=0.01, d=0.9, partials=(1.0, 0.35, 0.12))
    place(music, bass, t0, 0.55)
    for i, f in enumerate(triad):
        pad = tone(f, 2.0, a=0.25, d=1.4, partials=(1.0, 0.2))
        place(music, pad, t0, 0.06, pan=(-0.4, 0.0, 0.4)[i])

# ---- UI sounds (times match the animation's timeline) ------------------------
def click(bright=1.0):
    n = int(0.045 * SR)
    x = rng.standard_normal(n) * env(n, 0.0005, 0.006)
    body = tone(1800 * bright, 0.045, a=0.0005, d=0.01)
    return x * 0.6 + body * 0.5


def swoosh(length=0.28, up=True):
    n = int(length * SR)
    x = rng.standard_normal(n)
    a = np.linspace(0.02, 0.18, n) if up else np.linspace(0.18, 0.02, n)
    y = np.zeros(n)
    for i in range(1, n):
        y[i] = y[i - 1] + a[i] * (x[i] - y[i - 1])
    shape = np.sin(np.linspace(0, np.pi, n)) ** 2
    return y * shape * 1.6


def chime(base):
    return tone(base, 0.9, a=0.004, d=0.35, partials=(1.0, 0.3)) + 0.6 * tone(base * 1.5, 0.9, a=0.004, d=0.3)


def tick():
    return tone(2600, 0.03, a=0.0005, d=0.006) * 0.7


def stretch(length):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = 160 + 140 * (t / length)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.linspace(0, np.pi, n)) * 0.5


B = lambda n: n * BEAT
for t_ in (B(1), B(6), B(16), B(18), B(19)):  # clicks: button, play, toggle, tabs
    place(fx, click(), t_ - 0.004, 0.9)
for t_ in (B(8), B(12)):  # grabs
    place(fx, click(0.7), t_, 0.7)
for t_ in (B(10), B(14)):  # releases
    place(fx, click(1.25), t_, 0.55)
for t_ in (B(1), B(3), B(4), B(5), B(11), B(15), B(17), B(20), B(23), B(24), B(26), B(27)):  # morphs
    place(fx, swoosh(), t_ - 0.06, 0.32, pan=-0.15)
place(fx, chime(880), B(3), 0.32)  # check
place(fx, chime(1046.5), B(26), 0.32)  # toast
for d in (0.0, 0.12, 0.24):  # typing
    place(fx, tick(), B(24) + d, 0.8, pan=0.2)
place(fx, click(1.1), B(26) - 0.004, 0.8)  # enter
place(fx, stretch(0.5), B(13), 0.5)  # slider pulled past max
place(fx, swoosh(0.4, up=True), B(21), 0.25, pan=0.3)  # chart draws
place(fx, tick(), B(22), 0.6)  # tooltip

# ---- mix ------------------------------------------------------------------------
def peak_to(x, dbfs):
    p = np.max(np.abs(x)) or 1
    return x / p * 10 ** (dbfs / 20)


mix = peak_to(music, -18) + peak_to(fx, -10)
fade = int(0.3 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
edge = int(0.05 * SR)
mix[:edge] = 0
mix[-edge:] = 0
mix = peak_to(mix, -1.5)

pcm = (mix * 32767).astype("<i2")
path = "public/ui-morph/ui-morph-120bpm.wav"
with wave.open(path, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", path)
