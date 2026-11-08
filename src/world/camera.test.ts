import { expect, it } from "vitest";
import * as THREE from "three";
import { safeCameraPosition } from "./camera";
it("shortens a camera ray before a wall and restores unobstructed views", () => {
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(4, 4, 0.2),
    new THREE.MeshBasicMaterial(),
  );
  wall.position.z = 2;
  wall.updateMatrixWorld();
  const origin = new THREE.Vector3(0, 0, 0),
    desired = new THREE.Vector3(0, 0, 5);
  const safe = safeCameraPosition(origin, desired, [wall]);
  expect(safe.z).toBeLessThan(1.9);
  expect(safe.z).toBeGreaterThan(1);
  expect(safeCameraPosition(origin, new THREE.Vector3(5, 0, 0), [wall]).x).toBe(
    5,
  );
  wall.geometry.dispose();
});
