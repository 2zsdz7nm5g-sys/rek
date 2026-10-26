import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import { staticFile } from "remotion";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { makePaint } from "./paint";

// Concept car (CC BY 4.0, Eric Chadwick / Darmstadt Graphics Group, from a
// CC0 model by Unity Fan). Logos and plate are hidden; paint is ours.
const HIDE = ["License Plate", "InteriorSteeringEmblem"];

export const Car: React.FC<{
  color?: string;
  dull?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}> = ({ color = "#06080b", dull = 0, position, rotation, scale = 1 }) => {
  // useLoader suspends, which <ThreeCanvas> turns into a delayRender().
  const src = useLoader(GLTFLoader, staticFile("models/car.glb")).scene as THREE.Group;

  const obj = useMemo(() => {
    const paint = makePaint({ color, dull, repeat: 120 });
    const root = src.clone(true);
    root.traverse((o: THREE.Object3D) => {
      if (HIDE.includes(o.name)) o.visible = false;
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      const swapped = mats.map((mt: THREE.Material) =>
        mt.name?.startsWith("Paint") ? paint : mt,
      );
      m.material = Array.isArray(m.material) ? swapped : swapped[0];
    });
    // Normalise: 4.6 units long, centred, wheels on y=0, nose towards +z.
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const k = 4.6 / Math.max(size.x, size.z);
    const holder = new THREE.Group();
    root.scale.setScalar(k);
    const c = box.getCenter(new THREE.Vector3()).multiplyScalar(k);
    root.position.set(-c.x, -box.min.y * k, -c.z);
    holder.add(root);
    if (size.x > size.z) holder.rotation.y = Math.PI / 2;
    return holder;
  }, [src, color, dull]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={obj} />
    </group>
  );
};
