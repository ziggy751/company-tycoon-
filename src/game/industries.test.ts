import { describe, it, expect } from "vitest";
import {
  newGame,
  act,
  tick,
  revenue,
  completed,
  occupied,
  garageReady,
  type Game,
} from "./simulation";
import {
  PRODUCTS,
  INDUSTRIES,
  type IndustryId,
  type ProductKind,
  TUTORIAL_TASKS,
} from "./industries";
import { validateSave } from "./save";
function product(industry: IndustryId, kind: ProductKind) {
  let g = newGame("TEST", "", "#d9ed91", "Independent", "#a77c62", industry);
  return act(g, {
    type: "design",
    design: {
      kind,
      name: PRODUCTS[kind].name,
      color: "#d4ccbb",
      ink: "#223322",
      text: "Studio",
      fit: "Regular",
      graphic: "type",
      price: PRODUCTS[kind].price,
    },
  });
}
function source(g: Game) {
  const id = g.designs[0].id;
  if (!g.industry || g.industry === "streetwear")
    return tick(act(g, { type: "produce", id }), 12);
  if (g.industry === "mtb") g = tick(act(g, { type: "prototype", id }), 12);
  g = tick(act(g, { type: "contract", id }), 40);
  return g.industry === "mtb"
    ? tick(act(g, { type: "inspect", id }), 10)
    : tick(act(g, { type: "label", id }), 6);
}
function sale(g: Game) {
  g = tick(act(g, { type: "post", caption: "Release" }), 10);
  const id = g.orders[0].id;
  return tick(act(act(g, { type: "pack", id }), { type: "ship", id }), 8);
}
for (const i of INDUSTRIES)
  for (const kind of i.products)
    it(`${i.id}/${kind}: complete paid supply-to-delivery loop survives save/load`, () => {
      const start = product(i.id, kind);
      const ready = source(start);
      expect(ready.designs[0].stock).toBeGreaterThan(0);
      const g = sale(validateSave(JSON.parse(JSON.stringify(ready))));
      expect(completed(g)).toBe(1);
      expect(revenue(g)).toBe(PRODUCTS[kind].price);
      expect(validateSave(g)).toEqual(g);
      expect(tick(g, 20).cash).toBe(g.cash);
    });
it("MTB cannot skip prototyping, contract payment, incoming inspection or capacity", () => {
  let g = product("mtb", "frame-kit"),
    id = g.designs[0].id;
  expect(() => act(g, { type: "produce", id })).toThrow("heat press");
  expect(() => act(g, { type: "contract", id })).toThrow("prototype");
  g = tick(act(g, { type: "prototype", id }), 12);
  g = act(g, { type: "contract", id });
  expect(g.cash).toBe(50000 - 1500 - 3 * 450);
  expect(g.designs[0].stock).toBe(0);
  expect(occupied(g)).toBe(3);
  g = tick(g, 25);
  expect(g.designs[0].rawStock).toBe(3);
  expect(g.designs[0].stock).toBe(0);
  expect(() => act(g, { type: "post", caption: "no QC" })).toThrow("saleable");
  g = act(g, { type: "inspect", id });
  expect(g.designs[0].rawStock).toBe(0);
  expect(occupied(g)).toBe(3);
  expect(tick(g, 10).designs[0].stock).toBe(3);
});
it("hair accessories consume sourced items and actual labels instead of shirt blanks", () => {
  let g = product("haircare", "comb"),
    id = g.designs[0].id;
  expect(g.blanks).toBe(0);
  expect(() => act(g, { type: "label", id })).toThrow("Source");
  g = tick(act(g, { type: "contract", id }), 20);
  g = act(g, { type: "label", id });
  expect(g.labels).toBe(4);
  expect(g.designs[0].rawStock).toBe(2);
  expect(g.cash).toBe(48650);
  g = tick(g, 6);
  expect(g.designs[0].stock).toBe(1);
  expect(() => act(g, { type: "wear", id })).toThrow("clothing");
  expect(() => act(g, { type: "buy", item: "blanks", quantity: 1 })).toThrow(
    "cotton",
  );
});
it("original version-one saves remain valid without new optional fields", () => {
  const g = newGame();
  delete g.industry;
  delete g.onboarding;
  delete g.labels;
  delete g.property;
  expect(validateSave(g).cash).toBe(50000);
  expect(
    source(
      act(g, {
        type: "design",
        design: {
          name: "Old tee",
          color: "#eeeecc",
          ink: "#112211",
          text: "Old",
          fit: "Regular",
          graphic: "type",
          price: 3900,
        },
      }),
    ).designs[0].stock,
  ).toBe(1);
});
it("pays exactly one $100 tutorial grant and rejects duplicated grants", () => {
  let g = product("streetwear", "shirt");
  g = act(g, { type: "tutorial-start" });
  for (const task of ["move", "computer"] as const)
    g = act(g, { type: "tutorial-event", task });
  g = act(g, {
    type: "design",
    design: {
      name: "Tutorial tee",
      color: "#eeeecc",
      ink: "#112211",
      text: "T",
      fit: "Regular",
      graphic: "type",
      price: 3900,
    },
  });
  g = act(g, { type: "buy", item: "blanks", quantity: 1 });
  g = sale(source(g));
  const before = g.cash;
  g = act(g, { type: "tutorial-event", task: "finances" });
  expect(g.cash).toBe(before + 10000);
  expect(g.onboarding?.mode).toBe("complete");
  expect(g.ledger.filter((e) => e.type === "grant")).toHaveLength(1);
  g = act(g, { type: "tutorial-start" });
  for (const [task] of TUTORIAL_TASKS)
    g = act(g, { type: "tutorial-event", task });
  expect(g.cash).toBe(before + 10000);
  g = act(act(g, { type: "tutorial-skip" }), { type: "tutorial-start" });
  expect(g.onboarding?.mode).toBe("active");
  expect(g.onboarding?.tasks).toEqual([]);
  expect(validateSave(g)).toEqual(g);
  expect(() =>
    validateSave({
      ...g,
      cash: g.cash + 10000,
      ledger: [
        ...g.ledger,
        { ...g.ledger.find((e) => e.type === "grant")!, id: "extra" },
      ],
    }),
  ).toThrow();
});
it("gates the real garage on operating milestones and expands capacity/position", () => {
  let g = product("mtb", "frame-kit");
  expect(garageReady(g)).toBe(false);
  expect(() => act(g, { type: "upgrade", id: "garage" })).toThrow(
    "Garage needs",
  );
  g = {
    ...g,
    cash: 1000000,
    reputation: 20,
    upgrades: ["storage"],
    ledger: [
      {
        id: "fixture",
        time: 0,
        label: "Fixture sales",
        amount: 950000,
        type: "revenue",
      },
    ],
    orders: Array.from({ length: 40 }, (_, i) => ({
      id: String(i + 100),
      designId: g.designs[0].id,
      customer: "Test",
      price: 2400,
      status: "delivered",
    })),
  };
  expect(garageReady(g)).toBe(true);
  g = act(g, { type: "upgrade", id: "garage" });
  expect(g.property).toBe("garage");
  expect(g.player).toEqual([30, -14]);
  expect(validateSave(g).cash).toBe(850000);
  expect(() => act(g, { type: "upgrade", id: "garage" })).toThrow("already");
});
