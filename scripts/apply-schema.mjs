import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { normalizeDatabaseUrl } from './lib/normalize-database-url.mjs';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const defaultEnvPath = path.join(backendRoot, '.env');
const defaultSchemaPath = path.join(backendRoot, 'sql', 'pharmacy_schema.sql');

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const idx = line.indexOf('=');
    if (idx === -1) continue;

    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
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

function locationFromPosition(sql, position) {
  if (!position) return null;
  const absolutePos = Number(position);
  if (!Number.isFinite(absolutePos) || absolutePos < 1) return null;

  const before = sql.slice(0, absolutePos - 1);
  const lines = before.split('\n');
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;
  return { line, column };
}

async function run() {
  loadEnvFile(defaultEnvPath);

  const rawDatabaseUrl = process.env.DATABASE_URL;
  const databaseUrl = rawDatabaseUrl ? normalizeDatabaseUrl(rawDatabaseUrl) : '';
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set in environment or backend/.env');
  }

  const schemaPathArg = process.argv[2];
  const schemaPath = schemaPathArg
    ? path.resolve(process.cwd(), schemaPathArg)
    : defaultSchemaPath;

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  const client = new Client({ connectionString: databaseUrl });

  await client.connect();
  try {
    await client.query(sql);
    console.log(`Schema applied successfully: ${schemaPath}`);
  } catch (error) {
    const loc = locationFromPosition(sql, error.position);
    if (loc) {
      console.error(`SQL error at line ${loc.line}, column ${loc.column}`);
    }
    throw error;
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
