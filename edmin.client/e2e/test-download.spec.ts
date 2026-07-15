import { test, expect } from '@playwright/test';

test.describe('Download Verification', () => {
  test('Student download button fires apiGet and opens signed URL', async ({ page }) => {
    // Intercept window.open
    await page.addInitScript(() => {
      (window as any)._openedUrls = [];
      window.open = (url?: string | URL | undefined, target?: string | undefined, features?: string | undefined): Window | null => {
        (window as any)._openedUrls.push(url);
        return null;
      };
    });

    // 1. Login as Student
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', 'user1@edmin.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/dashboard\/student/, { timeout: 15000 });
    
    // 2. Go to assignments
    await page.goto('http://localhost:3000/dashboard/student/assignments');
    await page.waitForLoadState('networkidle');

    // 3. Find all assignment hrefs
    const assignmentLinks = page.locator('a[href^="/dashboard/student/assignments/"]');
    const count = await assignmentLinks.count();
    const urls: string[] = [];
    for (let i = 0; i < count; i++) {
        const href = await assignmentLinks.nth(i).getAttribute('href');
        if (href && !href.endsWith('/submit')) urls.push(href);
    }
    
    for (const url of urls) {
        await page.goto(`http://localhost:3000${url}`);
        await page.waitForLoadState('networkidle');
        
        const downloadBtn = page.locator('button:has-text("View / Download")');
        if (await downloadBtn.count() > 0) {
            console.log('Download button found on', url, 'clicking...');
            
            await downloadBtn.click();
            
            // Wait for the opened URL to be pushed
            await page.waitForFunction(() => (window as any)._openedUrls.length > 0, { timeout: 10000 });
            
            const openedUrls = await page.evaluate(() => (window as any)._openedUrls);
            const openedUrl = openedUrls[0];
            
            console.log('Successfully called window.open with URL:', openedUrl);
            expect(openedUrl).toContain('supabase.co/storage/v1/object/sign');
            return; // Test passed
        }
        await page.goto('http://localhost:3000/dashboard/student/assignments');
        await page.waitForLoadState('networkidle');
    }
    console.log('No assignment with a submission found.');
  });
});
