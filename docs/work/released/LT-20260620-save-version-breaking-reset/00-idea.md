---
status: active
type: feature
priority: P0
topic: save-version-breaking-reset
created: 2026-06-20
updated: 2026-06-20
owner: shougou
target_release: v0.7-testplay
decision: accepted-for-spec
---

# Idea: 存档版本检测与 Breaking Change 强制重置

> P0 项：0.7 试玩版上线前必须完成。
> 本次不是普通版本升级，而是剧情、人物、Runtime、记忆结构、目标系统的全面重构。
> 旧存档与新系统语义不一致，不做兼容迁移，直接强制新开局。

## 背景

LoopTrain 0.7 试玩版是一次全面重构：

| 维度 | 旧版 | 新版 |
|------|------|------|
| 剧情 | 旧列车结构、炸弹线索 | 寒灯初醒、新时间线 |
| 人物 | 小宁、旧助手 | 许知微主动引导 |
| Runtime | 旧状态机 | MemoryRuntime + GoalEngine |
| 目标系统 | 旧目标结构 | 结构化 GoalEngine |
| 指令系统 | 旧指令 | 结构化 Action |
| 记忆结构 | 旧 dialogueHistory | 结构化 Clue / Fact / Event |

如果旧玩家的浏览器存档被新版 Runtime 直接读取，会导致：

- 目标错乱（旧目标 ID 不存在于新剧情）
- NPC 不存在（旧 NPC ID 被移除或改名）
- 无法推进（旧场景、旧线索在新版中无对应逻辑）
- 开场不触发（旧状态跳过了新版开场流程）
- 玩家遇到莫名其妙的状态错误

这不是字段改名，而是底层语义改变。迁移成本高、收益低、风险大。

## 目标

1. **存档版本化**：给所有游戏存档增加 metadata（schemaVersion / runtimeVersion / storyVersion）。
2. **不兼容检测**：启动时检测旧浏览器数据，判定不兼容则**不进入旧 Runtime**。
3. **强制新开局**：检测到 breaking change 后，自动隔离旧数据并创建新版初始存档。
4. **用户提示**：坦诚告知玩家"新版试玩已重构，旧存档不兼容"，而非"存档损坏"。
5. **数据安全**：只清理 LT 游戏相关 key，不清空整个 localStorage；旧数据归档保留（开发侧）。
6. **手动重置入口**：提供 UI 按钮、URL 参数、开发者控制台三种重置方式。
7. **IndexedDB 兼容**：如果 MemoryRuntime 使用 IndexedDB，确保旧 DB 不污染新版。

## 非目标

1. **不做旧数据迁移**：本次定义为 breaking save change，不写任何 migration 逻辑。
2. **不做版本兼容降级**：不支持从新版回退到旧版。
3. **不改 Service Worker / PWA 缓存策略**（如果没有 PWA，则不在本次范围内；有则作为上线 checklist 一项）。
4. **不做多存档槽位**：试玩版始终只有一个当前存档。
5. **不做云存档 / 跨设备同步**。

## 初步想法

### 核心策略

```text
版本检测 + 旧数据隔离 + 强制新开局 + 手动重置入口
```

### Save Meta 结构

```ts
type SaveMeta = {
  appId: 'looptrain'
  saveSchemaVersion: number      // 存档结构版本
  runtimeVersion: string         // Runtime 版本
  storyVersion: string           // 剧情版本
  createdAt: string
  updatedAt: string
}
```

### 当前版本常量（0.7）

- `CURRENT_SAVE_SCHEMA_VERSION = 3`
- `MIN_COMPATIBLE_SAVE_SCHEMA_VERSION = 3`
- `CURRENT_RUNTIME_VERSION = '0.7.0'`
- `CURRENT_STORY_VERSION = 'demo-0.7-handeng'`

### 启动判断流程

```text
没有存档
  → 创建新存档

有存档，但 saveSchemaVersion 不兼容
  → 旧存档隔离 / 删除
  → 弹提示
  → 创建新存档

有存档，但 storyVersion 不一致
  → 强制重新开始

有存档，且版本兼容
  → 正常恢复
```

### 旧数据处理

采用"开发上归档，玩家体验上直接重新开始"：

- 旧数据移入 `lt:legacy:<timestamp>` key 归档
- 新版完全不读取 legacy key
- UI 不展示旧存档入口
- 不清空整个 localStorage（避免误删 devlog 设置、主题等）

### 存储 key 前缀规范

所有游戏 key 统一 `lt:` 前缀：

```text
lt:save:meta
lt:save:runtime
lt:save:memory
lt:save:goals
lt:settings
lt:legacy:<timestamp>
```

删除时只匹配 `lt:` 前缀（排除 `lt:legacy:`）。

### 手动重置三入口

1. **UI 按钮**：设置/帮助中"重新开始试玩版"
2. **URL 参数**：`?reset=1`
3. **开发者命令**：`window.LT_RESET()`

### IndexedDB 处理

- 新版换 DB 名：`LoopTrainDB_0_7`
- 启动时尝试删除旧 DB（`LoopTrainDB`、`LoopTrainRuntimeDB` 等）
- 删除失败不阻塞启动，只打 warn log

### 版本升级策略（长期）

| 级别 | 场景 | 处理 |
|------|------|------|
| Patch | UI 修复、文案调整 | 不重置 |
| Minor | 新增字段、新增 NPC 状态 | 可写 migration |
| Major/Breaking | 重做剧情、Runtime、目标系统 | 必须重置 |

本次属于 Major/Breaking。

## 风险

1. **旧玩家首次进入看到重置提示，可能困惑** → 文案需坦诚清晰，试玩版用户对此接受度高。
2. **IndexedDB 删除时机不确定** → 异步删除，不阻塞启动；新版使用新 DB 名天然隔离。
3. **漏掉某个旧 key 前缀导致污染** → 启动时做全量扫描，按前缀批量清理；同时新版使用全新 `lt:save:` 前缀体系。
4. **URL reset 参数被误触发** → 只在明确 `?reset=1` 时生效，且重置后跳转不带参数的 URL。

## 讨论记录

- 2026-06-20：确认采用 breaking change 策略，不做旧数据迁移；归档保留旧数据便于调试；UI 只展示单一主按钮减少用户犹豫。
