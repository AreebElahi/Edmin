import { test, expect } from '@playwright/test';

test.describe('HR Module Navigation', () => {
  test('HR user is redirected to HR Dashboard on login', async ({ page }) => {
    // 1. Login as HR user
    await page.goto('/login');
    await page.fill('#email', 'user4@edmin.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    // 2. Verify URL changes to HR dashboard
    await page.waitForURL(/.*\/dashboard\/hr/, { timeout: 15000 });
    await expect(page).toHaveURL(/.*\/dashboard\/hr/);
    
    // 3. Verify the HR dashboard loaded successfully
    await expect(page.locator('h1').filter({ hasText: 'Human Resources' })).toBeVisible({ timeout: 15000 });
  });
});
