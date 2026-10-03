import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Independent reviewer adapter. All SQL in one batch runs synchronously inside
// one transaction, so Promise.all callers cannot nest SQLite transactions.
export function reviewDatabase() {
  const connection = new DatabaseSync(':memory:');
  const directory = resolve(import.meta.dirname, '../handover/drizzle');
  const appliedMigrations: string[] = [];
  for (const file of readdirSync(directory).filter(name => name.endsWith('.sql')).sort()) {
    connection.exec(readFileSync(resolve(directory, file), 'utf8'));
    appliedMigrations.push(file);
  }
  class Statement {
    sql: string;
    values: (string | number | null | Uint8Array)[];
    constructor(sql: string, values: (string | number | null | Uint8Array)[] = []) {
      this.sql = sql;
      this.values = values;
    }
    bind(...values: (string | number | null | Uint8Array)[]) { return new Statement(this.sql, values); }
    result() {
      const before = connection.prepare('SELECT total_changes() AS n').get()?.n as number;
      const results = connection.prepare(this.sql).all(...this.values);
      const after = connection.prepare('SELECT total_changes() AS n').get()?.n as number;
      const last = connection.prepare('SELECT last_insert_rowid() AS n').get()?.n as number;
      return { success: true, results, meta: { changes: after - before, rows_written: after - before, rows_read: results.length, duration: 0, last_row_id: last } };
    }
    async all() { return this.result(); }
    async run() { return this.result(); }
    async first(column?: string) {
      const row = connection.prepare(this.sql).get(...this.values);
      return row ? (column ? row[column] : row) : null;
    }
    async raw() { return this.result().results.map(row => Object.values(row)); }
  }
  const database = {
    prepare: (sql: string) => new Statement(sql),
    async batch(statements: Statement[]) {
      connection.exec('BEGIN');
      try {
        const results = statements.map(statement => statement.result());
        connection.exec('COMMIT');
        return results;
      } catch (error) {
        // RAISE(ROLLBACK) may already have ended the SQLite transaction. Do not
        // replace its original constraint/trigger error with a second rollback
        // error; API error handling must see the actual failed SQL operation.
        if (Reflect.get(connection, 'isTransaction') !== false) {
          try { connection.exec('ROLLBACK'); }
          catch (rollbackError) {
            if (error instanceof Error) Object.defineProperty(error, 'rollbackError', { value: rollbackError });
          }
        }
        throw error;
      }
    },
    async exec(sql: string) { connection.exec(sql); return { count: 1, duration: 0 }; },
    withSession() { return this; },
  };
  return { database: database as unknown as D1Database, connection, appliedMigrations: Object.freeze(appliedMigrations), close: () => connection.close() };
}
