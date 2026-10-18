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


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    ids = sys.argv[1:] or []
    for i in TRACKS if ids == ["all"] else ids:
        TRACKS[i]()
