import {
  cloudOwner,
  cloudSave,
  cloudLoad,
  cloudSlots,
  cloudCompanies,
  cloudDelete,
} from "./cloud";
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
export { validateSave } from "./schema";
import { validateSave } from "./schema";

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
  if (cloudOwner()) return cloudSave(slot, game);
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
  if (cloudOwner()) return cloudLoad(slot);
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
  if (cloudOwner()) return cloudSlots();
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
  if (cloudOwner()) return cloudCompanies();
  return localCompanies();
}
export async function localCompanies(): Promise<Save[]> {
  await migrateCompanies();
  const d = await db();
  return (await d.getAll("companies")).sort((a, b) => b.savedAt - a.savedAt);
}
export async function removeCompany(cid: string) {
  if (cloudOwner()) return cloudDelete(cid);
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
