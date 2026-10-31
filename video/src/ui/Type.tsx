import React from 'react';
import {useCurrentFrame} from 'remotion';
import {ease, tw} from '../lib/anim';
import {arabicFont, C, latinFont} from '../theme';

/**
 * Arabic headline – rendered RTL; each word rises out of a soft blur in reading order
 * (right → left). Words are kept intact so Arabic letter-joining is preserved.
 */
export const ArabicTitle: React.FC<{
	text: string;
	start: number;
	end?: number;
	size?: number;
	weight?: number;
	color?: string;
	stagger?: number;
	style?: React.CSSProperties;
	glow?: boolean;
}> = ({text, start, end = 99999, size = 92, weight = 600, color = C.silverHi, stagger = 4, style, glow = true}) => {
	const f = useCurrentFrame();
	const out = tw(f, [end - 12, end], [1, 0], ease.in);
	return (
		<div
			dir="rtl"
			lang="ar"
			style={{
				fontFamily: arabicFont,
				fontSize: size,
				fontWeight: weight,
				color,
				lineHeight: 1.35,
				textAlign: 'center',
				opacity: out,
				textShadow: glow ? '0 0 28px rgba(61,169,255,0.35), 0 2px 18px rgba(0,0,0,0.6)' : '0 2px 18px rgba(0,0,0,0.6)',
				...style,
			}}
		>
			{text.split('\n').map((line, li, lines) => {
				const before = lines.slice(0, li).join(' ').split(' ').filter(Boolean).length;
				return (
					<div key={li}>
						{line.split(' ').map((w, wi) => {
							const i = before + wi;
							const s = start + i * stagger;
							const p = tw(f, [s, s + 16], [0, 1], ease.out);
							return (
								<span
									key={wi}
									style={{
										display: 'inline-block',
										opacity: p,
										transform: `translateY(${(1 - p) * 26}px)`,
										filter: `blur(${(1 - p) * 10}px)`,
										marginInline: size * 0.12,
									}}
								>
									{w}
								</span>
							);
						})}
					</div>
				);
			})}
		</div>
	);
};

/** Latin technical label with tracking + reveal wipe */
export const TechLabel: React.FC<{
	text: string;
	start: number;
	end?: number;
	size?: number;
	color?: string;
	weight?: number;
	style?: React.CSSProperties;
}> = ({text, start, end = 99999, size = 44, color = C.blueHi, weight = 600, style}) => {
	const f = useCurrentFrame();
	const p = tw(f, [start, start + 18], [0, 1], ease.out);
	const out = tw(f, [end - 10, end], [1, 0], ease.in);
	return (
		<div
			dir="ltr"
			style={{
				fontFamily: latinFont,
				fontSize: size,
				fontWeight: weight,
				letterSpacing: `${0.18 - 0.08 * p}em`,
				textTransform: 'uppercase',
				color,
				textAlign: 'center',
				opacity: p * out,
				clipPath: `inset(0 ${(1 - p) * 50}% 0 ${(1 - p) * 50}%)`,
				textShadow: '0 0 22px rgba(61,169,255,0.45)',
				...style,
			}}
		>
			{text}
		</div>
	);
};

/** thin animated rule */
export const Rule: React.FC<{start: number; width?: number; style?: React.CSSProperties}> = ({start, width = 220, style}) => {
	const f = useCurrentFrame();
	const p = tw(f, [start, start + 20], [0, 1], ease.out);
	return (
		<div
			style={{
				width: width * p,
				height: 2,
				margin: '0 auto',
				background: `linear-gradient(90deg, rgba(99,199,255,0), ${C.blueHi}, rgba(99,199,255,0))`,
				...style,
			}}
		/>
	);
};
