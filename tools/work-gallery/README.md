# REK work gallery ([rek_work_gallery])

Real project photos for the "أعمالنا" page, grouped Service > Vehicle > Colour / finish > Photos.

- `build.py`: the classification of every photo (67 photos, 15 projects) -> `wp-theme/rek-proffset/assets/work-gallery/projects.json`.
- `dims.json`: original pixel size of each photo (after EXIF rotation).
- `manifest.txt`: sha1 of every web image, used to verify the upload to `wp-content/uploads/rek-work/`.
- Web images (`site-content/work-gallery/`): WebP at 480, 960 and up to 1600 px wide (never upscaled), EXIF/GPS stripped.
  Photo `pNNN` is file `@r07qxo - R…Download NNN.JPEG` from the client's ZIP.
