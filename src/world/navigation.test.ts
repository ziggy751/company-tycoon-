import { expect, it } from "vitest";
import { blocked, movePlayer } from "./navigation";
it("keeps bedroom walls solid and opens a real route through the house to outside", () => {
  expect(blocked(0, 4, false)).toBe(true);
  expect(blocked(0, 4, true)).toBe(false);
  for (let z = 4; z < 14; z += 0.1) expect(blocked(0, z, true)).toBe(false);
  expect(blocked(4.9, 7, true)).toBe(true);
  expect(blocked(18, 3, true)).toBe(true);
  expect(blocked(0, -4, true)).toBe(true);
});

it("substeps low-frame-rate movement so elapsed time does not permit tunnelling", () => {
  expect(movePlayer([0, 3], 0, 3, false)[1]).toBeLessThan(3.66);
  expect(movePlayer([0, 3], 0, 10, true)[1]).toBeCloseTo(13);
});

it("garage computer desk stays solid while its interaction point is accessible", () => {
  expect(blocked(30, -18, true)).toBe(true);
  expect(blocked(30, -17.3, true)).toBe(false);
});
