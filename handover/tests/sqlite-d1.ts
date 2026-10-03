import { DatabaseSync } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Execute the same migrations and prepared queries as the deployed D1 backend.
// batch rolls back on every error, matching D1's transactional semantics.
export function testDatabase(): D1Database {
  const sqlite = new DatabaseSync(":memory:");
  const migrations = resolve(import.meta.dirname, "../drizzle");
  for (const file of readdirSync(migrations)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    sqlite.exec(readFileSync(resolve(migrations, file), "utf8"));
  }
  class Statement {
    sql: string;
    values: (string | number | null | Uint8Array)[] = [];
    constructor(sql: string) {
      this.sql = sql;
    }
    bind(...values: (string | number | null | Uint8Array)[]) {
      const next = new Statement(this.sql);
      next.values = values;
      return next;
    }
    async first(column?: string) {
      const row = sqlite.prepare(this.sql).get(...this.values);
      return row ? (column ? row[column] : row) : null;
    }
    execute() {
      const stmt = sqlite.prepare(this.sql);
      const before = sqlite.prepare("SELECT total_changes() AS n").get()
        ?.n as number;
      const results = stmt.all(...this.values);
      const after = sqlite.prepare("SELECT total_changes() AS n").get()
        ?.n as number;
      return {
        success: true,
        results,
        meta: {
          changes: after - before,
          rows_written: after - before,
          rows_read: results.length,
          duration: 0,
          last_row_id: 0,
        },
      };
    }
    async all() {
      return this.execute();
    }
    async run() {
      return this.execute();
    }
    async raw() {
      return (await this.all()).results.map((row) => Object.values(row));
    }
  }
  return {
    prepare: (sql: string) => new Statement(sql),
    async batch(statements: Statement[]) {
      // D1 runs a batch as one transaction. Awaiting each statement lets another
      // batch begin in between; keep this path synchronous like production D1.
      sqlite.exec("BEGIN");
      try {
        const results = statements.map((statement) => statement.execute());
        sqlite.exec("COMMIT");
        return results;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
    async exec(sql: string) {
      sqlite.exec(sql);
      return { count: 1, duration: 0 };
    },
    withSession() {
      return this;
    },
  } as unknown as D1Database;
}
