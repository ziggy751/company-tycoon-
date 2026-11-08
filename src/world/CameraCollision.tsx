import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { safeCameraPosition } from "./camera";
export function CameraCollision() {
  const { scene, camera, controls, gl } = useThree();
  useFrame(() => {
    const orbit = controls as unknown as { target: THREE.Vector3 } | null;
    if (!orbit) return;
    const objects: THREE.Object3D[] = [];
    scene.traverse((o) => {
      if (o.userData.cameraSolid) objects.push(o);
    });
    camera.position.copy(
      safeCameraPosition(orbit.target, camera.position, objects),
    );
    const pose = [...camera.position.toArray(), ...orbit.target.toArray()]
      .map((v) => v.toFixed(3))
      .join(",");
    if (gl.domElement.dataset.camera !== pose)
      gl.domElement.dataset.camera = pose;
  });
  return null;
}
