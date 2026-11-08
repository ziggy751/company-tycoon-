import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import type { Database, Statement } from "./index";
export class Sqlite implements Database {
  sql = new DatabaseSync(":memory:");
  constructor() {
    this.sql.exec(
      readFileSync(
        new URL("../migrations/0001_accounts.sql", import.meta.url),
        "utf8",
      ),
    );
  }
  prepare(sql: string): Statement {
    const db = this.sql;
    let values: unknown[] = [];
    const statement: Statement = {
      bind(...v) {
        values = v;
        return statement;
      },
      async first<T>() {
        return (db.prepare(sql).get(...(values as never[])) as T) || null;
      },
      async all<T>() {
        return { results: db.prepare(sql).all(...(values as never[])) as T[] };
      },
      async run() {
        const r = db.prepare(sql).run(...(values as never[]));
        return { meta: { changes: Number(r.changes) } };
      },
    };
    return statement;
  }
  async batch<T>(statements: Statement[]): Promise<T[]> {
    this.sql.exec("BEGIN");
    try {
      const result = [];
      for (const s of statements) result.push(await s.all());
      this.sql.exec("COMMIT");
      return result as T[];
    } catch (e) {
      this.sql.exec("ROLLBACK");
      throw e;
    }
  }
}
