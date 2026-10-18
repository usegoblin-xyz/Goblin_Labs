"""Builds the image set for the Editorial Ad template.

Every image is public domain (CC0) from The Metropolitan Museum of Art's Open
Access collection; the numbers below are Met object IDs. Three treatments:
  cut  - subject cut out with rembg, grayscale, transparent background
  ink  - prints and drawings: paper pushed to pure white, ink to near black
         (drawn with mix-blend-mode: multiply)
  tone - grayscale photo, kept rectangular (masked in the template)
Plus the 12 gallop frames from Muybridge's Animal Locomotion, plate 631.

Needs: pip install --break-system-packages "rembg[cpu]" numpy pillow
Run:   python3 scripts/editorial-ad-assets.py   (downloads into ./.cache/met)
Writes public/editorial-ad/*.webp
"""
import io, json, os, urllib.request
import numpy as np
from PIL import Image, ImageEnhance, ImageOps

Image.MAX_IMAGE_PIXELS = None
API = "https://collectionapi.metmuseum.org/public/collection/v1/objects/"
CACHE = ".cache/met"
OUT = "public/editorial-ad"
os.makedirs(CACHE, exist_ok=True)
os.makedirs(OUT, exist_ok=True)

# name: (met id, treatment, crop as fractions x0 y0 x1 y1 or None)
ASSETS = {
    "hand-hold": (204711, "cut", None),
    "hand-bend": (204712, "cut", None),
    "fist": (204713, "cut", None),
    "hand-open": (204714, "cut", None),
    "hand-reach-r": (191861, "cut", None),
    "hand-reach-l": (191862, "cut", None),
    "hand-two": (191860, "cut", None),
    "palm": (191852, "cut", None),
    "head-athena": (248642, "cut", None),
    "head-aphrodite": (251515, "cut", None),
    "head-herakles": (252953, "cut", None),
    "head-apollo": (255057, "cut", (0, 0, 1, 0.8)),
    "rhino": (356497, "ink", (0.0, 0.13, 1, 0.97)),
    "globe": (358367, "ink", (0.04, 0.12, 0.96, 0.8)),
    "eye": (360713, "ink", (0.02, 0.08, 0.6, 0.95)),
    "wave": (45434, "ink", (0.07, 0.04, 1, 1)),
    "wave-sketch": (56186, "ink", None),
    "shell": (384116, "ink", (0.4, 0.12, 0.96, 0.75)),
    "butterfly": (384116, "ink", (0.05, 0.15, 0.36, 0.92)),
    "tulip": (337769, "ink", (0.55, 0.06, 0.97, 0.82)),
    "skeleton": (384402, "ink", (0.64, 0.04, 0.97, 0.98)),
    "egret": (830272, "ink", (0.14, 0.15, 0.85, 0.86)),
    "palm-tree": (351063, "ink", (0.02, 0.0, 0.98, 0.94)),
    "arm": (485559, "ink", (0.04, 0.16, 0.97, 0.6)),
    "hands-sketch": (355537, "ink", (0.12, 0.52, 0.95, 0.86)),
    "moon": (262301, "tone", (0.05, 0.1, 0.95, 0.85)),
}


def fetch(i, full=False):
    path = f"{CACHE}/{i}{'_full' if full else ''}.jpg"
    if not os.path.exists(path):
        o = json.load(urllib.request.urlopen(API + str(i), timeout=30))
        b = urllib.request.urlopen(o["primaryImage"], timeout=300).read()
        im = Image.open(io.BytesIO(b)).convert("RGB")
        if not full:
            im.thumbnail((3000, 3000))
        im.save(path, quality=94)
    return Image.open(path).convert("RGB")


def crop(im, c):
    if not c:
        return im
    W, H = im.size
    return im.crop((int(c[0] * W), int(c[1] * H), int(c[2] * W), int(c[3] * H)))


_session = None


def cutout(im):
    global _session
    from rembg import new_session, remove

    _session = _session or new_session("isnet-general-use")
    a = remove(im, session=_session, post_process_mask=True).getchannel("A")
    g = ImageEnhance.Contrast(ImageOps.autocontrast(ImageOps.grayscale(im), cutoff=1)).enhance(1.12)
    rgba = Image.merge("RGBA", (g, g, g, a))
    return rgba.crop(a.point(lambda v: 255 if v > 20 else 0).getbbox())


def ink(im):
    L = np.asarray(ImageOps.grayscale(im)).astype(float)
    paper, dark = np.percentile(L, 80), np.percentile(L, 1)
    a = np.clip((paper - 14 - L) / max(paper - 14 - dark, 1), 0, 1) ** 0.85
    a = np.clip((a - 0.12) / 0.88, 0, 1)  # drop paper grain
    # Stored as ink on white (no alpha) so it compresses well; the template
    # composites it with mix-blend-mode: multiply, which drops the white.
    return Image.fromarray((255 - a * 243).astype(np.uint8), "L")


def tone(im):
    return ImageOps.autocontrast(ImageOps.grayscale(im), cutoff=0.5).convert("RGB")


def save(im, name, size=1100):
    im.thumbnail((size, size), Image.LANCZOS)
    im.save(f"{OUT}/{name}.webp", quality=76, method=6)
    print(name, im.size)


for name, (i, kind, c) in ASSETS.items():
    im = crop(fetch(i), c)
    im.thumbnail((2000, 2000))
    save({"cut": cutout, "ink": ink, "tone": tone}[kind](im), name)

# Muybridge, Animal Locomotion plate 631: a gallop in 12 frames, right to left.
plate = fetch(266441, full=True)
k = plate.size[0] / 1400
xs = [45, 262, 482, 700, 920, 1138, 1352]
for r, (y0, y1) in enumerate([(128, 293), (308, 470)]):
    for col in range(6):
        n = r * 6 + (5 - col)
        cell = plate.crop((int((xs[col] + 4) * k), int((y0 + 3) * k), int((xs[col + 1] - 4) * k), int((y1 - 4) * k)))
        from rembg import new_session, remove

        _session = _session or new_session("isnet-general-use")
        a = remove(cell, session=_session, post_process_mask=True).getchannel("A")
        g = ImageOps.autocontrast(ImageOps.grayscale(cell), cutoff=1)
        save(Image.merge("RGBA", (g, g, g, a)), f"horse-{n:02d}", 640)
