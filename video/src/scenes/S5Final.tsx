import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {ease, tw} from '../lib/anim';
import {arabicFont, C, latinFont} from '../theme';
import {Cam} from '../three/Cam';
import {Canvas3D} from '../three/Canvas3D';
import {ShieldLayer} from '../three/Impact';
import {WindshieldPanel} from '../three/Panel';
import {PanelStudio} from '../three/PanelStudio';
import {Streak, Vignette} from '../ui/Overlays';
import {ArabicTitle, Rule} from '../ui/Type';

export const S5_DUR = 330;
export const LOGO_HIT = 228; // ≈ 36.6 s on the master timeline

const LogoCard: React.FC<{f: number}> = ({f}) => {
	const p = tw(f, [LOGO_HIT - 10, LOGO_HIT + 22], [0, 1], ease.out);
	const sheen = tw(f, [LOGO_HIT + 14, LOGO_HIT + 50], [-60, 160], ease.inOut);
	const size = 440;
	return (
		<div
			style={{
				position: 'absolute',
				left: (1080 - size) / 2,
				top: 470,
				width: size,
				height: size,
				opacity: p,
				transform: `scale(${0.9 + 0.1 * p}) translateY(${(1 - p) * 30}px)`,
				filter: `blur(${(1 - p) * 14}px)`,
			}}
		>
			<div style={{position: 'absolute', inset: -70, borderRadius: 120, background: 'radial-gradient(closest-side, rgba(61,169,255,0.42), rgba(61,169,255,0))'}} />
			<div
				style={{
					position: 'absolute',
					inset: 0,
					borderRadius: 38,
					overflow: 'hidden',
					border: '1.5px solid rgba(195,211,227,0.55)',
					boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 60px rgba(61,169,255,0.25)',
				}}
			>
				<Img src={staticFile('brand/rek-proffset-logo.png')} style={{width: '100%', height: '100%', display: 'block'}} />
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background: `linear-gradient(115deg, rgba(255,255,255,0) ${sheen - 18}%, rgba(255,255,255,0.38) ${sheen}%, rgba(255,255,255,0) ${sheen + 18}%)`,
						mixBlendMode: 'screen',
					}}
				/>
			</div>
		</div>
	);
};

const Line: React.FC<{f: number; start: number; children: React.ReactNode; size: number; color: string; weight?: number}> = ({f, start, children, size, color, weight = 500}) => {
	const p = tw(f, [start, start + 18], [0, 1], ease.out);
	return (
		<div dir="rtl" style={{textAlign: 'center', fontFamily: arabicFont, fontSize: size, fontWeight: weight, color, opacity: p, transform: `translateY(${(1 - p) * 20}px)`, filter: `blur(${(1 - p) * 8}px)`}}>
			{children}
		</div>
	);
};

/** FINAL REVEAL – orbit around the protected, isolated windshield, then the REK Proffset end card. */
export const S5Final: React.FC = () => {
	const f = useCurrentFrame();

	// orbit: front-left → grazing right (reveals the 6 mm layer at the edge) → settle
	const th = tw(f, [0, 196], [-0.62, 1.22], ease.inOut) - tw(f, [196, 236], [0, 1.0], ease.inOut);
	const r = tw(f, [0, 196], [4.4, 3.1], ease.inOut) + tw(f, [196, 236], [0, 1.4], ease.inOut);
	const h = 0.32 - tw(f, [0, 196], [0, 0.22], ease.inOut);
	const pos: [number, number, number] = [Math.sin(th) * r, h, Math.cos(th) * r];
	const look: [number, number, number] = [Math.sin(th) * 0.18, 0, 0];

	const sweep = tw(f, [24, 160], [-0.3, 1.4], ease.inOut);
	const dim = tw(f, [LOGO_HIT - 18, LOGO_HIT + 10], [1, 0.2], ease.inOut);

	return (
		<AbsoluteFill style={{background: C.black}}>
			<AbsoluteFill style={{opacity: dim, filter: `blur(${(1 - dim) * 10}px)`}}>
				<Canvas3D exposure={1.25}>
					<PanelStudio f={f} />
					<Cam pos={pos} look={look} fov={30} />
					<directionalLight position={[-3, 4, -4]} intensity={1.6} color="#9cc4ff" />
					<group position={[0, Math.sin(f * 0.04) * 0.015, 0]}>
						<WindshieldPanel />
						<ShieldLayer dent={0} rip={0} t={0} edge={1} sweep={sweep} />
					</group>
				</Canvas3D>
			</AbsoluteFill>
			<Vignette strength={0.65} />

			<Streak y={690} opacity={tw(f, [LOGO_HIT - 14, LOGO_HIT, LOGO_HIT + 20], [0, 1, 0])} width={1600} />
			<LogoCard f={f} />
			<div style={{position: 'absolute', top: 1020, left: 60, right: 60}}>
				<ArabicTitle text="درع حماية الزجاج الأمامي" start={LOGO_HIT + 14} size={78} weight={600} />
				<Rule start={LOGO_HIT + 26} width={280} style={{marginTop: 18, marginBottom: 26}} />
				<Line f={f} start={LOGO_HIT + 30} size={60} color={C.blueHi} weight={600}>
					سماكة <span dir="ltr" style={{fontFamily: latinFont, fontWeight: 700}}>6mm</span>
				</Line>
				<div style={{height: 14}} />
				<Line f={f} start={LOGO_HIT + 42} size={52} color={C.silver}>
					متوفر لدى{' '}
					<span dir="ltr" style={{fontFamily: latinFont, fontWeight: 700, letterSpacing: '0.06em', color: C.silverHi}}>
						REK <span style={{color: C.blueHi}}>Proffset</span>
					</span>
				</Line>
			</div>
		</AbsoluteFill>
	);
};
