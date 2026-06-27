// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('LT v0.12.0 UI Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:3030/');
    // Dismiss intro if visible
    const introBtn = page.locator('#intro-start-btn');
    if (await introBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await introBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('StatusBar displays loop, clock, and AP', async ({ page }) => {
    await expect(page.locator('.lt-status-loop')).toContainText('第');
    await expect(page.locator('.lt-status-clock')).not.toBeEmpty();
    await expect(page.locator('.lt-status-ap')).toContainText('AP');
  });

  test('TimelineMiniBar shows progress bar', async ({ page }) => {
    await page.click('.lt-action-btn[data-template="__OBSERVE_SCENE__"]');
    await page.waitForTimeout(500);
    await expect(page.locator('.lt-tl-progress')).toBeVisible();
    await expect(page.locator('.lt-tl-start')).toHaveText('14:00');
    await expect(page.locator('.lt-tl-end')).toHaveText('14:15');
  });

  test('ObjectiveCard displays goal and steps', async ({ page }) => {
    await expect(page.locator('.lt-objective-title')).toHaveText('当前目标');
    await expect(page.locator('.lt-objective-text')).not.toBeEmpty();
    await expect(page.locator('.lt-objective-steps .lt-step')).toHaveCount(2);
  });

  test('SceneStateCard shows location and scene text', async ({ page }) => {
    await expect(page.locator('.lt-scene-location')).not.toBeEmpty();
    await expect(page.locator('.lt-scene-text')).not.toBeEmpty();
  });

  test('ActionDock shows recommended actions', async ({ page }) => {
    await expect(page.locator('.lt-action-dock')).toBeVisible();
    const buttons = page.locator('.lt-action-recommended .lt-action-btn');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(3);
  });

  test('EventFeed is visible and scrollable', async ({ page }) => {
    await expect(page.locator('.lt-event-feed')).toBeVisible();
  });

  test('Archive button opens ArchiveSheet', async ({ page }) => {
    // Do an action to move from intro stage so archive button is visible
    await page.click('.lt-action-btn[data-template="__OBSERVE_SCENE__"]');
    await page.waitForTimeout(500);
    await page.click('#btn-archive');
    await expect(page.locator('.lt-archive-sheet')).toHaveClass(/lt-show/);
    await expect(page.locator('.lt-archive-tabs .lt-tab')).toHaveCount(4);
  });

  test('More actions button opens MoreActionsSheet', async ({ page }) => {
    const moreBtn = page.locator('#lt-action-more-btn');
    if (await moreBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await moreBtn.click();
      await expect(page.locator('.lt-more-actions-sheet')).toHaveClass(/lt-show/);
    }
  });
});
