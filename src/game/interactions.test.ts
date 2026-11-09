import { it, expect } from "vitest";
import { visibleStation } from "./interactions";
import { newGame } from "./simulation";
it("selects one nearby station using direction and hides stations across partitions", () => {
  const g = newGame();
  g.player = [-0.5, -1.3];
  expect(visibleStation(g, Math.PI)?.id).toBe("computer");
  g.player = [3.3, -1.3];
  expect(visibleStation(g, Math.PI)?.id).toBe("production");
  g.player = [0, 5];
  expect(visibleStation(g, Math.PI)?.id).toBe("door");
  g.player = [-3.5, 4.5];
  expect(visibleStation(g, Math.PI)).toBeUndefined();
  g.player = [0, 2];
  expect(visibleStation(g, Math.PI)).toBeUndefined();
  g.player = [0, 9.5];
  expect(visibleStation(g, 0)?.id).not.toBe("receiving");
});
