# REK PPF Color Studio: source

Source for `wp-theme/rek-proffset/assets/ppf-studio/` (shortcode `[rek_ppf_studio]`, see `inc/ppf-studio.php`).

- `studio.js`: turntable, camera framing, input (drag / wheel / pinch / keys), paint transitions and the selector UI.
- `studio-room.js`: the fixed wall, floor, the two illuminated wall signs (made from the official logo files as-is) and wall lights.
- `ppf-render.js`: environment, paint/glass detail, baked contact shadows.
- `colors.py`: the 99 colours; writes `colors.json` (copy it into the theme's `assets/ppf-studio/`).

Build (three r186, esbuild):

```
esbuild studio.js --bundle --minify --format=iife --target=es2019 --legal-comments=none \
  --define:import.meta.url=document.baseURI \
  --outfile=../../wp-theme/rek-proffset/assets/ppf-studio/ppf-studio.min.js
```

The model is served from `/models/r8-rek-studio.glb` (only its `body_color` material is recoloured).
