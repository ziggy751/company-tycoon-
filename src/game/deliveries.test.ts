import { it, expect } from "vitest";
import { newGame, act, tick, occupied } from "./simulation";
import { directUnitCost } from "./industries";
import { validateSave } from "./save";
it("reserves inbound stock, prevents early/duplicate receipt and survives export", () => {
  let g = act(newGame(), {
    type: "order-supplies",
    item: "blanks",
    quantity: 5,
  });
  expect(g.cash).toBe(44000);
  expect(g.blanks).toBe(5);
  expect(occupied(g)).toBe(10);
  const id = g.deliveries![0].id;
  expect(() => act(g, { type: "receive", id })).toThrow("not arrived");
  g = tick(validateSave(JSON.parse(JSON.stringify(g))), 18);
  g = act(g, { type: "receive", id });
  expect(g.blanks).toBe(10);
  expect(g.cash).toBe(44000);
  expect(occupied(g)).toBe(10);
  expect(() => act(g, { type: "receive", id })).toThrow();
  expect(validateSave(g)).toEqual(g);
});
it("pending mailers count toward shelf capacity and pending blanks reserve storage", () => {
  let g = newGame();
  g = act(g, { type: "order-supplies", item: "blanks", quantity: 15 });
  expect(() =>
    act(g, { type: "order-supplies", item: "blanks", quantity: 1 }),
  ).toThrow("Storage");
  let mail = newGame();
  mail.cash = 100000;
  for (let i = 0; i < 4; i++)
    mail = act(mail, {
      type: "order-supplies",
      item: "packaging",
      quantity: 20,
    });
  expect(() =>
    act(mail, { type: "order-supplies", item: "packaging", quantity: 20 }),
  ).toThrow("100");
});
it("new clothing cannot be printed from cotton tee blanks and premium costs are real", () => {
  let g = newGame();
  g = act(g, {
    type: "design",
    design: {
      kind: "tote",
      name: "Tote",
      color: "#eeeecc",
      ink: "#111111",
      text: "Studio",
      fit: "Regular",
      graphic: "type",
      price: 2900,
      finish: "premium",
      collection: "Summer",
      season: "Summer",
    },
  });
  const id = g.designs[0].id;
  expect(() => act(g, { type: "produce", id })).toThrow("specialist");
  g = act(g, { type: "contract", id });
  expect(g.cash).toBe(50000 - 3 * 1125);
  g = tick(g, 32);
  expect(g.designs[0].stock).toBe(0);
  expect(g.designs[0].rawStock).toBe(0);
  g = tick(g, 8);
  g = act(g, { type: "receive", id: g.deliveries![0].id });
  g = tick(act(g, { type: "inspect", id }), 10);
  expect(g.designs[0].stock).toBe(3);
  expect(validateSave(g)).toEqual(g);
});
it("store closure and product listing prevent new orders while dispatch continues", () => {
  let g = newGame();
  g = act(g, {
    type: "design",
    design: {
      name: "Tee",
      color: "#eeeecc",
      ink: "#111111",
      text: "Studio",
      fit: "Regular",
      graphic: "type",
      price: 3900,
    },
  });
  const id = g.designs[0].id;
  g = tick(act(g, { type: "produce", id }), 12);
  g = act(g, { type: "post", caption: "Launch" });
  g = act(g, { type: "store", enabled: false, theme: "violet" });
  g = tick(g, 20);
  expect(g.orders).toHaveLength(0);
  g = act(g, { type: "store", enabled: true, theme: "paper" });
  g = act(g, { type: "listing", id });
  g = tick(g, 20);
  expect(g.orders).toHaveLength(0);
  g = act(g, { type: "listing", id });
  g = tick(g, 10);
  expect(g.orders).toHaveLength(1);
  expect(validateSave(g)).toEqual(g);
});

it("premium tee payment, duration and catalogue margin agree", () => {
  let g = newGame();
  g = act(g, {
    type: "design",
    design: {
      name: "Premium tee",
      color: "#eeeecc",
      ink: "#111111",
      text: "Studio",
      fit: "Regular",
      graphic: "type",
      price: 4500,
      finish: "premium",
    },
  });
  const d = g.designs[0];
  g = act(g, { type: "produce", id: d.id });
  expect(g.cash).toBe(49300);
  expect(g.jobs[0].end).toBe(20);
  expect(directUnitCost(d)).toBe(2600);
  g = tick(g, 19);
  expect(g.designs[0].stock).toBe(0);
  g = tick(g, 1);
  expect(g.designs[0].stock).toBe(1);
  expect(validateSave(g)).toEqual(g);
});
