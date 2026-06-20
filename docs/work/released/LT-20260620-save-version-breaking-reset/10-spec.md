# Spec: 存档版本检测与 Breaking Change 强制重置

> 基于 `00-idea.md` 生成。回答：要做什么？为什么做？边界是什么？验收标准是什么？

## 1. 背景

当前 SLT（Standalone LoopTrain）前端的存档实现为原始 `localStorage` 写入：

- 单 key `looptrain.standalone.v1`，存储 `JSON.stringify(state)` 全量副本。
- 无版本号、无 metadata、无 Schema 演进机制。
- 前端 `loadState()` 在启动时直接 `JSON.parse` 并回退到 `START_STATE`。

v0.8 试玩版对底层进行了全面重构：

| 维度 | 旧版 | 新版 |
|------|------|------|
| 剧情 | 旧列车结构、炸弹线索 | 寒灯初醒、新时间线 |
| 人物 | 小宁、旧助手 | 许知微主动引导 |
| Runtime | 旧状态机 | MemoryRuntime + GoalEngine |
| 目标系统 | 旧目标结构 | 结构化 GoalEngine |
| 指令系统 | 旧指令 | 结构化 Action |
| 记忆结构 | 旧 dialogueHistory | 结构化 Clue / Fact / Event |

旧存档与新系统语义不一致。若不做强制重置，将导致目标错乱、NPC 不存在、开场不触发等致命状态错误。

当前版本：`v0.8-testplay`（来源：`looptrain/AGENT.md`）。

## 2. 目标

1. **存档版本化**：给所有游戏存档增加 metadata（`saveSchemaVersion` / `runtimeVersion` / `storyVersion`）。
2. **不兼容检测**：启动时检测旧浏览器数据，判定不兼容则**不进入旧 Runtime**。
3. **强制新开局**：检测到 breaking change 后，自动隔离旧数据并创建新版初始存档。
4. **用户提示**：坦诚告知玩家"新版试玩已重构，旧存档不兼容"，而非"存档损坏"。
5. **数据安全**：只清理 LT 游戏相关 key，不清空整个 `localStorage`；旧数据归档保留（开发侧）。
6. **手动重置入口**：提供 UI 按钮、URL 参数、开发者控制台三种重置方式。
7. **IndexedDB 兼容**：如果 MemoryRuntime 使用 IndexedDB，确保旧 DB 不污染新版。

## 3. 非目标

1. **不做旧数据迁移**：本次定义为 breaking save change，不写任何 migration 逻辑。
2. **不做版本兼容降级**：不支持从新版回退到旧版。
3. **不改 Service Worker / PWA 缓存策略**。
4. **不做多存档槽位**：试玩版始终只有一个当前存档。
5. **不做云存档 / 跨设备同步**。

## 4. 用户体验设计

### 4.1 首次新玩家（无旧数据）

页面加载 → 引擎正常初始化 → 直接展示开场介绍（intro overlay），玩家点击「进入二号车厢」开始游戏。无任何额外提示。

### 4.2 旧玩家（有旧 localStorage 数据）

启动检测到旧版存档 → 暂停游戏初始化 → 弹出重置提示模态框：

**模态框内容**：

```
标题：新版试玩已重构

正文：
《寒灯初醒》试玩是一次全面重构，剧情、人物和游戏系统都已更新。
旧存档无法兼容，需要重新开始。

你的旧进度已保留在浏览器中，不会丢失（开发侧留档）。

按钮：
[ 重新开始 ]
```

- 只显示一个主按钮（「重新开始」），减少认知负担。
- 点击后：归档旧数据 → 创建新版初始存档 → 关闭模态 → 展示开场 intro。
- 模态不可通过点击遮罩关闭（强制选择）。
- 文案避免使用"损坏""错误""异常"等负面词汇，使用"重构""更新""重新开始"。

### 4.3 兼容存档玩家（版本一致）

启动 → SaveMeta 验证通过 → `loadState()` 正常恢复 → 无模态 → 直接进入游戏。

### 4.4 手动重置 — UI 按钮

在设置/帮助区域新增按钮：「重新开始试玩版」。

- 点击后弹出确认对话框：「确定要重新开始吗？当前进度将清除。」
- 确认后：清除当前 LT 存档 → 重新创建初始存档 → 刷新页面状态。
- 不弹版本检测模态（因为已经手动确认）。

### 4.5 手动重置 — URL 参数

访问 `?reset=1` 时：

- 启动时不读存档，直接清除 LT 相关 localStorage → 创建新存档 → 展示开场。
- 处理后自动跳转到无参数的 URL（替换 history state），避免刷新循环。

### 4.6 手动重置 — 开发者控制台

`window.LT_RESET()`：

- 清除 LT 相关 localStorage → 创建新存档 → 刷新页面。
- 不清除非 LT 前缀的 key。

## 5. Runtime 影响

### 5.1 当前启动流程（app.js `init()`）

```text
DOMContentLoaded
  → bootContent()
  → AudioManager.init()
  → loadState()        // 读取 localStorage，无存档则回退 START_STATE
  → render()
```

### 5.2 新版启动流程

```text
DOMContentLoaded
  → bootContent()
  → AudioManager.init()
  → loadSaveMeta()                              // 新增：读取 lt:save:meta
  → detectLegacyData()                          // 新增：扫描旧 localStorage key
  → if legacy or incompatible:
      → showResetModal()                        // 新增：弹模态框
      → on confirm:
          → archiveLegacyData()                 // 新增：归档旧数据
          → clearLtKeys()                       // 新增：清除 LT 前缀 key
          → initNewSave()                       // 新增：创建新版初始存档
          → hideResetModal()
          → render()
  → else if compatible:
      → loadState()                             // 现有逻辑
      → render()
  → else (new player):
      → initNewSave()                           // 创建新版初始存档
      → render()
```

### 5.3 对现有函数的改动

| 函数 | 改动 |
|------|------|
| `loadState()` | 从读取 `looptrain.standalone.v1` 改为读取 `lt:save:runtime`；新增 SaveMeta 校验 |
| `saveState()` | 写入改为多 key 拆分（meta + runtime）；key 前缀改为 `lt:save:` |
| `resetGame()` | 升级为调用 `clearLtKeys()` + `initNewSave()`；不依赖旧 `clone(START_STATE)` 逻辑 |
| `init()` | 在 `loadState` 前插入版本检测分支 |

### 5.4 对现有存档 key 的处理

| 旧 key | 处理方式 |
|--------|----------|
| `looptrain.standalone.v1` | 归档到 `lt:legacy:<timestamp>`，然后删除原 key |
| `looptrain.audio.muted` | **保留**，迁移到 `lt:settings`(muted 字段)；旧 key 不删除但新版不再读取 |

## 6. 数据结构设计

### 6.1 SaveMeta

```ts
type SaveMeta = {
  appId: 'looptrain'
  saveSchemaVersion: number       // 存档结构版本，current = 1
  runtimeVersion: string          // Runtime 版本，current = '0.8.0'
  storyVersion: string            // 剧情版本，current = 'demo-0.8-handeng'
  createdAt: string               // ISO 8601
  updatedAt: string               // ISO 8601
}
```

### 6.2 localStorage Key 命名体系

```text
lt:save:meta       → SaveMeta (JSON)
lt:save:runtime    → 完整 state 对象 (JSON)
lt:save:memory     → MemoryRuntime 状态 (JSON, 预留)
lt:save:goals      → GoalEngine 状态 (JSON, 预留)
lt:settings        → 用户设置 (JSON) { muted: boolean }
lt:legacy:<ts>     → 归档的旧数据
```

> 说明：`lt:save:memory` 和 `lt:save:goals` 为 v0.8 后续 IndexedDB 迁移预留。
> 当前阶段 `lt:save:runtime` 包含全部状态；架构上允许后续拆分但前端读取兼容已有结构。

### 6.3 旧 key 清单（需检测的）

| Key | 说明 |
|-----|------|
| `looptrain.standalone.v1` | v0.6–v0.7 旧存档 |

### 6.4 不清除的 key 规则

- 前缀不为 `lt:` 的 key（如 devlog 相关、浏览器扩展）→ **不触碰**。
- `lt:legacy:` 前缀的 key → **不清除**（归档数据永久保留）。
- `lt:settings` → 保留（用户偏好跨版本持续）。

### 6.5 版本常量（定义在 app.js 顶部）

```js
const LT_SAVE_SCHEMA_VERSION = 1;
const LT_MIN_COMPATIBLE_SCHEMA_VERSION = 1;
const LT_RUNTIME_VERSION = '0.8.0';
const LT_STORY_VERSION = 'demo-0.8-handeng';
```

### 6.6 IndexedDB 处理策略

- 新版 MemoryRuntime 数据库名：`LoopTrainMemoryDB_v0_8`。
- 启动时尝试删除旧 DB：`LoopTrainDB`、`LoopTrainRuntimeDB`、`LoopTrainMemoryDB`（无版本号后缀）。
- 删除为异步操作，不阻塞启动。
- 删除失败只打 `console.warn`，不影响游戏流程。

## 7. UI 状态设计

### 7.1 模态框状态

| 状态 | 条件 | 行为 |
|------|------|------|
| 不显示 | 新玩家 / 兼容存档 | 正常启动 |
| 显示（legacy detected） | 存在 `looptrain.standalone.v1` 且无 `lt:save:meta` | 展示"旧存档不兼容"提示 |
| 显示（incompatible version） | `saveSchemaVersion < MIN_COMPATIBLE` 或 `storyVersion !== CURRENT` | 展示"版本不兼容"提示 |
| 已确认 | 玩家点击按钮 | 执行归档+清除+重建，隐藏模态 |

### 7.2 初始加载状态

模态框显示前可能有短暂的"检测中"状态：

- 优先：检测通常在 1–2 帧内完成（纯同步 localStorage 读取），不需要 loading UI。
- 若引入了异步 IndexedDB 检测：显示极简 loading（半透明遮罩 + 游戏 Logo 居中）。超时 3s 自动跳过 IndexedDB 检测，以 localStorage 结果为准。

### 7.3 HTML 结构（最小化）

```html
<div id="lt-reset-modal" class="lt-reset-overlay" style="display:none">
  <div class="lt-reset-card">
    <h2 class="lt-reset-title">新版试玩已重构</h2>
    <p class="lt-reset-body">……</p>
    <button id="lt-reset-confirm" class="lt-btn lt-btn-primary">重新开始</button>
  </div>
</div>
```

CSS 需匹配现有手机端设计系统（参考 `style.css` 中的 `.lt-ng-card`、`.lt-ng-overlay` 样式模式）。

## 8. 指令系统影响

- 现有 `reset_game` 命令（`/reset_loop` 同族）保留，行为升级为：清除 LT 存档 → 重建初始存档 → 刷新页面。UI 上等价于点击「重新开始试玩版」按钮。
- 新增指令 `reset_game` 的确认对话框文案更新为：「确定要重置游戏吗？当前进度将清除。」
- 指令处理器 `handleCommand()` 的 `reset_game` case 无需结构性改动，只替换底层 `resetGame()` 调用。

## 9. GoalEngine 影响

- 无直接影响。GoalEngine 的状态序列化/反序列化路径复用存档版本检测。
- `lt:save:goals` key 预留用于未来 GoalEngine 状态独立持久化。
- 当前阶段 GoalEngine 状态包含在 `lt:save:runtime` 中。

## 10. 兼容性与存档影响

### 10.1 Breaking Change 策略

本次属于 Major/Breaking 级别。不兼容范围覆盖 100% 旧存档。

### 10.2 版本升级分级（长期策略）

| 级别 | 场景 | 处理 |
|------|------|------|
| Patch | UI 修复、文案调整 | 不重置，只更新 `lt:save:meta.updatedAt` |
| Minor | 新增字段、新增 NPC 状态 | 可写 migration，保持兼容 |
| Major/Breaking | 重做剧情、Runtime、目标系统 | 必须重置，弹出提示 |

### 10.3 用户数据影响

- **旧存档不再可用**（语义不兼容，非数据损坏）。
- 旧数据归档到 `lt:legacy:<timestamp>`，开发侧可调试复现。
- 用户设置（静音偏好等）迁移到 `lt:settings`，跨版本保留。
- 非 LT 前缀的 key 完全不受影响。

## 11. 验收标准

- [ ] **AC-1**：新玩家首次进入游戏（无任何 `lt:` 前缀 key 且无 `looptrain.standalone.v1`）→ 正常创建新版存档，不弹出任何重置提示，直接展示 intro overlay。
- [ ] **AC-2**：旧玩家有 `looptrain.standalone.v1` 但无 `lt:save:meta` → 启动时检测到 legacy 数据，弹出「新版试玩已重构」模态框；点击「重新开始」按钮后归档旧数据到 `lt:legacy:<timestamp>`，删除原 key，创建新版存档，进入开场。
- [ ] **AC-3**：玩家有 `lt:save:meta` 但 `storyVersion !== CURRENT_STORY_VERSION` → 弹出版本不兼容提示，强制重置。
- [ ] **AC-4**：玩家有 `lt:save:meta` 且 `saveSchemaVersion >= MIN_COMPATIBLE_SCHEMA_VERSION` 且 `storyVersion === CURRENT_STORY_VERSION` → 不弹提示，正常恢复游戏。
- [ ] **AC-5**：URL 参数 `?reset=1` → 清除当前 LT 存档 → 创建新版初始存档 → 自动跳转到无参数 URL → 展示 intro overlay。
- [ ] **AC-6**：设置页「重新开始试玩版」按钮 → 点击后弹确认对话框 → 确认后清除 LT 存档 → 创建新版初始存档 → 进入 intro。
- [ ] **AC-7**：控制台执行 `window.LT_RESET()` → 清除 LT 存档 → 创建新版初始存档 → 刷新页面（`location.reload()`）。
- [ ] **AC-8**：清除操作**不删除** `lt:legacy:` 前缀的 key（归档数据保留）。
- [ ] **AC-9**：清除操作**不删除**非 `lt:` 前缀的 key（如 `looptrain.audio.muted`、devlog 相关 key、浏览器扩展 key）。
- [ ] **AC-10**：旧 IndexedDB 数据库（`LoopTrainDB`、`LoopTrainRuntimeDB`、`LoopTrainMemoryDB`）在启动时被尝试删除（调用 `window.indexedDB.deleteDatabase()`），删除失败打 `console.warn`，不阻塞游戏启动。
- [ ] **AC-11**：`lt:save:meta` 包含完整 `SaveMeta` 字段（`appId`、`saveSchemaVersion`、`runtimeVersion`、`storyVersion`、`createdAt`、`updatedAt`），且能被 `JSON.parse` 正确解析，所有字段可访问。
- [ ] **AC-12**：三种重置路径（UI 按钮、URL 参数、控制台命令）重置后的初始游戏状态与全新玩家首次进入完全一致（`loops=1`、`clock='14:00'`、`known_clues=['gray_coat_note_pressure']`、`intro_seen=false`）。
- [ ] **AC-13**：模态框不可通过点击遮罩关闭（只能点击按钮）。
- [ ] **AC-14**：`looptrain.audio.muted` 设置值被迁移到 `lt:settings`（`{ muted: boolean }`），静音偏好跨版本保持。

## 12. 风险

1. **旧玩家首次进入看到重置提示，可能困惑** → 文案坦诚清晰，注明"试玩版重构"；试玩版用户对此接受度高于正式版用户。
2. **IndexedDB 删除时机不确定** → 异步删除，不阻塞启动；新版使用新 DB 名天然隔离。
3. **漏掉某个旧 key 前缀导致污染** → 清除逻辑只匹配 `lt:` 前缀且排除 `lt:legacy:`；原有 `looptrain.standalone.v1` 作为显式检测项单独处理。
4. **URL `?reset=1` 参数被误触发**（如书签含参数） → 只在明确 `?reset=1` 时生效，重置后跳转不带参数的 URL（`history.replaceState`）。
5. **`looptrain.audio.muted` 迁移失败** → `lt:settings` 写入为 best-effort；失败时回退读取旧 key，用户静音偏好不丢失。
6. **存档写入 `localStorage` 配额不足** → 旧数据归档可能增加存储占用；归档前检查可用空间，不足时跳过归档直接删除（`console.warn` 记录）。
7. **浏览器隐私模式下 `localStorage` 不可用** → Guard clause：所有 `localStorage` 操作包裹 `try/catch`；不可用时降级为纯内存模式，不影响游戏功能。
