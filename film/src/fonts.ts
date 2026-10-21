import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

const faces: Array<[family: string, file: string, weight: string]> = [
  ["Alexandria Arabic", "alexandria-arabic-500-normal.woff2", "500"],
  ["Alexandria Arabic", "alexandria-arabic-600-normal.woff2", "600"],
  ["Alexandria Arabic", "alexandria-arabic-700-normal.woff2", "700"],
  ["Alexandria Latin", "alexandria-latin-500-normal.woff2", "500"],
  ["Alexandria Latin", "alexandria-latin-600-normal.woff2", "600"],
  ["Alexandria Latin", "alexandria-latin-700-normal.woff2", "700"],
  ["Plex Arabic", "ibm-plex-sans-arabic-arabic-300-normal.woff2", "300"],
  ["Plex Arabic", "ibm-plex-sans-arabic-arabic-400-normal.woff2", "400"],
  ["Plex Arabic", "ibm-plex-sans-arabic-arabic-500-normal.woff2", "500"],
  ["Plex Arabic Latin", "ibm-plex-sans-arabic-latin-400-normal.woff2", "400"],
  ["Plex Arabic Latin", "ibm-plex-sans-arabic-latin-500-normal.woff2", "500"],
  ["Plex Mono", "ibm-plex-mono-latin-400-normal.woff2", "400"],
  ["Plex Mono", "ibm-plex-mono-latin-500-normal.woff2", "500"],
];

for (const [family, file, weight] of faces) {
  loadFont({ family, url: staticFile(`fonts/${file}`), weight });
}
