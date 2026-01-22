import { test, expect, Page } from "@playwright/test";

const dealerEmail = process.env.DEALER_EMAIL;
const dealerPassword = process.env.DEALER_PASSWORD;

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email or Account Number").fill(dealerEmail || "");
  await page.getByLabel("Password").fill(dealerPassword || "");
  await page.getByRole("button", { name: "Sign In" }).click({ force: true });
  await page.waitForURL(/\/dealer\//, { timeout: 20000 });
}

test.describe("dealer ui contract", () => {
  test.beforeEach(async ({ page }) => {
    if (!dealerEmail || !dealerPassword) {
      test.skip(true, "Set DEALER_EMAIL and DEALER_PASSWORD to run dealer e2e tests.");
    }
    await login(page);
  });

  test("navigation links resolve", async ({ page }) => {
    const navLinks = [
      { label: "Dashboard", href: "/dealer/dashboard" },
      { label: "Search Parts", href: "/dealer/search" },
      { label: "Cart", href: "/dealer/cart" },
      { label: "Orders", href: "/dealer/orders" },
      { label: "News", href: "/dealer/news" },
      { label: "Account", href: "/dealer/account" },
    ];
    for (const item of navLinks) {
      await page.getByRole("complementary").getByRole("link", { name: item.label }).first().click();
      await expect(page).toHaveURL(new RegExp(`${item.href}$`));
    }
  });

  test("dashboard displays stats cards", async ({ page }) => {
    await page.goto("/dealer/dashboard");
    await expect(page.getByText("Backorders")).toBeVisible();
    await expect(page.getByText("Orders in Progress")).toBeVisible();
    await expect(page.getByText("Account Summary")).toBeVisible();
  });

  test("search page has filters and search input", async ({ page }) => {
    await page.goto("/dealer/search");
    await expect(page.getByRole("heading", { name: "Search Parts" })).toBeVisible();
    await expect(page.getByPlaceholder(/Search/i)).toBeVisible();
    await expect(page.locator("#part-type-filter")).toBeVisible();
    await expect(page.locator("#stock-filter")).toBeVisible();
  });

  test("search returns results and can add to cart", async ({ page }) => {
    await page.goto("/dealer/search");
    await page.getByPlaceholder(/Search/i).fill("Product");
    await page.keyboard.press("Enter");

    // Wait for results
    const addButton = page.getByRole("button", { name: /Add to Cart/i }).first();
    const noResults = page.getByText("No results found");

    // Either we get results or a "no results" message
    await expect(addButton.or(noResults)).toBeVisible({ timeout: 10000 });

    // If we have results, try adding to cart
    if (await addButton.isVisible()) {
      await addButton.click();
      // Cart preview should update
      await expect(page.getByRole("heading", { name: "Cart Preview" })).toBeVisible();
    }
  });

  test("orders page shows table or empty state", async ({ page }) => {
    await page.goto("/dealer/orders");
    await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible();

    // Either we have orders table or empty state
    const ordersTable = page.locator("table");
    const emptyState = page.getByText(/No orders/i);

    await expect(ordersTable.or(emptyState)).toBeVisible();
  });

  test("orders page has export button", async ({ page }) => {
    await page.goto("/dealer/orders");
    await expect(page.getByRole("button", { name: /Export Orders/i })).toBeVisible();
  });

  test("cart page shows items or empty state", async ({ page }) => {
    await page.goto("/dealer/cart");
    await expect(page.getByRole("heading", { name: "Shopping Cart" })).toBeVisible();

    // Either we have cart items or empty state
    const checkoutButton = page.getByRole("button", { name: /Proceed to Checkout/i });
    const emptyCart = page.getByText(/cart is empty|no items/i);

    await expect(checkoutButton.or(emptyCart)).toBeVisible();
  });

  test("account page displays dealer info", async ({ page }) => {
    await page.goto("/dealer/account");
    await expect(page.getByRole("heading", { name: /Account/i })).toBeVisible();
  });

  test("news page loads without errors", async ({ page }) => {
    await page.goto("/dealer/news");
    await expect(page.getByRole("heading", { name: /News/i })).toBeVisible();
  });
});

test.describe("dealer search flow", () => {
  test.beforeEach(async ({ page }) => {
    if (!dealerEmail || !dealerPassword) {
      test.skip(true, "Set DEALER_EMAIL and DEALER_PASSWORD to run dealer e2e tests.");
    }
    await login(page);
  });

  test("search with part type filter", async ({ page }) => {
    await page.goto("/dealer/search");
    await page.getByPlaceholder(/Search/i).fill("Product");

    // Select part type filter
    await page.locator("#part-type-filter").selectOption("Genuine");
    await page.keyboard.press("Enter");

    // Wait for search to complete
    await page.waitForTimeout(1000);

    // Page should still be functional
    await expect(page.getByRole("heading", { name: "Search Parts" })).toBeVisible();
  });

  test("search with stock filter", async ({ page }) => {
    await page.goto("/dealer/search");
    await page.getByPlaceholder(/Search/i).fill("Product");

    // Select stock filter
    await page.locator("#stock-filter").selectOption("In Stock");
    await page.keyboard.press("Enter");

    // Wait for search to complete
    await page.waitForTimeout(1000);

    // Page should still be functional
    await expect(page.getByRole("heading", { name: "Search Parts" })).toBeVisible();
  });
});
