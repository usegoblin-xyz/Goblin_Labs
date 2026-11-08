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
    Add --typing keyboard.wav to use a real typing recording for the messages
    typing out (a different unbroken stretch for each), instead of the synth one.
    Add --swoosh swoosh.wav to use a recorded swoosh on the beat titles, the
    tagline and the side panel opening, peaking with the first word.
    With --music the typing gets its own level, about 9 dB under whatever is playing
    (TYPE_UNDER_DB), and the music dips about 2.5 dB while each message types.

    The released mix:
      python3 scripts/chat-launch-audio.py --music Taketones_Contrast.mp3 --drop 24.002 \
        --typing Taketones_LaptopKeyboard_Typing.wav --swoosh Taketones_Swoosh004.wav \
        --out out/chat-launch-mix-final.wav
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


def arg(name, default=None):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


def typing_takes(path, durations):
    """One stretch of a real typing recording per duration: each starts on a
    keystroke, has no pause longer than 0.14 s and doesn't reuse another's audio."""
    import subprocess
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, "t.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-ar", str(SR), "-ac", "2", wav], check=True)
        x, _ = sf.read(wav)
    env = np.abs(x).mean(1)
    hop = int(0.005 * SR)
    e = np.array([env[i:i + hop].max() for i in range(0, len(env) - hop, hop)])
    th = np.percentile(e, 90) * 0.45
    keys = np.where((e[1:] > th) & (e[:-1] <= th))[0] * hop / SR
    used, out = [], []
    for d in durations:
        best = None
        for k0 in keys:
            if any(a - d - 0.1 < k0 < b + 0.1 for a, b in used):
                continue
            inside = keys[(keys >= k0) & (keys <= k0 + d)]
            gaps = np.diff(np.concatenate([inside, [k0 + d]]))
            if len(inside) >= 8 * d and gaps.max() < 0.14:
                best = k0
                break
        if best is None:
            best = keys[0]
        used.append((best, best + d))
        a = max(0, int((best - 0.01) * SR))
        seg = x[a: a + int((d + 0.06) * SR)].copy()
        f_in, f_out = int(0.008 * SR), int(0.05 * SR)
        seg[:f_in] *= np.linspace(0, 1, f_in)[:, None]
        seg[-f_out:] *= np.linspace(1, 0, f_out)[:, None]
        out.append(seg / (np.abs(seg).max() or 1) * 0.6)
    return out


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
TYPING = arg("--typing")
lengths = [len(m["text"]) / USER_CPS for m in CUES["user"]] + [0.7]
takes = typing_takes(TYPING, lengths) if TYPING else [fx("typing", d) for d in lengths]
type_gain = float(os.environ.get("TYPE_GAIN", 0.75 if TYPING else 0.22))
# When each message is typing, so the music can dip under it.
TYPING_SPANS = [(m["at"] + 0.05, m["at"] + 0.05 + d) for m, d in zip(CUES["user"], lengths)] + [(CUES["fieldEdit"] + 0.5, CUES["fieldEdit"] + 1.2)]
# With a music track and a typing recording, typing gets its own level per
# message (see below), so it isn't put on the effects bus here.
SEPARATE_TYPING = bool(TYPING and arg("--music"))
for m, take in zip(CUES["user"], takes):
    s.put("fx", fx("pop"), m["at"], 0.55)
    if not SEPARATE_TYPING:
        s.put("fx", take, m["at"] + 0.05, type_gain, pan=0.0 if TYPING else 0.2)
for m in CUES["goblin"]:
    s.put("fx", fx("tick"), m["at"], 0.4, pan=-0.2)
# Swooshes on the beat titles, peaking with the first word: a recorded swoosh
# with --swoosh, otherwise the cinematic whoosh-hit.
def load_swoosh(path):
    import subprocess
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, "s.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-ar", str(SR), "-ac", "2", wav], check=True)
        x, _ = sf.read(wav)
    env = np.abs(x).mean(1)
    w = int(0.01 * SR)
    peak = np.argmax([env[i:i + w].mean() for i in range(0, len(env) - w, w)]) * w / SR
    return x / (np.abs(x).max() or 1), peak


SWOOSH = arg("--swoosh")
if SWOOSH:
    WH, WH_HIT = load_swoosh(SWOOSH)
    WH_GAIN = float(os.environ.get("SWOOSH_GAIN", 0.6))
else:
    WH, WH_HIT = cinematic.whoosh_hit()
    WH_GAIN = 0.5
# With a music track, recorded swooshes get their own level (FEATURED, mixed
# below), set against whatever is playing at their peak.
FEATURED = []  # (signal, peak time in the film, dB under the rest)


def swoosh_at(peak_t, gain, under_db):
    if SWOOSH and arg("--music"):
        FEATURED.append((WH * (gain / 0.6 if WH_GAIN else 0), peak_t, under_db))
    else:
        s.put("fx", WH, peak_t - WH_HIT, gain)


for b in CUES["beats"]:
    swoosh_at(b["at"] + 0.06, WH_GAIN, 3)
# The title reveal: an epic hook whose final boom lands on "Chat in Goblin".
HOOK, HOOK_BOOM = cinematic.hook()
s.put("fx", HOOK, sc["title"][0] + 0.45 - HOOK_BOOM, 0.62)
# The title card collapsing: a reverse swell sucks everything in, and a deep
# hit as the ring bursts out into the next frame.
SUCK = cinematic.reverse_swell(CUES["titleBurst"] - CUES["titleSuck"])
s.put("fx", SUCK, CUES["titleBurst"] - len(SUCK) / SR, 0.7)
s.put("fx", cinematic.whoosh(0.6, 3800, 600, 0.8, -0.8), CUES["titleBurst"] - 0.6, 0.45)
s.put("fx", cinematic.deep_hit(0.8), CUES["titleBurst"], 0.55)
for st in CUES["steps"] + CUES["phases"]:
    s.put("fx", fx("tick"), st["at"], 0.35)
s.put("fx", fx("success"), CUES["card1"], 0.4)
if SWOOSH:  # the panel sliding in, peaking mid-slide
    swoosh_at(CUES["panelOpen"] + 0.3, WH_GAIN, 8)
else:
    s.put("fx", fx("swipe"), CUES["panelOpen"], 0.6)
if not SEPARATE_TYPING:
    s.put("fx", takes[-1], CUES["fieldEdit"] + 0.5, type_gain * 0.9)
s.put("fx", fx("ding"), CUES["card2"] + 0.3, 0.6)  # "add a ding at the end"
s.put("fx", fx("click"), CUES["explainerToggle"], 0.7)
s.put("fx", fx("sparkle"), CUES["videoCard"], 0.4)
s.put("fx", fx("success"), CUES["exportDone"], 0.45)
swoosh_at(CUES["tagline"], WH_GAIN, 4)
RISE = cinematic.riser(1.6)
s.put("fx", RISE, CUES["lockup"] - 1.6, 0.5)
s.put("fx", cinematic.boom(), CUES["lockup"], 0.62)

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
    if TYPING:
        for a, b in TYPING_SPANS:  # about -2.5 dB under each message as it types
            duck = np.minimum(duck, 1 - 0.25 * np.clip(np.minimum((t - a + 0.08) / 0.08, (b + 0.15 - t) / 0.15), 0, 1))
    fade = np.clip((DUR - t) / 2.6, 0, 1) ** 1.5
    m *= (duck * fade)[:, None] * 0.55
    base = m + fxs * 0.8
    if SEPARATE_TYPING:
        # Each take sits a set amount under whatever is playing as it types.
        under_db = float(os.environ.get("TYPE_UNDER_DB", 9))
        for (a, b), take in zip(TYPING_SPANS, takes):
            i, j = int(a * SR), int(b * SR)
            bg = np.sqrt((base[i:j] ** 2).mean()) or 1e-3
            tr = np.sqrt((take ** 2).mean()) or 1e-3
            g = bg * 10 ** (-under_db / 20) / tr * (type_gain / 0.75)
            k = min(len(base) - i, len(take))
            base[i: i + k] += take[:k] * g
    for sig, peak_t, under_db in FEATURED:
        i0, j0 = int((peak_t - 0.15) * SR), int((peak_t + 0.15) * SR)
        bg = np.sqrt((base[i0:j0] ** 2).mean()) or 1e-3
        p0 = int(WH_HIT * SR)
        sr_ = np.sqrt((sig[max(0, p0 - int(0.15 * SR)): p0 + int(0.15 * SR)] ** 2).mean()) or 1e-3
        g = bg * 10 ** (-under_db / 20) / sr_
        start = int((peak_t - WH_HIT) * SR)
        a0 = max(0, start)
        k = min(len(base) - a0, len(sig) - (a0 - start))
        base[a0: a0 + k] += sig[a0 - start: a0 - start + k] * g
    mix = np.tanh(base * 1.05) / np.tanh(1.05)
    mix = mix / np.abs(mix).max() * 0.93
    out = arg("--out", os.path.join(ROOT, "out", "chat-launch-mix-licensed.wav"))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    sf.write(out, mix, SR, subtype="PCM_16")
    print("wrote", out)
else:
    out = os.path.join(ROOT, "public", "launch", "chat-launch-sfx.wav" if SFX_ONLY else "chat-launch-mix.wav")
    s.write(out, levels=(-15, -19, -7) if not SFX_ONLY else (-60, -60, -3), fade=1.8)
