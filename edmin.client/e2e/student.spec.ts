import { test, expect } from '@playwright/test';

test.describe('Student Module', () => {
  test('Student can log in and view dashboard', async ({ page }) => {
    // 1. Login as Student
    await page.goto('/login');
    await page.fill('#email', 'user1@edmin.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    // 2. Wait for redirect to student dashboard
    await page.waitForURL(/.*\/dashboard\/student/, { timeout: 15000 });
    
    // Wait for data to load
    await page.waitForLoadState('networkidle');

    // 3. Verify Dashboard Layout is present (Sidebar should have Student items)
    // Check for Student specific dashboard panels
    await expect(page.locator('text=My Courses').first()).toBeVisible();
    await expect(page.locator('text=Pending Coursework')).toBeVisible();
    await expect(page.locator('text=Timetable Summary')).toBeVisible();
  });

  test('Student can navigate to Enrollment', async ({ page }) => {
    // 1. Login as Student
    await page.goto('/login');
    await page.fill('#email', 'user1@edmin.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*\/dashboard\/student/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // 2. Click on "Enrollment" link in Sidebar
    await page.click('text=Enrollment');

    // 3. Verify URL changes to enrollment
    await page.waitForURL(/.*\/dashboard\/student\/enrollment/, { timeout: 15000 });
    await expect(page).toHaveURL(/.*\/dashboard\/student\/enrollment/);
  });
});
