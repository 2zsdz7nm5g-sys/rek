import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ease, tw} from '../lib/anim';
import {C, SAFE} from '../theme';
import {Cam, projectToScreen} from '../three/Cam';
import {Canvas3D} from '../three/Canvas3D';
import {ImpactShot} from '../three/Impact';
import {GLASS, PVB, SHIELD} from '../three/Laminate';
import {CrossSection, D, X_FOV, xCam, xLook} from '../three/Section';
import {Streak, TopScrim, Vignette} from '../ui/Overlays';
import {ArabicTitle, TechLabel} from '../ui/Type';

export const S4_DUR = 276;
const A_HIT = 84; // protected impact, same shot as BEFORE
const X_FROM = 104; // cross-section
const X_HIT = 150;
const S_FROM = 186; // split screen
const S_HIT = 240;

export const S4After: React.FC = () => {
	const f = useCurrentFrame();
	const {width, height} = useVideoConfig();

	const inA = f < X_FROM + 4;
	const inX = f >= X_FROM - 4 && f < S_FROM + 4;
	const inS = f >= S_FROM - 4;
	const xIn = tw(f, [X_FROM - 6, X_FROM + 6], [0, 1]) * (1 - tw(f, [S_FROM - 6, S_FROM + 6], [0, 1]));
	const sIn = tw(f, [S_FROM - 6, S_FROM + 6], [0, 1]);

	// cross-section labels anchored to the 3D layers
	const lblShield = projectToScreen([0.32, SHIELD * 0.6, D / 2], xCam, xLook, X_FOV, width, height);
	const lblGlass = projectToScreen([0.32, -GLASS - PVB / 2, D / 2], xCam, xLook, X_FOV, width, height);

	const sweep = tw(f, [4, 46], [-0.3, 1.35], ease.inOut);
	const edge = tw(f, [4, 24], [0, 1]) * (1 - tw(f, [60, 90], [0, 0.7]));

	return (
		<AbsoluteFill style={{background: C.black}}>
			{/* A: same shot as BEFORE, now with the shield */}
			{inA && (
				<AbsoluteFill style={{opacity: 1 - xIn}}>
					<Canvas3D exposure={1.3}>
						<ImpactShot f={f + 50} hit={A_HIT + 50} prot push={tw(f, [0, X_FROM], [0.2, 0.75], ease.inOut)} shieldEdge={edge} shieldSweep={sweep} Cam={Cam} />
					</Canvas3D>
				</AbsoluteFill>
			)}

			{/* B: cross-section */}
			{inX && (
				<AbsoluteFill style={{opacity: xIn}}>
					<Canvas3D exposure={0.9}>
						<CrossSection f={f} hit={X_HIT} prot from={X_FROM} dur={S_FROM - X_FROM} />
					</Canvas3D>
					<svg width={width} height={height} style={{position: 'absolute', inset: 0, opacity: tw(f, [X_FROM + 10, X_FROM + 24], [0, 1])}}>
						{[lblShield, lblGlass].map((p, i) => (
							<g key={i}>
								<circle cx={p.x} cy={p.y} r={6} fill={i === 0 ? C.blueHi : C.silver} />
								<line x1={p.x} y1={p.y} x2={p.x + 90} y2={p.y + (i === 0 ? -120 : 120)} stroke={i === 0 ? C.blueHi : C.silver} strokeWidth={2} />
							</g>
						))}
					</svg>
					<div style={{position: 'absolute', top: lblShield.y - 300, right: 80, opacity: tw(f, [X_FROM + 14, X_FROM + 28], [0, 1])}}>
						<ArabicTitle text="درع الحماية 6mm" start={X_FROM + 14} size={56} weight={600} color={C.blueHi} />
					</div>
					<div style={{position: 'absolute', top: lblGlass.y + 190, right: 80, opacity: tw(f, [X_FROM + 18, X_FROM + 32], [0, 1])}}>
						<ArabicTitle text="الزجاج الأمامي" start={X_FROM + 18} size={52} weight={500} color={C.silver} glow={false} />
					</div>
				</AbsoluteFill>
			)}

			{/* C: split screen – LEFT unprotected, RIGHT protected; identical shot, simultaneous impact */}
			{inS && (
				<AbsoluteFill style={{opacity: sIn}}>
					<div style={{position: 'absolute', left: 0, top: 0, width: 540, height: 1920, overflow: 'hidden'}}>
						<Canvas3D exposure={1.3} width={540}>
							<ImpactShot f={f} hit={S_HIT} prot={false} push={0.55} Cam={Cam} />
						</Canvas3D>
					</div>
					<div style={{position: 'absolute', left: 540, top: 0, width: 540, height: 1920, overflow: 'hidden'}}>
						<Canvas3D exposure={1.3} width={540}>
							<ImpactShot f={f} hit={S_HIT} prot push={0.55} shieldEdge={0.35} Cam={Cam} />
						</Canvas3D>
					</div>
					<div style={{position: 'absolute', left: 539, top: 0, width: 2, height: 1920, background: `linear-gradient(to bottom, rgba(99,199,255,0), ${C.blueHi} 30%, ${C.blueHi} 70%, rgba(99,199,255,0))`, boxShadow: `0 0 18px ${C.blue}`}} />
					<TopScrim height={760} />
					<div style={{position: 'absolute', top: 470, left: 0, width: 540}}>
						<ArabicTitle text="بدون حماية" start={S_FROM + 4} size={54} weight={500} color={C.silver} glow={false} />
					</div>
					<div style={{position: 'absolute', top: 470, left: 540, width: 540}}>
						<ArabicTitle text="مع درع الحماية" start={S_FROM + 8} size={54} weight={600} color={C.blueHi} />
					</div>
				</AbsoluteFill>
			)}

			<Vignette strength={0.5} />
			{!inS && <TopScrim />}
			<div style={{position: 'absolute', top: SAFE.top, left: 60, right: 60}}>
				<TechLabel text="After Protection" start={6} size={58} color={C.blueHi} weight={700} />
				<div style={{height: 18}} />
				<ArabicTitle text="حماية إضافية للزجاج الأمامي" start={14} size={68} weight={600} />
			</div>
			<Streak y={960} opacity={tw(f, [X_FROM - 8, X_FROM, X_FROM + 10], [0, 0.8, 0]) + tw(f, [S_FROM - 8, S_FROM, S_FROM + 10], [0, 0.8, 0])} />
		</AbsoluteFill>
	);
};

