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


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    ids = sys.argv[1:] or []
    for i in TRACKS if ids == ["all"] else ids:
        TRACKS[i]()
