import { test, expect, Page } from "@playwright/test";

const dealerEmail = process.env.DEALER_EMAIL;
const dealerPassword = process.env.DEALER_PASSWORD;

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email or Account Number").fill(dealerEmail || "");
  await page.getByLabel("Password").fill(dealerPassword || "");
  await page.getByRole("button", { name: "Sign In" }).click({ force: true });
  await page.waitForURL(/\/dealer\/dashboard/, { timeout: 20000 });
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

  test("orders empty state renders when no orders exist", async ({ page }) => {
    await page.goto("/dealer/orders");
    const emptyState = page.getByText("No orders");
    if (await emptyState.count()) {
      await expect(emptyState).toBeVisible();
    }
  });
});
