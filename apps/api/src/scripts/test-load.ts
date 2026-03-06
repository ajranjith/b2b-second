import { performance } from "node:perf_hooks";

const baseUrl = process.env.API_BASE_URL ?? "http://localhost:3001";
const exportUrl = `${baseUrl}/api/bff/v1/admin/exports/orders`;
const searchUrl = `${baseUrl}/api/bff/v1/dealer/search?q=filter`;

const summarize = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const total = values.reduce((sum, value) => sum + value, 0);
  const avg = total / values.length;
  const p95Index = Math.floor(sorted.length * 0.95) - 1;
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg,
    p95: sorted[Math.max(0, p95Index)],
  };
};

async function run() {
  const exportPromise = fetch(exportUrl, {
    headers: {
      "x-dev-role": "ADMIN",
    },
  });

  const requestCount = 20;
  const searchLatencies = await Promise.all(
    Array.from({ length: requestCount }).map(async (_, index) => {
      const start = performance.now();
      const response = await fetch(`${searchUrl}&req=${index}`, {
        headers: {
          "x-dev-role": "DEALER",
        },
      });
      await response.text();
      const end = performance.now();
      return end - start;
    }),
  );

  const exportResponse = await exportPromise;
  let exportBody: any = null;
  try {
    exportBody = await exportResponse.json();
  } catch (error) {
    exportBody = null;
  }

  if (!exportResponse.ok || exportBody?.ok === false) {
    const bodyText = exportBody ? JSON.stringify(exportBody) : await exportResponse.text();
    console.error("FAIL: export endpoint failed.");
    console.error(bodyText);
    process.exitCode = 1;
    return;
  }

  const stats = summarize(searchLatencies);
  console.log("Dealer search latency during export load (ms):");
  console.log(
    `min=${stats.min.toFixed(1)} avg=${stats.avg.toFixed(1)} p95=${stats.p95.toFixed(1)} max=${stats.max.toFixed(1)}`,
  );
}

run().catch((error) => {
  console.error("FAIL: unexpected error during load test.");
  console.error(error);
  process.exitCode = 1;
});
