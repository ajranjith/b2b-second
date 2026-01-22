import { db, prisma } from "../lib/prisma";
import { runWithContext } from "../lib/runtimeContext";
import { getCurrentDbId } from "../lib/dbContext";
import { buildEnvelope, newSessionId, newTraceId } from "@repo/identity";

const envelope = buildEnvelope({
  namespace: "A",
  traceId: newTraceId("A"),
  sessionId: newSessionId("A"),
  featureId: "REF-A-01",
  operationId: "API-A-01-01",
  method: "GET",
  path: "/test",
});

console.log("Testing db() proxy...");

async function test() {
  await runWithContext(envelope, async () => {
    console.log("Inside runWithContext");
    console.log("dbId before db() call:", getCurrentDbId());

    const client = db("DB-A-01-01");
    console.log("Got client, dbId:", getCurrentDbId());

    try {
      console.log("Calling $queryRaw...");
      const result = await client.$queryRaw`SELECT 1 as value`;
      console.log("Result:", result);
      console.log("dbId after call:", getCurrentDbId());
    } catch (e: any) {
      console.log("Error:", e.message);
      console.log("dbId after error:", getCurrentDbId());
    }
  });
}

test()
  .then(() => {
    console.log("Done");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Failed:", e.message);
    process.exit(1);
  });
