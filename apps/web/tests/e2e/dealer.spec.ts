import { expect, test, type Page } from "@playwright/test";

const dealerEmail = process.env.DEALER_EMAIL;
const dealerPassword = process.env.DEALER_PASSWORD;

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email or Account Number").fill(dealerEmail || "");
  await page.getByLabel("Password").fill(dealerPassword || "");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/dealer\//, { timeout: 20000 });
}

async function token(page: Page) {
  return page.evaluate(() => localStorage.getItem("token"));
}

async function dealerFetch(page: Page, path: string, options?: { method?: string; body?: unknown }) {
  const currentToken = await token(page);
  return page.evaluate(
    async ({ path, method, body, token }) => {
      const response = await fetch(`/api/bff/v1/dealer${path}`, {
        method: method || "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-App-Namespace": "D",
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await response.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
      return { status: response.status, ok: response.ok, json, text };
    },
    { path, method: options?.method, body: options?.body, token: currentToken },
  );
}

async function clearCart(page: Page) {
  const cart = await dealerFetch(page, "/cart");
  const items = cart.json?.data?.items || [];
  for (const item of items) {
    await dealerFetch(page, `/cart/items/${item.id}`, { method: "DELETE" });
  }
}

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  if (!dealerEmail || !dealerPassword) {
    test.skip(true, "Set DEALER_EMAIL and DEALER_PASSWORD to run dealer e2e tests.");
  }
  await login(page);
});

test("dealer routes load without runtime errors", async ({ page }) => {
  const routes = [
    "/dealer/dashboard",
    "/dealer/search",
    "/dealer/cart",
    "/dealer/checkout",
    "/dealer/orders",
    "/dealer/backorders",
    "/dealer/news",
    "/dealer/account",
  ];

  for (const route of routes) {
    await page.goto(route);
    await page.waitForTimeout(400);
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    const html = await page.content();
    expect(html).not.toContain("Unhandled Runtime Error");
    expect(html).not.toContain("Build Error");
    expect(html).not.toContain("404 Not Found");
  }
});

test("dealer bff endpoints return success and namespace is set", async ({ page }) => {
  const apiChecks = [
    "/dashboard",
    "/account",
    "/search?q=LR164821ES&page=1&limit=10",
    "/cart",
    "/orders",
    "/backorders",
    "/news",
  ];

  for (const path of apiChecks) {
    const response = await dealerFetch(page, path);
    expect(response.status).toBe(200);
  }
});

test("all actionable dealer controls include data-fid and data-action-id", async ({ page }) => {
  const routes = [
    "/dealer/dashboard",
    "/dealer/search",
    "/dealer/cart",
    "/dealer/checkout",
    "/dealer/orders",
    "/dealer/backorders",
    "/dealer/news",
    "/dealer/account",
  ];

  for (const route of routes) {
    await page.goto(route);
    await page.waitForTimeout(500);
    const audit = await page.evaluate(() => {
      const actionable = Array.from(document.querySelectorAll('button, a[href], [role="button"]'));
      const missing = actionable.filter(
        (element) => !element.getAttribute("data-fid") || !element.getAttribute("data-action-id"),
      );
      return { total: actionable.length, missing: missing.length };
    });

    expect(audit.total).toBeGreaterThan(0);
    expect(audit.missing).toBe(0);
  }
});

test("search and add to cart works for dealer", async ({ page }) => {
  await clearCart(page);

  await page.goto("/dealer/search");
  await page.locator("main input[placeholder*='Search']").first().fill("LR164821ES");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(900);

  await expect(page.getByRole("button", { name: /Add to Cart|Add Replacement/i }).first()).toBeVisible();

  const search = await dealerFetch(page, "/search?q=LR164821ES&page=1&limit=10");
  const firstProductCode = search.json?.data?.items?.[0]?.productCode;
  expect(firstProductCode).toBeTruthy();
  const productId = firstProductCode === "LR164821ES" ? "prd-lr164821es" : "prd-lr186413";
  const add = await dealerFetch(page, "/cart/items", {
    method: "POST",
    body: { productId, qty: 1 },
  });
  expect(add.status).toBe(200);

  await page.goto("/dealer/cart");
  await expect(page.getByRole("heading", { name: "Shopping Cart" })).toBeVisible();
  const cart = await dealerFetch(page, "/cart");
  expect((cart.json?.data?.items || []).length).toBeGreaterThan(0);
});

test("checkout creates order and order is visible in dealer orders api", async ({ page }) => {
  await clearCart(page);
  await dealerFetch(page, "/cart/items", {
    method: "POST",
    body: { productId: "prd-lr164821es", qty: 1 },
  });

  await page.goto("/dealer/checkout");
  await page.getByRole("button", { name: /Standard/i }).first().click();
  await page.getByRole("button", { name: "Continue" }).first().click();
  await page.getByRole("button", { name: /Continue|Processing/i }).first().click();

  await expect(page.getByRole("heading", { name: "Order Confirmed" })).toBeVisible({
    timeout: 15000,
  });
  const orderNo = (await page.locator("text=/ORD-/").first().textContent())?.trim() || "";
  expect(orderNo).toContain("ORD-");

  const orders = await dealerFetch(page, "/orders");
  const orderNos = (orders.json?.data?.orders || []).map((order: any) => order.orderNo);
  expect(orderNos).toContain(orderNo);
});
