"""Small synth + sequencer shared by the library soundtracks.

Everything is generated from code (no samples), so every track is original and
free to use. A track is built from a Song: a tempo, a key and lists of events.
"""
import wave
import numpy as np
from scipy.signal import butter, lfilter

SR = 48_000


class Song:
    def __init__(self, dur, bpm=120, seed=1):
        self.dur, self.bpm = dur, bpm
        self.beat = 60 / bpm
        self.s16 = self.beat / 4
        self.bar = self.beat * 4
        self.N = int(SR * dur)
        self.rng = np.random.default_rng(seed)
        self.bus = {k: np.zeros((self.N, 2)) for k in ("mus", "drm", "fx")}
        self.side = np.ones(self.N)

    # -- placement --
    def put(self, bus, sig, at, gain=1.0, pan=0.0):
        buf = self.bus[bus]
        i = int(round(at * SR))
        if i >= self.N or i + len(sig) <= 0:
            return
        if sig.ndim == 1:
            sig = np.stack([sig * np.cos((pan + 1) * np.pi / 4), sig * np.sin((pan + 1) * np.pi / 4)], 1) * 1.4142
        j = min(self.N, i + len(sig))
        buf[max(0, i):j] += sig[max(0, -i): j - i] * gain

    def duck(self, at, depth=0.6, length=0.22):
        i = int(at * SR)
        j = min(self.N, i + int(length * SR))
        if 0 <= i < self.N:
            self.side[i:j] = np.minimum(self.side[i:j], (1 - depth) + depth * np.linspace(0, 1, j - i) ** 0.6)

    # -- generators --
    def noise(self, n):
        return self.rng.standard_normal(int(n * SR))

    def write(self, path, levels=(-11, -8, -9), fade=0.5):
        mus, drm, fx = self.bus["mus"], self.bus["drm"], self.bus["fx"]
        mus = mus * self.side[:, None]
        mix = sum(peak(b, db) for b, db in zip((mus, drm, fx), levels) if np.abs(b).max() > 0)
        mix = np.tanh(mix * 1.15) / np.tanh(1.15)
        f = int(fade * SR)
        mix[-f:] *= np.linspace(1, 0, f)[:, None] ** 1.5
        a = int(0.004 * SR)
        mix[:a] *= np.linspace(0, 1, a)[:, None]
        mix = peak(mix, -1.0)
        with wave.open(path, "wb") as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((mix * 32767).astype("<i2").tobytes())
        print("wrote", path)


def peak(x, db):
    p = np.max(np.abs(x)) or 1
    return x / p * 10 ** (db / 20)


def T(n):
    return np.arange(int(n * SR)) / SR


def env(n, a=0.003, d=0.2):
    t = T(n)
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


def lp(x, f, o=2):
    b, a = butter(o, min(0.99, f / (SR / 2)))
    return lfilter(b, a, x)


def hp(x, f, o=2):
    b, a = butter(o, f / (SR / 2), "high")
    return lfilter(b, a, x)


def bp(x, lo, hi):
    b, a = butter(2, [lo / (SR / 2), min(0.99, hi / (SR / 2))], "band")
    return lfilter(b, a, x)


def midi(m):
    return 440 * 2 ** ((m - 69) / 12)


_rng = np.random.default_rng(7)


def noise(n):
    return _rng.standard_normal(int(n * SR))


def saw(f, n):
    t = T(n)
    return 2 * ((f * t) % 1) - 1


def sine(f, n):
    return np.sin(2 * np.pi * f * T(n))


def square(f, n, duty=0.5):
    return np.where((f * T(n)) % 1 < duty, 1.0, -1.0)


# ---- drums ----
def kick(n=0.42, punch=1.6, low=46):
    t = T(n)
    f = low + 130 * np.exp(-t * 38)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    click = hp(noise(n), 2000) * np.exp(-t * 300) * 0.4
    return np.tanh((body + click) * punch)


def clap():
    n = 0.3
    x = bp(noise(n), 900, 4000)
    t = T(n)
    e = np.exp(-t * 22)
    for d in (0.008, 0.017):
        e = e + 0.8 * np.exp(-np.maximum(0, t - d) * 140) * (t > d)
    return x * e * 0.8


def snare(tone=185):
    n = 0.25
    t = T(n)
    return bp(noise(n), 1500, 8000) * np.exp(-t * 18) * 0.9 + np.sin(2 * np.pi * tone * t) * np.exp(-t * 30) * 0.6


def hat(open_=False):
    n = 0.22 if open_ else 0.05
    return hp(noise(n), 7000, 3) * env(n, 0.0005, 0.07 if open_ else 0.012)


def tom(f=120, n=0.3):
    t = T(n)
    fr = f * (1 + 0.6 * np.exp(-t * 30))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 12)


def rim():
    return bp(noise(0.04), 1800, 5000) * env(0.04, 0.0005, 0.008) + sine(1700, 0.04) * env(0.04, 0.0005, 0.01) * 0.5


# ---- tones ----
def pluck(m, n=0.32, bright=3500, d=0.12):
    f = midi(m)
    x = saw(f, n) * 0.6 + saw(f * 1.006, n) * 0.4
    return lp(x, bright) * env(n, 0.002, d)


def stab(ms, n=0.24, bright=2600):
    return sum(pluck(m, n, bright) for m in ms) / len(ms)


def bass(m, n, cut=700, drive=1.6):
    f = midi(m)
    t = T(n)
    x = saw(f, n) + 0.5 * np.sin(2 * np.pi * f / 2 * t)
    return np.tanh(lp(x, cut) * drive) * env(n, 0.004, n * 0.9)


def sub(m, n):
    return sine(midi(m), n) * env(n, 0.01, n * 0.8)


def pad(ms, n, cut=1200):
    x = sum(saw(midi(m), n) * 0.5 + saw(midi(m) * 1.004, n) * 0.5 for m in ms) / len(ms)
    t = T(n)
    a = np.minimum(1, t / 0.5) * np.minimum(1, (n - t) / 0.6)
    return lp(x, cut) * a


def bell(m, n=1.2):
    f = midi(m)
    t = T(n)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)) * np.exp(-t * 3)


def keys(ms, n=0.6):
    t = T(n)
    x = sum(np.sin(2 * np.pi * midi(m) * t) + 0.3 * np.sin(4 * np.pi * midi(m) * t) for m in ms) / len(ms)
    return x * np.exp(-t * 4) * np.minimum(1, t / 0.004)


# ---- fx ----
def blip(f0, f1, n=0.12):
    t = T(n)
    f = np.geomspace(f0, f1, len(t))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, n / 3)


def riser(n, lo=300, hi=6000):
    x = noise(n)
    out = np.zeros_like(x)
    steps = 24
    L = len(x) // steps
    for k in range(steps):
        f = lo * (hi / lo) ** (k / steps)
        s = bp(x[k * L:(k + 1) * L + 1200], f * 0.7, min(f * 1.4, 20000))[:L]
        out[k * L:k * L + len(s)] = s
    return out * np.linspace(0, 1, len(x)) ** 2


def whoosh(n=0.22, f=1800):
    x = bp(noise(n), f * 0.5, f * 1.6)
    return x * np.sin(np.linspace(0, np.pi, len(x))) ** 2


def impact(n=1.4):
    t = T(n)
    s = np.sin(2 * np.pi * (38 + 60 * np.exp(-t * 20)) * t) * np.exp(-t * 3)
    return np.tanh(s * 1.5 + lp(noise(n), 1200) * np.exp(-t * 8) * 0.5)


def snap():
    x = hp(noise(0.06), 3000) * env(0.06, 0.0005, 0.01)
    x[: int(0.04 * SR)] += blip(2400, 1200, 0.04) * 0.3
    return x


def tick(f=3200):
    return blip(f, f * 0.8, 0.025)


def click():
    x = hp(noise(0.03), 2500) * env(0.03, 0.0003, 0.004)
    x += blip(1800, 1200, 0.03) * 0.4
    return x


def pop(f=600):
    return blip(f, f * 2.2, 0.08)


def thud(f=90):
    return tom(f, 0.25) * 0.8


# ---- patterns ----
PROGS = {
    "Fm": [(41, [65, 68, 72]), (37, [65, 68, 73]), (44, [63, 68, 72]), (39, [63, 67, 70])],
    "C": [(36, [60, 64, 67]), (43, [59, 62, 67]), (45, [60, 64, 69]), (41, [60, 65, 69])],
    "Am": [(45, [60, 64, 69]), (41, [60, 65, 69]), (36, [60, 64, 67]), (43, [59, 62, 67])],
    "Dm": [(38, [62, 65, 69]), (46, [62, 65, 70]), (41, [60, 65, 69]), (45, [61, 64, 69])],
    "Eb": [(39, [63, 67, 70]), (46, [62, 65, 70]), (36, [63, 67, 72]), (44, [63, 68, 72])],
    "Gm": [(43, [62, 67, 70]), (39, [63, 67, 70]), (46, [62, 65, 70]), (41, [60, 65, 69])],
}


def groove(s, start, end, style="house", gain=1.0):
    """Drum pattern on the 16th grid between start and end (seconds)."""
    pat = {
        "house": dict(k=[0, 4, 8, 12], c=[4, 12], h=[2, 6, 10, 14], o=[]),
        "break": dict(k=[0, 6, 10], c=[4, 12], h=[0, 2, 4, 6, 8, 10, 12, 14], o=[14]),
        "trap": dict(k=[0, 7, 10], c=[8], h=list(range(16)), o=[]),
        "half": dict(k=[0, 10], c=[8], h=[0, 4, 8, 12], o=[6]),
        "pulse": dict(k=[0, 8], c=[], h=[4, 12], o=[]),
        "funk": dict(k=[0, 3, 10], c=[4, 12], h=[0, 2, 4, 6, 8, 10, 12, 14], o=[7]),
    }[style]
    K, CL, HC, HO = kick(), clap(), hat(), hat(True)
    t = start
    while t < end - 1e-6:
        for st in pat["k"]:
            at = t + st * s.s16
            if at < end:
                s.put("drm", K, at, gain)
                s.duck(at)
        for st in pat["c"]:
            if t + st * s.s16 < end:
                s.put("drm", CL, t + st * s.s16, 0.7 * gain)
        for st in pat["h"]:
            if t + st * s.s16 < end:
                s.put("drm", HC, t + st * s.s16, (0.2 if st % 4 else 0.28) * gain, pan=0.3)
        for st in pat["o"]:
            if t + st * s.s16 < end:
                s.put("drm", HO, t + st * s.s16, 0.2 * gain, pan=-0.2)
        t += s.bar


def harmony(s, start, end, key="C", stabs=(0, 3, 6, 10, 13), bassline=(0, 2, 4, 6, 8, 10, 12, 14), padlevel=0.05, stablevel=0.24, basslevel=0.4, octave=0):
    prog = PROGS[key]
    t = start
    bi = 0
    while t < end - 1e-6:
        root, ch = prog[bi % len(prog)]
        ch = [m + octave for m in ch]
        for st in bassline:
            at = t + st * s.s16
            if at < end:
                s.put("mus", bass(root + (12 if st in (6, 14) else 0), s.s16 * 1.8), at, basslevel)
        for st in stabs:
            at = t + st * s.s16
            if at < end:
                s.put("mus", stab(ch), at, stablevel, pan=0.25 if st % 2 else -0.25)
        if padlevel:
            s.put("mus", pad([m - 12 for m in ch], min(s.bar, end - t)), t, padlevel)
        t += s.bar
        bi += 1
