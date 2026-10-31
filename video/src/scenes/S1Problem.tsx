import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ease, tw} from '../lib/anim';
import {C, SAFE} from '../theme';
import {Cam, mixV, V3} from '../three/Cam';
import {Canvas3D} from '../three/Canvas3D';
import {impactCamera, ImpactStone} from '../three/Impact';
import {WindshieldPanel} from '../three/Panel';
import {PanelStudio} from '../three/PanelStudio';
import {Flash, TopScrim, Vignette} from '../ui/Overlays';
import {ArabicTitle} from '../ui/Type';

export const S1_DUR = 186;
const HIT = 192; // never reached – the scene cuts on the dramatic pause before impact

/** THE PROBLEM – an isolated windshield floating in a dark studio; a stone approaches in slow motion. */
export const S1Problem: React.FC = () => {
	const f = useCurrentFrame();

	// panel floats and turns, settling square to camera before the stone arrives
	const settle = tw(f, [0, 118], [0, 1], ease.inOut);
	const rotY = (1 - settle) * -0.55;
	const rotX = (1 - settle) * 0.06;
	const bob = (1 - settle) * Math.sin(f * 0.05) * 0.03;

	// camera: slow orbit (wide) → push in to the impact point
	const A: V3 = [1.35, 0.32, 3.7];
	const B: V3 = [0.5, 0.12, 3.2];
	const macro = impactCamera(0.12);
	const k1 = tw(f, [0, 96], [0, 1], ease.inOut);
	const k2 = tw(f, [92, 168], [0, 1], ease.inOut);
	const pos = mixV(mixV(A, B, k1), macro.pos, k2);
	const look = mixV([0, 0.02, 0], macro.look, k2);
	const fov = 30 - k2 * 0;

	const flash = tw(f, [170, 184], [0, 1], ease.in);

	return (
		<AbsoluteFill style={{background: C.black}}>
			<Canvas3D exposure={1.25}>
				<PanelStudio f={f} />
				<Cam pos={pos} look={look} fov={fov} />
				<directionalLight position={[-3, 4, -4]} intensity={1.6} color="#9cc4ff" />
				<group rotation={[rotX, rotY, 0]} position={[0, bob, 0]}>
					<WindshieldPanel />
				</group>
				<ImpactStone f={f} hit={HIT} prot={false} />
			</Canvas3D>
			<Vignette strength={0.7} />
			<TopScrim opacity={0.55} />
			<div style={{position: 'absolute', top: SAFE.top + 30, left: SAFE.side, right: SAFE.side}}>
				<ArabicTitle text={'واجهة سيارتك\nمعرضة للخطر'} start={40} size={100} weight={600} />
			</div>
			<Flash opacity={flash} />
		</AbsoluteFill>
	);
};
