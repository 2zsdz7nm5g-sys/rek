# REK Proffset – Windshield Protection Shield (Instagram Reel)

40-second, 9:16 (1080 × 1920, 30 fps) cinematic motion-graphics commercial built
entirely in code with **Remotion + three.js (react-three-fiber)**. Every scene,
camera move, material and sound cue is editable.

Only brand shown: **REK Proffset** (actual logo from rekproffsetiraq.com, `public/brand/`).
Product is referred to only as *Windshield Protection Shield / درع الزجاج الأمامي*.

## Timeline

| # | Scene | Frames | Time | File |
|---|-------|--------|------|------|
| 1 | Cinematic hook – night highway, slow-mo stone, pause before impact | 0–156 | 0–5.2 s | `src/scenes/S1Hook.tsx` |
| 2 | Product reveal – transparent gel shield, 6 mm macro measurement, press/flex demo | 150–366 | 5–12.2 s | `src/scenes/S2Reveal.tsx` |
| 3 | How it works – exploded laminate (glass / PVB / glass + 6 mm shield, true proportions), split-screen impact | 360–606 | 12–20.2 s | `src/scenes/S3Science.tsx` |
| 4 | Installation at REK Proffset – clean, position, squeegee, remove fluid/bubbles, inspect | 600–906 | 20–30.2 s | `src/scenes/S4Install.tsx` |
| 5 | Final reveal – windshield close-up → full front, logo end card | 900–1200 | 30–40 s | `src/scenes/S5Final.tsx` |

Master composition: `REK-Windshield-Shield` (`src/Main.tsx`). Each scene is also
registered on its own under *Scenes/* in Remotion Studio. Timing lives in `src/theme.ts`.

## Project layout

```
src/theme.ts            palette, fonts (vendored IBM Plex Sans Arabic + Archivo), timeline, Reels safe zones
src/three/Car.tsx       procedural luxury car (lofted body, cabin, windshield, LED signature, wheels)
src/three/Gel.tsx       6 mm transparent gel shield – transmission material + jiggle/press/ripple deformation
src/three/env.tsx       studio / night / workshop light-form environments (reflections)
src/three/Stage.tsx     backdrop + grid floor used for the product shots
src/three/Canvas3D.tsx  3D canvas rendered at 0.75× internally (text stays full-res)
src/ui/                 Arabic RTL word-reveal titles, technical labels, grain, vignette, flashes
audio/sound_design.py   procedural score (D minor) + all SFX, frame-synced → public/audio/{music,sfx}.wav
audio/mix.py            VO placement, voice-driven ducking, -14 LUFS loudness → public/audio/mix.wav
audio/vo_slots.json     start time of each of the 5 voice-over lines + the script
```

## Commands

```bash
npm i
npx remotion studio          # preview / edit
npm run sound                # regenerate music + SFX stems
npm run render               # silent video master → out/video-silent.mp4 (~55 min on CPU-only GL)
npm run finalize             # mix audio (incl. VO if present) and mux → out/REK-Proffset-Windshield-Shield-1080x1920.mp4
```

## Voice-over

Recommended ElevenLabs voice: **"Mohammed – Deep Narrator & Documentary"**
(`DhfzvPf0OIN8xdGwcHOk`, deep Iraqi male), model `eleven_v4`. Generate the 5 lines
from `audio/vo_slots.json` separately, save them as `public/audio/vo/line1.mp3 … line5.mp3`
(or `.wav`), then run `npm run finalize` – no video re-render is needed. Adjust a
line's position by editing its value in `starts`.

## Using real installation footage

If you have footage of the installation at REK Proffset, drop clips into `public/footage/`
and replace (or intercut) Scene 4 with `<OffthreadVideo src={staticFile('footage/…')} />`
inside the same `<Sequence>` in `src/Main.tsx`.

## Notes

* The product is shown as a magnified sample for the 6 mm measurement; the cross-section in
  Scene 3 uses real proportions (2.1 mm glass, 0.76 mm PVB interlayer, 6 mm shield).
* Messaging is deliberately conservative: the shield *helps reduce* the effect of small gravel –
  no "unbreakable" claims.
