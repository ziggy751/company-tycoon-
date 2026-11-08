import * as THREE from "three";
export function safeCameraPosition(
  target: THREE.Vector3,
  desired: THREE.Vector3,
  objects: THREE.Object3D[],
  margin = 0.22,
) {
  const direction = desired.clone().sub(target),
    distance = direction.length();
  if (!distance) return desired.clone();
  const ray = new THREE.Raycaster(
    target,
    direction.normalize(),
    0.25,
    distance + margin,
  );
  const hit = ray.intersectObjects(objects, false)[0];
  return hit
    ? target
        .clone()
        .addScaledVector(direction, Math.max(0.3, hit.distance - margin))
    : desired.clone();
}
