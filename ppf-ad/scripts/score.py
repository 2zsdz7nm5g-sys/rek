"""Custom synth score + sound design for the REK PROFFSET PPF ad.

Reads src/timeline.json so every hit lands on the edit. numpy only.
Section 1: dark drone, tension ticks, impacts, a riser that cuts to silence.
Section 2 onward: premium D-minor-to-F progression, pulse bass, plucks,
then drums in Section 3 and a full lift and logo hit in Section 4.
Writes public/audio/score.wav (48 kHz stereo).
"""
import json, os, sys, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(ROOT, "src", "timeline.json")))
FPS = TL["fps"]
SR = 48000
rng = np.random.default_rng(7)

starts, t = {}, 0
for i, s in enumerate(TL["scenes"]):
    if i:
        t -= s["overlap"]
    starts[s["id"]] = t
    t += s["dur"]
TOTAL_F = t
DUR = TOTAL_F / FPS + 1.5  # tail
N = int(DUR * SR)
L = np.zeros(N)
R = np.zeros(N)


def sec(scene, frame=0):
    return (starts[scene] + frame) / FPS


def add(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    gl = gain * np.sqrt(0.5 * (1 - pan))
    gr = gain * np.sqrt(0.5 * (1 + pan))
    if sig.ndim == 2:
        L[i:i + len(sig)] += sig[:, 0] * gl * 1.414
        R[i:i + len(sig)] += sig[:, 1] * gr * 1.414
    else:
        L[i:i + len(sig)] += sig * gl * 1.414
        R[i:i + len(sig)] += sig * gr * 1.414


def tt(d):
    return np.arange(int(d * SR)) / SR


def fft_filter(x, lo=None, hi=None):
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    if hi:
        g *= 1 / np.sqrt(1 + (f / hi) ** 4)
    if lo:
        g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** 4)
    return np.fft.irfft(X * g, n)


def env(d, a=0.01, r=0.3, curve=1.0):
    t_ = tt(d)
    e = np.minimum(1, t_ / max(a, 1e-4))
    rel = np.clip((d - t_) / max(r, 1e-4), 0, 1) ** curve
    return e * rel


def saw(freq, d, harm=24, detune=0.0):
    t_ = tt(d)
    out = np.zeros_like(t_)
    for k in range(1, harm + 1):
        if freq * k > 12000:
            break
        out += np.sin(2 * np.pi * freq * (1 + detune) * k * t_ + k * 0.7) / k
    return out * 0.6


def note(n):  # midi -> Hz
    return 440 * 2 ** ((n - 69) / 12)


# ---------------------------------------------------------------- SFX
def whoosh(d=0.5, lo=300, hi=6000, gain=0.5):
    n = rng.standard_normal(int(d * SR))
    a = fft_filter(n, lo=lo, hi=hi * 0.35)
    b = fft_filter(n, lo=lo * 2, hi=hi)
    x = np.linspace(0, 1, len(n))
    sig = a * (1 - x) + b * x
    e = np.sin(np.pi * x) ** 1.6
    return sig * e * gain / (np.abs(sig).max() + 1e-9)


def impact(gain=1.0, f0=110, f1=38, d=1.4, crack=0.4):
    t_ = tt(d)
    freq = f1 + (f0 - f1) * np.exp(-t_ * 18)
    ph = 2 * np.pi * np.cumsum(freq) / SR
    body = np.sin(ph) * np.exp(-t_ * 3.2)
    nz = fft_filter(rng.standard_normal(len(t_)), lo=1200, hi=9000) * np.exp(-t_ * 40) * crack
    return (body + nz) * gain


def tick(f=3600, d=0.12, gain=0.25):
    t_ = tt(d)
    return (np.sin(2 * np.pi * f * t_) * 0.6 + rng.standard_normal(len(t_)) * 0.25) * np.exp(-t_ * 60) * gain


def glass(gain=0.3):
    t_ = tt(1.2)
    s = sum(np.sin(2 * np.pi * f * t_) * np.exp(-t_ * dk) for f, dk in [(2960, 6), (4410, 9), (6650, 14)])
    return s * gain / 3


def riser(d, gain=0.5):
    t_ = tt(d)
    x = t_ / d
    nz = fft_filter(rng.standard_normal(len(t_)), lo=400, hi=8000)
    tone = np.sin(2 * np.pi * np.cumsum(120 + 900 * x ** 2) / SR)
    return (nz / np.abs(nz).max() * 0.7 + tone * 0.3) * x ** 2.2 * gain


def shimmer(d, gain=0.2):
    t_ = tt(d)
    s = sum(np.sin(2 * np.pi * note(m) * t_ + m) for m in (86, 90, 93, 98))
    trem = 0.6 + 0.4 * np.sin(2 * np.pi * 7 * t_)
    return s * trem * env(d, a=d * 0.3, r=d * 0.5) * gain / 4


# ---------------------------------------------------------------- MUSIC
BPM = 92
BEAT = 60 / BPM
T2 = sec("S2Turn", 40)            # the film stops the stone: music turns
T3 = sec("S3Apply", 0)
T4 = sec("S4BeforeAfter", 0)
TEND = sec("S4End", 0)
END = TOTAL_F / FPS

# Section 1: drone + heartbeat sub + tension ticks.
d1 = T2
drone = (saw(note(26), d1, 12) * 0.5 + saw(note(26), d1, 12, 0.004) * 0.5)
drone = fft_filter(drone, hi=220) * env(d1, a=2.5, r=0.05) * np.linspace(0.6, 1.0, int(d1 * SR))
add(drone, 0, 0.32, -0.1)
add(np.sin(2 * np.pi * note(38) * tt(d1)) * env(d1, a=3, r=0.05) * 0.12, 0, 1.0, 0.1)
k = 0
while True:
    tb = sec("S1Chaos", 0) + k * BEAT / 2
    if tb > T2 - 1.6:
        break
    add(tick(5200 + 300 * (k % 2), 0.08, 0.10 if k % 2 else 0.16), tb, 1, 0.4 if k % 2 else -0.4)
    if k % 2 == 0:
        t_ = tt(0.5)
        add(np.sin(2 * np.pi * 52 * t_) * np.exp(-t_ * 9), tb, 0.35)
    k += 1

# Hook: whoosh in, impact + glass tick.
add(whoosh(0.7, 500, 7000, 0.5), sec("S1Hook", 20), 1, 0.5)
add(impact(0.9, 140, 40, 1.6, 0.6), sec("S1Hook", 60))
add(glass(0.35), sec("S1Hook", 60), 1, 0.2)
# Chaos: gravel patter + swap stingers.
for j in range(70):
    at = sec("S1Chaos", 0) + rng.uniform(0, 2.9)
    add(tick(rng.uniform(2500, 7000), 0.05, rng.uniform(0.04, 0.12)), at, 1, rng.uniform(-0.8, 0.8))
for w in range(4):
    add(impact(0.25, 200, 80, 0.5, 0.8), sec("S1Chaos", 14 + 40 * w), 1, 0.0)
# Damage callouts.
for fr in (10, 20, 30):
    add(tick(1800, 0.15, 0.22), sec("S1Damage", fr), 1, 0.2)
add(glass(0.15), sec("S1Damage", 6), 1, -0.3)
# Stakes: the "1" hit, riser into silence.
add(impact(0.7, 90, 34, 2.0, 0.2), sec("S1Stakes", 12))
rz = T2 - 0.45 - sec("S1Stakes", 120)
add(riser(rz, 0.45), sec("S1Stakes", 120))

# Turn: reverse swell, film "shhk", stone "tock", then the drop.
add(whoosh(1.1, 1500, 12000, 0.55)[::-1], T2 - 1.1, 1, -0.3)
add(fft_filter(rng.standard_normal(int(0.35 * SR)), lo=3000, hi=12000) * env(0.35, 0.02, 0.3) * 0.25, T2 - 0.2, 1, 0.3)
t_ = tt(0.25)
add(np.sin(2 * np.pi * 900 * t_) * np.exp(-t_ * 40) * 0.4, T2 + 0.05, 1, 0.2)
add(impact(1.0, 70, 30, 3.0, 0.1), T2 + 0.1)

# Chord progression (2 bars each) from the drop to the end.
CHORDS = [
    [50, 57, 60, 64, 65],   # Dm9
    [46, 53, 57, 62, 65],   # Bbmaj7(add13)
    [43, 50, 58, 62, 65],   # Gm9
    [45, 52, 57, 61, 64],   # A7sus feel (A, E, A, C#, E)
    [50, 57, 60, 64, 69],   # Dm9 (lift)
    [46, 53, 58, 62, 69],   # Bbmaj9
]
FINAL = [41, 48, 57, 60, 67, 72]  # Fadd9 for the end card
seg = 8 * BEAT
tcur, ci = T2, 0
while tcur < TEND - 0.05:
    d = min(seg, TEND - tcur)
    ch = CHORDS[ci % len(CHORDS)]
    pad = np.zeros(int((d + 1.2) * SR))
    for m in ch:
        v = saw(note(m), d + 1.2, 18, 0.003) + saw(note(m), d + 1.2, 18, -0.003)
        pad += v
    pad = fft_filter(pad, hi=1600 if tcur < T3 else 2600) * env(d + 1.2, 0.6, 1.4)
    add(pad / np.abs(pad).max(), tcur, 0.16, -0.2)
    add(pad / np.abs(pad).max(), tcur + 0.011, 0.16, 0.2)
    # pulse bass in 8ths with a pumping envelope
    root = ch[0] - 12
    for b in range(int(d / (BEAT / 2))):
        tb = tcur + b * BEAT / 2
        dd = BEAT / 2
        t_ = tt(dd)
        bs = fft_filter(saw(note(root), dd, 10), hi=420) * (1 - np.exp(-t_ * 60)) * np.exp(-t_ * 5)
        add(bs, tb, 0.22 if tcur >= T3 else 0.15)
    # plucked arpeggio in 16ths (from Section 3 on, sparser in Section 2)
    step = BEAT / 4 if tcur >= T3 else BEAT / 2
    pat = [ch[2] + 12, ch[3] + 12, ch[4] + 12, ch[3] + 12, ch[1] + 24, ch[4] + 12]
    for b in range(int(d / step)):
        tb = tcur + b * step
        t_ = tt(0.35)
        m = pat[b % len(pat)]
        pl = (np.sin(2 * np.pi * note(m) * t_) + 0.3 * np.sin(4 * np.pi * note(m) * t_)) * np.exp(-t_ * 14)
        add(pl, tb, 0.07 if tcur >= T3 else 0.05, 0.5 if b % 2 else -0.5)
    tcur += seg
    ci += 1

# Drums from Section 3: kick on beats, soft clap on 2/4, hats on 8ths.
tb, b = T3, 0
while tb < TEND - 0.1:
    t_ = tt(0.45)
    kick = np.sin(2 * np.pi * np.cumsum(45 + 110 * np.exp(-t_ * 30)) / SR) * np.exp(-t_ * 7)
    add(kick, tb, 0.45 if tb >= T4 else 0.32)
    if b % 2 == 1:
        cl = fft_filter(rng.standard_normal(int(0.25 * SR)), lo=900, hi=5000) * np.exp(-tt(0.25) * 22)
        add(cl, tb, 0.12)
    for h in (0, 0.5):
        hh = fft_filter(rng.standard_normal(int(0.06 * SR)), lo=7000) * np.exp(-tt(0.06) * 70)
        add(hh, tb + h * BEAT, 0.05 if h else 0.03, 0.3)
    tb += BEAT
    b += 1

# Section 2/3/4 sound design on the edit.
add(tick(2400, 0.2, 0.25), sec("S2Intro", 4), 1, 0)
add(tick(3200, 0.12, 0.2), sec("S2Intro", 40), 1, -0.3)
add(shimmer(1.6, 0.18), sec("S2Intro", 40), 1)
add(whoosh(0.5, 600, 9000, 0.35), sec("S2Intro", 236), 1, 0)
add(fft_filter(rng.standard_normal(int(1.6 * SR)), lo=2000, hi=9000) * env(1.6, 0.4, 0.8) * 0.12, sec("S3Apply", 0), 1, 0.4)
for i_ in range(4):
    add(tick(2000 + i_ * 300, 0.15, 0.2), sec("S3Layers", 30 + i_ * 14), 1, -0.2 + i_ * 0.13)
add(whoosh(0.4, 400, 8000, 0.4), sec("S3Impact", -8), 1, 0.4)
add(impact(0.55, 160, 60, 0.8, 0.05), sec("S3Impact", 46))
add(glass(0.12), sec("S3Impact", 46), 1, 0.3)
add(whoosh(0.4, 400, 8000, 0.4), sec("S3Heal", -8), 1, -0.4)
add(shimmer(2.4, 0.16), sec("S3Heal", 12), 1)
for i_ in range(4):
    add(tick(2600, 0.12, 0.16), sec("S3Ring", 20 + i_ * 10), 1, -0.5 + i_ * 0.33)
add(whoosh(0.9, 300, 7000, 0.45), sec("S4BeforeAfter", 0), 1, 0.6)
add(impact(0.5, 100, 40, 1.2, 0.2), sec("S4BeforeAfter", 50))
add(whoosh(0.4, 400, 8000, 0.4), sec("S4Hero", -8), 1, 0.4)
add(riser(1.6, 0.25), sec("S4Hero", 204 - 18) - 1.6)

# End card: final chord, logo hit, button click, long tail.
dfin = END - TEND + 1.4
pad = np.zeros(int(dfin * SR))
for m in FINAL:
    pad += saw(note(m), dfin, 18, 0.003) + saw(note(m), dfin, 18, -0.003)
pad = fft_filter(pad, hi=3000) * env(dfin, 0.05, 2.6)
add(pad / np.abs(pad).max(), TEND, 0.22, -0.2)
add(pad / np.abs(pad).max(), TEND + 0.013, 0.22, 0.2)
add(impact(1.0, 120, 36, 3.0, 0.5), sec("S4End", 6))
add(shimmer(2.5, 0.2), sec("S4End", 6))
add(tick(1500, 0.18, 0.3), sec("S4End", 44), 1, 0)

# ---------------------------------------------------------------- master
def reverb(x, d=2.6, mix=0.22):
    ir_n = int(d * SR)
    ir = rng.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / SR * 3.2)
    ir = fft_filter(ir, hi=6000)
    ir /= np.sqrt((ir ** 2).sum())
    n = len(x) + ir_n
    nfft = 1 << (n - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]
    return x * (1 - mix) + y * mix * 1.6


L, R = reverb(L), reverb(R)
L, R = fft_filter(L, lo=28), fft_filter(R, lo=28)
# fade out the tail
fade = np.ones(N)
fe = int((END + 1.2) * SR)
fade[fe:] = 0
fl = int(1.8 * SR)
fade[fe - fl:fe] = np.linspace(1, 0, fl)
L *= fade
R *= fade
L, R = L[: int(END * SR) + 1], R[: int(END * SR) + 1]
# Gentle soft-clip limiting so the impacts don't dictate the level.
st = np.stack([L, R], 1)
st = st / np.sqrt((st ** 2).mean()) * 0.16
st = np.tanh(st * 1.6) / 1.6
st = st / np.abs(st).max() * 0.89
out = os.path.join(ROOT, "public", "audio", "score.wav")
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
print(f"wrote {out}: {len(L) / SR:.2f}s; drop at {T2:.2f}s, S3 {T3:.2f}s, S4 {T4:.2f}s, end card {TEND:.2f}s")
