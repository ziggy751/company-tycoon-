import { validateSave } from "../src/game/schema";
export interface Statement {
  bind(...v: unknown[]): Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
}
export interface Database {
  prepare(sql: string): Statement;
  batch<T = unknown>(s: Statement[]): Promise<T[]>;
}
export interface Env {
  DB?: Database;
  AUTH_SECRET?: string;
  RESEND_API_KEY?: string;
  AUTH_FROM?: string;
  ASSETS?: { fetch(r: Request): Promise<Response> };
}
const COOKIE = "__Host-company_session",
  TTL = 30 * 86400000;
class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
function fail(status: number, message: string): never {
  throw new HttpError(status, message);
}
const json = (
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "same-origin",
      ...headers,
    },
  });
const random = () => crypto.randomUUID() + crypto.randomUUID();
async function hash(s: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)),
    ),
    (x) => x.toString(16).padStart(2, "0"),
  ).join("");
}
async function mac(secret: string, s: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return Array.from(
    new Uint8Array(
      await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(s)),
    ),
    (x) => x.toString(16).padStart(2, "0"),
  ).join("");
}
function equal(a: string, b: string) {
  let d = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++)
    d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}
async function body(req: Request): Promise<Record<string, unknown>> {
  if (!req.headers.get("content-type")?.startsWith("application/json"))
    fail(415, "Use application/json.");
  const reader = req.body?.getReader();
  if (!reader) fail(400, "Missing body.");
  let n = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const r = await reader.read();
    if (r.done) break;
    n += r.value.byteLength;
    if (n > 2_000_000) {
      await reader.cancel();
      fail(413, "Save exceeds 2 MB.");
    }
    chunks.push(r.value);
  }
  try {
    const bytes = new Uint8Array(n);
    let offset = 0;
    for (const c of chunks) {
      bytes.set(c, offset);
      offset += c.length;
    }
    const value = JSON.parse(new TextDecoder().decode(bytes));
    if (!value || typeof value !== "object" || Array.isArray(value))
      fail(400, "Invalid request.");
    return value;
  } catch {
    fail(400, "Invalid JSON.");
  }
}
async function rate(
  db: Database,
  key: string,
  limit: number,
  window: number,
  now: number,
) {
  const r = await db
    .prepare(
      "INSERT INTO rate_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires_at<=? THEN 1 ELSE count+1 END, expires_at=CASE WHEN expires_at<=? THEN excluded.expires_at ELSE expires_at END RETURNING count",
    )
    .bind(key, now + window, now, now)
    .first<{ count: number }>();
  if (!r || r.count > limit) fail(429, "Too many requests. Try again later.");
}
async function auth(req: Request, db: Database, now: number) {
  const raw = req.headers
    .get("cookie")
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith(COOKIE + "="))
    ?.slice(COOKIE.length + 1);
  if (!raw) fail(401, "Sign in to access cloud saves.");
  const digest = await hash(raw);
  const row = await db
    .prepare(
      "SELECT users.id,users.email FROM sessions JOIN users ON users.id=sessions.user_id WHERE digest=? AND expires_at>?",
    )
    .bind(digest, now)
    .first<{ id: string; email: string }>();
  if (!row) fail(401, "Session expired. Sign in again.");
  return { ...row, digest };
}
function cloudRow(row: {
  id: string;
  revision: number;
  payload: string | null;
  updated_at: number;
}) {
  return {
    id: row.id,
    revision: row.revision,
    game: row.payload ? JSON.parse(row.payload) : null,
    updatedAt: row.updated_at,
  };
}
export async function api(
  req: Request,
  env: Env,
  send: typeof fetch = fetch,
): Promise<Response> {
  try {
    const path = new URL(req.url).pathname,
      now = Date.now();
    if (path === "/api/health")
      return json({
        available: !!(
          env.DB &&
          env.AUTH_SECRET &&
          env.AUTH_SECRET.length >= 32 &&
          env.RESEND_API_KEY &&
          env.AUTH_FROM
        ),
      });
    const db = env.DB;
    if (!db || !env.AUTH_SECRET || env.AUTH_SECRET.length < 32)
      fail(503, "Cloud saves are not configured. Local saving is available.");
    if (
      req.method !== "GET" &&
      req.headers.get("origin") !== new URL(req.url).origin
    )
      fail(403, "Request origin is not allowed.");
    if (path === "/api/auth/request" && req.method === "POST") {
      if (!env.RESEND_API_KEY || !env.AUTH_FROM)
        fail(503, "Email sign-in is not configured.");
      const b = await body(req);
      const email =
        typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
      if (
        email.length > 254 ||
        !/^[-a-z0-9.!#$%&'*+/=?^_`{|}~]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)
      )
        fail(400, "Enter a valid email address.");
      const address = await mac(env.AUTH_SECRET, email);
      const ip = await mac(
        env.AUTH_SECRET,
        req.headers.get("CF-Connecting-IP") || "local",
      );
      await rate(db, "ip:" + ip, 20, 3600000, now);
      await rate(db, "email:" + address, 5, 3600000, now);
      await rate(db, "cooldown:" + address, 1, 60000, now);
      const a = new Uint32Array(1);
      do {
        crypto.getRandomValues(a);
      } while (a[0] >= 4294000000);
      const code = String(a[0] % 1000000).padStart(6, "0"),
        challenge = random();
      await db.batch([
        db.prepare("DELETE FROM challenges WHERE email=?").bind(email),
        db
          .prepare(
            "INSERT INTO challenges(id,email,digest,expires_at) VALUES(?,?,?,?)",
          )
          .bind(
            challenge,
            email,
            await mac(env.AUTH_SECRET, challenge + ":" + email + ":" + code),
            now + 600000,
          ),
      ]);
      let sent = false;
      try {
        const response = await send("https://api.resend.com/emails", {
          method: "POST",
          signal: AbortSignal.timeout(10000),
          headers: {
            Authorization: "Bearer " + env.RESEND_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: env.AUTH_FROM,
            to: [email],
            subject: "Your Company Tycoon sign-in code",
            text: `Your Company Tycoon code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`,
          }),
        });
        sent = response.ok;
      } catch {
        sent = false;
      }
      if (!sent) {
        await db
          .prepare("DELETE FROM challenges WHERE id=?")
          .bind(challenge)
          .run();
        fail(503, "The email service is unavailable. Please try later.");
      }
      return json({
        challenge,
        message: "Check your inbox for a one-time code.",
      });
    }
    if (path === "/api/auth/verify" && req.method === "POST") {
      const b = await body(req);
      if (
        typeof b.challenge !== "string" ||
        typeof b.code !== "string" ||
        !/^\d{6}$/.test(b.code)
      )
        fail(400, "Invalid or expired code.");
      await rate(
        db,
        "verify:" +
          (await mac(
            env.AUTH_SECRET,
            req.headers.get("CF-Connecting-IP") || "local",
          )),
        60,
        3600000,
        now,
      );
      const c = await db
        .prepare(
          "UPDATE challenges SET attempts=attempts+1 WHERE id=? AND expires_at>? AND used=0 AND attempts<5 RETURNING email,digest",
        )
        .bind(b.challenge, now)
        .first<{ email: string; digest: string }>();
      if (
        !c ||
        !equal(
          c.digest,
          await mac(
            env.AUTH_SECRET,
            b.challenge + ":" + c.email + ":" + b.code,
          ),
        )
      )
        fail(400, "Invalid or expired code.");
      const used = await db
        .prepare(
          "UPDATE challenges SET used=1 WHERE id=? AND used=0 AND expires_at>?",
        )
        .bind(b.challenge, now)
        .run();
      if (used.meta.changes !== 1) fail(400, "Invalid or expired code.");
      await db
        .prepare(
          "INSERT INTO users(id,email,created_at) VALUES(?,?,?) ON CONFLICT(email) DO NOTHING",
        )
        .bind(crypto.randomUUID(), c.email, now)
        .run();
      const user = await db
        .prepare("SELECT id,email FROM users WHERE email=?")
        .bind(c.email)
        .first<{ id: string; email: string }>();
      if (!user) fail(500, "Account could not be created.");
      const token = random();
      await db
        .prepare(
          "INSERT INTO sessions(digest,user_id,expires_at) VALUES(?,?,?)",
        )
        .bind(await hash(token), user.id, now + TTL)
        .run();
      return json({ user }, 200, {
        "Set-Cookie": `${COOKIE}=${token}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${TTL / 1000}`,
      });
    }
    const user = await auth(req, db, now);
    if (
      req.headers.has("X-Company-Account") &&
      req.headers.get("X-Company-Account") !== user.id
    )
      fail(401, "Account changed. Sign in again before syncing.");
    if (path === "/api/auth/session" && req.method === "GET")
      return json({ user: { id: user.id, email: user.email } });
    if (path === "/api/auth/logout" && req.method === "POST") {
      await db
        .prepare("DELETE FROM sessions WHERE digest=?")
        .bind(user.digest)
        .run();
      return json({ ok: true }, 200, {
        "Set-Cookie": `${COOKIE}=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0`,
      });
    }
    if (path === "/api/companies" && req.method === "GET") {
      const after = new URL(req.url).searchParams.get("after") || "";
      const rows = await db
        .prepare(
          "SELECT id,revision,payload,updated_at FROM companies WHERE user_id=? AND id>? ORDER BY id LIMIT 50",
        )
        .bind(user.id, after)
        .all<{
          id: string;
          revision: number;
          payload: string | null;
          updated_at: number;
        }>();
      return json({
        companies: rows.results.map(cloudRow),
        next: rows.results.length === 50 ? rows.results[49].id : null,
      });
    }
    const match = /^\/api\/companies\/([a-zA-Z0-9_-]{1,100})$/.exec(path);
    if (match && req.method === "PUT") {
      const cid = match[1],
        b = await body(req);
      if (
        !Number.isSafeInteger(b.baseRevision) ||
        Number(b.baseRevision) < 0 ||
        typeof b.mutationId !== "string" ||
        !/^[a-zA-Z0-9-]{16,100}$/.test(b.mutationId)
      )
        fail(400, "Invalid save revision.");
      let payload: string | null = null;
      if (b.game !== null) {
        try {
          const game = validateSave(b.game);
          if (game.companyId !== cid) fail(400, "Company identity mismatch.");
          payload = JSON.stringify(game);
        } catch (e) {
          fail(400, (e as Error).message);
        }
      }
      const receipt = await db
        .prepare(
          "SELECT revision FROM receipts WHERE user_id=? AND company_id=? AND mutation_id=?",
        )
        .bind(user.id, cid, b.mutationId)
        .first<{ revision: number }>();
      if (receipt) return json({ revision: receipt.revision });
      const results = await db.batch<{ results: { revision: number }[] }>([
        db
          .prepare(
            "INSERT OR IGNORE INTO company_history(user_id,company_id,revision,payload,updated_at) SELECT user_id,id,revision,payload,updated_at FROM companies WHERE user_id=? AND id=? AND revision=?",
          )
          .bind(user.id, cid, b.baseRevision),
        db
          .prepare(
            "INSERT INTO companies(user_id,id,revision,payload,updated_at,last_mutation) SELECT ?,?,1,?,?,? WHERE (?=0 OR EXISTS(SELECT 1 FROM companies WHERE user_id=? AND id=?)) ON CONFLICT(user_id,id) DO UPDATE SET revision=companies.revision+1,payload=excluded.payload,updated_at=excluded.updated_at,last_mutation=excluded.last_mutation WHERE companies.revision=? RETURNING revision",
          )
          .bind(
            user.id,
            cid,
            payload,
            now,
            b.mutationId,
            b.baseRevision,
            user.id,
            cid,
            b.baseRevision,
          ),
        db
          .prepare(
            "INSERT OR IGNORE INTO receipts(user_id,company_id,mutation_id,revision) SELECT user_id,id,last_mutation,revision FROM companies WHERE user_id=? AND id=? AND last_mutation=?",
          )
          .bind(user.id, cid, b.mutationId),
        db
          .prepare(
            "DELETE FROM company_history WHERE user_id=? AND company_id=? AND revision < (SELECT revision-10 FROM companies WHERE user_id=? AND id=?)",
          )
          .bind(user.id, cid, user.id, cid),
      ]);
      if (!results[1].results.length) {
        const current = await db
          .prepare(
            "SELECT id,revision,payload,updated_at FROM companies WHERE user_id=? AND id=?",
          )
          .bind(user.id, cid)
          .first<{
            id: string;
            revision: number;
            payload: string | null;
            updated_at: number;
          }>();
        return json(
          {
            error: "This company changed on another device.",
            current: current ? cloudRow(current) : null,
          },
          409,
        );
      }
      return json({ revision: results[1].results[0].revision });
    }
    return json({ error: "Not found." }, 404);
  } catch (e) {
    return json(
      {
        error:
          e instanceof HttpError
            ? e.message
            : "Cloud service unavailable. Your local save is safe.",
      },
      e instanceof HttpError ? e.status : 503,
    );
  }
}
export default {
  async fetch(req: Request, env: Env) {
    return new URL(req.url).pathname.startsWith("/api/")
      ? api(req, env)
      : env.ASSETS?.fetch(req) ||
          new Response("Assets not configured", { status: 503 });
  },
};
