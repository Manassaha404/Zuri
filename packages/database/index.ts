import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "./env";

const connectionUrl = new URL(env.DATABASE_URL);

// Only force SSL for cloud/remote databases — not for local Docker postgres
const isLocal =
  connectionUrl.hostname === "localhost" ||
  connectionUrl.hostname === "postgres" ||
  connectionUrl.hostname === "127.0.0.1";

if (!isLocal) {
  connectionUrl.searchParams.set("uselibpqcompat", "true");
  connectionUrl.searchParams.set("sslmode", "require");
}

const pool = new Pool({
  connectionString: connectionUrl.toString(),
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

export const db = drizzle(pool);
export * from "drizzle-orm";
export default db;
