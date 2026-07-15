import { test, expect, request } from '@playwright/test';

test.describe('Smoke Testing - Critical Path', () => {
  test('Backend Health API', async () => {
    const apiContext = await request.newContext({ baseURL: 'http://localhost:5000' });
    const res = await apiContext.get('/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('Login and Dashboard Load', async ({ page }) => {
    await page.goto('/login');
    
    // Auth - Login
    await page.fill('#email', 'user3@edmin.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    // Dashboard loads
    await page.waitForURL(/.*\/dashboard/);
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Verify structural load
    await expect(page.locator('text=Edmin').first()).toBeVisible();
  });
});
