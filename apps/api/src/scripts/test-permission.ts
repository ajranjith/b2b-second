import { readClient } from "../db";

async function run() {
  try {
    await readClient.query("BEGIN");
    await readClient.query("CREATE TABLE bff_replica_write_test (id INT)");
    await readClient.query("ROLLBACK");
    console.error("FAIL: write on replica succeeded (replica is not read-only).");
    process.exitCode = 1;
  } catch (error: any) {
    await readClient.query("ROLLBACK").catch(() => {});
    const message = String(error?.message || error);
    const code = error?.code;
    const isReadOnly =
      code === "25006" ||
      message.toLowerCase().includes("read-only") ||
      message.toLowerCase().includes("read only");

    if (isReadOnly) {
      console.log("PASS: replica rejected write as read-only.");
      console.log(`Error: ${message}`);
    } else {
      console.error("FAIL: replica write failed for unexpected reason.");
      console.error(`Error: ${message}`);
      process.exitCode = 1;
    }
  } finally {
    await readClient.end();
  }
}

run().catch((error) => {
  console.error("FAIL: unexpected error during permission test.");
  console.error(error);
  process.exitCode = 1;
});
