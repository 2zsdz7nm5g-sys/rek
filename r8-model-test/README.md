# R8 model test (temporary, not part of the live site)

Isolated test page for the REK PPF Color Studio model. It is not linked from
the website and carries `noindex`.

- `../models/r8-rek-studio.glb`: prepared from `r8.fbx` (Draco, 291 KB, 72,089 triangles, 24 meshes / materials).
- `../models/r8-rek-studio-v1-fallback.glb`: the earlier 467 KB model, kept as a fallback.
- `index.html` + `ppf-studio.min.js`: the test viewer (Three.js r186, bundled). `draco/` holds the self-hosted Draco decoder.
- `src/`: viewer sources and the preparation scripts (`prep-r8-fbx.py`, `compress-r8.mjs`).

Only the `body_color` mesh/material is recoloured; every other material is left untouched.
