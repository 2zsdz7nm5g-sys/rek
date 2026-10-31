import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../theme';

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

/** soft dark gradient behind top-of-frame titles (legibility without boxes) */
export const TopScrim: React.FC<{height?: number; opacity?: number}> = ({height = 620, opacity = 0.75}) => (
	<div
		style={{
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			height,
			pointerEvents: 'none',
			background: `linear-gradient(to bottom, rgba(1,3,8,${opacity}), rgba(1,3,8,0))`,
		}}
	/>
);
