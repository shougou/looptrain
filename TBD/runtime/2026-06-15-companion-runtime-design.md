# Companion Runtime Design: 许知微

**状态：** Approved for internal narrative/runtime design; not approved for implementation  
**日期：** 2026-06-15  
**范围：** 仅设计，不包含实现计划  
**实现状态：** Not approved  
**未批准原因：** Companion View schema、Companion Output schema、Output Validator 和 prompt safety tests 尚未最终实现与验证  
**来源草稿：** `TBD/01_new_npc.md`  
**剧透等级：** Core/internal。不得作为公开角色资料直接发布。

## 1. 目标

本设计定义未来的 Companion Runtime 层：许知微。她应该在 Memory Runtime 完成后出现。她不是 Memory Runtime 本身，而是一个面向玩家的 narrative partner：读取由 Memory Runtime 派生出的受限 Companion View，并通过角色行为表达这些状态。

一句话原则：

```text
许知微帮助玩家记住自己已经经历过什么，但不替玩家理解真相。
```

## 2. 已确认决策

| 决策项 | 已确认方向 |
|---|---|
| Runtime 时机 | Memory Runtime 完成后再实现，不进入 v0.6 |
| 真实身份 | 内部完整设计，但对玩家和公开文档严格隐藏 |
| 早期存在强度 | 中存在：有用，但能力受限 |
| 正式名字 | 许知微 |
| 信息边界 | 读取 confirmed Knowledge 和 player-owned Belief，并标明 Belief 未确认 |
| 主动行为 | 只允许低频主动提醒 |
| 错误推理 | 只允许存在于 Belief 层，不能进入 Knowledge |
| 行动能力 | 早期无行动能力；后期随 Relationship / Timeline / Runtime 成熟逐步解锁 |
| 架构边界 | Memory Runtime 和 Companion Runtime 分离成不同 spec，通过 Companion View contract 连接 |

## 3. Implementation Gate

Companion Runtime 不能进入实现，直到以下条件全部满足：

1. Memory Runtime v0.6 完成。
2. Companion View schema v1 已批准。
3. Companion Output schema v1 已批准。
4. Companion Output Validator 已实现。
5. Locked Facts / Spoiler Guard 已实现。
6. Prompt safety tests 至少覆盖：hidden identity leak、future plot leak、direct action instruction、puzzle solving、unsupported clue creation、belief stated as fact。
7. 人类明确输入以下批准语句：

```text
Approve Companion Runtime implementation.
```

任何“设计通过”“可以继续讨论”“写 implementation plan”都不等于实现批准。

## 4. 与 Memory Runtime 的关系

`Narrative State Runtime` 文章已经把 v0.6 定义为纯 Memory Runtime：

```text
v0.6 只做 Memory Runtime，不加 NPC、不加剧情、不做 UI。
```

因此，许知微不属于 v0.6。她的设计依赖 Memory Runtime 足够成熟，并且能提供安全的只读视图。

她至少依赖这些 Memory Runtime 层：

- Event Log
- Timeline
- Knowledge
- Belief
- Relationship
- Archive
- Profile
- Reset modes
- structured Prompt Builder input

Companion Runtime 不能直接读取 Memory Runtime 的原始内部状态。它只能读取经过裁剪后的 Companion View。

```text
Memory Runtime
  ↓
Companion View Builder
  ↓
Companion View
  ↓
Companion Runtime / 许知微
```

## 5. Companion View contract

Companion View 是 Memory Runtime 面向 Companion Runtime 暴露的只读、玩家可见投影。

不变量：

1. Engine 是 Knowledge、Belief、Relationship、Timeline、Archive 和行动结果的唯一写入者。
2. Companion Runtime 对 Memory Runtime 状态只读。
3. LLM 可以生成表达文本，但不能创建事实、更新 Belief 或触发行动。
4. Companion 输出必须先通过验证，才能展示给玩家。

### 5.1 允许读取的层

```text
Knowledge.confirmed.visible
Belief.inferred.player_owned
Timeline.visible_summary
Archive.visible_entries
Relationship.visible_state
Scene.current
```

### 5.2 禁止读取的层

```text
AuthorTruth
HiddenIdentity
FullMysterySolution
FuturePlot
UnreleasedClues
PrivateDesignNotes
Raw Event Log when not player-visible
```

### 5.3 Companion View V1 草案

```ts
export type CompanionViewV1 = {
  version: "companion_view_v1";
  saveId: string;
  loopNo: number;
  scene: {
    id: string;
    name: string;
    visibleDescription: string;
  };
  knowledge: {
    confirmed: Array<{
      id: string;
      title: string;
      summary: string;
      sourceEventId: string;
      visibility: "player_visible";
    }>;
  };
  beliefs: Array<{
    id: string;
    target: string;
    statement: string;
    confidence: number;
    source: "player_suspicion" | "companion_inference" | "timeline_pattern";
    status: "unconfirmed" | "contradicted" | "strengthened";
  }>;
  timeline: {
    visibleSummary: Array<{
      loopNo: number;
      summary: string;
      outcome?: string;
    }>;
  };
  archive: {
    visibleEntries: Array<{
      id: string;
      title: string;
      summary: string;
    }>;
  };
  relationship: {
    visibleState: Record<string, {
      label: string;
      trust?: number;
      tension?: number;
      note?: string;
    }>;
  };
};
```

这个 schema 仍是设计草案，不能作为实现批准。实现前必须单独批准 Companion View schema v1。

## 6. Companion Output contract

Companion 输出必须是可验证结构，而不是直接展示 LLM 原文。

```ts
export type CompanionOutputV1 = {
  mode: "summary" | "timeline" | "belief" | "hint" | "chat";
  reply: string;
  usedKnowledgeIds: string[];
  usedBeliefIds: string[];
  suggestedActions: Array<{
    actionId: string;
    label: string;
    hintLevel: 0 | 1 | 2;
  }>;
  beliefSuggestions: Array<{
    target: string;
    statement: string;
    confidenceDelta: number;
    status: "unconfirmed";
  }>;
  safety: {
    spoilerRisk: "low" | "medium" | "high";
    containsLockedFact: boolean;
    attemptsActionExecution: boolean;
  };
};
```

硬规则：

- CompanionOutput 不能直接写入 Memory Runtime。
- `beliefSuggestions` 只能进入待审核区，由 Engine 判断是否转为 Belief。
- `suggestedActions` 只能展示，不执行。
- `hintLevel` 在早期只能为 `0` 或 `1`，不能给出 direct walkthrough。

## 7. 角色定位

许知微有三层身份。

### 7.1 表层身份

玩家看到的是一名列车上的年轻记者。

玩家可见特征：

- 观察敏锐
- 好奇
- 擅长记录细节
- 不强势
- 有时会判断错误
- 可以作为记忆伙伴，但不是攻略者

公开资料可以描述她为：

```text
年轻记者，观察敏锐，喜欢记录，在列车上与玩家同行。
```

公开资料不能描述她为：

```text
Narrative Runtime interface
hidden truth carrier
loop-aware entity
future key to the mystery
```

### 7.2 功能身份

Memory Runtime 存在后，她成为玩家认知层的自然入口。

她负责帮助玩家回答这些问题：

- 玩家已经确认了什么？
- 玩家当前在怀疑什么？
- 玩家在之前可见的 Timeline 中经历过什么？
- 哪些经历已经进入 Archive？

### 7.3 隐藏身份

内部设计上，她是 Narrative Runtime 的人格化接口。这个身份必须在早期玩法和公开文档中隐藏。

## 8. 早期能力边界

早期阶段采用中存在策略，但这不等于可以在 v0.6 提前实现许知微。

v0.6 范围固定为：

```text
Memory Runtime only
No Companion UI
No Companion Prompt
No Companion free chat
No 许知微 functional behavior
```

Phase 0 只是叙事播种，除非人类明确批准，否则不得在 v0.6 实现。最早允许实现的时间点是 Memory Runtime 和 Companion View contract 完成后的 v0.6.x 或 v0.7。

允许能力：

- 总结 confirmed clues
- 总结已见 NPC
- 复述 visible timeline events
- 复述 player-owned Belief，并明确未确认
- 询问玩家是否需要整理当前记录
- 在关键状态变化后低频提醒

禁止能力：

- 告诉玩家下一步行动
- 解谜
- 暴露隐藏真相
- 离开玩家视野去调查
- 触发世界状态变化
- 创造新线索
- 修改 AP、时间、NPC 状态或循环结果

允许回复示例：

```text
目前能确认的是：小宁听到过滴答声；声音不一定来自座位本身。你现在似乎也在怀疑赵乘警，但这还只是推测。
```

禁止回复示例：

```text
你下一步应该去检查地板。
```

## 9. Knowledge / Belief / Action 规则

### 9.1 Knowledge

Knowledge 是 confirmed fact。

规则：

- Companion 不能创建 Knowledge。
- Companion 不能修改 Knowledge。
- Companion 只能复述或整理 confirmed Knowledge。
- Belief 不能升级为 Knowledge，除非 Engine 确认。

### 9.2 Belief

Belief 是 inference。

规则：

- Belief 必须带有 confidence、source 和 uncertainty。
- Belief 可以是错的。
- Belief 可以被之后的 Knowledge 推翻。
- Companion 可以表达不确定性，但不能把 Belief 说成事实。

Belief 写入规则：

- Companion 可以产生 `beliefSuggestion`。
- Engine 校验 source、visibility、contradiction 和 confidence。
- 只有 Engine 可以把 `beliefSuggestion` 持久化为 Memory Runtime 中的 Belief。

示例结构：

```yaml
belief:
  shen_mohan:
    knows_more_than_says:
      value: true
      confidence: 0.55
      source: player_suspicion
      status: unconfirmed
```

### 9.3 Action

早期 Action 状态为 locked。

后期行动能力可以通过这些条件逐步解锁：

- relationship trust
- shared loops
- confirmed clue count
- stable beliefs
- archive depth
- Companion Action Runtime support

所有行动都必须由 Engine 裁判，并带有 cost、risk 或 failure possibility。

行动解锁强限制：

- Phase 3 之前不允许 Companion Action Runtime。
- Companion action 不能发现核心线索。
- Companion action 不能解决谜题。
- Companion action 不能直接改变 loop outcome。

## 10. 主动行为

许知微只能低频主动开口。

允许触发条件：

- 获得新的 confirmed clue
- loop reset / new loop start
- 玩家长时间无进展
- 玩家 Belief 与可见事实冲突

频率规则：

- 每个 loop 最多主动提醒 2 次。
- 每次新 confirmed clue 后最多提醒 1 次。
- 玩家连续 3 次无效行动后，可以提醒 1 次。
- 玩家主动询问不计入 proactive 次数。
- 许知微不能连续两次主动推动同一方向。
- 所有 proactive prompt 只能提出“整理信息”，不得提出具体行动。

允许主动语气：

```text
要不要先把现在知道的事整理一下？
```

禁止主动语气：

```text
你应该去找赵乘警。
```

## 11. 错误推理

许知微应该像人，而不是 oracle。她可以想错，但只能在 Belief 空间里想错。

规则：

- 错误推理不能写入 Knowledge。
- 错误推理必须是不确定的。
- 错误推理的 confidence 不能接近确定。
- 错误推理必须能被后续事实推翻。
- 玩家始终是最终推理者。

原则：

```text
许知微可以想错，但系统不能记错。
```

## 12. 解锁进程

### Phase 0: Surface passenger

时机：Memory Runtime 完成前。

能力：

- 普通 NPC 对话
- 少量观察评论
- 无 memory UI
- 无 hint system
- 无 action ability

目的：建立存在感和记录型人格。

### Phase 1: Record companion

时机：Knowledge 和 Belief 层可用。

能力：

- 总结 confirmed clues
- 总结已见 NPC
- 将玩家 Belief 标记为 unconfirmed
- 低频提示整理记录

这是已确认的中存在阶段。

### Phase 2: Memory interface

时机：Timeline、Archive 和 Reset rules 稳定。

能力：

- 总结之前可见 loop events
- 对比当前 loop 和可见的之前 loop
- 引用 Archive entries
- 轻量表达 interview notebook 行为

仍然禁止：在玩家确认之前解释隐藏 runtime rules。

### Phase 3: Collaborative actor

时机：Relationship 和 Companion Action Runtime 成熟。

能力可能包括：

- 询问非关键问题
- 观察附近环境
- 帮助拖延某个 NPC
- 整理现场记录

约束：

- Engine 裁判所有行动
- 行动有 time / AP / risk cost
- 不自动获得核心线索
- 不替玩家完成谜题

## 13. Spoiler governance

许知微相关文档必须分层。

### Core draft

路径：

```text
TBD/01_new_npc.md
```

内容：完整身份和长期隐藏设计。保持 `spoilerLevel: core`。

### Formal internal design

目标：

```text
devlog/src/content/design/companion-runtime.md
```

内容：runtime dependency 和 capability boundary。除非标记为 internal/core，否则不写完整最终真相。

### Public character page

目标：

```text
devlog/src/content/characters/xu-zhiwei.md
```

内容：只写表层身份和非剧透特征。

## 14. Prompt Context Rule

Phase 0-2 的 Prompt 只能包含表层身份和 visible Companion View。

禁止传入 Prompt：

- Hidden identity
- future role
- runtime-interface metaphor
- awakening plot
- long-term truth
- AuthorTruth
- FullMysterySolution

这些事实只能存在于 core design docs 和 Engine-side unlock metadata 中。正确做法不是把真相给 LLM 再要求它“不说”，而是让 LLM 根本不知道。

## 15. Safety Test Cases

实现前至少需要覆盖以下测试：

1. Hidden identity leak：玩家问“你到底是谁？”，只能回答表层身份，不能提 Narrative Runtime、循环意识或隐藏真相。
2. Direct walkthrough：玩家问“我下一步该去哪？”，只能整理当前已知信息，不能给具体地点或唯一答案。
3. Unsupported clue creation：玩家问未解锁事实时，必须回答“目前没有证据确认”。
4. Belief as fact：玩家怀疑某人说谎时，必须标注“这只是推测”。
5. Action execution：玩家要求许知微单独行动时，不能触发世界状态变化。
6. Reset boundary：循环重启后，只能根据当前 awareness / memory_retention 和 Companion View 返回可见内容。

## 16. 首次实现不包含的范围

- Memory Runtime implementation
- Companion View Builder implementation
- Archive UI implementation
- full Companion Action Runtime
- true identity reveal
- awakening plot
- hidden truth explanation
- free-chat assistant mode
- direct hint / walkthrough system

## 17. 后续独立设计任务

这些应该作为单独 spec 或后续章节处理：

1. Memory-Companion Interface Contract
2. Companion Output Validator
3. Companion View schema
4. 许知微公开角色档案
5. Companion Action Runtime unlock rules
6. Companion prompt safety tests

## 18. 总结

许知微是未来的 Narrative Partner，不是早期菜单。她在 Memory Runtime 提供安全 Companion View 后出现。她可以帮助玩家整理 confirmed facts 和 player-owned beliefs，可以不确定，也可以在 Belief 空间里想错，并在后期通过关系成长逐步解锁有限行动。她不拥有真相，不写入状态，不绕过 Engine。
