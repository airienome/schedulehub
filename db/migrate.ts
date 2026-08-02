/**
 * Migration runner: executes SQL files against Neon in order.
 *
 * Usage:
 *   npx tsx db/migrate.ts              # run all migrations
 *   npx tsx db/migrate.ts --seed       # include seed data (004)
 *   npx tsx db/migrate.ts --demo       # include seed + demo queries (004+005)
 *   npx tsx db/migrate.ts --reset      # drop all tables first, then run all
 */

import { neon } from "@neondatabase/serverless";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const migrationsDir = join(__dirname, "migrations");

const args = process.argv.slice(2);
const includeSeed = args.includes("--seed") || args.includes("--demo") || args.includes("--reset");
const includeDemo = args.includes("--demo");
const doReset = args.includes("--reset");

async function reset() {
  console.log("Dropping all tables and schemas...");
  await sql`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      -- Drop all tables in public schema
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
      -- Drop views
      FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE';
      END LOOP;
      -- Drop neon_auth schema if it exists (local dev mock)
      DROP SCHEMA IF EXISTS neon_auth CASCADE;
    END $$;
  `;
  console.log("Reset complete.");
}

async function runMigrations() {
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    // Skip seed data unless --seed or --reset
    if (file.startsWith("004") && !includeSeed) {
      console.log(`  Skipping ${file} (use --seed to include)`);
      continue;
    }
    // Skip demo queries unless --demo
    if (file.startsWith("005") && !includeDemo) {
      console.log(`  Skipping ${file} (use --demo to include)`);
      continue;
    }

    const filePath = join(migrationsDir, file);
    const content = readFileSync(filePath, "utf-8");

    console.log(`  Running ${file}...`);
    try {
      await sql(content);
      console.log(`  Done: ${file}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  FAILED: ${file}`);
      console.error(`  ${message}`);
      process.exit(1);
    }
  }
}

async function main() {
  console.log("PT Referral Orchestration - Database Migration");
  console.log("===============================================");

  if (doReset) {
    await reset();
  }

  await runMigrations();

  console.log("\nAll migrations complete.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
