"""
Final audio mix: voice-over (primary) + music + SFX with voice-driven ducking.
Voice lines are read from public/audio/vo/line{1..5}.(wav|mp3) and placed at the
timeline slots below (seconds). Any missing line is simply skipped.
Output: public/audio/mix.wav  (then loudness-normalised to -14 LUFS / -1.5 dBTP)
"""
import json, os, subprocess, tempfile
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
DUR = 40.0
N = int(SR * DUR)
HERE = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.join(HERE, '..', 'public', 'audio')
SLOTS = json.load(open(os.path.join(HERE, 'vo_slots.json')))


def load(path):
    if path.endswith('.wav'):
        sr, x = wavfile.read(path)
    else:  # decode anything else with ffmpeg
        tmp = tempfile.mktemp(suffix='.wav')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', path, '-ar', str(SR), '-ac', '2', tmp], check=True)
        sr, x = wavfile.read(tmp)
        os.remove(tmp)
    x = x.astype(np.float64)
    if x.dtype.kind == 'f' and np.max(np.abs(x)) <= 1.5:
        pass
    x /= np.max(np.abs(x)) + 1e-9
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    if sr != SR:
        x = signal.resample_poly(x, SR, sr, axis=0)
    return x


def fit(x):
    out = np.zeros((N, 2))
    out[: min(N, len(x))] = x[:N]
    return out


def db(v):
    return 10 ** (v / 20)


music = fit(load(os.path.join(PUB, 'music.wav')))
sfx = fit(load(os.path.join(PUB, 'sfx.wav')))
vo = np.zeros((N, 2))
placed = []
for i, start in enumerate(SLOTS['starts'], 1):
    for ext in ('wav', 'mp3'):
        p = os.path.join(PUB, 'vo', f'line{i}.{ext}')
        if os.path.exists(p):
            x = load(p)
            # gentle voice chain: high-pass rumble, presence lift, peak-normalise
            x = signal.sosfilt(signal.butter(2, 70, 'high', fs=SR, output='sos'), x, axis=0)
            pres = signal.sosfilt(signal.butter(2, [2500, 6000], 'band', fs=SR, output='sos'), x, axis=0)
            x = x + 0.25 * pres
            x /= np.max(np.abs(x)) + 1e-9
            i0 = int(start * SR)
            n = min(len(x), N - i0)
            vo[i0:i0 + n] += x[:n]
            placed.append((i, start, round(len(x) / SR, 2)))
            break

# voice-activity envelope → ducking (attack 60 ms, release 450 ms)
env = np.abs(vo).max(axis=1)
win = int(0.03 * SR)
env = np.convolve(env, np.ones(win) / win, mode='same')
act = (env > 0.02).astype(float)
duck = np.zeros(N)
a, r = np.exp(-1 / (0.06 * SR)), np.exp(-1 / (0.45 * SR))
g = 0.0
for i in range(0, N, 48):  # block-wise smoother for speed
    tgt = act[i]
    coef = a if tgt > g else r
    g = tgt + (g - tgt) * coef ** 48
    duck[i:i + 48] = g

music_gain = db(-15) * (1 - duck * (1 - db(-9)))[:, None]
sfx_gain = db(-11) * (1 - duck * (1 - db(-5)))[:, None]
mix = vo * db(-3) + music * music_gain + sfx * sfx_gain
mix /= np.max(np.abs(mix)) + 1e-9
mix *= 0.9
raw = os.path.join(PUB, 'mix_raw.wav')
wavfile.write(raw, SR, (mix * (2 ** 31 - 1)).astype(np.int32))
out = os.path.join(PUB, 'mix.wav')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', str(SR), '-c:a', 'pcm_s24le', out], check=True)
os.remove(raw)
print('VO lines placed:', placed if placed else 'none (music + SFX only)')
