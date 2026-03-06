import { chromium } from "playwright";

const baseUrl = "http://127.0.0.1:3000";
const targets = [
  { name: "Dealer Search", path: "/dealer/search" },
  { name: "Dealer Cart", path: "/dealer/cart" },
  { name: "Dealer Orders", path: "/dealer/orders" },
  { name: "Admin Imports", path: "/admin/imports" },
];

const clickSelectors = ["a[href]", "button", "nav a", "aside a"];

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.setDefaultTimeout(5000);

  const results = [];

  for (const target of targets) {
    await page.goto(`${baseUrl}${target.path}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);

    const selector = await page.evaluate((selectors) => {
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) return sel;
      }
      return null;
    }, clickSelectors);

    if (!selector) {
      results.push({ page: target.name, clicked: false, loadingClassSeen: false });
      continue;
    }

    await page.click(selector);
    const sawLoading = await page.evaluate(() => document.body.classList.contains("app-loading"));

    results.push({ page: target.name, clicked: true, loadingClassSeen: sawLoading });
  }

  await browser.close();

  console.log(JSON.stringify(results, null, 2));
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
