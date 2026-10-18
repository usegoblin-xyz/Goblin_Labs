"""Soundtracks for the library, one function per template id.

Run: python3 scripts/audio/tracks.py <id> [<id> ...]   (or "all")
Writes public/tracks/<id>.wav. Times match each template's timeline.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from synth import *  # noqa: E402,F401,F403

OUT = "public/tracks"
TRACKS = {}


def track(fn):
    TRACKS[fn.__name__.replace("_", "-")] = fn
    return fn


@track
def ball_ui_loop():
    s = Song(10, bpm=120, seed=2)
    harmony(s, 0, 10, "C", stabs=(0, 6, 10), padlevel=0.06, stablevel=0.16, basslevel=0.3)
    groove(s, 1.0, 10, "pulse", 0.8)
    s.put("fx", click(), 0.45, 0.9)
    s.put("fx", pop(500), 0.55, 0.5)
    s.put("fx", thud(110), 1.3, 0.6)
    s.put("fx", whoosh(0.5, 900), 1.4, 0.15)
    s.put("fx", bell(84, 0.8), 2.6, 0.35)
    for i, t0 in enumerate((2.8, 3.1, 3.4)):
        s.put("fx", pop(700 + i * 120), t0, 0.35)
    s.put("fx", thud(130), 3.9, 0.5)
    s.put("fx", whoosh(0.3, 1600), 4.05, 0.25)
    for k in range(5):
        s.put("fx", tick(2600 + k * 90), 4.9 + k * 0.32, 0.7)
    s.put("fx", click(), 6.6, 0.8)
    s.put("fx", bell(79, 0.9), 6.75, 0.3)
    s.put("fx", whoosh(0.9, 700), 7.4, 0.2)
    s.put("fx", thud(100), 9.4, 0.5)
    s.put("fx", click(), 9.6, 0.5)
    s.write(f"{OUT}/ball-ui-loop.wav")


@track
def ask_think_deliver():
    s = Song(15, bpm=130, seed=3)
    B = s.beat
    harmony(s, 0, B * 12, "Am", stabs=(0, 6), padlevel=0.07, stablevel=0.1, basslevel=0.0)
    s.put("fx", riser(B * 2, 300, 8000), B * 10, 0.35)
    harmony(s, B * 12, 15, "Am", stabs=(0, 3, 6, 10, 13), padlevel=0.04, stablevel=0.22, basslevel=0.42)
    groove(s, B * 4, B * 12, "pulse", 0.6)
    groove(s, B * 12, 15, "break", 1.0)
    for i in range(46):  # keystrokes
        s.put("fx", tick(2900 + (i % 5) * 60), B * 0.6 + i * (B * 5.0 / 46), 0.35, pan=0.2)
    s.put("fx", pop(500), B * 6, 0.7)
    s.put("fx", whoosh(0.5, 900), B * 6.2, 0.25)
    for k in (8, 9, 10, 11):
        s.put("fx", thud(140 + k * 8), B * k, 0.5)
        s.put("fx", whoosh(0.2, 2000), B * k, 0.2)
    s.put("fx", impact(), B * 12, 0.6)
    s.put("fx", whoosh(0.4, 1500), B * 13.2, 0.3)
    s.put("fx", whoosh(0.4, 1200), B * 16, 0.3)
    s.put("fx", click(), B * 20.2, 0.8)
    s.put("fx", bell(84, 1.0), B * 21, 0.4)
    s.put("fx", riser(B * 1.6, 400, 6000), B * 21.6, 0.3)
    s.put("fx", bell(91, 1.4), B * 29.2, 0.4)
    s.write(f"{OUT}/ask-think-deliver.wav")


@track
def model_launch_square():
    s = Song(16, bpm=128, seed=4)
    B = s.beat
    harmony(s, 0, 4.8, "Eb", stabs=(), padlevel=0.09, basslevel=0.0)
    for k in range(int(4.8 / (B / 2))):
        s.put("mus", pluck(PROGS["Eb"][0][1][k % 3] + 12, 0.25, 2200), k * B / 2, 0.12, pan=0.3 if k % 2 else -0.3)
    s.put("fx", riser(1.0, 300, 8000), 3.8, 0.3)
    harmony(s, 4.8, 14.4, "Eb", stabs=(0, 3, 6, 10, 13), padlevel=0.04, stablevel=0.2, basslevel=0.38)
    groove(s, 4.8, 14.4, "house", 0.95)
    s.put("fx", impact(), 4.8, 0.5)
    t = 2.6
    while t < 14.4:  # a click on each image change
        if 2.6 <= t < 4.8 or 4.8 <= t < 7.4 or 8.6 <= t < 9.6:
            s.put("fx", tick(3400), t, 0.18, pan=0.2)
        t += s.s16
    s.put("mus", pad([63, 67, 70, 75], 1.6), 14.4, 0.1)
    s.put("fx", bell(87, 1.5), 14.45, 0.35)
    s.write(f"{OUT}/model-launch-square.wav")


@track
def dot_system():
    s = Song(15, bpm=120, seed=5)
    harmony(s, 0, 15, "Dm", stabs=(0, 6, 10), padlevel=0.05, stablevel=0.18, basslevel=0.34)
    groove(s, 1.0, 12.0, "funk", 0.9)
    groove(s, 12.0, 15, "pulse", 0.6)
    s.put("fx", click(), 0.6, 0.9)
    s.put("fx", pop(500), 0.65, 0.4)
    s.put("fx", whoosh(0.6, 1200), 1.05, 0.25)
    s.put("fx", pop(800), 1.85, 0.4)
    s.put("fx", thud(120), 2.6, 0.5)
    s.put("fx", blip(400, 1400, 0.5), 2.7, 0.2)
    s.put("fx", bell(84, 0.8), 4.6, 0.35)
    s.put("fx", whoosh(0.4, 2000), 5.0, 0.35)
    s.put("fx", impact(), 5.6, 0.4)
    s.put("fx", thud(90), 5.9, 0.5)
    s.put("fx", whoosh(0.4, 900), 6.8, 0.25)
    s.put("fx", whoosh(0.6, 700), 7.4, 0.3)
    s.put("fx", riser(1.4, 300, 6000), 10.2, 0.3)
    s.put("fx", impact(), 12.0, 0.5)
    s.put("fx", whoosh(0.8, 1000), 13.8, 0.25)
    s.put("fx", click(), 14.9, 0.3)
    s.write(f"{OUT}/dot-system.wav")


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    ids = sys.argv[1:] or []
    for i in TRACKS if ids == ["all"] else ids:
        TRACKS[i]()
