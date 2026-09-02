import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/lib/env";
import * as schema from "./schema";

let database: ReturnType<typeof drizzle<typeof schema>> | undefined;
/** Creates the server-only client lazily, so builds do not need a running database. */
export function getDb() {
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required before accessing the database.");
  if (!database) database = drizzle({ client: new Pool({ connectionString: env.DATABASE_URL }), schema });
  return database;
}