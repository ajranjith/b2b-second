import { runWithDbContext, getCurrentDbId } from "../lib/dbContext";
import { QUERIES } from "@repo/identity";

console.log("Testing runWithDbContext directly...");

async function test() {
  console.log("dbId before:", getCurrentDbId());

  const result = runWithDbContext(
    {
      dbId: QUERIES.ADMIN_DASHBOARD_DEALER_STATS.id,
      allowedModels: QUERIES.ADMIN_DASHBOARD_DEALER_STATS.models,
    },
    () => {
    console.log("dbId inside sync:", getCurrentDbId());
    return "sync result";
    },
  );
  console.log("sync result:", result);
  console.log("dbId after sync:", getCurrentDbId());

  // Test async
  const asyncResult = await runWithDbContext(
    {
      dbId: QUERIES.ADMIN_DEALERS_LIST.id,
      allowedModels: QUERIES.ADMIN_DEALERS_LIST.models,
    },
    async () => {
    console.log("dbId inside async:", getCurrentDbId());
    await new Promise((r) => setTimeout(r, 10));
    console.log("dbId after await:", getCurrentDbId());
    return "async result";
    },
  );
  console.log("async result:", asyncResult);
  console.log("dbId after async:", getCurrentDbId());
}

test()
  .then(() => console.log("Done"))
  .catch((e) => console.error("Failed:", e));
