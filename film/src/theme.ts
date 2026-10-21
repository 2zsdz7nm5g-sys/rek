// Brand tokens from the active REK PROFFSET Studio design system (rekproffsetiraq.com).
export const COLORS = {
  bg: "#050B12",
  surface: "#081522",
  navy: "#0B1D30",
  premium: "#123F69",
  accent: "#1689D8",
  accentLight: "#5BB8F2",
  ink: "#F5F7FA",
  muted: "#8B98A8",
};

// Latin and Arabic subsets are registered as separate families so the browser falls back
// per character: Latin glyphs from the first family, Arabic glyphs from the second.
export const FONTS = {
  display: "'Alexandria Latin', 'Alexandria Arabic', sans-serif",
  body: "'Plex Arabic Latin', 'Plex Arabic', sans-serif",
  mono: "'Plex Mono', monospace",
};

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
