import { test, expect } from '@playwright/test';

test('StatsAISmoke loads home page', async ({ page }) => {
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Get started by editing')).toBeVisible();
  await page.screenshot({ path: 'sample-app-home.png', fullPage: true });
});
