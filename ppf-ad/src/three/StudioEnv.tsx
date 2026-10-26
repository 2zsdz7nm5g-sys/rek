import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

// A dark studio with long softbox strips, baked into a PMREM environment map.
// The strips are what draw the long highlight bands across glossy paint.
type Mood = "warm" | "cool";

const strip = (
  scene: THREE.Scene,
  w: number,
  h: number,
  pos: [number, number, number],
  color: string,
  intensity: number,
) => {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(intensity),
      side: THREE.DoubleSide,
    }),
  );
  m.position.set(...pos);
  m.lookAt(0, 0, 0);
  scene.add(m);
};

export const StudioEnv: React.FC<{ mood?: Mood; strength?: number }> = ({
  mood = "cool",
  strength = 1,
}) => {
  const gl = useThree((s) => s.gl);

  // Built during render (not in an effect) so the very first rendered frame
  // already has reflections.
  const tex = useMemo(() => {
    const env = new THREE.Scene();
    env.background = new THREE.Color(mood === "warm" ? "#060302" : "#02060b");
    const k = strength;
    if (mood === "warm") {
      // Low, single hard key with an amber spill: tension.
      strip(env, 10, 0.8, [0, 10, 0], "#ffd9b0", 2.2 * k);
      strip(env, 18, 0.45, [0, 3.2, -10], "#ffb36b", 3.0 * k);
      strip(env, 0.7, 9, [-10, 2, 2], "#ff8a3a", 1.4 * k);
      strip(env, 18, 0.25, [0, 1.6, 10], "#ffe2c2", 1.0 * k);
    } else {
      // Car-commercial studio: big overhead softbox, horizon bands, side strips.
      strip(env, 9, 5, [0, 11, 0], "#ffffff", 2.4 * k);
      strip(env, 22, 0.7, [0, 3.6, -11], "#ffffff", 3.6 * k);
      strip(env, 22, 0.3, [0, 1.9, -11], "#cfe8ff", 2.4 * k);
      strip(env, 22, 0.5, [0, 3.0, 11], "#ffffff", 2.2 * k);
      strip(env, 1.2, 14, [-11, 3, 2], "#eaf4ff", 2.4 * k);
      strip(env, 1.2, 14, [11, 3, -2], "#eaf4ff", 2.0 * k);
      strip(env, 0.4, 14, [9, 2, 7], "#5BB8F2", 2.0 * k);
      strip(env, 0.4, 14, [-9, 2, -7], "#5BB8F2", 1.4 * k);
    }
    const pmrem = new THREE.PMREMGenerator(gl);
    const t = pmrem.fromScene(env, 0.015).texture;
    pmrem.dispose();
    return t;
  }, [gl, mood, strength]);

  useEffect(() => () => tex.dispose(), [tex]);

  return <primitive object={tex} attach="environment" />;
};
