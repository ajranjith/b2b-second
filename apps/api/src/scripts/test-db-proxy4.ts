import { runWithDbId, getDbId } from "../lib/runtimeContext";

console.log("Testing with deferred async...");

// Simulate Prisma's behavior - returns a thenable that executes later
function createLazyPromise<T>(fn: () => Promise<T>): Promise<T> {
  return {
    then(resolve: (value: T) => void, reject: (error: unknown) => void) {
      console.log("then() called, dbId:", getDbId());
      fn().then(resolve, reject);
    },
  } as Promise<T>;
}

const target = {
  query() {
    console.log("query() called (sync part), dbId:", getDbId());
    return createLazyPromise(async () => {
      console.log("Lazy promise executing, dbId:", getDbId());
      return { value: 1 };
    });
  },
};

// Wrap without preserving async context
function wrapValueBroken(value: unknown, dbId: string, parent: object): unknown {
  if (typeof value === "function") {
    return (...args: unknown[]) => {
      console.log("Wrapper called, setting dbId:", dbId);
      return runWithDbId(dbId, () => {
        console.log("Inside runWithDbId, dbId:", getDbId());
        return (value as (...args: unknown[]) => unknown).apply(parent, args);
        // This returns the lazy promise, but context is lost when it's awaited
      });
    };
  }
  return value;
}

// Wrap WITH preserving async context
function wrapValueFixed(value: unknown, dbId: string, parent: object): unknown {
  if (typeof value === "function") {
    return (...args: unknown[]) => {
      console.log("Fixed wrapper called, setting dbId:", dbId);
      // Return a promise that maintains the context
      return runWithDbId(dbId, async () => {
        console.log("Inside async runWithDbId, dbId:", getDbId());
        const result = await (value as (...args: unknown[]) => unknown).apply(parent, args);
        console.log("After await, dbId:", getDbId());
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
    "DB-A-TEMP",
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
    "DB-A-TEMP",
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
