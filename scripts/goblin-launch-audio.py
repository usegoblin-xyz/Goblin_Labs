"""Voiceover + mix for the Goblin launch film (render/GoblinLaunch.tsx).

Voice: Kokoro (af_heart), run locally. Needs `pip install kokoro-onnx soundfile`
and the model files from github.com/thewh1teagle/kokoro-onnx/releases:
    python3 scripts/goblin-launch-audio.py <dir with kokoro-v1.0.onnx and voices-v1.0.bin>
Writes public/launch/goblin-launch-mix.wav: the Editorial Brand Film soundtrack,
ducked under each line, with the voice on top.
"""
import sys
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

SR = 48000
DUR = 915 / 60
# (start in seconds, line, speed): each line lands on its scene
LINES = [
    (0.20, "Flat videos get scrolled past.", 1.1),
    (2.05, "Set your brand once.", 1.1),
    (3.90, "Pick from two hundred thirty-two templates.", 1.15),
    (6.20, "Every one in your colors, your type, your motion.", 1.15),
    (9.55, "Make it move.", 1.0),
    (11.15, "Design.", 1.0),
    (11.85, "Animate.", 1.0),
    (12.40, "Ship.", 1.0),
    (13.15, "Goblin.", 1.0),
    (13.85, "Launch videos in your brand.", 1.15),
]

k = Kokoro(f"{sys.argv[1]}/kokoro-v1.0.onnx", f"{sys.argv[1]}/voices-v1.0.bin")
m, sr = sf.read("public/editorial-ad/editorial-ad-128bpm.wav")
assert sr == SR
n = int(DUR * SR)
mus = np.zeros((n, 2))
mus[: min(n, len(m))] = m[:n]
vo = np.zeros(n)
duck = np.ones(n)
for at, text, speed in LINES:
    a, vsr = k.create(text, voice="af_heart", speed=speed, lang="en-us")
    idx = np.where(np.abs(a) > 0.01)[0]
    a = a[max(0, idx[0] - 200): idx[-1] + 800]
    a = np.interp(np.arange(int(len(a) * SR / vsr)) * vsr / SR, np.arange(len(a)), a)
    s = int(at * SR)
    e = min(n, s + len(a))
    vo[s:e] += a[: e - s]
    duck[max(0, s - int(0.08 * SR)): min(n, e + int(0.15 * SR))] = 0.42
w = int(0.06 * SR)
duck = np.convolve(duck, np.ones(w) / w, mode="same")
vo = vo / np.max(np.abs(vo)) * 0.9
mix = mus * duck[:, None] * 0.9 + np.stack([vo, vo], 1)
mix = mix / np.max(np.abs(mix)) * 0.89
sf.write("public/launch/goblin-launch-mix.wav", mix, SR, subtype="PCM_16")
print("wrote public/launch/goblin-launch-mix.wav")
