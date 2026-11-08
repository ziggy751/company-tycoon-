import type { Game } from "./simulation";
export function validateSave(value: unknown): Game {
  if (!value || typeof value !== "object")
    throw new Error("Invalid save file.");
  const g = value as Game;
  const string = (v: unknown, max = 200) =>
    typeof v === "string" && v.length <= max;
  const color = (v: unknown) =>
    typeof v === "string" && /^#[a-f0-9]{6}$/i.test(v);
  if (g.version !== 1) throw new Error("Unsupported save version.");
  const nonnegative = (n: unknown) => Number.isSafeInteger(n) && Number(n) >= 0;
  if (
    ![
      "cash",
      "blanks",
      "packaging",
      "time",
      "followers",
      "reputation",
      "nextId",
      "demand",
    ].every((k) => nonnegative(g[k as keyof Game])) ||
    typeof g.brand !== "string"
  )
    throw new Error("Invalid save balances.");
  if (
    !Array.isArray(g.designs) ||
    !Array.isArray(g.orders) ||
    !Array.isArray(g.jobs) ||
    !Array.isArray(g.posts) ||
    !Array.isArray(g.ledger) ||
    !Array.isArray(g.upgrades) ||
    !Array.isArray(g.achievements)
  )
    throw new Error("Incomplete save.");
  if (
    !string(g.brand, 28) ||
    !string(g.slogan, 70) ||
    !string(g.aesthetic, 40) ||
    !color(g.founder) ||
    typeof g.tutorial !== "boolean" ||
    g.reputation > 100 ||
    g.jobs.length > 1 ||
    g.designs.length > 30 ||
    g.posts.length > 100000 ||
    g.orders.length > 100000 ||
    g.ledger.length > 500000
  )
    throw new Error("Invalid campaign data.");
  if (
    g.posts.some(
      (p) =>
        !string(p.id) ||
        !string(p.caption, 160) ||
        !nonnegative(p.time) ||
        !nonnegative(p.views) ||
        !nonnegative(p.likes),
    ) ||
    g.upgrades.some((u) => !["storage", "press", "studio"].includes(u)) ||
    new Set(g.upgrades).size !== g.upgrades.length ||
    g.achievements.some((a) => !string(a))
  )
    throw new Error("Invalid campaign history.");
  if (
    g.designs.some(
      (d) =>
        !nonnegative(d.stock) ||
        !nonnegative(d.price) ||
        typeof d.id !== "string" ||
        !string(d.name, 40) ||
        !string(d.text, 24) ||
        !["Regular", "Oversized", "Boxy"].includes(d.fit) ||
        !["type", "orbit", "none"].includes(d.graphic) ||
        d.price < 100 ||
        d.price > 50000 ||
        !/^#[a-f0-9]{6}$/i.test(d.color) ||
        !/^#[a-f0-9]{6}$/i.test(d.ink),
    )
  )
    throw new Error("Invalid design data.");
  const designIds = new Set(g.designs.map((d) => d.id));
  if (
    designIds.size !== g.designs.length ||
    new Set(g.orders.map((o) => o.id)).size !== g.orders.length ||
    g.orders.some(
      (o) =>
        !string(o.id) ||
        !string(o.customer) ||
        !designIds.has(o.designId) ||
        !nonnegative(o.price) ||
        !["ordered", "packed", "shipping", "delivered"].includes(o.status) ||
        (o.status === "shipping" && !nonnegative(o.arrives)),
    ) ||
    g.jobs.some(
      (j) => !string(j.id) || !designIds.has(j.designId) || !nonnegative(j.end),
    )
  )
    throw new Error("Invalid order or production data.");
  if (
    g.ledger.some(
      (e) =>
        !string(e.id) ||
        !string(e.label) ||
        !Number.isSafeInteger(e.amount) ||
        !nonnegative(e.time) ||
        !["expense", "revenue"].includes(e.type) ||
        (e.type === "expense" && e.amount > 0) ||
        (e.type === "revenue" && e.amount < 0),
    ) ||
    new Set(g.ledger.map((e) => e.id)).size !== g.ledger.length ||
    50000 + g.ledger.reduce((n, e) => n + e.amount, 0) !== g.cash
  )
    throw new Error("Save ledger does not reconcile.");
  if (
    !Number.isFinite(g.lastPost) ||
    !nonnegative(g.lastDemand) ||
    !/^#[a-f0-9]{6}$/i.test(g.wall) ||
    !/^#[a-f0-9]{6}$/i.test(g.accent) ||
    !Array.isArray(g.player) ||
    g.player.length !== 2 ||
    g.player.some((n) => !Number.isFinite(n))
  )
    throw new Error("Invalid world data.");
  if (g.companyId !== undefined && !string(g.companyId, 100))
    throw new Error("Invalid company identity.");
  if (
    g.wardrobe !== undefined &&
    (!Array.isArray(g.wardrobe) ||
      new Set(g.wardrobe).size !== g.wardrobe.length ||
      g.wardrobe.some((id) => !designIds.has(id)))
  )
    throw new Error("Invalid wardrobe.");
  if (g.equipped !== undefined && !g.wardrobe?.includes(g.equipped))
    throw new Error("Invalid equipped sample.");
  for (const k of ["doorOpen", "lightsOn"] as const)
    if (g[k] !== undefined && typeof g[k] !== "boolean")
      throw new Error("Invalid home state.");
  return structuredClone(g);
}
