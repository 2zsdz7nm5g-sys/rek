import React, {useMemo} from 'react';
import {ease, tw} from '../lib/anim';
import {C} from '../theme';
import {Cam, V3} from './Cam';
import {Env} from './env';
import {GelSlab} from './Gel';
import {Cracks, EnergyWaves, GLASS, Laminate, PVB, SHIELD, sectionGelMat, Stone} from './Laminate';
import {Backdrop} from './Stage';

/* ------------------ cross-section: laminate + 6 mm shield ------------------ */
export const W = 2.4;
export const D = 0.5;
export const xCam: V3 = [0.75, 0.5, 2.6];
export const xLook: V3 = [0, -0.03, 0];
export const X_FOV = 17;

const xStone = (f: number, hit: number, top: number, prot: boolean): V3 => {
	if (f <= hit) {
		const t = tw(f, [hit - 40, hit], [0, 1], (x) => x * x * 0.35 + x * 0.65);
		return [-0.26 + 0.26 * t, top + 0.028 + 0.24 * (1 - t), 0];
	}
	const t = (f - hit) / 30;
	const k = prot ? 1 : 1.5;
	return [t * 0.12 * k, top + 0.028 + t * 0.2 * k - t * t * 0.25, 0];
};

/** fine light lines along each layer boundary on the cut face */
const EdgeLines: React.FC<{prot: boolean}> = ({prot}) => {
	const ys = [SHIELD, 0, -GLASS, -GLASS - PVB, -GLASS * 2 - PVB];
	// (the SHIELD line is only drawn when the shield is present)
	return (
		<group>
			{ys.filter((_, i) => prot || i > 0).map((y, i) => (
				<mesh key={i} position={[0, y, D / 2 + 0.001]}>
					<boxGeometry args={[W, 0.0016, 0.001]} />
					<meshBasicMaterial color={i === 0 || i === 1 ? '#9fdcff' : '#d9e6f2'} toneMapped={false} transparent opacity={i === 0 ? 0.9 : 0.55} />
				</mesh>
			))}
		</group>
	);
};

/** Cross-section of the laminated windshield, optionally with the 6 mm shield on top. */
export const CrossSection: React.FC<{f: number; hit: number; prot: boolean; from?: number; dur?: number}> = ({f, hit, prot, from = 0, dur = 80}) => {
	const gel = useMemo(sectionGelMat, []);
	const t = Math.max(0, (f - hit) / 30);
	const press = prot && f >= hit ? Math.exp(-t * 8) * Math.min(1, (f - hit + 1) / 3) : 0;
	const top = prot ? SHIELD : 0;
	const s = xStone(f, hit, top, prot);
	const drift = tw(f, [from, from + dur], [0, 1], ease.soft);
	const crack = tw(f, [hit, hit + 22], [0, 1], ease.out);
	return (
		<>
			<Env preset="studio" rotation={[0, 0.9 + f * 0.002, 0]} intensity={1.0} background="#03070d" />
			<Cam pos={[xCam[0] - drift * 0.08, xCam[1] - drift * 0.04, xCam[2] - drift * 0.2]} look={xLook} fov={X_FOV} />
			<Backdrop z={-3} y={0} dim={0.16} />
			<EdgeLines prot={prot} />
			<pointLight position={[0, 0.8, 1.2]} intensity={3} distance={5} color="#eaf4ff" />
			<pointLight position={[-1.2, -0.4, 1]} intensity={2} distance={4} color={C.blue} />
			<Laminate w={W} d={D} />
			{!prot && <Cracks progress={crack} z={D / 2 + 0.0025} yTop={0} yMin={-GLASS + 0.003} width={0.0014} spread={0.45} />}
			{prot && (
			<GelSlab
				w={W}
				d={D}
				t={SHIELD}
				radius={0.01}
				position={[0, SHIELD / 2, 0]}
				seg={[160, 4, 30]}
				material={gel}
				deform={{
					press: {x: 0, z: 0, depth: SHIELD * 0.5 * press, radius: 0.05},
					ripple: f > hit ? {x: 0, z: 0, t, amp: SHIELD * 0.14} : undefined,
				}}
			/>
			)}
			{prot && <EnergyWaves t={t} y={SHIELD / 2} z={D / 2 + 0.004} />}
			<Stone pos={[s[0], s[1] - press * SHIELD * 0.45, 0]} rot={f * 0.1} size={0.028} />
		</>
	);
};

