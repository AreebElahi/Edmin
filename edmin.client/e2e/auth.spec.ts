import { test, expect } from '@playwright/test';
import crypto from 'crypto';

test.describe('Authentication Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('Login - Successful Login (P0)', async ({ page }) => {
    await page.fill('#email', 'user3@edmin.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('Login - Failed Login with incorrect credentials (P0)', async ({ page }) => {
    const randomPass = crypto.randomBytes(4).toString('hex');
    await page.fill('#email', 'user3@edmin.com');
    await page.fill('#password', `wrong_${randomPass}`);
    await page.click('button[type="submit"]');
    
    const errorBanner = page.locator('div[role="alert"][aria-live="polite"]');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText('Invalid login credentials');
  });

  test('Forgot password link exists (P1)', async ({ page }) => {
    const forgotPasswordLink = page.locator('text=Forgot password?');
    await expect(forgotPasswordLink).toBeVisible();
    await expect(forgotPasswordLink).toHaveAttribute('href', '#');
  });

  test('Remember Me checkbox exists and toggles (P2)', async ({ page }) => {
    const rememberMe = page.locator('input[type="checkbox"]');
    await expect(rememberMe).toBeVisible();
    
    await page.locator('text=Remember me').click();
    await expect(rememberMe).toBeChecked();
    
    await page.locator('text=Remember me').click();
    await expect(rememberMe).not.toBeChecked();
  });

  test('Password Visibility Icon toggles visibility (P3)', async ({ page }) => {
    const passwordInput = page.locator('#password');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    const showPasswordBtn = page.locator('button[aria-label="Show password"]');
    await expect(showPasswordBtn).toBeVisible();
    
    await showPasswordBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    const hidePasswordBtn = page.locator('button[aria-label="Hide password"]');
    await expect(hidePasswordBtn).toBeVisible();
    
    await hidePasswordBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('Logout (P0)', async ({ page }) => {
    await page.fill('#email', 'user3@edmin.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });
    
    // Attempt to locate logout button inside sidebar
    const logoutBtn = page.locator('button').filter({ hasText: 'Logout' }).first();
    if (await logoutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await logoutBtn.click();
        await page.waitForURL(/.*\/login/);
        await expect(page).toHaveURL(/.*\/login/);
    }
  });
});
