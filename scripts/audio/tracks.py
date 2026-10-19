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


@track
def gallery_promo():
    s = Song(23, bpm=120, seed=6)
    B = s.beat
    harmony(s, 0, B * 13, "Gm", stabs=(0, 10), padlevel=0.07, stablevel=0.12, basslevel=0.18)
    groove(s, B * 2, B * 11, "pulse", 0.7)
    s.put("fx", riser(B * 2, 300, 9000), B * 11, 0.4)
    harmony(s, B * 13, B * 32, "Gm", stabs=(0, 3, 6, 10, 13), padlevel=0.04, stablevel=0.22, basslevel=0.4)
    groove(s, B * 13, B * 32, "house", 1.0)
    harmony(s, B * 32, 23, "Gm", stabs=(0, 6), padlevel=0.07, stablevel=0.14, basslevel=0.25)
    groove(s, B * 34, 23, "pulse", 0.6)
    s.put("fx", whoosh(0.5, 900), B * 0.5, 0.25)
    for k in (13, 14, 15):
        s.put("fx", impact(0.6), B * k, 0.45)
    s.put("fx", whoosh(0.6, 1200), B * 16, 0.3)
    s.put("fx", click(), B * 20, 0.8)
    s.put("fx", whoosh(0.6, 800), B * 21, 0.25)
    s.put("fx", whoosh(0.4, 2400), B * 28.4, 0.2)
    s.put("fx", click(), B * 30.6, 0.8)
    s.put("fx", bell(86, 0.8), B * 30.7, 0.3)
    s.put("fx", whoosh(0.7, 1000), B * 32, 0.3)
    s.put("fx", bell(91, 1.4), B * 35, 0.35)
    s.write(f"{OUT}/gallery-promo.wav")


FX = {"click": lambda: click(), "pop": lambda: pop(600), "thud": lambda: thud(110), "whoosh": lambda: whoosh(0.4, 1400),
      "impact": lambda: impact(), "bell": lambda: bell(84, 1.0), "riser": lambda: riser(1.0, 300, 7000), "tick": lambda: tick(),
      "snap": lambda: snap(), "chime": lambda: bell(91, 1.4)}


def basic(name, dur, bpm=120, key="C", style="house", start=0.0, hits=(), intro=None, end=None, level=1.0, seed=10):
    """A compact track: optional quiet intro, groove from `start`, hits = [(time, fx), ...]."""
    s = Song(dur, bpm=bpm, seed=seed)
    if start > 0:
        harmony(s, 0, start, key, stabs=(0,), padlevel=0.08, stablevel=0.1, basslevel=0.0)
    harmony(s, start, end or dur, key, padlevel=0.05, stablevel=0.2, basslevel=0.38)
    groove(s, start, end or dur, style, level)
    if end and end < dur:
        harmony(s, end, dur, key, stabs=(0,), padlevel=0.08, stablevel=0.12, basslevel=0.2)
    for at, kind in hits:
        s.put("fx", FX[kind](), at, 0.45 if kind in ("impact", "riser") else 0.6)
    s.write(f"{OUT}/{name}.wav")


@track
def feature_teaser():
    basic("feature-teaser", 13.5, 124, "Fm", "break", start=0.6, hits=[(0.6, "whoosh"), (5.0, "thud"), (6.0, "riser"), (7.4, "impact"), (9.2, "pop"), (12.3, "whoosh"), (12.5, "chime")], end=12.2, seed=11)


@track
def full_stop():
    basic("full-stop", 12, 110, "Dm", "half", start=1.6, hits=[(1.6, "pop"), (2.6, "whoosh"), (3.9, "whoosh"), (5.2, "whoosh"), (6.5, "whoosh"), (7.9, "riser"), (9.4, "whoosh"), (10.6, "thud"), (11.0, "chime")], seed=12)


@track
def skill_launch():
    basic("skill-launch", 13, 118, "Am", "pulse", start=0.0, hits=[(1.7, "tick"), (1.95, "tick"), (2.2, "tick"), (4.4, "whoosh"), (7.2, "impact"), (11.0, "chime")], seed=13)


@track
def keyframe_reel():
    basic("keyframe-reel", 10, 120, "C", "pulse", start=0.6, hits=[(0.6, "tick"), (2.6, "tick"), (4.6, "tick"), (6.6, "tick"), (8.6, "tick"), (8.7, "whoosh"), (9.0, "chime")], seed=14)


@track
def today_is():
    basic("today-is", 8, 124, "Fm", "house", start=2.6, hits=[(0.25, "riser"), (2.6, "impact"), (3.0, "pop"), (5.2, "whoosh"), (5.7, "chime")], seed=15)


@track
def css_release():
    basic("css-release", 9.5, 116, "Am", "pulse", start=0.3, hits=[(1.3, "pop"), (2.4, "pop"), (3.5, "pop"), (4.6, "pop"), (5.8, "pop"), (6.9, "whoosh"), (7.2, "impact"), (7.7, "chime")], seed=16)


@track
def growth_promo():
    basic("growth-promo", 9.5, 128, "C", "house", start=0.8, hits=[(0.0, "whoosh"), (2.6, "bell"), (3.8, "bell"), (5.0, "bell"), (7.2, "whoosh"), (7.6, "impact")], seed=17)


@track
def site_build():
    basic("site-build", 10, 122, "Eb", "funk", start=0.4, hits=[(0.4, "thud"), (0.62, "thud"), (0.84, "thud"), (1.06, "thud"), (3.0, "riser"), (5.2, "click"), (5.4, "chime"), (6.4, "whoosh"), (8.1, "impact")], seed=18)


@track
def beat_bounce():
    hits = [(1.0 + 0.5 * i, "thud") for i in range(9)] + [(5.0, "whoosh"), (6.0, "impact"), (6.1, "chime")]
    basic("beat-bounce", 8, 120, "C", "half", start=1.0, hits=hits, seed=19)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    ids = sys.argv[1:] or []
    for i in TRACKS if ids == ["all"] else ids:
        TRACKS[i]()
