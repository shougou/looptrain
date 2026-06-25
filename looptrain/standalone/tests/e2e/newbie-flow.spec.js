const { test, expect } = require('@playwright/test');

test.describe('Newbie Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3030/?reset=1');
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('first screen shows only 1 action button', async ({ page }) => {
    await page.click('#intro-start-btn');
    await page.waitForTimeout(500);
    const buttons = await page.locator('.lt-action-recommended .lt-action-btn').count();
    expect(buttons).toBe(1);
  });

  test('after observation shows 2 buttons', async ({ page }) => {
    await page.click('#intro-start-btn');
    await page.waitForTimeout(500);
    await page.click('.lt-action-btn[data-template]');
    await page.waitForTimeout(500);
    const buttons = await page.locator('.lt-action-recommended .lt-action-btn').count();
    expect(buttons).toBe(2);
  });

  test('assistant hint card appears', async ({ page }) => {
    await page.click('#intro-start-btn');
    await page.waitForTimeout(500);
    const hint = await page.locator('#lt-assistant-hint').count();
    expect(hint).toBe(1);
  });

  test('input box hidden on intro', async ({ page }) => {
    await page.click('#intro-start-btn');
    await page.waitForTimeout(500);
    const bottom = await page.locator('#region-bottom').isVisible();
    expect(bottom).toBeFalsy();
  });

  test('caseboard button hidden on intro', async ({ page }) => {
    await page.click('#intro-start-btn');
    await page.waitForTimeout(500);
    const archiveBtn = await page.locator('#btn-archive').isVisible();
    expect(archiveBtn).toBeFalsy();
  });
});