const { test, expect } = require('@playwright/test');

test.describe('Responsive smoke', () => {
  test('homepage loads and screenshots', async ({ page, browserName, viewport }) => {
    // Adjust base URL if server runs on different port
    const base = process.env.TEST_BASE_URL || 'http://localhost:3001/';
    await page.goto(base, { waitUntil: 'networkidle' });

    // Wait for app root
    await page.waitForSelector('#app', { timeout: 5000 });

    // Ensure projects loaded
    await page.waitForTimeout(500); // allow layout to stabilise

    // Take screenshot for visual check
    await page.screenshot({ path: `playwright-screenshots/${test.info().project.name}.png`, fullPage: false });

    // Basic checks
    expect(await page.$('#canvas')).not.toBeNull();
    expect(await page.$('#panel-agents')).not.toBeNull();
  });
});
