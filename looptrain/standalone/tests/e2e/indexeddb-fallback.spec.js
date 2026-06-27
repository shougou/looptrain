const { test, expect } = require('@playwright/test');

test.describe('LoopTrain v0.12.0 IndexedDB 降级', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForSelector('#intro-start-btn', { timeout: 10000 });
  });

  test('RuntimeDB 不可用时游戏正常启动', async ({ page }) => {
    await page.evaluate(() => {
      if (typeof RuntimeDB !== 'undefined') {
        RuntimeDB._db = null;
        RuntimeDB._ready = false;
      }
    });

    await page.click('#intro-start-btn');
    await page.waitForSelector('.lt-scene-card', { timeout: 5000 });
    await expect(page.locator('.lt-status-loop')).toContainText('第 1 轮');
    await expect(page.locator('.lt-status-clock')).not.toBeEmpty();
  });

  test('RuntimeDB 不可用时失败结算显示降级提示', async ({ page }) => {
    await page.click('#intro-start-btn');
    await page.waitForSelector('.lt-scene-card', { timeout: 5000 });
    await page.waitForTimeout(1000);

    await page.click('.lt-action-btn[data-template="__OBSERVE_SCENE__"]');
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      if (typeof RuntimeDB !== 'undefined') {
        RuntimeDB._db = null;
        RuntimeDB._ready = false;
      }
    });

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
    await expect(page.locator('#replay-anchors-container')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.lt-anchor-empty')).toContainText('历史记录不可用');
  });

  test('RuntimeDB 不可用时进入下一轮正常工作', async ({ page }) => {
    await page.click('#intro-start-btn');
    await page.waitForSelector('.lt-scene-card', { timeout: 5000 });
    await page.waitForTimeout(1000);

    await page.click('.lt-action-btn[data-template="__OBSERVE_SCENE__"]');
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      if (typeof RuntimeDB !== 'undefined') {
        RuntimeDB._db = null;
        RuntimeDB._ready = false;
      }
    });

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

    await page.waitForFunction(
      () => !document.querySelector('#overlay-ng')?.classList.contains('lt-show'),
      { timeout: 5000 }
    );

    await expect(page.locator('.lt-status-loop')).toContainText(/第 [2-9] 轮/);
  });
});
