import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {ease, tw} from '../lib/anim';
import {arabicFont, C, latinFont, SAFE} from '../theme';
import {Cam, mixV, V3} from '../three/Cam';
import {Car, StudioFloor, wsFrame} from '../three/Car';
import {Canvas3D} from '../three/Canvas3D';
import {Env} from '../three/env';
import {Grain, Streak, Vignette} from '../ui/Overlays';
import {ArabicTitle, Rule} from '../ui/Type';

export const S5_DUR = 300;
export const LOGO_HIT = 168; // local frame of the logo reveal accent

const LogoCard: React.FC<{f: number}> = ({f}) => {
	const p = tw(f, [LOGO_HIT - 10, LOGO_HIT + 22], [0, 1], ease.out);
	const sheen = tw(f, [LOGO_HIT + 14, LOGO_HIT + 50], [-60, 160], ease.inOut);
	const size = 470;
	return (
		<div
			style={{
				position: 'absolute',
				left: (1080 - size) / 2,
				top: 560,
				width: size,
				height: size,
				opacity: p,
				transform: `scale(${0.9 + 0.1 * p}) translateY(${(1 - p) * 30}px)`,
				filter: `blur(${(1 - p) * 14}px)`,
			}}
		>
			{/* glow */}
			<div style={{position: 'absolute', inset: -70, borderRadius: 120, background: 'radial-gradient(closest-side, rgba(61,169,255,0.45), rgba(61,169,255,0))'}} />
			<div
				style={{
					position: 'absolute',
					inset: 0,
					borderRadius: 40,
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
			{/* floor reflection */}
			<div
				style={{
					position: 'absolute',
					top: size + 18,
					left: 0,
					width: size,
					height: size * 0.35,
					overflow: 'hidden',
					borderRadius: 40,
					opacity: 0.22,
					transform: 'scaleY(-1)',
					maskImage: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0))',
					WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0))',
				}}
			>
				<Img src={staticFile('brand/rek-proffset-logo.png')} style={{width: size, height: size, display: 'block', marginTop: -size * 0.65}} />
			</div>
		</div>
	);
};

export const S5Final: React.FC = () => {
	const f = useCurrentFrame();

	// camera: windshield close-up → slow pull back & arc to the full front
	const ws = wsFrame(0.5, 0.5);
	const close: V3 = [ws.p.x + ws.n.x * 1.35 + 0.35, ws.p.y + ws.n.y * 1.35 - 0.15, ws.p.z + ws.n.z * 1.35 + 1.0];
	const closeLook: V3 = [ws.p.x, ws.p.y, ws.p.z];
	const wide: V3 = [3.3, 1.15, 7.0];
	const wideLook: V3 = [0, 0.78, 0.35];
	const k = tw(f, [0, 150], [0, 1], ease.inOut);
	const pos = mixV(close, wide, k);
	const look = mixV(closeLook, wideLook, Math.pow(k, 0.8));
	const fov = 30 + (1 - k) * 4;

	const glint = tw(f, [6, 80], [-0.35, 1.5], ease.inOut);
	const lights = tw(f, [58, 76], [0.08, 1], ease.out);
	const dim = tw(f, [150, 175], [1, 0.22], ease.inOut);

	return (
		<AbsoluteFill style={{background: C.black}}>
			<AbsoluteFill style={{opacity: dim, filter: `blur(${(1 - dim) * 10}px)`}}>
				<Canvas3D exposure={1.25}>
					<Env preset="studio" rotation={[0, -0.9 + f * 0.0035, 0]} intensity={1.0} background="#020409" />
					<Cam pos={pos} look={look} fov={fov} />
					<directionalLight position={[-3, 6, -5]} intensity={2.4} color="#9cc4ff" />
					<Car headlights={lights} shieldGlint={glint} />
					<StudioFloor />
				</Canvas3D>
			</AbsoluteFill>
			<Vignette strength={0.7} />

			{/* product line over the car */}
			<div style={{position: 'absolute', top: SAFE.top + 20, left: SAFE.side, right: SAFE.side}}>
				<ArabicTitle text={"درع حماية\nالزجاج الأمامي"} start={78} end={150} size={92} weight={600} />
			</div>

			<Streak y={820} opacity={tw(f, [LOGO_HIT - 14, LOGO_HIT, LOGO_HIT + 20], [0, 1, 0])} width={1600} />
			<LogoCard f={f} />

			<div style={{position: 'absolute', top: 1150, left: 60, right: 60}}>
				<ArabicTitle text="درع حماية الزجاج الأمامي" start={LOGO_HIT + 16} size={74} weight={600} />
				<Rule start={LOGO_HIT + 30} width={280} style={{marginTop: 18, marginBottom: 22}} />
				<div
					dir="rtl"
					style={{
						textAlign: 'center',
						fontFamily: arabicFont,
						fontSize: 52,
						fontWeight: 400,
						color: C.silver,
						opacity: tw(f, [LOGO_HIT + 34, LOGO_HIT + 52], [0, 1], ease.out),
						transform: `translateY(${(1 - tw(f, [LOGO_HIT + 34, LOGO_HIT + 52], [0, 1], ease.out)) * 20}px)`,
					}}
				>
					تركيب احترافي –{' '}
					<span dir="ltr" style={{fontFamily: latinFont, fontWeight: 700, letterSpacing: '0.06em', color: C.silverHi}}>
						REK <span style={{color: C.blueHi}}>Proffset</span>
					</span>
				</div>
			</div>
			<Grain />
		</AbsoluteFill>
	);
};
