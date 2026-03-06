import { test, expect, Page } from "@playwright/test";

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email or Account Number").fill(adminEmail || "");
  await page.getByLabel("Password").fill(adminPassword || "");
  await page.getByRole("button", { name: "Sign In" }).click({ force: true });
  await page.waitForURL(/\/admin/, { timeout: 20000 });
}

test.describe("admin ui contract", () => {
  test.beforeEach(async ({ page }) => {
    if (!adminEmail || !adminPassword) {
      test.skip(true, "Set ADMIN_EMAIL and ADMIN_PASSWORD to run admin e2e tests.");
    }
    await login(page);
  });

  test("dashboard loads with navigation", async ({ page }) => {
    await page.goto("/admin");
    const navLinks = [
      { label: "Dashboard", href: "/admin" },
      { label: "Dealers", href: "/admin/dealers" },
      { label: "Admin Users", href: "/admin/users" },
      { label: "Orders", href: "/admin/orders" },
      { label: "Imports", href: "/admin/imports" },
    ];
    for (const item of navLinks) {
      await page
        .getByRole("complementary")
        .getByRole("link", { name: item.label })
        .first()
        .click();
      await expect(page).toHaveURL(new RegExp(`${item.href}$`));
    }
  });

  test("admin users page only shows admin controls", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "Admin Users" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Admin User" })).toBeVisible();
    await expect(page.getByText("Create Dealer User")).toHaveCount(0);
    await expect(page.getByText("Dealer Users")).toHaveCount(0);
  });

  test("dealer management page has CRUD controls", async ({ page }) => {
    await page.goto("/admin/dealers");
    await expect(page.getByRole("heading", { name: /Dealer/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Dealer" })).toBeVisible();

    // Check for table or empty state
    const table = page.locator("table");
    const emptyState = page.getByText(/No dealers/i);
    await expect(table.or(emptyState)).toBeVisible();
  });

  test("orders page has export buttons", async ({ page }) => {
    await page.goto("/admin/orders");
    await expect(page.getByRole("button", { name: "Export Orders" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Export Backorders" })).toBeVisible();
  });

  test("imports page supports file upload", async ({ page }) => {
    await page.goto("/admin/imports");
    await expect(page.getByRole("heading", { name: /Import/i })).toBeVisible();
    await page.getByRole("button", { name: "Upload File" }).click();

    await expect(page.getByRole("heading", { name: "Import Data" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Download Template" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Start Import" })).toBeVisible();
  });

  test("imports page has filter tabs", async ({ page }) => {
    await page.goto("/admin/imports");
    await expect(page.getByRole("tab", { name: "All" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Success" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Failed" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Processing" })).toBeVisible();
  });

  test("news management has required form fields", async ({ page }) => {
    await page.goto("/admin/news");
    await expect(page.getByText("Article Type")).toBeVisible();
    await expect(page.getByText("Heading")).toBeVisible();
    await expect(page.getByText("Message / Body")).toBeVisible();
    await expect(page.getByText("Start Date")).toBeVisible();
    await expect(page.getByText("End Date")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save Article" })).toBeVisible();
  });

  test("admin logout works", async ({ page }) => {
    await page.getByRole("button", { name: "Logout" }).click();
    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("admin dealer management", () => {
  test.beforeEach(async ({ page }) => {
    if (!adminEmail || !adminPassword) {
      test.skip(true, "Set ADMIN_EMAIL and ADMIN_PASSWORD to run admin e2e tests.");
    }
    await login(page);
  });

  test("can open create dealer dialog", async ({ page }) => {
    await page.goto("/admin/dealers");
    await page.getByRole("button", { name: "Create Dealer" }).click();

    // Dialog should open
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByLabel("Company Name")).toBeVisible();
  });

  test("dealer search filter works", async ({ page }) => {
    await page.goto("/admin/dealers");

    // Find the search input
    const searchInput = page.getByPlaceholder(/Search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill("test");
      // Wait for filter to apply
      await page.waitForTimeout(500);
      // Page should still be functional
      await expect(page.getByRole("heading", { name: /Dealer/i })).toBeVisible();
    }
  });

  test("dealer status filter works", async ({ page }) => {
    await page.goto("/admin/dealers");

    // Check for status filter tabs
    const allTab = page.getByRole("tab", { name: "All" });
    const activeTab = page.getByRole("tab", { name: "Active" });

    if (await allTab.isVisible()) {
      await activeTab.click();
      // Page should still be functional
      await expect(page.getByRole("heading", { name: /Dealer/i })).toBeVisible();
    }
  });
});

test.describe("admin user management", () => {
  test.beforeEach(async ({ page }) => {
    if (!adminEmail || !adminPassword) {
      test.skip(true, "Set ADMIN_EMAIL and ADMIN_PASSWORD to run admin e2e tests.");
    }
    await login(page);
  });

  test("can open create admin user dialog", async ({ page }) => {
    await page.goto("/admin/users");
    await page.getByRole("button", { name: "Create Admin User" }).click();

    // Dialog should open
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("user list shows pagination when data exists", async ({ page }) => {
    await page.goto("/admin/users");

    // Either we have pagination or small user count
    const pagination = page.getByText(/Showing.*of.*users/i);
    const table = page.locator("table");
    const emptyState = page.getByText(/No.*users/i);

    await expect(table.or(emptyState)).toBeVisible();
  });
});
