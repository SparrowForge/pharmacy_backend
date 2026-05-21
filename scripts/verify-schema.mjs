import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const envPath = path.join(backendRoot, '.env');

function loadDatabaseUrl() {
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(/^DATABASE_URL=(.+)$/m);
  if (!match) {
    throw new Error('DATABASE_URL not found in backend/.env');
  }
  return match[1].trim();
}

async function run() {
  const databaseUrl = process.env.DATABASE_URL || loadDatabaseUrl();
  const client = new Client({ connectionString: databaseUrl });

  await client.connect();
  try {
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

    const units = await client.query(`
      SELECT COUNT(*)::int AS total
      FROM phar_product_units
    `);

    const methods = await client.query(`
      SELECT COUNT(*)::int AS total
      FROM phar_payment_methods
    `);

    console.log(
      JSON.stringify({
        phar_tables: tables.rows[0].total,
        phar_views: views.rows[0].total,
        unit_seed_rows: units.rows[0].total,
        payment_method_seed_rows: methods.rows[0].total,
      }),
    );
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
