import fs from "fs/promises";
import path from "path";
import { chromium } from "playwright";

const outputDir = path.join(process.cwd(), "docs/ui-refresh");
const baseUrl = "http://127.0.0.1:3000";

const views = [
  { name: "dealer-search", path: "/dealer/search" },
  { name: "dealer-cart", path: "/dealer/cart" },
  { name: "dealer-checkout", path: "/dealer/checkout" },
  { name: "dealer-orders", path: "/dealer/orders" },
  { name: "admin-imports", path: "/admin/imports" },
];

const viewports = [
  { label: "desktop", width: 1440, height: 900 },
  { label: "mobile", width: 390, height: 844 },
];

const pickVisibleSelector = async (page, selectors) => {
  for (const selector of selectors) {
    const handles = await page.$$(selector);
    for (const handle of handles) {
      const box = await handle.boundingBox();
      if (box && box.width > 0 && box.height > 0) {
        return selector;
      }
    }
  }
  return null;
};

const run = async () => {
  await fs.mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.setDefaultTimeout(5000);

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    for (const view of views) {
      const url = `${baseUrl}${view.path}`;
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(600);
      const fileName = `${view.name}-${viewport.label}.png`;
      await page.screenshot({ path: path.join(outputDir, fileName), fullPage: true });

      const primarySelectors = [
        "button.bg-blue-600",
        'button[class*="bg-blue-600"]',
        "a.bg-blue-600",
        'button:has-text("Search")',
        'button:has-text("Continue")',
      ];
      const navSelectors = ["nav a", "nav button", "aside a", "[data-nav] a"];
      const rowSelectors = ["table tbody tr", ".table tbody tr"];

      const stateShots = [
        { label: "primary-hover", selectors: primarySelectors, action: "hover" },
        { label: "primary-active", selectors: primarySelectors, action: "active" },
        { label: "nav-hover", selectors: navSelectors, action: "hover" },
        { label: "row-hover", selectors: rowSelectors, action: "hover" },
      ];

      for (const shot of stateShots) {
        const selector = await pickVisibleSelector(page, shot.selectors);
        if (!selector) continue;
        const locator = page.locator(selector).first();
        try {
          await locator.scrollIntoViewIfNeeded();
        } catch {
          continue;
        }
        if (shot.action === "hover") {
          try {
            await locator.hover({ timeout: 2000 });
          } catch {
            continue;
          }
        }
        if (shot.action === "active") {
          try {
            await locator.hover({ timeout: 2000 });
          } catch {
            continue;
          }
          await page.mouse.down();
        }
        await page.waitForTimeout(300);
        const shotName = `${view.name}-${viewport.label}-${shot.label}.png`;
        await page.screenshot({ path: path.join(outputDir, shotName), fullPage: true });
        if (shot.action === "active") {
          await page.mouse.up();
        }
        await page.mouse.move(0, 0);
      }
    }
  }

  await browser.close();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
