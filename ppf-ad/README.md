# REK PROFFSET × FlexiShield PPF: Reels ad

Vertical (1080×1920, 60fps) motion graphics ad built with Remotion and
Three.js. Arabic first, with English technical labels.

## Status

First full cut rendered: `deliverables/REK_FlexiShield_PPF_Reel.mp4`
(1080×1920, 30 fps, 44.4 s, -14 LUFS) plus a `_REVIEW` copy that tags the
placeholder-car shots. Music and sound design are in; the voice-over is
pending (see `VOICEOVER.md`). `Master` is the 60 fps composition,
`Master30` the 30 fps one used for delivery (identical timing).

## Render

```
python3 scripts/score.py   # regenerate the score from src/timeline.json
scripts/render.sh          # chunked render + mux -> out/REK_FlexiShield_PPF_Reel.mp4
scripts/review.sh          # same video with placeholder-car shots tagged
scripts/mix-vo.sh          # once public/vo/*.wav exist: duck + mix voice-over
```

## Structure

- `src/scenes/S1.tsx`: Section 1, the problem (hook, chaos, damage, stakes)
- `src/scenes/S2.tsx`: Section 2, the solution (turn, FlexiShield intro)
- `src/scenes/S3.tsx`: Section 3, how it works (application, layers, impact, self-healing, feature ring)
- `src/Master.tsx` + `src/timeline.json`: the full edit, transitions and voice-over slots
- `src/scenes/S4.tsx`: Section 4, result and call to action
- `src/three/`: studio lighting, paint shader, panel and damage, car, stones
- `src/ui/`: reference-style typography (focus-in words, swap box, dashed tags), backdrop, the light line
- `src/lib/brand.ts`: REK PROFFSET colour tokens

## Commands

```
npm run dev                      # Remotion Studio
npx remotion still S4End out/x.jpg --frame=100
```

Rendering uses the pre-installed Chromium headless shell with SwiftShader
(`remotion.config.ts`), so it works without a GPU.

## Facts used on screen

Every product statement comes from rekproffsetiraq.com (Services page,
FlexiShield technical profile): TPU film, self-healing top coat for fine
scratches with heat, high clarity, anti-yellowing, protection from stone
chips, scratches and UV, digital cut, and REK PROFFSET as the exclusive
FlexiShield USA agent in Iraq. No prices, warranties or statistics.
