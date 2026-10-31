import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ease, tw} from '../lib/anim';
import {C, SAFE} from '../theme';
import {Cam, projectToScreen} from '../three/Cam';
import {Canvas3D} from '../three/Canvas3D';
import {ImpactShot} from '../three/Impact';
import {GLASS, PVB} from '../three/Laminate';
import {CrossSection, D, X_FOV, xCam, xLook} from '../three/Section';
import {Streak, TopScrim, Vignette} from '../ui/Overlays';
import {ArabicTitle, TechLabel} from '../ui/Type';

export const S3_DUR = 216;
export const S3_HIT = 112;
const X_FROM = 146;
const X_HIT = 178;

/** BEFORE PROTECTION – macro impact on bare glass, then the same impact in cross-section. */
export const S3Before: React.FC = () => {
	const f = useCurrentFrame();
	const {width, height} = useVideoConfig();
	const push = tw(f, [0, X_FROM], [0, 1], ease.inOut);
	const xIn = tw(f, [X_FROM - 6, X_FROM + 6], [0, 1]);
	const lbl = projectToScreen([0.32, -GLASS - PVB / 2, D / 2], xCam, xLook, X_FOV, width, height);
	return (
		<AbsoluteFill style={{background: C.black}}>
			{f < X_FROM + 6 && (
				<AbsoluteFill style={{opacity: 1 - xIn}}>
					<Canvas3D exposure={1.3}>
						<ImpactShot f={f} hit={S3_HIT} prot={false} push={push} Cam={Cam} />
					</Canvas3D>
				</AbsoluteFill>
			)}
			{f >= X_FROM - 6 && (
				<AbsoluteFill style={{opacity: xIn}}>
					<Canvas3D exposure={0.9}>
						<CrossSection f={f} hit={X_HIT} prot={false} from={X_FROM} dur={S3_DUR - X_FROM} />
					</Canvas3D>
					<div style={{position: 'absolute', top: lbl.y + 190, right: 80}}>
						<ArabicTitle text="الزجاج الأمامي" start={X_FROM + 10} size={52} weight={500} color={C.silver} glow={false} />
					</div>
				</AbsoluteFill>
			)}
			<Vignette strength={0.55} />
			<TopScrim />
			<div style={{position: 'absolute', top: SAFE.top, left: 60, right: 60}}>
				<TechLabel text="Before Protection" start={6} size={58} color={C.silverHi} weight={700} />
				<div style={{height: 18}} />
				<ArabicTitle text="زجاج بدون درع حماية" start={14} size={70} weight={500} color={C.silver} />
			</div>
			<Streak y={960} opacity={tw(f, [X_FROM - 8, X_FROM, X_FROM + 10], [0, 0.8, 0])} />
		</AbsoluteFill>
	);
};
