import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import { getContext } from "@/lib/runtimeContext";
import { runWithDbContext, type DbScope } from "@/lib/dbContext";
import { QUERIES, type QueryDefEntry, type QueryKey, isValidDb } from "@repo/identity";

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
    return QUERIES[query];
  }
  return query;
}

async function tracedQuery<T extends QueryResultRow>(
  client: Pool | PoolClient,
  scope: DbScope,
  sql: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  const context = getContext();
  const dbId = scope.dbId;

  // BLOCKER 1: Envelope must exist
  if (!context) {
    throw new Error("CRITICAL: No Identity Envelope - request context is missing. Wrap handler with withEnvelope().");
  }

  // BLOCKER 2: Validate DB-ID format
  if (!isValidDb(dbId)) {
    throw new Error(`InvalidDbId: '${dbId}' does not match format DB-{A|D}-##-##`);
  }

  // BLOCKER 3: Namespace mismatch check
  const expectedPrefix = `DB-${context.namespace}-`;
  if (!dbId.startsWith(expectedPrefix)) {
    throw new Error(
      `ENVELOPE_MISMATCH: DB-ID '${dbId}' does not match request namespace '${context.namespace}'. ` +
        `Expected prefix '${expectedPrefix}'.`,
    );
  }

  const start = Date.now();
  const result = await client.query<T>(sql, params);
  const durationMs = Date.now() - start;

  // Audit log with full identity passport
  console.info("[DB_TRACE]", JSON.stringify({
    ns: context.namespace,
    sid: context.sessionId,
    ref: context.featureId,
    api: context.operationId,
    dbId,
    model: "raw",
    action: "query",
    durationMs,
    timestamp: new Date().toISOString(),
  }));

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
  const scope: DbScope = {
    dbId: def.id,
    allowedModels: def.models,
  };
  return runWithDbContext(scope, () => tracedQuery<T>(client, scope, sql, params));
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
  const context = getContext();
  const txDef = resolveQueryDef(txQuery);
  const txDbId = txDef.id;

  if (!context) {
    throw new Error("CRITICAL: No Identity Envelope - request context is missing. Wrap handler with withEnvelope().");
  }

  if (!isValidDb(txDbId)) {
    throw new Error(`InvalidDbId: '${txDbId}' does not match format DB-{A|D}-##-##`);
  }

  const expectedPrefix = `DB-${context.namespace}-`;
  if (!txDbId.startsWith(expectedPrefix)) {
    throw new Error(
      `ENVELOPE_MISMATCH: DB-ID '${txDbId}' does not match request namespace '${context.namespace}'.`,
    );
  }

  const client = await writeClient.connect();

  const tracedInTx = async <R extends QueryResultRow>(
    query: QueryKey | QueryDefEntry,
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult<R>> => {
    const def = resolveQueryDef(query);
    const scope: DbScope = { dbId: def.id, allowedModels: def.models };
    return runWithDbContext(scope, async () => {
      if (!isValidDb(def.id)) {
        throw new Error(`InvalidDbId: '${def.id}' does not match format DB-{A|D}-##-##`);
      }
      if (!def.id.startsWith(expectedPrefix)) {
        throw new Error(`ENVELOPE_MISMATCH: DB-ID '${def.id}' does not match namespace '${context.namespace}'.`);
      }

      const start = Date.now();
      const result = await client.query<R>(sql, params);
      const durationMs = Date.now() - start;

      console.info("[DB_TRACE]", JSON.stringify({
        ns: context.namespace,
        sid: context.sessionId,
        ref: context.featureId,
        api: context.operationId,
        dbId: def.id,
        model: "raw",
        action: "query",
        durationMs,
        inTransaction: true,
        txDbId,
        timestamp: new Date().toISOString(),
      }));

      return result;
    });
  };

  try {
    await client.query("BEGIN");

    console.info("[DB_TRACE]", JSON.stringify({
      ns: context.namespace,
      sid: context.sessionId,
      ref: context.featureId,
      api: context.operationId,
      dbId: txDbId,
      model: "raw",
      action: "BEGIN",
      timestamp: new Date().toISOString(),
    }));

    const result = await fn(tracedInTx);

    await client.query("COMMIT");

    console.info("[DB_TRACE]", JSON.stringify({
      ns: context.namespace,
      sid: context.sessionId,
      ref: context.featureId,
      api: context.operationId,
      dbId: txDbId,
      model: "raw",
      action: "COMMIT",
      timestamp: new Date().toISOString(),
    }));

    return result;
  } catch (error) {
    await client.query("ROLLBACK");

    console.info("[DB_TRACE]", JSON.stringify({
      ns: context.namespace,
      sid: context.sessionId,
      ref: context.featureId,
      api: context.operationId,
      dbId: txDbId,
      model: "raw",
      action: "ROLLBACK",
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }));

    throw error;
  } finally {
    client.release();
  }
}
