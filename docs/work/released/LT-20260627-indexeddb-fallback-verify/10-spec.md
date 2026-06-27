# IndexedDB 降级验证 Spec

**Work Item**: LT-20260627-indexeddb-fallback-verify
**日期**: 2026-06-27
**目标版本**: v0.12.0 · Replay Echo
**文档类型**: Spec
**来源**: Work Item Idea — IndexedDB 降级验证
**适用范围**: LoopTrain Standalone / Playtest Build
**目标文件**: `looptrain/standalone/tests/e2e/indexeddb-fallback.spec.js`

---

## 1. 背景

v0.12.0 引入 RuntimeDB，用于在浏览器端基于 IndexedDB 保存事件流、状态快照与 Replay Anchor。该能力服务于“时间线回放”和“接入点选择”，属于增强体验，不应成为核心游戏流程的强依赖。

浏览器环境中 IndexedDB 可能不可用，或 RuntimeDB 初始化可能失败。当前 Work Item 只验证第一类最基础降级场景：

> `window.indexedDB` 不存在。

该场景下，系统应降级为“无历史回放能力”的基础模式：

- 游戏可以正常启动；
- 玩家可以正常执行基础行动；
- 失败结算可以正常展示；
- 进入下一轮可以正常工作；
- RuntimeDB 相关读写静默跳过；
- Replay Anchor 接入点不可用；
- 失败结算页展示明确降级提示；
- localStorage active state 仍作为最低可用存档能力。

---

## 2. 目标

本 Spec 的目标是通过 Playwright E2E 测试确认：

1. IndexedDB 缺失时，RuntimeDB 初始化失败不会阻断游戏启动。
2. IndexedDB 缺失时，核心游戏操作链路仍可执行。
3. IndexedDB 缺失时，RuntimeDB 事件流、快照、Replay Anchor 写入失败不会向用户暴露异常。
4. IndexedDB 缺失时，失败结算页不展示 Replay Anchor 接入点选择。
5. IndexedDB 缺失时，失败结算页展示降级提示：
   - “历史记录不可用”
   - “将从 14:00 开始”
6. IndexedDB 缺失时，点击进入下一轮后仍然可以从 14:00 正常开始。
7. 测试过程中不得出现 uncaught error / pageerror。
8. 验证结果需要记录到 `KNOWN_ISSUES.md`，并明确验证边界。

---

## 3. 非目标

本 Work Item 不处理以下事项：

1. 不验证真实 Chrome 隐私模式。
2. 不验证 Safari 私密浏览模式。
3. 不验证 `indexedDB.open` onerror。
4. 不验证 `indexedDB.open` blocked。
5. 不验证 quota / SecurityError / UnknownError。
6. 不修改 Engine 规则。
7. 不修改 Replay Anchor 生成逻辑。
8. 不修改 RuntimeDB 降级策略本身。
9. 不引入新的 UI 功能。
10. 不要求 IndexedDB 不可用时仍保留历史回放能力。

如需覆盖第 3~5 项，应另建后续 Work Item。

---

## 4. 当前预期降级策略

RuntimeDB 预期行为如下：

1. `RuntimeDB.init()` 检查 `window.indexedDB`。
2. 当 `window.indexedDB` 不存在时：
   - RuntimeDB 不抛出异常；
   - `_ready = false`；
   - `_db = null`；
   - 初始化结果为不可用状态。
3. 所有 RuntimeDB 读写操作在 `_db` 为空时静默跳过。
4. 游戏主流程不得依赖 RuntimeDB 是否成功初始化。
5. 失败结算页根据 RuntimeDB 可用状态决定：
   - 可用：展示 Replay Anchor 接入点；
   - 不可用：展示降级提示，并从 14:00 进入下一轮。
6. localStorage active state 继续作为最低可用存档。

---

## 5. 用户可见行为要求

### 5.1 游戏启动

当 IndexedDB 不可用时，玩家进入游戏页面后：

- 页面正常加载；
- 不出现白屏；
- 不出现浏览器弹窗错误；
- 不出现“系统不可用”类阻断提示；
- 可以进入或继续当前游戏状态。

### 5.2 基础行动

IndexedDB 不可用时，玩家仍可执行至少一个基础行动，例如：

- 观察当前场景；
- 盯住 NPC；
- 与 NPC 对话；
- 触发失败；
- 进入下一轮。

测试不强制要求完成完整成功路径，只要求验证核心链路未被 RuntimeDB 阻断。

### 5.3 失败结算

当 IndexedDB 不可用并触发失败结算后，失败结算页应显示：

```text
历史记录不可用，将从 14:00 开始
```

或语义等价文案。

同时：

- 不展示 Replay Anchor 接入点选择；
- 不允许选择上一轮时间点进入；
- 仍允许点击“进入第 N 轮”；
- 进入下一轮后 clock 应为 14:00。

---

## 6. 技术方案

### 6.1 新增测试文件

新增文件：

```text
looptrain/standalone/tests/e2e/indexeddb-fallback.spec.js
```

### 6.2 IndexedDB 缺失模拟

使用 Playwright `page.addInitScript` 在页面脚本执行前覆盖 `window.indexedDB`：

```js
await page.addInitScript(() => {
  Object.defineProperty(window, 'indexedDB', {
    configurable: true,
    get: () => undefined,
  });
});
```

要求：

- 必须在 `page.goto()` 前调用；
- 测试中需要验证页面上下文内 `window.indexedDB` 确实为 `undefined`；
- 不允许只 mock RuntimeDB 对象，因为本测试目标是浏览器能力缺失场景。

### 6.3 页面错误监听

测试必须监听 `pageerror`：

```js
const pageErrors = [];
page.on('pageerror', err => {
  pageErrors.push(err);
});
```

测试结束前断言：

```js
expect(pageErrors).toHaveLength(0);
```

如需收集 console error，可额外监听：

```js
const consoleErrors = [];
page.on('console', msg => {
  if (msg.type() === 'error') {
    consoleErrors.push(msg.text());
  }
});
```

但 console error 是否作为失败条件由实现稳定性决定。强制失败条件至少包括 `pageerror`。

### 6.4 测试操作路径

测试优先使用稳定选择器。若现有 DOM 缺少稳定选择器，允许在功能代码中仅增加 `data-testid`，但不得改变用户可见行为和业务逻辑。

推荐测试路径：

1. 打开 `/play/game/` 或当前 Standalone 游戏入口。
2. 等待游戏主界面可见。
3. 如存在开场遮罩，点击进入游戏。
4. 验证 `window.indexedDB === undefined`。
5. 执行基础行动：
   - 优先点击“观察当前场景”；
   - 如按钮不可稳定选择，可通过输入框发送可触发行动的文本。
6. 触发失败：
   - 优先使用已有“进入下一轮/失败/爆炸/重开”指令；
   - 如存在稳定测试入口，可使用测试入口；
   - 不应修改 Engine 规则。
7. 等待失败结算页出现。
8. 验证降级提示文本。
9. 点击“进入第 N 轮”。
10. 验证新轮次状态：
    - clock 为 14:00；
    - 游戏仍可继续操作；
    - 页面无 pageerror。

---

## 7. 建议测试用例结构

### 7.1 用例名称

```js
test('falls back gracefully when IndexedDB is unavailable', async ({ page }) => {
  // ...
});
```

### 7.2 测试骨架

```js
const { test, expect } = require('@playwright/test');

test.describe('RuntimeDB IndexedDB fallback', () => {
  test('falls back gracefully when IndexedDB is unavailable', async ({ page }) => {
    const pageErrors = [];

    page.on('pageerror', err => {
      pageErrors.push(err);
    });

    await page.addInitScript(() => {
      Object.defineProperty(window, 'indexedDB', {
        configurable: true,
        get: () => undefined,
      });
    });

    await page.goto('/play/game/');

    const indexedDbAvailable = await page.evaluate(() => typeof window.indexedDB !== 'undefined');
    expect(indexedDbAvailable).toBe(false);

    // 1. 等待游戏 UI 可用
    // 2. 跳过 intro / 进入游戏
    // 3. 执行基础行动
    // 4. 触发失败结算
    // 5. 验证降级提示
    // 6. 进入下一轮
    // 7. 验证 14:00 状态
    // 8. 验证无 pageerror

    expect(pageErrors).toHaveLength(0);
  });
});
```

具体 selector 由当前 UI 实现决定。不得通过硬编码 DOM 层级实现脆弱测试；优先使用按钮文本、aria-label、role、data-testid。

---

## 8. 验收标准

本 Work Item 完成后，必须满足以下条件：

1. 新增 `looptrain/standalone/tests/e2e/indexeddb-fallback.spec.js`。
2. `npm run test:e2e` 可以执行新增测试。
3. 测试中通过 `page.addInitScript` 模拟 `window.indexedDB` 不存在。
4. 测试明确断言 `window.indexedDB` 不可用。
5. 游戏页面正常加载。
6. 至少一个基础行动可以成功执行。
7. 可以进入失败结算页。
8. 失败结算页显示 IndexedDB / 历史记录不可用的降级提示。
9. 失败结算页不展示可选择的 Replay Anchor 接入点。
10. 点击进入下一轮后，clock 为 14:00。
11. 测试过程中无 pageerror。
12. `KNOWN_ISSUES.md` 已更新验证结果。
13. 如果新增 `data-testid`，只允许作为测试辅助，不得改变业务逻辑。

---

## 9. KNOWN_ISSUES.md 更新要求

如果当前 `KNOWN_ISSUES.md` 中存在：

```text
待验证：IndexedDB 不可用时 RuntimeDB 降级路径
```

应更新为：

```text
已验证：IndexedDB 缺失时 RuntimeDB 可降级

验证日期：2026-06-27
验证方式：Playwright E2E，通过 page.addInitScript 模拟 window.indexedDB 不存在。
验证结果：游戏启动、基础行动、失败结算、进入下一轮均正常；Replay Anchor 不可用时显示降级提示。
验证边界：本次只覆盖 window.indexedDB 缺失，不覆盖 indexedDB.open onerror、blocked、quota、SecurityError 或真实浏览器私密模式差异。
```

如果 `KNOWN_ISSUES.md` 尚不存在，应创建该文件，并加入“已验证问题”章节。

建议结构：

```md
# Known Issues

## 已验证

### IndexedDB 缺失时 RuntimeDB 可降级

- 验证日期：2026-06-27
- 验证方式：Playwright E2E，通过 page.addInitScript 模拟 window.indexedDB 不存在。
- 验证结果：游戏启动、基础行动、失败结算、进入下一轮均正常；Replay Anchor 不可用时显示降级提示。
- 验证边界：本次只覆盖 window.indexedDB 缺失，不覆盖 indexedDB.open onerror、blocked、quota、SecurityError 或真实浏览器私密模式差异。

## 待验证

- IndexedDB open onerror 场景
- IndexedDB blocked 场景
- quota / SecurityError / UnknownError 场景
- Safari 私密浏览场景
```

---

## 10. Agent 实施约束

1. 不得修改 Engine 成功/失败规则。
2. 不得为了通过测试绕过真实页面流程。
3. 不得让 RuntimeDB 成为游戏启动前置条件。
4. 不得删除或削弱 existing localStorage active state 存档能力。
5. 不得把 IndexedDB 不可用误判为需要重置游戏。
6. 不得将本次验证结论扩展为“所有 IndexedDB 异常均已验证”。
7. 不得使用固定 DOM 层级或 brittle selector。
8. 如需增加测试选择器，只允许增加 `data-testid` 或 aria 辅助属性，不得改变用户可见行为。
9. 测试必须在 `page.goto()` 前注入 IndexedDB 缺失模拟。
10. 测试必须断言没有 pageerror。

---

## 11. 后续 Work Item 建议

本 Spec 完成后，建议继续拆分以下验证任务：

1. `indexedDB.open` onerror 降级验证。
2. `indexedDB.open` blocked 降级验证。
3. quota / SecurityError 降级验证。
4. Safari 私密浏览模式人工验证。
5. Replay Anchor 正常可用路径 E2E。
6. IndexedDB 可用与不可用两种路径的状态一致性对照测试。

---

## 12. 最终定义

本 Work Item 的最终定义是：

> 验证 RuntimeDB 在 `window.indexedDB` 缺失时不会影响 LoopTrain 核心游戏流程，并在失败结算中正确降级为“无历史回放接入点，从 14:00 进入下一轮”的基础体验。

本 Work Item 通过后，只能声明：

> 已验证 `window.indexedDB` 缺失场景下 RuntimeDB 可降级。

不得声明：

> 已验证所有 IndexedDB 异常场景。

---

## 13. 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `looptrain/standalone/tests/e2e/indexeddb-fallback.spec.js` | 新建 | 3 个降级场景测试 |
| `docs/project/KNOWN_ISSUES.md` | 更新 | 添加已验证章节 |

---

*本规格是 00-idea.md 的细化展开。如实施过程中发现规格不可行，需回退到 idea 阶段重新评估。*
