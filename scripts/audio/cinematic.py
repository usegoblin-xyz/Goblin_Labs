"""Cinematic sound design, made from code (no samples), so it's original and free to use.

hook(): an epic opener for a video hook — a deep hit, rising tension (noise
riser, climbing drone, accelerating heartbeat pulses), dramatic whooshes
sweeping across the stereo field, a mid hit, a reversed swell sucking into a
final boom with a long tail. Returns (stereo signal, seconds to the boom).
whoosh_hit(): a short cinematic whoosh into a deep hit, for cuts and titles.
boom(): the final boom on its own.
All return float arrays shaped (n, 2) at synth.SR.
"""
import numpy as np
from scipy.signal import fftconvolve

from synth import SR, T, bp, hp, lp, noise

_rng = np.random.default_rng(23)


def _st(x, pan=0.0):
    a = (pan + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], 1) * 1.4142


def _pad(x, n):
    out = np.zeros((int(n * SR), 2))
    k = min(len(out), len(x))
    out[:k] += x[:k]
    return out


def _at(out, sig, at, gain=1.0):
    i = int(at * SR)
    j = min(len(out), i + len(sig))
    if i < len(out):
        out[i:j] += sig[: j - i] * gain


def reverb(x, seconds=2.6, mix=0.35, damp=5000):
    """Stereo convolution reverb from decaying, decorrelated noise."""
    n = int(seconds * SR)
    t = np.arange(n) / SR
    env = np.exp(-t * 6.9 / seconds)
    irs = [lp(_rng.standard_normal(n), damp) * env for _ in range(2)]
    for ir in irs:
        ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
        ir /= np.sqrt((ir**2).sum())
    m = len(x) + n
    wet = np.zeros((m, 2))
    for c in range(2):
        w = fftconvolve(x[:, c], irs[c])[:m]
        wet[: len(w), c] = w
    dry = np.vstack([x, np.zeros((n, 2))])
    return dry * (1 - mix) + wet * mix * 2.2


def deep_hit(size=1.0):
    n = 2.2 * size
    t = T(n)
    f = 34 + 60 * np.exp(-t * 14)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (2.2 / size))
    knock = lp(noise(n), 420) * np.exp(-t * 26) * 0.9
    body = np.sin(2 * np.pi * 96 * t) * np.exp(-t * 9) * 0.35
    crack = hp(noise(n), 2500) * np.exp(-t * 60) * 0.25
    x = np.tanh((sub + knock + body + crack) * 1.8)
    return reverb(_st(x), seconds=2.2 * size, mix=0.28)


def whoosh(n=0.9, f0=500, f1=3800, pan0=-0.8, pan1=0.8):
    x = noise(n)
    out = np.zeros_like(x)
    steps = 32
    L = len(x) // steps
    for k in range(steps):
        p = k / steps
        c = f0 * (f1 / f0) ** (np.sin(np.pi * p))  # up then down, like something passing
        s = bp(x[k * L:(k + 1) * L + 2000], c * 0.6, min(c * 1.7, 20000))[:L]
        out[k * L:k * L + len(s)] = s
    env = np.sin(np.linspace(0, np.pi, len(x))) ** 2.2
    out *= env
    pans = np.linspace(pan0, pan1, len(out))
    a = (pans + 1) * np.pi / 4
    return np.stack([out * np.cos(a), out * np.sin(a)], 1) * 1.4142


def riser(n=3.2):
    x = noise(n)
    out = np.zeros_like(x)
    steps = 40
    L = len(x) // steps
    for k in range(steps):
        c = 250 * (9000 / 250) ** (k / steps)
        s = bp(x[k * L:(k + 1) * L + 2000], c * 0.7, min(c * 1.4, 20000))[:L]
        out[k * L:k * L + len(s)] = s
    out *= np.linspace(0, 1, len(out)) ** 2.4
    t = T(n)
    # a climbing, detuned drone underneath
    f = 45 * (4 ** (t / n))
    drone = sum(np.sin(2 * np.pi * np.cumsum(f * d) / SR) for d in (1, 1.006, 2.003)) / 3
    drone = lp(np.tanh(drone * 1.5), 900) * np.linspace(0.2, 1, len(t)) ** 1.6
    return reverb(_st(out * 0.8) + _st(drone * 0.55), seconds=1.8, mix=0.25)[: len(t)]


def pulse(size=0.6):
    t = T(0.5)
    f = 44 + 40 * np.exp(-t * 30)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10) * size
    return _st(np.tanh(x * 2))


def reverse_swell(n=0.7):
    burst = _st(hp(noise(0.08), 300) * np.exp(-T(0.08) * 40))
    tail = reverb(burst, seconds=n, mix=1.0)[: int(n * SR)]
    tail = tail[::-1] * np.linspace(0, 1, len(tail))[:, None] ** 1.5
    return tail


def boom():
    n = 4.5
    t = T(n)
    f = 28 + 70 * np.exp(-t * 9)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 0.9)
    knock = lp(noise(n), 600) * np.exp(-t * 18)
    blast = bp(noise(n), 200, 7000) * np.exp(-t * 7) * 0.6
    x = np.tanh((sub * 1.2 + knock + blast) * 1.6)
    return reverb(_st(x), seconds=4.0, mix=0.4, damp=3500)


def hook():
    """~7 s; the final boom lands at BOOM seconds."""
    BOOM = 3.25
    out = _pad(np.zeros((1, 2)), 7.8)
    _at(out, deep_hit(1.0), 0.0, 0.9)
    _at(out, riser(BOOM - 0.05), 0.05, 0.75)
    for at, g in [(0.6, 0.45), (1.3, 0.55), (1.85, 0.6), (2.3, 0.65), (2.65, 0.7), (2.9, 0.75), (3.08, 0.8)]:
        _at(out, pulse(g), at, 1.0)
    _at(out, whoosh(1.0, 400, 3200, -0.9, 0.9), 0.75, 0.7)
    _at(out, whoosh(0.85, 600, 4800, 0.9, -0.9), 2.05, 0.75)
    _at(out, deep_hit(0.7), 1.6, 0.6)
    sw = reverse_swell(0.7)
    _at(out, sw, BOOM - len(sw) / SR, 0.8)
    _at(out, boom(), BOOM, 1.0)
    return out, BOOM


def whoosh_hit():
    """~2.4 s; the hit lands 0.38 s in."""
    out = _pad(np.zeros((1, 2)), 2.6)
    _at(out, whoosh(0.5, 700, 5200, -0.7, 0.7), 0.0, 0.85)
    _at(out, deep_hit(0.75), 0.38, 0.85)
    return out, 0.38
