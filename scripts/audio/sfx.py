"""Goblin's sound-effect library for generated templates.

Every effect is synthesised from code (no samples), so it is original and free
to use. Writes public/sfx/<name>.wav (mono, 48 kHz, 16-bit). The names and
descriptions templates may use live in src/library/sfx.ts; keep them in step.

    python3 scripts/audio/sfx.py
"""
import os
import sys
import wave

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from synth import SR, T, blip, bp, bell, click, env, hp, impact, keys, lp, noise, peak, pop, riser, snap, sine, thud, tick, whoosh  # noqa: E402

OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "sfx")


def pad(x, n):
    return np.concatenate([x, np.zeros(max(0, int(n * SR) - len(x)))])


def mixat(parts, n):
    out = np.zeros(int(n * SR))
    for sig, at, g in parts:
        i = int(at * SR)
        j = min(len(out), i + len(sig))
        out[i:j] += sig[: j - i] * g
    return out


def typing(n=1.2, rate=11):
    rng = np.random.default_rng(3)
    parts, t = [], 0.0
    while t < n - 0.06:
        f = 1500 + rng.random() * 900
        parts.append((click() * 0.8 + pad(blip(f, f * 0.7, 0.02), 0.03)[: int(0.03 * SR)] * 0.25, t, 0.6 + rng.random() * 0.4))
        t += (1 / rate) * (0.6 + rng.random() * 0.8)
    return mixat(parts, n)


def sparkle(n=0.9):
    rng = np.random.default_rng(5)
    notes = [84, 88, 91, 96, 100]
    parts = [(bell(m, 0.6) * 0.5, i * 0.06 + rng.random() * 0.02, 1 - i * 0.12) for i, m in enumerate(notes)]
    shimmer = hp(noise(n), 7000) * env(n, 0.05, 0.25) * 0.15
    return mixat(parts, n) + shimmer


def ding():
    return mixat([(bell(88, 1.0), 0, 0.9), (bell(100, 0.6), 0, 0.2)], 1.0)


def chime():
    return mixat([(bell(m, 1.2), i * 0.09, 0.8) for i, m in enumerate([76, 83, 88])], 1.5)


def success():
    return mixat([(keys([72, 76, 79], 0.5), 0, 0.9), (keys([79, 84, 88], 0.7), 0.12, 1.0)], 0.9)


def error():
    t = T(0.16)
    buzz = np.sign(np.sin(2 * np.pi * 140 * t)) * 0.3 + np.sin(2 * np.pi * 280 * t) * 0.3
    return mixat([(lp(buzz, 1800) * env(0.16, 0.002, 0.06), 0, 1), (lp(buzz, 1800) * env(0.16, 0.002, 0.06), 0.17, 1)], 0.4)


def swipe():
    return whoosh(0.16, 3200)


def swoosh():
    x = whoosh(0.45, 1200) + whoosh(0.45, 2600) * 0.5
    return x


def bass_drop(n=1.6):
    t = T(n)
    f = 110 * np.exp(-t * 2.2) + 32
    s = np.sin(2 * np.pi * np.cumsum(f) / SR)
    return np.tanh(s * 2.2) * np.minimum(1, t / 0.01) * np.exp(-t * 1.2)


def glitch(n=0.4):
    rng = np.random.default_rng(9)
    x = np.zeros(int(n * SR))
    i = 0
    while i < len(x):
        L = int(SR * (0.01 + rng.random() * 0.03))
        f = 200 + rng.random() * 3000
        seg = np.sign(np.sin(2 * np.pi * f * T(L / SR))) * (0.3 + rng.random() * 0.7)
        if rng.random() < 0.4:
            seg = hp(noise(L / SR), 2000) * 0.8
        x[i : i + L] = seg[: len(x) - i]
        i += L + int(SR * rng.random() * 0.02)
    return lp(x, 6000) * 0.7


def boom():
    return impact(1.8)


def heartbeat():
    return mixat([(thud(70), 0, 1), (thud(64), 0.2, 0.7)], 0.7)


def camera():
    return mixat([(snap(), 0, 1), (hp(noise(0.12), 1500) * env(0.12, 0.001, 0.03) * 0.6, 0.05, 1)], 0.3)


def countdown():
    return blip(1000, 1000, 0.09) * env(0.09, 0.001, 0.05)


def rise():
    return riser(1.5)


def drumroll(n=1.4):
    rng = np.random.default_rng(2)
    parts = []
    t = 0.0
    while t < n - 0.1:
        k = t / n
        parts.append((bp(noise(0.05), 180, 2400) * env(0.05, 0.001, 0.02), t, 0.4 + 0.6 * k + rng.random() * 0.1))
        t += 0.045 - 0.015 * k
    return mixat(parts, n) + mixat([(thud(110), n - 0.08, 0.0)], n)


SOUNDS = {
    "whoosh": lambda: whoosh(0.3, 1800),
    "swoosh": swoosh,
    "swipe": swipe,
    "pop": lambda: pop(600),
    "click": click,
    "tick": lambda: tick(3200),
    "snap": snap,
    "typing": typing,
    "ding": ding,
    "chime": chime,
    "sparkle": sparkle,
    "success": success,
    "error": error,
    "impact": lambda: impact(1.2),
    "boom": boom,
    "thud": lambda: thud(90),
    "bass-drop": bass_drop,
    "riser": rise,
    "glitch": glitch,
    "heartbeat": heartbeat,
    "camera": camera,
    "countdown": countdown,
    "drumroll": drumroll,
}


def write(name, x):
    x = np.asarray(x, dtype=float)
    f = min(len(x) // 4, int(0.03 * SR))
    if f:
        x[-f:] *= np.linspace(1, 0, f)
    a = int(0.002 * SR)
    x[:a] *= np.linspace(0, 1, a)
    x = peak(x, -3.0)
    path = os.path.join(OUT, f"{name}.wav")
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())
    print(f"wrote {path} ({len(x) / SR:.2f}s)")


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for name, make in SOUNDS.items():
        write(name, make())
