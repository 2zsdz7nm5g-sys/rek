import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Fonts are bundled in public/fonts (OFL) so renders never depend on a CDN.
const faces: [string, string, string][] = [
  ["Alexandria", "Alexandria.ttf", "100 900"],
  ["Amiri", "Amiri-Regular.ttf", "400"],
  ["Amiri", "Amiri-Bold.ttf", "700"],
  ["Plex Arabic", "PlexArabic-Light.ttf", "300"],
  ["Plex Arabic", "PlexArabic-Regular.ttf", "400"],
  ["Plex Arabic", "PlexArabic-Medium.ttf", "500"],
  ["Plex Mono", "PlexMono-Regular.ttf", "400"],
  ["Plex Mono", "PlexMono-Medium.ttf", "500"],
];

faces.forEach(([family, file, weight]) =>
  loadFont({ family, url: staticFile(`fonts/${file}`), weight, display: "block" }),
);

// Display: heavy geometric sans (Arabic + Latin).
export const display = "Alexandria";
// Contrast voice (the italic-serif role from reference B): Arabic naskh.
export const serif = "Amiri";
export const body = "'Plex Arabic'";
// Technical labels (PPF, TPU) in mono, per the brand system.
export const mono = "'Plex Mono'";
