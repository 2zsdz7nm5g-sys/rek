# REK Proffset – Windshield Protection Shield (Instagram Reel)

40-second, 9:16 cinematic 3D product film, **native 1080 × 1920 @ 30 fps**, built in code with
**Remotion + three.js (react-three-fiber)**. Every shot, material, camera move and sound cue is editable.

**Concept:** no cars, no installation – only an isolated, realistic **windshield glass panel**
(curved laminated glass, green-tinted edges, black ceramic frit border with half-tone dots) and the
**transparent 6 mm gelatinous protection shield**, explained through stone-impact simulations,
cross-sections and a like-for-like before/after comparison.

Only brand shown: **REK Proffset** (official logo, `public/brand/`). The product is referred to only
as *درع حماية الزجاج الأمامي*.

## Storyboard

| # | Scene | Frames | Time | File |
|---|-------|--------|------|------|
| 1 | The problem – floating windshield in a dark studio, stone approaches in slow motion, pause before impact | 0–186 | 0–6.2 s | `src/scenes/S1Problem.tsx` |
| 2 | The shield – floating transparent gel sample, 6 mm macro measurement, elastic press/flex demo | 180–396 | 6–13.2 s | `src/scenes/S2Reveal.tsx` |
| 3 | Before protection – macro impact on bare glass (chip + star cracks + shards), then the crack in cross-section | 390–606 | 13–20.2 s | `src/scenes/S3Before.tsx` |
| 4 | After protection – same panel, camera and light with the 6 mm layer (dent, ripple, energy rings), cross-section, LEFT/RIGHT split screen | 600–876 | 20–29.2 s | `src/scenes/S4After.tsx` |
| 5 | Final reveal – orbit around the protected panel (shield edge visible), logo, closing lines | 870–1200 | 29–40 s | `src/scenes/S5Final.tsx` |

Master composition: `REK-Windshield-Shield` (`src/Main.tsx`); each scene is also registered on its own
under *Scenes/* in Remotion Studio. Timeline constants: `src/theme.ts`.

## Project layout

```
src/three/Panel.tsx      isolated windshield panel (geometry, glass, edge, frit) + surface frames
src/three/Impact.tsx     like-for-like impact shot: stone kinematics, chip/crack shader, shards,
                         6 mm shield layer (dent / ripple / energy-ring shader), designed reflections
src/three/Section.tsx    laminated-glass cross-section (2.1 mm glass / 0.76 mm PVB / 2.1 mm glass ± 6 mm shield)
src/three/Gel.tsx        deformable transparent gel sample (Scene 2)
src/three/PanelStudio.tsx, Stage.tsx, env.tsx   dark studio, backdrop, reflection environments
src/ui/                  Arabic RTL word-reveal titles, labels, vignette, scrims, flashes
audio/sound_design.py    procedural score (D minor) + SFX, frame-synced → public/audio/{music,sfx}.wav
audio/mix.py             VO placement, voice-driven ducking, two-pass −14 LUFS → public/audio/mix.wav
audio/vo_slots.json      the 5 narration lines and their fixed start times
```

## Commands

```bash
npm i
npx remotion studio          # preview / edit
npm run sound                # regenerate music + SFX
npm run render               # silent native-res master → out/video-silent.mp4 (~80 min on CPU-only GL)
npm run finalize             # mix (incl. VO if present) + mux → out/REK-Proffset-Windshield-Shield-1080x1920.mp4
```

## Voice-over (fixed slots)

ElevenLabs voice: **"Mohammed – Deep Narrator & Documentary"** (`DhfzvPf0OIN8xdGwcHOk`, deep Iraqi male),
model `eleven_v4`. Save the five lines from `audio/vo_slots.json` as `public/audio/vo/line1.mp3 … line5.mp3`
and run `npm run finalize` – no video re-render needed. Slots: 0.5 s, 6.4 s, 13.3 s, 20.4 s, 32.4 s
(line 5 is timed to land "مع REK Proffset" on the logo at ≈36.6 s; nudge `starts` if a take runs long).

## Responsible messaging

The shield is shown as an *additional* layer that *helps absorb and spread part of the impact energy*
from small stones. No "unbreakable" claim; the energy rings are an explanatory visualisation.
