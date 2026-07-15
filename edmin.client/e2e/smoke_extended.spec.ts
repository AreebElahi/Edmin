import { test, expect } from '@playwright/test';

test.describe('Extended Smoke Testing', () => {
  
  test.describe('Admin Module', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.fill('#email', 'user3@edmin.com');
      await page.fill('#password', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/dashboard/);
    });

    test('User Management Page (Add/Edit Student)', async ({ page }) => {
      await page.goto('/dashboard/admin/users', { waitUntil: 'domcontentloaded', timeout: 45000 });
      await expect(page.locator('text=Identity & Access').first()).toBeVisible({ timeout: 45000 });
      
      const addButton = page.locator('button', { hasText: 'Add' }).first();
      await expect(addButton).toBeVisible();
    });

    test('Reports Page', async ({ page }) => {
      await page.goto('/dashboard/admin/reports', { waitUntil: 'domcontentloaded', timeout: 45000 });
      await expect(page.locator('text=Reports').first()).toBeVisible({ timeout: 45000 });
    });
  });

  test.describe('Student Module', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.fill('#email', 'student@edmin.com');
      await page.fill('#password', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/dashboard/);
    });

    test('Attendance Page', async ({ page }) => {
      await page.goto('/dashboard/student/attendance', { waitUntil: 'domcontentloaded', timeout: 45000 });
      await expect(page.locator('text=Attendance').first()).toBeVisible({ timeout: 45000 });
    });
  });

});
