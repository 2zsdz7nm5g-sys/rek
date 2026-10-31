import React, {useMemo} from 'react';
import * as THREE from 'three';

export const Backdrop: React.FC<{z?: number; y?: number; dim?: number; bokeh?: boolean}> = ({z = -3.6, y = 0.4, dim = 1, bokeh = false}) => {
	const tex = useMemo(() => {
		const cv = document.createElement('canvas');
		cv.width = 256;
		cv.height = 512;
		const c = cv.getContext('2d')!;
		const g = c.createRadialGradient(128, 300, 10, 128, 300, 300);
		g.addColorStop(0, '#16426e');
		g.addColorStop(0.45, '#0a2742');
		g.addColorStop(1, '#020409');
		c.fillStyle = g;
		c.fillRect(0, 0, 256, 512);
		if (bokeh) {
			// soft out-of-focus studio lights painted into the (opaque) backdrop so they refract through glass
			let seed = 3;
			const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
			for (let i = 0; i < 26; i++) {
				const x = rnd() * 256;
				const yy = 60 + rnd() * 380;
				const r = 6 + rnd() * 16;
				const col = i % 3 === 0 ? '255,214,170' : i % 3 === 1 ? '99,199,255' : '230,240,255';
				const b = c.createRadialGradient(x, yy, 0, x, yy, r);
				b.addColorStop(0, `rgba(${col},0.32)`);
				b.addColorStop(0.75, `rgba(${col},0.26)`);
				b.addColorStop(1, `rgba(${col},0)`);
				c.fillStyle = b;
				c.beginPath();
				c.arc(x, yy, r, 0, Math.PI * 2);
				c.fill();
			}
		}
		const t = new THREE.CanvasTexture(cv);
		t.colorSpace = THREE.SRGBColorSpace;
		return t;
	}, [bokeh]);
	return (
		<mesh position={[0, y, z]}>
			<planeGeometry args={[9, 16]} />
			<meshBasicMaterial map={tex} toneMapped={false} color={new THREE.Color(dim, dim, dim)} />
		</mesh>
	);
};

export const GridFloor: React.FC<{y: number}> = ({y}) => {
	const tex = useMemo(() => {
		const cv = document.createElement('canvas');
		cv.width = cv.height = 1024;
		const c = cv.getContext('2d')!;
		c.fillStyle = '#04101d';
		c.fillRect(0, 0, 1024, 1024);
		for (let i = 0; i <= 1024; i += 32) {
			const major = i % 128 === 0;
			c.fillStyle = major ? 'rgba(99,199,255,0.5)' : 'rgba(61,169,255,0.16)';
			c.fillRect(i - (major ? 1.5 : 0.75), 0, major ? 3 : 1.5, 1024);
			c.fillRect(0, i - (major ? 1.5 : 0.75), 1024, major ? 3 : 1.5);
		}
		const v = c.createRadialGradient(512, 512, 80, 512, 512, 512);
		v.addColorStop(0, 'rgba(2,4,9,0)');
		v.addColorStop(1, 'rgba(2,4,9,1)');
		c.fillStyle = v;
		c.fillRect(0, 0, 1024, 1024);
		const t = new THREE.CanvasTexture(cv);
		t.colorSpace = THREE.SRGBColorSpace;
		t.anisotropy = 8;
		return t;
	}, []);
	return (
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
			<planeGeometry args={[5, 5]} />
			<meshBasicMaterial map={tex} toneMapped={false} />
		</mesh>
	);
};


/** Dark reflective studio floor with soft contact shadow */
export const StudioFloor: React.FC<{color?: string; y?: number; shadow?: [number, number]}> = ({color = '#05080d', y = 0, shadow: sh = [2.9, 6.0]}) => {
	const shadow = useMemo(() => {
		const cv = document.createElement('canvas');
		cv.width = cv.height = 256;
		const c = cv.getContext('2d')!;
		const g = c.createRadialGradient(128, 128, 10, 128, 128, 128);
		g.addColorStop(0, 'rgba(0,0,0,0.95)');
		g.addColorStop(0.55, 'rgba(0,0,0,0.6)');
		g.addColorStop(1, 'rgba(0,0,0,0)');
		c.fillStyle = g;
		c.fillRect(0, 0, 256, 256);
		return new THREE.CanvasTexture(cv);
	}, []);
	return (
		<group>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
				<planeGeometry args={[80, 80]} />
				<meshPhysicalMaterial color={color} roughness={0.32} metalness={0.6} clearcoat={0.5} clearcoatRoughness={0.2} />
			</mesh>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y + 0.003, -0.05]}>
				<planeGeometry args={sh} />
				<meshBasicMaterial map={shadow} transparent depthWrite={false} />
			</mesh>
		</group>
	);
};

