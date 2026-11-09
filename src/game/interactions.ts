import { handHint } from "./workshop";
import type { Game } from "./simulation";
export type Station = {
  id: string;
  label: string;
  x: number;
  z: number;
  area: "bedroom" | "home" | "outside" | "garage";
};
export function stations(g: Game): Station[] {
  const list: Station[] = [
    ...(g.workshop?.enabled
      ? [
          {
            id: "shelf",
            label: "Use Material & Inspection Shelf",
            x: g.property === "garage" ? 30 : 1,
            z: g.property === "garage" ? -14 : -0.1,
            area:
              g.property === "garage"
                ? ("garage" as const)
                : ("bedroom" as const),
          },
        ]
      : []),
    {
      id: "computer",
      label: "Use Computer",
      x: -0.5,
      z: -1.35,
      area: "bedroom",
    },
    {
      id: "production",
      label: "Use Manufacturing Station",
      x: 3.3,
      z: -1.35,
      area: "bedroom",
    },
    {
      id: "orders",
      label: "Use Packing Station",
      x: 2.25,
      z: 2.2,
      area: "bedroom",
    },
    {
      id: "door",
      label: g.doorOpen ? "Close Door" : "Open Door",
      x: 0,
      z: 4,
      area: "home",
    },
    { id: "wardrobe", label: "Open Wardrobe", x: -3.5, z: 8.5, area: "home" },
    {
      id: "receiving",
      label: "Receive Deliveries",
      x: 0,
      z: 11,
      area: "outside",
    },
    ...(g.property === "garage"
      ? [
          {
            id: "production",
            label: "Use Workshop Bench",
            x: 27,
            z: -14.5,
            area: "garage" as const,
          },
          {
            id: "orders",
            label: "Use Dispatch Station",
            x: 33,
            z: -10,
            area: "garage" as const,
          },
          ...(g.workshop?.enabled
            ? [
                {
                  id: "receiving",
                  label: "Shipping collection",
                  x: 30,
                  z: -10,
                  area: "garage" as const,
                },
              ]
            : []),
          {
            id: "computer",
            label: "Use Computer",
            x: 30,
            z: -17.3,
            area: "garage" as const,
          },
        ]
      : []),
  ];
  return list.map((s) => ({
    ...s,
    label: handHint(g, s.id)?.label || s.label,
  }));
}
// Room partitions are deliberately checked separately from furniture collision:
// a workstation's interaction point is on the accessible side of its table.
export function visibleStation(g: Game, yaw: number): Station | undefined {
  const [x, z] = g.player;
  return stations(g)
    .map((s) => ({ s, d: Math.hypot(x - s.x, z - s.z) }))
    .filter(({ s, d }) => {
      if (d > 1.9) return false;
      if (s.area === "bedroom" && (z > 3.6 || Math.abs(x) > 4.6)) return false;
      if (s.area === "home" && (z < 2.1 || z > 9.6 || Math.abs(x) > 4.6))
        return false;
      if (s.area === "outside" && z < 10.35) return false;
      if (
        s.area === "garage" &&
        !(x > 24.3 && x < 35.7 && z > -18.7 && z < -9.3)
      )
        return false;
      const facing = Math.sin(yaw) * (s.x - x) + Math.cos(yaw) * (s.z - z);
      return d < 1.15 || facing / d > -0.2;
    })
    .sort((a, b) => a.d - b.d)[0]?.s;
}
