import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
export function LoadedChair() {
  const { scene } = useGLTF("/assets/furniture/SheenChair.glb", false, false);
  const model = useMemo(() => {
    const copy = scene.clone(true);
    const box = new THREE.Box3().setFromObject(copy),
      size = box.getSize(new THREE.Vector3()),
      center = box.getCenter(new THREE.Vector3());
    copy.position.set(-center.x, -box.min.y, -center.z);
    const root = new THREE.Group();
    root.add(copy);
    root.scale.setScalar(1.05 / size.y);
    root.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        o.userData.cameraSolid = true;
      }
    });
    return root;
  }, [scene]);
  return (
    <primitive
      object={model}
      position={[-1.4, 0, -1.7]}
      rotation={[0, Math.PI, 0]}
    />
  );
}
