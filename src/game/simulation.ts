import {
  industryOf,
  productOf,
  industryUpgrades,
  INDUSTRIES,
  TUTORIAL_TASKS,
  type TutorialTask,
  type IndustryId,
  type ProductKind,
} from "./industries";
import { ECONOMY as E, UPGRADES } from "./catalog";
export type Design = {
  id: string;
  kind?: ProductKind;
  rawStock?: number;
  prototypeApproved?: boolean;
  name: string;
  color: string;
  ink: string;
  text: string;
  fit: "Regular" | "Oversized" | "Boxy";
  graphic: "type" | "orbit" | "none";
  price: number;
  stock: number;
};
export type Order = {
  id: string;
  designId: string;
  customer: string;
  price: number;
  status: "ordered" | "packed" | "shipping" | "delivered";
  arrives?: number;
};
export type Entry = {
  id: string;
  time: number;
  label: string;
  amount: number;
  type: "expense" | "revenue" | "grant";
};
export type Game = {
  version: 1;
  industry?: IndustryId;
  labels?: number;
  property?: "home" | "garage";
  waypoint?: [number, number];
  onboarding?: {
    mode: "pending" | "active" | "skipped" | "complete";
    tasks: TutorialTask[];
    rewarded: boolean;
  };
  companyId?: string;
  doorOpen?: boolean;
  lightsOn?: boolean;
  wardrobe?: string[];
  equipped?: string;
  brand: string;
  slogan: string;
  accent: string;
  aesthetic: string;
  founder: string;
  time: number;
  cash: number;
  blanks: number;
  packaging: number;
  followers: number;
  reputation: number;
  designs: Design[];
  orders: Order[];
  jobs: {
    id: string;
    designId: string;
    end: number;
    kind?: "print" | "prototype" | "contract" | "inspect" | "label";
    quantity?: number;
  }[];
  posts: {
    id: string;
    time: number;
    caption: string;
    views: number;
    likes: number;
  }[];
  ledger: Entry[];
  upgrades: string[];
  achievements: string[];
  nextId: number;
  lastPost: number;
  demand: number;
  lastDemand: number;
  tutorial: boolean;
  wall: string;
  player: [number, number];
};
export type Action =
  | { type: "design"; design: Omit<Design, "id" | "stock"> }
  | { type: "price"; id: string; price: number }
  | { type: "buy"; item: "blanks" | "packaging" | "labels"; quantity: number }
  | { type: "produce"; id: string }
  | { type: "prototype" | "contract" | "inspect" | "label"; id: string }
  | { type: "tutorial-start" | "tutorial-skip" }
  | { type: "tutorial-event"; task: TutorialTask }
  | { type: "waypoint"; position: [number, number] }
  | { type: "post"; caption: string }
  | { type: "pack" | "ship"; id: string }
  | { type: "upgrade"; id: string }
  | { type: "wall"; color: string }
  | { type: "door" | "lights" }
  | { type: "wear"; id: string }
  | { type: "tutorial" }
  | { type: "identity"; brand: string; slogan: string };
const clone = <T>(s: T): T => structuredClone(s);
const check = (ok: unknown, message: string) => {
  if (!ok) throw new Error(message);
};
const id = (s: Game) => String(s.nextId++);
function entry(s: Game, label: string, amount: number, type: Entry["type"]) {
  s.cash += amount;
  s.ledger.push({ id: id(s), time: s.time, label, amount, type });
}
function spend(s: Game, label: string, amount: number) {
  check(
    s.cash >= amount,
    "Not enough cash. Sell and ship existing stock first.",
  );
  entry(s, label, -amount, "expense");
}
export const revenue = (s: Game) =>
  s.ledger
    .filter((x) => x.type === "revenue")
    .reduce((v, x) => v + x.amount, 0);
export const expenses = (s: Game) =>
  -s.ledger
    .filter((x) => x.type === "expense")
    .reduce((v, x) => v + x.amount, 0);
export const completed = (s: Game) =>
  s.orders.filter((o) => o.status === "delivered").length;
export const capacity = (s: Game) =>
  s.property === "garage"
    ? 60
    : s.upgrades.includes("storage")
      ? 40
      : E.capacity;
export const occupied = (s: Game) =>
  s.blanks +
  s.designs.reduce((v, d) => v + d.stock + (d.rawStock || 0), 0) +
  s.jobs.reduce((n, j) => n + (j.quantity ?? 1), 0) +
  s.orders.filter((o) => o.status === "ordered" || o.status === "packed")
    .length;
export function newGame(
  brand = "AFTERHOURS",
  slogan = "Independent by design.",
  accent = "#d9ed91",
  aesthetic = "Underground",
  founder = "#a77c62",
  industry: IndustryId = "streetwear",
): Game {
  return {
    version: 1,
    industry,
    labels: industry === "haircare" ? 5 : 0,
    property: "home",
    onboarding: { mode: "pending", tasks: [], rewarded: false },
    companyId: crypto.randomUUID(),
    doorOpen: false,
    lightsOn: true,
    wardrobe: [],
    brand: brand.trim().slice(0, 28) || "UNTITLED",
    slogan: slogan.slice(0, 70),
    accent,
    aesthetic,
    founder,
    time: 0,
    cash: 50000,
    blanks: industry === "streetwear" ? 5 : 0,
    packaging: 5,
    followers: 0,
    reputation: 0,
    designs: [],
    orders: [],
    jobs: [],
    posts: [],
    ledger: [],
    upgrades: [],
    achievements: [],
    nextId: 1,
    lastPost: -E.postCooldown,
    demand: 0,
    lastDemand: 0,
    tutorial: true,
    wall: "#777b6e",
    player: [0, 2],
  };
}
export function garageReady(s: Game) {
  const i = industryOf(s);
  return (
    revenue(s) >= i.garageRevenue &&
    completed(s) >= i.garageOrders &&
    revenue(s) - expenses(s) >= 50000 &&
    s.reputation >= 15 &&
    s.upgrades.includes("storage")
  );
}
function task(s: Game, t: TutorialTask) {
  const o = s.onboarding;
  if (o?.mode === "active" && !o.tasks.includes(t)) o.tasks.push(t);
}
function tutorialReward(s: Game) {
  const o = s.onboarding;
  if (
    o?.mode === "active" &&
    TUTORIAL_TASKS.every(([t]) => o.tasks.includes(t))
  ) {
    o.mode = "complete";
    if (!o.rewarded) {
      entry(s, "Tutorial completion grant", 10000, "grant");
      o.rewarded = true;
    }
  }
}
function achievements(s: Game) {
  const earned = [
    s.designs.length > 0 && "Independent designer",
    s.jobs.length > 0 && "Made by you",
    completed(s) > 0 && "First sale",
    completed(s) >= 5 && "First five",
    s.followers >= 100 && "A growing audience",
    s.upgrades.length > 0 && "Reinvested",
    garageReady(s) && "Garage ready",
  ];
  for (const name of earned)
    if (name && !s.achievements.includes(name)) s.achievements.push(name);
}
export function act(state: Game, action: Action): Game {
  const s = clone(state);
  switch (action.type) {
    case "waypoint":
      check(action.position.every(Number.isFinite), "Invalid waypoint.");
      s.waypoint = action.position;
      break;
    case "tutorial-start": {
      const old = s.onboarding;
      s.onboarding = {
        mode: "active",
        tasks:
          old?.mode === "complete" ||
          (old?.rewarded &&
            TUTORIAL_TASKS.every(([t]) => old.tasks.includes(t)))
            ? []
            : old?.tasks || [],
        rewarded: old?.rewarded || false,
      };
      s.tutorial = true;
      break;
    }
    case "tutorial-skip":
      s.onboarding = {
        mode: "skipped",
        tasks: s.onboarding?.tasks || [],
        rewarded: s.onboarding?.rewarded || false,
      };
      s.tutorial = false;
      break;
    case "tutorial-event":
      check(
        TUTORIAL_TASKS.some(([t]) => t === action.task),
        "Unknown tutorial task.",
      );
      task(s, action.task);
      break;
    case "prototype":
    case "contract":
    case "inspect":
    case "label": {
      const d = s.designs.find((d) => d.id === action.id);
      check(d, "Save a product first.");
      const industry = industryOf(s).id;
      const p = productOf(d!);
      check(!s.jobs.length, "Your workstation is busy.");
      let quantity = 1,
        seconds = 6;
      if (action.type === "prototype") {
        check(industry === "mtb", "Only MTB designs need this prototype step.");
        check(!d!.prototypeApproved, "Prototype already approved.");
        spend(s, "Prototype materials & setup", 1500);
        seconds = s.upgrades.includes("press") ? 6 : 12;
        quantity = 0;
      }
      if (action.type === "contract") {
        check(industry !== "streetwear", "Use the heat press for clothing.");
        check(
          industry !== "mtb" || d!.prototypeApproved,
          "Approve a prototype before contracting a batch.",
        );
        quantity = s.property === "garage" ? 6 : 3;
        check(occupied(s) + quantity <= capacity(s), "Storage full.");
        spend(
          s,
          industryOf(s).supplier + " · " + quantity + " " + p.name,
          quantity * p.unitCost,
        );
        seconds = p.seconds;
        task(s, "materials");
      }
      if (action.type === "inspect") {
        check(industry === "mtb", "Inspection is an MTB workflow.");
        quantity = d!.rawStock || 0;
        check(quantity > 0, "Wait for the supplier batch to arrive.");
        d!.rawStock = 0;
        seconds = s.upgrades.includes("press") ? 5 : 10;
      }
      if (action.type === "label") {
        check(
          industry === "haircare",
          "Use this station for accessory labels.",
        );
        check((d!.rawStock || 0) > 0, "Source an accessory batch first.");
        check((s.labels || 0) > 0, "Buy more paper labels.");
        d!.rawStock!--;
        s.labels!--;
        spend(s, "Label ink & presentation", 150);
        seconds = s.upgrades.includes("press") ? 3 : 6;
      }
      s.jobs.push({
        id: id(s),
        designId: action.id,
        end: s.time + seconds,
        kind: action.type,
        quantity,
      });
      break;
    }
    case "door":
      s.doorOpen = !s.doorOpen;
      break;
    case "lights":
      s.lightsOn = s.lightsOn === false;
      break;
    case "wear": {
      if (!action.id) {
        s.equipped = undefined;
        break;
      }
      const d = s.designs.find((d) => d.id === action.id);
      check(d, "Design not found.");
      check(!d!.kind || d!.kind === "shirt", "Only clothing can be equipped.");
      s.wardrobe ??= [];
      if (!s.wardrobe.includes(action.id)) {
        check(d!.stock > 0, "Manufacture a sample first.");
        d!.stock--;
        s.wardrobe.push(action.id);
      }
      s.equipped = action.id;
      break;
    }

    case "design": {
      const d = action.design;
      check(
        d.name.trim() && d.name.length <= 40,
        "Give your design a name (up to 40 characters).",
      );
      check(
        Number.isSafeInteger(d.price) && d.price >= 100 && d.price <= 50000,
        "Price must be between $1 and $500.",
      );
      check(
        s.designs.length < 30,
        "This studio supports up to 30 saved designs.",
      );
      check(
        industryOf(s).products.includes(d.kind || "shirt"),
        "This product does not belong to your industry.",
      );
      task(s, "design");
      task(s, "price");
      s.designs.push({
        ...d,
        rawStock: 0,
        prototypeApproved: false,
        id: id(s),
        stock: 0,
        text: d.text.slice(0, 24),
      });
      break;
    }
    case "price":
      check(
        Number.isSafeInteger(action.price) &&
          action.price >= 100 &&
          action.price <= 50000,
        "Price must be between $1 and $500.",
      );
      {
        const d = s.designs.find((d) => d.id === action.id);
        check(d, "Design not found.");
        d!.price = action.price;
        task(s, "price");
      }
      break;
    case "buy": {
      check(
        Number.isSafeInteger(action.quantity) &&
          action.quantity > 0 &&
          action.quantity <= 20,
        "Choose 1–20 units.",
      );
      check(
        action.item !== "blanks" || industryOf(s).id === "streetwear",
        "This company sources finished components, not cotton blanks.",
      );
      check(
        action.item !== "labels" || industryOf(s).id === "haircare",
        "Labels are used by the hair-accessory business.",
      );
      if (action.item === "blanks")
        check(
          occupied(s) + action.quantity <= capacity(s),
          "Storage full. Ship stock or upgrade your shelving.",
        );
      else
        check(
          (action.item === "labels" ? s.labels || 0 : s.packaging) +
            action.quantity <=
            100,
          "Packaging shelf holds 100 mailers.",
        );
      spend(
        s,
        `${action.quantity} ${action.item}`,
        action.quantity *
          (action.item === "blanks"
            ? E.blank
            : action.item === "labels"
              ? 50
              : E.packaging),
      );
      s[action.item] = (s[action.item] || 0) + action.quantity;
      task(s, "materials");
      break;
    }
    case "produce":
      check(
        industryOf(s).id === "streetwear",
        "This company does not use a heat press.",
      );
      check(
        s.designs.some((d) => d.id === action.id),
        "Save a design first.",
      );
      check(s.blanks > 0, "Buy more blank shirts.");
      check(s.jobs.length === 0, "The press is busy.");
      spend(s, "Heat transfer ink", E.ink);
      s.blanks--;
      s.jobs.push({
        id: id(s),
        designId: action.id,
        end: s.time + (s.upgrades.includes("press") ? 7 : E.productionSeconds),
      });
      break;
    case "post": {
      check(
        s.designs.some((d) => d.stock > 0),
        "Produce a saleable product before advertising.",
      );
      check(
        s.time - s.lastPost >= E.postCooldown,
        `Your audience needs a breather. Wait ${Math.ceil(E.postCooldown - s.time + s.lastPost)}s.`,
      );
      spend(s, "SocialHub promotion", E.postCost);
      s.lastPost = s.time;
      task(s, "promote");
      const views = Math.round(
        (65 + s.followers * 0.2) * (s.upgrades.includes("studio") ? 1.5 : 1),
      );
      s.followers += Math.round(views * 0.12);
      s.demand += 3;
      s.posts.unshift({
        id: id(s),
        time: s.time,
        caption:
          action.caption.trim().slice(0, 160) ||
          "Our first independent release. #madebyus",
        views,
        likes: Math.round(views * 0.16),
      });
      break;
    }
    case "pack": {
      const o = s.orders.find((o) => o.id === action.id);
      check(o?.status === "ordered", "Order has already been packed.");
      check(s.packaging > 0, "Buy packaging from the supplier.");
      s.packaging--;
      task(s, "pack");
      o!.status = "packed";
      break;
    }
    case "ship": {
      const o = s.orders.find((o) => o.id === action.id);
      check(o?.status === "packed", "Pack this order before shipping.");
      spend(s, "Postage · " + o!.customer, E.shipping);
      o!.status = "shipping";
      o!.arrives = s.time + E.deliverySeconds;
      break;
    }
    case "upgrade": {
      if (action.id === "garage") {
        check(s.property !== "garage", "Garage already owned.");
        check(
          garageReady(s),
          "Garage needs revenue, profitability, reputation, fulfilled orders and shelving.",
        );
        spend(s, "Garage workshop purchase", industryOf(s).garageCost);
        s.property = "garage";
        s.player = [30, -14];
        break;
      }
      const u = industryUpgrades(industryOf(s).id).find(
        (u) => u.id === action.id,
      );
      check(u, "Unknown upgrade.");
      check(!s.upgrades.includes(action.id), "Already installed.");
      check(
        completed(s) >= u!.orders,
        `Deliver ${u!.orders} orders to unlock this upgrade.`,
      );
      spend(s, u!.name, u!.cost);
      s.upgrades.push(action.id);
      break;
    }
    case "wall":
      check(/^#[0-9a-fA-F]{6}$/.test(action.color), "Choose a valid colour.");
      s.wall = action.color;
      break;
    case "tutorial":
      s.tutorial = !s.tutorial;
      break;
    case "identity":
      check(action.brand.trim(), "Brand name cannot be empty.");
      s.brand = action.brand.trim().slice(0, 28);
      s.slogan = action.slogan.slice(0, 70);
      break;
  }
  tutorialReward(s);
  achievements(s);
  return s;
}
export function tick(state: Game, seconds = 1): Game {
  check(
    Number.isInteger(seconds) && seconds >= 0 && seconds <= 3600,
    "Invalid clock step.",
  );
  const s = clone(state);
  for (let i = 0; i < seconds; i++) {
    s.time++;
    for (const j of s.jobs.filter((j) => j.end <= s.time)) {
      const d = s.designs.find((d) => d.id === j.designId);
      if (d) {
        const quantity = j.quantity ?? 1;
        if (j.kind === "prototype") d.prototypeApproved = true;
        else if (j.kind === "contract")
          d.rawStock = (d.rawStock || 0) + quantity;
        else {
          d.stock += quantity;
          task(s, "produce");
        }
      }
    }
    s.jobs = s.jobs.filter((j) => j.end > s.time);
    for (const o of s.orders.filter(
      (o) => o.status === "shipping" && o.arrives! <= s.time,
    )) {
      o.status = "delivered";
      task(s, "deliver");
      entry(s, "Sale · " + o.customer, o.price, "revenue");
      s.reputation = Math.min(100, s.reputation + 1);
    }
    if (
      s.demand > 0 &&
      s.time - s.lastDemand >= 10 &&
      s.orders.filter((o) => o.status !== "delivered").length < 10
    ) {
      s.lastDemand = s.time;
      const d = s.designs.find(
        (d) =>
          d.stock > 0 && d.price <= productOf(d).budget + s.reputation * 80,
      );
      if (d) {
        d.stock--;
        task(s, "order");
        s.demand--;
        s.orders.push({
          id: id(s),
          designId: d.id,
          customer: [
            "Alex R.",
            "Jordan K.",
            "Sam T.",
            "Riley M.",
            "Casey L.",
            "Morgan W.",
          ][s.orders.length % 6],
          price: d.price,
          status: "ordered",
        });
      }
    }
  }
  tutorialReward(s);
  achievements(s);
  return s;
}
export function objective(s: Game): {
  title: string;
  detail: string;
  panel: string;
} {
  if (!s.designs.length)
    return {
      title: "Make it yours.",
      detail:
        "Create and save your first " +
        productOf({ kind: industryOf(s).products[0] }).name +
        " in the Design Studio.",
      panel: "design",
    };
  if (!s.designs.some((d) => d.stock) && !s.orders.length)
    return {
      title: "From idea to object.",
      detail: industryOf(s).workflow,
      panel: "production",
    };
  if (!s.posts.length)
    return {
      title: "Find your people.",
      detail: "Share your first release on SocialHub.",
      panel: "social",
    };
  if (!completed(s))
    return {
      title: "Your first customer.",
      detail:
        "Pack an order, pay postage, and wait for delivery to earn your first sale.",
      panel: "orders",
    };
  if (completed(s) < 5)
    return {
      title: "Five sales. A real beginning.",
      detail: `Deliver ${5 - completed(s)} more orders. Reinvest your earnings into materials.`,
      panel: "orders",
    };
  return {
    title: "Build beyond the bedroom.",
    detail:
      "Invest in a garage when you meet the financial, quality and fulfilment milestones in Workspace.",
    panel: "upgrades",
  };
}
