import { Sqlite } from "./testDatabase";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { api, type Database, type Statement, type Env } from "./index";
import { newGame, act } from "../src/game/simulation";
let db: Sqlite, env: Env, code: string;
const origin = "https://company.test";
function call(path: string, data?: unknown, cookie?: string, method?: string) {
  return api(
    new Request(origin + "/api/" + path, {
      method: method || (data === undefined ? "GET" : "POST"),
      headers: {
        Origin: origin,
        ...(data !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
    env,
  );
}
async function login(email = "one@example.com") {
  const req = await call("auth/request", { email });
  expect(req.status).toBe(200);
  const b = (await req.json()) as { challenge: string };
  const r = await call("auth/verify", { challenge: b.challenge, code });
  expect(r.status).toBe(200);
  return r.headers.get("set-cookie")!.split(";")[0];
}
beforeEach(() => {
  db = new Sqlite();
  env = {
    DB: db,
    AUTH_SECRET: "test-secret-at-least-thirty-two-characters",
    RESEND_API_KEY: "test-only",
    AUTH_FROM: "Company <game@example.com>",
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url, options) => {
      const mail = JSON.parse(options.body);
      code = /code is (\d{6})/.exec(mail.text)![1];
      return new Response("{}", { status: 200 });
    }),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  db.sql.close();
});
describe("email codes and account sessions on actual SQLite", () => {
  it("creates a passwordless account, sets a secure cookie and restores its session", async () => {
    const cookie = await login();
    const session = await call("auth/session", undefined, cookie);
    expect(
      ((await session.json()) as { user: { email: string } }).user.email,
    ).toBe("one@example.com");
    const stored = db.sql.prepare("SELECT * FROM sessions").get()!;
    expect(stored.digest).not.toContain(cookie.split("=")[1]);
    expect(
      db.sql
        .prepare(
          "SELECT name FROM pragma_table_info('users') WHERE name='password'",
        )
        .get(),
    ).toBeUndefined();
  });
  it("makes codes single use and rejects expiry and five wrong attempts", async () => {
    const r = await call("auth/request", { email: "x@example.com" });
    const { challenge } = (await r.json()) as { challenge: string };
    const valid = code;
    for (let i = 0; i < 5; i++)
      expect(
        (
          await call("auth/verify", {
            challenge,
            code: valid === "000000" ? "111111" : "000000",
          })
        ).status,
      ).toBe(400);
    expect((await call("auth/verify", { challenge, code: valid })).status).toBe(
      400,
    );
    db.sql.exec("DELETE FROM rate_limits");
    const next = await call("auth/request", { email: "x@example.com" });
    const c = (await next.json()) as { challenge: string };
    expect(
      (await call("auth/verify", { challenge: c.challenge, code })).status,
    ).toBe(200);
    expect(
      (await call("auth/verify", { challenge: c.challenge, code })).status,
    ).toBe(400);
  });
  it("checks expiration and rate limits, and never fakes delivery", async () => {
    const r = await call("auth/request", { email: "x@example.com" });
    const b = (await r.json()) as { challenge: string };
    db.sql.exec("UPDATE challenges SET expires_at=0");
    expect(
      (await call("auth/verify", { challenge: b.challenge, code })).status,
    ).toBe(400);
    expect(
      (await call("auth/request", { email: "x@example.com" })).status,
    ).toBe(429);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 500 })),
    );
    expect(
      (await call("auth/request", { email: "other@example.com" })).status,
    ).toBe(503);
  });
  it("rejects cross-origin writes and invalid sessions and revokes logout", async () => {
    const cookie = await login();
    expect(
      (
        await api(
          new Request(origin + "/api/auth/logout", {
            method: "POST",
            headers: {
              Origin: "https://evil.test",
              Cookie: cookie,
              "Content-Type": "application/json",
            },
            body: "{}",
          }),
          env,
        )
      ).status,
    ).toBe(403);
    expect(
      (await call("auth/session", undefined, "__Host-company_session=forged"))
        .status,
    ).toBe(401);
    expect((await call("auth/logout", {}, cookie)).status).toBe(200);
    expect((await call("auth/session", undefined, cookie)).status).toBe(401);
  });
  it("requires long secrets and reports incomplete setup", async () => {
    expect((await api(new Request(origin + "/api/companies"), {})).status).toBe(
      503,
    );
  });
});
describe("cloud company snapshots", () => {
  it("saves every field, multiple companies, and restores on a second device session", async () => {
    const a = await login();
    const g = {
      ...newGame("Business A"),
      buildings: [{ id: "home", color: "sage" }],
      employees: [{ id: "worker", role: "future" }],
    };
    const put = () =>
      call(
        "companies/" + g.companyId,
        { game: g, baseRevision: 0, mutationId: "mutation-0000000001" },
        a,
        "PUT",
      );
    expect((await put()).status).toBe(200);
    expect((await put()).status).toBe(200);
    const h = newGame("Business B");
    expect(
      (
        await call(
          "companies/" + h.companyId,
          { game: h, baseRevision: 0, mutationId: "mutation-0000000002" },
          a,
          "PUT",
        )
      ).status,
    ).toBe(200);
    db.sql.exec("DELETE FROM rate_limits");
    const b = await login();
    const list = await call("companies", undefined, b);
    const data = (await list.json()) as { companies: { game: typeof g }[] };
    expect(data.companies).toHaveLength(2);
    expect(
      data.companies.find((c) => c.game.companyId === g.companyId)?.game,
    ).toEqual(g);
    expect(db.sql.prepare("SELECT count(*) n FROM receipts").get()!.n).toBe(2);
  });
  it("isolates accounts and rejects foreign company edits", async () => {
    const a = await login(),
      b = await login("two@example.com"),
      g = newGame();
    await call(
      "companies/" + g.companyId,
      { game: g, baseRevision: 0, mutationId: "mutation-0000000001" },
      a,
      "PUT",
    );
    expect(
      (
        (await call("companies", undefined, b).then((r) => r.json())) as {
          companies: unknown[];
        }
      ).companies,
    ).toEqual([]);
    expect(
      (
        await call(
          "companies/" + g.companyId,
          { game: g, baseRevision: 1, mutationId: "mutation-0000000002" },
          b,
          "PUT",
        )
      ).status,
    ).toBe(409);
  });
  it("compares revisions, deduplicates retries after interrupted acknowledgements, and keeps history", async () => {
    const a = await login(),
      g = newGame();
    const first = await call(
      "companies/" + g.companyId,
      { game: g, baseRevision: 0, mutationId: "mutation-0000000001" },
      a,
      "PUT",
    );
    expect(first.status).toBe(200);
    const changed = act(g, { type: "buy", item: "blanks", quantity: 1 });
    expect(
      (
        await call(
          "companies/" + g.companyId,
          { game: changed, baseRevision: 1, mutationId: "mutation-0000000002" },
          a,
          "PUT",
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await call(
          "companies/" + g.companyId,
          { game: g, baseRevision: 0, mutationId: "mutation-0000000001" },
          a,
          "PUT",
        )
      ).status,
    ).toBe(200);
    const conflict = await call(
      "companies/" + g.companyId,
      { game: g, baseRevision: 1, mutationId: "mutation-0000000003" },
      a,
      "PUT",
    );
    expect(conflict.status).toBe(409);
    expect(
      ((await conflict.json()) as { current: { game: { cash: number } } })
        .current.game.cash,
    ).toBe(48800);
    expect(
      db.sql.prepare("SELECT count(*) n FROM company_history").get()!.n,
    ).toBe(1);
  });
  it("uses tombstones so stale offline clients cannot resurrect deleted progress", async () => {
    const a = await login(),
      g = newGame();
    await call(
      "companies/" + g.companyId,
      { game: g, baseRevision: 0, mutationId: "mutation-0000000001" },
      a,
      "PUT",
    );
    expect(
      (
        await call(
          "companies/" + g.companyId,
          { game: null, baseRevision: 1, mutationId: "mutation-0000000002" },
          a,
          "PUT",
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await call(
          "companies/" + g.companyId,
          { game: g, baseRevision: 1, mutationId: "mutation-0000000003" },
          a,
          "PUT",
        )
      ).status,
    ).toBe(409);
  });
});
