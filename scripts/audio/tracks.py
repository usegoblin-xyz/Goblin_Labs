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


@track
def chunk_promo():
    basic("chunk-promo", 8.5, 124, "Am", "house", start=0.3, hits=[(2.0, "riser"), (3.1, "impact"), (3.8, "pop"), (3.92, "pop"), (4.04, "pop"), (4.16, "pop"), (4.28, "pop"), (5.0, "whoosh"), (6.4, "chime")], seed=20)


@track
def overlay_explainer():
    basic("overlay-explainer", 12, 112, "Dm", "pulse", start=1.0, hits=[(1.0, "whoosh"), (3.0, "pop"), (5.2, "pop"), (5.6, "riser"), (6.4, "click"), (7.4, "pop"), (10.0, "whoosh"), (10.4, "chime")], seed=21)


@track
def book_distill():
    basic("book-distill", 11.5, 118, "Eb", "half", start=1.8, hits=[(0.8, "whoosh"), (1.8, "riser"), (4.6, "pop"), (5.1, "pop"), (5.6, "pop"), (6.1, "pop"), (6.6, "bell"), (9.6, "whoosh"), (10.0, "impact")], seed=22)


@track
def gen_grid():
    hits = [(0.75, "snap"), (1.7, "snap"), (2.65, "snap"), (3.3, "riser"), (5.0, "impact"), (8.0, "whoosh"), (8.6, "chime")]
    basic("gen-grid", 10, 132, "Fm", "trap", start=3.2, hits=hits, seed=23)


@track
def mascot_reel():
    hits = [(1.2, "pop"), (3.2, "pop"), (5.2, "pop"), (7.6, "thud"), (7.7, "chime")] + [(t0, "whoosh") for t0 in (2.3, 4.3, 6.7)]
    basic("mascot-reel", 10, 118, "C", "funk", start=0.3, hits=hits, seed=24)


@track
def photon_journey():
    basic("photon-journey", 14, 96, "Dm", "half", start=4.2, hits=[(0.6, "riser"), (4.2, "impact"), (6.2, "whoosh"), (10.2, "whoosh"), (11.2, "chime"), (12.2, "bell")], seed=25)


@track
def anniversary_dots():
    basic("anniversary-dots", 9.5, 126, "C", "house", start=1.2, hits=[(0.4, "riser"), (3.6, "impact"), (3.7, "chime"), (7.2, "whoosh"), (7.6, "bell")], seed=26)


@track
def remake_compare():
    basic("remake-compare", 11.5, 120, "Am", "break", start=0.4, hits=[(0.4, "pop"), (2.6, "snap"), (4.8, "snap"), (6.0, "pop"), (6.3, "pop"), (7.4, "whoosh"), (9.6, "impact")], seed=27)


@track
def math_reel():
    basic("math-reel", 11, 108, "Dm", "pulse", start=0.4, hits=[(3.4, "whoosh"), (6.2, "whoosh"), (6.3, "bell"), (9.4, "whoosh"), (9.6, "chime")], seed=28)


@track
def easing_lab():
    basic("easing-lab", 10.5, 120, "C", "funk", start=0.8, hits=[(0.8, "whoosh"), (3.0, "whoosh"), (5.4, "pop"), (6.3, "pop"), (7.2, "pop"), (8.1, "pop"), (9.2, "impact")], seed=29)


@track
def referral_promo():
    basic("referral-promo", 10, 122, "Eb", "house", start=0.3, hits=[(1.2, "pop"), (2.2, "click"), (3.0, "whoosh"), (4.2, "chime"), (4.6, "riser"), (8.0, "impact")], seed=30)


@track
def flow_network():
    basic("flow-network", 10, 116, "Am", "pulse", start=0.3, hits=[(0.3, "impact"), (1.0, "whoosh"), (1.8, "tick"), (2.4, "riser"), (7.6, "whoosh"), (8.0, "chime")], seed=31)


@track
def rank_climb():
    hits = [(0.4 + i * 0.1, "tick") for i in range(9)] + [(2.0 + i * 0.5, "pop") for i in range(9)] + [(6.0, "chime"), (7.8, "impact")]
    basic("rank-climb", 9.5, 120, "Fm", "house", start=1.6, hits=hits, seed=32)


@track
def history_timeline():
    hits = [(2.0 + i * 1.5, "bell") for i in range(6)] + [(11.4, "whoosh"), (11.8, "impact")]
    basic("history-timeline", 13.5, 100, "Dm", "half", start=1.6, hits=hits, seed=33)


@track
def retouch_slider():
    basic("retouch-slider", 9.5, 118, "C", "pulse", start=0.6, hits=[(1.4, "click"), (2.4, "click"), (3.4, "click"), (4.4, "click"), (5.4, "whoosh"), (8.0, "chime")], seed=34)


@track
def data_to_visual():
    basic("data-to-visual", 10, 124, "Gm", "break", start=1.6, hits=[(1.6, "whoosh"), (2.4, "pop"), (4.0, "whoosh"), (5.6, "impact"), (8.4, "chime")], seed=35)


@track
def update_reel():
    basic("update-reel", 9, 120, "C", "house", start=0.4, hits=[(1.0, "tick"), (1.3, "tick"), (1.6, "chime"), (3.0, "pop"), (4.1, "pop"), (5.2, "pop"), (7.8, "impact")], seed=36)


@track
def film_strip():
    hits = [(1.2 + i * 0.9, "snap") for i in range(5)] + [(6.0, "whoosh"), (7.2, "impact")]
    basic("film-strip", 9, 128, "Am", "break", start=1.2, hits=hits, seed=37)


@track
def resume_pro():
    hits = [(1.2 + i * 0.22, "tick") for i in range(12)] + [(5.6, "whoosh"), (6.0, "chime"), (8.6, "impact")]
    basic("resume-pro", 10, 118, "Eb", "pulse", start=1.0, hits=hits, seed=38)


@track
def git_explained():
    hits = [(n, "pop") for n in (1.0, 1.6, 3.0, 3.6, 4.6, 5.2, 7.2)] + [(6.4, "impact"), (8.8, "chime")]
    basic("git-explained", 10.5, 112, "Dm", "pulse", start=0.8, hits=hits, seed=39)


@track
def whiteboard():
    basic("whiteboard", 10.5, 104, "C", "half", start=1.0, hits=[(1.6, "tick"), (3.2, "tick"), (4.8, "tick"), (6.6, "whoosh"), (8.6, "chime")], seed=40)


@track
def releases_recap():
    hits = [(1.0 + i * 1.3, "whoosh") for i in range(5)] + [(6.8, "impact"), (7.8, "chime")]
    basic("releases-recap", 10.5, 126, "Fm", "break", start=0.0, hits=hits, seed=41)


@track
def case_stack():
    hits = [(1.3 + i * 1.5, "whoosh") for i in range(4)] + [(7.3, "impact"), (7.8, "chime")]
    basic("case-stack", 9, 122, "Gm", "house", start=0.2, hits=hits, seed=42)


@track
def word_app_reel():
    hits = [(i * 2.4, "impact") for i in range(3)] + [(i * 2.4 + 0.7, "whoosh") for i in range(3)] + [(7.2, "chime")]
    basic("word-app-reel", 9.5, 128, "C", "trap", start=0.0, hits=hits, seed=43)


@track
def receipt_books():
    hits = [(0.4 + i * 0.5, "tick") for i in range(8)] + [(5.4, "whoosh"), (7.0, "chime"), (8.6, "whoosh"), (9.0, "impact")]
    basic("receipt-books", 10.5, 110, "Eb", "pulse", start=0.4, hits=hits, seed=44)


@track
def type_particles():
    hits = [(i * 2.4 + 0.2, "whoosh") for i in range(4)] + [(i * 2.4 + 1.1, "impact") for i in range(4)]
    basic("type-particles", 10, 125, "Fm", "trap", start=0.0, hits=hits, seed=45)


@track
def site_audit():
    hits = [(0.4, "tick"), (0.6, "tick"), (1.4, "riser")] + [(3.6 + i * 0.6, "pop") for i in range(4)] + [(6.2, "chime"), (7.8, "impact")]
    basic("site-audit", 9.5, 120, "Am", "house", start=1.4, hits=hits, seed=46)


@track
def phone_trio():
    hits = [(0.6 + i * 2.2, "whoosh") for i in range(3)] + [(7.3, "whoosh"), (8.0, "chime")]
    basic("phone-trio", 9.5, 118, "C", "funk", start=0.4, hits=hits, seed=47)


@track
def knowledge_graph():
    hits = [(0.2 + i * 0.12, "pop") for i in range(6)] + [(2.6, "whoosh"), (5.0, "tick"), (6.2, "riser"), (7.2, "chime"), (8.8, "impact")]
    basic("knowledge-graph", 10, 114, "Dm", "pulse", start=2.6, hits=hits, seed=48)


@track
def saas_launch():
    hits = [(0.0, "impact"), (1.6, "whoosh"), (4.4, "riser"), (5.3, "impact"), (7.6, "whoosh"), (7.95, "pop"), (8.3, "pop"), (11.0, "impact"), (13.0, "chime")]
    basic("saas-launch", 15, 128, "Fm", "break", start=1.6, hits=hits, seed=49)


@track
def combine_bot():
    basic("combine-bot", 9.5, 140, "Gm", "trap", start=0.0, hits=[(0.0, "riser"), (2.2, "whoosh"), (2.8, "thud"), (3.2, "thud"), (3.6, "thud"), (4.1, "impact"), (4.4, "chime"), (7.8, "impact")], seed=50)


@track
def transcript_ad():
    hits = [(0.4, "click"), (1.0, "pop"), (1.6, "click")] + [(2.2 + i * 0.13, "tick") for i in range(26)] + [(5.8, "whoosh"), (8.4, "chime")]
    basic("transcript-ad", 10, 122, "C", "house", start=1.6, hits=hits, seed=51)


@track
def beat_sync():
    basic("beat-sync", 9.5, 120, "Am", "house", start=0.0, hits=[(8.0, "impact"), (8.05, "chime")], seed=52)


@track
def connector_hub():
    hits = [(1.0 + i * 0.5, "click") for i in range(6)] + [(7.6, "whoosh"), (8.0, "chime")]
    basic("connector-hub", 9.5, 118, "C", "pulse", start=0.4, hits=hits, seed=53)


@track
def dance_figure():
    basic("dance-figure", 9, 128, "Fm", "funk", start=0.5, hits=[(8.0, "impact")], seed=54)


@track
def bad_motion():
    s = Song(9.5, bpm=100, seed=55)
    harmony(s, 0, 4.2, "C", stabs=(0, 2, 4, 6, 8, 10, 12, 14), padlevel=0.12, stablevel=0.3, basslevel=0.3)
    groove(s, 0, 4.2, "house", 0.9)
    for k in range(6):
        s.put("fx", bell(84 + k * 2, 0.6), 1.0 + k * 0.4, 0.3)
    s.put("fx", riser(0.3, 3000, 300), 4.15, 0.6)  # record scratch
    s.put("fx", thud(70), 4.2, 0.8)
    harmony(s, 5.6, 9.5, "Am", stabs=(0,), padlevel=0.06, stablevel=0.1, basslevel=0.25)
    groove(s, 5.8, 9.5, "pulse", 0.6)
    s.put("fx", impact(), 7.8, 0.45)
    s.write(f"{OUT}/bad-motion.wav")


@track
def photo_prints():
    hits = [(1.2 + i * 0.18, "tick") for i in range(9)] + [(2.8, "click")] + [(3.0 + i * 0.12, "whoosh") for i in range(0, 9, 3)] + [(5.2, "whoosh"), (8.0, "chime")]
    basic("photo-prints", 9.5, 120, "Eb", "house", start=2.8, hits=hits, seed=56)


@track
def recursion_zoom():
    hits = [(0.8 + i * 1.7 + 0.8, "whoosh") for i in range(4)] + [(7.6, "thud"), (9.6, "chime")]
    basic("recursion-zoom", 11, 110, "Dm", "half", start=0.8, hits=hits, seed=57)


@track
def visa_stamp():
    hits = [(0.3, "whoosh")] + [(1.4 + i * 0.55, "thud") for i in range(5)] + [(4.2, "whoosh"), (6.2, "chime"), (7.6, "impact")]
    basic("visa-stamp", 9.5, 109, "Gm", "break", start=1.4, hits=hits, seed=58)


@track
def shard_reveal():
    s = Song(9.5, bpm=90, seed=59)
    harmony(s, 0, 9.5, "Eb", stabs=(0,), padlevel=0.12, stablevel=0.06, basslevel=0.0)
    s.put("fx", riser(3.6, 200, 4000), 3.6, 0.4)
    s.put("fx", impact(), 7.4, 0.6)
    s.put("fx", bell(87, 2.0), 7.4, 0.35)
    s.write(f"{OUT}/shard-reveal.wav")


@track
def thread_finder():
    hits = [(1.0, "pop"), (3.6, "whoosh"), (4.3, "pop")] + [(4.6 + i * 0.1, "tick") for i in range(16)] + [(6.1, "click"), (6.2, "chime"), (8.2, "impact")]
    basic("thread-finder", 10, 118, "Am", "pulse", start=0.4, hits=hits, seed=60)


@track
def brand_studio():
    basic("brand-studio", 11, 124, "Eb", "house", start=0.2, hits=[(3.0, "whoosh"), (5.0, "whoosh"), (7.0, "thud"), (7.2, "thud"), (7.4, "thud"), (9.4, "impact")], seed=61)


@track
def ai_timeline():
    hits = [(0.6 + i * 1.45, "bell") for i in range(6)] + [(9.6, "whoosh"), (10.0, "impact")]
    basic("ai-timeline", 11, 112, "Dm", "pulse", start=0.6, hits=hits, seed=62)


@track
def stats_reel():
    basic("stats-reel", 10.5, 128, "Fm", "trap", start=0.0, hits=[(0.0, "impact"), (3.0, "whoosh"), (4.9, "snap"), (6.0, "pop"), (7.2, "impact"), (9.2, "chime")], seed=63)


@track
def markdown_live():
    hits = [(0.4 + i * 0.32, "tick") for i in range(18)] + [(6.6, "pop"), (7.0, "click"), (7.4, "whoosh"), (8.6, "chime")]
    basic("markdown-live", 10, 116, "C", "pulse", start=0.4, hits=hits, seed=64)


@track
def million_milestone():
    basic("million-milestone", 9.5, 126, "C", "house", start=0.6, hits=[(0.6, "riser"), (4.6, "impact"), (4.7, "chime"), (7.6, "whoosh"), (8.0, "bell")], seed=65)


@track
def inbox_zero():
    hits = [(1.2 + i * 0.75, "whoosh") for i in range(7)] + [(6.6, "chime"), (8.6, "impact")]
    basic("inbox-zero", 10, 120, "Gm", "break", start=1.2, hits=hits, seed=66)


@track
def ignition():
    s = Song(10, bpm=80, seed=67)
    harmony(s, 0, 6.0, "Dm", stabs=(0,), padlevel=0.14, stablevel=0.05, basslevel=0.15)
    s.put("fx", riser(5.8, 100, 3000), 0.2, 0.35)
    s.put("fx", impact(2.0), 6.9, 0.9)
    s.put("fx", bell(74, 2.5), 6.95, 0.4)
    harmony(s, 7.2, 10, "Dm", stabs=(0,), padlevel=0.1, stablevel=0.08, basslevel=0.2)
    s.write(f"{OUT}/ignition.wav")


@track
def technique_sampler():
    hits = [(i * 1.4, "whoosh") for i in range(6)] + [(8.4, "impact")]
    basic("technique-sampler", 9.5, 128, "Fm", "break", start=0.0, hits=hits, seed=68)


@track
def spot_the_cat():
    hits = [(1.4 + i * 1.3, "bell") for i in range(5)] + [(8.0, "chime"), (9.8, "impact")]
    basic("spot-the-cat", 11, 96, "C", "half", start=0.6, hits=hits, seed=69)


@track
def engineering_reel():
    hits = [(0.0, "impact"), (2.6, "whoosh")] + [(3.25 + i * 0.55, "pop") for i in range(4)] + [(5.0, "chime"), (5.2, "whoosh"), (7.4, "whoosh"), (8.0, "riser"), (10.2, "impact")]
    basic("engineering-reel", 11, 126, "Am", "break", start=0.0, hits=hits, seed=70)


@track
def motion_principles():
    hits = [(i * 1.8, "pop") for i in range(6)] + [(0.45, "thud"), (1.35, "thud"), (10.8, "chime")]
    basic("motion-principles", 11.5, 112, "C", "pulse", start=0.0, hits=hits, seed=71)


@track
def rhythm_grid():
    basic("rhythm-grid", 9, 124, "Eb", "house", start=0.0, hits=[(7.74, "impact")], seed=72)


@track
def chart_dance():
    basic("chart-dance", 12.5, 120, "Gm", "funk", start=0.0, hits=[(3.0, "snap"), (5.0, "whoosh"), (8.0, "whoosh"), (9.8, "riser"), (11.2, "impact")], seed=73)


@track
def data_center():
    basic("data-center", 13, 100, "Dm", "pulse", start=0.4, hits=[(1.6, "whoosh"), (5.0, "whoosh"), (6.4, "riser"), (7.8, "whoosh"), (8.6, "tick"), (10.0, "whoosh"), (11.8, "impact")], seed=74)


@track
def music_app_film():
    basic("music-app-film", 11.5, 118, "Am", "house", start=0.0, hits=[(2.6, "whoosh"), (3.6, "click"), (8.2, "whoosh"), (10.2, "impact")], seed=75)


@track
def stencil_type():
    basic("stencil-type", 9, 122, "Fm", "house", start=0.0, hits=[(2.2, "whoosh"), (4.8, "whoosh"), (7.8, "impact")], seed=76)


@track
def agent_clicks():
    hits = [(0.3 + i * 0.05, "tick") for i in range(20)] + [(t0, "click") for t0 in (2.3, 3.95, 5.55, 7.15)] + [(7.2, "chime"), (9.0, "impact")]
    basic("agent-clicks", 10, 120, "Am", "pulse", start=1.4, hits=hits, seed=77)


@track
def founder_page():
    hits = [(0.3 + i * 0.55, "pop") for i in range(3)] + [(2.0 + i * 0.12, "tick") for i in range(4)] + [(6.4, "whoosh"), (7.6, "impact")]
    basic("founder-page", 9.5, 124, "C", "house", start=0.3, hits=hits, seed=78)


@track
def sunset_dogfight():
    s = Song(10.5, bpm=84, seed=79)
    harmony(s, 0, 10.5, "Eb", stabs=(0, 8), padlevel=0.14, stablevel=0.08, basslevel=0.18)
    s.put("fx", whoosh(1.5, 600), 1.0, 0.2)
    s.put("fx", whoosh(1.5, 700), 4.0, 0.2)
    s.put("fx", bell(79, 2.0), 7.0, 0.3)
    s.write(f"{OUT}/sunset-dogfight.wav")


@track
def agent_pipeline():
    hits = [(0.2, "pop"), (1.3, "whoosh")] + [(2.0 + i * 1.3, "tick") for i in range(4)] + [(3.0 + i * 1.3, "pop") for i in range(4)] + [(7.3, "chime"), (8.8, "impact")]
    basic("agent-pipeline", 10, 118, "Dm", "pulse", start=1.3, hits=hits, seed=80)


@track
def brainrot_pov():
    hits = [(i * 60 / 140 / 2, "snap") for i in range(0, 40, 2)] + [(8.6, "riser"), (9.0, "chime")]
    basic("brainrot-pov", 10, 140, "Gm", "trap", start=0.0, end=8.6, hits=hits, seed=81)


@track
def energy_landscape():
    hits = [(2.6 + k * 0.25, "pop") for k in range(6)] + [(6.4, "whoosh"), (9.6, "chime")]
    basic("energy-landscape", 10.5, 100, "C", "half", start=1.0, hits=hits, seed=82)


@track
def decades_timeline():
    hits = [(1.4 + i * 1.2, "tick") for i in range(7)] + [(9.6, "whoosh"), (10.0, "impact")]
    basic("decades-timeline", 11.5, 112, "Gm", "pulse", start=1.0, hits=hits, seed=83)


@track
def usage_billing():
    basic("usage-billing", 9.5, 120, "Am", "house", start=0.6, hits=[(0.4, "whoosh"), (5.8, "chime"), (7.6, "whoosh"), (8.0, "impact")], seed=84)


@track
def form_builder():
    hits = [(0.3 + i * 0.05, "tick") for i in range(12)] + [(1.4 + i, "pop") for i in range(3)] + [(4.6, "click"), (4.7, "chime"), (5.0, "whoosh"), (8.2, "impact")]
    basic("form-builder", 10, 118, "C", "pulse", start=0.3, hits=hits, seed=85)


@track
def summary_layers():
    hits = [(1.6 + i * 1.8, "whoosh") for i in range(3)] + [(6.9, "chime"), (8.8, "impact")]
    basic("summary-layers", 10.5, 110, "Eb", "half", start=1.6, hits=hits, seed=86)


@track
def portrait_reel():
    hits = [(0.3 + i * 0.6, "thud") for i in range(6)] + [(5.2, "whoosh"), (8.4, "impact")]
    basic("portrait-reel", 9.5, 124, "Fm", "break", start=0.3, hits=hits, seed=87)


@track
def badge_unlock():
    s = Song(9.5, bpm=110, seed=88)
    harmony(s, 0, 3.0, "Eb", stabs=(0,), padlevel=0.1, stablevel=0.06, basslevel=0.0)
    s.put("fx", riser(1.9, 300, 6000), 0.8, 0.4)
    s.put("fx", click(), 2.7, 0.8)
    s.put("fx", whoosh(0.8, 1500), 3.0, 0.4)
    s.put("fx", impact(), 3.8, 0.6)
    for k in range(6):
        s.put("fx", bell(84 + k * 3, 1.2), 3.85 + k * 0.08, 0.25)
    harmony(s, 3.8, 9.5, "Eb", padlevel=0.06, stablevel=0.18, basslevel=0.3)
    groove(s, 3.8, 9.5, "house", 0.8)
    s.write(f"{OUT}/badge-unlock.wav")


@track
def do_dont():
    hits = [(1.2 + i * 2.2, "thud") for i in range(3)] + [(1.8 + i * 2.2, "snap") for i in range(3)] + [(2.0 + i * 2.2, "chime") for i in range(3)] + [(8.0, "impact")]
    basic("do-dont", 9.5, 116, "C", "pulse", start=1.2, hits=hits, seed=89)


@track
def model_router():
    hits = [(0.3 + i * 0.03, "tick") for i in range(20)] + [(1.4, "whoosh"), (2.8, "whoosh"), (3.5, "thud"), (3.9, "whoosh"), (4.6, "chime"), (8.0, "impact")]
    basic("model-router", 9.5, 124, "Dm", "break", start=1.4, hits=hits, seed=90)


@track
def api_key():
    hits = [(1.2, "click"), (1.4, "riser"), (2.55, "click"), (2.7, "chime")] + [(3.4 + i * 0.06, "tick") for i in range(20)] + [(4.9, "pop"), (7.8, "impact")]
    basic("api-key", 9.5, 120, "Am", "pulse", start=1.4, hits=hits, seed=91)


@track
def powers_zoom():
    hits = [(0.8, "riser")] + [(0.8 + i * 1.7, "whoosh") for i in range(1, 6)] + [(10.6, "impact")]
    basic("powers-zoom", 12.0, 100, "Eb", "half", start=0.8, hits=hits, seed=92)


@track
def type_slam():
    hits = [(0.4 + i * 1.0, "impact") for i in range(6)] + [(6.4, "thud")]
    basic("type-slam", 8.3, 120, "Fm", "trap", start=0.4, hits=hits, seed=93)


@track
def dev_portfolio():
    hits = [(0.3 + i * 0.07, "tick") for i in range(10)] + [(1.0, "chime"), (1.5, "whoosh"), (3.6, "whoosh"), (5.2, "pop"), (7.0, "whoosh"), (9.2, "impact")]
    basic("dev-portfolio", 10.5, 118, "C", "funk", start=1.4, hits=hits, seed=94)


@track
def paper_launch():
    hits = [(0.2, "whoosh"), (1.2, "whoosh"), (2.0, "snap"), (3.6, "pop"), (4.05, "pop"), (4.5, "pop"), (5.4, "riser"), (8.6, "bell")]
    basic("paper-launch", 10.0, 104, "C", "pulse", start=0.2, hits=hits, seed=95)


@track
def type_form_space():
    hits = [(0.2, "whoosh"), (2.95, "whoosh"), (6.25, "whoosh"), (9.55, "whoosh"), (10.1, "impact")]
    basic("type-form-space", 11.6, 122, "Gm", "break", start=0.2, hits=hits, seed=96)


@track
def step_race():
    hits = [(3.0, "whoosh"), (3.8, "riser"), (8.0, "chime"), (8.05, "pop"), (9.6, "bell")]
    basic("step-race", 11.0, 96, "C", "half", start=2.6, hits=hits, seed=97)


@track
def bento_grid():
    hits = [(0.2 + i * 0.16, "pop") for i in range(6)] + [(3.4 + j * 1.5, "whoosh") for j in range(4)] + [(5.5, "click"), (10.8, "impact")]
    basic("bento-grid", 12.0, 120, "Am", "house", start=0.2, hits=hits, seed=98)


@track
def project_carousel():
    hits = [(0.0, "riser"), (1.2, "whoosh"), (2.7, "whoosh"), (4.2, "whoosh"), (5.7, "whoosh"), (7.9, "impact")]
    basic("project-carousel", 9.5, 124, "Dm", "house", start=1.2, hits=hits, seed=99)


@track
def hundred_thanks():
    hits = [(0.4 + i * 0.3, "pop") for i in range(10)] + [(3.8, "whoosh"), (5.4, "thud"), (5.9, "thud"), (6.0, "chime"), (9.4, "bell")]
    basic("hundred-thanks", 10.5, 92, "C", "half", start=0.4, hits=hits, seed=100)


@track
def voice_agent():
    hits = [(0.1, "bell"), (0.6, "bell"), (1.2, "click"), (2.5, "tick"), (5.0, "tick"), (6.6, "chime"), (9.2, "impact")]
    basic("voice-agent", 10.5, 110, "Dm", "pulse", start=1.2, hits=hits, seed=101)


@track
def swiss_grid():
    hits = [(0.0, "riser"), (1.0, "snap"), (3.3, "snap"), (5.6, "snap"), (8.8, "impact")]
    basic("swiss-grid", 9.7, 116, "Am", "break", start=1.0, hits=hits, seed=102)


@track
def caption_app():
    hits = [(0.2, "whoosh"), (3.8, "click"), (6.2, "click"), (9.1, "chime")]
    basic("caption-app", 9.8, 112, "Eb", "pulse", start=1.2, hits=hits, seed=103)


@track
def social_feed():
    hits = [(0.1, "whoosh"), (1.0, "whoosh"), (2.0, "pop"), (2.6, "whoosh"), (3.4, "whoosh"), (5.4, "whoosh"), (5.8, "pop"), (6.5, "pop"), (7.2, "pop"), (8.6, "impact")]
    basic("social-feed", 9.7, 124, "Fm", "trap", start=0.6, hits=hits, seed=104)


@track
def pen_tool_reel():
    hits = [(0.4 + i * 0.6, "click") for i in range(5)] + [(3.6, "whoosh"), (4.4, "whoosh"), (6.3, "riser"), (8.8, "impact")]
    basic("pen-tool-reel", 9.7, 104, "Gm", "half", start=0.4, hits=hits, seed=105)


@track
def email_verify():
    hits = [(0.2, "whoosh"), (1.4, "riser")] + [(1.6 + i * 0.4, "tick") for i in range(8)] + [(5.0, "whoosh"), (6.6, "chime"), (8.8, "impact")]
    basic("email-verify", 9.7, 120, "C", "house", start=1.4, hits=hits, seed=106)


@track
def net_worth():
    hits = [(0.2 + i * 0.18, "pop") for i in range(5)] + [(2.2, "whoosh"), (2.6, "riser"), (4.0, "chime"), (4.3, "whoosh"), (9.0, "impact")]
    basic("net-worth", 9.8, 118, "Am", "funk", start=2.2, hits=hits, seed=107)


@track
def pixel_history():
    hits = [(0.6 + i * 1.8, "chime") for i in range(5)] + [(10.2, "bell")]
    basic("pixel-history", 11.2, 128, "C", "pulse", start=0.3, hits=hits, seed=108)


@track
def pixel_duel():
    hits = [(0.2, "whoosh"), (0.4, "whoosh"), (1.0, "snap"), (1.2, "snap"), (2.4, "impact"), (3.8, "impact"), (5.2, "impact"), (5.6, "riser"), (8.1, "bell")]
    basic("pixel-duel", 9.5, 140, "Am", "break", start=0.2, hits=hits, seed=109)


@track
def hands_off():
    hits = [(1.0, "whoosh")] + [(2.2 + i * 0.55, "tick") for i in range(6)] + [(6.0, "chime"), (8.6, "impact")]
    basic("hands-off", 9.8, 110, "Eb", "funk", start=1.0, hits=hits, seed=110)


@track
def recruiter_intro():
    hits = [(0.3, "riser"), (1.5, "whoosh"), (3.4, "pop"), (3.6, "pop"), (3.8, "pop")] + [(4.8 + i * 0.3, "snap") for i in range(5)] + [(9.0, "impact")]
    basic("recruiter-intro", 10.0, 116, "Dm", "house", start=0.3, hits=hits, seed=111)


@track
def loom_weave():
    hits = [(0.3, "riser")] + [(1.6 + i * 0.9, "tick") for i in range(6)] + [(7.4, "whoosh"), (9.8, "bell")]
    basic("loom-weave", 10.7, 88, "Gm", "half", start=0.3, hits=hits, seed=112)


@track
def wholesale_pitch():
    hits = [(0.0, "thud")] + [(1.0 + i * 0.1, "tick") for i in range(12)] + [(2.6, "pop"), (2.95, "pop"), (3.3, "pop"), (4.4, "riser"), (5.6, "chime"), (9.0, "impact")]
    basic("wholesale-pitch", 9.8, 120, "C", "house", start=1.0, hits=hits, seed=113)


@track
def skill_radar():
    hits = [(0.3, "whoosh"), (1.3, "pop")] + [(1.6 + i * 0.4, "tick") for i in range(6)] + [(4.4, "riser"), (5.6, "whoosh"), (8.8, "impact")]
    basic("skill-radar", 9.7, 118, "Am", "break", start=0.3, hits=hits, seed=114)


@track
def agent_hud():
    hits = [(0.0, "riser"), (0.8, "snap"), (1.0, "snap"), (1.2, "snap"), (1.4, "snap"), (4.0, "bell"), (5.1, "click"), (6.6, "chime"), (8.8, "impact")]
    basic("agent-hud", 9.7, 126, "Fm", "pulse", start=0.8, hits=hits, seed=115)


@track
def search_showcase():
    hits = [(0.6, "whoosh")] + [(0.8 + k * 2.4 + i * 0.08, "tick") for k in range(3) for i in range(6)] + [(1.6 + k * 2.4, "pop") for k in range(3)] + [(8.6, "impact")]
    basic("search-showcase", 9.8, 120, "C", "house", start=0.8, hits=hits, seed=116)


@track
def brief_to_deck():
    hits = [(0.6 + i * 0.75, "tick") for i in range(4)] + [(3.4, "click")] + [(3.8 + i * 0.35, "whoosh") for i in range(4)] + [(6.0, "riser"), (8.8, "impact")]
    basic("brief-to-deck", 9.8, 116, "Am", "funk", start=0.6, hits=hits, seed=117)


@track
def one_second():
    hits = [(0.6, "click")] + [(0.6 + i * 1.9, "tick") for i in range(1, 4)] + [(8.2, "bell"), (9.4, "chime")]
    basic("one-second", 10.6, 72, "Dm", "half", start=0.6, hits=hits, seed=118)


@track
def type_portrait():
    hits = [(0.4, "riser"), (8.6, "impact")]
    basic("type-portrait", 9.8, 100, "Eb", "pulse", start=0.4, hits=hits, seed=119)


@track
def chain_pitch():
    hits = [(0.4 + i * 1.9, "thud") for i in range(4)] + [(0.9 + i * 1.9, "snap") for i in range(1, 4)] + [(9.0, "impact")]
    basic("chain-pitch", 9.8, 124, "Fm", "trap", start=0.4, hits=hits, seed=120)


@track
def liquid_reel():
    hits = [(0.6 + i * 1.9 + 0.95, "pop") for i in range(4)] + [(9.3, "impact")]
    basic("liquid-reel", 10.5, 126, "Gm", "house", start=0.6, hits=hits, seed=121)


@track
def tile_flip_reel():
    hits = [(0.4 + i * 1.8, "whoosh") for i in range(5)] + [(8.6, "chime")]
    basic("tile-flip-reel", 10.5, 133, "Am", "break", start=0.4, hits=hits, seed=122)


@track
def one_line_reel():
    hits = [(0.3, "riser")] + [(1.6 + i * 1.7, "whoosh") for i in range(4)] + [(7.4, "chime")]
    basic("one-line-reel", 9.5, 106, "C", "pulse", start=0.3, hits=hits, seed=123)


@track
def orbit_rings():
    hits = [(0.3 + i * 0.4, "whoosh") for i in range(4)] + [(3.6, "riser"), (7.0, "impact")]
    basic("orbit-rings", 8.7, 124, "Fm", "house", start=0.3, hits=hits, seed=124)


@track
def baby_tracker():
    hits = [(0.2, "chime"), (1.2, "bell"), (3.0, "whoosh")] + [(3.8 + i * 0.4, "pop") for i in range(4)] + [(7.0, "chime"), (9.0, "bell")]
    basic("baby-tracker", 10.4, 80, "C", "half", start=3.0, hits=hits, seed=125)


@track
def gradient_flow():
    hits = [(0.0, "riser"), (7.2, "whoosh"), (8.0, "chime")]
    basic("gradient-flow", 10.1, 96, "Eb", "pulse", start=0.4, hits=hits, seed=126)


@track
def dub_swap():
    hits = [(0.8 + i * 1.8, "click") for i in range(4)] + [(8.7, "impact")]
    basic("dub-swap", 9.9, 118, "Am", "funk", start=0.8, hits=hits, seed=127)


@track
def service_explainer():
    hits = [(0.55, "thud"), (2.4, "whoosh"), (2.9, "riser"), (4.7, "pop"), (5.3, "pop"), (5.9, "pop"), (6.9, "whoosh"), (9.4, "impact")]
    basic("service-explainer", 10.6, 112, "C", "house", start=0.3, hits=hits, seed=128)


@track
def ink_brush():
    hits = [(0.4 + i * 1.9, "whoosh") for i in range(3)] + [(6.4, "thud"), (9.0, "bell")]
    basic("ink-brush", 10.0, 84, "Dm", "half", start=0.4, hits=hits, seed=129)


@track
def instant_pay():
    hits = [(1.0, "impact"), (1.15, "whoosh"), (1.8, "chime"), (4.0, "whoosh"), (4.25, "whoosh"), (4.5, "whoosh"), (8.2, "impact")]
    basic("instant-pay", 9.4, 128, "Gm", "trap", start=1.0, hits=hits, seed=130)


@track
def book_shelf_reel():
    hits = [(0.1, "whoosh")] + [(1.0 + i * 1.9, "snap") for i in range(3)] + [(2.2 + i * 1.9, "pop") for i in range(3)] + [(8.4, "impact")]
    basic("book-shelf-reel", 9.6, 108, "C", "pulse", start=1.0, hits=hits, seed=131)


@track
def drone_flight():
    hits = [(0.0, "riser"), (2.6, "whoosh"), (5.2, "whoosh"), (7.8, "riser"), (8.8, "impact")]
    basic("drone-flight", 10.2, 100, "Dm", "pulse", start=0.2, hits=hits, seed=132)


@track
def split_panels():
    hits = [(0.6, "snap"), (2.0, "snap"), (3.6, "snap"), (6.4, "whoosh"), (7.9, "impact")]
    basic("split-panels", 9.3, 120, "C", "house", start=0.6, hits=hits, seed=133)


@track
def glitch_reel():
    hits = [(i * 1.4, "impact") for i in range(5)] + [(0.7 + i * 1.4, "tick") for i in range(4)]
    basic("glitch-reel", 8.0, 128, "Fm", "break", start=0.0, hits=hits, seed=134)


@track
def flashcard_review():
    hits = [(1.3 + i * 2.0, "snap") for i in range(3)] + [(2.2 + i * 2.0, "whoosh") for i in range(3)] + [(7.0, "chime"), (9.4, "impact")]
    basic("flashcard-review", 10.4, 112, "Eb", "funk", start=0.8, hits=hits, seed=135)


@track
def dot_matrix_board():
    hits = [(0.0, "riser"), (4.0, "tick"), (5.8, "chime"), (7.6, "bell")]
    basic("dot-matrix-board", 10.1, 118, "Am", "pulse", start=0.9, hits=hits, seed=136)


@track
def overthinking():
    hits = [(1.0 + i * 0.85, "tick") for i in range(5)] + [(5.6, "riser"), (6.6, "whoosh"), (7.8, "chime")]
    basic("overthinking", 10.1, 90, "Gm", "half", start=0.6, hits=hits, seed=137)


@track
def hypno_eye():
    hits = [(1.2, "riser"), (3.6, "snap"), (5.0, "chime")]
    basic("hypno-eye", 9.1, 120, "Eb", "house", start=0.0, hits=hits, seed=138)


@track
def quote_deck():
    hits = [(0.1, "whoosh"), (0.5, "tick"), (0.9, "tick")] + [(1.4 + i * 1.6, "snap") for i in range(4)] + [(7.8, "whoosh"), (9.2, "impact")]
    basic("quote-deck", 10.2, 108, "C", "funk", start=1.4, hits=hits, seed=139)


@track
def ownership_map():
    hits = [(0.2, "pop"), (1.8, "whoosh"), (2.6, "thud"), (3.6, "riser"), (4.2, "pop"), (4.35, "pop"), (4.5, "pop"), (6.4, "snap"), (9.0, "impact")]
    basic("ownership-map", 10.0, 112, "Dm", "funk", start=0.2, hits=hits, seed=140)


@track
def cube_roll():
    hits = [(0.6 + i * 1.25, "thud") for i in range(5)]
    basic("cube-roll", 8.3, 96, "Fm", "half", start=0.6, hits=hits, seed=141)


@track
def particle_sphere():
    hits = [(0.0, "riser"), (2.6, "whoosh"), (4.6, "impact"), (5.4, "riser"), (6.8, "chime")]
    basic("particle-sphere", 9.5, 124, "Am", "house", start=0.0, hits=hits, seed=142)


@track
def hello_intro():
    hits = [(0.1, "pop"), (0.6, "whoosh")] + [(1.8 + i * 0.75, "snap") for i in range(5)] + [(6.4, "pop"), (8.4, "chime")]
    basic("hello-intro", 9.8, 118, "C", "funk", start=0.6, hits=hits, seed=143)


@track
def poster_breakout():
    hits = [(0.3, "riser"), (2.0, "whoosh"), (2.2, "snap"), (2.8, "impact"), (5.0, "whoosh")]
    basic("poster-breakout", 9.0, 126, "Gm", "break", start=2.0, hits=hits, seed=144)


@track
def career_metro():
    hits = [(0.8, "whoosh"), (1.8, "chime"), (3.4, "chime"), (5.0, "chime"), (6.6, "bell"), (8.8, "impact")]
    basic("career-metro", 10.0, 108, "Eb", "pulse", start=0.8, hits=hits, seed=145)


@track
def terminal_bloom():
    hits = [(0.2, "pop"), (1.0, "riser"), (1.9, "whoosh")] + [(2.8 + i * 0.25, "snap") for i in range(5)] + [(8.4, "impact")]
    basic("terminal-bloom", 9.6, 128, "Fm", "trap", start=1.9, hits=hits, seed=146)


@track
def cocktail_build():
    hits = [(0.6, "click"), (0.75, "click"), (0.9, "click"), (1.05, "click"), (1.6, "whoosh"), (3.0, "whoosh"), (4.4, "whoosh"), (5.6, "tick"), (7.0, "whoosh")]
    basic("cocktail-build", 9.7, 100, "Dm", "funk", start=0.6, hits=hits, seed=147)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    ids = sys.argv[1:] or []
    for i in TRACKS if ids == ["all"] else ids:
        TRACKS[i]()
