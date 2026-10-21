import React from "react";
import { Hl } from "../components/ArabicTextBlock";
import type { CameraMove } from "../components/CinematicBackground";

export type Service = {
  id: "ppf" | "ceramic" | "polishing" | "interior" | "pdr" | "windshield";
  label: string;
  title: React.ReactNode;
  lines: React.ReactNode[];
  background: { src: string; move: CameraMove; exposure?: number; saturation?: number };
  /** photo thumbnail, or "pdr-illustration" when no genuine photo exists */
  thumb: { src?: string; focus?: string; illustration?: "pdr" };
  sfx?: { src: string; at: number; volume: number };
  titleSize?: number;
};

// Copy is taken verbatim from the production brief. Imagery is REK PROFFSET's own
// photography from rekproffsetiraq.com; colour-PPF and wrap images are deliberately excluded.
export const SERVICES: Service[] = [
  {
    id: "ppf",
    label: "01 · PAINT PROTECTION FILM",
    title: (
      <>
        حماية الطلاء — <Hl>PPF</Hl>
      </>
    ),
    lines: [<>حماية مخصصة لطلاء السيارة</>, <>تساعد على تقليل آثار الخدوش السطحية</>],
    background: { src: "media/rek-correction-panel.webp", move: { scale: [1.1, 1.2], x: [2, -2.5], y: [0, -1], focus: "60% 45%" } },
    thumb: { src: "media/rek-ppf-install.webp", focus: "62% 45%" },
  },
  {
    id: "ceramic",
    label: "02 · NANO CERAMIC COATING",
    title: <>الحماية النانوية</>,
    lines: [<><Hl>لمعان</Hl> مميز</>, <>عناية أسهل</>],
    background: { src: "media/rek-ceramic.webp", move: { scale: [1.05, 1.17], x: [0, -1.5], y: [0, 0.5], focus: "65% 45%" } },
    thumb: { src: "media/rek-ppf-hydro.webp", focus: "45% 40%" },
    sfx: { src: "audio/spray.wav", at: 46, volume: 0.16 },
  },
  {
    id: "polishing",
    label: "03 · PROFESSIONAL POLISHING",
    title: <>التلميع الاحترافي</>,
    lines: [<>اهتمام بمظهر الطلاء</>, <><Hl>دقة</Hl> في التفاصيل</>],
    background: { src: "media/rek-detail-headlight.webp", move: { scale: [1.08, 1.16], x: [-2, 2], y: [0.5, -0.5], focus: "70% 40%" }, exposure: 0.62 },
    thumb: { src: "media/rek-correction.webp", focus: "28% 62%" },
    sfx: { src: "audio/polisher.wav", at: 40, volume: 0.1 },
  },
  {
    id: "interior",
    label: "04 · INTERIOR DEEP CLEANING",
    title: <>التنظيف الداخلي</>,
    lines: [<>عناية بالتفاصيل <Hl>الداخلية</Hl></>, <>نظافة وراحة</>],
    background: { src: "media/rek-interior.webp", move: { scale: [1.08, 1.15], x: [2.5, -2], y: [0, 0], focus: "60% 50%" }, exposure: 0.66, saturation: 0.7 },
    thumb: { src: "media/rek-interior-leather.webp", focus: "50% 50%" },
  },
  {
    id: "pdr",
    label: "05 · PAINTLESS DENT REPAIR",
    title: (
      <>
        إصلاح الانبعاجات — <Hl>PDR</Hl>
      </>
    ),
    lines: [<>حلول دقيقة</>, <>حسب حالة <Hl>الضرر</Hl></>],
    titleSize: 72,
    background: {
      src: "media/rek-correction-panel.webp",
      move: { scale: [1.25, 1.33], x: [-1.5, 1.5], y: [3, 2], focus: "35% 70%", flip: true },
      exposure: 0.6,
    },
    thumb: { illustration: "pdr" },
  },
  {
    id: "windshield",
    label: "06 · WINDSHIELD PROTECTION",
    title: <>حماية الزجاج الأمامي</>,
    lines: [<>حماية <Hl>مخصصة</Hl> للزجاج</>],
    background: { src: "media/rek-windshield.webp", move: { scale: [1.06, 1.15], x: [1.5, -1.5], y: [0, -1], focus: "55% 45%" }, exposure: 0.66 },
    thumb: { src: "media/rek-windshield-ppf.jpg", focus: "55% 45%" },
  },
];
