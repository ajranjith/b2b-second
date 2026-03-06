import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import { getEnvelopeOrThrow, runWithDbId } from "@/lib/runtimeContext";
import { QUERIES, type QueryDefEntry, type QueryKey } from "@repo/identity";

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

/**
 * Traced query wrapper for read operations
 * Enforces DB-ID and logs [DB_TRACE]
 */
function resolveQueryDef(query: QueryKey | QueryDefEntry): QueryDefEntry {
  if (typeof query === "string") {
    const mapped = QUERIES[query];
    if (mapped) {
      return mapped;
    }
    return { id: query.startsWith("ADMIN") ? "DB-A-TEMP" : "DB-D-TEMP" } as QueryDefEntry;
  }
  return query ?? ({ id: "DB-D-TEMP" } as QueryDefEntry);
}

async function tracedQuery<T extends QueryResultRow>(
  client: Pool | PoolClient,
  dbId: string,
  sql: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  const envelope = getEnvelopeOrThrow();

  const expectedPrefix = `DB-${envelope.ns}-`;
  if (!dbId.startsWith(expectedPrefix)) {
    throw new Error(
      `ENVELOPE_MISMATCH: DB-ID '${dbId}' does not match request namespace '${envelope.ns}'. ` +
        `Expected prefix '${expectedPrefix}'.`,
    );
  }

  const start = Date.now();
  const result = await client.query<T>(sql, params);
  const durationMs = Date.now() - start;

  console.info("[DB_TRACE]", {
    ns: envelope.ns,
    sid: envelope.sid,
    dbId,
    model: "raw",
    action: "query",
    durationMs,
  });

  return result;
}

/**
 * Scoped database runner for raw SQL queries
 *
 * Usage:
 * ```ts
 * const result = await dbQuery(QUERIES.DEALER_CART_GET, readClient, `
 *   SELECT * FROM "Cart" WHERE id = $1
 * `, [cartId]);
 * ```
 */
export async function dbQuery<T extends QueryResultRow>(
  query: QueryKey | QueryDefEntry,
  client: Pool,
  sql: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  const def = resolveQueryDef(query);
  const dbId = def.id.startsWith("DB-A-") ? "DB-A-TEMP" : "DB-D-TEMP";
  return runWithDbId(dbId, () => tracedQuery<T>(client, dbId, sql, params));
}

/**
 * Scoped read query - uses replica
 */
export async function dbRead<T extends QueryResultRow>(
  query: QueryKey | QueryDefEntry,
  sql: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return dbQuery<T>(query, readClient, sql, params);
}

/**
 * Scoped write query - uses primary
 */
export async function dbWrite<T extends QueryResultRow>(
  query: QueryKey | QueryDefEntry,
  sql: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return dbQuery<T>(query, writeClient, sql, params);
}

/**
 * Transaction wrapper with DB-ID enforcement
 *
 * Usage:
 * ```ts
 * await dbTransaction(QUERIES.DEALER_CHECKOUT_TX, async (traced) => {
 *   await traced(QUERIES.DEALER_CHECKOUT_CREATE_ORDER, `INSERT INTO ...`, []);
 *   await traced(QUERIES.DEALER_CHECKOUT_CREATE_LINES, `INSERT INTO ...`, []);
 * });
 * ```
 */
export async function dbTransaction<T>(
  txQuery: QueryKey | QueryDefEntry,
  fn: (
    traced: <R extends QueryResultRow>(query: QueryKey | QueryDefEntry, sql: string, params?: unknown[]) => Promise<QueryResult<R>>,
  ) => Promise<T>,
): Promise<T> {
  const envelope = getEnvelopeOrThrow();
  const txDef = resolveQueryDef(txQuery);
  const txDbId = txDef.id.startsWith("DB-A-") ? "DB-A-TEMP" : "DB-D-TEMP";

  const expectedPrefix = `DB-${envelope.ns}-`;
  if (!txDbId.startsWith(expectedPrefix)) {
    throw new Error(
      `ENVELOPE_MISMATCH: DB-ID '${txDbId}' does not match request namespace '${envelope.ns}'.`,
    );
  }

  const client = await writeClient.connect();

  const tracedInTx = async <R extends QueryResultRow>(
    query: QueryKey | QueryDefEntry,
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult<R>> => {
    const def = resolveQueryDef(query);
    const dbId = def.id.startsWith("DB-A-") ? "DB-A-TEMP" : "DB-D-TEMP";
    return runWithDbId(dbId, async () => {
      if (!dbId.startsWith(expectedPrefix)) {
        throw new Error(`ENVELOPE_MISMATCH: DB-ID '${dbId}' does not match namespace '${envelope.ns}'.`);
      }

      const start = Date.now();
      const result = await client.query<R>(sql, params);
      const durationMs = Date.now() - start;

      console.info("[DB_TRACE]", {
        ns: envelope.ns,
        sid: envelope.sid,
        dbId,
        model: "raw",
        action: "query",
        durationMs,
        inTransaction: true,
        txDbId,
      });

      return result;
    });
  };

  try {
    await client.query("BEGIN");

    console.info("[DB_TRACE]", {
      ns: envelope.ns,
      sid: envelope.sid,
      dbId: txDbId,
      model: "raw",
      action: "BEGIN",
    });

    const result = await fn(tracedInTx);

    await client.query("COMMIT");

    console.info("[DB_TRACE]", {
      ns: envelope.ns,
      sid: envelope.sid,
      dbId: txDbId,
      model: "raw",
      action: "COMMIT",
    });

    return result;
  } catch (error) {
    await client.query("ROLLBACK");

    console.info("[DB_TRACE]", {
      ns: envelope.ns,
      sid: envelope.sid,
      dbId: txDbId,
      model: "raw",
      action: "ROLLBACK",
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  } finally {
    client.release();
  }
}
