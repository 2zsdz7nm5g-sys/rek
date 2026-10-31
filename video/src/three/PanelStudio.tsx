import React from 'react';
import {Env, EnvStrip} from './env';
import {Backdrop} from './Stage';

/** Dark premium studio for the floating windshield panel. */
export const PanelStudio: React.FC<{f: number; extra?: EnvStrip[]; backdropDim?: number}> = ({f, extra, backdropDim = 0.3}) => (
	<>
		<Env
			preset="studio"
			extra={
				extra ?? [
					{dir: [0.15, 0.55, 1], w: 26, h: 0.18, intensity: 3.5},
					{dir: [-1, 0.35, 0.3], w: 2.2, h: 22, intensity: 2.2, color: '#dbe9ff'},
					{dir: [0.9, 0.2, -0.6], w: 1.2, h: 22, intensity: 2.6, color: '#63c7ff'},
				]
			}
			rotation={[0, f * 0.002, 0]}
			intensity={1.0}
			background="#020409"
		/>
		<Backdrop z={-4} y={0.5} dim={backdropDim} bokeh />
	</>
);
