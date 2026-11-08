export function blocked(x: number, z: number, doorOpen: boolean) {
  if (Math.abs(x) > 43 || z < -30 || z > 36) return true;
  // Solid home envelope, with two genuine door apertures.
  if (Math.abs(x) < 5.2 && Math.abs(x) > 4.6 && z > -4.2 && z < 10.2)
    return true;
  if (Math.abs(x) < 5.2 && z > -4.35 && z < -3.65) return true;
  if (
    Math.abs(x) < 5.2 &&
    z > 3.65 &&
    z < 4.35 &&
    (Math.abs(x) > 1.05 || !doorOpen)
  )
    return true;
  if (Math.abs(x) < 5.2 && z > 9.65 && z < 10.35 && Math.abs(x) > 1.05)
    return true;
  if (z < -1.55 && z > -3.7 && ((x < -0.2 && x > -3) || (x > 2.3 && x < 4.6)))
    return true;
  if (x < -2.2 && x > -4.6 && z < 1.5 && z > -1.6) return true;
  if (x > 2.6 && x < 4.6 && z > 1.3 && z < 3.6) return true;
  if (x < -1.8 && x > -4.6 && z > 5 && z < 7.3) return true; // sofa
  if (x > 2.5 && x < 4.6 && z > 4.5 && z < 7.4) return true; // kitchen
  for (const hx of [-18, 18])
    if (Math.abs(x - hx) < 5.6 && z > -4.5 && z < 10.5) return true;
  return false;
}

export function movePlayer(
  position: [number, number],
  dx: number,
  dz: number,
  doorOpen: boolean,
): [number, number] {
  let [x, z] = position;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.1));
  for (let i = 0; i < steps; i++) {
    if (!blocked(x + dx / steps, z, doorOpen)) x += dx / steps;
    if (!blocked(x, z + dz / steps, doorOpen)) z += dz / steps;
  }
  return [x, z];
}
