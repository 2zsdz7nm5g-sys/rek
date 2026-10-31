import {Easing, interpolate} from 'remotion';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const ease = {
	out: Easing.bezier(0.16, 1, 0.3, 1),
	inOut: Easing.bezier(0.65, 0, 0.35, 1),
	in: Easing.bezier(0.7, 0, 0.84, 0),
	soft: Easing.bezier(0.33, 1, 0.68, 1),
};

/** interpolate with clamping and easing */
export const tw = (
	f: number,
	input: number[],
	output: number[],
	easing: (t: number) => number = ease.inOut,
) => interpolate(f, input, output, {...clamp, easing});

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** deterministic pseudo-random in [0,1) */
export const rand = (seed: number) => {
	const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
	return x - Math.floor(x);
};
