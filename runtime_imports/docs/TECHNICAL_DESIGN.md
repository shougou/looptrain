# LoopTrain-ST 技术设计 v0.1

## 1. 设计目标

在不修改 SillyTavern 核心代码的前提下，为 ST 增加强控制 AI 互动故事能力。

核心架构：

```text
SillyTavern 原生层
  - Character Card
  - World Info / Lorebook
  - Prompt Manager
  - Model Provider
  - Chat History

LoopTrain 外层控制层
  - UI Extension
  - Server Plugin
  - Game State Engine
  - AP System
  - Clue Engine
  - Dialogue Outcome
  - Loop Failure Outcome
```

## 2. 接口兼容原则

- 不覆盖 ST 原接口。
- 不修改 ST 原角色卡字段。
- 不修改 ST 原世界书字段。
- 新增服务接口统一在 `/api/plugins/looptrain/*`。
- 游戏状态优先保存到 `chatMetadata.looptrain`。
- 角色卡游戏字段放在 `data.extensions.looptrain`。
- 世界书游戏字段放在 `extensions.looptrain`。

## 3. 新增 API

```text
GET  /api/plugins/looptrain/health
POST /api/plugins/looptrain/session/init
POST /api/plugins/looptrain/state/normalize
POST /api/plugins/looptrain/action/parse
POST /api/plugins/looptrain/action/commit
POST /api/plugins/looptrain/dialogue/start
POST /api/plugins/looptrain/dialogue/message
POST /api/plugins/looptrain/dialogue/end
POST /api/plugins/looptrain/loop/fail
POST /api/plugins/looptrain/loop/next
```

## 4. 状态设计

```json
{
  "episode_id": "trial_001",
  "mode": "explore",
  "loop": 1,
  "clock": "08:45",
  "ap_remaining": 10,
  "location": "carriage_7",
  "active_npc": null,
  "known_clues": ["gray_coat_note_pressure"],
  "carried_memory": [],
  "npc_states": {
    "xiaoning": { "trust": 20, "fear": 45 },
    "zhao_police": { "trust": 0, "suspicion": 15 },
    "shen_mohan": { "trust": -10, "suspicion": 35 }
  },
  "flags": {
    "zhao_checked_floor": false,
    "trial_success": false,
    "xiaoning_mother_memory_triggered": false
  }
}
```

## 5. 强控制原则

LLM 或 ST 原聊天流不能直接决定：

- 是否获得线索。
- 是否扣除 AP。
- 是否说服赵乘警。
- 是否成功或失败。
- 哪些信息带入下一轮。

这些必须由 LoopTrain Core Engine 统一裁判。

## 6. 当前实现策略

v0.1 暂时使用规则/Mock 引擎生成 NPC 回复，用于验证玩法闭环。

后续接入 LLM 时，推荐流程：

```text
玩家输入
→ Action Parser
→ State Check
→ Prompt Builder
→ LLM 表演
→ Response Validator
→ Outcome Engine
→ State Commit
```

## 7. 安全边界

Server Plugin 不应执行用户上传脚本。
Story Package 第一阶段只允许：

```text
JSON
Markdown
图片
音频
```

规则表达式应使用白名单 DSL，不允许任意 JavaScript。
