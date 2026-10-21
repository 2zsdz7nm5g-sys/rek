# REK PROFFSET — Cinematic Automotive Care Brand Film

Remotion project for the REK PROFFSET brand film (Arabic, RTL).

| Composition         | Size      | FPS | Use                                    |
| ------------------- | --------- | --- | -------------------------------------- |
| `BrandFilm`         | 1920×1080 | 30  | 16:9 master                            |
| `BrandFilmVertical` | 1080×1920 | 30  | 9:16 recomposition (not a crop)        |

Services covered: PPF, Nano Ceramic, Professional Polishing, Interior Deep Cleaning,
PDR, Windshield Protection Film. Colour PPF, colour-change films, vinyl wrapping and any
change of vehicle colour are deliberately excluded.

## Status

The narration is **incomplete**. Only 3 of 9 voiceover segments exist
(`public/vo/01_opening.mp3`, `02_brand.mp3`, `03_ppf.mp3`). ElevenLabs disabled Free Tier
access on the connected account part-way through generation. Scenes 4–9 are timed from an
estimated reading speed and play with music only until their audio is added.

## Commands

```console
npm i
npx remotion studio                                        # preview
npx remotion render BrandFilm out/REK_Proffset_Brand_Film_1080p.mp4 --codec=h264 --crf=16
npx remotion render BrandFilmVertical out/REK_Proffset_Brand_Film_9x16.mp4 --codec=h264 --crf=16
```

`remotion.config.ts` points at the pre-installed headless Chromium. Set
`REMOTION_BROWSER_EXECUTABLE` to use a different one.

## Adding the missing narration

1. Put the files in `public/vo/` with these names:
   `04_ceramic.mp3`, `05_polishing.mp3`, `06_interior.mp3`, `07_pdr.mp3`,
   `08_windshield.mp3`, `09_finale.mp3`. The exact lines are in `scripts/build-timeline.mjs`.
2. Re-time every scene from the real audio lengths:
   `node scripts/build-timeline.mjs` (needs `ffprobe`; writes `src/data/timeline.json`).
3. Re-score to the new timeline:
   `python3 scripts/compose_score.py <FluidR3_GM sample dir> src/data/timeline.json public/audio/score.wav`.
   The script expects the `acoustic_grand_piano`, `string_ensemble_1` and `cello` note
   samples from [gleitz/midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts)
   (FluidR3_GM), as `<dir>/<instrument>/<note>.mp3`, e.g. `acoustic_grand_piano/D4.mp3`.
4. Render again.

## Contact details

None were supplied, so none are shown. Pass them as input props to show them under the
closing logo, for example:

```console
npx remotion render BrandFilm out/film.mp4 --props='{"contact":["<phone>","<instagram>"]}'
```

## Structure

- `src/BrandFilm.tsx` puts the scenes in a `TransitionSeries` and handles music ducking under the VO.
- `src/scenes/` holds the scenes: opening, brand, the shared `ServiceScene`, and the finale.
- `src/components/` holds the reusable parts:
  - `CinematicBackground` (animated full-frame background)
  - `ServiceThumbnail` (bordered thumbnail on the right)
  - `ArabicTextBlock` (title and lines)
  - `LogoReveal`, `PdrIllustration`, `Grain`, `Narration`
- `src/data/services.tsx` holds the service copy, images and SFX.
- `src/data/timeline.json` holds the VO-driven scene timings (generated).
- `src/theme.ts` holds the brand tokens, taken from the REK PROFFSET website design.

## Asset provenance and licences

- **Photography and logo** (`public/media/rek-*`) are REK PROFFSET's own images from the
  rekproffsetiraq.com media library. The backgrounds are still photographs animated with
  camera moves, light sweeps and focus pulls; no stock video was used.
- **PDR thumbnail:** no genuine PDR photo was available, so this is a labelled technical
  illustration (`ILLUSTRATION`) rather than a photo.
- **FlexiShield logo:** not used, because only a placeholder existed.
- **Fonts:** Alexandria, IBM Plex Sans Arabic and IBM Plex Mono, all SIL Open Font
  License, via Fontsource.
- **Music** (`public/audio/score.wav`) is an original score built from FluidR3_GM samples
  (Frank Wen, **CC BY 3.0**). Credit required: "FluidR3_GM soundfont by Frank Wen, CC BY 3.0".
- **SFX** (`sweep`, `polisher`, `spray`) are synthesised with ffmpeg.
- **Voiceover:** ElevenLabs, generated on the client's account.
