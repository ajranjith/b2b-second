import { runWithDbContext, getCurrentDbId } from "../lib/dbContext";
import { QUERIES } from "@repo/identity";

console.log("Testing with deferred async...");

// Simulate Prisma's behavior - returns a thenable that executes later
function createLazyPromise<T>(fn: () => Promise<T>): Promise<T> {
  return {
    then(resolve: (value: T) => void, reject: (error: unknown) => void) {
      console.log("then() called, dbId:", getCurrentDbId());
      fn().then(resolve, reject);
    },
  } as Promise<T>;
}

const target = {
  query() {
    console.log("query() called (sync part), dbId:", getCurrentDbId());
    return createLazyPromise(async () => {
      console.log("Lazy promise executing, dbId:", getCurrentDbId());
      return { value: 1 };
    });
  },
};

// Wrap without preserving async context
function wrapValueBroken(value: unknown, scope: { dbId: string; allowedModels: readonly string[] }, parent: object): unknown {
  if (typeof value === "function") {
    return (...args: unknown[]) => {
      console.log("Wrapper called, setting dbId:", scope.dbId);
      return runWithDbContext(scope, () => {
        console.log("Inside runWithDbContext, dbId:", getCurrentDbId());
        return (value as (...args: unknown[]) => unknown).apply(parent, args);
        // This returns the lazy promise, but context is lost when it's awaited
      });
    };
  }
  return value;
}

// Wrap WITH preserving async context
function wrapValueFixed(value: unknown, scope: { dbId: string; allowedModels: readonly string[] }, parent: object): unknown {
  if (typeof value === "function") {
    return (...args: unknown[]) => {
      console.log("Fixed wrapper called, setting dbId:", scope.dbId);
      // Return a promise that maintains the context
      return runWithDbContext(scope, async () => {
        console.log("Inside async runWithDbContext, dbId:", getCurrentDbId());
        const result = await (value as (...args: unknown[]) => unknown).apply(parent, args);
        console.log("After await, dbId:", getCurrentDbId());
        return result;
      });
    };
  }
  return value;
}

async function testBroken() {
  console.log("\n--- Testing BROKEN wrapper ---");
  const wrapped = wrapValueBroken(
    target.query,
    { dbId: QUERIES.ADMIN_DASHBOARD_DEALER_STATS.id, allowedModels: QUERIES.ADMIN_DASHBOARD_DEALER_STATS.models },
    target,
  ) as () => Promise<{ value: number }>;
  try {
    const result = await wrapped();
    console.log("Result:", result);
  } catch (e: any) {
    console.log("Error:", e.message);
  }
}

async function testFixed() {
  console.log("\n--- Testing FIXED wrapper ---");
  const wrapped = wrapValueFixed(
    target.query,
    { dbId: QUERIES.ADMIN_DEALERS_USERS_LIST.id, allowedModels: QUERIES.ADMIN_DEALERS_USERS_LIST.models },
    target,
  ) as () => Promise<{ value: number }>;
  try {
    const result = await wrapped();
    console.log("Result:", result);
  } catch (e: any) {
    console.log("Error:", e.message);
  }
}

testBroken()
  .then(() => testFixed())
  .then(() => console.log("\nDone"))
  .catch((e) => console.error("Failed:", e));
