# REK Proffset — FlexiShield colour PPF reel (HyperFrames)

20 s, 1080×1920 (9:16), 30 fps Instagram Reel. One HyperFrames composition (`index.html`):
a Three.js PBR car layer plus an HTML/GSAP typography layer. Arabic copy is live, editable RTL text.

## Timeline

| Time | Scene | On screen | VO segment |
| --- | --- | --- | --- |
| 0.0–3.4 s | Reveal | Light sweep reveals the car · «لون سيارتك… هويتك الخاصة» | `vo_a` |
| 3.3–7.5 s | Film application | Glowing film edge wraps the car (silver → satin black) · «مع فليكسي شيلد» / «عالم من الألوان الفاخرة بين إيديك» | `vo_b` |
| 7.5–13.2 s | Colour change | Grey → pearl white → ice blue → deep navy, swatch ring tracks the active colour · «اختار اللون اللي يشبهك» | `vo_c` |
| 13.2–16.0 s | Preview | Glass preview frame, scan line, navy ↔ ice blue · «وشوف سيارتك قبل لا تتخذ قرارك» | `vo_d` |
| 16.0–20.0 s | End card | REK PROFFSET wordmark · «خلي التميز يحچي عنك» | `vo_e1`, `vo_e2` |

## Editing

- **Arabic text:** edit the `<span class="title">`, `.sub` and `.tagline` elements in `index.html`. Lines are revealed whole, so Arabic letter shaping is never split.
- **Paint colours:** `PAINTS` (hex, metalness, roughness, clearcoat) and `WIPES` (start, end, from, to) in the module script. Matching swatch colours are in the `.sw` elements.
- **Brand palette and fonts:** these come from `REK PROFFSET.dc.html` (navy #061A2E / #0A2742, blue #3DA9FF / #63C7FF; Archivo + IBM Plex Sans Arabic).

## Commands

```bash
npm install
export HYPERFRAMES_BROWSER_PATH=/path/to/chrome-headless-shell   # if `npx hyperframes doctor` reports Chrome missing
npx hyperframes check
npx hyperframes preview --background
npx hyperframes render --quality delivery --fps 30 --output renders/REK_Proffset_FlexiShield_Reel_9x16.mp4
```

## Assets and provenance

- `assets/models/gt_coupe_unbadged.glb`: derived from the three.js example model `ferrari.glb` (credited in the three.js examples to vicent091036 on Sketchfab). All manufacturer emblems, script lettering, fender shields and the yellow badge accents were removed (geometry deleted, accent material neutralised). The body shape is still recognisable as a real car design, so check the model's licence and the brand's legal stance before paid media use, or swap in a licensed or generic model.
- `assets/models/car_ao.png`: ground shadow texture from the same three.js example.
- `assets/audio/vo_*.wav`: the ElevenLabs Arabic voiceover ("Mohammed – Deep Narrator", eleven_v4), split at natural pauses.
- `assets/audio/music_bed.wav`, `sfx.wav`: synthesised locally with FFmpeg (no third-party music).
- Fonts: IBM Plex Sans Arabic and Archivo (SIL Open Font License, via Fontsource).
- Runtime: three.js r181 and GSAP 3.14 are vendored under `assets/vendor/`.
