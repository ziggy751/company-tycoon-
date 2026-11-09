import type { Game } from "./simulation";
export type Workshop = {
  enabled: boolean;
  learned?: boolean;
  carry?: {
    kind: "delivery" | "blank" | "printed" | "order" | "parcel";
    id?: string;
    quality?: number;
  };
  press?: {
    designId: string;
    stage: "blank" | "aligned" | "pressing" | "ready" | "inspected";
    end?: number;
    alignment: number;
    quality: number;
    baseQuality?: number;
  };
  packing?: {
    orderId: string;
    stage: "product" | "mailer" | "labelled" | "sealed";
    insert?: boolean;
  };
  lastQuality?: number;
};
export type HandAction = {
  type: "hand";
  command:
    | "disable"
    | "enable"
    | "pickup-delivery"
    | "unload"
    | "blank"
    | "place"
    | "align"
    | "press"
    | "collect"
    | "inspect"
    | "stock"
    | "pick-order"
    | "place-order"
    | "mailer"
    | "label"
    | "insert"
    | "seal"
    | "parcel"
    | "dispatch";
  id?: string;
  value?: number;
};
export const SUPPLIERS = [
  {
    id: "standard",
    name: "Common Thread",
    factor: 1,
    quality: 3,
    seconds: 18,
    minimum: 1,
  },
  {
    id: "economy",
    name: "Threadline Wholesale",
    factor: 0.85,
    quality: 2,
    seconds: 35,
    minimum: 5,
  },
  {
    id: "premium",
    name: "Cotton Collective",
    factor: 1.2,
    quality: 5,
    seconds: 12,
    minimum: 1,
  },
] as const;
function require(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
export function handAction(g: Game, a: HandAction) {
  const garage = g.property === "garage";
  const station = (
    name: "shelf" | "press" | "pack" | "delivery" | "dispatch",
  ) => {
    const points = {
      shelf: garage ? [30, -14] : [1, -0.1],
      press: garage ? [27, -14.5] : [3.3, -1.35],
      pack: garage ? [33, -10] : [2.25, 2.2],
      delivery: [0, 11],
      dispatch: garage ? [30, -10] : [0, 11],
    };
    const p = points[name];
    require(Math.hypot(g.player[0] - p[0], g.player[1] - p[1]) <
      2, `Walk to the ${name} station first.`);
  };
  const spend = (amount: number, label: string) => {
    require(g.cash >= amount, "Not enough cash.");
    g.cash -= amount;
    g.ledger.push({
      id: String(g.nextId++),
      time: g.time,
      amount: -amount,
      type: "expense",
      label,
    });
  };
  require((g.industry || "streetwear") ===
    "streetwear", "Hands-on printing is for clothing. Other industries retain their own workflows.");
  if (a.command === "enable") {
    require(!g.jobs.length, "Finish the active job first.");
    g.workshop ??= { enabled: true };
    g.workshop.enabled = true;
    return;
  }
  const w = g.workshop;
  require(w?.enabled, "Enable hands-on clothing at the manufacturing bench.");
  const free = () =>
    require(!w.carry, "Your hands are full. Finish carrying this item first.");
  const p = w.press;
  switch (a.command) {
    case "disable":
      require(!w.carry &&
        !w.press &&
        !w.packing, "Finish the held item, press and packing table first.");
      w.enabled = false;
      break;
    case "pickup-delivery": {
      station("delivery");
      free();
      const d = g.deliveries?.find((d) => d.id === a.id);
      require(d &&
        d.arrives <= g.time &&
        !d.picked, "This box is not available.");
      d.picked = true;
      w.carry = { kind: "delivery", id: d.id };
      break;
    }
    case "unload": {
      station("shelf");
      require(w.carry?.kind ===
        "delivery", "Carry a delivery box to the shelf.");
      const d = g.deliveries?.find((d) => d.id === w.carry!.id);
      require(d?.picked, "Box not found.");
      if (d.item === "batch") {
        const product = g.designs.find((x) => x.id === d.designId);
        require(product, "Product missing.");
        product.rawStock = (product.rawStock || 0) + d.quantity;
      } else {
        if (d.item === "blanks")
          g.blankQuality = Math.round(
            ((g.blankQuality || 3) * g.blanks + (d.quality || 3) * d.quantity) /
              (g.blanks + d.quantity),
          );
        g[d.item] = (g[d.item] || 0) + d.quantity;
      }
      g.deliveries = g.deliveries!.filter((x) => x.id !== d.id);
      delete w.carry;
      break;
    }
    case "blank":
      require(!g.jobs.length, "The workstation is already busy.");
      station("shelf");
      free();
      require(g.blanks > 0 &&
        !p, "Finish the current shirt or order more blanks.");
      g.blanks--;
      w.carry = { kind: "blank", quality: g.blankQuality || 3 };
      break;
    case "place":
      station("press");
      require(w.carry?.kind === "blank" &&
        !p, "Carry a blank shirt to the press.");
      require(g.designs.some(
        (d) => d.id === a.id && (!d.kind || d.kind === "shirt"),
      ), "Choose a saved cotton tee design.");
      w.press = {
        designId: a.id!,
        stage: "blank",
        alignment: 0,
        quality: 3,
        baseQuality: w.carry.quality || 3,
      };
      delete w.carry;
      break;
    case "align":
      station("press");
      require(p?.stage === "blank" ||
        p?.stage === "aligned", "Place a blank on the press first.");
      require(Number.isFinite(a.value) &&
        a.value! >= 0 &&
        a.value! <= 1, "Choose a placement from 0 to 1.");
      p.alignment = a.value!;
      p.stage = "aligned";
      break;
    case "press": {
      station("press");
      free();
      require(p?.stage ===
        "aligned", "Position the transfer before lowering the press.");
      const duration = a.value ?? 12;
      require(Number.isInteger(duration) &&
        duration >= 8 &&
        duration <= 18, "Choose an 8–18 second cycle.");
      const d = g.designs.find((d) => d.id === p.designId)!;
      spend(400 + (d.finish === "premium" ? 300 : 0), "Hands-on heat transfer");
      p.quality = Math.round(
        ((p.baseQuality || 3) +
          (Math.abs(duration - 12) <= 2 && Math.abs(p.alignment - 0.5) <= 0.25
            ? 5
            : 3)) /
          2,
      );
      p.stage = "pressing";
      p.end = g.time + duration;
      break;
    }
    case "collect":
      station("press");
      free();
      require(p?.stage === "ready", "Wait for the press cycle to finish.");
      w.carry = { kind: "printed", id: p.designId };
      break;
    case "inspect":
      station("shelf");
      require(w.carry?.kind === "printed" &&
        p?.stage ===
          "ready", "Carry the printed shirt to the inspection shelf.");
      p.stage = "inspected";
      break;
    case "stock": {
      station("shelf");
      require(w.carry?.kind === "printed" &&
        p?.stage === "inspected", "Inspect the shirt before storing it.");
      const d = g.designs.find((d) => d.id === p.designId);
      require(d, "Design missing.");
      d.printPlacement = p.alignment;
      d.printQuality = p.quality;
      d.stock++;
      w.lastQuality = p.quality;
      w.learned = true;
      delete w.press;
      delete w.carry;
      break;
    }
    case "pick-order": {
      station("shelf");
      free();
      require(!w.packing, "Finish the parcel already on the table.");
      const o = g.orders.find((o) => o.id === a.id);
      require(o?.status === "ordered" &&
        !o.physical, "Choose an unprepared customer order.");
      require(g.designs.some(
        (d) => d.id === o.designId && (!d.kind || d.kind === "shirt"),
      ), "This hands-on line packs cotton tees only.");
      o.physical = true;
      w.carry = { kind: "order", id: o.id };
      break;
    }
    case "place-order":
      station("pack");
      require(w.carry?.kind === "order" &&
        !w.packing, "Carry the correct reserved product to the packing table.");
      require(!a.id ||
        a.id ===
          w.carry.id, "Wrong customer product. Nothing has been packed.");
      w.packing = { orderId: w.carry.id!, stage: "product" };
      delete w.carry;
      break;
    case "mailer":
      station("pack");
      require(w.packing?.stage === "product" &&
        g.packaging > 0, "Place a product and stock mailers first.");
      g.packaging--;
      w.packing.stage = "mailer";
      break;
    case "label":
      station("pack");
      require(w.packing?.stage === "mailer", "Add protective packaging first.");
      w.packing.stage = "labelled";
      break;
    case "insert":
      station("pack");
      require(w.packing?.stage === "labelled" &&
        !w.packing
          .insert, "Label the parcel first; only one insert is needed.");
      spend(50, "Branded parcel insert");
      w.packing.insert = true;
      break;
    case "seal": {
      station("pack");
      require(w.packing?.stage ===
        "labelled", "Check the address label first.");
      const o = g.orders.find((o) => o.id === w.packing!.orderId);
      require(o?.status === "ordered" &&
        o.physical, "Order is no longer available.");
      o.brandedInsert = !!w.packing.insert;
      o.status = "packed";
      w.packing.stage = "sealed";
      break;
    }
    case "parcel":
      station("pack");
      free();
      require(w.packing?.stage === "sealed", "Seal the parcel first.");
      w.carry = { kind: "parcel", id: w.packing.orderId };
      delete w.packing;
      break;
    case "dispatch": {
      station("dispatch");
      require(w.carry?.kind ===
        "parcel", "Carry a sealed parcel to collection.");
      const o = g.orders.find((o) => o.id === w.carry!.id);
      require(o?.status === "packed" && o.physical, "Parcel not available.");
      spend(500, "Postage · " + o.customer);
      o.status = "shipping";
      o.arrives = g.time + 8;
      delete w.carry;
      break;
    }
  }
}
export function validateWorkshop(g: Game) {
  const w = g.workshop;
  if (!w) {
    if (
      g.deliveries?.some((d) => d.picked) ||
      g.orders.some(
        (o) => o.physical && ["ordered", "packed"].includes(o.status),
      )
    )
      throw new Error("Missing workshop ownership.");
    return;
  }
  const fail = () => {
    throw new Error("Invalid hands-on workshop save.");
  };
  if (!w.enabled && (w.carry || w.press || w.packing)) fail();
  if (w.packing?.insert !== undefined && typeof w.packing.insert !== "boolean")
    fail();
  for (const q of [w.lastQuality, w.carry?.quality, w.press?.baseQuality])
    if (q !== undefined && (!Number.isInteger(q) || q < 1 || q > 5)) fail();
  if (w.packing && w.carry && ["order", "parcel"].includes(w.carry.kind))
    fail();
  if (w.learned !== undefined && typeof w.learned !== "boolean") fail();
  if (
    typeof w.enabled !== "boolean" ||
    (g.industry && g.industry !== "streetwear")
  )
    fail();
  if (
    w.carry &&
    !["delivery", "blank", "printed", "order", "parcel"].includes(w.carry.kind)
  )
    fail();
  if (
    w.press &&
    (!g.designs.some(
      (d) => d.id === w.press!.designId && (!d.kind || d.kind === "shirt"),
    ) ||
      !["blank", "aligned", "pressing", "ready", "inspected"].includes(
        w.press.stage,
      ) ||
      !Number.isFinite(w.press.alignment) ||
      w.press.alignment < 0 ||
      w.press.alignment > 1 ||
      ![2, 3, 4, 5].includes(w.press.quality) ||
      (w.press.stage === "pressing" &&
        (!Number.isSafeInteger(w.press.end) || w.press.end! < 0)))
  )
    fail();
  if (
    w.carry?.kind === "delivery" &&
    !g.deliveries?.some((d) => d.id === w.carry!.id && d.picked)
  )
    fail();
  if (
    g.deliveries?.some(
      (d) => d.picked && !(w.carry?.kind === "delivery" && w.carry.id === d.id),
    )
  )
    fail();
  if (w.carry?.kind === "blank" && w.press) fail();
  if (
    w.carry?.kind === "printed" &&
    (!w.press ||
      w.carry.id !== w.press.designId ||
      !["ready", "inspected"].includes(w.press.stage))
  )
    fail();
  if (w.press?.stage === "inspected" && w.carry?.kind !== "printed") fail();
  if (
    w.packing &&
    (!["product", "mailer", "labelled", "sealed"].includes(w.packing.stage) ||
      !g.orders.some(
        (o) =>
          o.id === w.packing!.orderId &&
          o.physical &&
          o.status === (w.packing!.stage === "sealed" ? "packed" : "ordered"),
      ))
  )
    fail();
  for (const o of g.orders.filter(
    (o) => o.physical && ["ordered", "packed"].includes(o.status),
  ))
    if (
      !(
        w.packing?.orderId === o.id ||
        (w.carry?.id === o.id &&
          w.carry.kind === (o.status === "packed" ? "parcel" : "order"))
      )
    )
      fail();
  if (
    w.carry &&
    ["order", "parcel"].includes(w.carry.kind) &&
    !g.orders.some(
      (o) =>
        o.id === w.carry!.id &&
        o.physical &&
        o.status === (w.carry!.kind === "parcel" ? "packed" : "ordered"),
    )
  )
    fail();
}
export function handHint(
  g: Game,
  station: string,
): { label: string; action: HandAction } | undefined {
  const w = g.workshop;
  if (!w?.enabled) return;
  let command: HandAction["command"] | undefined,
    id: string | undefined,
    label = "";
  if (station === "receiving") {
    if (w.carry?.kind === "parcel") {
      command = "dispatch";
      label = "Leave parcel for collection · $5";
    } else if (!w.carry) {
      id = g.deliveries?.find((d) => d.arrives <= g.time && !d.picked)?.id;
      if (id) {
        command = "pickup-delivery";
        label = "Pick up delivery box";
      }
    }
  }
  if (station === "shelf") {
    if (w.carry?.kind === "delivery") {
      command = "unload";
      label = "Open box & shelve materials";
    } else if (w.carry?.kind === "printed") {
      command = w.press?.stage === "inspected" ? "stock" : "inspect";
      label =
        command === "stock" ? "Store inspected shirt" : "Inspect printed shirt";
    } else if (!w.carry && !w.packing) {
      id = g.orders.find(
        (o) =>
          o.status === "ordered" &&
          !o.physical &&
          g.designs.some(
            (d) => d.id === o.designId && (!d.kind || d.kind === "shirt"),
          ),
      )?.id;
      if (id) {
        command = "pick-order";
        label = "Collect reserved customer product";
      } else if (!w.press && g.blanks) {
        command = "blank";
        label = "Pick up a blank shirt";
      }
    }
  }
  if (station === "production" && !w.carry) {
    if (w.press?.stage === "aligned") {
      command = "press";
      label = "Lower press · 12 second cycle";
    }
    if (w.press?.stage === "ready") {
      command = "collect";
      label = "Raise press & collect shirt";
    }
  }
  if (station === "orders") {
    if (w.carry?.kind === "order") {
      command = "place-order";
      label = "Place customer product on table";
    } else if (!w.carry && w.packing) {
      command = (
        {
          product: "mailer",
          mailer: "label",
          labelled: "seal",
          sealed: "parcel",
        } as const
      )[w.packing.stage];
      label = {
        product: "Add protective mailer",
        mailer: "Check & attach address label",
        labelled: "Seal customer parcel",
        sealed: "Pick up finished parcel",
      }[w.packing.stage];
    }
  }
  if (command) return { label, action: { type: "hand", command, id } };
}
