import { test, expect, Page } from '@playwright/test';

const dealerEmail = process.env.DEALER_EMAIL || 'u-1@dealer.com';
const dealerPassword = process.env.DEALER_PASSWORD || 'Password123!';

async function login(page: Page) {
    await page.goto('/login');
    await page.getByLabel('Email or Account Number').fill(dealerEmail);
    await page.getByLabel('Password').fill(dealerPassword);
    const [loginResponse] = await Promise.all([
        page.waitForResponse((response) => response.url().includes('/auth/login')),
        page.getByRole('button', { name: 'Sign In' }).click(),
    ]);
    expect(loginResponse.status()).toBe(200);
    await page.waitForURL(/\/dealer\/search/, { timeout: 20000 });
}

test('home links route to login', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Dealer Portal/i }).click();
    await page.waitForURL(/\/login/, { timeout: 15000 });

    await page.goto('/');
    await page.getByRole('link', { name: /Admin Portal/i }).click();
    await page.waitForURL(/\/login/, { timeout: 15000 });
});

test.describe('dealer flow', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('search, add to cart, and checkout', async ({ page }) => {
        await page.getByPlaceholder('Search by part number, description, or vehicle model...').fill('Product');
        await page.getByRole('button', { name: 'Search' }).click();

        const addButtons = page.getByRole('button', { name: /Add to Cart/i });
        await expect(addButtons.first()).toBeVisible();
        await addButtons.first().click();

        await page.goto('/dealer/cart');
        await expect(page.getByRole('heading', { name: 'Shopping Cart' })).toBeVisible();
        await expect(page.getByText('Proceed to Checkout')).toBeVisible();

        await page.getByRole('button', { name: 'Proceed to Checkout' }).click();
        await page.getByRole('button', { name: 'Place Order' }).click();

        await expect(page.getByText('Order Placed Successfully!')).toBeVisible();
    });

    test('dashboard navigation links resolve', async ({ page }) => {
        await page.goto('/dealer/dashboard');
        await expect(page.getByRole('link', { name: 'Search Parts' })).toBeVisible();

        await page.getByRole('link', { name: /^Orders$/ }).click();
        await expect(page).toHaveURL(/\/dealer\/orders/);

        await page.getByRole('link', { name: /^Backorders$/ }).click();
        await expect(page).toHaveURL(/\/dealer\/backorders/);
    });
});
