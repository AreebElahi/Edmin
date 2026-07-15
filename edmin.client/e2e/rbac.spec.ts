import { test, expect } from '@playwright/test';

test.describe('Roles & Permissions (RBAC) Module', () => {

  test('Student cannot access Admin Dashboard routes', async ({ page }) => {
    // 1. Login as Student
    await page.goto('/login');
    await page.fill('#email', 'user1@edmin.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    // Wait for successful login and redirect
    await page.waitForURL('**/dashboard/student');

    // 2. Verify Admin menus are not visible in sidebar
    await expect(page.locator('text=Identity & Access')).not.toBeVisible();
    await expect(page.locator('text=System & Tools')).not.toBeVisible();

    // 3. Attempt direct navigation to Admin Users route
    await page.goto('/dashboard/admin/users');
    
    // The backend returns 403 Forbidden for admin API calls
    
    // Wait for network requests to finish
    await page.waitForLoadState('networkidle');
    
    // Check that no users are loaded because of 403
    const emptyTableText = page.locator('text=No users match your criteria.');
    await expect(emptyTableText.first()).toBeVisible();
  });

  test('Admin can access Admin Dashboard routes', async ({ page }) => {
    // 1. Login as Admin
    await page.goto('/login');
    await page.fill('#email', 'user3@edmin.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    // Wait for successful login and redirect
    await page.waitForURL('**/dashboard/admin**');

    // 2. Verify Admin menus are visible in sidebar
    await expect(page.locator('text=Identity & Access')).toBeVisible();

    // 3. Navigate to Admin Users route
    await page.goto('/dashboard/admin/users');
    await page.waitForLoadState('networkidle');
    
    // Verify we are on the users page by checking for the Identity & Access Management header
    await expect(page.locator('h1', { hasText: 'Identity & Access' }).first()).toBeVisible();
    
    // Verify that data is loaded (table is not empty)
    const emptyTableText = page.locator('text=No users match your criteria.');
    await expect(emptyTableText).not.toBeVisible();
  });
});
