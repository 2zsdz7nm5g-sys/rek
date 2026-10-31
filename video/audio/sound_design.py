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


# ----------------------------------------------------------------- TIMELINE (seconds)
S2, S3, S4, S5 = 180 / FPS, 390 / FPS, 600 / FPS, 870 / FPS
HIT_BEFORE = (390 + 112) / FPS          # unprotected impact (S3)
HIT_BEFORE_X = (390 + 178) / FPS        # unprotected cross-section crack (S3)
HIT_AFTER = (600 + 84) / FPS            # protected impact, same shot (S4a)
HIT_SECTION = (600 + 150) / FPS         # cross-section impact (S4b)
HIT_SPLIT = (600 + 240) / FPS           # split-screen simultaneous impact (S4c)
LOGO = (870 + 228) / FPS                # logo reveal
K1 = 186 / 156                          # scene-1 time stretch

# ----------------------------------------------------------------- MUSIC
music = np.zeros((N, 2))
CHORDS = [  # (start, end, midi notes, brightness)
    (0.0, 6.0, [38, 45, 50, 53, 57, 64], 600),          # Dm9 – tension
    (6.0, 9.6, [38, 50, 53, 57, 60, 64], 1000),         # Dm9 – the solution
    (9.6, 13.0, [46, 50, 53, 57, 60], 1100),            # Bbmaj9
    (13.0, 17.0, [43, 50, 53, 57, 58, 62], 700),        # Gm9 – before (dark)
    (17.0, 20.0, [45, 50, 52, 57, 63], 650),            # A sus + b9 colour
    (20.0, 23.0, [38, 50, 53, 57, 60, 64], 1500),       # Dm9 – after
    (23.0, 26.0, [46, 50, 53, 57, 62, 65], 1700),       # Bbmaj7
    (26.0, 29.0, [43, 50, 55, 58, 62, 69], 1900),       # Gm(add9) – comparison peak
    (29.0, 32.8, [46, 50, 53, 57, 60, 65], 1400),       # Bbmaj9 – benefits
    (32.8, LOGO, [43, 50, 55, 58, 62, 67], 1600),       # Gm9 – lift
    (LOGO, 40.0, [38, 45, 50, 52, 57, 62, 64], 1800),   # D(add9) resolve
]


def pad_chord(notes, n, bright=900.0):
    out = np.zeros(n)
    for m in notes:
        f = mtof(m)
        for k, det in enumerate([-0.11, 0.0, 0.12]):
            out += saw(f * 2 ** (det / 12), n, phase=rng.random()) * (0.6 if k == 1 else 0.45)
    out /= len(notes) * 1.6
    return lp(out, bright, 2)


for (a, b, notes, bright) in CHORDS:
    xf = 0.6
    n = int((b - a + xf) * SR)
    p = pad_chord(notes, n, bright)
    e = env_adsr(n, 0.9 if a > 0 else 2.5, 0.5, 1.0, xf + 0.4)
    p *= e * (0.85 + 0.15 * np.sin(2 * np.pi * 0.18 * t_axis(n) + a))
    lvl = 0.5 if a < 20 else (0.62 if a < 29 else 0.55)
    place(music, stereo(p, width=0.8), a - (0.3 if a > 0 else 0), lvl)

for (a, b, notes, _) in CHORDS:
    n = int((b - a) * SR)
    f = mtof(notes[0] - 12) if notes[0] >= 43 else mtof(notes[0])
    tt = t_axis(n)
    x = np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * 2 * f * tt)
    x *= env_adsr(n, 0.25, 0.3, 0.8, 0.35)
    place(music, x, a, 0.2 if a < 20 else 0.3)


def heartbeat(t0, gain=0.5):
    for k, dt in enumerate([0.0, 0.24]):
        n = int(0.35 * SR)
        tt = t_axis(n)
        f = 55 * np.exp(-tt * 3)
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 14)
        place(music, x, t0 + dt, gain if k == 0 else gain * 0.65)


def riser(t0, dur, gain=0.8):
    n = int(dur * SR)
    tt = t_axis(n)
    rs = noise(n)
    rs = np.concatenate([bp(rs[i:i + 4800], 300 + 6000 * (i / n) ** 2, 900 + 9000 * (i / n) ** 2) for i in range(0, n, 4800)])[:n]
    rs *= (tt / tt[-1]) ** 2.2
    tone = np.sin(2 * np.pi * np.cumsum(110 + 330 * (tt / tt[-1]) ** 2) / SR) * (tt / tt[-1]) ** 2 * 0.25
    place(music, stereo(rs * 0.18 + tone, width=0.6), t0, gain)


def impact(dur=3.0, f0=90, f1=32, bright=0.6):
    n = int(dur * SR)
    tt = t_axis(n)
    f = f1 + (f0 - f1) * np.exp(-tt * 9)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 1.6)
    crash = hp(noise(n), 2500) * np.exp(-tt * 3.0) * bright * 0.5
    click = noise(n) * np.exp(-tt * 120) * 0.4
    return reverb(boom * 0.9 + crash + click, 3.5, 7000, 0.4, 3)


def duck_gap(t0, t1):
    """momentary silence – the dramatic pause before an impact"""
    i0, i1 = int(t0 * SR), int(t1 * SR)
    ramp = np.linspace(1, 0.06, i1 - i0)[:, None]
    music[i0:i1] *= ramp


# S1 tension → pause → hit into the product reveal
heartbeat(2.95 * K1)
heartbeat(3.85 * K1)
riser(3.6 * K1, 5.95 - 3.6 * K1)
duck_gap(5.9, 6.0)
place(music, impact(3.0), 6.0, 0.8)

# S3 before: heartbeat tension, pause, heavy hit at the chip
heartbeat(HIT_BEFORE - 1.9, 0.5)
heartbeat(HIT_BEFORE - 1.0, 0.55)
riser(HIT_BEFORE - 2.0, 1.92, 0.6)
duck_gap(HIT_BEFORE - 0.12, HIT_BEFORE)
place(music, impact(2.6, 85, 30, 0.35), HIT_BEFORE, 0.75)

# pulse arp (S2 → S5), 100 BPM 16ths, rising in the comparison
BPM = 100
step = 60 / BPM / 4
for (a, b, notes, _) in CHORDS:
    if a < 9.6 or a >= LOGO:
        continue
    tones = [m + 12 for m in notes[1:]]
    t0, i = a, 0
    while t0 < b - 0.01:
        n = int(0.22 * SR)
        tt = t_axis(n)
        m = tones[(i * 3) % len(tones)] + (12 if i % 8 == 6 else 0)
        x = (saw(mtof(m), n) * 0.5 + tri(mtof(m) * 2, n) * 0.3) * np.exp(-tt * 22)
        x = lp(x, 2400)
        lvl = 0.035 if a < 20 else (0.075 if a < 29 else 0.05)
        place(music, stereo(x, pan=0.5 * np.sin(i * 0.9)), t0, lvl)
        t0 += step
        i += 1

# kick + hats drive the AFTER comparison (20 – 29 s)
beat = 60 / BPM
t0 = 20.0
while t0 < 28.9:
    n = int(0.45 * SR)
    tt = t_axis(n)
    f = 45 + 95 * np.exp(-tt * 28)
    kick = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 7)
    place(music, kick, t0, 0.34)
    nh = int(0.05 * SR)
    place(music, stereo(hp(noise(nh), 7000) * np.exp(-t_axis(nh) * 90), pan=0.3), t0 + beat / 2, 0.05)
    t0 += beat

# swell + reverse cymbal into the logo, then the resolve shimmer
n = int(2.0 * SR)
tt = t_axis(n)
place(music, stereo(hp(noise(n), 3000) * np.exp(-tt[::-1] * 2.2), width=0.7), LOGO - 2.0, 0.22)
place(music, impact(3.4, 110, 30, 0.9), LOGO, 1.0)
n = int(3.4 * SR)
tt = t_axis(n)
sh = sum(np.sin(2 * np.pi * mtof(m) * tt + rng.random() * 6) for m in [81, 86, 88, 93]) * np.exp(-tt * 0.9) * 0.05
place(music, reverb(sh, 3.0, 9000, 0.6, 5), LOGO + 0.02, 1.0)

music = reverb(music, 2.6, 5000, 0.22, 9)
music[-int(1.0 * SR):] *= np.linspace(1, 0, int(1.0 * SR))[:, None] ** 1.5

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


def whoosh(dur=0.9, lo=300, hi=5000):
    n = int(dur * SR)
    tt = t_axis(n)
    x = noise(n)
    out = np.concatenate([bp(x[i:i + 1200], lo + (hi - lo) * (i / n) * 0.3, lo * 2 + (hi - lo) * (i / n)) for i in range(0, n, 1200)])[:n]
    out *= np.sin(np.pi * tt / tt[-1]) ** 3
    return stereo(out, width=0.8)


def stone_flyby(t0, dur, pan=-0.2, gain=0.35):
    n = int(dur * SR)
    tt = t_axis(n)
    wh = noise(n)
    wh = np.concatenate([bp(wh[i:i + 2400], 150 + 800 * np.exp(-i / n * 3), 700 + 2500 * np.exp(-i / n * 3)) for i in range(0, n, 2400)])[:n]
    wh *= np.sin(np.pi * np.clip(tt / tt[-1], 0, 1)) ** 2
    place(sfx, stereo(wh, width=0.5, pan=pan), t0, gain)


def glass_chip(t0, pan=0.0, gain=0.42):
    n = int(1.4 * SR)
    tt = t_axis(n)
    crack = np.zeros(n)
    for k in range(28):
        i0 = int((k / 28) ** 1.6 * 0.5 * SR)
        m = int(0.012 * SR)
        crack[i0:i0 + m] += hp(noise(m), 2500) * (1 - k / 32)
    crack = crack + sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, d in [(3150, 9), (4720, 12), (6390, 16), (2210, 7)]) * 0.22
    place(sfx, reverb(stereo(crack, pan=pan), 1.4, 9000, 0.25, 17), t0, gain)
    for k in range(10):  # shards tinkle
        nn = int(0.1 * SR)
        t2 = t_axis(nn)
        tk = np.sin(2 * np.pi * (4000 + 3000 * rng.random()) * t2) * np.exp(-t2 * 60)
        place(sfx, stereo(tk, pan=np.clip(pan + rng.uniform(-0.4, 0.4), -1, 1)), t0 + 0.05 + k * 0.045, gain * 0.25)


def gel_absorb(t0, pan=0.0, gain=0.5):
    n = int(0.9 * SR)
    tt = t_axis(n)
    thud = np.sin(2 * np.pi * (110 * np.exp(-tt * 6) + 50) * tt) * np.exp(-tt * 10) + lp(noise(n), 500) * np.exp(-tt * 25) * 0.4
    wob = np.sin(2 * np.pi * 95 * tt + 2.5 * np.sin(2 * np.pi * 9 * tt)) * np.exp(-tt * 4.5) * 0.4
    place(sfx, stereo(thud + wob, pan=pan), t0, gain)
    n = int(1.6 * SR)
    tt = t_axis(n)
    shim = sum(np.sin(2 * np.pi * f * tt * (1 + 0.15 * tt)) for f in [880, 1320, 1760]) * np.exp(-tt * 2.2) * 0.08
    place(sfx, reverb(stereo(shim, pan=pan), 2.0, 9000, 0.5, 19), t0 + 0.04, gain * 1.1)


# S1: dark studio air + sub drone, stone flyby in slow motion
n = int(6.0 * SR)
tt = t_axis(n)
air = lp(noise(n), 700) * 0.5 + hp(lp(noise(n), 5000), 2500) * 0.08
air *= env_adsr(n, 1.2, 0.1, 1, 0.4) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.2 * tt))
place(sfx, stereo(air, width=0.9), 0.0, 0.32)
stone_flyby(4.0 - 0.5, 2.4, pan=0.25, gain=0.32)
n = int(2.8 * SR)
tt = t_axis(n)
place(sfx, np.sin(2 * np.pi * 48 * tt + 3 * np.sin(2 * np.pi * 0.7 * tt)) * env_adsr(n, 0.8, 0.2, 1, 0.3), 3.2, 0.3)

# transitions
for t0, g in [(5.85, 0.3), (S2 + 52 / FPS, 0.2), (S2 + 134 / FPS, 0.22), (12.85, 0.3), (S3 + 140 / FPS, 0.25), (19.85, 0.3),
              (S4 + 100 / FPS, 0.25), (S4 + 182 / FPS, 0.25), (28.85, 0.3), (S5 + 196 / FPS, 0.25)]:
    place(sfx, whoosh(0.9), t0, g)

# S2: gel settle, measurement ticks + chime, press/release
def gel_wobble(dur=0.9, f=95, rate=9.0):
    n = int(dur * SR)
    tt = t_axis(n)
    x = np.sin(2 * np.pi * f * tt + 2.5 * np.sin(2 * np.pi * rate * tt)) * np.exp(-tt * 4.5)
    sq = lp(noise(n), 900) * np.exp(-tt * 9) * (0.5 + 0.5 * np.sin(2 * np.pi * rate * tt))
    return x * 0.7 + sq * 0.6


place(sfx, gel_wobble(1.0, 80, 7), S2 + 0.15, 0.38)
for k in range(13):
    nn = int(0.03 * SR)
    place(sfx, stereo(np.sin(2 * np.pi * 2600 * t_axis(nn)) * np.exp(-t_axis(nn) * 160), pan=0.3), S2 + 92 / FPS + k * (26 / FPS) / 13, 0.12)
n = int(0.6 * SR)
tt = t_axis(n)
place(sfx, reverb(np.sin(2 * np.pi * 1320 * tt) * np.exp(-tt * 8) + np.sin(2 * np.pi * 1980 * tt) * np.exp(-tt * 10) * 0.5, 1.2, 9000, 0.3, 13), S2 + 118 / FPS, 0.22)
n = int(0.55 * SR)
tt = t_axis(n)
press = lp(noise(n), 600) * np.sin(np.pi * tt / tt[-1]) * 0.6 + np.sin(2 * np.pi * (140 - 70 * tt / tt[-1]) * tt) * np.sin(np.pi * tt / tt[-1]) * 0.4
place(sfx, press, S2 + 158 / FPS, 0.42)
place(sfx, gel_wobble(1.1, 120, 11), S2 + 190 / FPS, 0.45)

# S3 BEFORE: slow-motion approach, chip + cracks + shards
stone_flyby(HIT_BEFORE - 2.3, 2.3, pan=0.25, gain=0.32)
glass_chip(HIT_BEFORE, 0.0, 0.5)
stone_flyby(HIT_BEFORE_X - 1.3, 1.3, pan=-0.3, gain=0.2)
glass_chip(HIT_BEFORE_X, 0.0, 0.3)

# S4 AFTER: shield sweep shimmer, protected impact, cross-section, split screen
n = int(1.6 * SR)
tt = t_axis(n)
place(sfx, stereo(hp(noise(n), 5000) * np.sin(np.pi * tt / tt[-1]) ** 2 * 0.4, width=1.0), S4 + 0.1, 0.16)
stone_flyby(HIT_AFTER - 2.2, 2.2, pan=0.25, gain=0.3)
gel_absorb(HIT_AFTER, 0.0, 0.55)
stone_flyby(HIT_SECTION - 1.3, 1.3, pan=-0.3, gain=0.22)
gel_absorb(HIT_SECTION, 0.0, 0.45)
stone_flyby(HIT_SPLIT - 1.6, 1.6, pan=0.0, gain=0.25)
glass_chip(HIT_SPLIT, -0.75, 0.45)      # LEFT: unprotected
gel_absorb(HIT_SPLIT + 0.01, 0.75, 0.5)  # RIGHT: protected

# S5: glass shimmer as the camera orbits past the shield edge, accents under the closing lines
n = int(3.0 * SR)
tt = t_axis(n)
sh5 = hp(noise(n), 6000) * np.sin(np.pi * tt / tt[-1]) ** 2 * 0.35 + sum(np.sin(2 * np.pi * f * tt) for f in [2637, 3136, 3951]) * np.sin(np.pi * tt / tt[-1]) ** 3 * 0.03
place(sfx, reverb(stereo(sh5, width=1.0), 2.0, 9000, 0.4, 31), S5 + 120 / FPS, 0.25)
for k, st in enumerate([LOGO + 30 / FPS, LOGO + 42 / FPS]):
    n = int(1.0 * SR)
    tt = t_axis(n)
    tone = (np.sin(2 * np.pi * [1175, 1568][k] * tt) + 0.4 * np.sin(2 * np.pi * [1760, 2349][k] * tt)) * np.exp(-tt * 5)
    place(sfx, reverb(tone, 1.4, 9000, 0.45, 41 + k), st, 0.1)


def write(path, x, peak=0.89):
    x = x / max(1e-9, np.max(np.abs(x))) * peak
    wavfile.write(path, SR, (x * 32767).astype(np.int16))


write(os.path.join(OUT, 'music.wav'), music)
write(os.path.join(OUT, 'sfx.wav'), sfx)
print('wrote music.wav + sfx.wav')
