import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config();

const dbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  "";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
});
