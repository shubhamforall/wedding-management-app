import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { env } from './env';

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

async function ensureMigrationsTable(conn: mysql.Connection) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id VARCHAR(255) PRIMARY KEY,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrations(conn: mysql.Connection): Promise<Set<string>> {
  const [rows] = await conn.query<mysql.RowDataPacket[]>('SELECT id FROM schema_migrations');
  return new Set(rows.map((r) => r.id as string));
}

// Exported so server.ts can run pending migrations automatically on boot —
// Hostinger's deploy lifecycle is just "npm install, then run the entry
// file" with no hook for a separate migration step, so the alternative
// would be manually SSHing in after every deploy that adds a migration.
// Safe to call on every startup: schema_migrations tracks what's already
// applied, so this is a no-op once the schema is current.
export async function runMigrations(): Promise<void> {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  // Multi-statement execution needed for migration files with several DDL
  // statements each — mysql2's non-pooled connection supports this via
  // multipleStatements, which we intentionally do NOT enable on the app's
  // runtime pool (keeps that surface free of statement-injection risk).
  const conn = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
  });

  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${env.db.database}\``);
    await conn.changeUser({ database: env.db.database });

    await ensureMigrationsTable(conn);
    const applied = await getAppliedMigrations(conn);

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`[migrate] skip  ${file} (already applied)`);
        continue;
      }
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`[migrate] apply ${file}`);
      await conn.query(sql);
      await conn.query('INSERT INTO schema_migrations (id) VALUES (?)', [file]);
    }

    console.log('[migrate] Schema up to date.');
  } finally {
    await conn.end();
  }
}

// CLI entry point (`npm run migrate`) — still works standalone for local
// dev / manual runs, on top of the automatic call from server.ts.
if (require.main === module) {
  runMigrations().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
