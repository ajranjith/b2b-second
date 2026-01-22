import { Pool } from "pg";

const primaryUrl = process.env.DATABASE_URL_PRIMARY;
const replicaUrl = process.env.DATABASE_URL_REPLICA;

if (!primaryUrl) {
  throw new Error("DATABASE_URL_PRIMARY is required");
}

if (!replicaUrl) {
  throw new Error("DATABASE_URL_REPLICA is required");
}

const poolConfig = {
  max: Number.parseInt(process.env.DB_POOL_MAX ?? "10", 10),
  idleTimeoutMillis: Number.parseInt(process.env.DB_POOL_IDLE_MS ?? "30000", 10),
  connectionTimeoutMillis: Number.parseInt(process.env.DB_POOL_CONN_TIMEOUT_MS ?? "5000", 10),
};

export const writeClient = new Pool({
  connectionString: primaryUrl,
  ...poolConfig,
});

export const readClient = new Pool({
  connectionString: replicaUrl,
  ...poolConfig,
});
