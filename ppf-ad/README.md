# REK PROFFSET × FlexiShield PPF: Reels ad

Vertical (1080×1920, 60fps) motion graphics ad built with Remotion and
Three.js. Arabic first, with English technical labels.

## Status

Style-frame stage. `style-frames/` has one still per storyboard beat
(`00_storyboard.jpg` is the overview). Full production starts after approval.

## Structure

- `src/scenes/S1.tsx`: Section 1, the problem (hook, chaos, damage, stakes)
- `src/scenes/S2.tsx`: Section 2, the solution (turn, FlexiShield intro)
- `src/scenes/S3.tsx`: Section 3, how it works (application, layers, self-healing)
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
