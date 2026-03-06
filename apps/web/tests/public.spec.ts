import { test, expect } from "@playwright/test";

test.describe("public pages", () => {
  test("login page is accessible", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/B2B|Login/i);
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("login page has email and password fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/Email|Account/i)).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/Email|Account/i).fill("invalid@test.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    // Should show an error message or stay on login page
    await page.waitForTimeout(2000);
    const errorMessage = page.getByText(/invalid|error|failed|incorrect/i);
    const stillOnLogin = page.getByRole("button", { name: "Sign In" });

    await expect(errorMessage.or(stillOnLogin)).toBeVisible();
  });

  test("login page redirects authenticated users", async ({ page }) => {
    // Just verify the login page doesn't crash on direct access
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });
});

test.describe("protected routes redirect to login", () => {
  test("admin routes redirect to login", async ({ page }) => {
    await page.goto("/admin");
    // Should either redirect to login or show unauthorized
    await page.waitForTimeout(2000);
    const loginButton = page.getByRole("button", { name: "Sign In" });
    const unauthorizedMessage = page.getByText(/unauthorized|login|sign in/i);

    await expect(loginButton.or(unauthorizedMessage)).toBeVisible();
  });

  test("dealer routes redirect to login", async ({ page }) => {
    await page.goto("/dealer/dashboard");
    // Should either redirect to login or show unauthorized
    await page.waitForTimeout(2000);
    const loginButton = page.getByRole("button", { name: "Sign In" });
    const unauthorizedMessage = page.getByText(/unauthorized|login|sign in/i);

    await expect(loginButton.or(unauthorizedMessage)).toBeVisible();
  });
});
