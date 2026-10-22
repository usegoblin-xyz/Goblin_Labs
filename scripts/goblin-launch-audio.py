"""Voiceover + mix for the Goblin launch film (render/GoblinLaunch.tsx).

The script is read in ONE ElevenLabs take, so it flows like a real read, then cut
into lines with the character timestamps and each line placed on its scene.
Needs ELEVENLABS_API_KEY in the environment (kept in .env.local, never committed):
    set -a; . ./.env.local; set +a
    python3 scripts/goblin-launch-audio.py [voice_id]
Or mix a finished take as one unbroken track (no cuts, so it flows as read):
    python3 scripts/goblin-launch-audio.py --take public/launch/goblin-launch-vo.wav [--offset 0.35]
Writes public/launch/goblin-launch-mix.wav: the Editorial Brand Film soundtrack,
ducked under each line, with the voice on top.
"""
import base64
import json
import os
import subprocess
import sys
import tempfile
import urllib.request

import numpy as np
import soundfile as sf

SR = 48000
DUR = 990 / 60
VOICE = sys.argv[1] if len(sys.argv) > 1 else "cjVigY5qzO86Huf0OWal"  # Eric, smooth and trustworthy
# (start in seconds, line): each line lands on its scene
LINES = [
    (0.20, "Most videos just sit there."),      # "flat" turns into "float"
    (2.05, "So start with your brand."),        # the gecko mark is drawn
    (3.90, "Pick a template you like..."),      # mark passed between hands
    (5.70, "and it's already in your colors, your fonts, your style."),  # spiral, gallop
    (9.55, "Then make it move."),               # headline
    (11.10, "Design it. Animate it. Ship it."), # one word per cube face
    (13.35, "Goblin."),                         # logo lockup
    (14.00, "Your launch video, ready today."),
]


def tts(text: str):
    key = os.environ["ELEVENLABS_API_KEY"]
    body = json.dumps({
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.25, "use_speaker_boost": True},
    }).encode()
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
        data=body, headers={"xi-api-key": key, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        d = json.load(r)
    with tempfile.TemporaryDirectory() as td:
        mp3, wav = f"{td}/vo.mp3", f"{td}/vo.wav"
        open(mp3, "wb").write(base64.b64decode(d["audio_base64"]))
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mp3, "-ar", str(SR), "-ac", "1", wav], check=True)
        a, _ = sf.read(wav)
    return a, d["alignment"]


def mix_and_write(vo: np.ndarray, spans):
    n = int(DUR * SR)
    m, msr = sf.read("public/editorial-ad/editorial-ad-128bpm.wav")
    assert msr == SR
    mus = np.zeros((n, 2))
    mus[: min(n, len(m))] = m[:n]
    vo = vo[:n] if len(vo) >= n else np.pad(vo, (0, n - len(vo)))
    duck = np.ones(n)
    for s0, s1 in spans:
        duck[max(0, int((s0 - 0.08) * SR)): min(n, int((s1 + 0.15) * SR))] = 0.4
    w = int(0.06 * SR)
    duck = np.convolve(duck, np.ones(w) / w, mode="same")
    vo = vo / np.max(np.abs(vo)) * 0.9
    mix = mus * duck[:, None] * 0.85 + np.stack([vo, vo], 1)
    mix = mix / np.max(np.abs(mix)) * 0.89
    sf.write("public/launch/goblin-launch-mix.wav", mix, SR, subtype="PCM_16")
    print("wrote public/launch/goblin-launch-mix.wav")


if "--take" in sys.argv:
    take = sys.argv[sys.argv.index("--take") + 1]
    offset = float(sys.argv[sys.argv.index("--offset") + 1]) if "--offset" in sys.argv else 0.35
    a, asr = sf.read(take)
    if a.ndim > 1:
        a = a.mean(axis=1)
    assert asr == SR, "resample the take to 48 kHz first (ffmpeg -ar 48000)"
    vo = np.concatenate([np.zeros(int(offset * SR)), a])
    # duck wherever the voice is speaking, found from its loudness
    hop = int(0.02 * SR)
    env = np.array([np.sqrt(np.mean(vo[i:i + hop] ** 2)) for i in range(0, len(vo), hop)])
    on = env > 0.02 * env.max()
    spans, start = [], None
    for k, v in enumerate(on):
        if v and start is None:
            start = k
        if not v and start is not None:
            spans.append((start * hop / SR, k * hop / SR))
            start = None
    if start is not None:
        spans.append((start * hop / SR, len(vo) / SR))
    mix_and_write(vo, spans)
    sys.exit(0)


full = " ".join(t for _, t in LINES)
audio, al = tts(full)
chars, starts, ends = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
n = int(DUR * SR)
m, msr = sf.read("public/editorial-ad/editorial-ad-128bpm.wav")
assert msr == SR
mus = np.zeros((n, 2))
mus[: min(n, len(m))] = m[:n]
vo = np.zeros(n)
duck = np.ones(n)
pos = 0
for at, text in LINES:
    i0 = full.index(text, pos)
    i1 = i0 + len(text) - 1
    pos = i1 + 1
    t0 = max(0.0, starts[i0] - 0.03)
    t1 = ends[i1] + 0.12
    clip = audio[int(t0 * SR): int(t1 * SR)].copy()
    f = int(0.01 * SR)
    clip[:f] *= np.linspace(0, 1, f)
    clip[-f:] *= np.linspace(1, 0, f)
    s = int(at * SR)
    e = min(n, s + len(clip))
    vo[s:e] += clip[: e - s]
    duck[max(0, s - int(0.08 * SR)): min(n, e + int(0.15 * SR))] = 0.4
    print(f"{at:5.2f}s  {t1 - t0:4.2f}s  {text}")
w = int(0.06 * SR)
duck = np.convolve(duck, np.ones(w) / w, mode="same")
vo = vo / np.max(np.abs(vo)) * 0.9
mix = mus * duck[:, None] * 0.85 + np.stack([vo, vo], 1)
mix = mix / np.max(np.abs(mix)) * 0.89
sf.write("public/launch/goblin-launch-mix.wav", mix, SR, subtype="PCM_16")
print("wrote public/launch/goblin-launch-mix.wav")
