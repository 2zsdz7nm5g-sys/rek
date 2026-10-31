"""
REK Proffset – procedural score + sound effects, frame-synced to the Remotion timeline.
Outputs (48 kHz, 24-bit stereo WAV):
  public/audio/music.wav   – cinematic score (D minor)
  public/audio/sfx.wav     – all sound effects on one stem
Run:  python3 audio/sound_design.py
"""
import numpy as np
from scipy import signal
from scipy.io import wavfile
import os

SR = 48000
DUR = 40.0
N = int(SR * DUR)
FPS = 30
rng = np.random.default_rng(7)
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'audio')
os.makedirs(OUT, exist_ok=True)


def t_axis(n):
    return np.arange(n) / SR


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lp(x, fc, order=2):
    sos = signal.butter(order, min(fc, SR / 2 - 100), 'low', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=0)


def hp(x, fc, order=2):
    sos = signal.butter(order, fc, 'high', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=0)


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, min(hi, SR / 2 - 100)], 'band', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=0)


def env_adsr(n, a, d, s, r):
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = min(na, n)
    e[:na] = np.linspace(0, 1, na)
    e[na:na + nd] = np.linspace(1, s, len(e[na:na + nd]))
    if nr > 0:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def stereo(x, width=0.0, pan=0.0):
    """mono -> stereo with optional Haas widening and pan (-1..1)"""
    l = x * np.sqrt(0.5 * (1 - pan))
    r = x * np.sqrt(0.5 * (1 + pan))
    if width > 0:
        d = int(width * 0.012 * SR)
        r = np.concatenate([np.zeros(d), r[:-d]]) if d > 0 else r
    return np.stack([l, r], axis=1) * np.sqrt(2)


def place(buf, clip, t0, gain=1.0):
    i0 = int(t0 * SR)
    if i0 >= len(buf):
        return
    if i0 < 0:
        clip = clip[-i0:]
        i0 = 0
    n = min(len(clip), len(buf) - i0)
    if clip.ndim == 1:
        clip = stereo(clip)
    buf[i0:i0 + n] += clip[:n] * gain


def reverb(x, seconds=3.2, damp=6000, mix=0.35, seed=1):
    r = np.random.default_rng(seed)
    n = int(seconds * SR)
    tt = t_axis(n)
    irs = []
    for ch in range(2):
        ir = r.standard_normal(n) * np.exp(-tt * (6.9 / seconds))
        ir = lp(ir, damp)
        ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
        irs.append(ir / np.sqrt(np.sum(ir ** 2)))
    if x.ndim == 1:
        x = stereo(x)
    wet = np.stack([signal.fftconvolve(x[:, c], irs[c])[: len(x)] for c in range(2)], axis=1)
    return x * (1 - mix) + wet * mix * 1.6


def saw(freq, n, phase=0.0):
    tt = t_axis(n)
    return 2 * ((freq * tt + phase) % 1.0) - 1


def tri(freq, n):
    return 2 * np.abs(saw(freq, n)) - 1


def noise(n):
    return rng.standard_normal(n)


# ----------------------------------------------------------------- MUSIC
music = np.zeros((N, 2))

CHORDS = [  # (start, end, midi notes)
    (0.0, 5.0, [38, 45, 50, 53, 57, 64]),          # Dm9  (tension)
    (5.0, 9.0, [38, 50, 53, 57, 60, 64]),          # Dm9
    (9.0, 12.5, [46, 50, 53, 57, 60]),             # Bbmaj9
    (12.5, 16.5, [43, 50, 53, 57, 58, 62]),        # Gm9
    (16.5, 20.0, [45, 50, 52, 57, 64]),            # Asus4
    (20.0, 25.0, [38, 50, 53, 57, 60, 64]),        # Dm9
    (25.0, 30.0, [46, 50, 53, 57, 62, 65]),        # Bbmaj7/add
    (30.0, 35.6, [43, 50, 55, 58, 62, 69]),        # Gm(add9) swell
    (35.6, 40.0, [38, 45, 50, 52, 57, 62, 64]),    # D (add9) resolve
]


def pad_chord(notes, n, bright=900.0):
    out = np.zeros(n)
    for m in notes:
        f = mtof(m)
        for k, det in enumerate([-0.11, 0.0, 0.12]):
            out += saw(f * 2 ** (det / 12), n, phase=rng.random()) * (0.6 if k == 1 else 0.45)
    out /= len(notes) * 1.6
    return lp(out, bright, 2)


for (a, b, notes) in CHORDS:
    xf = 0.6
    n = int((b - a + xf) * SR)
    bright = 650 if a < 5 else (1100 if a < 30 else 1700)
    p = pad_chord(notes, n, bright)
    e = env_adsr(n, 0.9 if a > 0 else 2.5, 0.5, 1.0, xf + 0.4)
    # slow breathing tremolo
    p *= e * (0.85 + 0.15 * np.sin(2 * np.pi * 0.18 * t_axis(n) + a))
    place(music, stereo(p, width=0.8), a - (0.3 if a > 0 else 0), 0.55)

# sub bass on chord roots (+octave harmonic so phones reproduce it)
for (a, b, notes) in CHORDS:
    n = int((b - a) * SR)
    f = mtof(notes[0] - 12) if notes[0] >= 43 else mtof(notes[0])
    tt = t_axis(n)
    x = np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * 2 * f * tt)
    x *= env_adsr(n, 0.25, 0.3, 0.8, 0.35)
    place(music, x, a, 0.22 if a < 5 else 0.3)

# tension heartbeat during slow-motion (2.9 – 4.6 s)
for t0 in [2.95, 3.85]:
    for k, dt in enumerate([0.0, 0.24]):
        n = int(0.35 * SR)
        tt = t_axis(n)
        f = 55 * np.exp(-tt * 3)
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 14)
        place(music, x, t0 + dt, 0.55 if k == 0 else 0.35)

# riser into the first impact (3.0 – 4.95 s), then sudden silence (dramatic pause)
n = int(1.95 * SR)
tt = t_axis(n)
rs = noise(n)
rs = np.concatenate([bp(rs[i:i + 4800], 300 + 6000 * (i / n) ** 2, 900 + 9000 * (i / n) ** 2) for i in range(0, n, 4800)])[:n]
rs *= (tt / tt[-1]) ** 2.2
tone = np.sin(2 * np.pi * np.cumsum(110 + 330 * (tt / tt[-1]) ** 2) / SR) * (tt / tt[-1]) ** 2 * 0.25
place(music, stereo(rs * 0.18 + tone, width=0.6), 3.0, 0.8)
music[int(4.95 * SR):int(5.0 * SR)] *= np.linspace(1, 0.05, int(0.05 * SR))[:, None]


def impact(dur=3.0, f0=90, f1=32, bright=0.6):
    n = int(dur * SR)
    tt = t_axis(n)
    f = f1 + (f0 - f1) * np.exp(-tt * 9)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 1.6)
    crash = hp(noise(n), 2500) * np.exp(-tt * 3.0) * bright * 0.5
    click = noise(n) * np.exp(-tt * 120) * 0.4
    return reverb(boom * 0.9 + crash + click, 3.5, 7000, 0.4, 3)


place(music, impact(3.0), 5.0, 0.85)

# electronic pulse arp (S3 → S4), 100 BPM 16ths
BPM = 100
step = 60 / BPM / 4
for (a, b, notes) in CHORDS:
    if a < 12.5 or a >= 30:
        continue
    tones = [m + 12 for m in notes[1:]]
    t0 = a
    i = 0
    while t0 < b - 0.01:
        n = int(0.22 * SR)
        tt = t_axis(n)
        m = tones[(i * 3) % len(tones)] + (12 if i % 8 == 6 else 0)
        x = (saw(mtof(m), n) * 0.5 + tri(mtof(m) * 2, n) * 0.3) * np.exp(-tt * 22)
        x = lp(x, 2400)
        lvl = 0.05 + 0.05 * min(1, (t0 - 12.5) / 12)
        pan = 0.5 * np.sin(i * 0.9)
        place(music, stereo(x, pan=pan), t0, lvl)
        t0 += step
        i += 1

# soft kick + hats during the installation (20 – 29.6 s)
beat = 60 / BPM
t0 = 20.0
k = 0
while t0 < 29.6:
    n = int(0.45 * SR)
    tt = t_axis(n)
    f = 45 + 95 * np.exp(-tt * 28)
    kick = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 7)
    place(music, kick, t0, 0.32)
    nh = int(0.05 * SR)
    hat = hp(noise(nh), 7000) * np.exp(-t_axis(nh) * 90)
    place(music, stereo(hat, pan=0.3), t0 + beat / 2, 0.05)
    t0 += beat
    k += 1

# swell + reverse cymbal into the logo hit (33.6 – 35.6 s)
n = int(2.0 * SR)
tt = t_axis(n)
rev = (hp(noise(n), 3000) * np.exp(-tt[::-1] * 2.2))
place(music, stereo(rev, width=0.7), 33.6, 0.22)
place(music, impact(4.4, 110, 30, 0.9), 35.6, 1.0)
# shimmer on the resolve
n = int(4.4 * SR)
tt = t_axis(n)
sh = sum(np.sin(2 * np.pi * mtof(m) * tt + rng.random() * 6) for m in [81, 86, 88, 93]) * np.exp(-tt * 0.9) * 0.05
place(music, reverb(sh, 3.0, 9000, 0.6, 5), 35.62, 1.0)

music = reverb(music, 2.6, 5000, 0.22, 9)
# fade out tail
music[-int(1.2 * SR):] *= np.linspace(1, 0, int(1.2 * SR))[:, None] ** 1.5

# ----------------------------------------------------------------- SFX
sfx = np.zeros((N, 2))


def speed_at(f):
    pts = [(0, 1), (38, 1), (88, 0.1), (122, 0.03), (150, 0.012)]
    for (f0, v0), (f1, v1) in zip(pts, pts[1:]):
        if f <= f1:
            u = (f - f0) / (f1 - f0)
            u = u * u * (3 - 2 * u)
            return v0 + (v1 - v0) * u
    return pts[-1][1]


# road / wind rumble that slows down with the slow-motion
n = int(5.0 * SR)
tt = t_axis(n)
spd = np.array([speed_at(x * FPS) for x in tt])
rum = noise(n)
chunks = []
for i in range(0, n, 2400):
    s = spd[i]
    chunks.append(bp(rum[i:i + 2400], 40 + 60 * s, 250 + 1800 * s, 1))
rum = np.concatenate(chunks)[:n] * (0.25 + 0.75 * spd) * env_adsr(n, 0.3, 0.1, 1, 0.3)
place(sfx, stereo(rum, width=0.9), 0.0, 0.5)

# stone kicked up (tick) + pass-by whoosh, slowed
n = int(0.08 * SR)
place(sfx, stereo(bp(noise(n), 1800, 6000) * np.exp(-t_axis(n) * 60), pan=0.4), 1.2, 0.5)
n = int(2.6 * SR)
tt = t_axis(n)
wh = noise(n)
wh = np.concatenate([bp(wh[i:i + 2400], 150 + 800 * np.exp(-i / n * 3), 700 + 2500 * np.exp(-i / n * 3)) for i in range(0, n, 2400)])[:n]
wh *= np.sin(np.pi * np.clip(tt / tt[-1], 0, 1)) ** 2
place(sfx, stereo(wh, width=0.5, pan=-0.2), 1.35, 0.35)
# low "time-stretch" drone during the slow-mo
n = int(2.2 * SR)
tt = t_axis(n)
dr = np.sin(2 * np.pi * 48 * tt + 3 * np.sin(2 * np.pi * 0.7 * tt)) * env_adsr(n, 0.8, 0.2, 1, 0.3)
place(sfx, dr, 2.75, 0.3)
# subtle glass "tink" right at the cut + flash whoosh
n = int(1.6 * SR)
tt = t_axis(n)
tink = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, d in [(3150, 9), (4720, 12), (6390, 16), (2210, 7)]) * 0.25
place(sfx, reverb(tink, 1.6, 9000, 0.35, 11), 4.98, 0.5)


def whoosh(dur=0.9, lo=300, hi=5000, rev=False):
    n = int(dur * SR)
    tt = t_axis(n)
    x = noise(n)
    out = np.concatenate([bp(x[i:i + 1200], lo + (hi - lo) * (i / n) * 0.3, lo * 2 + (hi - lo) * (i / n)) for i in range(0, n, 1200)])[:n]
    e = np.sin(np.pi * tt / tt[-1]) ** 3
    out *= e
    if rev:
        out = out[::-1]
    return stereo(out, width=0.8)


for t0, g in [(4.85, 0.35), (6.7, 0.22), (9.45, 0.25), (11.85, 0.3), (15.45, 0.3), (19.85, 0.3), (22.1, 0.15), (29.85, 0.3)]:
    place(sfx, whoosh(0.9), t0, g)


def gel_wobble(dur=0.9, f=95, rate=9.0):
    n = int(dur * SR)
    tt = t_axis(n)
    x = np.sin(2 * np.pi * f * tt + 2.5 * np.sin(2 * np.pi * rate * tt)) * np.exp(-tt * 4.5)
    sq = lp(noise(n), 900) * np.exp(-tt * 9) * (0.5 + 0.5 * np.sin(2 * np.pi * rate * tt))
    return x * 0.7 + sq * 0.6


# gel settle after reveal, gel press + release (S2)
place(sfx, gel_wobble(1.0, 80, 7), 5.15, 0.4)
n = int(0.55 * SR)
tt = t_axis(n)
press = lp(noise(n), 600) * np.sin(np.pi * tt / tt[-1]) * 0.6 + np.sin(2 * np.pi * (140 - 70 * tt / tt[-1]) * tt) * np.sin(np.pi * tt / tt[-1]) * 0.4
place(sfx, press, (150 + 158) / FPS, 0.45)
place(sfx, gel_wobble(1.1, 120, 11), (150 + 190) / FPS, 0.5)
# measurement ticks while the 6.0 mm counter runs
for k in range(13):
    tk = (150 + 92) / FPS + k * (26 / FPS) / 13
    n = int(0.03 * SR)
    place(sfx, stereo(np.sin(2 * np.pi * 2600 * t_axis(n)) * np.exp(-t_axis(n) * 160), pan=0.3), tk, 0.12)
n = int(0.6 * SR)
tt = t_axis(n)
place(sfx, reverb(np.sin(2 * np.pi * 1320 * tt) * np.exp(-tt * 8) + np.sin(2 * np.pi * 1980 * tt) * np.exp(-tt * 10) * 0.5, 1.2, 9000, 0.3, 13), (150 + 118) / FPS, 0.22)

# S3: layers lock together, crack vs. gel absorb
n = int(0.25 * SR)
tt = t_axis(n)
clk = bp(noise(n), 1500, 7000) * np.exp(-tt * 50) + np.sin(2 * np.pi * 180 * tt) * np.exp(-tt * 30) * 0.6
place(sfx, clk, (360 + 76) / FPS, 0.35)
hit_t = (360 + 150) / FPS
n = int(1.4 * SR)
tt = t_axis(n)
crack = np.zeros(n)
for k in range(28):  # crackle: many tiny ticks spreading out
    i0 = int((k / 28) ** 1.6 * 0.5 * SR)
    m = int(0.012 * SR)
    crack[i0:i0 + m] += hp(noise(m), 2500) * (1 - k / 32)
crack = crack + sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, d in [(2800, 14), (4100, 18), (5600, 22)]) * 0.2
place(sfx, reverb(crack, 1.2, 9000, 0.25, 17), hit_t, 0.38)
n = int(0.6 * SR)
tt = t_axis(n)
thud = np.sin(2 * np.pi * (110 * np.exp(-tt * 6) + 50) * tt) * np.exp(-tt * 10) + lp(noise(n), 500) * np.exp(-tt * 25) * 0.4
place(sfx, thud, hit_t + 0.01, 0.5)
n = int(1.6 * SR)
tt = t_axis(n)
shim = sum(np.sin(2 * np.pi * f * tt * (1 + 0.15 * tt)) for f in [880, 1320, 1760]) * np.exp(-tt * 2.2) * 0.08
place(sfx, reverb(shim, 2.0, 9000, 0.5, 19), hit_t + 0.05, 0.6)

# S4 installation foley
s4 = 600 / FPS
# spray bottle (2 pumps)
for k in range(2):
    n = int(0.32 * SR)
    tt = t_axis(n)
    psst = bp(noise(n), 2500, 11000) * np.exp(-tt * 9) * np.minimum(1, tt * 60)
    place(sfx, stereo(psst, pan=0.45), s4 + 0.05 + k * 0.4, 0.3)
# microfibre wiping strokes (follow the cloth's 2.5 back-and-forth cycles)
for k in range(5):
    n = int(0.36 * SR)
    tt = t_axis(n)
    wipe = bp(noise(n), 900, 4500) * np.sin(np.pi * tt / tt[-1]) ** 2
    place(sfx, stereo(wipe, pan=0.3 * (-1) ** k), s4 + 0.25 + k * 0.345, 0.2)
# sheet lowering (soft air) + settle
place(sfx, stereo(lp(noise(int(1.3 * SR)), 1200) * np.sin(np.pi * np.linspace(0, 1, int(1.3 * SR))) ** 2), s4 + 62 / FPS, 0.18)
place(sfx, gel_wobble(0.6, 90, 10), s4 + 104 / FPS, 0.35)
# squeegee strokes – rubbery swish with a tiny squeak
for k in range(6):
    n = int(0.33 * SR)
    tt = t_axis(n)
    sw = bp(noise(n), 500, 3500) * np.sin(np.pi * tt / tt[-1]) ** 1.5
    sq = np.sin(2 * np.pi * (1400 + 500 * tt / tt[-1]) * tt) * np.exp(-((tt - 0.2) ** 2) / 0.002) * 0.15
    place(sfx, stereo(sw + sq, pan=0.35 * (1 if k % 2 == 0 else -1)), s4 + (122 + k * 10.5) / FPS, 0.3)
# edge card pass + droplets
n = int(1.3 * SR)
tt = t_axis(n)
place(sfx, stereo(bp(noise(n), 700, 4000) * np.sin(np.pi * tt / tt[-1]) ** 2, width=0.5), s4 + 192 / FPS, 0.18)
for k in range(9):
    n = int(0.12 * SR)
    tt = t_axis(n)
    drop = np.sin(2 * np.pi * (900 + 600 * rng.random()) * tt * (1 + 3 * tt)) * np.exp(-tt * 45)
    place(sfx, stereo(drop, pan=rng.uniform(-0.5, 0.5)), s4 + (196 + k * 4.2) / FPS, 0.1)
# inspection lamp hum + check chime
n = int(1.7 * SR)
tt = t_axis(n)
hum = (np.sin(2 * np.pi * 120 * tt) * 0.4 + np.sin(2 * np.pi * 240 * tt) * 0.2 + hp(noise(n), 6000) * 0.05) * np.sin(np.pi * tt / tt[-1])
place(sfx, hum, s4 + 246 / FPS, 0.12)
n = int(1.4 * SR)
tt = t_axis(n)
chime = (np.sin(2 * np.pi * 1568 * tt) + 0.6 * np.sin(2 * np.pi * 2349 * tt)) * np.exp(-tt * 4)
place(sfx, reverb(chime, 1.6, 9000, 0.4, 23), s4 + 280 / FPS, 0.2)

# S5: light sweep shimmer + headlight ignition
s5 = 900 / FPS
n = int(2.4 * SR)
tt = t_axis(n)
sweep = hp(noise(n), 5000) * np.sin(np.pi * tt / tt[-1]) ** 2 * 0.4
place(sfx, stereo(sweep, width=1.0), s5 + 0.2, 0.18)
n = int(1.6 * SR)
tt = t_axis(n)
ign = np.sin(2 * np.pi * 60 * tt) * np.exp(-tt * 12) * 0.8 + np.sin(2 * np.pi * np.cumsum(200 + 600 * (1 - np.exp(-tt * 3))) / SR) * (1 - np.exp(-tt * 6)) * np.exp(-tt * 1.8) * 0.18
place(sfx, reverb(ign, 1.5, 7000, 0.3, 29), s5 + 58 / FPS, 0.42)


def write(path, x, peak=0.89):
    x = x / max(1e-9, np.max(np.abs(x))) * peak
    wavfile.write(path, SR, (x * 32767).astype(np.int16))


write(os.path.join(OUT, 'music.wav'), music)
write(os.path.join(OUT, 'sfx.wav'), sfx)
print('wrote music.wav + sfx.wav')
