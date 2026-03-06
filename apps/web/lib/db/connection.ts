// Load environment variables
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

config();

// Only initialize database if DATABASE_URL or POSTGRES_URL is available
const dbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_PRISMA_URL;

// Allow build to proceed without database connection
// The connection will be required at runtime when actually accessing the database
if (!dbUrl) {
  console.warn(
    "⚠️  DATABASE_URL not set - database features will not be available",
  );
}

let db: ReturnType<typeof drizzle>;

if (dbUrl) {
  console.log("🗄️  Using PostgreSQL database");

  // Serverless-optimized pool config for Neon
  // - max: 3 — Vercel functions handle 1 request at a time, low pool avoids exhausting Neon's pooler limit
  // - prepare: false — CRITICAL for Neon serverless. PgBouncer pooler runs in transaction mode and does NOT
  //   support prepared statements. Even direct connections benefit from this in serverless since there's no
  //   connection persistence between invocations. Without this, queries fail when PgBouncer routes to a
  //   different backend that lacks the cached prepared statement.
  // - idle_timeout: 20 — release idle connections quickly in serverless
  // - connect_timeout: 15 — Neon cold starts can take a few seconds after autosuspend
  const client = postgres(dbUrl, {
    max: 3,
    idle_timeout: 20,
    connect_timeout: 15,
    prepare: false,
  });

  db = drizzle(client, { schema });
} else {
  // Create a proxy that throws helpful errors when accessed without a connection
  db = new Proxy({} as ReturnType<typeof drizzle>, {
    get() {
      throw new Error(
        "DATABASE_URL is not configured. Database operations are not available.",
      );
    },
  });
}

export default db;
export { db };
