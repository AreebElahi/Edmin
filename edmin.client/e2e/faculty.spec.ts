import { test, expect } from '@playwright/test';

test.describe('Faculty (Teacher) Module', () => {
  test('Faculty can log in and view dashboard', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('response', response => console.log('RESPONSE:', response.url(), response.status()));

    // 1. Login as Faculty
    await page.goto('/login');
    await page.fill('#email', 'user2@edmin.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    // 2. Wait for redirect to faculty dashboard
    await page.waitForURL(/.*\/dashboard\/faculty/, { timeout: 15000 });
    
    // Wait for data to load
    await page.waitForLoadState('networkidle');

    // 3. Verify Dashboard Layout is present (Sidebar should have Faculty items)
    await expect(page.locator('text=My Courses')).toBeVisible();
    await expect(page.locator('text=Assignments').first()).toBeVisible();
    await expect(page.locator('text=Attendance').first()).toBeVisible();
  });

  test('Faculty can navigate to Assignments', async ({ page }) => {
    // 1. Login as Faculty
    await page.goto('/login');
    await page.fill('#email', 'user2@edmin.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*\/dashboard\/faculty/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // 2. Click on "Assignments" link in Sidebar
    await page.locator('text=Assignments').first().click({ force: true });

    // 3. Verify URL changes to assignments
    await page.waitForURL(/.*\/dashboard\/faculty\/assignments/, { timeout: 15000 });
    await expect(page).toHaveURL(/.*\/dashboard\/faculty\/assignments/);
  });
});
