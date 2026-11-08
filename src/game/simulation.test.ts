import { describe, it, expect } from "vitest";
import {
  act,
  tick,
  newGame,
  completed,
  revenue,
  expenses,
  occupied,
  type Game,
} from "./simulation";
import { validateSave } from "./save";
const design = {
  name: "Test shirt",
  color: "#eeeecc",
  ink: "#223322",
  text: "Independent",
  fit: "Oversized" as const,
  graphic: "orbit" as const,
  price: 3900,
};
function designed() {
  return act(newGame(), { type: "design", design });
}
function produced() {
  let g = designed();
  g = act(g, { type: "produce", id: g.designs[0].id });
  return tick(g, 12);
}
function ordered() {
  return tick(act(produced(), { type: "post", caption: "Our release" }), 10);
}
function delivered(g: Game) {
  const id = g.orders[0].id;
  return tick(act(act(g, { type: "pack", id }), { type: "ship", id }), 8);
}
describe("bedroom simulation", () => {
  it("starts with only the documented founder resources", () => {
    const g = newGame();
    expect(g.cash).toBe(50000);
    expect(g.blanks).toBe(5);
    expect(g.packaging).toBe(5);
    expect(g.designs).toHaveLength(0);
  });
  it("purchases stock with exact integer-cent ledger entries", () => {
    const s = newGame();
    const g = act(s, { type: "buy", item: "blanks", quantity: 5 });
    expect(g.cash).toBe(44000);
    expect(g.blanks).toBe(10);
    expect(s.blanks).toBe(5);
    expect(expenses(g)).toBe(6000);
  });
  it("rejects invalid quantities, negative prices, overspending and full storage", () => {
    const s = newGame();
    expect(() =>
      act(s, { type: "buy", item: "blanks", quantity: -1 }),
    ).toThrow();
    expect(() => act(s, { type: "buy", item: "blanks", quantity: 20 })).toThrow(
      "Storage",
    );
    expect(() =>
      act({ ...s, cash: 0 }, { type: "buy", item: "packaging", quantity: 1 }),
    ).toThrow("cash");
    expect(() =>
      act(s, { type: "design", design: { ...design, price: -100 } }),
    ).toThrow("Price");
  });
  it("manufactures only after elapsed time and consumes blank and ink exactly once", () => {
    let g = designed();
    const id = g.designs[0].id;
    g = act(g, { type: "produce", id });
    expect(g.blanks).toBe(4);
    expect(g.cash).toBe(49600);
    expect(g.designs[0].stock).toBe(0);
    expect(() => act(g, { type: "produce", id })).toThrow("busy");
    g = tick(g, 11);
    expect(g.designs[0].stock).toBe(0);
    g = tick(g, 1);
    expect(g.designs[0].stock).toBe(1);
    expect(tick(g, 20).designs[0].stock).toBe(1);
  });
  it("requires inventory for advertising and throttles posting", () => {
    expect(() => act(designed(), { type: "post", caption: "hi" })).toThrow(
      "Produce",
    );
    const g = act(produced(), { type: "post", caption: "hi" });
    expect(g.followers).toBe(8);
    expect(() => act(g, { type: "post", caption: "spam" })).toThrow("breather");
  });
  it("reserves real stock when demand becomes an order", () => {
    const g = ordered();
    expect(g.orders).toHaveLength(1);
    expect(g.designs[0].stock).toBe(0);
    expect(g.orders[0].status).toBe("ordered");
    expect(revenue(g)).toBe(0);
    expect(occupied(g)).toBe(5);
  });
  it("does not sell unaffordable products or fabricate stock", () => {
    let g = produced();
    g = act(g, { type: "price", id: g.designs[0].id, price: 50000 });
    g = tick(act(g, { type: "post", caption: "Luxury" }), 60);
    expect(g.orders).toHaveLength(0);
    expect(g.designs[0].stock).toBe(1);
  });
  it("requires packaging before shipment and consumes one mailer", () => {
    const g = ordered(),
      id = g.orders[0].id;
    expect(() => act(g, { type: "ship", id })).toThrow("Pack");
    const p = act(g, { type: "pack", id });
    expect(p.packaging).toBe(4);
    expect(() => act(p, { type: "pack", id })).toThrow("already");
    expect(() => act({ ...g, packaging: 0 }, { type: "pack", id })).toThrow(
      "packaging",
    );
  });
  it("completes a genuine sale, records postage and settles revenue only on delivery", () => {
    let g = ordered();
    const id = g.orders[0].id;
    g = act(act(g, { type: "pack", id }), { type: "ship", id });
    expect(g.cash).toBe(48600);
    expect(revenue(g)).toBe(0);
    g = tick(g, 8);
    expect(g.cash).toBe(52500);
    expect(revenue(g)).toBe(3900);
    expect(completed(g)).toBe(1);
    expect(g.achievements).toContain("First sale");
    expect(tick(g, 100).cash).toBe(52500);
    expect(() => act(g, { type: "ship", id })).toThrow();
  });
  it("preserves pending jobs and in-transit payments across a serialised save", () => {
    const g = act(designed(), { type: "produce", id: "1" });
    const restored = validateSave(JSON.parse(JSON.stringify(g)));
    expect(tick(restored, 12)).toEqual(tick(g, 12));
    const o = ordered(),
      id = o.orders[0].id;
    const transit = act(act(o, { type: "pack", id }), { type: "ship", id });
    const saved = validateSave(JSON.parse(JSON.stringify(transit)));
    expect(tick(saved, 8)).toEqual(tick(transit, 8));
    expect(tick(validateSave(tick(saved, 8)), 8).cash).toBe(52500);
  });
  it("rejects corrupt and unsupported saves", () => {
    expect(() => validateSave({ ...newGame(), cash: 999999 })).toThrow(
      "reconcile",
    );
    expect(() => validateSave({ ...newGame(), version: 99 })).toThrow(
      "version",
    );
    expect(() =>
      validateSave({ ...designed(), designs: [{ ...design, stock: -2 }] }),
    ).toThrow();
  });
  it("makes upgrades unique and gates advanced equipment on real sales", () => {
    let g = newGame();
    expect(() => act(g, { type: "upgrade", id: "press" })).toThrow("5 orders");
    g = act(g, { type: "upgrade", id: "storage" });
    expect(g.cash).toBe(38000);
    expect(() => act(g, { type: "upgrade", id: "storage" })).toThrow("Already");
    g = act(g, { type: "buy", item: "blanks", quantity: 20 });
    expect(g.blanks).toBe(25);
    expect(g.achievements).toEqual(["Reinvested"]);
  });
  it("plays five orders without a softlock and reconciles the ledger", () => {
    let g = designed();
    for (let i = 0; i < 5; i++) {
      g = tick(act(g, { type: "produce", id: g.designs[0].id }), 12);
      if (g.demand === 0) {
        if (g.time - g.lastPost < 35) g = tick(g, 35 - (g.time - g.lastPost));
        g = act(g, { type: "post", caption: "Small batch" });
      }
      g = tick(g, 10);
      const order = g.orders.find((o) => o.status === "ordered")!;
      expect(order).toBeTruthy();
      g = tick(
        act(act(g, { type: "pack", id: order.id }), {
          type: "ship",
          id: order.id,
        }),
        8,
      );
    }
    expect(completed(g)).toBe(5);
    expect(g.achievements).toContain("First five");
    g = act(g, { type: "upgrade", id: "press" });
    expect(g.upgrades).toContain("press");
    expect(g.cash).toBe(50000 + revenue(g) - expenses(g));
    expect(g.blanks).toBe(0);
    expect(g.packaging).toBe(0);
    expect(validateSave(g)).toEqual(g);
  });
});
