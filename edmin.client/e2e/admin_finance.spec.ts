import { test, expect } from '@playwright/test';

test.describe('Admin Finance Module', () => {
  test('Admin can navigate to Finance Overview', async ({ page }) => {
    // 1. Login as Admin
    await page.goto('/login');
    await page.fill('#email', 'user3@edmin.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*\/dashboard\/admin/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // 2. Expand the "Finance" dropdown in the Sidebar
    const financeDropdown = page.locator('button', { hasText: 'Finance' });
    if (await financeDropdown.isVisible()) {
      await financeDropdown.click();
      await page.waitForTimeout(500); // Wait for the transition animation to complete
    }

    // 3. Click on "Overview" sub-item
    const overviewLink = page.locator('a', { hasText: 'Overview' });
    await overviewLink.click({ force: true });

    // 4. Verify URL changes to finance
    await page.waitForURL(/.*\/dashboard\/admin\/finance/, { timeout: 15000 });
    await expect(page).toHaveURL(/.*\/dashboard\/admin\/finance/);
    
    // 5. Verify the page loaded by checking for a heading
    await expect(page.locator('h1').filter({ hasText: 'Financial Overview' })).toBeVisible({ timeout: 15000 });
  });
});
