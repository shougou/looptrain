# Review: 存档版本检测与 Breaking Change 强制重置

> 审 5 件事：是否符合 idea、spec、plan，是否存在偏离，是否可以发布。

## 1. Review 结论

- [x] 通过
- [ ] 有条件通过
- [ ] 不通过

**理由**：14 条验收标准全部由代码路径覆盖，`node --check` 语法检查通过，`npm test`（含新增 save version detection 测试块）全部通过。实现与 spec/plan 一致，代码质量满足发布标准。无阻塞性问题。

---

## 2. Spec 对照

| # | Spec 要求（AC） | 实现情况 | 结论 |
|---|---|---|---|
| **AC-1** | 新玩家首次进入游戏（无 `lt:` 前缀 key 且无 `looptrain.standalone.v1`）→ 不弹任何提示，直接展示 intro overlay | `init()` → `loadSaveMeta()` 返回 `null` → `detectLegacyKeys()` 返回 `[]` → 走 else 分支 → `initNewSave()` + `render()`。intro overlay 由 CSS class `lt-show` 控制显示。 | ✅ 通过 |
| **AC-2** | 旧玩家有 `looptrain.standalone.v1` 但无 `lt:save:meta` → 弹出「新版试玩已重构」模态框 → 点击「重新开始」归档旧数据 → 创建新版存档 | `detectLegacyKeys()` 扫描 `localStorage` 找到 `looptrain.standalone.v1` → `showResetModal('legacy')` 显示模态框 → 按钮绑定的 `handleReset()` 调用 `archiveLegacyData()` 归档到 `lt:legacy:<timestamp>` → `clearLtKeys()` → `initNewSave()` → `hideResetModal()`。 | ✅ 通过 |
| **AC-3** | `storyVersion !== CURRENT_STORY_VERSION` → 弹版本不兼容提示，强制重置 | `init()` 内 `meta.storyVersion !== LT_STORY_VERSION` → `showResetModal('incompatible')`，文案为「检测到旧版本存档（剧情版本不匹配）」；`meta.saveSchemaVersion < LT_MIN_COMPATIBLE_SCHEMA_VERSION` 同样触发 incompatible 路径。 | ✅ 通过 |
| **AC-4** | 兼容存档（`saveSchemaVersion >= MIN` 且 `storyVersion === CURRENT`）→ 不弹提示，正常恢复 | `init()` 进入 `else if (meta)` 分支 → 版本检查通过 → `loadState()` + `render()`。`loadState()` 读取 `lt:save:runtime` JSON 并设置 `state`。 | ✅ 通过 |
| **AC-5** | URL `?reset=1` → 清除 LT 存档 → 创建新初始存档 → 跳转无参数 URL → 展示 intro | `init()` 顶部检查 `urlParams.get('reset') === '1'` → `handleReset()` → `history.replaceState(null, '', cleanUrl)` 移除 query param。 | ✅ 通过 |
| **AC-6** | 设置页「🔄重置」按钮 → confirm 对话框 → 清除 LT 存档 → 创建新初始存档 → 进入 intro | `btn-manual-reset` click handler → `confirm('确定要重新开始吗？当前进度将清除。')` → `handleReset()`。按钮位于 `.lt-command-bar` 第 38 行。 | ✅ 通过 |
| **AC-7** | `window.LT_RESET()` → 清除 LT 存档 → 创建新初始存档 → `location.reload()` | `LT_RESET` 函数：`detectLegacyKeys()` → `archiveLegacyData()` → `clearLtKeys()` → `location.reload()`。刷新后 `init()` 走新玩家路径自动重建存档。 | ✅ 通过 |
| **AC-8** | 清除操作不删除 `lt:legacy:` 前缀 key | `clearLtKeys()` 内 `key.indexOf('lt:legacy:') !== 0` 条件排除 legacy key。 | ✅ 通过 |
| **AC-9** | 清除操作不删除非 `lt:` 前缀 key | `clearLtKeys()` 先检查 `key.indexOf(LT_KEY_PREFIX) === 0`，不匹配 `lt:` 的 key 直接跳过。 | ✅ 通过 |
| **AC-10** | 旧 IndexedDB (`LoopTrainDB`, `LoopTrainRuntimeDB`, `LoopTrainMemoryDB`) 启动时尝试删除，失败不阻塞 | `clearOldIndexedDBs()` 在 `init()` 末尾异步调用；遍历旧 DB 名调用 `indexedDB.deleteDatabase()`；`onsuccess` 打 `console.info`，`onerror`/`onblocked` 打 `console.warn`；外有 `try/catch` 保护。 | ✅ 通过 |
| **AC-11** | `lt:save:meta` 包含完整 6 字段（appId, saveSchemaVersion, runtimeVersion, storyVersion, createdAt, updatedAt），合法 JSON | `saveSaveMeta()` 写入全部 6 字段，`createdAt` 在首次保存时设置（`new Date().toISOString()`），`updatedAt` 每次保存更新。`loadSaveMeta()` 用 `JSON.parse` 解析，`try/catch` 保护。smoke test 验证 `LT_SAVE_SCHEMA_VERSION=1`、`LT_RUNTIME_VERSION='0.8.0'`、`LT_STORY_VERSION='demo-0.8-handeng'`。 | ✅ 通过 |
| **AC-12** | 三种重置路径后初始状态一致（`loop=1`, `clock='14:00'`, `known_clues` 含 `gray_coat_note_pressure`, `intro_seen=false`） | 三条路径（UI 按钮 / `?reset=1` / `LT_RESET()`）最终都调用 `initNewSave()` → `clone(START_STATE)` → `state.flags.intro_seen = false` → `saveState()`。smoke test 验证 `engine.executeCommand('reset_game', engine.START_STATE)` 返回标准起始状态。 | ✅ 通过 |
| **AC-13** | 模态框不可通过点击遮罩关闭 | `showResetModal()` 仅设置 `overlay.style.display = 'flex'`，**未** 绑定 click 事件到 `.lt-reset-overlay`。唯一关闭路径是点击 `lt-reset-confirm` 按钮。 | ✅ 通过 |
| **AC-14** | `looptrain.audio.muted` 迁移到 `lt:settings`，静音偏好跨版本保持 | `migrateAudioSettings()` 读取旧 key → 写入 `lt:settings` JSON。`AudioManager.readMuted()` 从 `readSettings().muted` 读取；`AudioManager.writeMuted()` 写入 `readSettings()` JSON 对象并保存。`handleReset()` 内也调用 `AudioManager.setMuted()` 保留静音偏好。 | ✅ 通过 |

---

## 3. 代码变更检查

### 3.1 变更文件清单

| 文件 | 变更类型 | 行数影响 | 质量评价 |
|------|----------|----------|----------|
| `looptrain/standalone/public/app.js` | MAJOR | ~200 行新增/修改 | 合格 |
| `looptrain/standalone/public/index.html` | MINOR | +8 行（模态框 HTML + 按钮） | 合格 |
| `looptrain/standalone/public/style.css` | MINOR | +36 行（`.lt-reset-*` 样式） | 合格 |
| `looptrain/standalone/public/audio-manager.js` | MINOR | ~15 行修改（迁移到 `lt:settings`） | 合格 |
| `looptrain/standalone/tests/smoke_test.js` | MINOR | +16 行（测试块 7） | 合格 |
| `looptrain/standalone/engine.js` | NONE | 无需变更 | N/A |

### 3.2 代码质量检查

- **命名规范**：版本常量使用 `LT_` 前缀（`LT_SAVE_SCHEMA_VERSION`, `LT_RUNTIME_VERSION`, `LT_STORY_VERSION`）；key 常量使用 `LT_*_KEY` 模式。函数命名采用 camelCase（`saveSaveMeta`, `detectLegacyKeys`, `clearOldIndexedDBs`），与项目现有风格一致。
- **不可变性**：✅ `initNewSave()` 使用 `clone(START_STATE)` 而非直接赋值。`saveSaveMeta()` 创建新对象而非修改。
- **错误处理**：✅ 所有 `localStorage` 操作包裹 `try/catch`。`clearOldIndexedDBs()` 内 `indexedDB.deleteDatabase()` 有 `onsuccess`/`onerror`/`onblocked` 三重回调处理。
- **无突变模式**：✅ 数组使用 `forEach` 遍历，对象使用 `JSON.parse/stringify` 深拷贝。
- **安全性检查**：
  - ✅ 无 `localStorage.clear()` — 只以 `lt:` 前缀精确匹配删除。
  - ✅ 无硬编码 secret / API key。
  - ✅ 全部 `console` 输出为 `console.warn` 或 `console.info`（无 `console.log` debug 输出）。
  - ✅ URL parameter 仅读取 `reset=1`，无其他注入风险。
- **LSP 诊断**：`node --check` 对 `app.js` 和 `audio-manager.js` 均通过。

### 3.3 与 Plan 的偏离

| 偏离项 | 说明 | 影响 |
|--------|------|------|
| 版本常量使用 `var` 而非 `const` | 匹配项目现有顶部变量风格（`state`, `lastFailure` 等均使用 `var`） | 无功能影响，风格一致 |
| `clearOldIndexedDBs` 使用 `console.info` 记录成功 | plan 要求全部 `console.warn`；使用 `console.info` 区分成功消息是可接受的改进 | 正面偏离 |
| `migrateAudioSettings` 定义为模块级函数 | plan 建议放在 `init()` 内部；放在模块级使所有 save 逻辑集中在一处，可读性更佳 | 正面偏离 |
| `engine.js` 未修改 | plan 中列为需确认但最终确认 `executeCommand('reset_game')` 已正确返回 `normalize(START_STATE)`，无需修改 | 无影响 |
| 实现为一次性完成所有 Phase | plan 建议分 Phase A→D 迭代；实际代码中函数定义顺序保证 forward-reference 不出现（`init()` 引用的函数全部在其上方定义） | 无功能影响 |

---

## 4. Runtime 检查

### 4.1 init() 流程验证

`init()` 的 4 路径分流逻辑（app.js:934-973）：

```
init()
  → bootContent()
  → AudioManager.init()
  → migrateAudioSettings()
  → URL?reset=1?
      YES → handleReset() → history.replaceState()
      NO  → loadSaveMeta() + detectLegacyKeys()
           legacyKeys.length > 0?
              YES → showResetModal('legacy')
              NO  → meta exists?
                  YES → version compatible?
                      YES → loadState() + render()
                      NO  → showResetModal('incompatible')
                  NO  → initNewSave() + render()
  → clearOldIndexedDBs()
```

每个分支均有明确的退出条件，无递归调用 `init()` 的风险。

### 4.2 Save 系统

- `saveState()` → 写入 `lt:save:runtime` JSON → 调用 `saveSaveMeta()`。
- `saveSaveMeta()` → 写入 `lt:save:meta` JSON（6 字段），`updatedAt` 每次刷新。
- `loadState()` → 读取 `lt:save:runtime` JSON，fallback 到 `clone(START_STATE)`，含 `_goal`/`_goalData` 双向兼容修复。

### 4.3 版本检测

- `detectLegacyKeys()` 扫描全体 `localStorage` key，仅匹配 `looptrain.standalone.v1` 且在新 meta 不存在时才判定为 legacy。
- `loadSaveMeta()` 返回 `null` 表示新玩家；返回对象后比对 `storyVersion` 和 `saveSchemaVersion`。

### 4.4 清理与重置

- `clearLtKeys()` 仅删除 `lt:` 前缀、排除 `lt:legacy:` 和 `lt:settings`。
- `archiveLegacyData()` 将旧数据写入 `lt:legacy:<timestamp>` 后删除原 key。
- `initNewSave()` 基于 `clone(START_STATE)` 创建，`intro_seen=false`。
- `resetGame()` 已升级为使用新 save 系统（`detectLegacyKeys → archiveLegacyData → clearLtKeys → initNewSave`）。
- `window.LT_RESET()` 执行清理后调用 `location.reload()`，刷新后自动走新玩家路径。

---

## 5. UI/UX 检查

### 5.1 Reset Modal（`index.html:90-97`, `style.css:550-586`）

- HTML 结构：`.lt-reset-overlay > .lt-reset-card > h2(.lt-reset-title) + p(.lt-reset-body) + button(.lt-reset-btn)`
- 位置：`.lt-ng` failure overlay 之后、`.lt-intro` intro overlay 之前。
- 样式对齐 `.lt-ng-card` 设计系统（`--lt-panel-strong` 背景、16px 圆角、1px border）。
- z-index: 110（高于 `.lt-intro` 和 `.lt-ng`），确保覆盖所有 overlay。
- 按钮样式对齐 `.lt-intro-btn`（`--lt-gold` 填充、`#0d1118` 文字、圆角 999px、`min-height: 44px` 触控友好）。
- 遮罩**无点击事件** → AC-13 不可点遮罩关闭。

### 5.2 文案质量

| 场景 | 文案 | 评价 |
|------|------|------|
| Legacy 数据检测 | 「《寒灯初醒》试玩是一次全面重构，剧情、人物和游戏系统都已更新。旧存档无法兼容，需要重新开始。你的旧进度已保留在浏览器中，不会丢失（开发侧留档）。」 | ✅ 坦诚、无负面词汇（破损、错误、异常等） |
| Incompatible version | 「检测到旧版本存档（剧情版本不匹配）。新版试玩已重构，需要重新开始。你的旧进度已保留在浏览器中，不会丢失。」 | ✅ 清晰、直接 |
| 手动重置 confirm | 「确定要重新开始吗？当前进度将清除。」 | ✅ 简洁明确 |
| 重置完成 toast | `${APP_STRINGS.resetToast \|\| '已重置试玩版。开场背景将重新显示。'}` | ✅ 支持自定义 |

### 5.3 「🔄重置」按钮（`index.html:38`）

- 位于 `.lt-command-bar` 末尾，图标 🔄 + 文字「重置」。
- `title="重新开始试玩版"` 提供无障碍 tooltip。
- 通过 `.lt-cmd-btn` 类复用命令栏按钮样式。

---

## 6. 存档兼容性检查

### 6.1 Key 迁移矩阵

| 旧 Key | 新 Key | 迁移方式 | 状态 |
|--------|--------|----------|------|
| `looptrain.standalone.v1` | → `lt:legacy:<ts>`（归档） + `lt:save:runtime`（重建） | `archiveLegacyData()` + `initNewSave()` | ✅ |
| `looptrain.audio.muted` | → `lt:settings` `{ muted: boolean }` | `migrateAudioSettings()` + `AudioManager` 读写升级 | ✅ |
| （无旧 key，新玩家） | → `lt:save:meta` + `lt:save:runtime` | `initNewSave()` | ✅ |

### 6.2 数据隔离

- `lt:legacy:*` 归档数据永久保留，新系统不读取。
- `lt:settings` 跨版本保留，不清除。
- 非 `lt:` 前缀 key 完全不受影响。
- IndexedDB 旧库异步删除，新版使用 `LoopTrainMemoryDB_v0_8` 新名天然隔离。

### 6.3 回滚兼容性

- 旧数据归档到 `lt:legacy:<timestamp>`，不回滚代码即可通过浏览器 DevTools 手动恢复。
- `git revert` 回滚代码后，可手动将归档数据写回 `looptrain.standalone.v1` 恢复旧存档。

---

## 7. 风险与遗留问题

### 7.1 已缓解风险

| 风险 | 缓解措施 | 状态 |
|------|----------|------|
| 旧玩家困惑 | 文案坦诚告知「试玩版重构」，避免「损坏」等负面词汇 | ✅ 已缓解 |
| IndexedDB 删除阻塞 | 异步、非阻塞调用，`try/catch` 保护，新版 DB 名隔离 | ✅ 已缓解 |
| URL `?reset=1` 误触发 | 重置后 `history.replaceState` 自动移除参数 | ✅ 已缓解 |
| localStorage 隐私模式不可用 | 所有 `localStorage` 操作 `try/catch` 包裹 | ✅ 已缓解 |
| 旧 key 遗漏污染 | `clearLtKeys()` 精确按 `lt:` 前缀匹配（排除 legacy）；`looptrain.standalone.v1` 单独检测 | ✅ 已缓解 |
| `looptrain.audio.muted` 迁移失败 | `migrateAudioSettings()` 为 best-effort；`handleReset()` 内二次检查旧 key | ✅ 已缓解 |

### 7.2 遗留注意事项（非阻塞）

1. **IndexedDB 删除时机**：`clearOldIndexedDBs()` 在 `init()` 末尾调用，不阻塞启动，但依赖 `window.indexedDB` 可用。在不支持 IndexedDB 的浏览器中函数直接 return，无副作用。

2. **`lt:save:memory` 和 `lt:save:goals` 预留 key**：spec 中声明这两个 key 为 v0.8 后续 IndexedDB 迁移预留。当前阶段 `lt:save:runtime` 包含全部状态。后续 MemoryRuntime 迁移到 IndexedDB 时需在此处接入。

3. **长期版本升级**：spec 第 10.2 节定义了 Patch/Minor/Major 三级升级策略。当前 `MIN_COMPATIBLE_SCHEMA_VERSION = 1`，后续 Minor 版本可写 migration 逻辑兼容旧存档。Major 版本继续走 breaking change 路径。

4. **浏览器手动测试**：14 条 AC 已通过代码路径分析验证，但完整浏览器手动端到端测试（spec Section 6.2 的 14 条手动测试路径）仍建议在 QA 阶段执行。

---

## 8. 是否允许发布

**结论：允许发布（✅ 是）**

理由：
- 14 条验收标准全部由代码路径覆盖，无阻塞性问题。
- `node --check` 对 `app.js` 和 `audio-manager.js` 语法检查通过。
- `npm test` 全部 7 个测试块（含新增 save version detection 测试）通过。
- 代码风格与项目一致（`var` 变量声明、`try/catch` 包裹、`console.warn` 日志）。
- 无安全漏洞（无 `localStorage.clear()`、无硬编码 secret、无注入风险）。
- 回滚路径清晰（所有改动集中在 5 个文件，`git revert` 可行；旧数据归档保留）。

**发布前置条件**：无。代码层面已就绪。

**建议发布后关注**：
- 旧玩家反馈（重置体验是否符合预期）
- 浏览器兼容性（IndexedDB 删除在不同浏览器的表现）
- `lt:settings` 静音迁移的实际用户覆盖率

---

*Review by: Sisyphus-Junior · Date: 2026-06-20 · Phase: Review (5/8)*
