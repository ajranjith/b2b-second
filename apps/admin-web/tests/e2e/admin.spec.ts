import { test, expect, Page } from "@playwright/test";
import path from "path";

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email or Account Number").fill(adminEmail || "");
  await page.getByLabel("Password").fill(adminPassword || "");
  await page.getByRole("button", { name: "Sign In" }).click({ force: true });
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 20000 });
}

test.describe("admin ui contract", () => {
  test.beforeEach(async ({ page }) => {
    if (!adminEmail || !adminPassword) {
      test.skip(true, "Set ADMIN_EMAIL and ADMIN_PASSWORD to run admin e2e tests.");
    }
    await login(page);
  });

  test("dashboard uses API data and navigation works", async ({ page }) => {
    await expect(page.locator('[data-source="api"]')).toHaveCount(4);

    const navLinks = [
      { label: "Dashboard", href: "/admin/dashboard" },
      { label: "Dealers", href: "/admin/dealers" },
      { label: "Admin Users", href: "/admin/admin-users" },
      { label: "Orders", href: "/admin/orders" },
      { label: "Exports", href: "/admin/exports" },
      { label: "Imports", href: "/admin/imports" },
      { label: "News Articles", href: "/admin/news" },
    ];
    for (const item of navLinks) {
      await page.getByRole("complementary").getByRole("link", { name: item.label }).first().click();
      await expect(page).toHaveURL(new RegExp(`${item.href}$`));
    }
  });

  test("admin users page only shows admin controls", async ({ page }) => {
    await page.goto("/admin/admin-users");
    await expect(page.getByRole("heading", { name: "Admin Users" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Admin User" })).toBeVisible();
    await expect(page.getByText("Create Dealer User")).toHaveCount(0);
    await expect(page.getByText("Dealer Users")).toHaveCount(0);
  });

  test("dealer management button exists and empty state is handled", async ({ page }) => {
    await page.goto("/admin/dealers");
    await expect(page.getByRole("button", { name: "Create Dealer" })).toBeVisible();
    const emptyState = page.getByText("No dealers found");
    if (await emptyState.count()) {
      await expect(emptyState).toBeVisible();
    }
  });

  test("orders export buttons exist", async ({ page }) => {
    await page.goto("/admin/orders");
    await expect(page.getByRole("button", { name: "Export Orders" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Export Backorders" })).toBeVisible();
  });

  test("news articles form has required fields", async ({ page }) => {
    await page.goto("/admin/news");
    await expect(page.getByText("Article Type")).toBeVisible();
    await expect(page.getByText("Heading")).toBeVisible();
    await expect(page.getByText("Message / Body")).toBeVisible();
    await expect(page.getByText("Start Date")).toBeVisible();
    await expect(page.getByText("End Date")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save Article" })).toBeVisible();
  });

  test("imports upload supports templates and file upload", async ({ page }) => {
    await page.goto("/admin/imports");
    await page.getByRole("button", { name: "Upload File" }).click();

    await expect(page.getByRole("heading", { name: "Import Data" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Download Template" })).toBeVisible();

    const filePath = path.resolve(
      __dirname,
      "../../../../samples/New folder/Parts Data_GN_ES_BR.xlsx",
    );
    await page.setInputFiles('input[type="file"]', filePath);

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Start Import" }).click();
  });

  test("admin logout works", async ({ page }) => {
    await page.getByRole("button", { name: "Logout" }).click();
    await page.waitForURL(/\/login/);
  });
});
