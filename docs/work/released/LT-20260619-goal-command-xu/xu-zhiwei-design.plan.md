# 许知微 角色综合设计方案

**版本**: v1.0-draft  
**日期**: 2026-06-19  
**状态**: 设计文档 — 待讨论确认  
**复杂度**: Large（跨引擎/内容/UX 三层设计）

---

## 零、设计原则

1. **陌生人原则**：防剧透不在 prompt 里说"别说"，而是让 LLM 从根本上不知道。CompanionView 中 `hiddenTruthAccessible` 始终 `false`。
2. **记忆伙伴，非攻略者**：帮助玩家记住经历过什么，不替玩家理解真相。
3. **中存在策略**：早期存在强度"中存在"——有用，能力受限，不喧宾夺主。
4. **三层身份**：表层（年轻记者）→ 功能层（记忆系统外显）→ 隐藏层（Runtime 人格化）。公开只暴露表层。

---

## 一、角色定义

### 1.1 表层身份（对玩家公开）

> 许知微，23 岁，重庆《渝江日报》见习记者。随身携带牛皮笔记本和磨得发亮的钢笔。观察敏锐，好奇心强，擅长记录细节。说话温和但不怯弱，有时坦率承认自己判断错了。不强势——更像一个帮你整理笔记的同伴，而非指路向导。

叙事定位：她也是乘客，和玩家一样被困在列车上。不知道炸弹在哪，不知道谁是敌人。记者本能让她天然想"记录发生了什么"。她不是"系统 UI"，而是游戏世界里的一个角色。

### 1.2 功能身份：MemoryRuntime 的人格化外显

| MemoryRuntime 层 | 许知微的表达 |
|---|---|
| Event Log | "我们之前做过这些事……" |
| Knowledge | "目前能确认的是……" |
| Belief | "我有个感觉，但这还不是证据……" |
| Timeline | "上一轮我们发现了……这次可以试试不同方向" |
| Archive | "这些信息我们一直带着，也许这次用得上" |

### 1.3 与其他 NPC 的本质区别

| 维度 | 小宁/赵乘警/沈墨寒 | 许知微 |
|------|-------------------|--------|
| 信息源 | Engine 预设的对话树 | MemoryRuntime 实时数据 |
| 对循环的感知 | 无（每轮重置） | 有（通过 Timeline/Archive） |
| 对话方式 | 选模板 → NPC 回应 | 自由输入 → 角色化整理 |
| 主动行为 | 无 | 低频主动提醒 |
| 实现方式 | engine.js 硬编码 → 已外置 JSON | CompanionRuntime + LLM(可选) |

---

## 二、技术架构

### 2.1 数据流

```
Engine → MemoryRuntime → CompanionViewBuilder → CompanionView
                                                      ↓
                                               CompanionRuntime
                                                      ↓
                                              CompanionOutput
                                                      ↓
                                                   UI
```

### 2.2 新模块：`src/runtime/companion/`

```
src/runtime/companion/
  CompanionRuntime.ts          # 核心：CompanionView → CompanionOutput
  CompanionPromptBuilder.ts    # LLM prompt 构建（仅润色，不决策）
  CompanionTriggerEngine.ts    # 主动触发决策
  CompanionMemoryFormatter.ts  # MemoryRuntime 数据 → 叙事文本
  CompanionTonePolicy.ts       # 语气约束
  CompanionOutputValidator.ts  # 输出安全检查
  index.ts
```

### 2.3 CompanionOutput Schema

```ts
interface CompanionOutput {
  mode: 'summary' | 'timeline' | 'belief' | 'hint' | 'chat';
  reply: string;
  usedKnowledgeIds: string[];
  usedBeliefIds: string[];
  suggestedActions: Array<{ actionId: string; label: string; hintLevel: 0|1|2 }>;
  beliefSuggestions: Array<{ target: string; statement: string; status: 'unconfirmed' }>;
  safety: { spoilerRisk: 'low'|'medium'|'high'; containsLockedFact: boolean; attemptsActionExecution: boolean };
}
```

硬规则：不能写入 MemoryRuntime · beliefSuggestions 进待审核区 · suggestedActions 只展示不执行 · hintLevel 早期 ≤ 1

---

## 三、内容设计

### 3.1 角色 Profile 和对话模板

新增内容文件：
- `materials/runtime/characters/xu-zhiwei.json` — 角色 Profile（身份、性格、首次见面台词）
- `materials/runtime/dialogues/xu-zhiwei-dialogue.json` — 按意图分类的对话模板

**对话示例**：

| 意图 | 示例 |
|------|------|
| 首次接触 | "你注意到我了？我叫许知微，报社的。习惯记东西——这趟车不太对劲，我想你也有同感。" |
| 线索汇总 | "目前能确认的是：小宁听到过滴答声；声音不来自座位下方。你现在似乎也在怀疑赵乘警，但这还只是推测。" |
| 新循环 | "又回到 08:45 了。别急——至少我们记得地板下面确实有东西。这次换个角度试试？" |
| 停滞提示 | "要不要先把现在知道的事整理一下？有时候写下来会更清楚。" |

**禁止模式**：直接攻略（"你应该去找赵乘警"）、谜底揭露、命令语气、绝对化断言

### 3.2 主动触发条件

| 触发 | 条件 | 频率限制 |
|------|------|:---:|
| 新线索 | 获得 confirmed clue | 每条线索 1 次 |
| 新循环 | loop reset | 每次循环开始 |
| 玩家停滞 | 连续 3 次无效行动 | 每循环 ≤ 2 次 |
| Belief 冲突 | 推测与事实矛盾 | 无额外限制 |

---

## 四、UX/UI 设计

### 4.1 交互升级路径

| 当前 (v0.6) | 目标 (v0.7) |
|---|---|
| 按钮：**询问助手** | 按钮：**询问许知微** |
| 点击 → 技术面板 | 点击 → 对话式面板 |
| 模板文本 | 角色化语言 |
| 被动响应 | 主动触发（低频轻提示） |

### 4.2 主动提醒 UI（轻量，不打断）

```
┌──────────────────────────────┐
│  💬 许知微似乎想说什么……      │  ← 顶部轻提示
│  [点击查看]                   │
└──────────────────────────────┘
```

### 4.3 面板状态

| 状态 | 触发 | UI |
|------|------|----|
| `collapsed` | 默认 | 只显示按钮 |
| `expanded` | 玩家点击 | 完整对话面板 |
| `hint` | 主动触发 | 轻提示 + 按钮高亮 |

---

## 五、分阶段实现

### Phase 1: Record Companion（v0.7 早期）— **当前可立即开始**

前置：MemoryRuntime ✅ · CompanionView ✅ · FallbackTemplateEngine ✅

能力：总结线索/NPC/Belief · 低频提示 · **无 LLM（纯模板）**

### Phase 2: Memory Interface（v0.7 中期）

前置：Timeline/Archive/Reset 稳定

能力：跨循环对比 · Archive 引用 · LLM 润色（可选）

### Phase 3: Collaborative Actor（v0.8+）

前置：Relationship + Companion Action Runtime 成熟

能力：有限行动（询问/观察/拖延/整理）

---

## 六、依赖与风险

| 依赖 | 状态 |
|------|:---:|
| MemoryRuntime | ✅ 完成 |
| CompanionView | ✅ 完成 |
| CompanionView schema v1 批准 | ⬜ 待确认 |
| CompanionOutput schema v1 批准 | ⬜ 待确认 |
| Prompt safety tests (6场景) | ⬜ 待编写 |
| 人类明确批准 | ⬜ 待确认 |

| 风险 | 程度 | 缓解 |
|------|:---:|------|
| LLM 泄露 hidden truth | HIGH | CompanionView 结构排除 |
| 过早给攻略建议 | MEDIUM | hintLevel 锁定 + tone policy |
| 主动提醒打断体验 | LOW | 轻提示而非弹窗 |

---

## 七、待讨论决策

1. **实现时机**：现在立即开始 Phase 1（纯模板，无 LLM），还是等全部条件满足？
2. **LLM 接入**：Phase 1 完全不用 LLM，还是允许 LLM 润色表达？
3. **主动触发**：Phase 1 就实现，还是推迟？
4. **UI 改造**：按钮改名时机？

---

**状态**: ⏳ 待讨论确认
