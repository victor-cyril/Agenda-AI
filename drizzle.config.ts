import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./database/migrations",
  schema: "./database/schemas/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
