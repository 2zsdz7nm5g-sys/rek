import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ArabicTextBlock } from "../components/ArabicTextBlock";
import { CinematicBackground } from "../components/CinematicBackground";
import { Narration, Sfx } from "../components/Narration";
import { PdrIllustration } from "../components/PdrIllustration";
import { ServiceThumbnail, THUMB } from "../components/ServiceThumbnail";
import type { Service } from "../data/services";
import type { SceneTiming } from "../data/timeline";

/**
 * Shared service layout: full-frame animated background, small thumbnail on the right
 * (top-centre in vertical), Arabic title and explanation over the background.
 */
export const ServiceScene: React.FC<{ service: Service; timing: SceneTiming }> = ({ service, timing }) => {
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  const box = vertical ? THUMB.vertical : THUMB.landscape;
  const { background: bg } = service;

  return (
    <AbsoluteFill>
      <CinematicBackground
        src={bg.src}
        move={bg.move}
        exposure={bg.exposure}
        saturation={bg.saturation}
        textSide={vertical ? "bottom" : "left"}
      />
      <ServiceThumbnail src={service.thumb.src} focus={service.thumb.focus} label={service.label} enterAt={12}>
        {service.thumb.illustration === "pdr" ? (
          <PdrIllustration
            w={box.width}
            h={box.height}
            repairFrom={timing.voFrom + Math.round(timing.voFrames * 0.25)}
            repairTo={timing.voFrom + Math.round(timing.voFrames * 0.85)}
          />
        ) : null}
      </ServiceThumbnail>
      <ArabicTextBlock title={service.title} lines={service.lines} startAt={18} titleSize={service.titleSize} />
      <Narration timing={timing} />
      {service.sfx ? <Sfx {...service.sfx} /> : null}
    </AbsoluteFill>
  );
};
