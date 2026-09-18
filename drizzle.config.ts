import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  schema: "./backend/src/db/schema.ts",
  out: "./backend/src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://user:password@localhost:5432/db",
  },
  verbose: true,
  strict: true,
});
