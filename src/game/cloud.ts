import { openDB } from "idb";
import type { Game } from "./simulation";
import { validateSave } from "./schema";
type User = { id: string; email: string };
type Remote = {
  id: string;
  revision: number;
  game: Game | null;
  updatedAt: number;
};
type Cached = {
  owner: string;
  id: string;
  game: Game | null;
  revision: number;
  savedAt: number;
};
type Job = {
  owner: string;
  id: string;
  game: Game | null;
  baseRevision: number;
  mutationId: string;
};
export const cloudState: {
  user: User | null;
  session:boolean;
  blocked:boolean;
  status: string;
  available: boolean;
  conflicts: string[];
} = { user: null, session:false,blocked:false,status: "Local saving", available: false, conflicts: [] };
const db = () =>
  openDB("company-tycoon-cloud", 1, {
    upgrade(d) {
      for (const name of ["companies", "jobs", "conflicts", "meta", "slots"])
        d.createObjectStore(name);
    },
  });
const key = (owner: string, id: string) => owner + ":" + id;
let active: string | null = null;
let running: Promise<void> | null = null;
const changed = () => window.dispatchEvent(new Event("company-cloud-change"));
export function setCloudActive(id: string | null) {
  active = id;
}
export function cloudOwner() {
  return cloudState.user?.id || null;
}
class ApiError extends Error {
  constructor(
    public status: number,
    public data: Record<string, unknown>,
  ) {
    super(String(data.error || "Cloud request failed."));
  }
}
async function request(path: string, body?: unknown) {
  const r = await fetch("/api/" + path, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    signal: AbortSignal.timeout(10000),
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(path.startsWith("companies") && cloudOwner()
        ? { "X-Company-Account": cloudOwner()! }
        : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await r
    .json()
    .catch(() => ({ error: "Cloud service unavailable." }));
  if (!r.ok) throw new ApiError(r.status, data);
  return data;
}
export async function initializeCloud() {
  const d = await db();
  try {
    const h = await request("health");
    cloudState.available = !!h.available;
    if (!h.available) {
      cloudState.user=(await d.get("meta","lastUser"))||null;
      cloudState.status = cloudState.user?"Cloud unavailable · cached account saved locally":"Cloud not configured · local saving";
      changed();
      return;
    }
    const s = await request("auth/session");
    if(active&&cloudState.user&&cloudState.user.id!==s.user.id){cloudState.blocked=true;cloudState.session=false;cloudState.status='Account changed · reload before syncing';changed();return;}
    cloudState.session=true;cloudState.blocked=false;
    cloudState.user = s.user;
    await d.put("meta", s.user, "lastUser");
    cloudState.status = "Connecting cloud…";
    await syncCloud();
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      cloudState.user=(await d.get('meta','lastUser'))||null;cloudState.session=false;
      cloudState.status = cloudState.user?'Session expired · local saves queued':'Local saving · sign in for cloud';
    } else {
      cloudState.user = (await d.get("meta", "lastUser")) || null;
      cloudState.status = cloudState.user
        ? "Offline · saved on this device"
        : "Local saving · cloud unavailable";
    }
  }
  changed();
}
export async function requestCode(email: string) {
  return request("auth/request", { email });
}
export async function verifyCode(challenge: string, code: string) {
  const s = await request("auth/verify", { challenge, code });
  const d = await db();
  cloudState.user = s.user;
  cloudState.session=true;cloudState.blocked=false;
  await d.put("meta", s.user, "lastUser");
  await syncCloud();
  changed();
}
export async function logoutCloud() {
  try{await request("auth/logout", {});}catch(e){if(!(e instanceof ApiError&&e.status===401))throw e;}
  const d = await db();
  await d.delete("meta", "lastUser");
  cloudState.user = null;cloudState.session=false;cloudState.blocked=false;
  cloudState.status = "Local saving";
  changed();
}
export async function cloudSave(slot: string, game: Game) {
  const owner = cloudOwner();
  if (!owner) throw new Error("Cloud account is not selected.");
  const d = await db(),
    id = game.companyId!;
  const tx = d.transaction(
    ["companies", "jobs", "conflicts", "meta", "slots"],
    "readwrite",
  );
  const k = key(owner, id);
  const old: Cached | undefined = await tx.objectStore("companies").get(k);
  const valid = validateSave(game);
  if (slot !== "autosave") {
    await tx
      .objectStore("slots")
      .put({ game: valid, savedAt: Date.now() }, k + ":" + slot);
    await tx.done;
    return;
  }
  const value = {
    owner,
    id,
    game: valid,
    revision: old?.revision || 0,
    savedAt: Date.now(),
  };
  await tx.objectStore("companies").put(value, k);
  await tx.objectStore("meta").put(id, owner + ":active");
  if (!(await tx.objectStore("conflicts").get(k)))
    await tx
      .objectStore("jobs")
      .put(
        {
          owner,
          id,
          game: valid,
          baseRevision: old?.revision || 0,
          mutationId: crypto.randomUUID(),
        },
        k,
      );
  await tx.done;
  cloudState.status = "Saved locally · cloud sync pending";
  changed();
  void syncCloud();
}
export async function cloudCompanies() {
  const d = await db();
  return ((await d.getAll("companies")) as Cached[])
    .filter((r) => r.owner === cloudOwner() && r.game)
    .map((r) => ({ game: validateSave(r.game), savedAt: r.savedAt }))
    .sort((a, b) => b.savedAt - a.savedAt);
}
export async function cloudLoad(slot: string) {
  const d = await db(),
    owner = cloudOwner()!;
  let id = await d.get("meta", owner + ":active");
  if (!id) {
    const latest = (await cloudCompanies())[0];
    if (latest) {
      id = latest.game.companyId;
      await d.put("meta", id, owner + ":active");
    }
  }
  if (slot !== "autosave") return d.get("slots", key(owner, id) + ":" + slot);
  const r: Cached | undefined = await d.get("companies", key(owner, id));
  return r?.game
    ? { game: validateSave(r.game), savedAt: r.savedAt }
    : undefined;
}
export async function cloudSlots() {
  const results = [];
  for (const slot of ["autosave", "slot-1", "slot-2", "slot-3"]) {
    const s = await cloudLoad(slot);
    if (s) results.push({ ...s, slot });
  }
  return results;
}
export async function cloudDelete(id: string) {
  const owner = cloudOwner()!,
    d = await db(),
    k = key(owner, id);
  const tx = d.transaction(["companies", "jobs", "meta"], "readwrite");
  const r: Cached | undefined = await tx.objectStore("companies").get(k);
  if (r) {
    await tx.objectStore("companies").put({ ...r, game: null }, k);
    await tx
      .objectStore("jobs")
      .put(
        {
          owner,
          id,
          game: null,
          baseRevision: r.revision,
          mutationId: crypto.randomUUID(),
        },
        k,
      );
  }
  if ((await tx.objectStore("meta").get(owner + ":active")) === id)
    await tx.objectStore("meta").delete(owner + ":active");
  await tx.done;
  void syncCloud();
}
async function conflict(owner: string, id: string, remote: Remote) {
  const d = await db();
  await d.put("conflicts", remote, key(owner, id));
}
async function sync() {
  const owner = cloudOwner();
  if (!owner || !cloudState.available || cloudState.blocked) return;
  const d = await db();
  try {
    const session = await request("auth/session");
    if(session.user.id!==owner){cloudState.blocked=true;cloudState.session=false;cloudState.status='Account changed · reload before syncing';changed();return;}
    for (const job of (await d.getAll("jobs")) as Job[]) {
      if (job.owner !== owner || (await d.get("conflicts", key(owner, job.id))))
        continue;
      const r = await fetch("/api/companies/" + encodeURIComponent(job.id), {
        method: "PUT",
        signal: AbortSignal.timeout(10000),
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-Company-Account": owner,
        },
        body: JSON.stringify({
          game: job.game,
          baseRevision: job.baseRevision,
          mutationId: job.mutationId,
        }),
      });
      const result = await r.json();
      if (r.status === 409) {
        if (result.current) await conflict(owner, job.id, result.current);
        continue;
      }
      if (!r.ok) throw new ApiError(r.status, result);
      const tx = d.transaction(["companies", "jobs"], "readwrite"),
        k = key(owner, job.id);
      const current: Cached | undefined = await tx
        .objectStore("companies")
        .get(k);
      const pending: Job | undefined = await tx.objectStore("jobs").get(k);
      if (current)
        await tx
          .objectStore("companies")
          .put(
            {
              ...current,
              revision: Math.max(current.revision, result.revision),
            },
            k,
          );
      if (pending?.mutationId === job.mutationId)
        await tx.objectStore("jobs").delete(k);
      else if (pending)
        await tx
          .objectStore("jobs")
          .put(
            {
              ...pending,
              baseRevision: Math.max(pending.baseRevision, result.revision),
            },
            k,
          );
      await tx.done;
    }
    let after = "";
    do {
      const page = await request(
        "companies?after=" + encodeURIComponent(after),
      );
      for (const remote of page.companies as Remote[]) {
        const k = key(owner, remote.id),
          tx = d.transaction(["companies", "jobs", "conflicts"], "readwrite");
        const local: Cached | undefined = await tx
          .objectStore("companies")
          .get(k);
        const pending = await tx.objectStore("jobs").get(k);
        if (
          local &&
          remote.revision > local.revision &&
          (pending || active === remote.id)
        ) {
          await tx.objectStore("conflicts").put(remote, k);
        } else if (!pending && (!local || remote.revision > local.revision)) {
          await tx
            .objectStore("companies")
            .put(
              {
                owner,
                id: remote.id,
                game: remote.game ? validateSave(remote.game) : null,
                revision: remote.revision,
                savedAt: remote.updatedAt,
              },
              k,
            );
        }
        await tx.done;
      }
      after = page.next || "";
    } while (after);
    const conflicts = (await d.getAllKeys("conflicts"))
      .map(String)
      .filter((k) => k.startsWith(owner + ":"));
    cloudState.conflicts = conflicts.map((k) => k.slice(owner.length + 1));
    const jobs = ((await d.getAll("jobs")) as Job[]).filter(
      (j) => j.owner === owner,
    );
    cloudState.status = conflicts.length
      ? "Sync conflict · both copies preserved"
      : jobs.length
        ? "Saved locally · more changes pending"
        : "Cloud saved";
  } catch (e) {
    if(e instanceof ApiError&&e.status===401)cloudState.session=false;
    cloudState.status =
      e instanceof ApiError
        ? e.status === 401
          ? "Session expired · local saves queued"
          : "Cloud save error: " + e.message + " · saved locally"
        : "Offline · changes saved on this device";
  }
  changed();
}
export function syncCloud() {
  if (!running)
    running = sync().finally(() => {
      running = null;
    });
  return running;
}
export async function keepBoth(id: string) {
  const owner = cloudOwner()!,
    d = await db(),
    k = key(owner, id);
  const tx = d.transaction(["companies", "jobs", "conflicts"], "readwrite");
  const remote: Remote | undefined = await tx.objectStore("conflicts").get(k);
  const local: Cached | undefined = await tx.objectStore("companies").get(k);
  if (!remote) {
    await tx.done;
    return;
  }
  if (local?.game) {
    const nid = crypto.randomUUID(),
      game = {
        ...local.game,
        companyId: nid,
        brand: (local.game.brand + " (offline copy)").slice(0, 28),
      };
    await tx
      .objectStore("companies")
      .put(
        { owner, id: nid, game, revision: 0, savedAt: Date.now() },
        key(owner, nid),
      );
    await tx
      .objectStore("jobs")
      .put(
        {
          owner,
          id: nid,
          game,
          baseRevision: 0,
          mutationId: crypto.randomUUID(),
        },
        key(owner, nid),
      );
  }
  await tx
    .objectStore("companies")
    .put(
      {
        owner,
        id,
        game: remote.game,
        revision: remote.revision,
        savedAt: remote.updatedAt,
      },
      k,
    );
  await tx.objectStore("jobs").delete(k);
  await tx.objectStore("conflicts").delete(k);
  await tx.done;
  await syncCloud();
}
export async function importLocalCompanies(
  saves: { game: Game; savedAt: number }[],
) {
  const owner = cloudOwner()!,
    d = await db();
  for (const s of saves) {
    const marker = owner + ":import:" + s.game.companyId;
    if (await d.get("meta", marker)) continue;
    const game = { ...s.game, companyId: crypto.randomUUID() };
    const tx = d.transaction(["meta", "companies", "jobs"], "readwrite");
    const k = key(owner, game.companyId);
    await tx
      .objectStore("companies")
      .put(
        { owner, id: game.companyId, game, revision: 0, savedAt: s.savedAt },
        k,
      );
    await tx
      .objectStore("jobs")
      .put(
        {
          owner,
          id: game.companyId,
          game,
          baseRevision: 0,
          mutationId: crypto.randomUUID(),
        },
        k,
      );
    await tx.objectStore("meta").put(true, marker);
    await tx.done;
  }
  await syncCloud();
}

export async function flushCloud() {
  await syncCloud();
  for (
    let i = 0;
    i < 3 && cloudState.status === "Saved locally · more changes pending";
    i++
  )
    await syncCloud();
}
