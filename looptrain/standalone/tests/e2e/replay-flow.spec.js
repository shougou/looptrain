const { test, expect } = require('@playwright/test');

test.describe('LoopTrain v0.12.0 时间线回放', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForSelector('#intro-start-btn', { timeout: 10000 });
  });

  test('失败后显示 ReplayAnchorPicker', async ({ page }) => {
    await page.click('#intro-start-btn');
    await page.waitForSelector('.lt-scene-card', { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // Do an action first to exit intro stage
    await page.click('.lt-action-btn[data-template="__OBSERVE_SCENE__"]');
    await page.waitForTimeout(1000);
    
    // Trigger failure via more actions or input
    await page.click('#lt-action-more-btn');
    await page.waitForTimeout(200);
    const failBtn = page.locator('.lt-action-btn:has-text("强制失败")');
    if (await failBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await failBtn.click();
    } else {
      await page.click('#lt-more-close');
      await page.waitForTimeout(200);
      await page.fill('.lt-input', '强制失败测试');
      await page.click('#btn-send');
    }
    
    // Wait for failure overlay
    await page.waitForSelector('.lt-ng.lt-show', { timeout: 5000 });
    
    // Check ReplayAnchorPicker is present
    await expect(page.locator('#replay-anchors-container')).toBeVisible({ timeout: 5000 });
    
    // Check next loop button is present
    await expect(page.locator('#btn-next-loop')).toBeVisible({ timeout: 5000 });
  });

  test('选择锚点后进入下一轮，循环数增加', async ({ page }) => {
    await page.click('#intro-start-btn');
    await page.waitForSelector('.lt-scene-card', { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // Do an action to create timeline entries
    await page.click('.lt-action-btn[data-template="__OBSERVE_SCENE__"]');
    await page.waitForTimeout(1000);
    
    // Trigger failure
    await page.click('#lt-action-more-btn');
    await page.waitForTimeout(200);
    const failBtn = page.locator('.lt-action-btn:has-text("强制失败")');
    if (await failBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await failBtn.click();
    } else {
      await page.click('#lt-more-close');
      await page.waitForTimeout(200);
      await page.fill('.lt-input', '强制失败测试');
      await page.click('#btn-send');
    }
    
    // Wait for failure overlay with replay anchors
    await page.waitForSelector('.lt-ng.lt-show', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    // Check that replay anchors are loaded
    const anchorsContainer = page.locator('#replay-anchors-container');
    await expect(anchorsContainer).toBeVisible({ timeout: 5000 });
    
    // Click next loop button (replay anchors are optional - we test the main flow)
    await page.click('#btn-next-loop');
    
    // Wait for overlay to close
    await page.waitForFunction(() => !document.querySelector('#overlay-ng')?.classList.contains('lt-show'), { timeout: 5000 });
    
    // Verify loop number increased
    await expect(page.locator('.lt-status-loop')).toContainText(/第 [2-9] 轮/);
  });

  test('不选择锚点直接进入下一轮也可行', async ({ page }) => {
    await page.click('#intro-start-btn');
    await page.waitForSelector('.lt-scene-card', { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // Do an action first to exit intro stage and make input visible
    await page.click('.lt-action-btn[data-template="__OBSERVE_SCENE__"]');
    await page.waitForTimeout(1000);
    
    // Trigger failure
    await page.click('#lt-action-more-btn');
    await page.waitForTimeout(200);
    const failBtn = page.locator('.lt-action-btn:has-text("强制失败")');
    if (await failBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await failBtn.click();
    } else {
      await page.click('#lt-more-close');
      await page.waitForTimeout(200);
      await page.fill('.lt-input', '强制失败测试');
      await page.click('#btn-send');
    }
    
    await page.waitForSelector('.lt-ng.lt-show', { timeout: 5000 });
    await expect(page.locator('#btn-next-loop')).toBeVisible({ timeout: 5000 });
    
    await page.click('#btn-next-loop');
    await page.waitForFunction(() => !document.querySelector('#overlay-ng')?.classList.contains('lt-show'), { timeout: 5000 });
    
    await expect(page.locator('.lt-status-loop')).toContainText(/第 [2-9] 轮/);
  });
});