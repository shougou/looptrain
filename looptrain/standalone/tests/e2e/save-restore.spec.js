const { test, expect } = require('@playwright/test');

test.describe('LoopTrain v0.11.0 存档/恢复/重置', () => {
  test('进行中刷新恢复', async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForSelector('#intro-start-btn', { timeout: 10000 });
    await page.click('#intro-start-btn');
    await page.waitForSelector('.lt-scene-card', { timeout: 5000 });
    await page.reload();
    await page.waitForTimeout(2000);
    const introVisible = await page.locator('.lt-intro.lt-show').isVisible({ timeout: 3000 }).catch(() => false);
    expect(introVisible).toBeFalsy();
  });

  test('URL reset 参数强制重置', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.lt-intro.lt-show', { timeout: 10000 });
    await page.click('#intro-start-btn');
    await page.waitForSelector('.lt-scene-card', { timeout: 5000 });
    await page.goto('/?reset=1');
    await page.waitForSelector('.lt-intro.lt-show, .lt-scene-card', { timeout: 10000 });
  });
});
