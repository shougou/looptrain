# 游戏指令系统设计方案

**关联**: 许知微设计方案（方案 B）  
**复杂度**: Medium  
**状态**: ⏳ 待讨论确认

---

## 一、现状

### 问题

- 指令硬编码在 `app.js` 的 `isCommand()` + `handleCommand()` 中（regex if/else）
- 帮助文本只靠输入"帮助"才能看到
- v0.6 MemoryRuntime 新增能力（查看记忆/时间线/推测）无对应指令

### v0.6 已支撑的新指令

| 新指令 | 数据来源 | 当前状态 |
|--------|---------|:---:|
| 查看记忆 | Timeline Store | ❌ |
| 查看时间线 | Timeline Store | ❌ |
| 查看推测 | Belief Store | ❌ |

---

## 二、设计

### 2.1 指令注册表（CommandRegistry JSON）

统一管理所有指令，放在 `materials/runtime/commands/command-registry.json`：

10 条指令，4 个分类：

| 类别 | 颜色 | 指令 |
|------|------|------|
| `information` | 蓝色 | 查看线索、查看人物、查看状态 |
| `memory` | 紫色 | 查看记忆、查看时间线、查看推测 |
| `action` | 金色 | 结束对话、进入下一轮、重置游戏 |
| `interaction` | 绿色 | 询问许知微 |

每条指令定义：`id`, `trigger[]`(匹配词), `category`, `label`, `description`, `availableWhen`(条件), `xuExplanation`(许知微的解释文本), `tutorial`(新手引导)。

### 2.2 架构：许知微 + 指令系统

```
CommandRegistry (JSON)
  ↓ 加载
AssistantController / CompanionRuntime
  ↓ 许知微解释指令用途、推荐使用场景
  ↓ 不执行指令
玩家输入指令
  ↓
app.js → CommandMatcher → 执行
```

**职责分离**：许知微（解释者）→ 玩家（决定者）→ Engine（裁判者）

### 2.3 UX/UI

#### 指令快捷面板（底部新增第三个 tab）

```
[对话] [行动] [⚡指令]
─────────────────────
📋线索  👤人物  🧠记忆  ⏱时间线
推测    ⚙重置  ❓帮助
─────────────────────
[________________] [发送]
```

点击快捷按钮填充输入框，也可直接输入指令。

#### 许知微指令面板（输入"帮助"或点击推荐时触发）

```
┌──────────────────────────┐
│  许知微                   │
│  "你可以随时使用这些指令"   │
│                           │
│  📋 信息查询               │
│  查看线索 · 查看人物 · 状态  │
│                           │
│  🧠 记忆系统 (v0.6)        │
│  查看记忆 · 时间线 · 推测    │
│                           │
│  ⚡ 行动指令               │
│  结束对话 · 下一轮 · 重置    │
└──────────────────────────┘
```

#### 许知微主动引导时机

| 触发 | 提示 |
|------|------|
| 首次获得线索 | "输入'查看线索'可以随时回顾。要我帮你整理吗？" |
| 首次进入第 2 轮 | "你现在可以输入'查看记忆'来回顾上一轮的信息。" |
| 3 次无效行动 | "要不试试输入'帮助'？看看有什么可以做的。" |

---

## 三、实现计划

### Phase 1: 指令注册表 + 引擎
- 创建 `command-registry.json`（10 条指令）
- `src/runtime/command/CommandRegistry.ts`（加载 + 查询）
- `src/runtime/command/CommandMatcher.ts`（输入 → 指令 ID）
- engine.js `getAvailableCommands(state)` 返回当前可用指令
- 输出到 `dist/runtime/`，`index.ts` 导出

### Phase 2: 前端重构
- app.js `handleCommand()` 改用 CommandRegistry 匹配
- 新增指令快捷面板（第三个 tab）
- "帮助"触发许知微指令面板
- `/api/commands` 端点

### Phase 3: 许知微集成
- CompanionRuntime 新增 `explainCommands()` 方法
- 许知微对话模板新增"指令解释"意图
- 主动触发：首次线索后提示

### Phase 4: 内存指令实现
- 实现"查看记忆/时间线/推测"指令（读 MemoryRuntime stores）

---

## 四、验证与风险

验证：`npm run build:runtime` + `npm run test:runtime` + `npm run test:standalone`

| 风险 | 缓解 |
|------|------|
| 与现有 parseAction 冲突 | CommandRegistry 处理系统指令，parseAction 处理探索行动，路径不同 |
| 快捷面板占用空间 | 可选 tab，默认隐藏 |
| 新指令依赖 MemoryRuntime | Phase 4 依赖 Slice 1 完成（✅ 已满足） |

---

**状态**: ⏳ 待确认
