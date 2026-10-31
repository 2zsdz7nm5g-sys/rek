import {useEffect, useMemo} from 'react';
import {continueRender, delayRender} from 'remotion';
import * as THREE from 'three';

/** Texture loader that blocks rendering until the image is decoded. */
export const useTex = (url: string) => {
	const handle = useMemo(() => delayRender(`texture ${url}`), [url]);
	const tex = useMemo(() => {
		const t = new THREE.TextureLoader().load(
			url,
			() => continueRender(handle),
			undefined,
			() => continueRender(handle),
		);
		t.colorSpace = THREE.SRGBColorSpace;
		t.anisotropy = 8;
		return t;
	}, [url, handle]);
	useEffect(() => () => continueRender(handle), [handle]);
	return tex;
};
