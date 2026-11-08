"""Soundtrack for the chat launch film (render/ChatLaunch.tsx).

A soft synth bed that builds after the title card, with sound effects from
Goblin's own library (public/sfx, made by scripts/audio/sfx.py) on every moment:
pops and typing for the user's messages, ticks for steps, whooshes on the beat
titles, the ding the story asks for, and an impact on the lockup. Timings come
from render/chat-launch-cues.json, the same file the picture uses.

    python3 scripts/chat-launch-audio.py   → public/launch/chat-launch-mix.wav
"""
import json
import os
import sys

import numpy as np
import soundfile as sf

HERE = os.path.dirname(__file__)
sys.path.insert(0, os.path.join(HERE, "audio"))
from synth import SR, Song, harmony, groove, pad  # noqa: E402

ROOT = os.path.join(HERE, "..")
CUES = json.load(open(os.path.join(ROOT, "render", "chat-launch-cues.json")))
DUR = CUES["duration"]


def fx(name, n=None):
    x, sr = sf.read(os.path.join(ROOT, "public", "sfx", f"{name}.wav"))
    assert sr == SR
    if n is not None:
        x = x[: int(n * SR)].copy()
        f = min(len(x), int(0.04 * SR))
        x[-f:] *= np.linspace(1, 0, f)
    return x


s = Song(DUR, bpm=96, seed=11)
sc = CUES["scenes"]

# ---- music -----------------------------------------------------------------
# Intro: a pad only, so the first messages feel quiet and close.
t = 0.0
while t < sc["title"][0]:
    s.put("mus", pad([60, 64, 67, 71], min(s.bar, sc["title"][0] - t)), t, 0.05)
    t += s.bar
# From the title card: soft chords and a light pulse.
harmony(s, sc["title"][0], sc["export"][0], key="C", stabs=(0, 6, 10), bassline=(0, 8), padlevel=0.04, stablevel=0.12, basslevel=0.22)
groove(s, sc["talk"][0], sc["export"][0], style="pulse", gain=0.45)
# Export: chords thin out, then the end builds.
harmony(s, sc["export"][0], DUR - 1.5, key="C", stabs=(0,), bassline=(0,), padlevel=0.05, stablevel=0.1, basslevel=0.18)

# ---- sound effects -----------------------------------------------------------
USER_CPS, GOBLIN_CPS = 46, 38
for m in CUES["user"]:
    s.put("fx", fx("pop"), m["at"], 0.55)
    s.put("fx", fx("typing", len(m["text"]) / USER_CPS), m["at"] + 0.05, 0.22, pan=0.2)
for m in CUES["goblin"]:
    s.put("fx", fx("tick"), m["at"], 0.4, pan=-0.2)
for b in CUES["beats"]:
    s.put("fx", fx("swoosh"), b["at"] - 0.1, 0.55)
s.put("fx", fx("swoosh"), sc["title"][0] - 0.1, 0.6)
s.put("fx", fx("chime"), sc["title"][0] + 0.45, 0.45)
for st in CUES["steps"] + CUES["phases"]:
    s.put("fx", fx("tick"), st["at"], 0.35)
s.put("fx", fx("success"), CUES["card1"], 0.4)
s.put("fx", fx("swipe"), CUES["panelOpen"], 0.6)
s.put("fx", fx("typing", 0.7), CUES["fieldEdit"] + 0.5, 0.2)
s.put("fx", fx("ding"), CUES["card2"] + 0.3, 0.6)  # "add a ding at the end"
s.put("fx", fx("click"), CUES["explainerToggle"], 0.7)
s.put("fx", fx("sparkle"), CUES["videoCard"], 0.4)
s.put("fx", fx("success"), CUES["exportDone"], 0.45)
s.put("fx", fx("swoosh"), CUES["tagline"] - 0.1, 0.5)
s.put("fx", fx("riser"), CUES["lockup"] - 1.5, 0.45)
s.put("fx", fx("impact"), CUES["lockup"], 0.55)
s.put("fx", fx("chime"), CUES["lockup"] + 0.25, 0.4)

out = os.path.join(ROOT, "public", "launch", "chat-launch-mix.wav")
s.write(out, levels=(-15, -19, -7), fade=1.8)
