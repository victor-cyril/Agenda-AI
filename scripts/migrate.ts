import "dotenv/config";

import { migrate } from "drizzle-orm/neon-http/migrator";
import { db } from "../database";

// This will run migrations on the database, skipping the ones already applied
await migrate(db, { migrationsFolder: "./database/migrations" });

console.log("Migrations applied successfully.");
