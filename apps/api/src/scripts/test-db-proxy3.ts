import { runWithDbContext, getCurrentDbId } from "../lib/dbContext";
import { QUERIES } from "@repo/identity";

console.log("Testing proxy function wrapping...");

// Simulate the proxy wrapper
function wrapValue(value: unknown, scope: { dbId: string; allowedModels: readonly string[] }, parent: object): unknown {
  if (typeof value === "function") {
    const wrapped = (...args: unknown[]) => {
      console.log("Wrapped function called, setting dbId:", scope.dbId);
      return runWithDbContext(scope, () => {
        console.log("Inside runWithDbContext, dbId:", getCurrentDbId());
        const result = (value as (...args: unknown[]) => unknown).apply(parent, args);
        console.log("Function result type:", typeof result);
        return result;
      });
    };
    return wrapped;
  }
  return value;
}

// Test with a simple async function
const target = {
  async query() {
    console.log("query() called, dbId inside:", getCurrentDbId());
    return { value: 1 };
  },
};

const wrappedQuery = wrapValue(
  target.query,
  {
    dbId: QUERIES.ADMIN_DASHBOARD_DEALER_STATS.id,
    allowedModels: QUERIES.ADMIN_DASHBOARD_DEALER_STATS.models,
  },
  target,
) as () => Promise<{ value: number }>;

async function test() {
  console.log("Before call, dbId:", getCurrentDbId());
  const result = await wrappedQuery();
  console.log("Result:", result);
  console.log("After call, dbId:", getCurrentDbId());
}

test()
  .then(() => console.log("Done"))
  .catch((e) => console.error("Failed:", e));
