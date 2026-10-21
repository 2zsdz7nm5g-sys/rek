#!/usr/bin/env python3
"""Compose the REK Proffset film score from sampled notes, phrased to the scene timeline.

Instruments: FluidR3_GM samples (CC BY 3.0, via gleitz/midi-js-soundfonts) for piano,
string ensemble and cello, plus a synthesized low drone and air texture. Each scene is
one musical phrase, so harmonic changes land on scene transitions.

usage: compose_score.py <sample_dir> <timeline.json> <out.wav>
"""
import json
import subprocess
import sys
from functools import lru_cache

import numpy as np

SR = 48000
SAMPLE_DIR, TIMELINE, OUT = sys.argv[1:4]
NOTE_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]


def midi_name(m):
    return f"{NOTE_NAMES[m % 12]}{m // 12 - 1}"


@lru_cache(maxsize=None)
def sample(inst, midi):
    path = f"{SAMPLE_DIR}/{inst}/{midi_name(midi)}.mp3"
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()


def fade(n, kind="in"):
    t = np.linspace(0, np.pi / 2, n)
    return (np.sin(t) if kind == "in" else np.cos(t))[:, None]


def sustained(inst, midi, seconds, attack=0.9, release=1.6):
    """Hold a sampled note for any length by crossfade-looping its steady section."""
    s = sample(inst, midi)
    a, b, xf = int(0.45 * SR), int(2.55 * SR), int(0.5 * SR)
    total = int(seconds * SR) + int(release * SR)
    out = np.zeros((total, 2), np.float32)

    def add(clip, pos):
        n = min(len(clip), total - pos)
        if n > 0:
            out[pos:pos + n] += clip[:n]

    head = s[:b].copy()
    head[-xf:] *= fade(xf, "out")
    add(head, 0)
    loop = s[a:b]
    pos = b - xf
    while pos < total:
        seg = loop.copy()
        seg[:xf] *= fade(xf, "in")
        seg[-xf:] *= fade(xf, "out")
        add(seg, pos)
        pos += len(loop) - xf
    env = np.ones((total, 1), np.float32)
    na = int(attack * SR)
    env[:na] = np.linspace(0, 1, na)[:, None] ** 1.6
    nr = int(release * SR)
    env[-nr:] = np.linspace(1, 0, nr)[:, None] ** 2
    return out * env


def place(buf, clip, start_s, gain=1.0, pan=0.0):
    i = int(start_s * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(clip))
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:j, 0] += clip[: j - i, 0] * gain * l * 1.414
    buf[i:j, 1] += clip[: j - i, 1] * gain * r * 1.414


tl = json.load(open(TIMELINE))
fps = tl["fps"]
total_s = tl["durationInFrames"] / fps
starts = [s["start"] / fps for s in tl["scenes"]]
ends = starts[1:] + [total_s]
ids = [s["id"] for s in tl["scenes"]]
mix = np.zeros((int((total_s + 0.5) * SR), 2), np.float32)

# D minor world: chord name -> (bass midi, upper voicing)
CH = {
    "Dm": (38, [57, 62, 65, 69]),
    "Bb": (34, [58, 62, 65, 70]),
    "F": (41, [57, 60, 65, 69]),
    "C": (36, [55, 60, 64, 67]),
    "Gm": (43, [55, 58, 62, 67]),
    "A": (45, [57, 61, 64, 69]),
    "Fadd9": (41, [60, 65, 67, 69]),
}
PHRASES = {
    "opening": ["Dm", "Bb"],
    "brand": ["F", "C", "Dm", "Bb"],
    "ppf": ["Dm", "Bb", "F", "C"],
    "ceramic": ["Gm", "Bb", "F", "C"],
    "polishing": ["Dm", "Bb", "F", "A"],
    "interior": ["Bb", "F", "Gm", "C"],
    "pdr": ["Dm", "Bb", "F", "C"],
    "windshield": ["Gm", "Bb", "C", "A"],
    "finale": ["Bb", "C", "Dm", "Fadd9"],
}
# overall intensity per scene (strings level, piano density)
INTENSITY = {"opening": 0.45, "brand": 0.6, "ppf": 0.68, "ceramic": 0.68, "polishing": 0.7,
             "interior": 0.62, "pdr": 0.7, "windshield": 0.8, "finale": 0.95}

rng = np.random.default_rng(7)
for sid, a, b in zip(ids, starts, ends):
    chords = PHRASES[sid]
    k = INTENSITY[sid]
    seg = (b - a) / len(chords)
    for ci, name in enumerate(chords):
        t0 = a + ci * seg
        dur = seg + (0.35 if not (sid == "finale" and ci == len(chords) - 1) else 0)
        if sid == "finale" and ci == len(chords) - 1:
            dur = total_s - t0 - 0.2
        bass, upper = CH[name]
        # strings pad
        for j, m in enumerate(upper):
            place(mix, sustained("string_ensemble_1", m, dur), t0, 0.16 * k, pan=-0.5 + j / 3)
        # cello bass, one octave doubling at the climax
        place(mix, sustained("cello", bass, dur, attack=1.2), t0, 0.28 * k)
        if sid in ("windshield", "finale"):
            place(mix, sustained("string_ensemble_1", bass + 12, dur), t0, 0.12 * k)
        # restrained piano: one arpeggiated note per second, sparse in the opening
        if sid == "opening":
            motif = [(1.6, 69), (3.2, 65), (4.4, 64), (6.4, 62), (8.6, 70), (10.4, 69)]
            if ci == 0:
                for dt, m in motif:
                    place(mix, sample("acoustic_grand_piano", m), a + dt, 0.42, pan=0.15)
            continue
        pattern = [upper[0] + 12, upper[2], upper[1] + 12, upper[3]] if k > 0.65 else [upper[2], upper[1] + 12, upper[3]]
        step = 1.0 if sid != "finale" else 0.75
        n = int(seg / step)
        for q in range(n):
            m = pattern[q % len(pattern)]
            vel = (0.30 + 0.08 * rng.random()) * (0.75 + 0.35 * k)
            if q == 0:
                vel *= 1.25
            place(mix, sample("acoustic_grand_piano", m), t0 + q * step, vel, pan=0.25 * np.sin(q))

# Final resolution: soft piano F major add9 chord that rings out
fin = starts[-1] + 3 * (ends[-1] - starts[-1]) / 4
for m in [53, 60, 65, 67, 69, 72]:
    place(mix, sample("acoustic_grand_piano", m), fin + 0.05, 0.32)

# Atmosphere: low D drone and soft air, synthesized
t = np.arange(len(mix)) / SR
drone = (0.008 * np.sin(2 * np.pi * 36.71 * t) + 0.005 * np.sin(2 * np.pi * 73.42 * t + 0.4)) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.05 * t))
noise = rng.standard_normal(len(mix)).astype(np.float32)
air = np.convolve(noise, np.ones(48) / 48, mode="same") - np.convolve(noise, np.ones(6) / 6, mode="same")
air *= 0.0009 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t))
mix[:, 0] += drone + air
mix[:, 1] += drone + np.roll(air, 977)

# Convolution reverb (decaying stereo noise impulse)
ir_len = int(3.2 * SR)
decay = np.exp(-np.arange(ir_len) / (0.75 * SR))
ir = rng.standard_normal((ir_len, 2)).astype(np.float32) * decay[:, None]
ir[: int(0.012 * SR)] = 0
ir /= np.sqrt((ir ** 2).sum(axis=0))
nfft = 1 << int(np.ceil(np.log2(len(mix) + ir_len)))
wet = np.stack([np.fft.irfft(np.fft.rfft(mix[:, c], nfft) * np.fft.rfft(ir[:, c], nfft), nfft)[: len(mix)] for c in range(2)], axis=1)
out = 0.62 * mix + 0.55 * wet

# Fade in from silence and out over the last 2.5 s
fi, fo = int(2.0 * SR), int(2.5 * SR)
out[:fi] *= np.linspace(0, 1, fi)[:, None]
end = int(total_s * SR)
out = out[:end]
out[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5
out /= np.max(np.abs(out)) / 0.89

subprocess.run(
    ["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
     "-af", "highpass=f=28,lowpass=f=15000", "-c:a", "pcm_s16le", OUT],
    input=out.astype(np.float32).tobytes(), check=True,
)
print(f"score: {total_s:.2f}s -> {OUT}")
