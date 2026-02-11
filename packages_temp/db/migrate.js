#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const { Client } = require('pg');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const MIGRATIONS_DIR = path.resolve(__dirname, 'migrations');
const MIGRATIONS_TABLE = 'schema_migrations';
const MIGRATION_FILE_PATTERN = /^\d+_[a-z0-9_]+\.up\.sql$/;

const command = (process.argv[2] || 'latest').toLowerCase();
const commandArg = process.argv[3];

function getPgClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Add it to your environment or root .env file.');
  }

  const sslEnabled = process.env.DATABASE_SSL === 'true';

  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: sslEnabled ? { rejectUnauthorized: false } : undefined
  });
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function listMigrationFiles() {
  const entries = await fs.readdir(MIGRATIONS_DIR);
  const sqlFiles = entries.filter(file => file.endsWith('.sql'));

  const orderedMigrations = sqlFiles
    .filter(file => MIGRATION_FILE_PATTERN.test(file))
    .sort();

  const legacyFiles = sqlFiles
    .filter(file => !MIGRATION_FILE_PATTERN.test(file))
    .sort();

  return { orderedMigrations, legacyFiles };
}

async function getAppliedMigrations(client) {
  const result = await client.query(
    `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY id ASC`
  );
  return result.rows.map(row => row.name);
}

function toDownFilename(upFilename) {
  return upFilename.replace(/\.up\.sql$/, '.down.sql');
}

async function applyMigration(client, migrationName) {
  const migrationPath = path.join(MIGRATIONS_DIR, migrationName);
  const sql = await fs.readFile(migrationPath, 'utf8');

  if (!sql.trim()) {
    throw new Error(`Migration "${migrationName}" is empty.`);
  }

  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query(
      `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1)`,
      [migrationName]
    );
    await client.query('COMMIT');
    console.log(`  applied ${migrationName}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw new Error(`Failed applying ${migrationName}: ${error.message}`);
  }
}

async function rollbackMigration(client, migrationName) {
  const downName = toDownFilename(migrationName);
  const downPath = path.join(MIGRATIONS_DIR, downName);
  const downSql = await fs.readFile(downPath, 'utf8');

  if (!downSql.trim()) {
    throw new Error(`Rollback migration "${downName}" is empty.`);
  }

  await client.query('BEGIN');
  try {
    await client.query(downSql);
    await client.query(
      `DELETE FROM ${MIGRATIONS_TABLE} WHERE name = $1`,
      [migrationName]
    );
    await client.query('COMMIT');
    console.log(`  rolled back ${migrationName}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw new Error(`Failed rollback for ${migrationName}: ${error.message}`);
  }
}

function buildTimestampPrefix() {
  const now = new Date();
  const pad = (value) => value.toString().padStart(2, '0');
  return [
    now.getUTCFullYear(),
    pad(now.getUTCMonth() + 1),
    pad(now.getUTCDate()),
    pad(now.getUTCHours()),
    pad(now.getUTCMinutes()),
    pad(now.getUTCSeconds())
  ].join('');
}

function normalizeMigrationName(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function createMigrationScaffold(rawName) {
  if (!rawName) {
    throw new Error('Usage: npm run migrate:create -- <migration_name>');
  }

  const normalizedName = normalizeMigrationName(rawName);
  if (!normalizedName) {
    throw new Error('Migration name must include alphanumeric characters.');
  }

  const prefix = buildTimestampPrefix();
  const baseName = `${prefix}_${normalizedName}`;
  const upFile = `${baseName}.up.sql`;
  const downFile = `${baseName}.down.sql`;
  const upPath = path.join(MIGRATIONS_DIR, upFile);
  const downPath = path.join(MIGRATIONS_DIR, downFile);

  const upTemplate = [
    `-- ${upFile}`,
    '-- Write forward migration SQL here.'
  ].join('\n');

  const downTemplate = [
    `-- ${downFile}`,
    '-- Write rollback SQL here.'
  ].join('\n');

  await fs.writeFile(upPath, `${upTemplate}\n`, { flag: 'wx' });
  await fs.writeFile(downPath, `${downTemplate}\n`, { flag: 'wx' });

  console.log(`Created ${upFile}`);
  console.log(`Created ${downFile}`);
}

async function runLatest(client) {
  const { orderedMigrations } = await listMigrationFiles();
  const applied = new Set(await getAppliedMigrations(client));
  const pending = orderedMigrations.filter(name => !applied.has(name));

  if (pending.length === 0) {
    console.log('No pending migrations.');
    return;
  }

  console.log(`Applying ${pending.length} migration(s)...`);
  for (const migrationName of pending) {
    // Migrations run serially to preserve deterministic schema order.
    await applyMigration(client, migrationName);
  }
}

async function runRollback(client) {
  const result = await client.query(
    `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY id DESC LIMIT 1`
  );

  if (result.rows.length === 0) {
    console.log('No applied migrations to roll back.');
    return;
  }

  const migrationName = result.rows[0].name;
  const downFile = toDownFilename(migrationName);
  const downPath = path.join(MIGRATIONS_DIR, downFile);

  try {
    await fs.access(downPath);
  } catch (_error) {
    throw new Error(
      `Missing rollback file "${downFile}" for migration "${migrationName}".`
    );
  }

  console.log(`Rolling back ${migrationName}...`);
  await rollbackMigration(client, migrationName);
}

async function runStatus(client) {
  const { orderedMigrations, legacyFiles } = await listMigrationFiles();
  const applied = await getAppliedMigrations(client);
  const appliedSet = new Set(applied);
  const pending = orderedMigrations.filter(name => !appliedSet.has(name));

  console.log('Migration status');
  console.log('----------------');
  console.log(`Applied: ${applied.length}`);
  console.log(`Pending: ${pending.length}`);
  console.log('');

  if (applied.length > 0) {
    console.log('Applied migrations:');
    for (const name of applied) {
      console.log(`  - ${name}`);
    }
    console.log('');
  }

  if (pending.length > 0) {
    console.log('Pending migrations:');
    for (const name of pending) {
      console.log(`  - ${name}`);
    }
    console.log('');
  }

  if (legacyFiles.length > 0) {
    console.log('Ignored legacy .sql files (non ordered *.up.sql pattern):');
    for (const name of legacyFiles) {
      console.log(`  - ${name}`);
    }
  }
}

async function main() {
  if (command === 'create') {
    await createMigrationScaffold(commandArg);
    return;
  }

  const client = getPgClient();

  try {
    await client.connect();
    await ensureMigrationsTable(client);

    if (command === 'latest' || command === 'up') {
      await runLatest(client);
      return;
    }

    if (command === 'rollback' || command === 'down') {
      await runRollback(client);
      return;
    }

    if (command === 'status') {
      await runStatus(client);
      return;
    }

    throw new Error(
      `Unknown command "${command}". Use: latest | rollback | status | create`
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`Migration error: ${error.message}`);
  process.exit(1);
});
