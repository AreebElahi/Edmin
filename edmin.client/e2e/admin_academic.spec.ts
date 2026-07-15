import { test, expect } from '@playwright/test';

test.describe('Admin Academic Module', () => {
  test('Admin can navigate to Courses', async ({ page }) => {
    // 1. Login as Admin
    await page.goto('/login');
    await page.fill('#email', 'user3@edmin.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*\/dashboard\/admin/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');


    // 2. Click on "Courses" sub-item
    // Since there might be a "My Courses" or similar, use the exact link role or text in context
    const coursesLink = page.locator('a', { hasText: 'Courses' }).filter({ hasNotText: 'My Courses' });
    
    // Expand Academics if Courses is not visible
    if (!(await coursesLink.isVisible())) {
        const academicsDropdown = page.locator('button', { hasText: 'Academics' });
        await academicsDropdown.click();
        await page.waitForTimeout(500);
    }

    await coursesLink.click({ force: true });

    // 4. Verify URL changes to courses
    await page.waitForURL(/.*\/dashboard\/admin\/courses/, { timeout: 15000 });
    await expect(page).toHaveURL(/.*\/dashboard\/admin\/courses/);
    
    // 5. Verify the page loaded by checking for a heading or specific element
    await expect(page.locator('h1').filter({ hasText: 'Master Course Catalog' })).toBeVisible({ timeout: 15000 });
  });
});
