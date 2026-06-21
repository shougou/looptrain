const { test, expect } = require('@playwright/test');

test.describe('LoopTrain 完整玩家路径', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForSelector('.lt-intro.lt-show', { timeout: 10000 });
  });

  test('1-2: 进入游戏 → 开场可完成', async ({ page }) => {
    await expect(page.locator('#intro-start-btn')).toBeVisible();
    await page.click('#intro-start-btn');
    await page.waitForSelector('.lt-intro:not(.lt-show)', { timeout: 5000 });
    await expect(page.locator('.lt-scene-card')).toBeVisible();
  });

  test('3: 第一轮可行动', async ({ page }) => {
    await page.click('#intro-start-btn');
    await page.waitForSelector('.lt-scene-card', { timeout: 5000 });
    await expect(page.locator('.lt-goal-bar')).toBeVisible();
    await expect(page.locator('.lt-topbar-left')).toContainText('第 1 轮');
  });

  test('4: 可与小宁对话', async ({ page }) => {
    await page.click('#intro-start-btn');
    await page.waitForSelector('.lt-scene-card', { timeout: 5000 });
    await page.waitForTimeout(1000);
    await page.click('[data-npc-id="xiaoning"]');
    await page.waitForSelector('.lt-dialogue-panel.lt-show', { timeout: 5000 });
    await expect(page.locator('.lt-dialogue-npc')).toContainText('小宁');
    await page.fill('.lt-input', '你好');
    await page.click('#btn-send');
    await expect(page.locator('.lt-dialogue-log .lt-msg-npc')).toBeVisible({ timeout: 5000 });
  });

  test('5: 可与赵乘警对话', async ({ page }) => {
    await page.click('#intro-start-btn');
    await page.waitForSelector('.lt-scene-card', { timeout: 5000 });
    await page.waitForTimeout(1000);
    await page.click('[data-npc-id="zhao_police"]');
    await page.waitForSelector('.lt-dialogue-panel.lt-show', { timeout: 5000 });
    await page.fill('.lt-input', '我需要报告');
    await page.click('#btn-send');
    await page.waitForTimeout(800);
    await page.evaluate(() => document.getElementById('end-dialogue-btn').click());
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).not.toHaveClass(/dialogue-active/);
  });

  test('6: 可观察车厢', async ({ page }) => {
    await page.click('#intro-start-btn');
    await page.waitForSelector('.lt-scene-card', { timeout: 5000 });
    await page.waitForTimeout(1000);
    await page.click('[data-mode="action"]');
    await page.fill('.lt-input', '观察车厢');
    await page.click('#btn-send');
    await page.waitForTimeout(500);
    await expect(page.locator('.lt-scene-text')).toBeVisible();
  });

  test('7: 可移动到连接处', async ({ page }) => {
    await page.click('#intro-start-btn');
    await page.waitForSelector('.lt-scene-card', { timeout: 5000 });
    await page.waitForTimeout(1000);
    await page.click('[data-mode="action"]');
    await page.fill('.lt-input', '走向连接处');
    await page.click('#btn-send');
    await page.waitForTimeout(1000);
    await expect(page.locator('.lt-location')).toBeVisible();
  });

  test('8: 可触发灰衣乘客', async ({ page }) => {
    await page.click('#intro-start-btn');
    await page.waitForSelector('.lt-scene-card', { timeout: 5000 });
    await page.waitForTimeout(1000);
    await page.click('[data-mode="action"]');
    await page.fill('.lt-input', '走向连接处');
    await page.click('#btn-send');
    await page.waitForTimeout(1000);
    const grayChip = page.locator('[data-npc-id="gray_passenger"]');
    if (await grayChip.isVisible({ timeout: 3000 }).catch(() => false)) {
      await grayChip.click();
      await page.waitForSelector('.lt-dialogue-panel.lt-show', { timeout: 5000 });
      await page.fill('.lt-input', '你是谁');
      await page.click('#btn-send');
      await page.waitForTimeout(500);
      await page.click('#end-dialogue-btn', { force: true });
      await page.waitForTimeout(500);
    }
  });

  test('9-10: 可失败结算 → 可进入下一轮', async ({ page }) => {
    await page.click('#intro-start-btn');
    await page.waitForSelector('.lt-scene-card', { timeout: 5000 });
    await page.waitForTimeout(1000);
    await page.click('[data-mode="action"]');
    await page.fill('.lt-input', '强制失败测试');
    await page.click('#btn-send');
    await page.waitForSelector('.lt-ng.lt-show', { timeout: 5000 });
    await expect(page.locator('#btn-next-loop')).toBeVisible({ timeout: 5000 });
    await page.click('#btn-next-loop');
    await page.waitForSelector('.lt-ng', { state: 'hidden', timeout: 5000 });
    await expect(page.locator('.lt-topbar-left')).toContainText(/第 [2-9] 轮/);
  });

  test('11: 刷新后可恢复', async ({ page }) => {
    await page.click('#intro-start-btn');
    await page.waitForSelector('.lt-scene-card', { timeout: 5000 });
    await page.reload();
    await page.waitForTimeout(2000);
    const isIntroVisible = await page.locator('.lt-intro.lt-show').isVisible({ timeout: 3000 }).catch(() => false);
    const isContentVisible = await page.locator('.lt-scene-card').isVisible({ timeout: 3000 }).catch(() => false);
    expect(isContentVisible || !isIntroVisible).toBeTruthy();
  });

  test('12: 重置后可清空', async ({ page }) => {
    await page.click('#intro-start-btn');
    await page.waitForSelector('.lt-scene-card', { timeout: 5000 });
    page.on('dialog', d => d.accept());
    await page.click('#btn-manual-reset');
    await page.waitForTimeout(500);
    await page.waitForSelector('.lt-intro.lt-show', { timeout: 5000 });
    await expect(page.locator('#intro-start-btn')).toBeVisible();
  });
});
