"""
Deep-space backdrop for the FlexiShield 3D stage ([rek_fs3d]).

Writes wp-theme/rek-proffset/assets/fs3d/space.webp (landscape, desktop) and
space-m.webp (portrait, phones): a dark navy field, a faint blue/cyan nebula
drifting diagonally behind the product, a soft glow at the centre where the
product stands, and sparse, mostly faint stars (fewer near the centre so the
product stays the focus). Deterministic: the same seed gives the same images.

    python3 tools/fs3d-space/build.py
"""
import os

import numpy as np
from PIL import Image, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'wp-theme', 'rek-proffset', 'assets', 'fs3d')

BG = np.array([5, 11, 18], float) / 255         # --rek-bg #050B12
NAVY = np.array([11, 29, 48], float) / 255      # --rek-navy
PREMIUM = np.array([18, 63, 105], float) / 255  # --rek-premium
ACCENT = np.array([22, 137, 216], float) / 255  # --rek-accent
CYAN = np.array([91, 184, 242], float) / 255    # --rek-accent-light


def blur(a, radius):
    img = Image.fromarray(np.clip(a * 65535 / max(a.max(), 1e-9), 0, 65535).astype(np.uint16).astype(np.int32), 'I')
    out = np.asarray(img.convert('F').filter(ImageFilter.GaussianBlur(radius)), float)
    return out / 65535 * max(a.max(), 1e-9)


def fractal(rng, w, h, base, octaves=6):
    """Smooth value noise: random grids upscaled bicubically, summed over octaves."""
    acc = np.zeros((h, w))
    amp, total = 1.0, 0.0
    for o in range(octaves):
        cell = max(2, int(base / 2 ** o))
        gw, gh = w // cell + 3, h // cell + 3
        g = rng.random((gh, gw)).astype(np.float32)
        layer = np.asarray(Image.fromarray(g, 'F').resize((gw * cell, gh * cell), Image.BICUBIC), float)[:h, :w]
        acc += layer * amp
        total += amp
        amp *= 0.52
    return acc / total


def warp(a, dx, dy):
    """Sample a at (x + dx, y + dy) with bilinear interpolation (domain warping makes wisps, not blobs)."""
    h, w = a.shape
    y, x = np.mgrid[0:h, 0:w].astype(float)
    xs, ys = np.clip(x + dx, 0, w - 1.001), np.clip(y + dy, 0, h - 1.001)
    x0, y0 = xs.astype(int), ys.astype(int)
    fx, fy = xs - x0, ys - y0
    return (a[y0, x0] * (1 - fx) * (1 - fy) + a[y0, x0 + 1] * fx * (1 - fy)
            + a[y0 + 1, x0] * (1 - fx) * fy + a[y0 + 1, x0 + 1] * fx * fy)


def smoothstep(e0, e1, v):
    t = np.clip((v - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def build(w, h, seed, name, quality, out=OUT):
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:h, 0:w].astype(float)
    nx, ny = (x - w / 2) / (w / 2), (y - h / 2) / (h / 2)  # -1..1
    aspect = w / h

    # Base: deep navy that lifts very slightly toward the centre.
    r = np.sqrt((nx * min(aspect, 1.6)) ** 2 + ny ** 2)
    lift = np.exp(-(r / 1.15) ** 2)
    img = BG[None, None, :] + (NAVY - BG)[None, None, :] * (0.55 * lift)[..., None]

    # Nebula: soft diagonal wisps (upper left to lower right), from domain-warped fractal noise.
    m = min(w, h)
    n1 = fractal(rng, w, h, base=m * 0.5)
    wx, wy = fractal(rng, w, h, base=m * 0.35, octaves=4), fractal(rng, w, h, base=m * 0.35, octaves=4)
    along = np.array([0.8, 0.6]) if aspect > 1 else np.array([0.45, 0.89])  # stretch along the band
    k = m * 0.32
    n1 = warp(n1, (wx - 0.5) * k * along[0] * 2.2, (wy - 0.5) * k * along[1] * 2.2)
    n2 = warp(fractal(rng, w, h, base=m * 0.16), (wx - 0.5) * k * 1.6, (wy - 0.5) * k * 1.6)
    d = (nx * 0.6 - ny * 0.8) if aspect > 1 else (nx * 0.9 - ny * 0.42)  # distance across the band
    band = np.exp(-((d - 0.05) / 0.55) ** 2)
    cloud = smoothstep(0.30, 0.88, n1) * band
    wisps = smoothstep(0.52, 0.85, n2) * cloud
    img += PREMIUM[None, None, :] * (0.30 * cloud)[..., None]
    img += ACCENT[None, None, :] * (0.04 * cloud + 0.06 * wisps)[..., None]
    img += CYAN[None, None, :] * (0.025 * wisps)[..., None]

    # Cool atmospheric glow where the product stands (centre).
    glow = np.exp(-((nx * min(aspect, 1.4) / 0.42) ** 2 + (ny / 0.62) ** 2))
    img += ACCENT[None, None, :] * (0.075 * glow)[..., None]
    img += CYAN[None, None, :] * (0.02 * glow ** 3)[..., None]

    # Gentle vignette.
    img *= (1 - 0.45 * smoothstep(0.55, 1.6, r))[..., None]

    # Stars: sparse, mostly faint, fewer near the centre.
    count = int(w * h / 4200)
    sx, sy = rng.random(count) * w, rng.random(count) * h
    cx, cy = (sx - w / 2) / (w / 2), (sy - h / 2) / (h / 2)
    keep = rng.random(count) < np.clip(0.25 + 0.75 * (np.sqrt((cx * min(aspect, 1.4)) ** 2 + cy ** 2) / 0.9), 0.25, 1)
    sx, sy = sx[keep], sy[keep]
    mag = rng.pareto(2.6, len(sx)) * 0.16 + 0.10  # power law: many faint, few bright
    mag = np.clip(mag, 0, 1.0)
    temp = rng.random(len(sx))
    tint = np.where(temp[:, None] < 0.55, [[0.82, 0.90, 1.0]], np.where(temp[:, None] < 0.85, [[1.0, 1.0, 1.0]], [[1.0, 0.93, 0.84]]))
    stars = np.zeros((h, w, 3))
    for X, Y, m, t in zip(sx, sy, mag, tint):
        sigma = 0.55 + 0.5 * m
        rad = int(np.ceil(sigma * 3 + (6 if m > 0.6 else 0)))
        x0, x1, y0, y1 = max(0, int(X) - rad), min(w, int(X) + rad + 1), max(0, int(Y) - rad), min(h, int(Y) + rad + 1)
        gx, gy = np.meshgrid(np.arange(x0, x1) + 0.5 - X, np.arange(y0, y1) + 0.5 - Y)
        rr = gx ** 2 + gy ** 2
        core = m * np.exp(-rr / (2 * sigma ** 2))
        if m > 0.6:  # the few brightest get a faint, soft halo
            core += 0.06 * m * np.exp(-rr / (2 * 3.2 ** 2))
        stars[y0:y1, x0:x1] += core[..., None] * t[None, None, :]
    img += stars * 0.85

    # Dither before quantising so the smooth gradients never band.
    img = img * 255 + rng.normal(0, 0.9, img.shape[:2])[..., None]  # fine monochrome grain
    Image.fromarray(np.clip(np.round(img), 0, 255).astype(np.uint8), 'RGB').save(os.path.join(out, name), 'WEBP', quality=quality, method=6)
    print(name, w, 'x', h, os.path.getsize(os.path.join(out, name)) // 1024, 'KB', len(sx), 'stars')


if __name__ == '__main__':
    build(2400, 1350, 11, 'space.webp', 92)
    build(1080, 1920, 12, 'space-m.webp', 92)
