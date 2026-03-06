import { db } from "../lib/prisma";
import { runWithEnvelope, getDbId } from "../lib/runtimeContext";
import { newSessionId } from "@repo/identity";

const envelope = {
  ns: "A",
  sid: newSessionId("A"),
  role: "ADMIN",
  userId: "test-user",
  path: "/test",
};

console.log("Testing db() proxy...");

async function test() {
  await runWithEnvelope(envelope, async () => {
    console.log("Inside runWithContext");
    console.log("dbId before db() call:", getDbId());

    try {
      console.log("Calling $queryRaw...");
      const result = await db("DB-A-TEMP", (p) => p.$queryRaw`SELECT 1 as value`);
      console.log("Result:", result);
      console.log("dbId after call:", getDbId());
    } catch (e: any) {
      console.log("Error:", e.message);
      console.log("dbId after error:", getDbId());
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
