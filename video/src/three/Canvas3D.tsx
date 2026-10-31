import {ThreeCanvas} from '@remotion/three';
import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import * as THREE from 'three';

/**
 * ThreeCanvas rendered at a reduced internal resolution and scaled up to the frame.
 * Software-GL render time scales with pixel count; film grain + soft cinematic
 * lighting hide the difference, while all typography stays full-resolution DOM.
 */
export const RENDER_SCALE = 0.75;

export const Canvas3D: React.FC<{children: React.ReactNode; exposure?: number}> = ({children, exposure = 1.2}) => {
	const {width, height} = useVideoConfig();
	const w = Math.round(width * RENDER_SCALE);
	const h = Math.round(height * RENDER_SCALE);
	return (
		<AbsoluteFill>
			<div style={{width: w, height: h, transform: `scale(${1 / RENDER_SCALE})`, transformOrigin: 'top left'}}>
				<ThreeCanvas
					width={w}
					height={h}
					dpr={1}
					gl={{antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: exposure, powerPreference: 'high-performance'}}
				>
					{children}
				</ThreeCanvas>
			</div>
		</AbsoluteFill>
	);
};
