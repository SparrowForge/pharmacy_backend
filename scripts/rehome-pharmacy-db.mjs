import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { normalizeDatabaseUrl } from './lib/normalize-database-url.mjs';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const envPath = path.join(backendRoot, '.env');
const schemaPath = path.join(backendRoot, 'sql', 'pharmacy_schema.sql');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function quoteIdent(ident) {
  return `"${ident.replaceAll('"', '""')}"`;
}

function parseDbName(databaseUrl) {
  const url = new URL(databaseUrl);
  const dbName = url.pathname.replace(/^\//, '');
  if (!dbName) {
    throw new Error('DATABASE_URL has no database name path');
  }
  return decodeURIComponent(dbName);
}

function buildDbUrl(baseUrl, dbName) {
  const url = new URL(baseUrl);
  url.pathname = `/${encodeURIComponent(dbName)}`;
  return url.toString();
}

async function withClient(connectionString, fn) {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function dropPharmacyObjectsFromLms(client) {
  await client.query(`
    DO $$
    DECLARE
      obj RECORD;
    BEGIN
      FOR obj IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name LIKE 'phar\\_%' ESCAPE '\\'
      LOOP
        EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', obj.table_name);
      END LOOP;

      FOR obj IN
        SELECT table_name
        FROM information_schema.views
        WHERE table_schema = 'public' AND table_name LIKE 'phar\\_%' ESCAPE '\\'
      LOOP
        EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', obj.table_name);
      END LOOP;

      FOR obj IN
        SELECT typname
        FROM pg_type
        WHERE typnamespace = 'public'::regnamespace
          AND typname LIKE 'phar\\_%' ESCAPE '\\'
      LOOP
        EXECUTE format('DROP TYPE IF EXISTS public.%I CASCADE', obj.typname);
      END LOOP;
    END
    $$;
  `);

  await client.query('DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE');
}

async function ensureFreshDatabase(client, dbName) {
  const result = await client.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [dbName],
  );

  if (result.rowCount > 0) {
    await client.query(
      'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()',
      [dbName],
    );
    await client.query(`DROP DATABASE ${quoteIdent(dbName)}`);
  }

  await client.query(`CREATE DATABASE ${quoteIdent(dbName)}`);
}

async function applySchemaToDatabase(connectionString) {
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }
  const sql = fs.readFileSync(schemaPath, 'utf8');
  await withClient(connectionString, async (client) => {
    await client.query(sql);
  });
}

async function verifyDatabase(connectionString) {
  return withClient(connectionString, async (client) => {
    const tables = await client.query(`
      SELECT COUNT(*)::int AS total
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name LIKE 'phar_%'
    `);

    const views = await client.query(`
      SELECT COUNT(*)::int AS total
      FROM information_schema.views
      WHERE table_schema = 'public' AND table_name LIKE 'phar_%'
    `);

    const units = await client.query(
      'SELECT COUNT(*)::int AS total FROM phar_product_units',
    );

    const methods = await client.query(
      'SELECT COUNT(*)::int AS total FROM phar_payment_methods',
    );

    return {
      phar_tables: tables.rows[0].total,
      phar_views: views.rows[0].total,
      unit_seed_rows: units.rows[0].total,
      payment_method_seed_rows: methods.rows[0].total,
    };
  });
}

async function run() {
  loadEnvFile(envPath);

  const rawDatabaseUrl = process.env.DATABASE_URL;
  const databaseUrl = rawDatabaseUrl ? normalizeDatabaseUrl(rawDatabaseUrl) : '';
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing from environment/backend/.env');
  }

  const sourceDb = parseDbName(databaseUrl);
  const targetDb = process.env.POSTGRES_DB || 'pharmacy';

  if (!targetDb) {
    throw new Error('Target database name is empty');
  }
  if (sourceDb === targetDb) {
    throw new Error(
      `Source DB and target DB are the same (${sourceDb}). Change DATABASE_URL or POSTGRES_DB.`,
    );
  }

  await withClient(databaseUrl, async (client) => {
    await dropPharmacyObjectsFromLms(client);
    await ensureFreshDatabase(client, targetDb);
  });

  const targetDbUrl = buildDbUrl(databaseUrl, targetDb);
  await applySchemaToDatabase(targetDbUrl);
  const verification = await verifyDatabase(targetDbUrl);

  console.log(
    JSON.stringify({
      source_db: sourceDb,
      target_db: targetDb,
      ...verification,
    }),
  );
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
