"""Soundtrack for the chat launch film (render/ChatLaunch.tsx).

A soft synth bed that builds after the title card, with sound effects from
Goblin's own library (public/sfx, made by scripts/audio/sfx.py) on every moment:
pops and typing for the user's messages, ticks for steps, whooshes on the beat
titles, the ding the story asks for, and an impact on the lockup. Timings come
from render/chat-launch-cues.json, the same file the picture uses.

    python3 scripts/chat-launch-audio.py   → public/launch/chat-launch-mix.wav
    python3 scripts/chat-launch-audio.py --sfx-only → public/launch/chat-launch-sfx.wav
      (just the sound effects, to lay over another music track)
    python3 scripts/chat-launch-audio.py --music track.mp3 --drop 24.002 [--out out/mix.wav]
      (the effects over a licensed track instead of the synth bed, with the
      track's drop, in track seconds, landing on the title reveal; the track
      isn't kept in the repo)
"""
import json
import os
import sys

import numpy as np
import soundfile as sf

HERE = os.path.dirname(__file__)
sys.path.insert(0, os.path.join(HERE, "audio"))
from synth import SR, Song, harmony, groove, pad  # noqa: E402
import cinematic  # noqa: E402

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

SFX_ONLY = "--sfx-only" in sys.argv

# ---- music -----------------------------------------------------------------
if not SFX_ONLY:
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
# Cinematic whoosh-hits on the beat titles: the hit lands with the first word.
WH, WH_HIT = cinematic.whoosh_hit()
for b in CUES["beats"]:
    s.put("fx", WH, b["at"] + 0.06 - WH_HIT, 0.5)
# The title reveal: an epic hook whose final boom lands on "Chat in Goblin".
HOOK, HOOK_BOOM = cinematic.hook()
s.put("fx", HOOK, sc["title"][0] + 0.45 - HOOK_BOOM, 0.62)
for st in CUES["steps"] + CUES["phases"]:
    s.put("fx", fx("tick"), st["at"], 0.35)
s.put("fx", fx("success"), CUES["card1"], 0.4)
s.put("fx", fx("swipe"), CUES["panelOpen"], 0.6)
s.put("fx", fx("typing", 0.7), CUES["fieldEdit"] + 0.5, 0.2)
s.put("fx", fx("ding"), CUES["card2"] + 0.3, 0.6)  # "add a ding at the end"
s.put("fx", fx("click"), CUES["explainerToggle"], 0.7)
s.put("fx", fx("sparkle"), CUES["videoCard"], 0.4)
s.put("fx", fx("success"), CUES["exportDone"], 0.45)
s.put("fx", WH, CUES["tagline"] - WH_HIT, 0.45)
RISE = cinematic.riser(1.6)
s.put("fx", RISE, CUES["lockup"] - 1.6, 0.5)
s.put("fx", cinematic.boom(), CUES["lockup"], 0.62)

def arg(name, default=None):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


MUSIC = arg("--music")
if MUSIC:
    import subprocess
    import tempfile

    # The effects alone, peaked like the --sfx-only stem.
    fxbus = s.bus["fx"]
    fxs = fxbus / (np.abs(fxbus).max() or 1) * 0.89
    reveal = sc["title"][0] + 0.45  # when "Chat in Goblin" lands, with the hook's boom
    start = float(arg("--drop", "0")) - reveal
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, "m.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{max(0, start):.3f}", "-i", MUSIC, "-t", str(DUR), "-ar", str(SR), "-ac", "2", wav], check=True)
        mus, _ = sf.read(wav)
    n = s.N
    m = np.zeros((n, 2))
    lead = int(max(0, -start) * SR)
    m[lead: lead + len(mus)] = mus[: n - lead]
    t = np.arange(n) / SR
    # Let the hook's build breathe, then the drop and the boom hit together;
    # dip again under the ending's riser and boom; fade out under the lockup.
    duck = np.ones(n)
    for a, b, depth in [(reveal - 3.4, reveal - 0.02, 0.4), (CUES["lockup"] - 1.7, DUR, 0.35)]:
        duck = np.minimum(duck, 1 - depth * np.clip(np.minimum((t - a) / 0.5, (b - t) / 0.05 if b < DUR else 1), 0, 1))
    fade = np.clip((DUR - t) / 2.6, 0, 1) ** 1.5
    m *= (duck * fade)[:, None] * 0.55
    mix = np.tanh((m + fxs * 0.8) * 1.05) / np.tanh(1.05)
    mix = mix / np.abs(mix).max() * 0.93
    out = arg("--out", os.path.join(ROOT, "out", "chat-launch-mix-licensed.wav"))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    sf.write(out, mix, SR, subtype="PCM_16")
    print("wrote", out)
else:
    out = os.path.join(ROOT, "public", "launch", "chat-launch-sfx.wav" if SFX_ONLY else "chat-launch-mix.wav")
    s.write(out, levels=(-15, -19, -7) if not SFX_ONLY else (-60, -60, -3), fade=1.8)
