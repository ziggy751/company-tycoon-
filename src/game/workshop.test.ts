import { TUTORIAL_TASKS } from "./industries";
import { it, expect } from "vitest";
import { newGame, act, tick, occupied, type Game } from "./simulation";
import { validateSave } from "./save";
import type { HandAction } from "./workshop";
const move = (g: Game, p: [number, number]) => ({ ...g, player: p });
const hand = (
  g: Game,
  command: HandAction["command"],
  id?: string,
  value?: number,
) =>
  validateSave(
    JSON.parse(JSON.stringify(act(g, { type: "hand", command, id, value }))),
  );
function design() {
  return act(newGame(), {
    type: "design",
    design: {
      name: "Hand printed",
      color: "#bc8f77",
      ink: "#123456",
      text: "STUDIO",
      fit: "Regular",
      graphic: "orbit",
      price: 3900,
    },
  });
}
it("complete physical delivery → shirt → inspection → reserved order → parcel → payment survives every save", () => {
  let g = hand(design(), "enable");
  const id = g.designs[0].id;
  g = act(g, {
    type: "order-supplies",
    item: "blanks",
    quantity: 5,
    supplier: "economy",
  });
  expect(g.cash).toBe(44900);
  g = tick(g, 35);
  g = hand(move(g, [0, 11]), "pickup-delivery", g.deliveries![0].id);
  expect(() => act(g, { type: "receive", id: g.deliveries![0].id })).toThrow();
  expect(() => hand(g, "pickup-delivery", g.deliveries![0].id)).toThrow();
  g = hand(move(g, [1, -0.1]), "unload");
  expect(g.blanks).toBe(10);
  const occupiedBefore = occupied(g);
  g = hand(g, "blank");
  expect(occupied(g)).toBe(occupiedBefore);
  expect(() => hand(g, "disable")).toThrow();
  g = hand(move(g, [3.3, -1.35]), "place", id);
  g = hand(g, "align", undefined, 0.5);
  g = hand(g, "press", undefined, 12);
  expect(() => hand(g, "collect")).toThrow();
  g = tick(g, 12);
  expect(g.designs[0].stock).toBe(0);
  g = hand(g, "collect");
  expect(() => hand(g, "collect")).toThrow();
  g = move(g, [1, -0.1]);
  expect(() => hand(g, "stock")).toThrow();
  g = hand(g, "inspect");
  g = hand(g, "stock");
  expect(g.designs[0].stock).toBe(1);
  expect(g.designs[0].printPlacement).toBe(0.5);
  expect(g.designs[0].printQuality).toBe(4);
  expect(() => hand(g, "stock")).toThrow();
  g = tick(act(g, { type: "post", caption: "Launch" }), 10);
  const order = g.orders[0].id;
  g = hand(g, "pick-order", order);
  g = move(g, [2.25, 2.2]);
  expect(() => hand(g, "place-order", "wrong")).toThrow("Wrong");
  g = hand(g, "place-order");
  g = hand(g, "mailer");
  expect(g.packaging).toBe(4);
  expect(() => hand(g, "mailer")).toThrow();
  g = hand(g, "label");
  g = hand(g, "insert");
  g = hand(g, "seal");
  expect(() => act(g, { type: "ship", id: order })).toThrow();
  g = hand(g, "parcel");
  const cash = g.cash;
  g = hand(move(g, [0, 11]), "dispatch");
  expect(() => hand(g, "dispatch")).toThrow();
  g = tick(g, 8);
  expect(g.orders[0].status).toBe("delivered");
  expect(g.orders[0].brandedInsert).toBe(true);
  expect(g.cash).toBe(cash - 500 + 3900);
  expect(tick(g, 30).cash).toBe(g.cash);
  expect(validateSave(g)).toEqual(g);
});
it("supplier minimums, quality and press technique affect real cost/time/quality", () => {
  let g = hand(design(), "enable");
  expect(() =>
    act(g, {
      type: "order-supplies",
      item: "blanks",
      quantity: 1,
      supplier: "economy",
    }),
  ).toThrow("Minimum");
  g = act(g, {
    type: "order-supplies",
    item: "blanks",
    quantity: 1,
    supplier: "premium",
  });
  expect(g.cash).toBe(48560);
  expect(g.deliveries![0].arrives).toBe(12);
  g = hand(move(g, [1, -0.1]), "blank");
  g = hand(move(g, [3.3, -1.35]), "place", g.designs[0].id);
  g = hand(g, "align", undefined, 0);
  g = hand(g, "press", undefined, 8);
  g = tick(g, 8);
  expect(g.workshop!.press!.quality).toBe(3);
  expect(() => hand(move(g, [0, 11]), "collect")).toThrow("station");
  const broken = structuredClone(g);
  broken.workshop!.carry = { kind: "parcel", id: "missing" };
  expect(() => validateSave(broken)).toThrow();
});

it("supplier rebates change the purchase expense, never a tutorial completion grant", () => {
  let g = newGame();
  g.onboarding = {
    mode: "active",
    tasks: TUTORIAL_TASKS.map(([id]) => id).filter((id) => id !== "materials"),
    rewarded: false,
  };
  g = act(g, {
    type: "order-supplies",
    item: "blanks",
    quantity: 5,
    supplier: "economy",
  });
  expect(g.ledger.find((e) => e.type === "grant")?.amount).toBe(10000);
  expect(g.cash).toBe(54900);
  expect(validateSave(g)).toEqual(g);
});
it("supplier grade follows received blanks into the inspected print grade", () => {
  let g = hand(design(), "enable");
  g.blanks = 0;
  g = act(g, {
    type: "order-supplies",
    item: "blanks",
    quantity: 1,
    supplier: "premium",
  });
  g = tick(g, 12);
  g = hand(move(g, [0, 11]), "pickup-delivery", g.deliveries![0].id);
  g = hand(move(g, [1, -0.1]), "unload");
  expect(g.blankQuality).toBe(5);
  g = hand(g, "blank");
  g = hand(move(g, [3.3, -1.35]), "place", g.designs[0].id);
  g = hand(g, "align", undefined, 0.5);
  g = hand(g, "press", undefined, 12);
  g = tick(g, 12);
  g = hand(g, "collect");
  g = hand(move(g, [1, -0.1]), "inspect");
  expect(g.workshop!.press!.quality).toBe(5);
  g = hand(g, "stock");
  expect(g.workshop!.lastQuality).toBe(5);
  expect(validateSave(g)).toEqual(g);
});
