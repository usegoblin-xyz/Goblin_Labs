"""Original soundtrack for the Editorial Ad template, synthesized in code.

128 BPM, 14.5 s, 48 kHz stereo, F minor (Fm - Db - Ab - Eb).
Shape follows the film (times match src/library/templates/EditorialAd.tsx):
  bar 1    plucked arpeggio intro, blip when the dot lands, riser into the zoom
  1.875    drop: breakbeat drums, sidechained bass, syncopated chord stabs
  3.75     a snap on every image cut
  5.625    swirling tone along the spiral
  7.5      hoofbeats under the gallop, card flips, riser into the zoom
  9.375    impact, drums out, typing ticks
  11.1     drums back, a thump on every cube turn
  13.13    logo hit: chord and impact ringing out to the end
Run: python3 scripts/editorial-ad-audio.py
"""
import wave
import numpy as np
from scipy.signal import butter, lfilter

SR = 48_000
BPM = 128
BEAT = 60 / BPM
S16 = BEAT / 4
DUR = 14.5
N = int(SR * DUR)
rng = np.random.default_rng(128)
mus = np.zeros((N, 2))
drm = np.zeros((N, 2))
fx = np.zeros((N, 2))


def place(buf, sig, at, gain=1.0, pan=0.0):
    i = int(round(at * SR))
    if i >= N or i + len(sig) <= 0:
        return
    if sig.ndim == 1:
        sig = np.stack([sig * np.cos((pan + 1) * np.pi / 4), sig * np.sin((pan + 1) * np.pi / 4)], 1) * 1.4142
    j = min(N, i + len(sig))
    buf[max(0, i):j] += sig[max(0, -i): j - i] * gain


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
    b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], "band")
    return lfilter(b, a, x)


def saw(f, n):
    t = T(n)
    ph = (f * t) % 1
    return 2 * ph - 1


def noise(n):
    return rng.standard_normal(int(n * SR))


# ---- drums ---------------------------------------------------------------------
def kick(n=0.42):
    t = T(n)
    f = 46 + 130 * np.exp(-t * 38)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    click = hp(noise(n), 2000) * np.exp(-t * 300) * 0.4
    return np.tanh((body + click) * 1.6)


def clap():
    n = 0.3
    x = bp(noise(n), 900, 4000)
    t = T(n)
    e = np.exp(-t * 22)
    for d in (0.008, 0.017):
        e = e + 0.8 * np.exp(-np.maximum(0, t - d) * 140) * (t > d)
    return x * e * 0.8


def snare():
    n = 0.25
    t = T(n)
    tone = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 30)
    return (bp(noise(n), 1500, 8000) * np.exp(-t * 18) * 0.9 + tone * 0.6)


def hat(open_=False):
    n = 0.22 if open_ else 0.05
    return hp(noise(n), 7000, 3) * env(n, 0.0005, 0.07 if open_ else 0.012)


def tom(f=120):
    t = T(0.3)
    fr = f * (1 + 0.6 * np.exp(-t * 30))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 12)


K, CL, SN, HC, HO = kick(), clap(), snare(), hat(), hat(True)

# breakbeat on the 16th grid: kick 0, 6, 10; snare/clap 4, 12; hats on 8ths
KICKS = [0, 6, 10]
side = np.ones(N)  # sidechain gain for the music bed


def bar_drums(t0, fill=False):
    for s in KICKS:
        place(drm, K, t0 + s * S16, 1.0)
        i = int((t0 + s * S16) * SR)
        j = min(N, i + int(0.22 * SR))
        if i < N:
            side[i:j] = np.minimum(side[i:j], 0.35 + 0.65 * np.linspace(0, 1, j - i) ** 0.6)
    for s in (4, 12):
        place(drm, CL, t0 + s * S16, 0.75)
        place(drm, SN, t0 + s * S16, 0.35)
    for s in range(0, 16, 2):
        place(drm, HO if s == 14 else HC, t0 + s * S16 + 0.004, 0.22 if s % 4 else 0.3, pan=0.3)
    for s in (3, 7, 11, 15):
        place(drm, HC, t0 + s * S16, 0.12, pan=-0.3)
    if fill:
        for k, s in enumerate((13, 14, 15)):
            place(drm, SN, t0 + s * S16, 0.35 + 0.1 * k)


bar = 4 * BEAT
drum_bars = [1, 2, 3, 4]  # bars 2-5 (1.875 - 9.375)
for bi in drum_bars:
    bar_drums(bi * bar, fill=bi == 4)
# back in for the cube (from 11.1) and the logo bar
for t0 in (11.1, 11.1 + bar / 2):
    for s in (0, 4, 6):
        place(drm, K, t0 + s * S16, 0.95)
    for s in (4,):
        place(drm, CL, t0 + s * S16, 0.7)
    for s in range(0, 8):
        place(drm, HC, t0 + s * S16, 0.16, pan=0.3)

# ---- harmony -----------------------------------------------------------------------
F = lambda m: 440 * 2 ** ((m - 69) / 12)
PROG = [  # bass root (midi), chord tones (midi)
    (41, [65, 68, 72]),  # Fm
    (37, [65, 68, 73]),  # Db
    (44, [63, 68, 72]),  # Ab
    (39, [63, 67, 70]),  # Eb
]


def pluck(m, n=0.32, bright=3500):
    f = F(m)
    x = saw(f, n) * 0.6 + saw(f * 1.006, n) * 0.4
    x = lp(x, bright) * env(n, 0.002, 0.12)
    return x


def stab(ms, n=0.24):
    return sum(pluck(m, n, 2600) for m in ms) / len(ms)


def bass(m, n):
    f = F(m)
    t = T(n)
    x = saw(f, n) + 0.5 * np.sin(2 * np.pi * f / 2 * t)
    return np.tanh(lp(x, 700) * 1.6) * env(n, 0.004, n * 0.9)


# bar 1 intro: arpeggio climbing, filtered open over the bar
arp = [0, 1, 2, 1, 0, 1, 2, 1, 0, 2, 1, 2, 0, 1, 2, 2]
for s, k in enumerate(arp):
    m = PROG[0][1][k] + (12 if s >= 8 and k == 2 else 0)
    place(mus, pluck(m, 0.3, 1200 + 260 * s), s * S16, 0.32, pan=0.35 if s % 2 else -0.35)

# bars 2-8: bass on 8ths, stabs on the syncopation, pad underneath
for bi in range(1, 8):
    t0 = bi * bar
    if t0 >= DUR:
        break
    root, ch = PROG[bi % 4]
    quiet = 9.375 <= t0 < 11.1  # type section breathes
    for s in range(0, 16, 2):
        if quiet and s % 4:
            continue
        place(mus, bass(root + (12 if s in (6, 14) else 0), S16 * 1.8), t0 + s * S16, 0.42 if not quiet else 0.25)
    for s in (0, 3, 6, 10, 13):
        place(mus, stab(ch), t0 + s * S16, 0.26 if not quiet else 0.14, pan=0.25 if s % 2 else -0.25)
    pad = sum(np.sin(2 * np.pi * F(m - 12) * T(bar)) for m in ch) / 3
    place(mus, lp(pad, 900) * env(bar, 0.4, 1.8), t0, 0.05)

# ---- effects ---------------------------------------------------------------------------
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
        seg_ = bp(x[k * L:(k + 1) * L + 1200], f * 0.7, min(f * 1.4, 20000))[: L]
        out[k * L:k * L + len(seg_)] = seg_
    return out * np.linspace(0, 1, len(x)) ** 2


def whoosh(n=0.22, f=1800):
    x = bp(noise(n), f * 0.5, f * 1.6)
    return x * np.sin(np.linspace(0, np.pi, len(x))) ** 2


def impact():
    n = 1.4
    t = T(n)
    sub = np.sin(2 * np.pi * (38 + 60 * np.exp(-t * 20)) * t) * np.exp(-t * 3)
    return np.tanh(sub * 1.5 + lp(noise(n), 1200) * np.exp(-t * 8) * 0.5)


def snap():
    x = hp(noise(0.06), 3000) * env(0.06, 0.0005, 0.01)
    x[: int(0.04 * SR)] += blip(2400, 1200, 0.04) * 0.3
    return x


def tick():
    return blip(3200, 2600, 0.025)


def scratch(n):
    x = bp(noise(n), 2500, 7000)
    return x * (0.5 + 0.5 * np.sin(np.linspace(0, n * 70, len(x))) ** 8) * np.sin(np.linspace(0, np.pi, len(x)))


# bar 1
place(fx, blip(900, 1800, 0.1), 0.6, 0.35)  # dot lands
place(fx, blip(700, 1400, 0.16), 0.68, 0.3)  # letter pops in
place(fx, riser(0.4, 400, 3000), 0.92, 0.18)  # weight swells
place(fx, blip(1200, 2400, 0.08), 1.26, 0.35)  # period
place(fx, riser(0.3, 300, 9000), 1.58, 0.4)  # zoom
place(fx, impact(), 1.875, 0.55)
# construction
place(fx, scratch(0.5), 2.1, 0.12, pan=-0.2)
place(fx, scratch(0.3), 2.33, 0.1, pan=0.2)
place(fx, blip(1600, 500, 0.2), 2.81, 0.3)  # collapse
place(fx, tom(90), 3.04, 0.7)  # 3D pop
place(fx, whoosh(0.3, 900), 3.38, 0.25)
# cuts
for k in range(8):
    place(fx, snap(), 3.75 + k * BEAT / 2, 0.5, pan=(-0.3, 0.3)[k % 2])
place(fx, blip(1400, 500, 0.12), 5.5, 0.3)
# spiral swirl
t = T(1.7)
sw = np.sin(2 * np.pi * np.cumsum(500 + 700 * (t / 1.7) + 40 * np.sin(2 * np.pi * 7 * t)) / SR)
place(fx, sw * np.sin(np.linspace(0, np.pi, len(t))) ** 1.5, 5.62, 0.07)
for k in range(7):
    place(fx, snap(), 5.625 + k * BEAT / 2, 0.3, pan=(0.3, -0.3)[k % 2])
# gallop: four-beat hoof rhythm
for k in range(10):
    t0 = 7.6 + k * 0.075 * 4
    for j, d in enumerate((0, 0.06, 0.12, 0.2)):
        if t0 + d < 8.3:
            place(fx, tom(160 + 20 * j), t0 + d, 0.17, pan=-0.1)
            place(fx, snap(), t0 + d, 0.12, pan=-0.1)
place(fx, whoosh(0.3, 1200), 8.2, 0.35)
for i in range(5):  # card flips
    place(fx, whoosh(0.09, 3500), 8.45 + abs(i - 2) * 0.06, 0.4, pan=(i - 2) * 0.3)
place(fx, riser(0.5, 300, 9000), 8.88, 0.4)
place(fx, impact(), 9.375, 0.5)
# type
for k in range(7):
    place(fx, tick(), 9.875 + k * 0.057, 0.4, pan=0.15)
place(fx, scratch(0.3), 10.3, 0.12)
place(fx, riser(0.35, 500, 5000), 10.75, 0.25)
# cube turns
for t0 in (11.48, 11.72, 11.95, 12.19, 12.42):
    place(fx, whoosh(0.18, 1400), t0, 0.32)
    place(fx, tom(110), t0 + 0.16, 0.45)
# logo
place(fx, impact(), 13.13, 0.6)
chord = sum(pluck(m, 1.4, 3000) for m in (53, 60, 65, 68, 72)) / 5
place(mus, chord, 13.13, 0.6)
for k in range(6):
    place(fx, tick(), 13.1 + k * 0.05, 0.35, pan=0.15)

# ---- mix ------------------------------------------------------------------------------
def peak(x, db):
    p = np.max(np.abs(x)) or 1
    return x / p * 10 ** (db / 20)


mus *= side[:, None]
mix = peak(mus, -11) + peak(drm, -8) + peak(fx, -9)
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
fade = int(0.6 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.5
mix[: int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))[:, None]
mix = peak(mix, -1.0)
path = "public/editorial-ad/editorial-ad-128bpm.wav"
with wave.open(path, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("wrote", path)
