import { runWithDbId, getDbId } from "../lib/runtimeContext";

console.log("Testing runWithDbContext directly...");

async function test() {
  console.log("dbId before:", getDbId());

  const result = runWithDbId("DB-A-TEMP", () => {
    console.log("dbId inside sync:", getDbId());
    return "sync result";
  });
  console.log("sync result:", result);
  console.log("dbId after sync:", getDbId());

  // Test async
  const asyncResult = await runWithDbId("DB-A-TEMP", async () => {
    console.log("dbId inside async:", getDbId());
    await new Promise((r) => setTimeout(r, 10));
    console.log("dbId after await:", getDbId());
    return "async result";
  });
  console.log("async result:", asyncResult);
  console.log("dbId after async:", getDbId());
}

test()
  .then(() => console.log("Done"))
  .catch((e) => console.error("Failed:", e));
