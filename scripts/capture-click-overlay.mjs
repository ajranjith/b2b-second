import fs from "fs/promises";
import path from "path";
import { chromium } from "playwright";

const outputDir = path.join(process.cwd(), "docs/ui-refresh");
const baseUrl = "http://127.0.0.1:3000";

const run = async () => {
  await fs.mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: outputDir },
  });
  const page = await context.newPage();

  await page.goto(`${baseUrl}/dealer/search`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  const navLink = await page.$("nav a, nav button, aside a");
  if (navLink) {
    await navLink.click();
  } else {
    await page.click("button");
  }

  await page.waitForTimeout(1200);

  await context.close();
  await browser.close();

  const videos = await fs.readdir(outputDir);
  const latest = videos
    .filter((file) => file.endsWith(".webm"))
    .map((file) => ({ file, stat: fs.stat(path.join(outputDir, file)) }))
    .map(async (entry) => ({ file: entry.file, stat: await entry.stat }))
    .reduce(async (accPromise, entryPromise) => {
      const acc = await accPromise;
      const entry = await entryPromise;
      if (!acc || entry.stat.mtimeMs > acc.stat.mtimeMs) return entry;
      return acc;
    }, Promise.resolve(null));

  const resolved = await latest;
  if (resolved) {
    await fs.rename(
      path.join(outputDir, resolved.file),
      path.join(outputDir, "click-overlay.webm"),
    );
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
