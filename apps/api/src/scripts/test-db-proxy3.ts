import { runWithDbId, getDbId } from "../lib/runtimeContext";

console.log("Testing proxy function wrapping...");

// Simulate the proxy wrapper
function wrapValue(value: unknown, dbId: string, parent: object): unknown {
  if (typeof value === "function") {
    const wrapped = (...args: unknown[]) => {
      console.log("Wrapped function called, setting dbId:", dbId);
      return runWithDbId(dbId, () => {
        console.log("Inside runWithDbId, dbId:", getDbId());
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
    console.log("query() called, dbId inside:", getDbId());
    return { value: 1 };
  },
};

const wrappedQuery = wrapValue(
  target.query,
  "DB-A-TEMP",
  target,
) as () => Promise<{ value: number }>;

async function test() {
  console.log("Before call, dbId:", getDbId());
  const result = await wrappedQuery();
  console.log("Result:", result);
  console.log("After call, dbId:", getDbId());
}

test()
  .then(() => console.log("Done"))
  .catch((e) => console.error("Failed:", e));
