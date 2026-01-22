import { Pool } from "pg";

export interface DbPreflightResult {
  reachable: boolean;
  reason?: string;
  url?: string;
}

const DEFAULT_TIMEOUT_MS = 1500;

function resolveDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_PRIMARY ||
    process.env.DATABASE_URL_REPLICA
  );
}

export async function checkDatabaseReachable(url?: string): Promise<DbPreflightResult> {
  const target = url ?? resolveDatabaseUrl();
  if (!target) {
    return { reachable: false, reason: "DATABASE_URL (or primary/replica) is not configured." };
  }

  const pool = new Pool({
    connectionString: target,
    connectionTimeoutMillis: DEFAULT_TIMEOUT_MS,
    idleTimeoutMillis: DEFAULT_TIMEOUT_MS,
  });

  try {
    await pool.query("SELECT 1");
    return { reachable: true, url: target };
  } catch (error: unknown) {
    return {
      reachable: false,
      url: target,
      reason: String((error as Error)?.message ?? error ?? "unknown error"),
    };
  } finally {
    await pool.end().catch(() => undefined);
  }
}
