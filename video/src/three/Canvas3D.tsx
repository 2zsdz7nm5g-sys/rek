import {ThreeCanvas} from '@remotion/three';
import React from 'react';
import {AbsoluteFill} from 'remotion';
import * as THREE from 'three';

/** Native-resolution 3D canvas (ACES filmic tone mapping, MSAA). */
export const Canvas3D: React.FC<{
	children: React.ReactNode;
	exposure?: number;
	width?: number;
	height?: number;
	style?: React.CSSProperties;
}> = ({children, exposure = 1.2, width = 1080, height = 1920, style}) => (
	<AbsoluteFill style={{width, height, ...style}}>
		<ThreeCanvas
			width={width}
			height={height}
			dpr={1}
			gl={{antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: exposure, powerPreference: 'high-performance'}}
		>
			{children}
		</ThreeCanvas>
	</AbsoluteFill>
);
