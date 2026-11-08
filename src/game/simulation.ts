import { ECONOMY as E, UPGRADES } from "./catalog";
export type Design = {
  id: string;
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
  type: "expense" | "revenue";
};
export type Game = {
  version: 1;
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
  jobs: { id: string; designId: string; end: number }[];
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
  | { type: "buy"; item: "blanks" | "packaging"; quantity: number }
  | { type: "produce"; id: string }
  | { type: "post"; caption: string }
  | { type: "pack" | "ship"; id: string }
  | { type: "upgrade"; id: string }
  | { type: "wall"; color: string }
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
  s.upgrades.includes("storage") ? 40 : E.capacity;
export const occupied = (s: Game) =>
  s.blanks +
  s.designs.reduce((v, d) => v + d.stock, 0) +
  s.jobs.length +
  s.orders.filter((o) => o.status === "ordered" || o.status === "packed")
    .length;
export function newGame(
  brand = "AFTERHOURS",
  slogan = "Independent by design.",
  accent = "#d9ed91",
  aesthetic = "Underground",
  founder = "#a77c62",
): Game {
  return {
    version: 1,
    brand: brand.trim().slice(0, 28) || "UNTITLED",
    slogan: slogan.slice(0, 70),
    accent,
    aesthetic,
    founder,
    time: 0,
    cash: 50000,
    blanks: 5,
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
function achievements(s: Game) {
  const earned = [
    s.designs.length > 0 && "Independent designer",
    s.jobs.length > 0 && "Made by you",
    completed(s) > 0 && "First sale",
    completed(s) >= 5 && "First five",
    s.followers >= 100 && "A growing audience",
    s.upgrades.length > 0 && "Reinvested",
    revenue(s) >= 1000000 && "Garage ready",
  ];
  for (const name of earned)
    if (name && !s.achievements.includes(name)) s.achievements.push(name);
}
export function act(state: Game, action: Action): Game {
  const s = clone(state);
  switch (action.type) {
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
      s.designs.push({ ...d, id: id(s), stock: 0, text: d.text.slice(0, 24) });
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
      }
      break;
    case "buy": {
      check(
        Number.isSafeInteger(action.quantity) &&
          action.quantity > 0 &&
          action.quantity <= 20,
        "Choose 1–20 units.",
      );
      if (action.item === "blanks")
        check(
          occupied(s) + action.quantity <= capacity(s),
          "Storage full. Ship stock or upgrade your shelving.",
        );
      else
        check(
          s.packaging + action.quantity <= 100,
          "Packaging shelf holds 100 mailers.",
        );
      spend(
        s,
        `${action.quantity} ${action.item}`,
        action.quantity * (action.item === "blanks" ? E.blank : E.packaging),
      );
      s[action.item] += action.quantity;
      break;
    }
    case "produce":
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
        "Produce a shirt before advertising.",
      );
      check(
        s.time - s.lastPost >= E.postCooldown,
        `Your audience needs a breather. Wait ${Math.ceil(E.postCooldown - s.time + s.lastPost)}s.`,
      );
      spend(s, "SocialHub promotion", E.postCost);
      s.lastPost = s.time;
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
      const u = UPGRADES.find((u) => u.id === action.id);
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
      if (d) d.stock++;
    }
    s.jobs = s.jobs.filter((j) => j.end > s.time);
    for (const o of s.orders.filter(
      (o) => o.status === "shipping" && o.arrives! <= s.time,
    )) {
      o.status = "delivered";
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
        (d) => d.stock > 0 && d.price <= 4900 + s.reputation * 80,
      );
      if (d) {
        d.stock--;
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
      detail: "Create and save your first T-shirt in the Design Studio.",
      panel: "design",
    };
  if (!s.designs.some((d) => d.stock) && !s.orders.length)
    return {
      title: "From idea to object.",
      detail: "Use the heat press to produce your first shirt.",
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
      title: "Five shirts. A real beginning.",
      detail: `Deliver ${5 - completed(s)} more orders. Reinvest your earnings into materials.`,
      panel: "orders",
    };
  return {
    title: "Build beyond the bedroom.",
    detail:
      "Improve your workspace. Garage expansion target: $10,000 revenue (future phase).",
    panel: "upgrades",
  };
}
