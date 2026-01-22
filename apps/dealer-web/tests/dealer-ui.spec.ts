import { test, expect, Page } from "@playwright/test";

const dealerEmail = process.env.DEALER_EMAIL;
const dealerPassword = process.env.DEALER_PASSWORD;

async function login(page: Page) {
  if (!dealerEmail || !dealerPassword) {
    test.skip(true, "Set DEALER_EMAIL and DEALER_PASSWORD to run dealer e2e tests.");
  }
  await page.goto("/login");
  await page.getByLabel("Email or Account Number").fill(dealerEmail);
  await page.getByLabel("Password").fill(dealerPassword);
  const [loginResponse] = await Promise.all([
    page.waitForResponse((response) => response.url().includes("/auth/login")),
    page.getByRole("button", { name: "Sign In" }).click({ force: true }),
  ]);
  expect(loginResponse.status()).toBe(200);
  await page.waitForURL(/\/dealer\/dashboard/, { timeout: 20000 });
}

test("login page is reachable", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
});

test.describe("dealer flow", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("search, add to cart, and checkout", async ({ page }) => {
    await page.getByPlaceholder("Search parts, SKU, model...").fill("Product");
    await page.getByRole("button", { name: "Search" }).click();

    const addButtons = page.getByRole("button", { name: /Add to Cart/i });
    await expect(addButtons.first()).toBeVisible();
    await addButtons.first().click();

    await page.goto("/dealer/cart");
    await expect(page.getByRole("heading", { name: "Shopping Cart" })).toBeVisible();
    await expect(page.getByText("Proceed to Checkout")).toBeVisible();

    await page.getByRole("button", { name: "Proceed to Checkout" }).click();
    await page.getByRole("button", { name: "Place Order" }).click();

    await expect(page.getByText("Order Placed Successfully!")).toBeVisible();
  });

  test("dashboard navigation links resolve", async ({ page }) => {
    await page.goto("/dealer/dashboard");
    await expect(
      page.getByRole("complementary").getByRole("link", { name: "Search Parts" }),
    ).toBeVisible();

    await page
      .getByRole("complementary")
      .getByRole("link", { name: /^Orders$/ })
      .click();
    await expect(page).toHaveURL(/\/dealer\/orders/);

    await page
      .getByRole("complementary")
      .getByRole("link", { name: /^News$/ })
      .click();
    await expect(page).toHaveURL(/\/dealer\/news/);
  });
});
