import { validateWorkshop } from "./workshop";
import { industryOf, INDUSTRIES, TUTORIAL_TASKS } from "./industries";
import { openDB } from "idb";
import type { Game } from "./simulation";
const db = () =>
  openDB("streetwear-empire", 2, {
    upgrade(d) {
      if (!d.objectStoreNames.contains("saves")) d.createObjectStore("saves");
      if (!d.objectStoreNames.contains("companies"))
        d.createObjectStore("companies");
      if (!d.objectStoreNames.contains("meta")) d.createObjectStore("meta");
    },
  });
export type Save = { game: Game; savedAt: number };
export function validateSave(value: unknown): Game {
  if (!value || typeof value !== "object")
    throw new Error("Invalid save file.");
  const g = value as Game;
  const string = (v: unknown, max = 200) =>
    typeof v === "string" && v.length <= max;
  const color = (v: unknown) =>
    typeof v === "string" && /^#[a-f0-9]{6}$/i.test(v);
  if (g.industry !== undefined && !INDUSTRIES.some((i) => i.id === g.industry))
    throw new Error("Unknown company industry.");
  if (g.property !== undefined && !["home", "garage"].includes(g.property))
    throw new Error("Invalid property.");
  if (
    g.labels !== undefined &&
    (!Number.isSafeInteger(g.labels) || g.labels < 0 || g.labels > 100)
  )
    throw new Error("Invalid label inventory.");
  if (
    g.waypoint !== undefined &&
    (!Array.isArray(g.waypoint) ||
      g.waypoint.length !== 2 ||
      g.waypoint.some((n) => !Number.isFinite(n)))
  )
    throw new Error("Invalid map marker.");
  if (
    g.onboarding &&
    (!["pending", "active", "skipped", "complete"].includes(
      g.onboarding.mode,
    ) ||
      typeof g.onboarding.rewarded !== "boolean" ||
      !Array.isArray(g.onboarding.tasks) ||
      new Set(g.onboarding.tasks).size !== g.onboarding.tasks.length ||
      g.onboarding.tasks.some((t) => !TUTORIAL_TASKS.some(([id]) => id === t)))
  )
    throw new Error("Invalid tutorial progress.");
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
        (d.printPlacement !== undefined &&
          (!Number.isFinite(d.printPlacement) ||
            d.printPlacement < 0 ||
            d.printPlacement > 1)) ||
        (d.printQuality !== undefined &&
          (!Number.isInteger(d.printQuality) ||
            d.printQuality < 1 ||
            d.printQuality > 5)) ||
        (d.collection !== undefined && !string(d.collection, 32)) ||
        (d.season !== undefined &&
          !["All year", "Spring", "Summer", "Autumn", "Winter"].includes(
            d.season,
          )) ||
        (d.finish !== undefined &&
          !["standard", "premium"].includes(d.finish)) ||
        !nonnegative(d.stock) ||
        !industryOf(g).products.includes(d.kind || "shirt") ||
        (d.rawStock !== undefined && !nonnegative(d.rawStock)) ||
        (d.prototypeApproved !== undefined &&
          typeof d.prototypeApproved !== "boolean") ||
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
  if (
    g.blankQuality !== undefined &&
    (!Number.isInteger(g.blankQuality) ||
      g.blankQuality < 1 ||
      g.blankQuality > 5)
  )
    throw new Error("Invalid material quality.");
  validateWorkshop(g);
  const designIds = new Set(g.designs.map((d) => d.id));
  if (
    g.deliveries !== undefined &&
    (!Array.isArray(g.deliveries) ||
      new Set(g.deliveries.map((d) => d.id)).size !== g.deliveries.length ||
      g.deliveries.some(
        (d) =>
          (d.picked !== undefined && typeof d.picked !== "boolean") ||
          (d.quality !== undefined &&
            (!Number.isInteger(d.quality) || d.quality < 1 || d.quality > 5)) ||
          !string(d.id) ||
          !["blanks", "packaging", "labels", "batch"].includes(d.item) ||
          !Number.isSafeInteger(d.quantity) ||
          d.quantity < 1 ||
          d.quantity > 60 ||
          !nonnegative(d.arrives) ||
          (d.item === "batch" && !designIds.has(d.designId!)),
      ))
  )
    throw new Error("Invalid supplier deliveries.");
  if (
    g.favourites !== undefined &&
    (!Array.isArray(g.favourites) ||
      g.favourites.some((k) => !industryOf(g).products.includes(k)))
  )
    throw new Error("Invalid favourites.");
  if (
    (g.storeOpen !== undefined && typeof g.storeOpen !== "boolean") ||
    (g.storeTheme !== undefined &&
      !["midnight", "paper", "violet"].includes(g.storeTheme)) ||
    (g.listed !== undefined &&
      (!Array.isArray(g.listed) || g.listed.some((id) => !designIds.has(id))))
  )
    throw new Error("Invalid online store.");
  if (
    designIds.size !== g.designs.length ||
    new Set(g.orders.map((o) => o.id)).size !== g.orders.length ||
    g.orders.some(
      (o) =>
        (o.brandedInsert !== undefined &&
          typeof o.brandedInsert !== "boolean") ||
        (o.physical !== undefined && typeof o.physical !== "boolean") ||
        !string(o.id) ||
        !string(o.customer) ||
        !designIds.has(o.designId) ||
        !nonnegative(o.price) ||
        !["ordered", "packed", "shipping", "delivered"].includes(o.status) ||
        (o.status === "shipping" && !nonnegative(o.arrives)),
    ) ||
    g.jobs.some(
      (j) =>
        !string(j.id) ||
        !designIds.has(j.designId) ||
        !nonnegative(j.end) ||
        (j.kind !== undefined &&
          !["print", "prototype", "contract", "inspect", "label"].includes(
            j.kind,
          )) ||
        (j.quantity !== undefined &&
          (!nonnegative(j.quantity) || j.quantity > 60)),
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
        !["expense", "revenue", "grant"].includes(e.type) ||
        (e.type === "expense" && e.amount > 0) ||
        ((e.type === "revenue" || e.type === "grant") && e.amount < 0),
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
  const industry = industryOf(g).id;
  if (
    g.jobs.some((j) =>
      !j.kind || j.kind === "print"
        ? industry !== "streetwear"
        : j.kind === "label"
          ? industry !== "haircare"
          : j.kind === "contract"
            ? industry === "streetwear"
            : industry !== "mtb",
    )
  )
    throw new Error("Invalid industry job.");
  if (
    g.onboarding?.mode === "complete" &&
    !TUTORIAL_TASKS.every(([t]) => g.onboarding!.tasks.includes(t))
  )
    throw new Error("Incomplete tutorial task evidence.");
  const grants = g.ledger.filter((e) => e.type === "grant");
  if (
    grants.length > 1 ||
    grants.some(
      (e) => e.amount !== 10000 || e.label !== "Tutorial completion grant",
    ) ||
    (grants.length === 1 && !g.onboarding?.rewarded)
  )
    throw new Error("Invalid tutorial reward.");
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

// Original save records are retained as recovery backups. Migration is idempotent.
export async function migrateCompanies() {
  const d = await db();
  const tx = d.transaction(["saves", "companies", "meta"], "readwrite");
  if (!(await tx.objectStore("meta").get("migrated"))) {
    const keys = await tx.objectStore("saves").getAllKeys();
    for (const key of keys) {
      const old = await tx.objectStore("saves").get(key);
      if (!old?.game) continue;
      const g = validateSave(old.game);
      const cid = g.companyId || "legacy-" + String(key);
      g.companyId = cid;
      if (!(await tx.objectStore("companies").get(cid)))
        await tx.objectStore("companies").put({ ...old, game: g }, cid);
      if (key === "autosave") await tx.objectStore("meta").put(cid, "active");
    }
    await tx.objectStore("meta").put(true, "migrated");
  }
  await tx.done;
}
export async function saveGame(slot: string, game: Game) {
  await migrateCompanies();
  const g = validateSave(game);
  g.companyId ??= crypto.randomUUID();
  const d = await db();
  const tx = d.transaction(["saves", "companies", "meta"], "readwrite");
  const value = { game: g, savedAt: Date.now() };
  if (slot === "autosave") {
    await tx.objectStore("companies").put(value, g.companyId);
    await tx.objectStore("meta").put(g.companyId, "active");
  } else await tx.objectStore("saves").put(value, g.companyId + ":" + slot);
  await tx.done;
}
export async function loadGame(slot: string): Promise<Save | undefined> {
  await migrateCompanies();
  const d = await db();
  const cid = await d.get("meta", "active");
  const s =
    slot === "autosave"
      ? await d.get("companies", cid || "__none")
      : await d.get("saves", cid + ":" + slot);
  return s ? { ...s, game: validateSave(s.game) } : undefined;
}
export async function listSaves(): Promise<(Save & { slot: string })[]> {
  await migrateCompanies();
  const d = await db();
  const cid = await d.get("meta", "active");
  const results: (Save & { slot: string })[] = [];
  const current = await d.get("companies", cid || "__none");
  if (current) results.push({ ...current, slot: "autosave" });
  for (const slot of ["slot-1", "slot-2", "slot-3"]) {
    const s = await d.get("saves", cid + ":" + slot);
    if (s) results.push({ ...s, slot });
  }
  return results;
}
export async function listCompanies(): Promise<Save[]> {
  await migrateCompanies();
  const d = await db();
  return (await d.getAll("companies")).sort((a, b) => b.savedAt - a.savedAt);
}
export async function removeCompany(cid: string) {
  const d = await db();
  const tx = d.transaction(["companies", "saves", "meta"], "readwrite");
  await tx.objectStore("companies").delete(cid);
  for (const key of await tx.objectStore("saves").getAllKeys())
    if (String(key).startsWith(cid + ":"))
      await tx.objectStore("saves").delete(key);
  if ((await tx.objectStore("meta").get("active")) === cid)
    await tx.objectStore("meta").delete("active");
  await tx.done;
}
