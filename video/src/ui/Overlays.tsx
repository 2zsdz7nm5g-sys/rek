import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C} from '../theme';

/** Animated film grain (deterministic per frame) */
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.07}) => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{opacity, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
			<svg width="100%" height="100%">
				<filter id={`grain${f % 8}`}>
					<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 97} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter={`url(#grain${f % 8})`} />
			</svg>
		</AbsoluteFill>
	);
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.75}) => (
	<AbsoluteFill
		style={{
			pointerEvents: 'none',
			background: `radial-gradient(ellipse 75% 60% at 50% 48%, rgba(0,0,0,0) 45%, rgba(1,3,8,${strength}) 100%)`,
		}}
	/>
);

/** subtle anamorphic blue streak */
export const Streak: React.FC<{y: number; opacity: number; width?: number}> = ({y, opacity, width = 1400}) => (
	<div
		style={{
			position: 'absolute',
			left: 540 - width / 2,
			top: y - 3,
			width,
			height: 6,
			opacity,
			background: `linear-gradient(90deg, rgba(61,169,255,0), ${C.blueHi} 50%, rgba(61,169,255,0))`,
			filter: 'blur(3px)',
			mixBlendMode: 'screen',
		}}
	/>
);

export const Flash: React.FC<{opacity: number; color?: string}> = ({opacity, color = '#d9efff'}) => (
	<AbsoluteFill style={{background: color, opacity, mixBlendMode: 'screen', pointerEvents: 'none'}} />
);
